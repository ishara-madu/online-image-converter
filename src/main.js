import './style.css';
import { convertImage } from './converter.js';

console.log('Converter app script loaded successfully');

function initApp() {
  const fileInput = document.getElementById('file-input');
  const formatSelect = document.getElementById('format-select');
  const convertBtn = document.getElementById('convert-btn');
  const statusDiv = document.getElementById('status');
  const resultArea = document.getElementById('result-area');

  if (!fileInput || !convertBtn) {
    console.error('Elements not found!');
    return;
  }

  let selectedFile = null;

  const updateFileSelection = (files) => {
    if (files && files.length > 0) {
      selectedFile = files[0];
      statusDiv.style.color = '#0066cc';
      statusDiv.textContent = `Selected: ${selectedFile.name} (${(selectedFile.size / 1024).toFixed(1)} KB)`;
      resultArea.innerHTML = '';
      console.log('File selected:', selectedFile.name);
    } else {
      selectedFile = null;
      statusDiv.textContent = '';
    }
  };

  fileInput.addEventListener('change', (e) => {
    updateFileSelection(e.target.files);
  });

  convertBtn.addEventListener('click', async () => {
    if (!selectedFile) {
      statusDiv.style.color = '#cc0000';
      statusDiv.textContent = 'කරුණාකර පළමුව පින්තූරයක් තෝරන්න (Please select an image file first).';
      return;
    }

    const outputFormatId = formatSelect.value;
    convertBtn.disabled = true;
    statusDiv.style.color = '#0066cc';
    statusDiv.textContent = `Processing image conversion to ${outputFormatId.toUpperCase()}... Please wait.`;
    resultArea.innerHTML = '';

    try {
      const { blob, extension } = await convertImage(selectedFile, outputFormatId);

      const downloadUrl = URL.createObjectURL(blob);
      const lastDotIndex = selectedFile.name.lastIndexOf('.');
      const originalName = lastDotIndex !== -1 ? selectedFile.name.substring(0, lastDotIndex) : selectedFile.name;
      const downloadFileName = `${originalName}-converted.${extension}`;

      statusDiv.style.color = '#008800';
      statusDiv.textContent = `Conversion complete! File size: ${(blob.size / 1024).toFixed(1)} KB`;

      // Create download link element
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = downloadFileName;
      link.textContent = `Download ${downloadFileName}`;
      link.style.display = 'inline-block';
      link.style.marginTop = '10px';
      link.style.padding = '8px 16px';
      link.style.background = '#008800';
      link.style.color = '#ffffff';
      link.style.borderRadius = '4px';
      link.style.textDecoration = 'none';

      resultArea.appendChild(link);

      // Auto trigger download
      link.click();
    } catch (error) {
      console.error('Conversion Error:', error);
      statusDiv.style.color = '#cc0000';
      statusDiv.textContent = `Error: ${error.message || error}`;
    } finally {
      convertBtn.disabled = false;
    }
  });
}

// Execute initApp safely
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}
