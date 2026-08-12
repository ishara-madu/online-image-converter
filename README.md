# 🖼️ Online Image Converter

> **Free, Fast & 100% Private In-Browser Universal Image Converter & Vector Tracer.**  
> Convert JPG, PNG, WebP, AVIF, HEIC, SVG, ICO, and GIF directly inside your browser with zero server uploads and zero quality compromise.

---

## 🌟 Overview

**Online Image Converter** is a modern, high-performance, client-side web application built for seamless image conversion, resizing, and vector tracing. Unlike traditional converters that upload your sensitive images to third-party cloud servers, this tool executes **100% of the image processing locally** on your device using HTML5 Canvas, WebAssembly, and modern browser APIs.

### 🛡️ Why Choose Client-Side?
- **Absolute Privacy**: Your photos and confidential documents never leave your computer or phone.
- **Blazing Fast**: No upload wait times or server queuing — conversions happen instantly at hardware speeds.
- **Unlimited & Free**: No file size caps, no daily conversion limits, and no subscriptions or watermarks.
- **Works Offline**: Once loaded, use it anytime even without an active internet connection.

---

## ✨ Key Features

- 🔄 **Universal Format Conversion**: Convert between standard, next-gen, vector, and icon formats effortlessly.
- 📦 **Batch Conversion & ZIP Export**: Convert multiple images simultaneously and download them individually or bundled in a single `.zip` archive via [JSZip](https://stuk.github.io/jszip/).
- 🎛️ **Granular Compression & Quality Tuning**: Fine-tune output quality and compression ratios (1% – 100%) to balance file size and visual fidelity.
- 📐 **Smart Resizing & Aspect Ratio Controls**:
  - Custom target dimensions (Width / Height) with aspect ratio lock.
  - Multi-mode fit options: `Max Dimensions`, `Contain`, `Crop / Fill`, and `Scale / Stretch`.
- 🪄 **Raster to SVG Vector Tracer**: Convert bitmap images (JPG/PNG) into scalable vector graphics (SVG) using embedded color-quantized vector tracing.
- 🎯 **Favicon / ICO Generator**: Generate multi-resolution Windows ICO / browser favicon files directly with custom pixel dimensions.
- 🍏 **Native HEIC / HEIF Support**: Decode Apple iPhone HEIC/HEIF photos directly in the browser via WebAssembly (`heic2any`).
- 📋 **Seamless Input Options**: Drag-and-drop files, browse via file picker, or paste directly from your clipboard (`Ctrl+V` / `Cmd+V`).
- 🎨 **Minimal & Accessible UI**: Clean, flat design system built with Tailwind CSS v4, semantic HTML, and Lucide icons.
- ⚡ **PWA Ready**: Installable as a Progressive Web App on mobile and desktop for quick offline access.

---

## 📊 Supported Formats

| Format | Input | Output | Description & Capabilities |
| :--- | :---: | :---: | :--- |
| **JPEG / JPG** | ✅ | ✅ | Standard compressed photography format with custom quality control and automatic background fill for transparency |
| **PNG** | ✅ | ✅ | Lossless compression with full alpha transparency support |
| **WebP** | ✅ | ✅ | Modern Google web image format offering superior lossless and lossy compression |
| **AVIF** | ✅ | ✅ | Next-generation AV1 image format providing ultra-high compression efficiency |
| **HEIC / HEIF** | ✅ | 🔄 *(to any)* | Apple iOS camera format decoded client-side via WebAssembly |
| **SVG** | ✅ | ✅ | Scalable Vector Graphics with automated client-side vector tracing (`imagetracerjs`) |
| **ICO** | ✅ | ✅ | Windows Icon & Web Favicon format encoded with standard PNG-in-ICO directory structure |
| **GIF** | ✅ | ✅ | Static frame extraction and standard GIF export |
| **BMP** | ✅ | 🔄 *(to any)* | Uncompressed bitmap input support |

---

## 🛠️ Tech Stack

- **Framework & Bundler**: [Vite](https://vite.dev/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Icons**: [Lucide](https://lucide.dev/)
- **Core Processing Engines**:
  - **HTML5 Canvas 2D API**: High-performance pixel manipulation and raster encoding
  - **[heic2any](https://github.com/alexcorvi/heic2any)**: Browser-native HEIC/HEIF to canvas decoding via WebAssembly
  - **[ImageTracerJS](https://github.com/jankovicsandras/imagetracerjs)**: Color-quantized raster-to-SVG vector tracing
  - **[gif-frames](https://github.com/benwiley4000/gif-frames)**: Fast GIF frame decoding
  - **[JSZip](https://stuk.github.io/jszip/)**: In-memory ZIP archive generation for batch downloads
- **Package Manager**: [pnpm](https://pnpm.io/)

---

## 🚀 Getting Started

### Prerequisites

Make sure you have the following installed on your system:
- **Node.js** (v18.0.0 or higher recommended)
- **pnpm** (`npm install -g pnpm` or `corepack enable`)

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/ishara-madu/online-image-converter.git
   cd online-image-converter
   ```

2. **Install dependencies using pnpm**:
   ```bash
   pnpm install
   ```

3. **Start the local development server**:
   ```bash
   pnpm dev
   ```
   Open your browser and navigate to `http://localhost:5173`.

---

## 📜 Available Scripts

| Command | Description |
| :--- | :--- |
| `pnpm dev` | Starts Vite local development server with hot-module replacement |
| `pnpm build` | Compiles and optimizes assets into the `dist/` production folder |
| `pnpm preview` | Locally serves the production build in `dist/` to test deployment output |
| `pnpm deploy` | Builds and deploys the `dist/` folder directly to GitHub Pages |

---

## 📂 Project Structure

```text
online-image-converter/
├── public/                 # Static assets, PWA manifest, favicons, sitemap & robots.txt
│   ├── favicon.svg
│   ├── logo.webp
│   ├── site.webmanifest
│   ├── sitemap.xml
│   └── robots.txt
├── src/
│   ├── assets/             # Background patterns and graphic assets
│   ├── converter.js        # Core conversion engine (HEIC, Canvas, SVG tracer, ICO encoder)
│   ├── main.js             # UI interaction, batch queue, drag-drop, event handlers
│   └── style.css           # Tailwind CSS directives & global font imports
├── index.html              # Main application single-page layout & SEO structured data
├── privacy.html            # Privacy Policy (Client-side guarantees & GDPR alignment)
├── terms.html              # Terms of Service
├── vite.config.js          # Vite configuration & Tailwind plugin
├── package.json            # Project dependencies and scripts
└── README.md               # Project documentation
```

---

## 🔒 Privacy & Security

Online Image Converter is architected around a strict **zero-data retention and zero-telemetry** model:
- **No File Uploads**: Files are loaded directly into browser memory (RAM) via `FileReader` / `Blob` URLs.
- **No Backend Servers**: There are no remote API endpoints, file storage buckets, or server workers processing your images.
- **GDPR & HIPAA Compliant by Design**: Because zero data is collected, stored, or transmitted over the wire, sensitive business graphics, IDs, and personal photos remain completely secure on your machine.

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!  
Feel free to check the [issues page](https://github.com/ishara-madu/online-image-converter/issues).

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

Distributed under the **MIT License**. See `LICENSE` for more information.

---

## 👨‍💻 Author

Created and maintained by **[Ishara M.](https://github.com/ishara-madu)**.
