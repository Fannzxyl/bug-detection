import React, { useState } from 'react';
import type { AnalysisResult, BugReport, DiscoveredFeature, LogSuggestion } from '../types';
import { BugIcon, FeatureIcon, LogIcon, CopyIcon } from './Icon';
import { useSettings } from '../contexts/SettingsContext';

interface AnalysisDisplayProps {
  result: AnalysisResult;
}

const useCopyToClipboard = (text: string) => {
  const { t } = useSettings();
  const [isCopied, setIsCopied] = useState(false);

  const copy = () => {
    navigator.clipboard.writeText(text).then(() => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    });
  };

  const buttonText = isCopied ? t('copiedButton') : t('copyButton');
  return { copy, buttonText, isCopied };
};

const Card: React.FC<{ children: React.ReactNode; icon: React.ReactNode; title: string; count: number; customClasses?: string }> = ({ children, icon, title, count, customClasses }) => (
  <div className={`bg-gray-800/50 backdrop-blur-sm border border-white/10 p-4 rounded-lg shadow-lg ${customClasses}`}>
    <div className="flex items-center gap-3 mb-3 pb-3 border-b border-white/10">
      {icon}
      <h2 className="text-xl font-semibold text-gray-200">{title}</h2>
      <span className="bg-white/10 text-gray-300 text-xs font-bold px-2.5 py-1 rounded-full">{count}</span>
    </div>
    <div className="space-y-4">{children}</div>
  </div>
);

const SeverityBadge: React.FC<{ severity: BugReport['severity'] }> = ({ severity }) => {
  const colorClasses = {
    Critical: 'bg-red-500 text-white',
    High: 'bg-orange-500 text-white',
    Medium: 'bg-yellow-500 text-gray-900',
    Low: 'bg-blue-500 text-white',
    Info: 'bg-gray-500 text-white',
  };
  return (
    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${colorClasses[severity] || 'bg-gray-500 text-white'}`}>
      {severity}
    </span>
  );
};

const BugItem: React.FC<{ bug: BugReport }> = ({ bug }) => {
  const { t } = useSettings();
  const bugText = `${t('lineLabel')} ${bug.line}: [${bug.severity}] ${bug.description}`;
  const { copy, buttonText, isCopied } = useCopyToClipboard(bugText);
  return (
    <div className="p-3 bg-gray-900/40 border border-white/10 rounded-md">
      <div className="flex justify-between items-start gap-2">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <SeverityBadge severity={bug.severity} />
              <span className="font-mono text-sm text-gray-400">{t('lineLabel')} {bug.line}</span>
            </div>
            <p className="text-gray-300">{bug.description}</p>
          </div>
          <button onClick={copy} title={t('copyBugButton')} className={`text-sm flex items-center gap-1 p-1 rounded-md transition-colors ${isCopied ? 'text-green-400' : 'text-gray-400 hover:text-gray-200 hover:bg-white/10'}`}>
            <CopyIcon className="w-4 h-4" />
            <span className="hidden sm:inline">{buttonText}</span>
          </button>
      </div>
    </div>
  );
};

const LogItem: React.FC<{ log: LogSuggestion }> = ({ log }) => {
    const { t } = useSettings();
    return (
        <div className="p-3 bg-gray-900/40 border border-white/10 rounded-md">
            <div className="flex items-start gap-3">
                <div className="font-mono text-sm bg-blue-500/20 text-blue-300 px-2 py-1 rounded">{t('lineLabel')} {log.line}</div>
                <p className="text-gray-300">{log.suggestion}</p>
            </div>
        </div>
    );
};

const FeatureItem: React.FC<{ feature: DiscoveredFeature }> = ({ feature }) => {
    const { t } = useSettings();
    return (
        <div className="p-3 bg-gray-900/40 border border-white/10 rounded-md">
            <div className="flex justify-between items-start mb-2">
                <div>
                    <h4 className="font-bold text-lg text-green-300">{feature.name}</h4>
                    <span className="text-sm font-mono text-green-400 bg-green-500/20 px-2 py-0.5 rounded-md">{feature.featureId}</span>
                </div>
                <span className="text-xs font-semibold capitalize bg-white/10 text-gray-300 px-2 py-1 rounded-full">{feature.status}</span>
            </div>
            <p className="text-gray-400 mb-3">{feature.description}</p>
            
            {feature.risks.length > 0 && (
                <div className="mb-2">
                    <h5 className="font-semibold text-sm text-yellow-300">{t('potentialRisksLabel')}:</h5>
                    <ul className="list-disc list-inside text-sm text-yellow-400 pl-2">
                        {feature.risks.map((risk, i) => <li key={i}>{risk}</li>)}
                    </ul>
                </div>
            )}

            {feature.evidence.length > 0 && (
                <div>
                    <h5 className="font-semibold text-sm text-gray-300">{t('evidenceLabel')}:</h5>
                    <pre className="bg-gray-900/70 p-2 rounded-md text-xs text-gray-400 overflow-x-auto">
                        <code>
                            {feature.evidence.join('\n')}
                        </code>
                    </pre>
                </div>
            )}
        </div>
    );
};

const AnalysisDisplay: React.FC<AnalysisDisplayProps> = ({ result }) => {
  const { t } = useSettings();
  const { bugs, logs, features } = result;

  const resultText = `
--- ${t('bugsCardTitle')} (${bugs.length}) ---
${bugs.map(b => `${t('lineLabel')} ${b.line}: [${b.severity}] ${b.description}`).join('\n')}

--- ${t('logsCardTitle')} (${logs.length}) ---
${logs.map(l => `${t('lineLabel')} ${l.line}: ${l.suggestion}`).join('\n')}

--- ${t('featuresCardTitle')} (${features.length}) ---
${features.map(f => `
Feature: ${f.name} (${f.featureId})
Status: ${f.status}
Description: ${f.description}
Risks: ${f.risks.join(', ') || 'None'}
Evidence:
${f.evidence.join('\n')}
`).join('\n')}
  `.trim();

  const { copy, buttonText, isCopied } = useCopyToClipboard(resultText);

  return (
    <div className="space-y-6">
        <div className="flex justify-end">
            <button
                onClick={copy}
                className={`flex items-center gap-2 px-4 py-2 text-sm rounded-md transition-colors ${isCopied ? 'bg-green-600 text-white' : 'bg-white/10 hover:bg-white/20 text-gray-300'}`}
            >
                <CopyIcon className="w-4 h-4" />
                {t('copyResultsButton')} ({buttonText})
            </button>
        </div>
      <Card icon={<BugIcon className="w-6 h-6 text-red-400" />} title={t('bugsCardTitle')} count={bugs.length}>
        {bugs.length > 0 ? (
          bugs.map((bug, index) => <BugItem key={index} bug={bug} />)
        ) : (
          <p className="text-gray-400">{t('noBugsDetected')}</p>
        )}
      </Card>
      
      <Card icon={<LogIcon className="w-6 h-6 text-blue-400" />} title={t('logsCardTitle')} count={logs.length}>
        {logs.length > 0 ? (
          logs.map((log, index) => <LogItem key={index} log={log} />)
        ) : (
          <p className="text-gray-400">{t('noLogSuggestions')}</p>
        )}
      </Card>

      <Card icon={<FeatureIcon className="w-6 h-6 text-green-400" />} title={t('featuresCardTitle')} count={features.length}>
        {features.length > 0 ? (
          features.map((feature) => <FeatureItem key={feature.featureId} feature={feature} />)
        ) : (
          <p className="text-gray-400">{t('noFeaturesFound')}</p>
        )}
      </Card>
    </div>
  );
};

export default AnalysisDisplay;
