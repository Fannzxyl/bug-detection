import React from 'react';
import { useSettings } from '../contexts/SettingsContext';
import { CloseIcon } from './Icon';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const { t, language, setLanguage } = useSettings();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm z-50 flex items-center justify-center" onClick={onClose}>
      <div 
        className="bg-gray-900/80 backdrop-blur-xl border border-white/10 rounded-lg shadow-2xl w-full max-w-md p-6 m-4" 
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-200">{t('settingsTitle')}</h2>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-white/10" aria-label={t('settingsCloseLabel')}>
            <CloseIcon className="w-6 h-6 text-gray-400" />
          </button>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2">
            {t('languageLabel')}
          </label>
          <div className="grid grid-cols-2 gap-2 p-1 bg-gray-800/50 rounded-md">
            <button
              onClick={() => setLanguage('en')}
              className={`px-3 py-2 text-sm rounded-md transition-colors ${language === 'en' ? 'bg-brand-purple text-white font-semibold' : 'hover:bg-white/10 text-gray-300'}`}
            >
              English
            </button>
            <button
              onClick={() => setLanguage('id')}
              className={`px-3 py-2 text-sm rounded-md transition-colors ${language === 'id' ? 'bg-brand-purple text-white font-semibold' : 'hover:bg-white/10 text-gray-300'}`}
            >
              Bahasa Indonesia
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
