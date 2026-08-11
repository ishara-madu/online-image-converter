export const SUPPORTED_INPUT_FORMATS = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/bmp',
  'image/avif',
  'image/heic',
  'image/heif',
  'image/gif',
  'image/svg+xml',
  'image/x-icon',
  'image/vnd.microsoft.icon'
];

export const SUPPORTED_OUTPUT_FORMATS = [
  { id: 'jpeg', name: 'JPG / JPEG', mime: 'image/jpeg', ext: 'jpg' },
  { id: 'png', name: 'PNG', mime: 'image/png', ext: 'png' },
  { id: 'webp', name: 'WebP', mime: 'image/webp', ext: 'webp' },
  { id: 'avif', name: 'AVIF', mime: 'image/avif', ext: 'avif' },
  { id: 'ico', name: 'ICO (Favicon)', mime: 'image/x-icon', ext: 'ico' },
  { id: 'gif', name: 'GIF (Static)', mime: 'image/gif', ext: 'gif' },
  { id: 'svg', name: 'SVG (Vector)', mime: 'image/svg+xml', ext: 'svg' },
];

/**
 * Converts PNG Uint8Array to ICO format Blob (PNG-in-ICO standard format)
 */
function pngToIcoBlob(pngUint8Array, width = 32, height = 32) {
  const pngSize = pngUint8Array.length;
  
  const headerAndDir = new Uint8Array([
    0, 0, // Reserved
    1, 0, // Type: 1 = ICO
    1, 0, // Number of images: 1
    width >= 256 ? 0 : width,   // Width
    height >= 256 ? 0 : height, // Height
    0,    // Color palette
    0,    // Reserved
    1, 0, // Color planes (1)
    32, 0,// Bits per pixel (32)
    pngSize & 0xFF, (pngSize >> 8) & 0xFF, (pngSize >> 16) & 0xFF, (pngSize >> 24) & 0xFF, // Image size
    22, 0, 0, 0 // Offset (6 + 16 = 22)
  ]);

  const icoBuffer = new Uint8Array(headerAndDir.length + pngSize);
  icoBuffer.set(headerAndDir, 0);
  icoBuffer.set(pngUint8Array, headerAndDir.length);

  return new Blob([icoBuffer], { type: 'image/x-icon' });
}

/**
 * Loads a File/Blob into an HTMLCanvasElement
 */
async function fileToCanvas(file) {
  const fileName = file.name ? file.name.toLowerCase() : '';
  const fileType = file.type ? file.type.toLowerCase() : '';

  let processedBlob = file;

  // 1. Handle HEIC / HEIF
  if (fileName.endsWith('.heic') || fileName.endsWith('.heif') || fileType.includes('heic') || fileType.includes('heif')) {
    try {
      const heicModule = await import('heic2any');
      const heic2any = heicModule.default || heicModule;
      const conversionResult = await heic2any({
        blob: file,
        toType: 'image/png'
      });
      processedBlob = Array.isArray(conversionResult) ? conversionResult[0] : conversionResult;
    } catch (err) {
      console.error('HEIC conversion failed:', err);
      throw new Error('Could not process HEIC file. ' + err.message);
    }
  }

  // 2. Handle GIF using gif-frames (extract frame 0)
  if (fileName.endsWith('.gif') || fileType.includes('gif')) {
    try {
      const gifModule = await import('gif-frames');
      const gifFrames = gifModule.default || gifModule;
      const frameData = await gifFrames({
        url: URL.createObjectURL(file),
        frames: 0,
        outputType: 'canvas'
      });
      if (frameData && frameData.length > 0 && frameData[0].getImage) {
        return frameData[0].getImage();
      }
    } catch (e) {
      console.warn('gif-frames extraction failed, falling back to standard image load:', e);
    }
  }

  // 3. Standard image load via Image object
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(processedBlob);
    
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth || img.width;
      canvas.height = img.naturalHeight || img.height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);
      URL.revokeObjectURL(url);
      resolve(canvas);
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image file. Please check file format.'));
    };

    img.src = url;
  });
}

/**
 * Resizes and fits source canvas based on options
 */
