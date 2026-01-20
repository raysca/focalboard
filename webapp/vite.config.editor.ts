// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import {defineConfig, mergeConfig} from 'vite'

import baseConfig from './vite.config'

export default mergeConfig(baseConfig, defineConfig({
    server: {
        port: 9000,
        open: '/editor.html',
    },
    build: {
        rollupOptions: {
            input: {
                editor: './editor.html',
            },
        },
    },
}))
