import React from 'react'
import {createRoot} from 'react-dom/client'
import App from './frontend/App'
import './frontend/index.css'

function start() {
    const container = document.getElementById('root')
    if (container) {
        const root = createRoot(container)
        root.render(
            <React.StrictMode>
                <App />
            </React.StrictMode>
        )
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start)
} else {
    start()
}
