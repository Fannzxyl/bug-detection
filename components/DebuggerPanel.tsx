import React, { useState } from 'react';
import { DebuggerState } from '../types';
import { ContinueIcon, StepOverIcon, StopIcon, RestartIcon } from './Icon';
import { useSettings } from '../contexts/SettingsContext';

interface DebuggerPanelProps {
  state: DebuggerState;
  onContinue: () => void;
  onStep: () => void;
  onStop: () => void;
  onRestart: () => void;
}

const ScopeVariable: React.FC<{ name: string; value: any; level?: number }> = ({ name, value, level = 0 }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const isObject = typeof value === 'object' && value !== null;
    const isArray = Array.isArray(value);

    const toggleExpand = () => isObject && setIsExpanded(!isExpanded);

    const renderPreview = () => {
        if (isArray) return `Array(${value.length})`;
        if (isObject) return `Object`;
        if (typeof value === 'string') return `"${value}"`;
        return String(value);
    };

    const valueColor = typeof value === 'string' ? 'text-green-300' : typeof value === 'number' ? 'text-blue-300' : 'text-purple-300';
    
    return (
        <div style={{ paddingLeft: `${level * 16}px` }}>
            <div onClick={toggleExpand} className={`flex items-center gap-1 text-sm ${isObject ? 'cursor-pointer' : ''}`}>
                {isObject && (
                    <span className="w-4">{isExpanded ? '▼' : '►'}</span>
                )}
                <span className="font-semibold text-gray-300">{name}:</span>
                {!isExpanded && (
                    <span className={`truncate ${valueColor}`}>{renderPreview()}</span>
                )}
            </div>
            {isExpanded && isObject && (
                <div className="border-l border-gray-700 ml-2">
                    {Object.entries(value).map(([key, val]) => (
                        <ScopeVariable key={key} name={key} value={val} level={level + 1} />
                    ))}
                </div>
            )}
        </div>
    );
};

const DebuggerPanel: React.FC<DebuggerPanelProps> = ({ state, onContinue, onStep, onStop, onRestart }) => {
  const { t } = useSettings();
  const { isPaused, isFinished } = state;

  return (
    <div className="bg-gray-800/50 border border-white/10 p-4 rounded-lg shadow-lg flex flex-col gap-4 mb-6">
      <div className="flex justify-between items-center pb-3 border-b border-white/10">
        <h2 className="text-xl font-semibold text-gray-200">{t('debuggerTitle')}</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={onStop}
            title={t('debuggerStop')}
            className="flex items-center gap-2 px-3 py-1 bg-red-600 hover:bg-red-500 text-white rounded-md transition-colors"
          >
            <StopIcon className="w-5 h-5" />
             <span className="hidden sm:inline">{t('debuggerStop')}</span>
          </button>
          <button
            onClick={onRestart}
            title={t('debuggerRestart')}
            className="flex items-center gap-2 px-3 py-1 bg-gray-600 hover:bg-gray-500 text-white rounded-md transition-colors"
          >
            <RestartIcon className="w-5 h-5" />
            <span className="hidden sm:inline">{t('debuggerRestart')}</span>
          </button>
          <button
            onClick={onContinue}
            disabled={!isPaused || isFinished}
            title={t('debuggerContinue')}
            className="flex items-center gap-2 px-3 py-1 bg-green-600 hover:bg-green-500 text-white rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ContinueIcon className="w-5 h-5" />
            <span className="hidden sm:inline">{t('debuggerContinue')}</span>
          </button>
          <button
            onClick={onStep}
            disabled={!isPaused || isFinished}
            title={t('debuggerStepOver')}
            className="flex items-center gap-2 px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <StepOverIcon className="w-5 h-5" />
             <span className="hidden sm:inline">{t('debuggerStepOver')}</span>
          </button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-64">
        <div className="flex flex-col">
          <h3 className="text-lg font-semibold text-gray-300 mb-2">{t('debuggerScope')}</h3>
          <div className="bg-gray-900/50 p-2 rounded-md h-full overflow-auto font-mono text-gray-300">
             {state.scope ? (
               Object.entries(state.scope).map(([key, value]) => (
                  <ScopeVariable key={key} name={key} value={value} />
               ))
             ) : (
                <span className="text-gray-500">Scope not available.</span>
             )}
          </div>
        </div>
        <div className="flex flex-col">
          <h3 className="text-lg font-semibold text-gray-300 mb-2">{t('debuggerConsole')}</h3>
          <div className="bg-gray-900/50 p-2 rounded-md h-full overflow-auto font-mono text-sm text-gray-300">
            {state.consoleOutput.map((line, i) => (
              <div key={i} className="whitespace-pre-wrap">{line}</div>
            ))}
            {state.isFinished && <div className="text-yellow-400 mt-2">{t('debuggerFinished')}</div>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DebuggerPanel;