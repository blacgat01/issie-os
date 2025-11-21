
import React from 'react';
import { NetworkStatus } from '../types';
import { WifiIcon, WifiSignalMediumIcon, WifiSignalLowIcon } from './icons';

interface NetworkStatusIndicatorProps {
  status: NetworkStatus;
}

/**
 * UI Component for the Interoceptive Sense: Displays the agent's internal network state.
 */
const NetworkStatusIndicator: React.FC<NetworkStatusIndicatorProps> = ({ status }) => {
  const getDisplay = (currentStatus: NetworkStatus) => {
    switch (currentStatus) {
      case 'Optimal':
        return {
          Icon: WifiIcon,
          color: 'bg-green-500/20 text-green-300 border-green-500/50',
          label: 'Optimal',
        };
      case 'Degraded':
        return {
          Icon: WifiSignalMediumIcon,
          color: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/50',
          label: 'Degraded',
        };
      case 'Poor':
        return {
          Icon: WifiSignalLowIcon,
          color: 'bg-red-500/20 text-red-300 border-red-500/50',
          label: 'Poor',
        };
      default:
        return {
          Icon: WifiIcon,
          color: 'bg-gray-600/20 text-gray-300 border-gray-600/50',
          label: 'Unknown',
        };
    }
  };

  const { Icon, color, label } = getDisplay(status);

  return (
    <div className={`flex items-center space-x-2 px-2 sm:px-3 py-1.5 rounded-full text-sm font-medium border transition-all duration-300 ease-in-out ${color}`} title={`Network Status: ${label}`}>
      <Icon className="w-4 h-4" />
      <span className="hidden sm:inline">{label}</span>
    </div>
  );
};

export default NetworkStatusIndicator;
