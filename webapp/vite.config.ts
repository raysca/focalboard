// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import path from 'path'
import { fileURLToPath } from 'url'

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { viteStaticCopy } from 'vite-plugin-static-copy'

// eslint-disable-next-line @typescript-eslint/naming-convention, no-underscore-dangle
const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
    plugins: [
        react({
            babel: {
                plugins: [
                    [
                        'formatjs',
                        {
                            idInterpolationPattern: '[sha512:contenthash:base64:6]',
                            removeDefaultMessage: false,
                            ast: false,
                            extractFromFormatMessageCall: false,
                        },
                    ],
                ],
            },
        }),
        viteStaticCopy({
            targets: [
                {
                    src: 'static/*',
                    dest: 'static',
                },
            ],
        }),

    ],
    resolve: {
        alias: {
            src: path.resolve(__dirname, './src'),
        },
    },
    assetsInclude: ['**/*.gif'],
    build: {
        outDir: 'pack',
        emptyOutDir: true,
        sourcemap: true,
        rollupOptions: {
            input: {
                main: './index.html',
            },
            output: {
                entryFileNames: 'static/[name].js',
                chunkFileNames: 'static/[name]-[hash].js',
                assetFileNames: 'static/[name][extname]',
            },
        },
    },
    optimizeDeps: {
        exclude: [
            '@fullcalendar/core',
            '@fullcalendar/daygrid',
            '@fullcalendar/interaction',
            '@fullcalendar/react',
        ],
    },
    css: {
        preprocessorOptions: {
            scss: {
                api: 'modern-compiler',
                silenceDeprecations: ['import', 'global-builtin'],
            },
        },
    },
    server: {
        port: 9006,
        fs: {
            allow: ['.', 'static'],
        },
        proxy: {
            '/api': {
                target: 'http://localhost:8000',
                changeOrigin: true,
            },
            '/ws': {
                target: 'ws://localhost:8000',
                ws: true,
            },
        },
    },
})
