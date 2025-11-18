import React from 'react';
import { VOICES } from '../constants';

interface VoiceSelectorProps {
  value: string;
  onChange: (value: string) => void;
  disabled: boolean;
}

const VoiceSelector: React.FC<VoiceSelectorProps> = ({ value, onChange, disabled }) => {
  return (
    <div className="flex flex-col space-y-2">
      <label htmlFor="voice-select" className="text-sm font-medium text-gray-400">
        Assistant Voice:
      </label>
      <select
        id="voice-select"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="bg-gray-700 border border-gray-600 text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {VOICES.map((voice) => (
          <option key={voice.name} value={voice.name}>
            {voice.label}
          </option>
        ))}
      </select>
    </div>
  );
};

export default VoiceSelector;
