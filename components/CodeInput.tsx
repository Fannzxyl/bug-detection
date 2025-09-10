import React, { useCallback, useRef, useEffect, useState } from 'react';
import { AnalyzeIcon, UploadIcon, ClearIcon } from './Icon';

interface CodeInputProps {
  code: string;
  fileName: string | null;
  onCodeChange: (newCode: string, newFileName: string | null) => void;
  onAnalyze: () => void;
  isLoading: boolean;
}

const CodeInput: React.FC<CodeInputProps> = ({ code, fileName, onCodeChange, onAnalyze, isLoading }) => {
  const [lineCount, setLineCount] = useState<number>(1);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const lines = code.split('\n').length;
    setLineCount(lines > 0 ? lines : 1);
  }, [code]);

  const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        onCodeChange(text, file.name);
      };
      reader.onerror = () => {
        console.error("Failed to read file");
        onCodeChange(code, "Error reading file");
      }
      reader.readAsText(file);
    }
  }, [onCodeChange, code]);

  const handleAnalyzeClick = useCallback(() => {
    onAnalyze();
  }, [onAnalyze]);

  const handleClear = () => {
    onCodeChange('', null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
      event.preventDefault();
      if (!isLoading && code.trim()) {
        onAnalyze();
      }
    }
  };

  return (
    <div className="bg-gray-800 rounded-lg border border-gray-700 shadow-xl overflow-hidden">
      <div className="p-4">
        {/* The parent container now handles scrolling, ensuring line numbers and textarea are always in sync */}
        <div className="bg-gray-900 rounded-md border border-gray-600 focus-within:ring-2 focus-within:ring-cyan-500 transition-shadow overflow-y-auto h-96 min-h-[20rem]">
          <div className="flex">
            <div
              className="flex-shrink-0 p-4 text-right text-gray-500 font-mono select-none bg-gray-900 leading-relaxed sticky top-0"
              aria-hidden="true"
            >
              {Array.from({ length: lineCount }, (_, i) => (
                <div key={i}>{i + 1}</div>
              ))}
            </div>
            <textarea
              value={code}
              onChange={(e) => onCodeChange(e.target.value, null) }
              onKeyDown={handleKeyDown}
              placeholder="Paste your code here... (Ctrl+Enter to analyze)"
              className="flex-grow bg-transparent text-gray-300 font-mono p-4 focus:outline-none leading-relaxed resize-none"
              spellCheck="false"
              disabled={isLoading}
              rows={lineCount} // Ensure textarea has enough rows to avoid internal scrollbar
            />
          </div>
        </div>
        {fileName && (
          <div className="mt-2 text-sm text-gray-400">
            Loaded from: <span className="font-medium text-cyan-400">{fileName}</span>
          </div>
        )}
      </div>
      <div className="bg-gray-800/50 px-4 py-3 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-t border-gray-700">
        <div className="flex items-center gap-2 flex-col sm:flex-row">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
            id="file-upload"
            accept=".js,.ts,.jsx,.tsx,.py,.java,.cs,.go,.rs,.php,.html,.css,.json"
            disabled={isLoading}
          />
          <label htmlFor="file-upload" className="w-full sm:w-auto flex items-center justify-center space-x-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-200 rounded-md cursor-pointer transition disabled:opacity-50 disabled:cursor-not-allowed">
            <UploadIcon className="w-5 h-5" />
            <span>Upload File</span>
          </label>
          {code && (
            <button
              onClick={handleClear}
              disabled={isLoading}
              className="w-full sm:w-auto flex items-center justify-center space-x-2 px-4 py-2 bg-red-800 hover:bg-red-700 text-white rounded-md transition disabled:opacity-50 disabled:cursor-not-allowed"
              title="Clear input"
            >
              <ClearIcon className="w-5 h-5" />
              <span className="sm:hidden">Clear Input</span>
            </button>
          )}
        </div>
        <button
          onClick={handleAnalyzeClick}
          disabled={isLoading || !code.trim()}
          className="flex items-center justify-center space-x-2 px-6 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-semibold rounded-md transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <AnalyzeIcon className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>{isLoading ? 'Analyzing...' : 'Analyze Code'}</span>
        </button>
      </div>
    </div>
  );
};

export default CodeInput;