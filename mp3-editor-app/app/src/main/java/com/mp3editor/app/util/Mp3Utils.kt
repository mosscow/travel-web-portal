package com.mp3editor.app.util

import android.content.Context
import android.media.MediaExtractor
import android.media.MediaFormat
import android.media.MediaMetadataRetriever
import android.media.MediaMuxer
import android.os.Environment
import com.mp3editor.app.data.Mp3File
import com.mp3editor.app.data.TagData
import org.jaudiotagger.audio.AudioFileIO
import org.jaudiotagger.tag.FieldKey
import org.jaudiotagger.tag.Tag
import org.jaudiotagger.tag.images.StandardArtwork
import java.io.File
import java.nio.ByteBuffer
import java.util.Locale

object Mp3Utils {

    init {
        // Suppress JAudioTagger's verbose logging
        try {
            val logManager = java.util.logging.LogManager.getLogManager()
            logManager.reset()
        } catch (e: Exception) { /* ignore */ }
    }

    fun scanMp3Files(context: Context): List<Mp3File> {
        val files = mutableListOf<Mp3File>()
        val musicDir = Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_MUSIC)
        val downloadDir = Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOWNLOADS)
        val rootDir = Environment.getExternalStorageDirectory()

        val dirsToScan = mutableListOf<File>()
        if (musicDir.exists()) dirsToScan.add(musicDir)
        if (downloadDir.exists()) dirsToScan.add(downloadDir)
        if (rootDir.exists()) dirsToScan.add(rootDir)

        for (dir in dirsToScan) {
            scanDirectory(dir, files, mutableSetOf())
        }

        return files.distinctBy { it.path }
    }

    private fun scanDirectory(dir: File, files: MutableList<Mp3File>, visited: MutableSet<String>) {
        if (!dir.exists() || !dir.canRead()) return
        val canonical = dir.canonicalPath
        if (!visited.add(canonical)) return

        dir.listFiles()?.forEach { file ->
            when {
                file.isDirectory -> scanDirectory(file, files, visited)
                file.isFile && file.name.lowercase(Locale.ROOT).endsWith(".mp3") -> {
                    buildMp3File(file)?.let { files.add(it) }
                }
            }
        }
    }

    private fun buildMp3File(file: File): Mp3File? {
        return try {
            val retriever = MediaMetadataRetriever()
            retriever.setDataSource(file.absolutePath)
            val durationMs = retriever.extractMetadata(MediaMetadataRetriever.METADATA_KEY_DURATION)?.toLongOrNull() ?: 0L
            val title = retriever.extractMetadata(MediaMetadataRetriever.METADATA_KEY_TITLE)
            val artist = retriever.extractMetadata(MediaMetadataRetriever.METADATA_KEY_ARTIST)
            val album = retriever.extractMetadata(MediaMetadataRetriever.METADATA_KEY_ALBUM)
            val bitrate = retriever.extractMetadata(MediaMetadataRetriever.METADATA_KEY_BITRATE)?.toIntOrNull() ?: 0
            val albumArt = try { retriever.embeddedPicture } catch (e: Exception) { null }
            retriever.release()

            Mp3File(
                path = file.absolutePath,
                name = file.name,
                size = file.length(),
                lastModified = file.lastModified(),
                durationMs = durationMs,
                title = title,
                artist = artist,
                album = album,
                albumArt = albumArt,
                bitrate = bitrate / 1000
            )
        } catch (e: Exception) {
            Mp3File(
                path = file.absolutePath,
                name = file.name,
                size = file.length(),
                lastModified = file.lastModified()
            )
        }
    }

    fun readTags(filePath: String): TagData {
        return try {
            val audioFile = AudioFileIO.read(File(filePath))
            val tag = audioFile.tag ?: return TagData()
            val artwork = try { tag.firstArtwork } catch (e: Exception) { null }
            TagData(
                title = tag.getFirst(FieldKey.TITLE),
                artist = tag.getFirst(FieldKey.ARTIST),
                album = tag.getFirst(FieldKey.ALBUM),
                albumArtist = safeGetField(tag, FieldKey.ALBUM_ARTIST),
                track = tag.getFirst(FieldKey.TRACK),
                year = tag.getFirst(FieldKey.YEAR),
                genre = tag.getFirst(FieldKey.GENRE),
                comment = tag.getFirst(FieldKey.COMMENT),
                composer = safeGetField(tag, FieldKey.COMPOSER),
                albumArt = artwork?.binaryData,
                albumArtMimeType = artwork?.mimeType
            )
        } catch (e: Exception) {
            TagData()
        }
    }

    private fun safeGetField(tag: Tag, key: FieldKey): String {
        return try { tag.getFirst(key) } catch (e: Exception) { "" }
    }

    fun saveTags(filePath: String, tags: TagData): Boolean {
        return try {
            val audioFile = AudioFileIO.read(File(filePath))
            val tag = audioFile.tag ?: run {
                val newTag = audioFile.createDefaultTag()
                audioFile.setTag(newTag)
                newTag
            }

            safeSetField(tag, FieldKey.TITLE, tags.title)
            safeSetField(tag, FieldKey.ARTIST, tags.artist)
            safeSetField(tag, FieldKey.ALBUM, tags.album)
            safeSetField(tag, FieldKey.ALBUM_ARTIST, tags.albumArtist)
            safeSetField(tag, FieldKey.TRACK, tags.track)
            safeSetField(tag, FieldKey.YEAR, tags.year)
            safeSetField(tag, FieldKey.GENRE, tags.genre)
            safeSetField(tag, FieldKey.COMMENT, tags.comment)
            safeSetField(tag, FieldKey.COMPOSER, tags.composer)

            val albumArt = tags.albumArt
            if (albumArt != null && albumArt.isNotEmpty()) {
                val artwork = StandardArtwork()
                artwork.binaryData = albumArt
                artwork.mimeType = tags.albumArtMimeType ?: "image/jpeg"
                tag.setField(artwork)
            } else if (albumArt == null) {
                try { tag.deleteArtworkField() } catch (e: Exception) { /* no artwork to delete */ }
            }

            audioFile.commit()
            true
        } catch (e: Exception) {
            e.printStackTrace()
            false
        }
    }

    private fun safeSetField(tag: Tag, key: FieldKey, value: String) {
        try { tag.setField(key, value) } catch (e: Exception) { /* field not supported by tag format */ }
    }

    fun trimMp3(inputPath: String, outputPath: String, startMs: Long, endMs: Long): Boolean {
        return try {
            val extractor = MediaExtractor()
            extractor.setDataSource(inputPath)

            var audioTrackIndex = -1
            for (i in 0 until extractor.trackCount) {
                val format = extractor.getTrackFormat(i)
                val mime = format.getString(MediaFormat.KEY_MIME) ?: ""
                if (mime.startsWith("audio/")) {
                    audioTrackIndex = i
                    break
                }
            }

            if (audioTrackIndex < 0) {
                extractor.release()
                return false
            }

            extractor.selectTrack(audioTrackIndex)
            val trackFormat = extractor.getTrackFormat(audioTrackIndex)

            val muxer = MediaMuxer(outputPath, MediaMuxer.OutputFormat.MUXER_OUTPUT_MPEG_4)
            val muxTrackIndex = muxer.addTrack(trackFormat)
            muxer.start()

            val startUs = startMs * 1000L
            val endUs = endMs * 1000L
            extractor.seekTo(startUs, MediaExtractor.SEEK_TO_CLOSEST_SYNC)

            val bufferSize = 1024 * 1024
            val buffer = ByteBuffer.allocate(bufferSize)

            while (true) {
                val sampleTime = extractor.sampleTime
                if (sampleTime < 0 || sampleTime > endUs) break

                buffer.clear()
                val bytesRead = extractor.readSampleData(buffer, 0)
                if (bytesRead < 0) break

                val info = android.media.MediaCodec.BufferInfo()
                info.offset = 0
                info.size = bytesRead
                info.presentationTimeUs = sampleTime - startUs
                info.flags = extractor.sampleFlags

                muxer.writeSampleData(muxTrackIndex, buffer, info)
                extractor.advance()
            }

            muxer.stop()
            muxer.release()
            extractor.release()
            true
        } catch (e: Exception) {
            e.printStackTrace()
            File(outputPath).delete()
            false
        }
    }

    fun formatDuration(ms: Long): String {
        val totalSeconds = ms / 1000
        val hours = totalSeconds / 3600
        val minutes = (totalSeconds % 3600) / 60
        val seconds = totalSeconds % 60
        return if (hours > 0) {
            String.format(Locale.US, "%d:%02d:%02d", hours, minutes, seconds)
        } else {
            String.format(Locale.US, "%d:%02d", minutes, seconds)
        }
    }

    fun formatFileSize(bytes: Long): String {
        return when {
            bytes >= 1024 * 1024 -> String.format(Locale.US, "%.1f MB", bytes / (1024.0 * 1024.0))
            bytes >= 1024 -> String.format(Locale.US, "%.1f KB", bytes / 1024.0)
            else -> "$bytes B"
        }
    }
}
