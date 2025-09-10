
import React, { useState } from 'react';
import type { AnalysisResult, BugReport } from '../types';
import { BugIcon, LogIcon, FeatureIcon, CopyIcon } from './Icon';

interface AnalysisDisplayProps {
  result: AnalysisResult;
}

const getSeverityClass = (severity: BugReport['severity']): string => {
  switch (severity.toLowerCase()) {
    case 'critical':
      return 'bg-red-800 text-red-100 border-red-600';
    case 'high':
      return 'bg-orange-800 text-orange-100 border-orange-600';
    case 'medium':
      return 'bg-yellow-800 text-yellow-100 border-yellow-600';
    case 'low':
      return 'bg-blue-800 text-blue-100 border-blue-600';
    default:
      return 'bg-gray-700 text-gray-200 border-gray-600';
  }
};

interface AnalysisCardProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  count: number;
  copyContent: string;
}

const AnalysisCard: React.FC<AnalysisCardProps> = ({ title, icon, children, count, copyContent }) => {
    const [isCopied, setIsCopied] = useState(false);

    const handleCopy = () => {
        if (!copyContent || isCopied || count === 0) return;

        navigator.clipboard.writeText(copyContent).then(() => {
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000); // Reset after 2 seconds
        }).catch(err => {
            console.error('Failed to copy text: ', err);
        });
    };
    
    return (
        <div className="bg-gray-800/50 rounded-lg border border-gray-700 shadow-lg">
            <div className="flex items-center justify-between p-4 border-b border-gray-700">
                <div className="flex items-center space-x-3">
                    {icon}
                    <h2 className="text-xl font-semibold text-white">{title}</h2>
                    <span className="flex items-center justify-center w-6 h-6 text-sm font-bold text-gray-900 bg-cyan-400 rounded-full">{count}</span>
                </div>
                {count > 0 && (
                     <button
                        onClick={handleCopy}
                        disabled={isCopied}
                        className="flex items-center space-x-2 px-3 py-1 bg-gray-700 hover:bg-gray-600 text-gray-200 rounded-md text-sm transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed"
                        title="Copy results to clipboard"
                     >
                        <CopyIcon className="w-4 h-4" />
                        <span>{isCopied ? 'Copied!' : 'Copy'}</span>
                     </button>
                )}
            </div>
            <div className="p-4">
                {children}
            </div>
        </div>
    );
};


const AnalysisDisplay: React.FC<AnalysisDisplayProps> = ({ result }) => {
    
    const formatBugsForCopy = (bugs: BugReport[]): string => {
        if (!bugs || bugs.length === 0) return "";
        return `Bugs Detected:\n\n${bugs.map(bug => 
            `- [${bug.severity}] Line ${bug.line}: ${bug.description}`
        ).join('\n')}`;
    };

    const formatLogsForCopy = (logs: AnalysisResult['logs']): string => {
        if (!logs || logs.length === 0) return "";
         return `Logging Suggestions:\n\n${logs.map(log => 
            `- Line ${log.line}: ${log.suggestion}`
        ).join('\n')}`;
    };

    const formatFeaturesForCopy = (features: string[]): string => {
        if (!features || features.length === 0) return "";
        return `Feature Summary:\n\n${features.map(feature => 
            `- ${feature}`
        ).join('\n')}`;
    };

  return (
    <div className="space-y-8 animate-fade-in">
      <AnalysisCard 
        title="Bugs Detected" 
        icon={<BugIcon className="w-6 h-6 text-red-400" />} 
        count={result.bugs.length}
        copyContent={formatBugsForCopy(result.bugs)}
      >
        {result.bugs.length > 0 ? (
          <ul className="space-y-4">
            {result.bugs.map((bug, index) => (
              <li key={index} className="p-4 bg-gray-900 rounded-md border border-gray-700">
                <div className="flex items-start sm:items-center space-x-4 flex-col sm:flex-row">
                    <div className={`px-3 py-1 text-xs font-bold rounded-full whitespace-nowrap mb-2 sm:mb-0 ${getSeverityClass(bug.severity)}`}>
                        {bug.severity}
                    </div>
                    <div className="flex-1">
                        <p className="text-gray-300">{bug.description}</p>
                        <span className="text-xs font-mono text-cyan-400 mt-1 block">Line: {bug.line}</span>
                    </div>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-400">No bugs detected. Great job!</p>
        )}
      </AnalysisCard>

      <AnalysisCard 
        title="Logging Suggestions" 
        icon={<LogIcon className="w-6 h-6 text-yellow-400" />} 
        count={result.logs.length}
        copyContent={formatLogsForCopy(result.logs)}
      >
        {result.logs.length > 0 ? (
          <ul className="space-y-3">
            {result.logs.map((log, index) => (
              <li key={index} className="p-3 bg-gray-900 rounded-md flex items-start space-x-3 border border-gray-700">
                <span className="text-sm font-mono text-cyan-400 pt-1">L{log.line}</span>
                <p className="text-gray-300 flex-1">{log.suggestion}</p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-400">No specific logging suggestions at this time.</p>
        )}
      </AnalysisCard>

      <AnalysisCard 
        title="Feature Summary" 
        icon={<FeatureIcon className="w-6 h-6 text-green-400" />} 
        count={result.features.length}
        copyContent={formatFeaturesForCopy(result.features)}
      >
        {result.features.length > 0 ? (
          <ul className="space-y-2 list-disc list-inside text-gray-300">
            {result.features.map((feature, index) => (
              <li key={index}>{feature}</li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-400">Could not determine specific features from the code.</p>
        )}
      </AnalysisCard>
    </div>
  );
};

export default AnalysisDisplay;