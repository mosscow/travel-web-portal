package com.mp3editor.app.data

data class Mp3File(
    val path: String,
    val name: String,
    val size: Long,
    val lastModified: Long,
    val durationMs: Long = 0L,
    val title: String? = null,
    val artist: String? = null,
    val album: String? = null,
    val albumArt: ByteArray? = null,
    val bitrate: Int = 0,
    val sampleRate: Int = 0,
    val channels: Int = 0
) {
    val displayTitle: String get() = title?.takeIf { it.isNotBlank() } ?: name.removeSuffix(".mp3")
    val displayArtist: String get() = artist?.takeIf { it.isNotBlank() } ?: "Unknown Artist"
    val displayAlbum: String get() = album?.takeIf { it.isNotBlank() } ?: "Unknown Album"

    override fun equals(other: Any?): Boolean {
        if (this === other) return true
        if (other !is Mp3File) return false
        return path == other.path
    }

    override fun hashCode() = path.hashCode()
}
