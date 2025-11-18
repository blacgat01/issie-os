import React from 'react';
import { MapPinIcon } from './icons';

interface GroundingSourcesProps {
  chunks: any[] | null;
}

const GroundingSources: React.FC<GroundingSourcesProps> = ({ chunks }) => {
  if (!chunks || chunks.length === 0) {
    return null;
  }

  const mapChunks = chunks.filter(chunk => chunk.maps && chunk.maps.uri);

  if (mapChunks.length === 0) {
    return null;
  }

  return (
    <div className="w-full max-w-lg bg-gray-800/80 border border-gray-700 rounded-lg p-3 text-sm">
      <h3 className="font-semibold text-gray-300 mb-2">Sources:</h3>
      <ul className="space-y-2">
        {mapChunks.map((chunk, index) => (
          <li key={index}>
            <a
              href={chunk.maps.uri}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-blue-400 hover:text-blue-300 hover:underline"
            >
              <MapPinIcon className="w-4 h-4 flex-shrink-0" />
              <span>{chunk.maps.title || 'View on Google Maps'}</span>
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default GroundingSources;
