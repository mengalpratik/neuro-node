import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/index.css';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Register Service Worker for offline shell reloading
if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then(reg => {
        console.log('[NEURO//NODE PWA] Service worker registered with scope:', reg.scope);
      })
      .catch(err => {
        console.warn('[NEURO//NODE PWA] Service worker registration failed:', err);
      });
  });
}
