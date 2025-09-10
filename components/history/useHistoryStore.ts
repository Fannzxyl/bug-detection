import { useState, useEffect, useCallback } from 'react';
import type { HistoryEntry } from '../../types';

const HISTORY_STORAGE_KEY = 'gemini-bug-detector-history';
const MAX_HISTORY_ITEMS = 200;

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
        if (window.confirm('Are you sure you want to clear the entire analysis history? This action cannot be undone.')) {
            setHistory([]);
        }
    }, []);
    
    const importHistory = useCallback((entries: HistoryEntry[]) => {
        if (Array.isArray(entries)) {
            const validEntries = entries.filter(e => e.id && e.timestamp && e.code && e.result && e.title);
            if (validEntries.length > 0) {
                 if (window.confirm(`Found ${validEntries.length} valid entries. Do you want to overwrite your current history?`)) {
                    setHistory(validEntries.slice(0, MAX_HISTORY_ITEMS));
                    alert('History imported successfully!');
                 }
            } else {
                alert('Import failed: The file does not contain valid history entries.');
            }
        } else {
            alert('Import failed: Invalid file format.');
        }
    }, []);

    return {
        history,
        addHistoryEntry,
        clearHistory,
        importHistory,
    };
};