import { useState } from 'react';
import { RecordingWithAnalysis } from '../types';
import { Search, Download, Trash2, Clock, Activity, FileAudio } from 'lucide-react';

interface HistoryViewProps {
  recordings: RecordingWithAnalysis[];
  onSelectRecording: (recording: RecordingWithAnalysis) => void;
  onDeleteRecording: (id: string) => void;
}

export function HistoryView({ recordings, onSelectRecording, onDeleteRecording }: HistoryViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest'>('newest');

  const filteredRecordings = recordings
    .filter((recording) => {
      const searchLower = searchTerm.toLowerCase();
      const title = recording.title?.toLowerCase() || '';
      const emotion = recording.emotion_analyses[0]?.emotion?.toLowerCase() || '';
      return title.includes(searchLower) || emotion.includes(searchLower);
    })
    .sort((a, b) => {
      const dateA = new Date(a.created_at).getTime();
      const dateB = new Date(b.created_at).getTime();
      return sortBy === 'newest' ? dateB - dateA : dateA - dateB;
    });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
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

  const downloadAsJSON = () => {
    const data = JSON.stringify(recordings, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `emotion-analysis-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadAsCSV = () => {
    const headers = ['Date', 'Duration', 'Primary Emotion', 'Confidence'];
    const rows = recordings.map((r) => [
      new Date(r.created_at).toISOString(),
      r.duration.toString(),
      r.emotion_analyses[0]?.emotion || 'N/A',
      r.emotion_analyses[0]?.confidence.toString() || '0',
    ]);

    const csv = [headers, ...rows].map((row) => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `emotion-analysis-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const totalDuration = recordings.reduce((sum, r) => sum + r.duration, 0);
  const avgConfidence = recordings.length > 0
    ? recordings.reduce((sum, r) => sum + (r.emotion_analyses[0]?.confidence || 0), 0) / recordings.length
    : 0;

  const emotionCounts = recordings.reduce((acc, r) => {
    const emotion = r.emotion_analyses[0]?.emotion;
    if (emotion) {
      acc[emotion] = (acc[emotion] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);

  const mostCommon = Object.entries(emotionCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 border border-slate-700">
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search recordings..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-700 text-white rounded-lg border border-slate-600 focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'newest' | 'oldest')}
            className="px-4 py-2.5 bg-slate-700 text-white rounded-lg border border-slate-600 focus:outline-none focus:border-blue-500 cursor-pointer"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
          </select>

          <button
            onClick={downloadAsJSON}
            className="px-4 py-2.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg border border-slate-600 transition-colors flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            JSON
          </button>

          <button
            onClick={downloadAsCSV}
            className="px-4 py-2.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg border border-slate-600 transition-colors flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            CSV
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
          <div className="bg-slate-700/50 rounded-lg p-4 text-center">
            <p className="text-3xl font-bold text-blue-400">{recordings.length}</p>
            <p className="text-slate-400 text-sm mt-1">Total Recordings</p>
          </div>

          <div className="bg-slate-700/50 rounded-lg p-4 text-center">
            <p className="text-3xl font-bold text-purple-400">
              {(avgConfidence * 100).toFixed(0)}%
            </p>
            <p className="text-slate-400 text-sm mt-1">Avg Confidence</p>
          </div>

          <div className="bg-slate-700/50 rounded-lg p-4 text-center">
            <p className="text-3xl font-bold text-green-400">{formatDuration(totalDuration)}</p>
            <p className="text-slate-400 text-sm mt-1">Total Duration</p>
          </div>

          <div className="bg-slate-700/50 rounded-lg p-4 text-center">
            <p className="text-2xl font-bold text-amber-400">{mostCommon}</p>
            <p className="text-slate-400 text-sm mt-1">Most Common</p>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {filteredRecordings.length === 0 ? (
          <div className="bg-slate-800 rounded-xl p-12 text-center border border-slate-700">
            <FileAudio className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400 text-lg">No recordings found</p>
          </div>
        ) : (
          filteredRecordings.map((recording) => {
            const analysis = recording.emotion_analyses[0];

            return (
              <div
                key={recording.id}
                className="bg-slate-800 rounded-xl p-5 border border-slate-700 hover:border-slate-600 transition-all cursor-pointer group"
                onClick={() => onSelectRecording(recording)}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 rounded-lg bg-blue-600/20 flex items-center justify-center flex-shrink-0">
                        <FileAudio className="w-5 h-5 text-blue-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-white font-medium truncate">
                          {recording.title || `Recording ${recording.id.slice(0, 8)}`}
                        </h3>
                        <p className="text-slate-500 text-sm">{formatDate(recording.created_at)}</p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 ml-13">
                      {analysis && (
                        <>
                          <div className="flex items-center gap-2">
                            <Activity className="w-4 h-4 text-green-400" />
                            <span className="text-sm text-slate-300">{analysis.emotion}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                            <span className="text-sm text-slate-400">
                              {(analysis.confidence * 100).toFixed(1)}% confident
                            </span>
                          </div>
                        </>
                      )}
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-purple-400" />
                        <span className="text-sm text-slate-400">{formatDuration(recording.duration)}</span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteRecording(recording.id);
                    }}
                    className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
