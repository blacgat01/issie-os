import React from 'react';

interface EmotionalMeterProps {
  emotion: string | null;
}

const EmotionalMeter: React.FC<EmotionalMeterProps> = ({ emotion }) => {
  if (!emotion) {
    return null;
  }

  const getEmotionColor = (emotion: string) => {
    const lowerEmotion = emotion.toLowerCase();
    if (['happy', 'pleased', 'amused', 'engaged', 'calm'].some(e => lowerEmotion.includes(e))) {
      return 'bg-green-500/20 text-green-300 border-green-500/50';
    }
    if (['annoyed', 'aggressive', 'frustrated', 'defensive', 'bored'].some(e => lowerEmotion.includes(e))) {
      return 'bg-red-500/20 text-red-300 border-red-500/50';
    }
    if (['suspicious', 'thoughtful', 'curious'].some(e => lowerEmotion.includes(e))) {
      return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/50';
    }
    return 'bg-gray-600/20 text-gray-300 border-gray-600/50';
  };

  return (
    <div className={`absolute top-4 left-4 px-3 py-1.5 rounded-full text-sm font-medium border transition-all duration-300 ease-in-out ${getEmotionColor(emotion)}`}>
      Feeling: <span className="font-bold capitalize">{emotion}</span>
    </div>
  );
};

export default EmotionalMeter;