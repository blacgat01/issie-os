import React, { useRef } from 'react';
import { PaperClipIcon } from './icons';

interface FileUploadProps {
  onFileUpload: (content: string, filename: string) => void;
  disabled: boolean;
}

const FileUpload: React.FC<FileUploadProps> = ({ onFileUpload, disabled }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        onFileUpload(content, file.name);
      };
      reader.readAsText(file);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        accept=".txt,.csv"
        disabled={disabled}
      />
      <button
        onClick={handleClick}
        disabled={disabled}
        className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-gray-600 hover:bg-gray-500 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
        title="Upload a document for analysis (.txt or .csv)"
      >
        <PaperClipIcon className="w-4 h-4" />
        <span>Load Document</span>
      </button>
    </div>
  );
};

export default FileUpload;