function applyResizeAndFit(sourceCanvas, options = {}) {
  const srcW = sourceCanvas.width;
  const srcH = sourceCanvas.height;

  const targetW = options.width ? parseInt(options.width, 10) : null;
  const targetH = options.height ? parseInt(options.height, 10) : null;
  const fit = options.fit || 'max';

  // If no dimensions specified, return original canvas
  if (!targetW && !targetH) {
    return sourceCanvas;
  }

  let destW = srcW;
  let destH = srcH;
  let sX = 0;
  let sY = 0;
  let sW = srcW;
  let sH = srcH;

  if (targetW && !targetH) {
    destW = targetW;
    destH = Math.round(srcH * (targetW / srcW));
  } else if (!targetW && targetH) {
    destH = targetH;
    destW = Math.round(srcW * (targetH / srcH));
  } else if (targetW && targetH) {
    if (fit === 'max') {
      // Max: Fit within width and height, but do not increase if smaller
      if (srcW <= targetW && srcH <= targetH) {
        destW = srcW;
        destH = srcH;
      } else {
        const ratio = Math.min(targetW / srcW, targetH / srcH);
        destW = Math.max(1, Math.round(srcW * ratio));
        destH = Math.max(1, Math.round(srcH * ratio));
      }
    } else if (fit === 'scale') {
      // Scale: Exact width and height by stretching/scaling
      destW = targetW;
      destH = targetH;
    } else if (fit === 'crop') {
      // Crop: Fill width and height dimensions and crop any excess image data
      destW = targetW;
      destH = targetH;
      const scale = Math.max(targetW / srcW, targetH / srcH);
      sW = targetW / scale;
      sH = targetH / scale;
      sX = (srcW - sW) / 2;
      sY = (srcH - sH) / 2;
    } else if (fit === 'contain') {
      // Contain: Maintain aspect ratio to fit inside target bounding box
      const ratio = Math.min(targetW / srcW, targetH / srcH);
      destW = Math.max(1, Math.round(srcW * ratio));
      destH = Math.max(1, Math.round(srcH * ratio));
    }
  }

  const resizedCanvas = document.createElement('canvas');
  resizedCanvas.width = Math.max(1, destW);
  resizedCanvas.height = Math.max(1, destH);
  const ctx = resizedCanvas.getContext('2d');
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  ctx.drawImage(sourceCanvas, sX, sY, sW, sH, 0, 0, destW, destH);

  return resizedCanvas;
}

/**
 * Main conversion function with custom options support
 * @param {File|Blob} file 
 * @param {string} outputFormatId 
 * @param {Object} options - { width, height, fit, quality, strip }
 */
export async function convertImage(file, outputFormatId, options = {}) {
  const rawCanvas = await fileToCanvas(file);
  const sourceCanvas = applyResizeAndFit(rawCanvas, options);
  const target = SUPPORTED_OUTPUT_FORMATS.find(f => f.id === outputFormatId);

  if (!target) {
    throw new Error(`Unsupported output format: ${outputFormatId}`);
  }

  // Quality calculation (1 - 100 => 0.01 - 1.0)
  const qualityVal = options.quality !== undefined && options.quality !== null && options.quality !== ''
    ? Math.min(100, Math.max(1, parseInt(options.quality, 10))) / 100
    : 0.90;

  // SVG Output (imagetracerjs)
  if (outputFormatId === 'svg') {
    const tracerModule = await import('imagetracerjs');
    const ImageTracer = tracerModule.default || tracerModule;
    const ctx = sourceCanvas.getContext('2d');
    const imgData = ctx.getImageData(0, 0, sourceCanvas.width, sourceCanvas.height);
    const svgString = ImageTracer.imagedataToSVG(imgData, {
      scale: 1,
      simplifytolerance: 0.5,
      colorsampling: 2,
      numberofcolors: 16
    });
    const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    return { blob, extension: 'svg', mime: 'image/svg+xml' };
  }

  // ICO Output (Favicon)
  if (outputFormatId === 'ico') {
    const icoSize = options.width ? parseInt(options.width, 10) : 32;
    const icoCanvas = document.createElement('canvas');
    icoCanvas.width = icoSize;
    icoCanvas.height = icoSize;
    const icoCtx = icoCanvas.getContext('2d');
    icoCtx.imageSmoothingEnabled = true;
    icoCtx.imageSmoothingQuality = 'high';
    icoCtx.drawImage(sourceCanvas, 0, 0, icoSize, icoSize);

    const pngBlob = await new Promise(resolve => icoCanvas.toBlob(resolve, 'image/png'));
    const arrayBuffer = await pngBlob.arrayBuffer();
    const pngUint8Array = new Uint8Array(arrayBuffer);
    const icoBlob = pngToIcoBlob(pngUint8Array, icoSize, icoSize);

    return { blob: icoBlob, extension: 'ico', mime: 'image/x-icon' };
  }

  // For JPEG, draw white background first to handle transparency
  let finalCanvas = sourceCanvas;
  if (outputFormatId === 'jpeg') {
    finalCanvas = document.createElement('canvas');
    finalCanvas.width = sourceCanvas.width;
    finalCanvas.height = sourceCanvas.height;
    const ctx = finalCanvas.getContext('2d');
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, finalCanvas.width, finalCanvas.height);
    ctx.drawImage(sourceCanvas, 0, 0);
  }

  // Standard canvas export (JPEG, PNG, WebP, AVIF, GIF)
  const mimeType = target.mime;
  const blob = await new Promise((resolve, reject) => {
    finalCanvas.toBlob((resultBlob) => {
      if (resultBlob) {
        resolve(resultBlob);
      } else {
        // Fallback if browser doesn't natively support canvas.toBlob for specific MIME like AVIF
        if (outputFormatId === 'avif' || outputFormatId === 'gif') {
          finalCanvas.toBlob((pngFallback) => {
            if (pngFallback) resolve(pngFallback);
            else reject(new Error(`Conversion to ${target.name} failed.`));
          }, 'image/png');
        } else {
          reject(new Error(`Conversion to ${target.name} failed.`));
        }
      }
    }, mimeType, qualityVal);
  });

  return { blob, extension: target.ext, mime: mimeType };
}
