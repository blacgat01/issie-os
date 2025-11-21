
import React, { useRef, useEffect } from 'react';
import { AppState, TranscriptTurn } from '../types';
import { Turn } from './Turn';

interface TranscriptionDisplayProps {
  history: TranscriptTurn[];
  currentUserTranscript: string;
  currentAssistantTranscript: string;
  isOverlay?: boolean;
  toolCallStatus?: AppState['toolCallStatus'];
}

const TranscriptionDisplay: React.FC<TranscriptionDisplayProps> = ({ history, currentUserTranscript, currentAssistantTranscript, isOverlay = false, toolCallStatus }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current && isOverlay) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [history, currentUserTranscript, currentAssistantTranscript, isOverlay]);

  const turnsContent = (
    <>
      {history.map((turn) => (
        <Turn key={turn.id} turn={turn} />
      ))}
      {(currentUserTranscript || currentAssistantTranscript || toolCallStatus) && (
        <Turn 
            turn={{id: Date.now(), user: currentUserTranscript, assistant: currentAssistantTranscript}} 
            toolCallStatus={toolCallStatus}
        />
      )}
    </>
  );

  if (isOverlay) {
    return (
        <div 
            ref={scrollRef} 
            className="absolute bottom-0 left-0 right-0 h-2/5 p-4 space-y-6 overflow-y-auto
                       bg-gradient-to-t from-black/80 to-transparent
                       [mask-image:linear-gradient(to_top,black_75%,transparent_100%)]"
        >
            {turnsContent}
        </div>
    );
  }

  // Standard mode: Flexible container to grow with content
  return (
    <div className="w-full p-4 space-y-6 bg-gray-900/50 rounded-lg border border-gray-700">
      {turnsContent}
    </div>
  );
};

export default TranscriptionDisplay;
