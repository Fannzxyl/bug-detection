import React, { useRef, useCallback } from 'react';
import { AnalyzeIcon, ClearIcon, UploadIcon } from './Icon';
import { useSettings } from '../contexts/SettingsContext';

interface CodeInputProps {
  code: string;
  setCode: (code: string) => void;
  onAnalyze: () => void;
  isLoading: boolean;
  fileName: string | null;
  onFileLoad: (content: string, name: string) => void;
  onClear: () => void;
}

const CodeInput: React.FC<CodeInputProps> = ({ code, setCode, onAnalyze, isLoading, fileName, onFileLoad, onClear }) => {
  const { t } = useSettings();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result;
        if (typeof text === 'string') {
          onFileLoad(text, file.name);
        }
      };
      reader.onerror = () => {
        alert(t('fileReadError'));
      };
      reader.readAsText(file);
      event.target.value = ''; // Reset file input
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleKeyDown = useCallback((event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.ctrlKey && event.key === 'Enter') {
      event.preventDefault();
      if (!isLoading) {
        onAnalyze();
      }
    }
  }, [isLoading, onAnalyze]);

  return (
    <div className="bg-gray-800/50 border border-white/10 p-4 rounded-lg shadow-lg flex flex-col gap-4">
      <div className="relative">
        <textarea
          value={code}
          onChange={(e) => setCode(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={t('codeInputPlaceholder')}
          className="w-full h-80 p-3 bg-gray-900/50 text-gray-300 rounded-lg focus:ring-2 focus:ring-brand-purple focus:outline-none transition-shadow resize-y font-mono text-sm"
          spellCheck="false"
          disabled={isLoading}
        />
        {fileName && (
          <div className="absolute bottom-2 right-2 text-xs bg-gray-900/80 text-gray-400 px-2 py-1 rounded">
            {t('loadedFromFile')}: {fileName}
          </div>
        )}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
            accept=".js,.jsx,.ts,.tsx,.py,.java,.go,.rs,.php,.html,.css,.json,text/*"
          />
          <button
            onClick={handleUploadClick}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 text-gray-300 rounded-md transition-colors disabled:opacity-50"
          >
            <UploadIcon className="w-5 h-5" />
            <span className="hidden sm:inline">{t('uploadFileButton')}</span>
          </button>
          <button
            onClick={onClear}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 text-gray-300 rounded-md transition-colors disabled:opacity-50"
          >
            <ClearIcon className="w-5 h-5" />
            <span className="hidden sm:inline">{t('clearInputButton')}</span>
          </button>
        </div>
        <button
          onClick={onAnalyze}
          disabled={isLoading}
          className="flex items-center justify-center gap-2 px-6 py-2 bg-gradient-to-r from-brand-purple to-indigo-600 hover:from-brand-purple/90 hover:to-indigo-600/90 text-white font-semibold rounded-md transition-all shadow-md hover:shadow-lg hover:shadow-brand-purple/20 disabled:from-gray-500 disabled:to-gray-600 disabled:shadow-none"
        >
          <AnalyzeIcon className="w-5 h-5" />
          {isLoading ? t('analyzingButton') : t('analyzeButton')}
        </button>
      </div>
    </div>
  );
};

export default CodeInput;
