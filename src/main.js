import './style.css';
import { convertImage } from './converter.js';
import JSZip from 'jszip';
import { 
  createIcons, 
  Sparkles, 
  ShieldCheck, 
  Heart, 
  Star,
  Menu, 
  Upload, 
  UploadCloud,
  X, 
  ArrowRight, 
  ChevronDown, 
  ChevronUp,
  ArrowRightLeft, 
  Zap, 
  Layers, 
  Coffee, 
  CreditCard, 
  ExternalLink, 
  Check, 
  CheckCircle2,
  CheckSquare,
  Download,
  FolderArchive,
  Archive,
  AlertTriangle,
  Plus,
  Trash2,
  RefreshCw
} from 'lucide';

const appIcons = {
  Sparkles,
  ShieldCheck,
  Heart,
  Star,
  Menu,
  Upload,
  UploadCloud,
  X,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  ArrowRightLeft,
  Zap,
  Layers,
  Coffee,
  CreditCard,
  ExternalLink,
  Check,
  CheckCircle2,
  CheckSquare,
  Download,
  FolderArchive,
  Archive,
  AlertTriangle,
  Plus,
  Trash2,
  RefreshCw
};

console.log('PicConvert initialized with Balanced Color Palette');

// Safe ZIP Size Limit (800 MB)
const MAX_SAFE_ZIP_SIZE = 800 * 1024 * 1024;

// Concurrency Pool Size
const CONCURRENCY_LIMIT = typeof navigator !== 'undefined' && navigator.hardwareConcurrency 
  ? Math.min(Math.max(navigator.hardwareConcurrency - 1, 2), 4) 
  : 3;

// Format file size helper
const formatBytes = (bytes) => {
  if (!bytes || bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Helper to extract extension
const getFileExtension = (filename) => {
  return filename.slice(((filename.lastIndexOf('.') - 1) >>> 0) + 2).toUpperCase();
};

// Fetch GitHub Stars count
async function fetchGitHubStars() {
  const repoName = 'ishara-madu/pic-convert-vanilla';
  const cacheKey = `gh_stars_${repoName}`;
  const cacheTimeKey = `gh_stars_time_${repoName}`;
  const starElements = document.querySelectorAll('.github-star-count');

  if (!starElements || starElements.length === 0) return;

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
      starElements.forEach(el => el.textContent = 'Star');
    }
  } catch (e) {
    starElements.forEach(el => el.textContent = 'Star');
  }
}

/**
 * Concurrency Pool Queue Runner
 */
async function runConcurrencyQueue(queueToProcess, concurrency, onProgress, onItemUpdate) {
  let currentIndex = 0;
  let completedCount = 0;
  const total = queueToProcess.length;
  const startTime = performance.now();

  async function worker() {
    while (currentIndex < total) {
      const index = currentIndex++;
      const item = queueToProcess[index];

      // Mark converting
      item.status = 'converting';
      if (onItemUpdate) onItemUpdate(item);

      try {
        const conversion = await convertImage(item.file, item.outputFormatId);
        const lastDot = item.name.lastIndexOf('.');
        const baseName = lastDot !== -1 ? item.name.substring(0, lastDot) : item.name;
        const outName = `${baseName}-converted.${conversion.extension}`;

        item.status = 'success';
        item.selected = true; // Auto-mark converted items
        item.resultBlob = conversion.blob;
        item.convertedSize = conversion.blob.size;
        item.originalSize = item.size;
        item.extension = conversion.extension;
        item.outputName = outName;
        item.downloadUrl = URL.createObjectURL(conversion.blob);
      } catch (err) {
        console.error(`Error converting ${item.name}:`, err);
        item.status = 'error';
        item.errorMessage = err.message || 'Conversion failed';
      }

      completedCount++;
      const percent = Math.round((completedCount / total) * 100);
      const elapsed = ((performance.now() - startTime) / 1000).toFixed(1);

      if (onItemUpdate) onItemUpdate(item);

      if (onProgress) {
        onProgress({
          completed: completedCount,
          total,
          percent,
          currentFile: item.name,
          elapsed
        });
      }

      // Micro-delay for UI smoothness
      await new Promise(r => setTimeout(r, 0));
    }
  }

  const workers = [];
  const workerCount = Math.min(concurrency, total);
  for (let i = 0; i < workerCount; i++) {
    workers.push(worker());
  }
  await Promise.all(workers);
}

