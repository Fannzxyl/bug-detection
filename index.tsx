import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { HistoryProvider } from './components/history/HistoryProvider';
import { SettingsProvider } from './contexts/SettingsContext';

// Wrap the mounting logic in a DOMContentLoaded event listener.
// This ensures that the script waits for the entire DOM to be parsed and ready
// before it tries to find the 'root' element, preventing the race condition error.
document.addEventListener('DOMContentLoaded', () => {
    const rootElement = document.getElementById('root');
    if (!rootElement) {
      throw new Error("Could not find root element to mount to");
    }
    
    const root = ReactDOM.createRoot(rootElement);
    root.render(
      <React.StrictMode>
        <SettingsProvider>
          <HistoryProvider>
            <App />
          </HistoryProvider>
        </SettingsProvider>
      </React.StrictMode>
    );
});
