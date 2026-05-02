package com.mp3editor.app.ui.player

import android.app.Application
import android.media.MediaPlayer
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.LiveData
import androidx.lifecycle.MutableLiveData
import androidx.lifecycle.viewModelScope
import com.mp3editor.app.data.Mp3File
import com.mp3editor.app.data.TagData
import com.mp3editor.app.util.Mp3Utils
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

class PlayerViewModel(application: Application) : AndroidViewModel(application) {

    private val _tags = MutableLiveData<TagData>()
    val tags: LiveData<TagData> = _tags

    private val _isPlaying = MutableLiveData(false)
    val isPlaying: LiveData<Boolean> = _isPlaying

    private val _progress = MutableLiveData(0)
    val progress: LiveData<Int> = _progress

    private val _duration = MutableLiveData(0)
    val duration: LiveData<Int> = _duration

    private val _filePath = MutableLiveData<String>()
    val filePath: LiveData<String> = _filePath

    private var mediaPlayer: MediaPlayer? = null
    private var progressJob: Job? = null
    var currentPath: String = ""

    fun loadFile(path: String) {
        if (path == currentPath) return
        currentPath = path
        _filePath.value = path

        stopProgressUpdates()
        mediaPlayer?.release()
        mediaPlayer = null
        _isPlaying.value = false
        _progress.value = 0

        viewModelScope.launch {
            val loaded = withContext(Dispatchers.IO) { Mp3Utils.readTags(path) }
            _tags.value = loaded
        }

        try {
            val player = MediaPlayer().apply {
                setDataSource(path)
                prepare()
                setOnCompletionListener {
                    _isPlaying.postValue(false)
                    _progress.postValue(0)
                    stopProgressUpdates()
                    seekTo(0)
                }
            }
            mediaPlayer = player
            _duration.value = player.duration
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    fun togglePlayPause() {
        val player = mediaPlayer ?: return
        if (player.isPlaying) {
            player.pause()
            _isPlaying.value = false
            stopProgressUpdates()
        } else {
            player.start()
            _isPlaying.value = true
            startProgressUpdates()
        }
    }

    fun seekTo(positionMs: Int) {
        mediaPlayer?.seekTo(positionMs)
        _progress.value = positionMs
    }

    fun rewind10s() {
        val current = mediaPlayer?.currentPosition ?: 0
        seekTo(maxOf(0, current - 10000))
    }

    fun forward10s() {
        val dur = mediaPlayer?.duration ?: 0
        val current = mediaPlayer?.currentPosition ?: 0
        seekTo(minOf(dur, current + 10000))
    }

    private fun startProgressUpdates() {
        stopProgressUpdates()
        progressJob = viewModelScope.launch {
            while (true) {
                delay(200)
                mediaPlayer?.let { player ->
                    if (player.isPlaying) {
                        _progress.postValue(player.currentPosition)
                    }
                }
            }
        }
    }

    private fun stopProgressUpdates() {
        progressJob?.cancel()
        progressJob = null
    }

    override fun onCleared() {
        stopProgressUpdates()
        mediaPlayer?.release()
        mediaPlayer = null
        super.onCleared()
    }
}
