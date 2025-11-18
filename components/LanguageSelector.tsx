import React from 'react';
import { LANGUAGES } from '../constants';

interface LanguageSelectorProps {
  value: string;
  onChange: (value: string) => void;
  disabled: boolean;
  title: string;
  allowAuto?: boolean;
  disabledLanguage?: string;
}

const LanguageSelector: React.FC<LanguageSelectorProps> = ({ value, onChange, disabled, title, allowAuto = false, disabledLanguage }) => {
  return (
    <div className="flex flex-col space-y-2">
      <label htmlFor={`language-select-${title.replace(/\s+/g, '-')}`} className="text-sm font-medium text-gray-400">
        {title}
      </label>
      <select
        id={`language-select-${title.replace(/\s+/g, '-')}`}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="bg-gray-700 border border-gray-600 text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {allowAuto && <option value="auto">Auto-detect</option>}
        {LANGUAGES.map((lang) => (
          <option key={lang.code} value={lang.code} disabled={lang.code === disabledLanguage}>
            {lang.name}
          </option>
        ))}
      </select>
    </div>
  );
};

export default LanguageSelector;