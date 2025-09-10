import { useState, useEffect, useCallback } from 'react';
import type { HistoryEntry } from '../../types';
import { useSettings } from '../../contexts/SettingsContext'; // Cannot use hooks in a non-component, so pass `t` function

const HISTORY_STORAGE_KEY = 'gemini-bug-detector-history';
const MAX_HISTORY_ITEMS = 200;

// A simple factory to get translations without using the hook, for non-component files.
// This is a workaround for this specific case. A more robust solution might involve a dedicated i18n library.
const getTranslations = () => {
    try {
        const settings = JSON.parse(window.localStorage.getItem('gemini-app-settings') || '{}');
        const lang = settings.language === 'id' ? 'id' : 'en';
        if (lang === 'id') {
            return {
                clearConfirm: 'Anda yakin ingin menghapus seluruh riwayat analisis? Tindakan ini tidak dapat dibatalkan.',
                importConfirm: (count: number) => `Menemukan ${count} entri yang valid. Apakah Anda ingin menimpa riwayat Anda saat ini?`,
                importSuccess: 'Riwayat berhasil diimpor!',
                importInvalidEntries: 'Impor gagal: File tidak berisi entri riwayat yang valid.',
                importInvalidFormat: 'Impor gagal: Format file tidak valid.'
            };
        }
    } catch(e) { /* fall through to english */ }
    
    return {
        clearConfirm: 'Are you sure you want to clear the entire analysis history? This action cannot be undone.',
        importConfirm: (count: number) => `Found ${count} valid entries. Do you want to overwrite your current history?`,
        importSuccess: 'History imported successfully!',
        importInvalidEntries: 'Import failed: The file does not contain valid history entries.',
        importInvalidFormat: 'Import failed: Invalid file format.'
    };
};

export const useHistoryStore = () => {
    const [history, setHistory] = useState<HistoryEntry[]>(() => {
        try {
            const storedHistory = window.localStorage.getItem(HISTORY_STORAGE_KEY);
            return storedHistory ? JSON.parse(storedHistory) : [];
        } catch (error) {
            console.error('Error reading history from localStorage', error);
            return [];
        }
    });

    useEffect(() => {
        try {
            window.localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(history));
        } catch (error) {
            console.error('Error saving history to localStorage', error);
        }
    }, [history]);

    const addHistoryEntry = useCallback((entry: Omit<HistoryEntry, 'id' | 'timestamp'>) => {
        const newEntry: HistoryEntry = {
            ...entry,
            id: `hist-${Date.now()}`,
            timestamp: Date.now(),
        };

        setHistory(prevHistory => {
            const updatedHistory = [newEntry, ...prevHistory];
            if (updatedHistory.length > MAX_HISTORY_ITEMS) {
                return updatedHistory.slice(0, MAX_HISTORY_ITEMS);
            }
            return updatedHistory;
        });
    }, []);

    const clearHistory = useCallback(() => {
        const t = getTranslations();
        if (window.confirm(t.clearConfirm)) {
            setHistory([]);
        }
    }, []);
    
    const importHistory = useCallback((entries: HistoryEntry[]) => {
        const t = getTranslations();
        if (Array.isArray(entries)) {
            const validEntries = entries.filter(e => e.id && e.timestamp && e.code && e.result && e.title);
            if (validEntries.length > 0) {
                 if (window.confirm(t.importConfirm(validEntries.length))) {
                    setHistory(validEntries.slice(0, MAX_HISTORY_ITEMS));
                    alert(t.importSuccess);
                 }
            } else {
                alert(t.importInvalidEntries);
            }
        } else {
            alert(t.importInvalidFormat);
        }
    }, []);

    return {
        history,
        addHistoryEntry,
        clearHistory,
        importHistory,
    };
};
