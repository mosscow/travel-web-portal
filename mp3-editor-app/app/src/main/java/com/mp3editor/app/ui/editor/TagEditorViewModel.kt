package com.mp3editor.app.ui.editor

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.LiveData
import androidx.lifecycle.MutableLiveData
import androidx.lifecycle.viewModelScope
import com.mp3editor.app.data.TagData
import com.mp3editor.app.util.Mp3Utils
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

class TagEditorViewModel(application: Application) : AndroidViewModel(application) {

    private val _tags = MutableLiveData<TagData>()
    val tags: LiveData<TagData> = _tags

    private val _isSaving = MutableLiveData(false)
    val isSaving: LiveData<Boolean> = _isSaving

    private val _saveResult = MutableLiveData<Boolean?>()
    val saveResult: LiveData<Boolean?> = _saveResult

    private val _isLoading = MutableLiveData(false)
    val isLoading: LiveData<Boolean> = _isLoading

    private var originalTags: TagData? = null
    var filePath: String = ""

    fun loadTags(path: String) {
        filePath = path
        viewModelScope.launch {
            _isLoading.value = true
            val loaded = withContext(Dispatchers.IO) { Mp3Utils.readTags(path) }
            originalTags = loaded.copy()
            _tags.value = loaded
            _isLoading.value = false
        }
    }

    fun updateTags(updatedTags: TagData) {
        _tags.value = updatedTags
    }

    fun saveTags() {
        val current = _tags.value ?: return
        viewModelScope.launch {
            _isSaving.value = true
            val success = withContext(Dispatchers.IO) { Mp3Utils.saveTags(filePath, current) }
            if (success) originalTags = current.copy()
            _saveResult.value = success
            _isSaving.value = false
        }
    }

    fun clearSaveResult() {
        _saveResult.value = null
    }

    fun hasUnsavedChanges(): Boolean {
        val current = _tags.value ?: return false
        return current != originalTags
    }
}
