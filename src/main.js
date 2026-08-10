import './style.css';
import { convertImage } from './converter.js';
import { 
  createIcons, 
  Sparkles, 
  ShieldCheck, 
  Heart, 
  Star,
  Menu, 
  Upload, 
  X, 
  ArrowRight, 
  ChevronDown, 
  ArrowRightLeft, 
  Zap, 
  Layers, 
  Coffee, 
  CreditCard, 
  ExternalLink, 
  Check, 
  Download 
} from 'lucide';

const appIcons = {
  Sparkles,
  ShieldCheck,
  Heart,
  Star,
  Menu,
  Upload,
  X,
  ArrowRight,
  ChevronDown,
  ArrowRightLeft,
  Zap,
  Layers,
  Coffee,
  CreditCard,
  ExternalLink,
  Check,
  Download
};

console.log('PicConvert initialized successfully with Lucide icons');

// Fetch GitHub Stars count
async function fetchGitHubStars() {
  const repoName = 'ishara-madu/pic-convert-vanilla';
  const cacheKey = `gh_stars_${repoName}`;
  const cacheTimeKey = `gh_stars_time_${repoName}`;
  const starElements = document.querySelectorAll('.github-star-count');

  if (!starElements || starElements.length === 0) return;

  // Check localStorage cache (15 min cache to prevent rate limit)
  const cachedStars = localStorage.getItem(cacheKey);
  const cachedTime = localStorage.getItem(cacheTimeKey);
  if (cachedStars && cachedTime && (Date.now() - parseInt(cachedTime, 10) < 15 * 60 * 1000)) {
    starElements.forEach(el => el.textContent = cachedStars);
    return;
  }

  try {
    const res = await fetch(`https://api.github.com/repos/${repoName}`);
    if (res.ok) {
      const data = await res.json();
      const count = typeof data.stargazers_count === 'number' ? data.stargazers_count : 0;
      const formatted = count >= 1000 ? (count / 1000).toFixed(1) + 'k' : `${count}`;
      localStorage.setItem(cacheKey, formatted);
      localStorage.setItem(cacheTimeKey, Date.now().toString());
      starElements.forEach(el => el.textContent = formatted);
    } else {
      // Graceful fallback
      starElements.forEach(el => el.textContent = 'Star');
    }
  } catch (e) {
    starElements.forEach(el => el.textContent = 'Star');
  }
}

function initApp() {
  // Render Lucide Icons
  createIcons({ icons: appIcons });

  // Fetch GitHub stars
  fetchGitHubStars();

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

  // Donation Modal elements
  const openDonateModal = document.getElementById('openDonateModal');
  const openDonateModalMobile = document.getElementById('openDonateModalMobile');
  const closeDonateModal = document.getElementById('closeDonateModal');
  const donationModal = document.getElementById('donationModal');

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

    mobileMenu.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        mobileMenu.classList.remove('show');
      });
    });
  }

  // Donation Modal Logic
  const showDonationModal = () => {
    if (donationModal) {
      donationModal.classList.add('show');
      createIcons({ icons: appIcons });
    }
  };

  const hideDonationModal = () => {
    if (donationModal) {
      donationModal.classList.remove('show');
    }
  };

  if (openDonateModal) openDonateModal.addEventListener('click', showDonationModal);
  if (openDonateModalMobile) openDonateModalMobile.addEventListener('click', showDonationModal);
  if (closeDonateModal) closeDonateModal.addEventListener('click', hideDonationModal);

  if (donationModal) {
    donationModal.addEventListener('click', (e) => {
      if (e.target === donationModal) hideDonationModal();
    });
  }

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') hideDonationModal();
  });

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
      createIcons({ icons: appIcons });
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
    createIcons({ icons: appIcons });
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

      // Create rich result card with Lucide icons
      const resultCard = document.createElement('div');
      resultCard.className = 'result-card';
      resultCard.innerHTML = `
        <div class="result-file-details">
          <div class="result-badge-success">
            <i data-lucide="check" style="width: 20px; height: 20px;"></i>
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
        <i data-lucide="download" style="width: 16px; height: 16px;"></i>
        <span>Download File</span>
      `;

      resultCard.appendChild(downloadLink);
      resultArea.appendChild(resultCard);

      // Re-initialize Lucide Icons for dynamic content
      createIcons({ icons: appIcons });

      // Auto trigger download
      downloadLink.click();
    } catch (error) {
      console.error('Conversion Error:', error);
      statusDiv.style.color = '#E11D48';
      statusDiv.textContent = `Error: ${error.message || error}`;
    } finally {
      convertBtn.disabled = false;
      convertBtn.innerHTML = `
        <i data-lucide="arrow-right-left" style="width: 20px; height: 20px;"></i>
        <span>Convert Image</span>
      `;
      createIcons({ icons: appIcons });
    }
  });
}

// Execute safely
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}
