import { RecordingWithAnalysis } from '../types';
import { TrendingUp, Calendar, Activity, BarChart3 } from 'lucide-react';

interface TrendsViewProps {
  recordings: RecordingWithAnalysis[];
}

export function TrendsView({ recordings }: TrendsViewProps) {
  if (recordings.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <TrendingUp className="w-20 h-20 text-slate-600 mb-4" />
        <p className="text-slate-400 text-lg">No data for trends analysis</p>
        <p className="text-slate-500 text-sm mt-2">Record more audio to see emotional trends</p>
      </div>
    );
  }

  const emotionCounts = recordings.reduce((acc, r) => {
    const emotion = r.emotion_analyses[0]?.emotion;
    if (emotion) {
      acc[emotion] = (acc[emotion] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);

  const emotionData = Object.entries(emotionCounts)
    .map(([emotion, count]) => ({
      emotion,
      count,
      percentage: (count / recordings.length) * 100,
    }))
    .sort((a, b) => b.count - a.count);

  const maxCount = Math.max(...emotionData.map((e) => e.count));

  const recentRecordings = recordings.slice(0, 7).reverse();
  const emotionTimeline = recentRecordings.map((r) => ({
    date: new Date(r.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    emotion: r.emotion_analyses[0]?.emotion || 'Unknown',
    confidence: r.emotion_analyses[0]?.confidence || 0,
  }));

  const avgConfidence = recordings.length > 0
    ? recordings.reduce((sum, r) => sum + (r.emotion_analyses[0]?.confidence || 0), 0) / recordings.length
    : 0;

  const totalDuration = recordings.reduce((sum, r) => sum + r.duration, 0);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl p-6 text-white">
          <div className="flex items-center gap-3 mb-3">
            <Activity className="w-8 h-8" />
            <h3 className="text-lg font-semibold">Total Sessions</h3>
          </div>
          <p className="text-4xl font-bold">{recordings.length}</p>
          <p className="text-blue-200 text-sm mt-2">Emotion analyses completed</p>
        </div>

        <div className="bg-gradient-to-br from-green-600 to-green-700 rounded-xl p-6 text-white">
          <div className="flex items-center gap-3 mb-3">
            <TrendingUp className="w-8 h-8" />
            <h3 className="text-lg font-semibold">Avg Confidence</h3>
          </div>
          <p className="text-4xl font-bold">{(avgConfidence * 100).toFixed(1)}%</p>
          <p className="text-green-200 text-sm mt-2">Analysis accuracy</p>
        </div>

        <div className="bg-gradient-to-br from-purple-600 to-purple-700 rounded-xl p-6 text-white">
          <div className="flex items-center gap-3 mb-3">
            <Calendar className="w-8 h-8" />
            <h3 className="text-lg font-semibold">Total Time</h3>
          </div>
          <p className="text-4xl font-bold">
            {Math.floor(totalDuration / 60)}m
          </p>
          <p className="text-purple-200 text-sm mt-2">Audio analyzed</p>
        </div>
      </div>

      <div className="bg-slate-800 rounded-2xl p-8 border border-slate-700">
        <div className="flex items-center gap-3 mb-6">
          <BarChart3 className="w-6 h-6 text-blue-400" />
          <h2 className="text-xl font-bold text-white">Emotion Distribution</h2>
        </div>

        <div className="space-y-4">
          {emotionData.map((item) => (
            <div key={item.emotion} className="group">
              <div className="flex items-center justify-between mb-2">
                <span className="text-white font-medium">{item.emotion}</span>
                <div className="flex items-center gap-4">
                  <span className="text-slate-400 text-sm">{item.count} recordings</span>
                  <span className="text-blue-400 font-semibold min-w-[50px] text-right">
                    {item.percentage.toFixed(1)}%
                  </span>
                </div>
              </div>
              <div className="relative w-full bg-slate-700 rounded-full h-3 overflow-hidden">
                <div
                  className="absolute top-0 left-0 h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-500"
                  style={{ width: `${(item.count / maxCount) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-slate-800 rounded-2xl p-8 border border-slate-700">
        <div className="flex items-center gap-3 mb-6">
          <Calendar className="w-6 h-6 text-green-400" />
          <h2 className="text-xl font-bold text-white">Recent Emotion Timeline</h2>
        </div>

        {emotionTimeline.length > 0 ? (
          <div className="space-y-4">
            {emotionTimeline.map((item, index) => (
              <div key={index} className="flex items-center gap-4">
                <div className="w-24 text-slate-400 text-sm flex-shrink-0">{item.date}</div>
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-green-500" />
                    <span className="text-white font-medium">{item.emotion}</span>
                    <span className="text-slate-500 text-sm">
                      {(item.confidence * 100).toFixed(1)}% confidence
                    </span>
                  </div>
                  <div className="ml-5 mt-2">
                    <div className="w-full bg-slate-700 rounded-full h-1.5">
                      <div
                        className="h-full bg-gradient-to-r from-green-500 to-blue-500 rounded-full"
                        style={{ width: `${item.confidence * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-slate-400 text-center py-8">No recent data available</p>
        )}
      </div>

      <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-8 border border-slate-700">
        <h2 className="text-xl font-bold text-white mb-4">Key Insights</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-slate-700/50 rounded-lg p-4">
            <p className="text-slate-400 text-sm mb-2">Most Frequent Emotion</p>
            <p className="text-2xl font-bold text-blue-400">{emotionData[0]?.emotion || 'N/A'}</p>
            <p className="text-slate-500 text-sm mt-1">
              Detected in {emotionData[0]?.count || 0} recordings
            </p>
          </div>

          <div className="bg-slate-700/50 rounded-lg p-4">
            <p className="text-slate-400 text-sm mb-2">Emotion Variety</p>
            <p className="text-2xl font-bold text-purple-400">{emotionData.length}</p>
            <p className="text-slate-500 text-sm mt-1">Different emotions detected</p>
          </div>

          <div className="bg-slate-700/50 rounded-lg p-4">
            <p className="text-slate-400 text-sm mb-2">Latest Analysis</p>
            <p className="text-2xl font-bold text-green-400">
              {recordings[0]?.emotion_analyses[0]?.emotion || 'N/A'}
            </p>
            <p className="text-slate-500 text-sm mt-1">
              {recordings[0] &&
                new Date(recordings[0].created_at).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                })}
            </p>
          </div>

          <div className="bg-slate-700/50 rounded-lg p-4">
            <p className="text-slate-400 text-sm mb-2">Analysis Quality</p>
            <p className="text-2xl font-bold text-amber-400">
              {avgConfidence > 0.8 ? 'Excellent' : avgConfidence > 0.6 ? 'Good' : 'Fair'}
            </p>
            <p className="text-slate-500 text-sm mt-1">Based on confidence scores</p>
          </div>
        </div>
      </div>
    </div>
  );
}
