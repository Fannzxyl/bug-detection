import React, { createContext, useContext, ReactNode } from 'react';
import { useHistoryStore } from './useHistoryStore';
import type { HistoryEntry } from '../../types';

interface HistoryContextType {
    history: HistoryEntry[];
    addHistoryEntry: (entry: Omit<HistoryEntry, 'id' | 'timestamp'>) => void;
    clearHistory: () => void;
    importHistory: (entries: HistoryEntry[]) => void;
}

const HistoryContext = createContext<HistoryContextType | undefined>(undefined);

export const HistoryProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const store = useHistoryStore();
    return (
        <HistoryContext.Provider value={store}>
            {children}
        </HistoryContext.Provider>
    );
};

export const useHistory = (): HistoryContextType => {
    const context = useContext(HistoryContext);
    if (!context) {
        throw new Error('useHistory must be used within a HistoryProvider');
    }
    return context;
};