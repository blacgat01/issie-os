
import React from 'react';
import { ChartData } from '../types';

interface SimpleChartProps {
  data: ChartData;
}

const SimpleChart: React.FC<SimpleChartProps> = ({ data }) => {
  const { type, title, data: points } = data;
  const maxValue = Math.max(...points.map(p => p.value));
  const chartHeight = 200;
  const chartWidth = 400;
  const padding = 40;

  // Basic color palette
  const colors = ['#60a5fa', '#34d399', '#fbbf24', '#f87171', '#a78bfa'];

  return (
    <div className="w-full max-w-md bg-gray-800/80 border border-gray-700 rounded-lg p-4 shadow-lg mt-2">
      <h4 className="text-sm font-bold text-gray-200 mb-4 text-center">{title}</h4>
      
      <div className="relative w-full h-[250px] flex items-center justify-center">
        <svg viewBox={`0 0 ${chartWidth + padding * 2} ${chartHeight + padding * 2}`} className="w-full h-full overflow-visible">
          {/* Axes */}
          <line x1={padding} y1={chartHeight + padding} x2={chartWidth + padding} y2={chartHeight + padding} stroke="#4b5563" strokeWidth="2" />
          <line x1={padding} y1={padding} x2={padding} y2={chartHeight + padding} stroke="#4b5563" strokeWidth="2" />

          {type === 'bar' && points.map((point, index) => {
            const barWidth = (chartWidth / points.length) * 0.6;
            const x = padding + (index * (chartWidth / points.length)) + (chartWidth / points.length - barWidth) / 2;
            const height = (point.value / maxValue) * chartHeight;
            const y = chartHeight + padding - height;
            
            return (
              <g key={index} className="group">
                <rect
                  x={x}
                  y={y}
                  width={barWidth}
                  height={height}
                  fill={colors[index % colors.length]}
                  className="transition-all duration-300 hover:opacity-80"
                />
                <text x={x + barWidth/2} y={chartHeight + padding + 15} textAnchor="middle" fill="#9ca3af" fontSize="10" className="capitalize">
                  {point.label.substring(0, 6)}
                </text>
                <text x={x + barWidth/2} y={y - 5} textAnchor="middle" fill="white" fontSize="10" fontWeight="bold">
                  {point.value}
                </text>
              </g>
            );
          })}

          {type === 'line' && (
             <g>
               <polyline
                 fill="none"
                 stroke="#60a5fa"
                 strokeWidth="3"
                 points={points.map((point, index) => {
                    const x = padding + (index * (chartWidth / (points.length - 1 || 1)));
                    const y = chartHeight + padding - ((point.value / maxValue) * chartHeight);
                    return `${x},${y}`;
                 }).join(' ')}
               />
               {points.map((point, index) => {
                  const x = padding + (index * (chartWidth / (points.length - 1 || 1)));
                  const y = chartHeight + padding - ((point.value / maxValue) * chartHeight);
                  return (
                    <g key={index}>
                      <circle cx={x} cy={y} r="4" fill="#3b82f6" stroke="white" strokeWidth="2" />
                      <text x={x} y={chartHeight + padding + 15} textAnchor="middle" fill="#9ca3af" fontSize="10" className="capitalize">
                        {point.label.substring(0, 6)}
                      </text>
                       <text x={x} y={y - 10} textAnchor="middle" fill="white" fontSize="10" fontWeight="bold">
                        {point.value}
                       </text>
                    </g>
                  );
               })}
             </g>
          )}
        </svg>
      </div>
    </div>
  );
};

export default SimpleChart;
