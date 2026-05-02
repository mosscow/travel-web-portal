package com.mp3editor.app.ui.browser

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.LiveData
import androidx.lifecycle.MutableLiveData
import androidx.lifecycle.viewModelScope
import com.mp3editor.app.data.Mp3File
import com.mp3editor.app.util.Mp3Utils
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

enum class SortOrder { NAME, DATE, SIZE }

class FileBrowserViewModel(application: Application) : AndroidViewModel(application) {

    private val _files = MutableLiveData<List<Mp3File>>(emptyList())
    val files: LiveData<List<Mp3File>> = _files

    private val _isLoading = MutableLiveData(false)
    val isLoading: LiveData<Boolean> = _isLoading

    private val _error = MutableLiveData<String?>(null)
    val error: LiveData<String?> = _error

    private var allFiles: List<Mp3File> = emptyList()
    private var searchQuery: String = ""
    private var sortOrder: SortOrder = SortOrder.NAME

    fun loadFiles() {
        viewModelScope.launch {
            _isLoading.value = true
            _error.value = null
            try {
                allFiles = withContext(Dispatchers.IO) {
                    Mp3Utils.scanMp3Files(getApplication())
                }
                applyFilters()
            } catch (e: Exception) {
                _error.value = e.message
            } finally {
                _isLoading.value = false
            }
        }
    }

    fun setSearchQuery(query: String) {
        searchQuery = query
        applyFilters()
    }

    fun setSortOrder(order: SortOrder) {
        sortOrder = order
        applyFilters()
    }

    fun deleteFile(mp3File: Mp3File): Boolean {
        val deleted = java.io.File(mp3File.path).delete()
        if (deleted) {
            allFiles = allFiles.filter { it.path != mp3File.path }
            applyFilters()
        }
        return deleted
    }

    fun renameFile(mp3File: Mp3File, newName: String): Boolean {
        val oldFile = java.io.File(mp3File.path)
        val newFile = java.io.File(oldFile.parent, "$newName.mp3")
        val renamed = oldFile.renameTo(newFile)
        if (renamed) {
            allFiles = allFiles.map {
                if (it.path == mp3File.path) it.copy(path = newFile.absolutePath, name = newFile.name)
                else it
            }
            applyFilters()
        }
        return renamed
    }

    private fun applyFilters() {
        var result = allFiles
        if (searchQuery.isNotBlank()) {
            val q = searchQuery.lowercase()
            result = result.filter {
                it.name.lowercase().contains(q) ||
                it.title?.lowercase()?.contains(q) == true ||
                it.artist?.lowercase()?.contains(q) == true ||
                it.album?.lowercase()?.contains(q) == true
            }
        }
        result = when (sortOrder) {
            SortOrder.NAME -> result.sortedBy { it.name.lowercase() }
            SortOrder.DATE -> result.sortedByDescending { it.lastModified }
            SortOrder.SIZE -> result.sortedByDescending { it.size }
        }
        _files.value = result
    }
}
