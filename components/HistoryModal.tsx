import React, { useState, useMemo, useEffect } from 'react';
import { ConversationSession } from '../types';
import { CloseIcon, TrashIcon } from './icons';
import { Turn } from './Turn';

interface HistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessions: ConversationSession[];
  onClearHistory: () => void;
}

const HistoryModal: React.FC<HistoryModalProps> = ({ isOpen, onClose, sessions, onClearHistory }) => {
  const [selectedSessionId, setSelectedSessionId] = useState<number | null>(null);

  useEffect(() => {
    if (isOpen && sessions.length > 0 && !selectedSessionId) {
      setSelectedSessionId(sessions[0].id);
    }
    if (sessions.length === 0) {
        setSelectedSessionId(null);
    }
  }, [isOpen, sessions, selectedSessionId]);

  const selectedSession = useMemo(() => {
    return sessions.find(s => s.id === selectedSessionId);
  }, [sessions, selectedSessionId]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" aria-modal="true" role="dialog">
      <div className="w-full max-w-4xl h-[90vh] bg-gray-800 rounded-2xl shadow-2xl flex flex-col border border-gray-700">
        <header className="flex items-center justify-between p-4 border-b border-gray-700 flex-shrink-0">
          <h2 className="text-xl font-bold">Conversation History</h2>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-700" aria-label="Close history">
            <CloseIcon className="w-6 h-6" />
          </button>
        </header>
        <div className="flex-1 flex overflow-hidden">
          <aside className="w-1/3 border-r border-gray-700 flex flex-col">
            <div className="p-2">
              <button
                onClick={() => {
                  if (window.confirm('Are you sure you want to delete all conversation history? This action cannot be undone.')) {
                    onClearHistory();
                  }
                }}
                disabled={sessions.length === 0}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-white bg-red-600/80 hover:bg-red-600 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <TrashIcon className="w-4 h-4" />
                Clear All History
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              {sessions.length > 0 ? (
                <ul>
                  {sessions.map(session => (
                    <li key={session.id}>
                      <button
                        onClick={() => setSelectedSessionId(session.id)}
                        className={`w-full text-left px-3 py-3 text-sm transition-colors ${selectedSessionId === session.id ? 'bg-blue-600/50' : 'hover:bg-gray-700/50'}`}
                      >
                        <span className="font-semibold">
                          {new Date(session.timestamp).toLocaleDateString(undefined, { month: 'long', day: 'numeric' })}
                        </span>
                        <span className="block text-xs text-gray-400">
                          {new Date(session.timestamp).toLocaleTimeString()}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="p-4 text-center text-sm text-gray-400">No saved history.</div>
              )}
            </div>
          </aside>
          <main className="flex-1 p-4 overflow-y-auto space-y-6">
            {selectedSession ? (
              selectedSession.turns.map(turn => (
                <Turn key={turn.id} turn={turn} />
              ))
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                <p>Select a session to view the transcript.</p>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
};

export default HistoryModal;
