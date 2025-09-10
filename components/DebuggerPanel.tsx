import React from 'react';
import { DebuggerState } from '../types';
import { ContinueIcon, StepOverIcon, StopIcon } from './Icon';
import { useSettings } from '../contexts/SettingsContext';

interface DebuggerPanelProps {
  state: DebuggerState;
  onContinue: () => void;
  onStep: () => void;
  onStop: () => void;
}

const DebuggerPanel: React.FC<DebuggerPanelProps> = ({ state, onContinue, onStep, onStop }) => {
  const { t } = useSettings();

  const renderScope = (scope: any) => {
    if (!scope) {
      return <span className="text-gray-500">No scope data.</span>;
    }
    return (
      <pre className="text-xs">
        {JSON.stringify(scope, null, 2)}
      </pre>
    );
  };
  
  return (
    <div className="bg-gray-800/50 border border-white/10 p-4 rounded-lg shadow-lg flex flex-col gap-4 mb-6">
      <div className="flex justify-between items-center pb-3 border-b border-white/10">
        <h2 className="text-xl font-semibold text-gray-200">{t('debuggerTitle')}</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={onContinue}
            disabled={state.isFinished}
            title={t('debuggerContinue')}
            className="flex items-center gap-2 px-3 py-1 bg-green-600 hover:bg-green-500 text-white rounded-md transition-colors disabled:opacity-50"
          >
            <ContinueIcon className="w-5 h-5" />
            <span className="hidden sm:inline">{t('debuggerContinue')}</span>
          </button>
          <button
            onClick={onStep}
            disabled={state.isFinished}
            title={t('debuggerStepOver')}
            className="flex items-center gap-2 px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded-md transition-colors disabled:opacity-50"
          >
            <StepOverIcon className="w-5 h-5" />
             <span className="hidden sm:inline">{t('debuggerStepOver')}</span>
          </button>
          <button
            onClick={onStop}
            title={t('debuggerStop')}
            className="flex items-center gap-2 px-3 py-1 bg-red-600 hover:bg-red-500 text-white rounded-md transition-colors"
          >
            <StopIcon className="w-5 h-5" />
             <span className="hidden sm:inline">{t('debuggerStop')}</span>
          </button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-48">
        <div className="flex flex-col">
          <h3 className="text-lg font-semibold text-gray-300 mb-2">{t('debuggerScope')}</h3>
          <div className="bg-gray-900/50 p-2 rounded-md h-full overflow-auto font-mono text-gray-300">
            {renderScope(state.scope)}
          </div>
        </div>
        <div className="flex flex-col">
          <h3 className="text-lg font-semibold text-gray-300 mb-2">{t('debuggerConsole')}</h3>
          <div className="bg-gray-900/50 p-2 rounded-md h-full overflow-auto font-mono text-gray-300">
            {state.consoleOutput.map((line, i) => (
              <div key={i}>{line}</div>
            ))}
             {state.isFinished && <div className="text-yellow-400">Execution finished.</div>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DebuggerPanel;
