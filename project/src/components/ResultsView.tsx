import { RecordingWithAnalysis } from '../types';
import { EmotionPieChart } from './EmotionPieChart';
import { Clock, Calendar, Activity, TrendingUp } from 'lucide-react';

interface ResultsViewProps {
  recording: RecordingWithAnalysis | null;
}

export function ResultsView({ recording }: ResultsViewProps) {
  if (!recording || recording.emotion_analyses.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Activity className="w-20 h-20 text-slate-600 mb-4" />
        <p className="text-slate-400 text-lg">No analysis results yet</p>
        <p className="text-slate-500 text-sm mt-2">Record or upload audio to see emotion analysis</p>
      </div>
    );
  }

  const analysis = recording.emotion_analyses[0];
  const emotions = analysis.emotions_data.emotions;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDuration = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-8 border border-slate-700 shadow-xl">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-white mb-2">Analysis Results</h2>
            <p className="text-slate-400">
              {recording.title || `Recording ${recording.id.slice(0, 8)}`}
            </p>
          </div>
          <div className="text-right">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-700 rounded-lg">
              <TrendingUp className="w-5 h-5 text-green-400" />
              <span className="text-white font-semibold">
                {(analysis.confidence * 100).toFixed(1)}%
              </span>
            </div>
            <p className="text-slate-500 text-xs mt-1">Confidence</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-slate-700/50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Activity className="w-4 h-4 text-blue-400" />
              <span className="text-slate-400 text-sm">Primary Emotion</span>
            </div>
            <p className="text-xl font-bold text-white">{analysis.emotion}</p>
          </div>

          <div className="bg-slate-700/50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-4 h-4 text-purple-400" />
              <span className="text-slate-400 text-sm">Duration</span>
            </div>
            <p className="text-xl font-bold text-white">{formatDuration(recording.duration)}</p>
          </div>

          <div className="bg-slate-700/50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="w-4 h-4 text-green-400" />
              <span className="text-slate-400 text-sm">Analyzed</span>
            </div>
            <p className="text-sm font-medium text-white">
              {formatDate(analysis.analysis_timestamp)}
            </p>
          </div>
        </div>

        <EmotionPieChart emotions={emotions} />
      </div>

      <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
        <h3 className="text-lg font-semibold text-white mb-4">Analysis Insights</h3>
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <div className="w-2 h-2 rounded-full bg-blue-500 mt-2" />
            <div>
              <p className="text-white font-medium">Dominant Emotion</p>
              <p className="text-slate-400 text-sm">
                The speaker primarily expressed <span className="text-blue-400 font-semibold">{analysis.emotion}</span> with{' '}
                {(analysis.confidence * 100).toFixed(1)}% confidence
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-2 h-2 rounded-full bg-green-500 mt-2" />
            <div>
              <p className="text-white font-medium">Emotional Complexity</p>
              <p className="text-slate-400 text-sm">
                Detected {emotions.length} distinct emotional patterns in the audio sample
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-2 h-2 rounded-full bg-purple-500 mt-2" />
            <div>
              <p className="text-white font-medium">Analysis Method</p>
              <p className="text-slate-400 text-sm">
                Processed using {analysis.model_version} with advanced audio feature extraction
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
