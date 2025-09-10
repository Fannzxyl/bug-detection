import React from 'react';
import { HistoryIcon, SettingsIcon } from './Icon';
import { useSettings } from '../contexts/SettingsContext';

interface HeaderProps {
  onToggleHistory: () => void;
  onToggleSettings: () => void;
}

const Header: React.FC<HeaderProps> = ({ onToggleHistory, onToggleSettings }) => {
  const { t } = useSettings();

  return (
    <header className="sticky top-0 z-20 bg-gray-900/50 backdrop-blur-lg border-b border-white/10">
      <div className="container mx-auto p-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-indigo-400">
            {t('headerTitle')}
        </h1>
        <div className="flex items-center gap-2">
          <button
            onClick={onToggleHistory}
            title={t('historyButtonTooltip')}
            className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 text-gray-300 rounded-md transition-colors"
          >
            <HistoryIcon className="w-5 h-5" />
            <span className="hidden sm:inline">{t('historyButton')}</span>
          </button>
          <button
            onClick={onToggleSettings}
            title={t('settingsButtonTooltip')}
            className="p-2 bg-white/5 hover:bg-white/10 text-gray-300 rounded-md transition-colors"
          >
            <SettingsIcon className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