function initApp() {
  createIcons({ icons: appIcons });
  fetchGitHubStars();

  // Elements
  const fileInput = document.getElementById('file-input');
  const dropZone = document.getElementById('drop-zone');
  const queueManager = document.getElementById('queue-manager');
  const fileItemsWrapper = document.getElementById('fileItemsWrapper');
  const fileItemsList = document.getElementById('file-items-list');
  const listFadeOverlay = document.getElementById('listFadeOverlay');
  const btnShowAll = document.getElementById('btnShowAll');
  const showAllBtnText = document.getElementById('showAllBtnText');
  const showAllBtnIcon = document.getElementById('showAllBtnIcon');
  const dropMoreStrip = document.getElementById('drop-more-strip');

  const queueCountText = document.getElementById('queue-count-text');
  const queueSizeText = document.getElementById('queue-size-text');
  const globalFormatSelect = document.getElementById('global-format-select');
  const btnAddMore = document.getElementById('btnAddMore');
  const btnClearAll = document.getElementById('btnClearAll');

  // Sticky Floating Action Bar Elements
  const stickyActionBarWrapper = document.getElementById('stickyActionBarWrapper');
  const selectAllCheckbox = document.getElementById('selectAllCheckbox');
  const selectAllText = document.getElementById('selectAllText');
  const btnDeleteSelected = document.getElementById('btnDeleteSelected');
  const btnDownloadSelectedZip = document.getElementById('btnDownloadSelectedZip');
  const downloadSelectedZipText = document.getElementById('downloadSelectedZipText');
  const btnConvertSelected = document.getElementById('btnConvertSelected');

  const statusDiv = document.getElementById('status');
  const resultArea = document.getElementById('result-area');

  // Progress Box elements
  const progressBox = document.getElementById('progress-box');
  const progressTitle = document.getElementById('progress-title');
  const progressCount = document.getElementById('progress-count');
  const progressBar = document.getElementById('progress-bar');
  const poolWorkersCount = document.getElementById('pool-workers-count');
  const progressTimeText = document.getElementById('progress-time-text');

  // Navbar & Modals
  const mobileMenuToggle = document.getElementById('mobileMenuToggle');
  const mobileMenu = document.getElementById('mobileMenu');
  const topNavbar = document.getElementById('topNavbar');
  const openDonateModal = document.getElementById('openDonateModal');
  const openDonateModalMobile = document.getElementById('openDonateModalMobile');
  const closeDonateModal = document.getElementById('closeDonateModal');
  const donationModal = document.getElementById('donationModal');

  if (poolWorkersCount) {
    poolWorkersCount.textContent = `${CONCURRENCY_LIMIT} Parallel Workers`;
  }

  // Active File Queue State
  let fileQueue = [];
  let currentGlobalFormat = 'webp';
  let isListExpanded = false;
  let isConverting = false;

  // Navbar scroll elevation
  window.addEventListener('scroll', () => {
    if (window.scrollY > 15) {
      topNavbar?.classList.add('bg-white/95', 'shadow-xs');
      topNavbar?.classList.remove('bg-[#F8FAFC]/85');
    } else {
      topNavbar?.classList.remove('bg-white/95', 'shadow-xs');
      topNavbar?.classList.add('bg-[#F8FAFC]/85');
    }
  });

  // Mobile menu toggle
  if (mobileMenuToggle && mobileMenu) {
    mobileMenuToggle.addEventListener('click', () => {
      const isHidden = mobileMenu.classList.contains('hidden');
      if (isHidden) {
        mobileMenu.classList.remove('hidden');
        mobileMenu.classList.add('flex');
      } else {
        mobileMenu.classList.add('hidden');
        mobileMenu.classList.remove('flex');
      }
    });

    mobileMenu.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        mobileMenu.classList.add('hidden');
        mobileMenu.classList.remove('flex');
      });
    });
  }

  // Donation Modal Logic
  const showDonationModal = () => {
    if (donationModal) {
      donationModal.classList.remove('hidden');
      donationModal.classList.add('flex');
      createIcons({ icons: appIcons });
    }
  };

  const hideDonationModal = () => {
    if (donationModal) {
      donationModal.classList.add('hidden');
      donationModal.classList.remove('flex');
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

  // Available format options helper
  const getFormatOptionsHtml = (selectedFormat) => {
    const formats = [
      { id: 'webp', name: 'WebP (Next-Gen)' },
      { id: 'jpeg', name: 'JPG / JPEG' },
      { id: 'png', name: 'PNG (Lossless)' },
      { id: 'avif', name: 'AVIF (High Comp.)' },
      { id: 'ico', name: 'ICO (Favicon 32x32)' },
      { id: 'gif', name: 'GIF (Static)' },
      { id: 'svg', name: 'SVG (Vector)' },
    ];
    return formats.map(f => `<option value="${f.id}" ${f.id === selectedFormat ? 'selected' : ''}>${f.name}</option>`).join('');
  };

  // Update Sticky Action Bar State
  const updateStickyActionBar = () => {
    if (!stickyActionBarWrapper) return;

    if (fileQueue.length === 0) {
      stickyActionBarWrapper.classList.add('hidden');
      stickyActionBarWrapper.classList.remove('flex');
      return;
    }

    stickyActionBarWrapper.classList.remove('hidden');
    stickyActionBarWrapper.classList.add('flex');

    const selectedItems = fileQueue.filter(i => i.selected);
    const selectedCount = selectedItems.length;
    const totalCount = fileQueue.length;

    // Update Select All Checkbox
    if (selectAllCheckbox) {
      selectAllCheckbox.checked = selectedCount === totalCount && totalCount > 0;
      selectAllCheckbox.indeterminate = selectedCount > 0 && selectedCount < totalCount;
    }

    if (selectAllText) {
      selectAllText.textContent = `Select All (${selectedCount}/${totalCount})`;
    }

    // Delete selected button
    if (btnDeleteSelected) {
      const showDelete = selectedCount > 0 && !isConverting;
      btnDeleteSelected.classList.toggle('hidden', !showDelete);
      btnDeleteSelected.classList.toggle('inline-flex', showDelete);
    }

    // Check how many selected items are pending vs converted
    const pendingSelected = selectedItems.filter(i => i.status !== 'success');
    const convertedSelected = selectedItems.filter(i => i.status === 'success');

    // Download Selected ZIP Button
    if (btnDownloadSelectedZip) {
      const showZip = convertedSelected.length > 0 && !isConverting;
      btnDownloadSelectedZip.classList.toggle('hidden', !showZip);
      btnDownloadSelectedZip.classList.toggle('inline-flex', showZip);

      if (showZip) {
        btnDownloadSelectedZip.innerHTML = `
          <i data-lucide="folder-archive" class="w-4 h-4"></i>
          <span>Download Selected (${convertedSelected.length}) ZIP</span>
        `;
      }
    }

    // Convert Selected Button
    if (btnConvertSelected) {
      if (isConverting) {
        btnConvertSelected.classList.remove('hidden');
        btnConvertSelected.classList.add('inline-flex');
        btnConvertSelected.disabled = true;
      } else if (pendingSelected.length > 0) {
        btnConvertSelected.classList.remove('hidden');
        btnConvertSelected.classList.add('inline-flex');
        btnConvertSelected.disabled = false;
        btnConvertSelected.innerHTML = `
          <i data-lucide="arrow-right-left" class="w-4 h-4"></i>
          <span>Convert ${pendingSelected.length} Selected</span>
        `;
      } else if (convertedSelected.length > 0 && pendingSelected.length === 0) {
        btnConvertSelected.classList.add('hidden');
        btnConvertSelected.classList.remove('inline-flex');
      } else {
        btnConvertSelected.classList.remove('hidden');
        btnConvertSelected.classList.add('inline-flex');
        btnConvertSelected.disabled = true;
        btnConvertSelected.innerHTML = `
          <i data-lucide="arrow-right-left" class="w-4 h-4"></i>
          <span>Convert Selected</span>
        `;
      }
    }

    createIcons({ icons: appIcons });
  };

  // Render individual file item bar with thumbnail-integrated marking
  const renderItemRow = (item) => {
    const row = document.createElement('div');
    row.id = `item-row-${item.id}`;

    let statusBgBorder = 'bg-slate-50/70 border-slate-200 hover:border-slate-300 hover:bg-white';
    if (item.status === 'converting') statusBgBorder = 'bg-indigo-50/40 border-indigo-200';
    else if (item.status === 'success') statusBgBorder = 'bg-emerald-50/40 border-emerald-200';
    else if (item.status === 'error') statusBgBorder = 'bg-rose-50/40 border-rose-200';

    row.className = `flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4 border rounded-2xl p-3 px-4 shadow-2xs transition-all ${statusBgBorder}`;

    let statusContent = '';
    if (item.status === 'pending') {
      statusContent = `<span class="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">Ready</span>`;
    } else if (item.status === 'converting') {
      statusContent = `
        <span class="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
          <svg class="animate-spin w-3.5 h-3.5 text-indigo-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-opacity="0.25" fill="none"/>
            <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor"/>
          </svg>
          <span>Converting...</span>
        </span>
      `;
    } else if (item.status === 'success') {
      const savedPct = item.originalSize && item.originalSize > item.convertedSize 
        ? `(-${Math.round(((item.originalSize - item.convertedSize) / item.originalSize) * 100)}%)`
        : '';
      statusContent = `
        <span class="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200" title="Converted to ${item.extension.toUpperCase()}">
          <i data-lucide="check" class="w-3.5 h-3.5"></i>
          <span>${formatBytes(item.convertedSize)} ${savedPct}</span>
        </span>
        <a href="${item.downloadUrl}" download="${item.outputName}" class="inline-flex items-center justify-center bg-indigo-600 hover:bg-indigo-700 text-white w-7 h-7 rounded-lg hover:scale-105 transition-all shadow-xs shadow-indigo-200 cursor-pointer" title="Click to download ${item.outputName}">
          <i data-lucide="download" class="w-3.5 h-3.5"></i>
        </a>
      `;
    } else if (item.status === 'error') {
      statusContent = `
        <span class="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200" title="${item.errorMessage}">
          <i data-lucide="alert-triangle" class="w-3.5 h-3.5"></i>
          <span>Error</span>
        </span>
      `;
    }

    row.innerHTML = `
      <!-- Left: Thumbnail (acts as clickable select / mark trigger) & File Meta -->
      <div class="flex items-center gap-3 min-w-0 flex-1">
        <div class="file-item-thumb-wrapper relative w-11 h-11 rounded-xl cursor-pointer shrink-0 select-none border bg-white hover:scale-105 transition-all group ${item.selected ? 'border-indigo-600 ring-2 ring-indigo-500/20' : 'border-slate-200'}" data-id="${item.id}" title="${item.selected ? 'Click to unmark' : 'Click to mark'}">
          <img class="w-full h-full rounded-lg object-cover block" src="${item.thumbUrl}" alt="Thumbnail" />
          <div class="thumb-check-overlay absolute -top-1 -right-1 w-4.5 h-4.5 rounded-full text-white border-2 border-white flex items-center justify-center shadow-xs transition-all ${item.selected ? 'bg-indigo-600 scale-100 opacity-100' : 'bg-slate-400 scale-75 opacity-0 group-hover:opacity-75 group-hover:scale-90'}">
            <i data-lucide="check" class="w-3 h-3 stroke-[3.5]"></i>
          </div>
        </div>
        <div class="min-w-0 flex-1">
          <div class="text-xs sm:text-sm font-bold text-slate-900 truncate max-w-[180px] sm:max-w-[280px]" title="${item.name}">${item.name}</div>
          <div class="text-[11px] text-slate-500 mt-0.5 font-medium">${formatBytes(item.size)}</div>
        </div>
      </div>

      <!-- Center: Input Format -> Arrow -> Individual Output Format Select -->
      <div class="flex items-center justify-center gap-2 bg-white px-2.5 py-1.5 rounded-xl border border-slate-200 shrink-0">
        <span class="inline-flex items-center bg-slate-100 text-slate-700 text-xs font-bold px-2 py-0.5 rounded-md border border-slate-200 uppercase">${item.inputExt}</span>
        <i data-lucide="arrow-right" class="w-3.5 h-3.5 text-indigo-500"></i>
        <div class="relative min-w-[135px] flex items-center">
          <select class="item-format-select w-full appearance-none bg-white border border-slate-300 rounded-lg py-1 pr-6 pl-2.5 text-xs font-bold text-slate-800 outline-none focus:border-indigo-500 cursor-pointer" data-id="${item.id}" ${item.status === 'converting' ? 'disabled' : ''}>
            ${getFormatOptionsHtml(item.outputFormatId)}
          </select>
          <i data-lucide="chevron-down" class="w-3.5 h-3.5 text-slate-400 absolute right-1.5 pointer-events-none"></i>
        </div>
      </div>

      <!-- Right: Status / Direct Download & Remove Button -->
      <div class="flex items-center justify-between sm:justify-end gap-2 shrink-0">
        ${statusContent}
        <button type="button" class="btn-item-remove inline-flex items-center justify-center bg-slate-100 hover:bg-rose-50 text-slate-400 hover:text-rose-600 w-7 h-7 rounded-full transition-colors cursor-pointer border border-transparent hover:border-rose-200" data-id="${item.id}" title="Remove file">
          <i data-lucide="x" class="w-3.5 h-3.5"></i>
        </button>
      </div>
    `;

    // Bind thumbnail click to toggle marking
    const thumbWrapper = row.querySelector('.file-item-thumb-wrapper');
    if (thumbWrapper) {
      thumbWrapper.addEventListener('click', () => {
        item.selected = !item.selected;
        renderQueueUI();
      });
    }

    // Bind change on individual format select
    const selectEl = row.querySelector('.item-format-select');
    if (selectEl) {
      selectEl.addEventListener('change', (e) => {
        item.outputFormatId = e.target.value;
      });
    }

    // Bind remove button
    const removeBtn = row.querySelector('.btn-item-remove');
    if (removeBtn) {
      removeBtn.addEventListener('click', () => {
        removeFileFromQueue(item.id);
      });
    }

    return row;
  };

  // Update specific row in DOM
  const updateItemRowInDOM = (item) => {
    const existingRow = document.getElementById(`item-row-${item.id}`);
    if (existingRow) {
      const newRow = renderItemRow(item);
      existingRow.replaceWith(newRow);
      createIcons({ icons: appIcons });
    }
  };

  // Render the entire queue list
  const renderQueueUI = () => {
    if (!fileItemsList) return;
    fileItemsList.innerHTML = '';

    if (fileQueue.length === 0) {
      if (dropZone) {
        dropZone.classList.remove('hidden');
        dropZone.classList.add('flex');
      }
      if (queueManager) {
        queueManager.classList.add('hidden');
        queueManager.classList.remove('flex');
      }
      if (stickyActionBarWrapper) {
        stickyActionBarWrapper.classList.add('hidden');
        stickyActionBarWrapper.classList.remove('flex');
      }
      if (progressBox) {
        progressBox.classList.add('hidden');
        progressBox.classList.remove('block');
      }
      if (listFadeOverlay) {
        listFadeOverlay.classList.add('hidden');
        listFadeOverlay.classList.remove('flex');
      }
      statusDiv.textContent = '';
      resultArea.innerHTML = '';
      return;
    }

    // Queue has files
    if (dropZone) {
      dropZone.classList.add('hidden');
      dropZone.classList.remove('flex');
    }
    if (queueManager) {
      queueManager.classList.remove('hidden');
      queueManager.classList.add('flex');
    }

    const totalBytes = fileQueue.reduce((sum, item) => sum + item.size, 0);
    if (queueCountText) queueCountText.textContent = `${fileQueue.length} ${fileQueue.length === 1 ? 'Image' : 'Images'} in Queue`;
    if (queueSizeText) queueSizeText.textContent = `Total: ${formatBytes(totalBytes)}`;

    fileQueue.forEach(item => {
      const rowEl = renderItemRow(item);
      fileItemsList.appendChild(rowEl);
    });

    // Handle Progressive Disclosure & Fade Overlay (When more than 3 images)
    if (fileQueue.length > 3) {
      listFadeOverlay?.classList.remove('hidden');
      listFadeOverlay?.classList.add('flex');
      if (isListExpanded) {
        fileItemsList.classList.remove('max-h-[260px]');
        fileItemsList.classList.add('max-h-none');
        listFadeOverlay?.classList.remove('absolute', 'bottom-0', 'h-24', 'bg-gradient-to-t');
        listFadeOverlay?.classList.add('static', 'h-auto', 'bg-none', 'pt-2');
        if (showAllBtnText) showAllBtnText.textContent = 'Show Less';
        if (showAllBtnIcon) showAllBtnIcon.setAttribute('data-lucide', 'chevron-up');
      } else {
        fileItemsList.classList.add('max-h-[260px]');
        fileItemsList.classList.remove('max-h-none');
        listFadeOverlay?.classList.add('absolute', 'bottom-0', 'h-24', 'bg-gradient-to-t');
        listFadeOverlay?.classList.remove('static', 'h-auto', 'bg-none', 'pt-2');
        if (showAllBtnText) showAllBtnText.textContent = `Show all ${fileQueue.length} images`;
        if (showAllBtnIcon) showAllBtnIcon.setAttribute('data-lucide', 'chevron-down');
      }
    } else {
      listFadeOverlay?.classList.add('hidden');
      listFadeOverlay?.classList.remove('flex');
      fileItemsList.classList.remove('max-h-[260px]');
      fileItemsList.classList.add('max-h-none');
    }

    updateStickyActionBar();
    createIcons({ icons: appIcons });
  };

  // Toggle Show All / Show Less button
  if (btnShowAll) {
    btnShowAll.addEventListener('click', () => {
      isListExpanded = !isListExpanded;
      renderQueueUI();
    });
  }

  // Toggle Select All / Mark All
  if (selectAllCheckbox) {
    selectAllCheckbox.addEventListener('change', (e) => {
      const shouldSelect = e.target.checked;
      fileQueue.forEach(item => {
        item.selected = shouldSelect;
      });
      renderQueueUI();
    });
  }

  // Delete Selected
  if (btnDeleteSelected) {
    btnDeleteSelected.addEventListener('click', () => {
      const initialCount = fileQueue.length;
      fileQueue = fileQueue.filter(item => !item.selected);
      const deletedCount = initialCount - fileQueue.length;
      renderQueueUI();
      statusDiv.style.color = '#0F172A';
      statusDiv.textContent = `Removed ${deletedCount} selected image(s).`;
    });
  }

  // Append new files to queue
  const appendFilesToQueue = (files) => {
    if (!files || files.length === 0) return;

    const newItems = Array.from(files).map(file => {
      let thumbUrl = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="%236366F1" stroke-width="2"><rect width="18" height="18" x="3" y="3" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>';
      if (file.type.startsWith('image/') && !file.name.toLowerCase().endsWith('.heic')) {
        thumbUrl = URL.createObjectURL(file);
      }

      return {
        id: 'file_' + Math.random().toString(36).substr(2, 9) + Date.now(),
        file,
        name: file.name,
        size: file.size,
        inputExt: getFileExtension(file.name) || 'IMG',
        outputFormatId: currentGlobalFormat || 'webp',
        status: 'pending',
        selected: true, // Marked by default
        thumbUrl,
        resultBlob: null,
        convertedSize: null,
        originalSize: file.size,
        downloadUrl: null,
        errorMessage: null
      };
    });

    fileQueue.push(...newItems);
    isConverting = false;
    renderQueueUI();

    statusDiv.style.color = '#4F46E5';
    statusDiv.textContent = `Added ${newItems.length} image(s) • Total in Queue: ${fileQueue.length}`;
    resultArea.innerHTML = '';
  };

  // Remove single file from queue
  const removeFileFromQueue = (id) => {
    fileQueue = fileQueue.filter(item => item.id !== id);
    renderQueueUI();
  };

  // Clear all files
  const clearAllQueue = () => {
    fileQueue = [];
    isListExpanded = false;
    isConverting = false;
    if (fileInput) fileInput.value = '';
    renderQueueUI();
  };

  if (btnClearAll) {
    btnClearAll.addEventListener('click', clearAllQueue);
  }

  // Trigger Add More
  if (btnAddMore) {
    btnAddMore.addEventListener('click', () => {
      fileInput.click();
    });
  }

  const setDragHighlight = (el, isDragging) => {
    if (!el) return;
    const highlightClasses = ['border-blue-500', 'bg-blue-50/70', 'ring-4', 'ring-blue-500/20', 'shadow-xl', 'shadow-blue-500/10', 'scale-[1.008]'];
    const defaultClasses = ['border-black', 'bg-white'];
    if (isDragging) {
      el.classList.remove(...defaultClasses);
      el.classList.add(...highlightClasses);
    } else {
      el.classList.remove(...highlightClasses);
      el.classList.add(...defaultClasses);
    }
  };

  if (dropMoreStrip) {
    dropMoreStrip.addEventListener('click', () => {
      fileInput.click();
    });
    dropMoreStrip.addEventListener('dragover', (e) => {
      e.preventDefault();
      setDragHighlight(dropMoreStrip, true);
    });
    dropMoreStrip.addEventListener('dragleave', () => {
      setDragHighlight(dropMoreStrip, false);
    });
    dropMoreStrip.addEventListener('drop', () => {
      setDragHighlight(dropMoreStrip, false);
    });
  }

  if (dropZone) {
    dropZone.addEventListener('click', () => {
      fileInput.click();
    });
    dropZone.addEventListener('dragover', (e) => {
      e.preventDefault();
      setDragHighlight(dropZone, true);
    });
    dropZone.addEventListener('dragleave', () => {
      setDragHighlight(dropZone, false);
    });
    dropZone.addEventListener('drop', () => {
      setDragHighlight(dropZone, false);
    });
  }

  // File Input Changed
  fileInput.addEventListener('change', (e) => {
    appendFilesToQueue(e.target.files);
    fileInput.value = '';
  });

  // Global Output Format change -> updates all rows
  if (globalFormatSelect) {
    globalFormatSelect.addEventListener('change', (e) => {
      currentGlobalFormat = e.target.value;
      fileQueue.forEach(item => {
        if (item.status !== 'success') {
          item.outputFormatId = currentGlobalFormat;
        }
      });
      renderQueueUI();
      statusDiv.style.color = '#4F46E5';
      statusDiv.textContent = `Applied output format "${currentGlobalFormat.toUpperCase()}" to all pending images.`;
    });
  }

  // ==========================================================================
  // GLOBAL FULL-SCREEN DRAG & DROP
  // ==========================================================================
  let globalDragCount = 0;

  window.addEventListener('dragenter', (e) => {
    e.preventDefault();
    globalDragCount++;
    if (e.dataTransfer && e.dataTransfer.types && Array.from(e.dataTransfer.types).includes('Files')) {
      document.body.classList.add('global-dragging');
    }
  });

  window.addEventListener('dragleave', (e) => {
    e.preventDefault();
    globalDragCount--;
    if (globalDragCount <= 0) {
      globalDragCount = 0;
      document.body.classList.remove('global-dragging');
    }
  });

  window.addEventListener('dragover', (e) => {
    e.preventDefault();
  });

  window.addEventListener('drop', (e) => {
    e.preventDefault();
    globalDragCount = 0;
    document.body.classList.remove('global-dragging');

    if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      appendFilesToQueue(e.dataTransfer.files);
    }
  });

  // ==========================================================================
  // CONVERT SELECTED ACTION
  // ==========================================================================
  if (btnConvertSelected) {
    btnConvertSelected.addEventListener('click', async () => {
      const selectedToConvert = fileQueue.filter(i => i.selected && i.status !== 'success');
      if (selectedToConvert.length === 0) {
        statusDiv.style.color = '#E11D48';
        statusDiv.textContent = 'කරුණාකර Convert කිරීමට පින්තූර තෝරන්න (Please select images to convert).';
        return;
      }

      const totalCount = selectedToConvert.length;
      isConverting = true;
      btnConvertSelected.disabled = true;
      btnConvertSelected.innerHTML = `
        <svg class="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-opacity="0.25" fill="none"/>
          <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor"/>
        </svg>
        <span>Converting (${totalCount})...</span>
      `;

      // Show Progress Bar
      if (progressBox) {
        progressBox.classList.remove('hidden');
        progressBox.classList.add('block');
        progressBar.style.width = '0%';
        progressTitle.textContent = `Processing with ${CONCURRENCY_LIMIT} Parallel Workers...`;
        progressCount.textContent = `0 / ${totalCount} (0%)`;
        progressTimeText.textContent = `0.0s elapsed`;
      }

      statusDiv.style.color = '#4F46E5';
      statusDiv.textContent = `Processing ${totalCount} selected images across parallel worker threads...`;
      resultArea.innerHTML = '';

      try {
        const startTime = performance.now();

        // Run Concurrency Queue for selected items
        await runConcurrencyQueue(
          selectedToConvert,
          CONCURRENCY_LIMIT,
          ({ completed, total, percent, currentFile, elapsed }) => {
            if (progressBar) progressBar.style.width = `${percent}%`;
            if (progressCount) progressCount.textContent = `${completed} / ${total} (${percent}%)`;
            if (progressTitle) progressTitle.textContent = `Converting: ${currentFile}`;
            if (progressTimeText) progressTimeText.textContent = `${elapsed}s elapsed`;
          },
          (updatedItem) => {
            updateItemRowInDOM(updatedItem);
          }
        );

        const totalDuration = ((performance.now() - startTime) / 1000).toFixed(2);
        const successful = selectedToConvert.filter(r => r.status === 'success');

        statusDiv.style.color = '#15803D';
        statusDiv.textContent = `Finished ${successful.length} of ${totalCount} image(s) in ${totalDuration}s! Click download button to save.`;
      } catch (error) {
        console.error('Batch Conversion Error:', error);
        statusDiv.style.color = '#E11D48';
        statusDiv.textContent = `Error: ${error.message || error}`;
      } finally {
        isConverting = false;
        updateStickyActionBar();
        createIcons({ icons: appIcons });
      }
    });
  }

  // ==========================================================================
  // DOWNLOAD SELECTED AS ZIP ACTION
  // ==========================================================================
  if (btnDownloadSelectedZip) {
    btnDownloadSelectedZip.addEventListener('click', async () => {
      const convertedSelected = fileQueue.filter(i => i.selected && i.status === 'success');
      if (convertedSelected.length === 0) return;

      const totalConvertedBytes = convertedSelected.reduce((sum, i) => sum + i.convertedSize, 0);

      // Check Safe Limit
      if (totalConvertedBytes > MAX_SAFE_ZIP_SIZE) {
        alert(`Selected files total size (${formatBytes(totalConvertedBytes)}) exceeds safe ZIP limit (800 MB). Please download files individually to ensure stability.`);
        return;
      }

      btnDownloadSelectedZip.disabled = true;
      btnDownloadSelectedZip.innerHTML = `
        <svg class="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-opacity="0.25" fill="none"/>
          <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor"/>
        </svg>
        <span>Packaging ZIP (${formatBytes(totalConvertedBytes)})...</span>
      `;

      try {
        const zip = new JSZip();
        const usedNames = new Set();

        for (const item of convertedSelected) {
          let finalName = item.outputName;
          let counter = 1;
          while (usedNames.has(finalName)) {
            const dotIdx = item.outputName.lastIndexOf('.');
            const base = dotIdx !== -1 ? item.outputName.substring(0, dotIdx) : item.outputName;
            const ext = dotIdx !== -1 ? item.outputName.substring(dotIdx) : '';
            finalName = `${base} (${counter})${ext}`;
            counter++;
          }
          usedNames.add(finalName);
          zip.file(finalName, item.resultBlob);
        }

        const zipBlob = await zip.generateAsync({
          type: 'blob',
          compression: 'DEFLATE',
          compressionOptions: { level: 3 }
        });

        const zipUrl = URL.createObjectURL(zipBlob);
        const zipLink = document.createElement('a');
        zipLink.href = zipUrl;
        zipLink.download = `pic-convert-selected-${convertedSelected.length}-images.zip`;
        zipLink.click();

        btnDownloadSelectedZip.innerHTML = `
          <i data-lucide="check" class="w-4 h-4"></i>
          <span>ZIP Downloaded!</span>
        `;
      } catch (zErr) {
        console.error('ZIP packaging error:', zErr);
        alert('Error creating ZIP file: ' + zErr.message);
        btnDownloadSelectedZip.innerHTML = `
          <i data-lucide="folder-archive" class="w-4 h-4"></i>
          <span>Retry Download ZIP</span>
        `;
      } finally {
        btnDownloadSelectedZip.disabled = false;
        createIcons({ icons: appIcons });
      }
    });
  }
}

// Execute safely
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}
