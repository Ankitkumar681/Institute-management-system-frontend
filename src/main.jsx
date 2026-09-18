import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css' // ⚡ Keep ONLY this CSS file imported!
window.addEventListener('error', (event) => {
  if (event.message?.includes('startTime') || event.message?.includes('reportAllChanges')) {
    event.preventDefault();
    event.stopPropagation();
  }
}, true);
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
