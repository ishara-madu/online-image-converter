import './style.css';
import { convertImage } from './converter.js';

console.log('PicConvert initialized successfully');

function initApp() {
  // Core Converter elements
  const fileInput = document.getElementById('file-input');
  const formatSelect = document.getElementById('format-select');
  const convertBtn = document.getElementById('convert-btn');
  const statusDiv = document.getElementById('status');
  const resultArea = document.getElementById('result-area');

  // UI elements
  const dropZone = document.getElementById('drop-zone');
  const selectedFileCard = document.getElementById('selected-file-card');
  const selectedFileName = document.getElementById('selected-file-name');
  const selectedFileSize = document.getElementById('selected-file-size');
  const filePreviewThumb = document.getElementById('file-preview-thumb');
  const btnRemoveFile = document.getElementById('btn-remove-file');
  const detectedFormatOpt = document.getElementById('detected-format-opt');
  const mobileMenuToggle = document.getElementById('mobileMenuToggle');
  const mobileMenu = document.getElementById('mobileMenu');
  const topNavbar = document.getElementById('topNavbar');

  if (!fileInput || !convertBtn) {
    console.error('Core elements not found!');
    return;
  }

  let selectedFile = null;

  // Navbar scroll elevation
  window.addEventListener('scroll', () => {
    if (window.scrollY > 15) {
      topNavbar?.classList.add('scrolled');
    } else {
      topNavbar?.classList.remove('scrolled');
    }
  });

  // Mobile menu toggle
  if (mobileMenuToggle && mobileMenu) {
    mobileMenuToggle.addEventListener('click', () => {
      mobileMenu.classList.toggle('show');
    });

    // Close menu when clicking links
    mobileMenu.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        mobileMenu.classList.remove('show');
      });
    });
  }

  // Format file size helper
  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Helper to extract extension
  const getFileExtension = (filename) => {
    return filename.slice(((filename.lastIndexOf('.') - 1) >>> 0) + 2).toUpperCase();
  };

  // Update file selection UI
  const updateFileSelection = (files) => {
    if (files && files.length > 0) {
      selectedFile = files[0];
      const ext = getFileExtension(selectedFile.name) || 'IMAGE';

      if (selectedFileName) selectedFileName.textContent = selectedFile.name;
      if (selectedFileSize) selectedFileSize.textContent = formatBytes(selectedFile.size);
      if (detectedFormatOpt) detectedFormatOpt.textContent = `Input: ${ext} (${formatBytes(selectedFile.size)})`;

      // Set thumbnail if image
      if (filePreviewThumb) {
        if (selectedFile.type.startsWith('image/') && !selectedFile.name.toLowerCase().endsWith('.heic')) {
          filePreviewThumb.src = URL.createObjectURL(selectedFile);
        } else {
          filePreviewThumb.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="%2386868B" stroke-width="2"><rect width="18" height="18" x="3" y="3" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>';
        }
      }

      if (selectedFileCard) selectedFileCard.style.display = 'flex';
      if (dropZone) dropZone.style.display = 'none';

      statusDiv.style.color = '#0071E3';
      statusDiv.textContent = `Selected: ${selectedFile.name}`;
      resultArea.innerHTML = '';
    } else {
      clearSelection();
    }
  };

  // Clear selected file
  const clearSelection = () => {
    selectedFile = null;
    if (fileInput) fileInput.value = '';
    if (selectedFileCard) selectedFileCard.style.display = 'none';
    if (dropZone) dropZone.style.display = 'block';
    if (detectedFormatOpt) detectedFormatOpt.textContent = 'Auto-detected from file';
    statusDiv.textContent = '';
    resultArea.innerHTML = '';
  };

  if (btnRemoveFile) {
    btnRemoveFile.addEventListener('click', clearSelection);
  }

  // File input change
  fileInput.addEventListener('change', (e) => {
    updateFileSelection(e.target.files);
  });

  // Drag & drop handlers
  if (dropZone) {
    ['dragenter', 'dragover'].forEach(eventName => {
      dropZone.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropZone.classList.add('dragover');
      });
    });

    ['dragleave', 'drop'].forEach(eventName => {
      dropZone.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropZone.classList.remove('dragover');
      });
    });

    dropZone.addEventListener('drop', (e) => {
      const dt = e.dataTransfer;
      const files = dt.files;
      if (files && files.length > 0) {
        fileInput.files = files;
        updateFileSelection(files);
      }
    });
  }

  // Convert button click handler
  convertBtn.addEventListener('click', async () => {
    if (!selectedFile) {
      statusDiv.style.color = '#E11D48';
      statusDiv.textContent = 'කරුණාකර පළමුව පින්තූරයක් තෝරන්න (Please select an image file first).';
      return;
    }

    const outputFormatId = formatSelect.value;
    convertBtn.disabled = true;
    convertBtn.innerHTML = `
      <svg class="animate-spin" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="animation: spin 1s linear infinite;">
        <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-opacity="0.25" fill="none"/>
        <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor"/>
      </svg>
      <span>Converting to ${outputFormatId.toUpperCase()}...</span>
    `;

    statusDiv.style.color = '#0071E3';
    statusDiv.textContent = `Processing image conversion to ${outputFormatId.toUpperCase()}...`;
    resultArea.innerHTML = '';

    try {
      const startTime = performance.now();
      const { blob, extension } = await convertImage(selectedFile, outputFormatId);
      const duration = ((performance.now() - startTime) / 1000).toFixed(2);

      const downloadUrl = URL.createObjectURL(blob);
      const lastDotIndex = selectedFile.name.lastIndexOf('.');
      const originalName = lastDotIndex !== -1 ? selectedFile.name.substring(0, lastDotIndex) : selectedFile.name;
      const downloadFileName = `${originalName}-converted.${extension}`;

      statusDiv.style.color = '#15803D';
      statusDiv.textContent = `Conversion completed in ${duration}s!`;

      // Create rich result card
      const resultCard = document.createElement('div');
      resultCard.className = 'result-card';
      resultCard.innerHTML = `
        <div class="result-file-details">
          <div class="result-badge-success">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          </div>
          <div>
            <div style="font-weight: 700; font-size: 0.95rem; color: #1D1D1F;">${downloadFileName}</div>
            <div style="font-size: 0.8rem; color: #4B5563; margin-top: 2px;">
              Size: <strong>${formatBytes(blob.size)}</strong> • Format: <strong>${extension.toUpperCase()}</strong>
            </div>
          </div>
        </div>
      `;

      const downloadLink = document.createElement('a');
      downloadLink.href = downloadUrl;
      downloadLink.download = downloadFileName;
      downloadLink.className = 'result-download-btn';
      downloadLink.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
          <polyline points="7 10 12 15 17 10"/>
          <line x1="12" y1="15" x2="12" y2="3"/>
        </svg>
        <span>Download File</span>
      `;

      resultCard.appendChild(downloadLink);
      resultArea.appendChild(resultCard);

      // Auto trigger download
      downloadLink.click();
    } catch (error) {
      console.error('Conversion Error:', error);
      statusDiv.style.color = '#E11D48';
      statusDiv.textContent = `Error: ${error.message || error}`;
    } finally {
      convertBtn.disabled = false;
      convertBtn.innerHTML = `
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
          <path d="m21.64 3.64-1.28-1.28a1.21 1.21 0 0 0-1.72 0L2.36 18.64a1.21 1.21 0 0 0 0 1.72l1.28 1.28a1.2 1.2 0 0 0 1.72 0L21.64 5.36a1.2 1.2 0 0 0 0-1.72Z"/>
          <path d="m14 7 3 3"/>
          <path d="M5 6v4"/>
          <path d="M19 14v4"/>
          <path d="M10 2v2"/>
          <path d="M7 8H3"/>
          <path d="M21 16h-4"/>
          <path d="M11 3H9"/>
        </svg>
        <span>Convert Image</span>
      `;
    }
  });
}

// Execute safely
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}
