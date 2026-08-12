import { resolve } from 'path';
import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
    base: './',
    plugins: [
        tailwindcss(),
    ],
    build: {
        rollupOptions: {
            input: {
                main: resolve(import.meta.dirname, 'index.html'),
                privacy: resolve(import.meta.dirname, 'privacy.html'),
                terms: resolve(import.meta.dirname, 'terms.html'),
            },
        },
    },
});
