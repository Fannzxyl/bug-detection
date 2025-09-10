import React, { useState, useMemo, useRef } from 'react';
import { useHistory } from './HistoryProvider';
import type { HistoryEntry } from '../../types';
import { HistoryIcon, CloseIcon, ClearIcon, ExportIcon, ImportIcon, BugIcon } from '../Icon';

interface HistorySidebarProps {
    isOpen: boolean;
    onClose: () => void;
    onSelectEntry: (entry: HistoryEntry) => void;
}

const HistorySidebar: React.FC<HistorySidebarProps> = ({ isOpen, onClose, onSelectEntry }) => {
    const { history, clearHistory, importHistory } = useHistory();
    const [searchTerm, setSearchTerm] = useState('');
    const importFileRef = useRef<HTMLInputElement>(null);

    const filteredHistory = useMemo(() => {
        if (!searchTerm.trim()) {
            return history;
        }
        const lowercasedTerm = searchTerm.toLowerCase();
        return history.filter(entry =>
            entry.title.toLowerCase().includes(lowercasedTerm) ||
            entry.code.toLowerCase().includes(lowercasedTerm)
        );
    }, [history, searchTerm]);
    
    const handleEntryClick = (entry: HistoryEntry) => {
        onSelectEntry(entry);
        onClose();
    };

    const handleExport = () => {
        if (history.length === 0) {
            alert("There is no history to export.");
            return;
        }
        const blob = new Blob([JSON.stringify(history, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `gemini-bug-detector-history-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };
    
    const handleImportClick = () => {
        importFileRef.current?.click();
    };
    
    const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const content = e.target?.result as string;
                    const parsed = JSON.parse(content);
                    importHistory(parsed);
                } catch (err) {
                    console.error("Failed to parse import file:", err);
                    alert("Import failed: The file is not valid JSON.");
                }
            };
            reader.readAsText(file);
        }
        if (event.target) {
            event.target.value = '';
        }
    };

    return (
        <>
            <div 
                className={`fixed inset-0 bg-gray-900/60 z-30 transition-opacity ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                onClick={onClose}
                aria-hidden="true"
            />
            <aside
                className={`fixed top-0 left-0 h-full w-full max-w-xs sm:w-80 bg-gray-800 border-r border-gray-700 shadow-2xl z-40 transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
                role="dialog"
                aria-modal="true"
                aria-labelledby="history-heading"
            >
                <div className="flex flex-col h-full">
                    <header className="flex items-center justify-between p-4 border-b border-gray-700 flex-shrink-0">
                        <div className="flex items-center space-x-3">
                            <HistoryIcon className="w-6 h-6 text-cyan-400" />
                            <h2 id="history-heading" className="text-xl font-semibold text-white">Analysis History</h2>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-1 text-gray-400 rounded-full hover:bg-gray-700 hover:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                            aria-label="Close history sidebar"
                        >
                            <CloseIcon className="w-6 h-6" />
                        </button>
                    </header>
                    
                    <div className="p-4 border-b border-gray-700 flex-shrink-0 space-y-3">
                        <input
                            type="text"
                            placeholder="Search history..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded-md text-gray-200 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                        />
                        <div className="grid grid-cols-3 gap-2">
                             <input type="file" ref={importFileRef} onChange={handleFileImport} className="hidden" accept=".json" />
                             <button onClick={handleImportClick} title="Import History" className="flex items-center justify-center space-x-2 px-2 py-2 bg-gray-700 hover:bg-gray-600 text-gray-200 rounded-md text-sm transition">
                                <ImportIcon className="w-5 h-5"/> <span>Import</span>
                             </button>
                             <button onClick={handleExport} title="Export History" className="flex items-center justify-center space-x-2 px-2 py-2 bg-gray-700 hover:bg-gray-600 text-gray-200 rounded-md text-sm transition">
                                <ExportIcon className="w-5 h-5"/> <span>Export</span>
                             </button>
                             <button onClick={clearHistory} title="Clear All History" className="flex items-center justify-center space-x-2 px-2 py-2 bg-red-800 hover:bg-red-700 text-white rounded-md text-sm transition">
                                <ClearIcon className="w-5 h-5"/> <span>Clear</span>
                             </button>
                        </div>
                    </div>

                    <div className="flex-grow overflow-y-auto">
                        {filteredHistory.length > 0 ? (
                            <ul>
                                {filteredHistory.map(entry => (
                                    <li key={entry.id} className="border-b border-gray-700 last:border-b-0">
                                        <button
                                            onClick={() => handleEntryClick(entry)}
                                            className="w-full text-left p-4 hover:bg-gray-700/50 focus:outline-none focus:bg-gray-700 transition-colors"
                                        >
                                            <p className="font-semibold text-white truncate">{entry.title}</p>
                                            <div className="flex items-center justify-between text-xs text-gray-400 mt-1">
                                                <span>{new Date(entry.timestamp).toLocaleString()}</span>
                                                <div className="flex items-center space-x-1" title={`${entry.result.bugs.length} bugs`}>
                                                   <BugIcon className="w-3 h-3 text-red-400"/>
                                                   <span>{entry.result.bugs.length}</span>
                                                </div>
                                            </div>
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <div className="text-center p-8 text-gray-500">
                                <HistoryIcon className="w-12 h-12 mx-auto mb-4" />
                                <p className="font-semibold">No History Found</p>
                                <p className="text-sm">{searchTerm ? 'No results match your search.' : 'Your analysis history will appear here.'}</p>
                            </div>
                        )}
                    </div>
                </div>
            </aside>
        </>
    );
};

export default HistorySidebar;