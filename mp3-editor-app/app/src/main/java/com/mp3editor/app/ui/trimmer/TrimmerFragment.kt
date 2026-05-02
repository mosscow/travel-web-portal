package com.mp3editor.app.ui.trimmer

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.EditText
import androidx.fragment.app.Fragment
import androidx.fragment.app.viewModels
import androidx.navigation.fragment.navArgs
import com.google.android.material.dialog.MaterialAlertDialogBuilder
import com.google.android.material.snackbar.Snackbar
import com.mp3editor.app.R
import com.mp3editor.app.databinding.FragmentTrimmerBinding
import com.mp3editor.app.util.Mp3Utils
import com.mp3editor.app.util.TrimmerView
import java.io.File

class TrimmerFragment : Fragment() {

    private var _binding: FragmentTrimmerBinding? = null
    private val binding get() = _binding!!
    private val viewModel: TrimmerViewModel by viewModels()
    private val args: TrimmerFragmentArgs by navArgs()

    override fun onCreateView(
        inflater: LayoutInflater, container: ViewGroup?, savedInstanceState: Bundle?
    ): View {
        _binding = FragmentTrimmerBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        viewModel.loadFile(args.filePath)

        binding.trimmerView.listener = object : TrimmerView.TrimListener {
            override fun onTrimChanged(startFraction: Float, endFraction: Float) {
                val dur = viewModel.duration.value ?: 0L
                viewModel.startMs = (startFraction * dur).toLong()
                viewModel.endMs = (endFraction * dur).toLong()
                updateTimeLabels()
            }
        }

        binding.btnPreview.setOnClickListener { viewModel.previewTrim() }
        binding.btnTrimSave.setOnClickListener { showSaveDialog() }

        viewModel.tags.observe(viewLifecycleOwner) { tags ->
            binding.tvTitle.text = tags.title.ifBlank { File(args.filePath).nameWithoutExtension }
            binding.tvArtist.text = tags.artist.ifBlank { getString(R.string.unknown) }
        }

        viewModel.duration.observe(viewLifecycleOwner) { dur ->
            viewModel.endMs = dur
            updateTimeLabels()
        }

        viewModel.isPlaying.observe(viewLifecycleOwner) { playing ->
            binding.btnPreview.setIconResource(
                if (playing) R.drawable.ic_pause else R.drawable.ic_play
            )
            binding.btnPreview.text = if (playing) "Stop Preview" else "Preview"
        }

        viewModel.playheadMs.observe(viewLifecycleOwner) { ms ->
            val dur = viewModel.duration.value?.takeIf { it > 0 } ?: 1L
            binding.trimmerView.setPlayhead(ms.toFloat() / dur.toFloat())
        }

        viewModel.isTrimming.observe(viewLifecycleOwner) { trimming ->
            binding.progressBar.visibility = if (trimming) View.VISIBLE else View.GONE
            binding.btnTrimSave.isEnabled = !trimming
            binding.btnPreview.isEnabled = !trimming
        }

        viewModel.trimResult.observe(viewLifecycleOwner) { path ->
            path ?: return@observe
            Snackbar.make(binding.root, getString(R.string.trim_success), Snackbar.LENGTH_LONG)
                .setAction("OK") {}
                .show()
            viewModel.clearTrimResult()
        }
    }

    private fun showSaveDialog() {
        val suggestedName = File(args.filePath).nameWithoutExtension + "_trimmed"
        val input = EditText(requireContext()).apply {
            setText(suggestedName)
            selectAll()
        }
        MaterialAlertDialogBuilder(requireContext())
            .setTitle(R.string.output_filename)
            .setView(input)
            .setPositiveButton(R.string.trim_and_save) { _, _ ->
                val name = input.text.toString().trim()
                if (name.isNotEmpty()) {
                    viewModel.trimAndSave(name)
                }
            }
            .setNegativeButton(R.string.cancel, null)
            .show()
    }

    private fun updateTimeLabels() {
        val dur = viewModel.duration.value ?: 0L
        binding.tvStartTime.text = getString(R.string.trim_start) + ": " + Mp3Utils.formatDuration(viewModel.startMs)
        binding.tvEndTime.text = getString(R.string.trim_end) + ": " + Mp3Utils.formatDuration(viewModel.endMs)
        val trimDur = viewModel.endMs - viewModel.startMs
        binding.tvDuration.text = getString(R.string.trim_duration) + ": " + Mp3Utils.formatDuration(trimDur)
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}
