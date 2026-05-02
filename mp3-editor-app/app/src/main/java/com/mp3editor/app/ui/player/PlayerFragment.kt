package com.mp3editor.app.ui.player

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.SeekBar
import androidx.fragment.app.Fragment
import androidx.fragment.app.viewModels
import androidx.navigation.fragment.findNavController
import androidx.navigation.fragment.navArgs
import coil.load
import coil.transform.RoundedCornersTransformation
import com.mp3editor.app.R
import com.mp3editor.app.databinding.FragmentPlayerBinding
import com.mp3editor.app.util.Mp3Utils
import java.io.File

class PlayerFragment : Fragment() {

    private var _binding: FragmentPlayerBinding? = null
    private val binding get() = _binding!!
    private val viewModel: PlayerViewModel by viewModels()
    private val args: PlayerFragmentArgs by navArgs()

    override fun onCreateView(
        inflater: LayoutInflater, container: ViewGroup?, savedInstanceState: Bundle?
    ): View {
        _binding = FragmentPlayerBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        if (args.filePath.isNotEmpty()) {
            viewModel.loadFile(args.filePath)
        }

        binding.btnPlayPause.setOnClickListener { viewModel.togglePlayPause() }
        binding.btnRewind.setOnClickListener { viewModel.rewind10s() }
        binding.btnForward.setOnClickListener { viewModel.forward10s() }

        binding.btnEditTags.setOnClickListener {
            if (viewModel.currentPath.isNotEmpty()) {
                val action = PlayerFragmentDirections.actionPlayerToTagEditor(viewModel.currentPath)
                findNavController().navigate(action)
            }
        }

        binding.btnTrim.setOnClickListener {
            if (viewModel.currentPath.isNotEmpty()) {
                val action = PlayerFragmentDirections.actionPlayerToTrimmer(viewModel.currentPath)
                findNavController().navigate(action)
            }
        }

        binding.seekBar.setOnSeekBarChangeListener(object : SeekBar.OnSeekBarChangeListener {
            override fun onProgressChanged(sb: SeekBar, progress: Int, fromUser: Boolean) {
                if (fromUser) {
                    binding.tvCurrentTime.text = Mp3Utils.formatDuration(progress.toLong())
                }
            }
            override fun onStartTrackingTouch(sb: SeekBar) {}
            override fun onStopTrackingTouch(sb: SeekBar) { viewModel.seekTo(sb.progress) }
        })

        viewModel.tags.observe(viewLifecycleOwner) { tags ->
            binding.tvTitle.text = tags.title.ifBlank { File(viewModel.currentPath).nameWithoutExtension }
            binding.tvArtist.text = tags.artist.ifBlank { getString(R.string.unknown) }
            binding.tvAlbum.text = tags.album.ifBlank { getString(R.string.unknown) }
            if (tags.albumArt != null) {
                binding.ivCover.load(tags.albumArt) {
                    crossfade(true)
                    transformations(RoundedCornersTransformation(16f))
                    placeholder(R.drawable.ic_album_placeholder)
                }
            } else {
                binding.ivCover.setImageResource(R.drawable.ic_album_placeholder)
            }
        }

        viewModel.isPlaying.observe(viewLifecycleOwner) { playing ->
            binding.btnPlayPause.setImageResource(
                if (playing) R.drawable.ic_pause else R.drawable.ic_play
            )
        }

        viewModel.duration.observe(viewLifecycleOwner) { duration ->
            binding.seekBar.max = duration
            binding.tvTotalTime.text = Mp3Utils.formatDuration(duration.toLong())
        }

        viewModel.progress.observe(viewLifecycleOwner) { pos ->
            if (!binding.seekBar.isPressed) {
                binding.seekBar.progress = pos
            }
            binding.tvCurrentTime.text = Mp3Utils.formatDuration(pos.toLong())
            val dur = viewModel.duration.value ?: 1
            binding.waveformView.setProgress(pos.toFloat() / dur.toFloat())
        }
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}
