package com.mp3editor.app.ui.browser

import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.recyclerview.widget.DiffUtil
import androidx.recyclerview.widget.ListAdapter
import androidx.recyclerview.widget.RecyclerView
import coil.load
import coil.transform.RoundedCornersTransformation
import com.mp3editor.app.R
import com.mp3editor.app.data.Mp3File
import com.mp3editor.app.databinding.ItemMp3FileBinding
import com.mp3editor.app.util.Mp3Utils

class Mp3FileAdapter(
    private val onItemClick: (Mp3File) -> Unit,
    private val onMenuClick: (Mp3File, View) -> Unit
) : ListAdapter<Mp3File, Mp3FileAdapter.ViewHolder>(DIFF) {

    inner class ViewHolder(private val binding: ItemMp3FileBinding) :
        RecyclerView.ViewHolder(binding.root) {

        fun bind(mp3: Mp3File) {
            binding.tvTitle.text = mp3.displayTitle
            binding.tvArtist.text = mp3.displayArtist
            binding.tvDuration.text = Mp3Utils.formatDuration(mp3.durationMs)
            binding.tvSize.text = Mp3Utils.formatFileSize(mp3.size)

            if (mp3.albumArt != null) {
                binding.ivCover.load(mp3.albumArt) {
                    crossfade(true)
                    transformations(RoundedCornersTransformation(8f))
                    placeholder(R.drawable.ic_music_note)
                    error(R.drawable.ic_music_note)
                }
            } else {
                binding.ivCover.setImageResource(R.drawable.ic_music_note)
            }

            binding.root.setOnClickListener { onItemClick(mp3) }
            binding.btnMenu.setOnClickListener { onMenuClick(mp3, it) }
        }
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): ViewHolder {
        val binding = ItemMp3FileBinding.inflate(LayoutInflater.from(parent.context), parent, false)
        return ViewHolder(binding)
    }

    override fun onBindViewHolder(holder: ViewHolder, position: Int) {
        holder.bind(getItem(position))
    }

    companion object {
        private val DIFF = object : DiffUtil.ItemCallback<Mp3File>() {
            override fun areItemsTheSame(a: Mp3File, b: Mp3File) = a.path == b.path
            override fun areContentsTheSame(a: Mp3File, b: Mp3File) = a == b
        }
    }
}
