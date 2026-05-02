package com.mp3editor.app.ui.browser

import android.Manifest
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Build
import android.os.Bundle
import android.view.LayoutInflater
import android.view.Menu
import android.view.MenuInflater
import android.view.MenuItem
import android.view.View
import android.view.ViewGroup
import android.widget.EditText
import android.widget.PopupMenu
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.widget.SearchView
import androidx.core.content.ContextCompat
import androidx.core.content.FileProvider
import androidx.core.view.MenuProvider
import androidx.fragment.app.Fragment
import androidx.fragment.app.viewModels
import androidx.lifecycle.Lifecycle
import androidx.navigation.fragment.findNavController
import com.google.android.material.dialog.MaterialAlertDialogBuilder
import com.google.android.material.snackbar.Snackbar
import com.mp3editor.app.R
import com.mp3editor.app.data.Mp3File
import com.mp3editor.app.databinding.FragmentFileBrowserBinding
import java.io.File

class FileBrowserFragment : Fragment(), MenuProvider {

    private var _binding: FragmentFileBrowserBinding? = null
    private val binding get() = _binding!!
    private val viewModel: FileBrowserViewModel by viewModels()
    private lateinit var adapter: Mp3FileAdapter

    private val permissionLauncher = registerForActivityResult(
        ActivityResultContracts.RequestMultiplePermissions()
    ) { grants ->
        if (grants.values.any { it }) {
            viewModel.loadFiles()
            binding.layoutPermission.visibility = View.GONE
        } else {
            binding.layoutPermission.visibility = View.VISIBLE
        }
    }

    override fun onCreateView(
        inflater: LayoutInflater, container: ViewGroup?, savedInstanceState: Bundle?
    ): View {
        _binding = FragmentFileBrowserBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)
        requireActivity().addMenuProvider(this, viewLifecycleOwner, Lifecycle.State.RESUMED)

        adapter = Mp3FileAdapter(
            onItemClick = { mp3 -> navigateToPlayer(mp3.path) },
            onMenuClick = { mp3, anchor -> showContextMenu(mp3, anchor) }
        )
        binding.recyclerView.adapter = adapter
        binding.recyclerView.setHasFixedSize(true)

        binding.btnGrantPermission.setOnClickListener { requestPermissions() }
        binding.swipeRefresh.setOnRefreshListener { viewModel.loadFiles() }

        viewModel.files.observe(viewLifecycleOwner) { files ->
            adapter.submitList(files)
            binding.tvEmpty.visibility = if (files.isEmpty()) View.VISIBLE else View.GONE
        }
        viewModel.isLoading.observe(viewLifecycleOwner) { loading ->
            binding.swipeRefresh.isRefreshing = loading
            binding.progressBar.visibility = if (loading && adapter.itemCount == 0) View.VISIBLE else View.GONE
        }
        viewModel.error.observe(viewLifecycleOwner) { err ->
            err?.let { Snackbar.make(binding.root, it, Snackbar.LENGTH_LONG).show() }
        }

