package com.mp3editor.app.ui.trimmer

import android.app.Application
import android.media.MediaPlayer
import android.os.Environment
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.LiveData
import androidx.lifecycle.MutableLiveData
import androidx.lifecycle.viewModelScope
import com.mp3editor.app.data.TagData
import com.mp3editor.app.util.Mp3Utils
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import java.io.File

class TrimmerViewModel(application: Application) : AndroidViewModel(application) {

    private val _tags = MutableLiveData<TagData>()
    val tags: LiveData<TagData> = _tags

    private val _duration = MutableLiveData(0L)
    val duration: LiveData<Long> = _duration

    private val _isPlaying = MutableLiveData(false)
    val isPlaying: LiveData<Boolean> = _isPlaying

    private val _playheadMs = MutableLiveData(0L)
    val playheadMs: LiveData<Long> = _playheadMs

    private val _isTrimming = MutableLiveData(false)
    val isTrimming: LiveData<Boolean> = _isTrimming

    private val _trimResult = MutableLiveData<String?>()
    val trimResult: LiveData<String?> = _trimResult

    var startMs = 0L
    var endMs = 0L
    var filePath: String = ""
    private var mediaPlayer: MediaPlayer? = null
    private var progressJob: Job? = null

    fun loadFile(path: String) {
        filePath = path
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
                    stopProgressUpdates()
                }
            }
            mediaPlayer = player
            val dur = player.duration.toLong()
            _duration.value = dur
            startMs = 0L
            endMs = dur
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    fun previewTrim() {
        val player = mediaPlayer ?: return
        if (player.isPlaying) {
            player.pause()
            _isPlaying.value = false
            stopProgressUpdates()
        } else {
            player.seekTo(startMs.toInt())
            player.start()
            _isPlaying.value = true
            startProgressUpdates(endMs)
        }
    }

    fun seekTo(ms: Long) {
        mediaPlayer?.seekTo(ms.toInt())
        _playheadMs.value = ms
    }

    fun trimAndSave(outputFileName: String) {
        viewModelScope.launch {
            _isTrimming.value = true
            val outDir = Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_MUSIC)
            val outFile = File(outDir, if (outputFileName.endsWith(".mp3")) outputFileName else "$outputFileName.mp3")
            val success = withContext(Dispatchers.IO) {
                Mp3Utils.trimMp3(filePath, outFile.absolutePath, startMs, endMs)
            }
            _isTrimming.value = false
            _trimResult.value = if (success) outFile.absolutePath else null
        }
    }

    fun clearTrimResult() {
        _trimResult.value = null
    }

    private fun startProgressUpdates(stopAtMs: Long) {
        stopProgressUpdates()
        progressJob = viewModelScope.launch {
            while (true) {
                delay(100)
                val player = mediaPlayer ?: break
                val pos = player.currentPosition.toLong()
                _playheadMs.postValue(pos)
                if (pos >= stopAtMs || !player.isPlaying) {
                    player.pause()
                    _isPlaying.postValue(false)
                    break
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
