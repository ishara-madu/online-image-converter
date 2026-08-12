# AI Agent Rules & Instructions (AGENTS.md)

## 🎨 Styling & Design Rules
1. **Tailwind CSS First**: Always use **Tailwind CSS** utility classes for styling, designing, and modifying the user interface.
2. **Vanilla/Normal CSS Constraint**: Do NOT write custom/vanilla CSS classes unless it is completely impossible to achieve using Tailwind CSS. Keep `src/style.css` minimal (only `@import "tailwindcss";` and font `@font-face` definitions).
3. **Structured Geometric Shape Preference**: Avoid overly rounded pill shapes (`rounded-full`, `rounded-3xl`). Prefer subtle, clean modern geometric corner rounding (`rounded-md`, `rounded-lg`, `rounded-xl`) with well-defined box/rectangular boundaries.
4. **Minimal & Flat Interaction Rule**: No bouncy/swelling/jumping hover animations (`hover:scale-*`, `hover:-translate-y-*`). Use clean, crisp, subtle background/border color transitions for modern minimal elegance.
5. **No Redundant White Card Layers (Modern Minimal Aesthetic)**: try to avoid wrapping every section, list item, or block inside heavy nested white card boxes (`bg-white border rounded-* shadow-*`). Maintain an airy, modern, flat aesthetic using clean typographic hierarchy, subtle horizontal/vertical dividers, and seamless background flow instead of bulky card containers.
6. **Creative & Human-Centric Component Architecture (No Plain Blog / No Jargon-Overload)**: UI sections and components must be visually creative, engaging, and captivating for everyday, normal users rather than looking like a dry developer documentation or plain text blog. Avoid intimidating non-technical users with raw code tags, robotic abbreviations (e.g. `SPEC-01`), or complex developer jargon. Use friendly, visually delightful patterns such as clear visual comparison rails, intuitive benefit meters, interactive-feel status highlights, and rich comparison matrices while staying strictly within minimal flat styling.
7. **No Spark / Sparkles Icons (Banned Icon Rule)**: Do NOT use `sparkles`, `sparkle`, or `spark` icons anywhere in the UI or codebase. Use specific, functional, and purposeful icons instead (e.g. `shield-check`, `zap`, `check-circle-2`, `gauge`, `layers`, `lock`, `image`, `sliders-horizontal`, `star`).

## 📦 Package Manager Rules
1. **Exclusive use of `pnpm`**: Always use **`pnpm`** exclusively for managing packages, running scripts, and development commands (e.g. `pnpm install`, `pnpm add <package>`, `pnpm run build`, `pnpm dev`).
2. **Do NOT use `npm` or `yarn`** commands in this workspace.

## ⚡ Project & Architecture Rules
1. **100% Client-Side Processing**: All image operations and conversions must be executed in the browser using HTML5 Canvas, WebAssembly, or browser-native APIs. Zero remote server uploads.
2. **Modular ES6+ JavaScript**: Keep conversion logic in `src/converter.js` and UI rendering/event handling in `src/main.js`.
3. **No Unsolicited Downloads**: Downloads should only occur upon explicit user interaction (e.g., clicking download buttons).
