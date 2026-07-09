import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import { AuthProvider } from './context/AuthContext';
import './styles/globals.css'
import './styles/select.css'
import { registerServiceWorker } from './utils/pwa.ts'

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <AuthProvider>
            <App />
        </AuthProvider>
    </React.StrictMode>,
)

// Register service worker for PWA
registerServiceWorker();
