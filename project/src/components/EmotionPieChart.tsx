import { EmotionScore } from '../types';
import { Smile, Frown, Flame, Zap, Meh, Heart, AlertCircle } from 'lucide-react';

interface EmotionPieChartProps {
  emotions: EmotionScore[];
}

const emotionConfig: Record<string, { color: string; icon: any; gradient: string }> = {
  Happy: {
    color: '#10b981',
    icon: Smile,
    gradient: 'from-emerald-500 to-green-600'
  },
  Sad: {
    color: '#3b82f6',
    icon: Frown,
    gradient: 'from-blue-500 to-blue-600'
  },
  Angry: {
    color: '#ef4444',
    icon: Flame,
    gradient: 'from-red-500 to-red-600'
  },
  Fear: {
    color: '#8b5cf6',
    icon: AlertCircle,
    gradient: 'from-violet-500 to-purple-600'
  },
  Surprise: {
    color: '#f59e0b',
    icon: Zap,
    gradient: 'from-amber-500 to-orange-600'
  },
  Calm: {
    color: '#06b6d4',
    icon: Heart,
    gradient: 'from-cyan-500 to-teal-600'
  },
  Neutral: {
    color: '#6b7280',
    icon: Meh,
    gradient: 'from-gray-500 to-slate-600'
  },
};

export function EmotionPieChart({ emotions }: EmotionPieChartProps) {
  const total = emotions.reduce((sum, e) => sum + e.score, 0);
  const normalizedEmotions = emotions.map(e => ({
    ...e,
    percentage: (e.score / total) * 100,
  }));

  const topEmotions = normalizedEmotions.slice(0, 5);

  let cumulativePercentage = 0;
  const segments = topEmotions.map((emotion) => {
    const startPercentage = cumulativePercentage;
    cumulativePercentage += emotion.percentage;
    return {
      ...emotion,
      startPercentage,
      endPercentage: cumulativePercentage,
    };
  });

  return (
    <div className="w-full">
      <div className="flex flex-col lg:flex-row gap-8 items-center">
        <div className="relative w-64 h-64 flex-shrink-0">
          <svg viewBox="0 0 200 200" className="w-full h-full transform -rotate-90">
            {segments.map((segment, index) => {
              const startAngle = (segment.startPercentage / 100) * 360;
              const endAngle = (segment.endPercentage / 100) * 360;
              const largeArcFlag = endAngle - startAngle > 180 ? 1 : 0;

              const startX = 100 + 80 * Math.cos((startAngle * Math.PI) / 180);
              const startY = 100 + 80 * Math.sin((startAngle * Math.PI) / 180);
              const endX = 100 + 80 * Math.cos((endAngle * Math.PI) / 180);
              const endY = 100 + 80 * Math.sin((endAngle * Math.PI) / 180);

              const pathData = [
                `M 100 100`,
                `L ${startX} ${startY}`,
                `A 80 80 0 ${largeArcFlag} 1 ${endX} ${endY}`,
                `Z`,
              ].join(' ');

              const config = emotionConfig[segment.name] || emotionConfig.Neutral;

              return (
                <g key={segment.name}>
                  <path
                    d={pathData}
                    fill={config.color}
                    className="transition-all duration-300 hover:opacity-80"
                    style={{
                      filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))',
                    }}
                  />
                </g>
              );
            })}
            <circle cx="100" cy="100" r="45" fill="#1e293b" />
          </svg>

          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <p className="text-3xl font-bold text-white">
                {topEmotions[0]?.percentage.toFixed(0)}%
              </p>
              <p className="text-slate-400 text-sm mt-1">Primary</p>
            </div>
          </div>
        </div>

        <div className="flex-1 w-full">
          <h3 className="text-lg font-semibold text-white mb-4">Emotion Breakdown</h3>
          <div className="space-y-3">
            {normalizedEmotions.map((emotion) => {
              const config = emotionConfig[emotion.name] || emotionConfig.Neutral;
              const Icon = config.icon;

              return (
                <div key={emotion.name} className="group">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-8 h-8 rounded-lg bg-gradient-to-br ${config.gradient} flex items-center justify-center`}
                      >
                        <Icon className="w-5 h-5 text-white" />
                      </div>
                      <span className="text-white font-medium">{emotion.name}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-slate-400 text-sm">
                        {(emotion.score * 100).toFixed(1)}%
                      </span>
                      <span className="text-slate-500 text-xs font-mono">
                        {emotion.score.toFixed(3)}
                      </span>
                    </div>
                  </div>
                  <div className="w-full bg-slate-700 rounded-full h-2.5 overflow-hidden">
                    <div
                      className={`h-full bg-gradient-to-r ${config.gradient} transition-all duration-500 ease-out rounded-full`}
                      style={{ width: `${emotion.percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
