import React, { useState, useMemo } from 'react';
import { useHistory } from './HistoryProvider';
import type { HistoryEntry } from '../../types';
import { CloseIcon, BugIcon, ClearIcon, ExportIcon, ImportIcon } from '../Icon';
import { useSettings } from '../../contexts/SettingsContext';

interface HistorySidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (entry: HistoryEntry) => void;
}

const HistoryItem: React.FC<{ entry: HistoryEntry; onSelect: () => void; }> = ({ entry, onSelect }) => {
  const { t } = useSettings();
  const bugCount = entry.result.bugs.length;
  const date = new Date(entry.timestamp).toLocaleString();
  return (
    <button onClick={onSelect} className="w-full text-left p-3 hover:bg-white/10 rounded-md transition-colors block">
      <div className="flex justify-between items-start">
        <p className="font-semibold text-gray-200 truncate pr-2" title={entry.title}>{entry.title}</p>
        {bugCount > 0 && (
          <div className="flex items-center gap-1 text-red-400 text-sm flex-shrink-0" title={t('bugsCountTooltip', { count: bugCount })}>
            <BugIcon className="w-4 h-4" />
            <span>{bugCount}</span>
          </div>
        )}
      </div>
      <p className="text-xs text-gray-500">{date}</p>
    </button>
  );
};

const HistorySidebar: React.FC<HistorySidebarProps> = ({ isOpen, onClose, onSelect }) => {
  const { t } = useSettings();
  const { history, clearHistory, importHistory } = useHistory();
  const [searchTerm, setSearchTerm] = useState('');
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const filteredHistory = useMemo(() => {
    if (!searchTerm) return history;
    return history.filter(entry =>
      entry.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.code.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [history, searchTerm]);

  const handleExport = () => {
    if (history.length === 0) {
      alert(t('alertNoHistoryToExport'));
      return;
    }
    const dataStr = JSON.stringify(history, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    const exportFileDefaultName = 'gemini-bug-detector-history.json';
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };
  
  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const text = e.target?.result as string;
          const parsed = JSON.parse(text);
          importHistory(parsed);
        } catch (error) {
          alert(t('alertImportInvalidJSON'));
        }
      };
      reader.readAsText(file);
      event.target.value = ''; // Reset file input
    }
  };

  return (
    <>
      <div
        className={`fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm z-30 transition-opacity ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />
      <aside className={`fixed top-0 right-0 h-full w-full sm:w-96 bg-gray-900/80 backdrop-blur-xl border-l border-white/10 shadow-2xl z-40 transform transition-transform ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex flex-col h-full">
          <header className="p-4 border-b border-white/10 flex justify-between items-center flex-shrink-0">
            <h2 className="text-xl font-bold text-gray-200">{t('historyTitle')}</h2>
            <button onClick={onClose} className="p-1 rounded-full hover:bg-white/10" aria-label={t('historyCloseLabel')}>
              <CloseIcon className="w-6 h-6 text-gray-400" />
            </button>
          </header>
          
          <div className="p-4 flex-shrink-0">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={t('historySearchPlaceholder')}
                className="w-full px-3 py-2 border border-white/10 bg-gray-800/50 text-gray-300 rounded-md focus:ring-2 focus:ring-brand-purple focus:outline-none"
              />
          </div>

          <div className="flex-grow overflow-y-auto px-4">
            {filteredHistory.length > 0 ? (
              <ul className="space-y-1 pb-4">
                {filteredHistory.map(entry => (
                  <li key={entry.id}>
                    <HistoryItem entry={entry} onSelect={() => onSelect(entry)} />
                  </li>
                ))}
              </ul>
            ) : (
                <div className="text-center py-10">
                    <h3 className="font-semibold text-lg text-gray-400">{searchTerm ? t('historyNoSearchResults') : t('historyNoItemsTitle')}</h3>
                    {!searchTerm && <p className="text-gray-500">{t('historyNoItemsSubtitle')}</p>}
                </div>
            )}
          </div>
          
          <footer className="p-4 border-t border-white/10 flex-shrink-0 flex items-center justify-between gap-2">
            <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept=".json" />
            <button onClick={handleImportClick} className="flex items-center gap-2 px-3 py-2 text-sm bg-white/5 hover:bg-white/10 text-gray-300 rounded-md transition-colors">
              <ImportIcon className="w-4 h-4" /> <span className="hidden sm:inline">{t('historyImportButton')}</span>
            </button>
            <button onClick={handleExport} className="flex items-center gap-2 px-3 py-2 text-sm bg-white/5 hover:bg-white/10 text-gray-300 rounded-md transition-colors">
              <ExportIcon className="w-4 h-4" /> <span className="hidden sm:inline">{t('historyExportButton')}</span>
            </button>
            <button onClick={clearHistory} className="flex items-center gap-2 px-3 py-2 text-sm bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-md transition-colors">
              <ClearIcon className="w-4 h-4" /> <span className="hidden sm:inline">{t('historyClearButton')}</span>
            </button>
          </footer>
        </div>
      </aside>
    </>
  );
};

export default HistorySidebar;