        checkPermissionsAndLoad()
    }

    private fun checkPermissionsAndLoad() {
        val permissions = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            arrayOf(Manifest.permission.READ_MEDIA_AUDIO)
        } else {
            arrayOf(Manifest.permission.READ_EXTERNAL_STORAGE)
        }
        val granted = permissions.all {
            ContextCompat.checkSelfPermission(requireContext(), it) == PackageManager.PERMISSION_GRANTED
        }
        if (granted) {
            binding.layoutPermission.visibility = View.GONE
            viewModel.loadFiles()
        } else {
            binding.layoutPermission.visibility = View.VISIBLE
        }
    }

    private fun requestPermissions() {
        val permissions = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            arrayOf(Manifest.permission.READ_MEDIA_AUDIO, Manifest.permission.READ_MEDIA_IMAGES)
        } else if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            arrayOf(Manifest.permission.READ_EXTERNAL_STORAGE)
        } else {
            arrayOf(
                Manifest.permission.READ_EXTERNAL_STORAGE,
                Manifest.permission.WRITE_EXTERNAL_STORAGE
            )
        }
        permissionLauncher.launch(permissions)
    }

    private fun showContextMenu(mp3: Mp3File, anchor: View) {
        val popup = PopupMenu(requireContext(), anchor)
        popup.menuInflater.inflate(R.menu.menu_item_context, popup.menu)
        popup.setOnMenuItemClickListener { item ->
            when (item.itemId) {
                R.id.ctx_play -> navigateToPlayer(mp3.path)
                R.id.ctx_edit_tags -> navigateToTagEditor(mp3.path)
                R.id.ctx_trim -> navigateToTrimmer(mp3.path)
                R.id.ctx_rename -> showRenameDialog(mp3)
                R.id.ctx_share -> shareFile(mp3)
                R.id.ctx_delete -> confirmDelete(mp3)
            }
            true
        }
        popup.show()
    }

    private fun confirmDelete(mp3: Mp3File) {
        MaterialAlertDialogBuilder(requireContext())
            .setTitle(R.string.confirm_delete)
            .setMessage(mp3.name)
            .setPositiveButton(R.string.delete) { _, _ ->
                if (!viewModel.deleteFile(mp3)) {
                    Snackbar.make(binding.root, "Failed to delete file", Snackbar.LENGTH_SHORT).show()
                }
            }
            .setNegativeButton(R.string.cancel, null)
            .show()
    }

    private fun showRenameDialog(mp3: Mp3File) {
        val input = EditText(requireContext()).apply {
            setText(mp3.name.removeSuffix(".mp3"))
            selectAll()
        }
        MaterialAlertDialogBuilder(requireContext())
            .setTitle(R.string.rename_file)
            .setView(input)
            .setPositiveButton(R.string.rename) { _, _ ->
                val newName = input.text.toString().trim()
                if (newName.isNotEmpty() && !viewModel.renameFile(mp3, newName)) {
                    Snackbar.make(binding.root, "Failed to rename file", Snackbar.LENGTH_SHORT).show()
                }
            }
            .setNegativeButton(R.string.cancel, null)
            .show()
    }

    private fun shareFile(mp3: Mp3File) {
        val uri = FileProvider.getUriForFile(
            requireContext(),
            "${requireContext().packageName}.fileprovider",
            File(mp3.path)
        )
        val intent = Intent(Intent.ACTION_SEND).apply {
            type = "audio/mpeg"
            putExtra(Intent.EXTRA_STREAM, uri)
            addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
        }
        startActivity(Intent.createChooser(intent, "Share ${mp3.name}"))
    }

    private fun navigateToPlayer(path: String) {
        val action = FileBrowserFragmentDirections.actionBrowserToPlayer(path)
        findNavController().navigate(action)
    }

    private fun navigateToTagEditor(path: String) {
        val action = FileBrowserFragmentDirections.actionBrowserToTagEditor(path)
        findNavController().navigate(action)
    }

    private fun navigateToTrimmer(path: String) {
        val action = FileBrowserFragmentDirections.actionBrowserToTrimmer(path)
        findNavController().navigate(action)
    }

    override fun onCreateMenu(menu: Menu, inflater: MenuInflater) {
        inflater.inflate(R.menu.menu_file_browser, menu)
        val searchItem = menu.findItem(R.id.action_search)
        val searchView = searchItem.actionView as SearchView
        searchView.setOnQueryTextListener(object : SearchView.OnQueryTextListener {
            override fun onQueryTextSubmit(query: String?) = true
            override fun onQueryTextChange(newText: String?): Boolean {
                viewModel.setSearchQuery(newText ?: "")
                return true
            }
        })
    }

    override fun onMenuItemSelected(item: MenuItem): Boolean {
        return when (item.itemId) {
            R.id.action_refresh -> { viewModel.loadFiles(); true }
            R.id.sort_name -> { viewModel.setSortOrder(SortOrder.NAME); true }
            R.id.sort_date -> { viewModel.setSortOrder(SortOrder.DATE); true }
            R.id.sort_size -> { viewModel.setSortOrder(SortOrder.SIZE); true }
            else -> false
        }
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}
