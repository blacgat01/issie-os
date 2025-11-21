
import React, { useState } from 'react';
import { CloseIcon, ClipboardDocumentIcon } from './icons';
import { README_CONTENT, ARCHITECTURE_CONTENT, AI_TOOLS_CONTENT, SOURCE_CODE_CONTENT, NATIVE_BLUEPRINT_CONTENT } from '../lib/docsContent';
import AuditLogViewer from './AuditLogViewer';

interface DocumentationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const DocumentationModal: React.FC<DocumentationModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'README' | 'ARCHITECTURE' | 'AI_TOOLS' | 'SOURCE' | 'NATIVE' | 'LOGS'>('README');
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);

  if (!isOpen) return null;

  const getContent = () => {
    switch (activeTab) {
      case 'README': return README_CONTENT;
      case 'ARCHITECTURE': return ARCHITECTURE_CONTENT;
      case 'AI_TOOLS': return AI_TOOLS_CONTENT;
      case 'SOURCE': return SOURCE_CODE_CONTENT;
      case 'NATIVE': return NATIVE_BLUEPRINT_CONTENT;
      default: return '';
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(getContent());
      setCopyFeedback('Copied!');
      setTimeout(() => setCopyFeedback(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
      setCopyFeedback('Failed to copy');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" aria-modal="true" role="dialog">
      <div className="w-full max-w-6xl h-[90vh] bg-gray-800 rounded-2xl shadow-2xl flex flex-col border border-gray-700">
        <header className="flex items-center justify-between p-4 border-b border-gray-700 flex-shrink-0">
          <h2 className="text-xl font-bold text-white">System Documentation & Source</h2>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-700 text-gray-400 hover:text-white" aria-label="Close documentation">
            <CloseIcon className="w-6 h-6" />
          </button>
        </header>
        
        <div className="flex items-center gap-2 px-4 pt-4 border-b border-gray-700 bg-gray-800/50 overflow-x-auto">
           <button 
                onClick={() => setActiveTab('README')}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === 'README' ? 'border-blue-500 text-blue-400' : 'border-transparent text-gray-400 hover:text-gray-200'}`}
           >
               README
           </button>
           <button 
                onClick={() => setActiveTab('ARCHITECTURE')}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === 'ARCHITECTURE' ? 'border-blue-500 text-blue-400' : 'border-transparent text-gray-400 hover:text-gray-200'}`}
           >
               Architecture
           </button>
           <button 
                onClick={() => setActiveTab('AI_TOOLS')}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === 'AI_TOOLS' ? 'border-blue-500 text-blue-400' : 'border-transparent text-gray-400 hover:text-gray-200'}`}
           >
               Skill Modules
           </button>
           <button 
                onClick={() => setActiveTab('SOURCE')}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === 'SOURCE' ? 'border-emerald-500 text-emerald-400' : 'border-transparent text-gray-400 hover:text-gray-200'}`}
           >
               System Source
           </button>
            <button 
                onClick={() => setActiveTab('NATIVE')}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === 'NATIVE' ? 'border-purple-500 text-purple-400' : 'border-transparent text-gray-400 hover:text-gray-200'}`}
           >
               Native Blueprint
           </button>
           <button 
                onClick={() => setActiveTab('LOGS')}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === 'LOGS' ? 'border-red-500 text-red-400' : 'border-transparent text-gray-400 hover:text-gray-200'}`}
           >
               System Logs (Audit)
           </button>
        </div>

        <div className="flex-1 relative overflow-hidden bg-gray-900">
            {activeTab === 'LOGS' ? (
                <AuditLogViewer />
            ) : (
                <>
                    <button 
                        onClick={handleCopy}
                        className="absolute top-4 right-4 z-10 flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-white bg-gray-700 hover:bg-gray-600 rounded-md shadow-sm border border-gray-600 transition-all"
                    >
                        <ClipboardDocumentIcon className="w-4 h-4" />
                        {copyFeedback || 'Copy Markdown'}
                    </button>
                    <div className="h-full overflow-y-auto p-6">
                        <pre className="text-sm text-gray-300 font-mono whitespace-pre-wrap break-words leading-relaxed">
                            {getContent()}
                        </pre>
                    </div>
                </>
            )}
        </div>
      </div>
    </div>
  );
};

export default DocumentationModal;
