import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv  } from 'vite';
import type {Plugin} from 'vite';

const rootDir = dirname(fileURLToPath(import.meta.url));

function manifestPlugin(appOrigin: string): Plugin {
    return {
        name: 'emit-manifest',
        generateBundle() {
            const manifest = readFileSync(resolve(rootDir, 'manifest.json'), 'utf8')
                .replaceAll('__GRIND_BUDDY_ORIGIN__', appOrigin);
            this.emitFile({
                type: 'asset',
                fileName: 'manifest.json',
                source: manifest,
            });
        },
    };
}

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, process.cwd(), '');
    const appOrigin = (env.VITE_APP_URL || env.APP_URL || 'http://localhost:8000').replace(/\/$/, '');

    return {
        root: rootDir,
        base: './',
        publicDir: false,
        define: {
            __GRIND_BUDDY_ORIGIN__: JSON.stringify(appOrigin),
        },
        plugins: [react(), manifestPlugin(appOrigin)],
        build: {
            outDir: 'dist',
            emptyOutDir: true,
            rollupOptions: {
                input: {
                    popup: resolve(rootDir, 'popup.html'),
                    options: resolve(rootDir, 'options.html'),
                    background: resolve(rootDir, 'src/background.ts'),
                    content: resolve(rootDir, 'src/content.ts'),
                },
                output: {
                    entryFileNames: 'src/[name].js',
                    chunkFileNames: 'assets/[name]-[hash].js',
                    assetFileNames: 'assets/[name][extname]',
                },
            },
        },
        resolve: {
            alias: {
                '@': resolve(rootDir, 'src'),
            },
        },
    };
});
