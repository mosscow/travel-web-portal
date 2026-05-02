package com.mp3editor.app.ui.editor

import android.content.Intent
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.os.Environment
import android.provider.Settings
import android.view.LayoutInflater
import android.view.Menu
import android.view.MenuInflater
import android.view.MenuItem
import android.view.View
import android.view.ViewGroup
import androidx.activity.result.contract.ActivityResultContracts
import androidx.core.view.MenuProvider
import androidx.fragment.app.Fragment
import androidx.fragment.app.viewModels
import androidx.lifecycle.Lifecycle
import androidx.navigation.fragment.findNavController
import androidx.navigation.fragment.navArgs
import coil.load
import coil.transform.RoundedCornersTransformation
import com.google.android.material.dialog.MaterialAlertDialogBuilder
import com.google.android.material.snackbar.Snackbar
import com.mp3editor.app.R
import com.mp3editor.app.data.TagData
import com.mp3editor.app.databinding.FragmentTagEditorBinding
import com.mp3editor.app.util.Mp3Utils
import java.io.File

class TagEditorFragment : Fragment(), MenuProvider {

    private var _binding: FragmentTagEditorBinding? = null
    private val binding get() = _binding!!
    private val viewModel: TagEditorViewModel by viewModels()
    private val args: TagEditorFragmentArgs by navArgs()

    private val imagePicker = registerForActivityResult(ActivityResultContracts.GetContent()) { uri ->
        if (uri != null) {
            try {
                val bytes = requireContext().contentResolver.openInputStream(uri)?.readBytes()
                val mimeType = requireContext().contentResolver.getType(uri) ?: "image/jpeg"
                val current = viewModel.tags.value?.copy(albumArt = bytes, albumArtMimeType = mimeType) ?: return@registerForActivityResult
                viewModel.updateTags(current)
                binding.ivCover.load(bytes) { transformations(RoundedCornersTransformation(12f)) }
            } catch (e: Exception) {
                Snackbar.make(binding.root, "Failed to load image", Snackbar.LENGTH_SHORT).show()
            }
        }
    }

    override fun onCreateView(
        inflater: LayoutInflater, container: ViewGroup?, savedInstanceState: Bundle?
    ): View {
        _binding = FragmentTagEditorBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)
        requireActivity().addMenuProvider(this, viewLifecycleOwner, Lifecycle.State.RESUMED)

        viewModel.loadTags(args.filePath)

        binding.ivCover.setOnClickListener { showCoverOptions() }
        binding.btnChangeCover.setOnClickListener { imagePicker.launch("image/*") }
        binding.btnSave.setOnClickListener { saveAndClose() }

        viewModel.tags.observe(viewLifecycleOwner) { tags ->
            populateFields(tags)
        }
        viewModel.isLoading.observe(viewLifecycleOwner) { loading ->
            binding.progressBar.visibility = if (loading) View.VISIBLE else View.GONE
            binding.scrollContent.visibility = if (loading) View.GONE else View.VISIBLE
        }
        viewModel.isSaving.observe(viewLifecycleOwner) { saving ->
            binding.progressBar.visibility = if (saving) View.VISIBLE else View.GONE
        }
        viewModel.saveResult.observe(viewLifecycleOwner) { result ->
            result ?: return@observe
            val msg = if (result) getString(R.string.tags_saved) else getString(R.string.tags_save_error)
            Snackbar.make(binding.root, msg, Snackbar.LENGTH_SHORT).show()
            viewModel.clearSaveResult()
        }
    }

    private fun populateFields(tags: TagData) {
        binding.etTitle.setText(tags.title)
        binding.etArtist.setText(tags.artist)
        binding.etAlbum.setText(tags.album)
        binding.etAlbumArtist.setText(tags.albumArtist)
        binding.etTrack.setText(tags.track)
        binding.etYear.setText(tags.year)
        binding.etGenre.setText(tags.genre)
        binding.etComment.setText(tags.comment)
        binding.etComposer.setText(tags.composer)

        if (tags.albumArt != null) {
            binding.ivCover.load(tags.albumArt) {
                crossfade(true)
                transformations(RoundedCornersTransformation(12f))
                placeholder(R.drawable.ic_music_note)
            }
        } else {
            binding.ivCover.setImageResource(R.drawable.ic_album_placeholder)
        }
    }

    private fun collectFields(): TagData {
        val current = viewModel.tags.value ?: TagData()
        return current.copy(
            title = binding.etTitle.text.toString().trim(),
            artist = binding.etArtist.text.toString().trim(),
            album = binding.etAlbum.text.toString().trim(),
            albumArtist = binding.etAlbumArtist.text.toString().trim(),
            track = binding.etTrack.text.toString().trim(),
            year = binding.etYear.text.toString().trim(),
            genre = binding.etGenre.text.toString().trim(),
            comment = binding.etComment.text.toString().trim(),
            composer = binding.etComposer.text.toString().trim()
        )
    }

    private fun showCoverOptions() {
        val options = if (viewModel.tags.value?.albumArt != null) {
            arrayOf("Change Cover Art", "Remove Cover Art")
        } else {
            arrayOf("Set Cover Art")
        }
        MaterialAlertDialogBuilder(requireContext())
            .setTitle(R.string.cover_art)
            .setItems(options) { _, which ->
                when {
                    options[which] == "Remove Cover Art" -> {
                        val updated = viewModel.tags.value?.copy(albumArt = null, albumArtMimeType = null) ?: return@setItems
                        viewModel.updateTags(updated)
                        binding.ivCover.setImageResource(R.drawable.ic_album_placeholder)
                    }
                    else -> imagePicker.launch("image/*")
                }
            }
            .show()
    }

    private fun saveAndClose() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R && !Environment.isExternalStorageManager()) {
            MaterialAlertDialogBuilder(requireContext())
                .setTitle("Write Permission Required")
                .setMessage("To save tags on Android 11+, grant \"All Files Access\" in Settings.")
                .setPositiveButton("Open Settings") { _, _ ->
                    startActivity(
                        Intent(Settings.ACTION_MANAGE_APP_ALL_FILES_ACCESS_PERMISSION,
                            Uri.fromParts("package", requireContext().packageName, null))
                    )
                }
                .setNegativeButton(R.string.cancel, null)
                .show()
            return
        }
        viewModel.updateTags(collectFields())
        viewModel.saveTags()
    }

    override fun onCreateMenu(menu: Menu, inflater: MenuInflater) {
        inflater.inflate(R.menu.menu_tag_editor, menu)
    }

    override fun onMenuItemSelected(item: MenuItem): Boolean {
        return when (item.itemId) {
            R.id.action_save -> {
                saveAndClose()
                true
            }
            R.id.action_file_info -> {
                showFileInfo()
                true
            }
            else -> false
        }
    }

    private fun showFileInfo() {
        val file = File(args.filePath)
        val info = buildString {
            appendLine("${getString(R.string.file_path)}: ${file.absolutePath}")
            appendLine("${getString(R.string.file_size)}: ${Mp3Utils.formatFileSize(file.length())}")
        }
        MaterialAlertDialogBuilder(requireContext())
            .setTitle(R.string.file_info)
            .setMessage(info)
            .setPositiveButton(R.string.ok, null)
            .show()
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}
