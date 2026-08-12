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
  RefreshCw,
  SlidersHorizontal,
  File,
  FileImage,
  Image
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
  RefreshCw,
  SlidersHorizontal,
  File,
  FileImage,
  Image
};

console.log('Online Image Converter initialized with Smart Interactive Focus & SEO Knowledge Engine');

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

// Clean Formats List Definition
const FORMAT_LIST = [
  { id: 'webp', name: 'WebP', desc: 'Next-Gen' },
  { id: 'jpeg', name: 'JPG / JPEG', desc: 'Standard' },
  { id: 'png', name: 'PNG', desc: 'Lossless' },
  { id: 'avif', name: 'AVIF', desc: 'High Comp.' },
  { id: 'ico', name: 'ICO', desc: 'Favicon' },
  { id: 'gif', name: 'GIF', desc: 'Static' },
  { id: 'svg', name: 'SVG', desc: 'Vector' }
];

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
        const conversion = await convertImage(item.file, item.outputFormatId, item.options);
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

  const workers = Array.from({ length: Math.min(concurrency, total) }, () => worker());
  await Promise.all(workers);
}

// Initialize Application UI Logic
document.addEventListener('DOMContentLoaded', () => {
  createIcons({ icons: appIcons });
  fetchGitHubStars();

  // DOM Elements Selection
  const dropZone = document.getElementById('drop-zone');
  const fileInput = document.getElementById('file-input');
  const queueManager = document.getElementById('queue-manager');
  const fileItemsList = document.getElementById('file-items-list');
  const listFadeOverlay = document.getElementById('listFadeOverlay');
  const btnShowAll = document.getElementById('btnShowAll');
  const showAllBtnText = document.getElementById('showAllBtnText');
  const showAllBtnIcon = document.getElementById('showAllBtnIcon');
  const dropMoreStrip = document.getElementById('drop-more-strip');

  const queueCountText = document.getElementById('queue-count-text');
  const queueSizeText = document.getElementById('queue-size-text');

  // Custom Global Format Dropdown Elements
  const globalFormatDropdown = document.getElementById('global-format-dropdown');
  const globalFormatBtn = document.getElementById('global-format-btn');
  const globalFormatLabel = document.getElementById('global-format-label');
  const globalFormatChevron = document.getElementById('global-format-chevron');
  const globalFormatMenu = document.getElementById('global-format-menu');
  const btnGlobalOptions = document.getElementById('btnGlobalOptions');

  // Format Guide Interactive Elements
  const formatTabButtons = document.querySelectorAll('.format-tab-btn');
  const formatPanels = document.querySelectorAll('.format-panel');
  const activeFocusBadge = document.getElementById('activeFocusBadge');
  const activeFocusBadgeText = document.getElementById('activeFocusBadgeText');

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
  const openDonateModal = document.getElementById('openDonateModal');
  const openDonateModalMobile = document.getElementById('openDonateModalMobile');
  const closeDonateModal = document.getElementById('closeDonateModal');
  const donationModal = document.getElementById('donationModal');

  // Options Modal Elements
  const optionsModal = document.getElementById('optionsModal');
  const closeOptionsModal = document.getElementById('closeOptionsModal');
  const optionsModalTitle = document.getElementById('optionsModalTitle');
  const optionsModalSubtitle = document.getElementById('optionsModalSubtitle');
  const modalOptWidth = document.getElementById('modalOptWidth');
  const modalOptHeight = document.getElementById('modalOptHeight');
  const modalOptFit = document.getElementById('modalOptFit');
  const modalFitDropdown = document.getElementById('modal-fit-dropdown');
  const modalFitBtn = document.getElementById('modal-fit-btn');
  const modalFitLabel = document.getElementById('modal-fit-label');
  const modalFitMenu = document.getElementById('modal-fit-menu');
  const modalOptQualityRange = document.getElementById('modalOptQualityRange');
  const modalOptQualityNum = document.getElementById('modalOptQualityNum');
  const btnResetOptions = document.getElementById('btnResetOptions');
  const btnCancelOptions = document.getElementById('btnCancelOptions');
  const btnSaveOptions = document.getElementById('btnSaveOptions');

  if (poolWorkersCount) {
    poolWorkersCount.textContent = `${CONCURRENCY_LIMIT} Parallel Workers`;
  }

  // Active File Queue State & Default Options
  let fileQueue = [];
  let currentGlobalFormat = 'webp';
  let isListExpanded = false;
  let isConverting = false;

  // Global Default Conversion Options
  let globalOptions = {
    width: '',
    height: '',
    fit: 'max',
    quality: 90,
    strip: 'yes'
  };

  // Currently editing target in Options Modal (null = global, or itemId)
  let currentEditingTargetId = null;

  // ==========================================================================
  // SMART INTERACTIVE FORMAT FOCUS & GUIDE LOGIC
  // ==========================================================================
  const focusFormatGuide = (formatKey, contextLabel = null) => {
    if (!formatKey) return;
    let normalizedKey = formatKey.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (normalizedKey === 'jpg') normalizedKey = 'jpeg';
    if (normalizedKey === 'heif') normalizedKey = 'heic';

    const targetPanel = document.getElementById(`format-panel-${normalizedKey}`);
    if (!targetPanel) return;

    // Update Tab Buttons
    formatTabButtons.forEach(btn => {
      const btnFormat = btn.getAttribute('data-format');
      const isActive = btnFormat === normalizedKey;
      btn.classList.toggle('active', isActive);

      // Active styling (Clean solid dark tab with crisp contrast)
      btn.classList.toggle('bg-slate-900', isActive);
      btn.classList.toggle('text-white', isActive);
      btn.classList.toggle('border-slate-900', isActive);
      btn.classList.toggle('font-bold', isActive);
      btn.classList.toggle('shadow-xs', isActive);

      // Inactive styling (Clean white card button with subtle border)
      btn.classList.toggle('bg-white', !isActive);
      btn.classList.toggle('text-slate-700', !isActive);
      btn.classList.toggle('border-slate-200', !isActive);
      btn.classList.toggle('font-semibold', !isActive);
      btn.classList.toggle('hover:bg-slate-100', !isActive);

      // Remove legacy awkward rings
      btn.classList.remove('ring-2', 'ring-indigo-500/20', 'text-indigo-700', 'border-slate-300', 'bg-slate-100');

      btn.setAttribute('aria-selected', isActive ? 'true' : 'false');
    });

    // Update Panels
    formatPanels.forEach(panel => {
      const isTarget = panel.id === `format-panel-${normalizedKey}`;
      panel.classList.toggle('hidden', !isTarget);
      panel.classList.toggle('flex', isTarget);
    });

    // Update Live Focus Badge
    const fmtDisplay = normalizedKey === 'jpeg' ? 'JPG / JPEG' : normalizedKey.toUpperCase();
    if (activeFocusBadgeText) {
      activeFocusBadgeText.textContent = contextLabel ? `${contextLabel}: ${fmtDisplay}` : `Focus: ${fmtDisplay}`;
    }
  };

  // Bind Tab Click Handlers
  formatTabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const fmt = btn.getAttribute('data-format');
      if (fmt) focusFormatGuide(fmt, 'Browsing Guide');
    });
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

  // Donation Modal Handlers
  const showDonationModal = () => {
    if (donationModal) {
      donationModal.classList.remove('hidden');
      donationModal.classList.add('flex');
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

  // ==========================================================================
  // CUSTOM GLOBAL FORMAT DROPDOWN LOGIC
  // ==========================================================================
  const renderGlobalFormatMenu = () => {
    if (!globalFormatMenu) return;
    globalFormatMenu.innerHTML = FORMAT_LIST.map(f => {
      const isSelected = f.id === currentGlobalFormat;
      return `
        <button type="button" class="global-format-option w-full flex items-center justify-between px-3.5 py-2 text-xs sm:text-sm font-bold text-slate-800 hover:bg-indigo-50 hover:text-indigo-700 transition-colors text-left cursor-pointer whitespace-nowrap ${isSelected ? 'bg-indigo-50/70 text-indigo-700 font-extrabold' : ''}" data-value="${f.id}">
          <div class="flex items-center gap-2 min-w-0">
            <span class="font-bold whitespace-nowrap">${f.name}</span>
            <span class="text-[11px] text-slate-400 font-normal whitespace-nowrap">(${f.desc})</span>
          </div>
          ${isSelected ? '<i data-lucide="check" class="w-4 h-4 text-indigo-600 shrink-0 ml-2"></i>' : '<span class="w-4 ml-2 shrink-0"></span>'}
        </button>
      `;
    }).join('');

    createIcons({ icons: appIcons });

    globalFormatMenu.querySelectorAll('.global-format-option').forEach(btn => {
      btn.addEventListener('click', () => {
        const val = btn.getAttribute('data-value');
        if (val) {
          currentGlobalFormat = val;
          const fmtObj = FORMAT_LIST.find(f => f.id === val);
          if (globalFormatLabel && fmtObj) {
            globalFormatLabel.textContent = fmtObj.name.toUpperCase();
          }

          // Apply to all pending queue items
          fileQueue.forEach(item => {
            if (item.status !== 'success') {
              item.outputFormatId = currentGlobalFormat;
            }
          });

          renderQueueUI();
          statusDiv.style.color = '#4F46E5';
          statusDiv.textContent = `Applied output format "${fmtObj ? fmtObj.name : val}" to all pending images.`;

          // Focus target format guide in the SEO section
          focusFormatGuide(val, 'Target Output');

          closeAllDropdowns();
          renderGlobalFormatMenu();
        }
      });
    });
  };

  const setGlobalChevron = (isOpen) => {
    const chevron = document.querySelector('#global-format-btn .lucide-chevron-down, #global-format-btn [data-lucide="chevron-down"], #global-format-chevron');
    if (chevron) {
      chevron.classList.toggle('rotate-180', isOpen);
    }
  };

  const toggleGlobalFormatDropdown = () => {
    if (!globalFormatMenu) return;
    const isHidden = globalFormatMenu.classList.contains('hidden');
    closeAllDropdowns();
    if (isHidden) {
      globalFormatMenu.classList.remove('hidden');
      globalFormatMenu.classList.add('flex');
      setGlobalChevron(true);
      globalFormatBtn?.setAttribute('aria-expanded', 'true');
    }
  };

  if (globalFormatBtn) {
    globalFormatBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleGlobalFormatDropdown();
    });
  }

  renderGlobalFormatMenu();

  // ==========================================================================
  // CUSTOM MODAL FIT DROPDOWN LOGIC
  // ==========================================================================
  const setModalFitChevron = (isOpen) => {
    const chevron = document.querySelector('#modal-fit-btn .lucide-chevron-down, #modal-fit-btn [data-lucide="chevron-down"], #modal-fit-chevron');
    if (chevron) {
      chevron.classList.toggle('rotate-180', isOpen);
    }
  };

  const setModalFitValue = (val) => {
    if (!modalOptFit || !modalFitLabel) return;
    modalOptFit.value = val;
    modalFitLabel.textContent = val.toUpperCase();

    if (modalFitMenu) {
      modalFitMenu.querySelectorAll('.fit-option-btn').forEach(btn => {
        const isMatch = btn.getAttribute('data-value') === val;
        btn.classList.toggle('bg-indigo-50/70', isMatch);
        btn.classList.toggle('text-indigo-700', isMatch);
        btn.classList.toggle('font-extrabold', isMatch);
        const checkIcon = btn.querySelector('.fit-check');
        if (checkIcon) {
          checkIcon.classList.toggle('hidden', !isMatch);
        }
      });
    }
  };

  const toggleModalFitDropdown = () => {
    if (!modalFitMenu) return;
    const isHidden = modalFitMenu.classList.contains('hidden');
    closeAllDropdowns();
    if (isHidden) {
      modalFitMenu.classList.remove('hidden');
      modalFitMenu.classList.add('flex');
      setModalFitChevron(true);
    }
  };

  if (modalFitBtn) {
    modalFitBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleModalFitDropdown();
    });
  }

  if (modalFitMenu) {
    modalFitMenu.querySelectorAll('.fit-option-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const val = btn.getAttribute('data-value');
        if (val) {
          setModalFitValue(val);
          closeAllDropdowns();
        }
      });
    });
  }

  // ==========================================================================
  // CONVERSION OPTIONS MODAL HANDLERS
  // ==========================================================================
  const showOptionsModal = (targetId = null) => {
    if (!optionsModal) return;
    currentEditingTargetId = targetId;

    let targetOptions = globalOptions;
    if (targetId !== null) {
      const item = fileQueue.find(i => i.id === targetId);
      if (item) {
        targetOptions = item.options || { ...globalOptions };
        if (optionsModalTitle) optionsModalTitle.textContent = `Options: ${item.name}`;
        if (optionsModalSubtitle) optionsModalSubtitle.textContent = 'Custom dimensions, fit mode, and quality for this image';
      }
    } else {
      if (optionsModalTitle) optionsModalTitle.textContent = 'Options (All Images)';
      if (optionsModalSubtitle) optionsModalSubtitle.textContent = 'Configure default conversion options for all images in queue';
    }

    // Populate form fields
    if (modalOptWidth) modalOptWidth.value = targetOptions.width || '';
    if (modalOptHeight) modalOptHeight.value = targetOptions.height || '';
    setModalFitValue(targetOptions.fit || 'max');

    const qualityVal = targetOptions.quality !== undefined ? targetOptions.quality : 90;
    if (modalOptQualityRange) modalOptQualityRange.value = qualityVal;
    if (modalOptQualityNum) modalOptQualityNum.value = qualityVal;

    const stripRadios = document.querySelectorAll('input[name="modalOptStrip"]');
    stripRadios.forEach(radio => {
      radio.checked = radio.value === (targetOptions.strip || 'yes');
    });

    optionsModal.classList.remove('hidden');
    optionsModal.classList.add('flex');
  };

  const hideOptionsModal = () => {
    if (optionsModal) {
      optionsModal.classList.add('hidden');
      optionsModal.classList.remove('flex');
    }
    currentEditingTargetId = null;
    closeAllDropdowns();
  };

  // Sync Quality Range & Number input
  if (modalOptQualityRange && modalOptQualityNum) {
    modalOptQualityRange.addEventListener('input', (e) => {
      modalOptQualityNum.value = e.target.value;
    });
    modalOptQualityNum.addEventListener('input', (e) => {
      let val = parseInt(e.target.value, 10);
      if (isNaN(val)) val = 90;
      val = Math.min(100, Math.max(1, val));
      modalOptQualityRange.value = val;
    });
  }

  if (btnGlobalOptions) {
    btnGlobalOptions.addEventListener('click', () => showOptionsModal(null));
  }

  if (closeOptionsModal) closeOptionsModal.addEventListener('click', hideOptionsModal);
  if (btnCancelOptions) btnCancelOptions.addEventListener('click', hideOptionsModal);

  if (optionsModal) {
    optionsModal.addEventListener('click', (e) => {
      if (e.target === optionsModal) hideOptionsModal();
    });
  }

  // Reset Options in Modal
  if (btnResetOptions) {
    btnResetOptions.addEventListener('click', () => {
      if (modalOptWidth) modalOptWidth.value = '';
      if (modalOptHeight) modalOptHeight.value = '';
      setModalFitValue('max');
      if (modalOptQualityRange) modalOptQualityRange.value = 90;
      if (modalOptQualityNum) modalOptQualityNum.value = 90;
      const stripYes = document.querySelector('input[name="modalOptStrip"][value="yes"]');
      if (stripYes) stripYes.checked = true;
    });
  }

  // Save Options in Modal
  if (btnSaveOptions) {
    btnSaveOptions.addEventListener('click', () => {
      const stripChecked = document.querySelector('input[name="modalOptStrip"]:checked');
      const savedOpts = {
        width: modalOptWidth ? modalOptWidth.value.trim() : '',
        height: modalOptHeight ? modalOptHeight.value.trim() : '',
        fit: modalOptFit ? modalOptFit.value : 'max',
        quality: modalOptQualityNum ? parseInt(modalOptQualityNum.value, 10) || 90 : 90,
        strip: stripChecked ? stripChecked.value : 'yes'
      };

      if (currentEditingTargetId === null) {
        // Global Options update -> applies to all queue items
        globalOptions = { ...savedOpts };
        fileQueue.forEach(item => {
          item.options = { ...savedOpts };
        });
        statusDiv.style.color = '#4F46E5';
        statusDiv.textContent = `Applied conversion options to all (${fileQueue.length}) images in queue.`;
      } else {
        // Specific item update
        const item = fileQueue.find(i => i.id === currentEditingTargetId);
        if (item) {
          item.options = { ...savedOpts };
          statusDiv.style.color = '#4F46E5';
          statusDiv.textContent = `Updated conversion options for "${item.name}".`;
        }
      }

      hideOptionsModal();
    });
  }

  // Global Close Dropdowns on Click Outside or Escape
  const closeAllDropdowns = () => {
    // Global format
    if (globalFormatMenu) {
      globalFormatMenu.classList.add('hidden');
      globalFormatMenu.classList.remove('flex');
      setGlobalChevron(false);
      globalFormatBtn?.setAttribute('aria-expanded', 'false');
    }
    // Modal fit
    if (modalFitMenu) {
      modalFitMenu.classList.add('hidden');
      modalFitMenu.classList.remove('flex');
      setModalFitChevron(false);
    }
    // Item row menus and active z-index reset
    document.querySelectorAll('.file-item-row').forEach(r => {
      r.classList.remove('z-50');
    });
    document.querySelectorAll('.item-format-menu').forEach(menu => {
      menu.classList.add('hidden');
      menu.classList.remove('flex');
    });
    document.querySelectorAll('.btn-item-format-trigger .lucide-chevron-down, .btn-item-format-trigger [data-lucide="chevron-down"], .btn-item-format-trigger svg, .btn-item-format-trigger i').forEach(ch => {
      ch.classList.remove('rotate-180');
    });
  };

  document.addEventListener('click', (e) => {
    // If click is not inside any dropdown trigger or menu, close all
    if (!e.target.closest('#global-format-dropdown') &&
      !e.target.closest('#modal-fit-dropdown') &&
      !e.target.closest('.item-format-dropdown')) {
      closeAllDropdowns();
    }
  });

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      hideDonationModal();
      hideOptionsModal();
      closeAllDropdowns();
    }
  });

  // Helper to generate per-item custom format menu items HTML (single-line & whitespace-nowrap)
  const getFormatMenuItemsHtml = (itemId, selectedFormat) => {
    return FORMAT_LIST.map(f => {
      const isSelected = f.id === selectedFormat;
      return `
        <button type="button" class="item-format-option w-full flex items-center justify-between px-3 py-1.5 text-xs font-bold text-slate-800 hover:bg-indigo-50 hover:text-indigo-700 transition-colors text-left cursor-pointer whitespace-nowrap ${isSelected ? 'bg-indigo-50/70 text-indigo-700 font-extrabold' : ''}" data-id="${itemId}" data-value="${f.id}">
          <span class="whitespace-nowrap">${f.name}</span>
          ${isSelected ? '<i data-lucide="check" class="w-3.5 h-3.5 text-indigo-600 shrink-0 ml-2"></i>' : '<span class="w-3.5 ml-2 shrink-0"></span>'}
        </button>
      `;
    }).join('');
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
        if (downloadSelectedZipText) {
          downloadSelectedZipText.textContent = 'Download';
        }
      }
    }

    // Convert Selected Button
    if (btnConvertSelected) {
      if (pendingSelected.length > 0) {
        btnConvertSelected.classList.remove('hidden');
        btnConvertSelected.classList.add('inline-flex');
        btnConvertSelected.disabled = isConverting;
        btnConvertSelected.innerHTML = `
          <i data-lucide="arrow-right-left" class="w-4 h-4"></i>
          <span>Convert</span>
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
          <span>Convert</span>
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

    row.className = `file-item-row relative flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4 border rounded-xl p-3 px-4 shadow-2xs transition-all ${statusBgBorder}`;

    let statusContent = '';
    if (item.status === 'pending') {
      statusContent = `<span class="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-md bg-green-100 text-green-600 border border-green-200 whitespace-nowrap">Ready</span>`;
    } else if (item.status === 'converting') {
      statusContent = `
        <span class="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200 whitespace-nowrap">
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
        <span class="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 whitespace-nowrap" title="Converted to ${item.extension.toUpperCase()}">
          <i data-lucide="check" class="w-3.5 h-3.5"></i>
          <span>${formatBytes(item.convertedSize)} ${savedPct}</span>
        </span>
        <a href="${item.downloadUrl}" download="${item.outputName}" class="inline-flex items-center justify-center bg-indigo-600 hover:bg-indigo-700 text-white w-7 h-7 rounded-lg transition-colors shadow-xs shadow-indigo-200 cursor-pointer" title="Click to download ${item.outputName}">
          <i data-lucide="download" class="w-3.5 h-3.5"></i>
        </a>
      `;
    } else if (item.status === 'error') {
      statusContent = `
        <span class="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-md bg-rose-50 text-rose-700 border border-rose-200 whitespace-nowrap" title="${item.errorMessage}">
          <i data-lucide="alert-triangle" class="w-3.5 h-3.5"></i>
          <span>Error</span>
        </span>
      `;
    }

    const currentFmtObj = FORMAT_LIST.find(f => f.id === item.outputFormatId) || { name: item.outputFormatId.toUpperCase() };

    row.innerHTML = `
      <!-- Left: Thumbnail (acts as clickable select / mark trigger) & File Meta -->
      <div class="flex items-center gap-3 min-w-0 flex-1">
        <div class="file-item-thumb-wrapper relative w-11 h-11 rounded-lg cursor-pointer shrink-0 select-none border border-slate-200 bg-white transition-colors group" data-id="${item.id}" title="${item.selected ? 'Click to unmark' : 'Click to mark'}">
          <img class="w-full h-full rounded-md object-cover block" src="${item.thumbUrl}" alt="Thumbnail" />
          <div class="thumb-check-overlay absolute -top-1 -right-1 w-4.5 h-4.5 rounded-full text-white border-2 border-white flex items-center justify-center shadow-xs transition-opacity ${item.selected ? 'bg-indigo-600 opacity-100' : 'bg-slate-400 opacity-0 group-hover:opacity-75'}">
            <i data-lucide="check" class="w-3 h-3 stroke-[3.5]"></i>
          </div>
        </div>
        <div class="min-w-0 flex-1">
          <div class="text-xs sm:text-sm font-bold text-slate-900 truncate max-w-[180px] sm:max-w-[280px]" title="${item.name}">${item.name}</div>
          <div class="text-[11px] text-slate-500 mt-0.5 font-medium whitespace-nowrap">${formatBytes(item.size)}</div>
        </div>
      </div>

      <!-- Center: Input Format -> Arrow -> Custom Output Format Dropdown -->
      <div class="flex items-center justify-center gap-2 bg-white px-2.5 py-1.5 rounded-lg border border-slate-200 shrink-0 whitespace-nowrap">
        <span class="inline-flex items-center bg-slate-100 text-slate-700 text-xs font-bold px-2 py-0.5 rounded-md border border-slate-200 uppercase whitespace-nowrap">${item.inputExt}</span>
        <i data-lucide="arrow-right" class="w-3.5 h-3.5 text-indigo-500 shrink-0"></i>
        <div class="relative item-format-dropdown">
          <button type="button" class="btn-item-format-trigger inline-flex items-center justify-between gap-2 bg-slate-50 hover:bg-slate-100/90 border border-slate-300 rounded-md py-1 pr-2 pl-2.5 text-xs font-bold text-slate-800 transition-colors cursor-pointer min-w-[100px] whitespace-nowrap text-left" data-id="${item.id}" ${item.status === 'converting' ? 'disabled' : ''}>
            <span class="item-format-label whitespace-nowrap font-bold text-slate-900">${currentFmtObj.name}</span>
            <i data-lucide="chevron-down" class="w-3.5 h-3.5 text-slate-400 shrink-0 transition-transform"></i>
          </button>
          
          <!-- Dropdown Popover Menu with high z-index & auto-flip -->
          <div class="item-format-menu hidden absolute top-full left-0 mt-1 z-50 bg-white border border-slate-200 rounded-xl shadow-2xl py-1 flex-col divide-y divide-slate-100/80 min-w-[135px] whitespace-nowrap">
            ${getFormatMenuItemsHtml(item.id, item.outputFormatId)}
          </div>
        </div>
      </div>

      <!-- Right: Status / Direct Download & Options & Remove Button -->
      <div class="flex items-center justify-between sm:justify-end gap-2 shrink-0 whitespace-nowrap">
        ${statusContent}
        <button type="button" class="btn-item-options inline-flex items-center justify-center bg-slate-100 hover:bg-slate-200 text-slate-600 w-7 h-7 rounded-md transition-colors cursor-pointer border border-transparent" data-id="${item.id}" title="Conversion options for this image">
          <i data-lucide="sliders-horizontal" class="w-3.5 h-3.5"></i>
        </button>
        <button type="button" class="btn-item-remove inline-flex items-center justify-center bg-slate-100 hover:bg-rose-50 text-slate-400 hover:text-rose-600 w-7 h-7 rounded-md transition-colors cursor-pointer border border-transparent " data-id="${item.id}" title="Remove file">
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

    // Bind item format custom dropdown toggle with z-index elevation and smart flip
    const formatTrigger = row.querySelector('.btn-item-format-trigger');
    const formatMenu = row.querySelector('.item-format-menu');
    if (formatTrigger && formatMenu) {
      formatTrigger.addEventListener('click', (e) => {
        e.stopPropagation();
        const isHidden = formatMenu.classList.contains('hidden');
        closeAllDropdowns();
        if (isHidden) {
          // Smart Auto-Flip Positioning (open upward if near bottom of viewport)
          const triggerRect = formatTrigger.getBoundingClientRect();
          const spaceBelow = window.innerHeight - triggerRect.bottom;
          if (spaceBelow < 220) {
            formatMenu.classList.remove('top-full', 'mt-1');
            formatMenu.classList.add('bottom-full', 'mb-1');
          } else {
            formatMenu.classList.remove('bottom-full', 'mb-1');
            formatMenu.classList.add('top-full', 'mt-1');
          }

          formatMenu.classList.remove('hidden');
          formatMenu.classList.add('flex');
          const chevron = formatTrigger.querySelector('.lucide-chevron-down, [data-lucide="chevron-down"], svg, i');
          if (chevron) {
            chevron.classList.add('rotate-180');
          }
          row.classList.add('z-50');
        }
      });

      formatMenu.querySelectorAll('.item-format-option').forEach(optBtn => {
        optBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          const targetFormat = optBtn.getAttribute('data-value');
          if (targetFormat) {
            item.outputFormatId = targetFormat;
            const newFmt = FORMAT_LIST.find(f => f.id === targetFormat);
            const labelEl = row.querySelector('.item-format-label');
            if (labelEl && newFmt) labelEl.textContent = newFmt.name;
            closeAllDropdowns();
            updateItemRowInDOM(item);

            // Focus target format guide in the SEO section
            focusFormatGuide(targetFormat, 'Selected Output');
          }
        });
      });
    }

    // Bind item options button
    const optionsBtn = row.querySelector('.btn-item-options');
    if (optionsBtn) {
      optionsBtn.addEventListener('click', () => {
        showOptionsModal(item.id);
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
        fileItemsList.classList.remove('max-h-[260px]', 'overflow-hidden');
        fileItemsList.classList.add('max-h-none', 'overflow-visible');
        listFadeOverlay?.classList.remove('absolute', 'bottom-0', 'h-24', 'bg-gradient-to-t');
        listFadeOverlay?.classList.add('static', 'h-auto', 'bg-none', 'pt-2');
        if (showAllBtnText) showAllBtnText.textContent = 'Show Less';
        const chevron = document.querySelector('#btnShowAll .lucide-chevron-down, #btnShowAll [data-lucide], #btnShowAll svg, #showAllBtnIcon');
        if (chevron) chevron.classList.add('rotate-180');
      } else {
        fileItemsList.classList.add('max-h-[260px]', 'overflow-hidden');
        fileItemsList.classList.remove('max-h-none', 'overflow-visible');
        listFadeOverlay?.classList.add('absolute', 'bottom-0', 'h-24', 'bg-gradient-to-t');
        listFadeOverlay?.classList.remove('static', 'h-auto', 'bg-none', 'pt-2');
        if (showAllBtnText) showAllBtnText.textContent = `Show all ${fileQueue.length} images`;
        const chevron = document.querySelector('#btnShowAll .lucide-chevron-down, #btnShowAll [data-lucide], #btnShowAll svg, #showAllBtnIcon');
        if (chevron) chevron.classList.remove('rotate-180');
      }
    } else {
      listFadeOverlay?.classList.add('hidden');
      listFadeOverlay?.classList.remove('flex');
      fileItemsList.classList.remove('max-h-[260px]', 'overflow-hidden');
      fileItemsList.classList.add('max-h-none', 'overflow-visible');
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
        options: { ...globalOptions },
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
    statusDiv.style.color = '#15803D';
    statusDiv.textContent = `Added ${newItems.length} image(s) to the conversion queue.`;

    // Smart Auto-Focus detected input format in Format Guide
    const firstInputExt = newItems[0].inputExt;
    focusFormatGuide(firstInputExt, 'Detected Input');
  };

  // Remove individual file from queue
  const removeFileFromQueue = (id) => {
    fileQueue = fileQueue.filter(item => item.id !== id);
    renderQueueUI();
  };

  // Drag & drop highlight state handlers using pure Tailwind classes
  const setDragHighlight = (el, isDragging) => {
    if (!el) return;
    const highlightClasses = ['border-blue-500', 'bg-blue-50/70', 'ring-2', 'ring-blue-500/20'];
    const defaultClasses = ['border-slate-300', 'bg-white'];
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
        <span>Converting...</span>
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
        <span>Download</span>
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
          compressionOptions: { level: 6 }
        });

        const zipUrl = URL.createObjectURL(zipBlob);
        const link = document.createElement('a');
        link.href = zipUrl;
        link.download = `ImageConverter_Batch_${Date.now()}.zip`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(zipUrl);

        statusDiv.style.color = '#15803D';
        statusDiv.textContent = `Successfully downloaded ZIP package (${formatBytes(zipBlob.size)})!`;
      } catch (err) {
        console.error('ZIP generation failed:', err);
        statusDiv.style.color = '#E11D48';
        statusDiv.textContent = `ZIP generation failed: ${err.message || err}`;
      } finally {
        btnDownloadSelectedZip.disabled = false;
        updateStickyActionBar();
        createIcons({ icons: appIcons });
      }
    });
  }
});
