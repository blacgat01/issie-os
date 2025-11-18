
import React from 'react';
import { AppState, TranscriptTurn } from '../types';
import { LoadingSpinner, WrenchScrewdriverIcon } from './icons';
import SimpleChart from './SimpleChart';

interface TurnProps {
    turn: TranscriptTurn;
    toolCallStatus?: AppState['toolCallStatus'];
}

export const Turn: React.FC<TurnProps> = ({ turn, toolCallStatus }) => {
    if (turn.isAutonomous) {
        return (
            <div className="text-center text-sm italic text-blue-400 py-2 my-2 bg-gray-800/50 rounded-md">
                <p>Autonomous Action: {turn.assistant}</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {turn.user && (
                <div className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-500/20 text-blue-300 flex items-center justify-center font-bold text-sm">USER</span>
                    <div className="bg-gray-800 rounded-lg p-3 text-gray-300 min-h-[44px] w-full">
                        <p className="whitespace-pre-wrap">{turn.user}</p>
                    </div>
                </div>
            )}
            <div className="flex items-start gap-3">
                <span className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-500/20 text-indigo-300 flex items-center justify-center font-bold text-sm">AI</span>
                <div className="bg-gray-800 rounded-lg p-3 text-gray-300 min-h-[44px] w-full space-y-2">
                    {turn.emotion && (
                        <div className="inline-block bg-indigo-500/30 text-indigo-200 text-xs font-medium px-2.5 py-0.5 rounded-full capitalize">
                            Sensed Emotion: {turn.emotion}
                        </div>
                    )}
                    
                    {toolCallStatus && !turn.assistant && !turn.chartData ? (
                        <div className="flex items-center gap-2 text-gray-400 italic">
                            <WrenchScrewdriverIcon className="w-4 h-4 flex-shrink-0" />
                            <span>Using tool: <span className="font-semibold text-gray-300">{toolCallStatus.name}</span>...</span>
                            <LoadingSpinner className="w-4 h-4" />
                        </div>
                    ) : (
                         <div>
                            {turn.assistant && <p className="whitespace-pre-wrap mb-2">{turn.assistant}</p>}
                            {turn.chartData && <SimpleChart data={turn.chartData} />}
                            {!turn.assistant && !turn.chartData && <span className="italic">...</span>}
                         </div>
                    )}
                </div>
            </div>
        </div>
    );
};
