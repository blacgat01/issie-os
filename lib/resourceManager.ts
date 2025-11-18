import { NetworkStatus, StreamConfig } from '../types';

/**
 * The Digital Hypothalamus: Responsible for maintaining streaming homeostasis.
 * It provides adaptive streaming configurations to ensure the real-time session
 * remains stable and resilient under variable network conditions.
 */

// --- Configuration Profiles ---
const OPTIMAL_CONFIG: StreamConfig = {
  video: { width: 640, height: 480, frameRate: 5 },
  audio: {},
};

const DEGRADED_CONFIG: StreamConfig = {
  video: { width: 480, height: 360, frameRate: 3 },
  audio: {},
};

const POOR_CONFIG: StreamConfig = {
  video: { width: 320, height: 240, frameRate: 1 },
  audio: {},
};

/**
 * Gets the optimal streaming configuration based on the current network status.
 * @param status The current network health status.
 * @returns A StreamConfig object with adaptive settings.
 */
export const getOptimalStreamConfig = (status: NetworkStatus): StreamConfig => {
  switch (status) {
    case 'Optimal':
      return OPTIMAL_CONFIG;
    case 'Degraded':
      return DEGRADED_CONFIG;
    case 'Poor':
      return POOR_CONFIG;
    default:
      return OPTIMAL_CONFIG;
  }
};

/**
 * Measures real-world network health using the browser's Connection API.
 * @returns The current determined NetworkStatus.
 */
export const getRealNetworkStatus = (): NetworkStatus => {
  // The 'navigator.connection' object is still not standard in all browsers and might be vendor-prefixed.
  const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
  
  if (!connection) {
    // If the API is not supported, we can't measure, so we assume the best.
    return 'Optimal';
  }

  // The 'effectiveType' property gives a good high-level summary of the connection.
  // '4g' -> Optimal
  // '3g' -> Degraded
  // '2g', 'slow-2g' -> Poor
  switch (connection.effectiveType) {
    case '4g':
      // For a 4G connection, we can further check round-trip time and downlink to see if it's truly optimal.
      // A high RTT or low downlink might indicate a degraded "4G" experience.
      if (connection.rtt > 150 || connection.downlink < 5) {
        return 'Degraded';
      }
      return 'Optimal';
    case '3g':
      return 'Degraded';
    case '2g':
    case 'slow-2g':
      return 'Poor';
    default:
      // For unknown types or fast connections like 'ethernet', assume optimal.
      return 'Optimal';
  }
};