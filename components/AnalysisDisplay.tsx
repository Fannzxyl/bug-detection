import React, { useState } from 'react';
import type { AnalysisResult, BugReport, DiscoveredFeature } from '../types';
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

const getFeatureStatusClass = (status: DiscoveredFeature['status']): string => {
  switch (status) {
    case 'implemented': return 'bg-green-800 text-green-200';
    case 'partial': return 'bg-yellow-800 text-yellow-200';
    case 'stub': return 'bg-gray-700 text-gray-300';
    default: return 'bg-gray-700 text-gray-300';
  }
};

const FeatureDetailSection: React.FC<{ title: string; items: string[] | undefined }> = ({ title, items }) => {
  if (!items || items.length === 0) return null;
  return (
    <div className="mb-4 last:mb-0">
      <h4 className="text-sm font-semibold text-gray-400 mb-2 uppercase tracking-wider">{title}</h4>
      <ul className="list-none m-0 p-0 space-y-1">
        {items.map((item, i) => (
          <li key={i} className="bg-gray-900/70 p-2 rounded-md font-mono text-xs text-cyan-300 border border-gray-700">{item}</li>
        ))}
      </ul>
    </div>
  );
};


const AnalysisDisplay: React.FC<AnalysisDisplayProps> = ({ result }) => {
    const [copiedBugIndex, setCopiedBugIndex] = useState<number | null>(null);

    const handleCopyBug = (bug: BugReport, index: number) => {
        if (copiedBugIndex === index) return;
        const textToCopy = `Line ${bug.line}: ${bug.description}`;
        navigator.clipboard.writeText(textToCopy).then(() => {
            setCopiedBugIndex(index);
            setTimeout(() => setCopiedBugIndex(null), 2000);
        }).catch(err => {
            console.error('Failed to copy text: ', err);
        });
    };
    
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

    const formatFeaturesForCopy = (features: DiscoveredFeature[]): string => {
        if (!features || features.length === 0) return "";

        const formattedFeatures = features.map(feature => {
            let content = `## ${feature.name} (${feature.status})\n`;
            content += `${feature.description}\n\n`;

            const formatSection = (title: string, items: string[] | undefined) => {
                if (!items || items.length === 0) return '';
                return `**${title}:**\n${items.map(item => `- ${item}`).join('\n')}\n\n`;
            };
            
            content += formatSection('UI Routes', feature.ui?.routes);
            content += formatSection('UI Components', feature.ui?.components);
            content += formatSection('API Endpoints', feature.api?.endpoints);
            content += formatSection('Data Models', feature.data?.models);
            content += formatSection('Risks', feature.risks);
            content += formatSection('Evidence', feature.evidence);

            return content;
        }).join('\n---\n');

        return `Feature Discovery Summary:\n\n${formattedFeatures}`;
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
            {result.bugs.map((bug, index) => {
              const isCopied = copiedBugIndex === index;
              return (
                <li key={index} className="p-4 bg-gray-900 rounded-md border border-gray-700">
                  <div className="flex items-start sm:items-center justify-between space-x-4">
                      <div className="flex-1 flex items-start sm:items-center space-x-4 flex-col sm:flex-row">
                          <div className={`px-3 py-1 text-xs font-bold rounded-full whitespace-nowrap mb-2 sm:mb-0 ${getSeverityClass(bug.severity)}`}>
                              {bug.severity}
                          </div>
                          <div className="flex-1">
                              <p className="text-gray-300">{bug.description}</p>
                              <span className="text-xs font-mono text-cyan-400 mt-1 block">Line: {bug.line}</span>
                          </div>
                      </div>

                      <button
                          onClick={() => handleCopyBug(bug, index)}
                          disabled={isCopied}
                          className="flex-shrink-0 flex items-center space-x-1.5 px-2.5 py-1 bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white rounded-md text-xs transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed"
                          title="Copy bug details"
                      >
                          <CopyIcon className="w-3.5 h-3.5" />
                          <span>{isCopied ? 'Copied!' : 'Copy'}</span>
                      </button>
                  </div>
                </li>
              );
            })}
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
        title="Feature Discovery" 
        icon={<FeatureIcon className="w-6 h-6 text-green-400" />} 
        count={result.features.length}
        copyContent={formatFeaturesForCopy(result.features)}
      >
        {result.features.length > 0 ? (
          <div className="space-y-3">
            {result.features.map((feature, index) => (
              <details key={index} className="bg-gray-900 rounded-lg border border-gray-700 overflow-hidden group">
                <summary className="p-4 cursor-pointer hover:bg-gray-800/50 flex items-center justify-between transition-colors">
                  <div className="flex items-center space-x-4">
                    <span className={`px-2.5 py-1 text-xs font-bold rounded-full whitespace-nowrap ${getFeatureStatusClass(feature.status)}`}>
                      {feature.status}
                    </span>
                    <h3 className="font-semibold text-gray-100">{feature.name}</h3>
                  </div>
                  <svg className="w-5 h-5 text-gray-500 transform transition-transform duration-200 group-open:rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </summary>
                <div className="p-4 border-t border-gray-700 bg-black/10">
                  <p className="text-gray-300 mb-4 pb-4 border-b border-gray-700/50">{feature.description}</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
                    <FeatureDetailSection title="UI Routes" items={feature.ui?.routes} />
                    <FeatureDetailSection title="UI Components" items={feature.ui?.components} />
                    <FeatureDetailSection title="API Endpoints" items={feature.api?.endpoints} />
                    <FeatureDetailSection title="Data Models" items={feature.data?.models} />
                    <FeatureDetailSection title="Potential Risks" items={feature.risks} />
                    <FeatureDetailSection title="Evidence" items={feature.evidence} />
                  </div>
                </div>
              </details>
            ))}
          </div>
        ) : (
          <p className="text-gray-400">Could not determine specific features from the code.</p>
        )}
      </AnalysisCard>
    </div>
  );
};

export default AnalysisDisplay;
