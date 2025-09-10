import React from 'react';
import { useSettings } from '../contexts/SettingsContext';

const Loader: React.FC = () => {
    const { t } = useSettings();
    return (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-80 backdrop-blur-sm flex flex-col items-center justify-center z-50">
            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-brand-purple"></div>
            <h2 className="text-xl font-semibold text-gray-200 mt-4">{t('loaderTitle')}</h2>
            <p className="text-gray-400">{t('loaderSubtitle')}</p>
        </div>
    );
};

export default Loader;
