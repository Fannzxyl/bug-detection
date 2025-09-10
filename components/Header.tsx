import React from 'react';
import { BugIcon, HistoryIcon } from './Icon';

interface HeaderProps {
  onToggleHistory: () => void;
}

const Header: React.FC<HeaderProps> = ({ onToggleHistory }) => {
  return (
    <header className="bg-gray-800/50 backdrop-blur-sm border-b border-gray-700 sticky top-0 z-10">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <BugIcon className="w-8 h-8 text-cyan-400" />
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Gemini Bug Detector
            </h1>
          </div>
          <button
            onClick={onToggleHistory}
            className="flex items-center space-x-2 px-3 py-2 bg-gray-700/50 hover:bg-gray-700 text-gray-200 rounded-md transition"
            title="Toggle History (Ctrl+H)"
          >
            <HistoryIcon className="w-5 h-5" />
            <span className="hidden sm:inline">History</span>
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;