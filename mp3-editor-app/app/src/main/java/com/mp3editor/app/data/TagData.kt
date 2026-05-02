package com.mp3editor.app.data

data class TagData(
    var title: String = "",
    var artist: String = "",
    var album: String = "",
    var albumArtist: String = "",
    var track: String = "",
    var year: String = "",
    var genre: String = "",
    var comment: String = "",
    var composer: String = "",
    var albumArt: ByteArray? = null,
    var albumArtMimeType: String? = null
) {
    fun isEmpty(): Boolean = title.isBlank() && artist.isBlank() && album.isBlank()

    override fun equals(other: Any?): Boolean {
        if (this === other) return true
        if (other !is TagData) return false
        return title == other.title && artist == other.artist && album == other.album &&
                albumArtist == other.albumArtist && track == other.track && year == other.year &&
                genre == other.genre && comment == other.comment && composer == other.composer &&
                albumArt.contentEquals(other.albumArt)
    }

    override fun hashCode(): Int {
        var result = title.hashCode()
        result = 31 * result + artist.hashCode()
        result = 31 * result + album.hashCode()
        return result
    }

    private fun ByteArray?.contentEquals(other: ByteArray?): Boolean {
        if (this == null && other == null) return true
        if (this == null || other == null) return false
        return this.contentEquals(other)
    }
}
