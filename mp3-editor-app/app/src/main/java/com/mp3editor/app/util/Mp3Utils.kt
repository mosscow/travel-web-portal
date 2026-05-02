package com.mp3editor.app.util

import android.content.Context
import android.media.MediaExtractor
import android.media.MediaFormat
import android.media.MediaMetadataRetriever
import android.media.MediaMuxer
import android.os.Environment
import com.mpatric.mp3agic.AbstractID3v2Tag
import com.mpatric.mp3agic.ID3v1Tag
import com.mpatric.mp3agic.ID3v24Tag
import com.mpatric.mp3agic.Mp3File as AgicMp3File
import com.mp3editor.app.data.Mp3File
import com.mp3editor.app.data.TagData
import java.io.File
import java.nio.ByteBuffer
import java.util.Locale

object Mp3Utils {

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
            val mp3 = AgicMp3File(filePath)
            when {
                mp3.hasId3v2Tag() -> {
                    val tag = mp3.id3v2Tag
                    TagData(
                        title = tag.title ?: "",
                        artist = tag.artist ?: "",
                        album = tag.album ?: "",
                        albumArtist = tag.albumArtist ?: "",
                        track = tag.track ?: "",
                        year = tag.year ?: "",
                        genre = tag.genreDescription ?: "",
                        comment = tag.comment ?: "",
                        composer = tag.composer ?: "",
                        albumArt = tag.albumImage,
                        albumArtMimeType = tag.albumImageMimeType
                    )
                }
                mp3.hasId3v1Tag() -> {
                    val tag = mp3.id3v1Tag
                    TagData(
                        title = tag.title ?: "",
                        artist = tag.artist ?: "",
                        album = tag.album ?: "",
                        year = tag.year ?: "",
                        genre = tag.genreDescription ?: "",
                        comment = tag.comment ?: ""
                    )
                }
                else -> TagData()
            }
        } catch (e: Exception) {
            TagData()
        }
    }

    fun saveTags(filePath: String, tags: TagData): Boolean {
        return try {
            val mp3 = AgicMp3File(filePath)
            val tag: AbstractID3v2Tag = if (mp3.hasId3v2Tag()) mp3.id3v2Tag else ID3v24Tag()

            tag.title = tags.title.ifBlank { null }
            tag.artist = tags.artist.ifBlank { null }
            tag.album = tags.album.ifBlank { null }
            tag.albumArtist = tags.albumArtist.ifBlank { null }
            tag.track = tags.track.ifBlank { null }
            tag.year = tags.year.ifBlank { null }
            if (tags.genre.isNotBlank()) {
                val genreId = genreNameToId(tags.genre)
                if (genreId != 255) tag.genre = genreId
            }
            tag.comment = tags.comment.ifBlank { null }
            tag.composer = tags.composer.ifBlank { null }

            if (tags.albumArt != null && tags.albumArt.isNotEmpty()) {
                tag.setAlbumImage(tags.albumArt, tags.albumArtMimeType ?: "image/jpeg")
            } else if (tags.albumArt == null) {
                tag.clearAlbumImage()
            }

            mp3.id3v2Tag = tag

            val tempFile = File(filePath + ".tmp")
            mp3.save(tempFile.absolutePath)
            tempFile.renameTo(File(filePath))
            true
        } catch (e: Exception) {
            e.printStackTrace()
            false
        }
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

    private fun genreNameToId(name: String): Int {
        val genres = ID3v1Tag.genres
        for (i in genres.indices) {
            if (genres[i].equals(name, ignoreCase = true)) return i
        }
        return 255
    }
}
