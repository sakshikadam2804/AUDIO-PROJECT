import { useState, useEffect } from 'react';
import { Mic, BarChart3, TrendingUp, History } from 'lucide-react';
import { AudioRecorder } from './components/AudioRecorder';
import { ResultsView } from './components/ResultsView';
import { HistoryView } from './components/HistoryView';
import { TrendsView } from './components/TrendsView';
import { supabase } from './lib/supabase';
import { analyzeAudioEmotion } from './services/emotionAnalysis';
import { RecordingWithAnalysis } from './types';

type TabType = 'analyze' | 'results' | 'trends' | 'history';

function App() {
  const [activeTab, setActiveTab] = useState<TabType>('analyze');
  const [recordings, setRecordings] = useState<RecordingWithAnalysis[]>([]);
  const [currentRecording, setCurrentRecording] = useState<RecordingWithAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    loadRecordings();
  }, []);

  const loadRecordings = async () => {
    const { data, error } = await supabase
      .from('recordings')
      .select(`
        *,
        emotion_analyses (*)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading recordings:', error);
      return;
    }

    setRecordings(data as RecordingWithAnalysis[]);
  };

  const handleRecordingComplete = async (blob: Blob, duration: number) => {
    setIsAnalyzing(true);

    try {
      const timestamp = Date.now();
      const fileName = `recording-${timestamp}.webm`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('audio-recordings')
        .upload(fileName, blob);

      let audioUrl = '';

      if (uploadError) {
        console.error('Storage upload failed, using blob URL:', uploadError);
        audioUrl = URL.createObjectURL(blob);
      } else {
        const { data: { publicUrl } } = supabase.storage
          .from('audio-recordings')
          .getPublicUrl(uploadData.path);
        audioUrl = publicUrl;
      }

      const { data: recordingData, error: recordingError } = await supabase
        .from('recordings')
        .insert({
          audio_url: audioUrl,
          duration,
          file_size: blob.size,
          file_type: blob.type,
          analyzed: false,
        })
        .select()
        .single();

      if (recordingError) {
        console.error('Error saving recording:', recordingError);
        throw recordingError;
      }

      const analysisResult = await analyzeAudioEmotion(blob);

      const { data: analysisData, error: analysisError } = await supabase
        .from('emotion_analyses')
        .insert({
          recording_id: recordingData.id,
          emotion: analysisResult.primaryEmotion,
          confidence: analysisResult.confidence,
          emotions_data: { emotions: analysisResult.allEmotions },
        })
        .select()
        .single();

      if (analysisError) {
        console.error('Error saving analysis:', analysisError);
        throw analysisError;
      }

      await supabase
        .from('recordings')
        .update({ analyzed: true })
        .eq('id', recordingData.id);

      const completedRecording: RecordingWithAnalysis = {
        ...recordingData,
        emotion_analyses: [analysisData],
      };

      setCurrentRecording(completedRecording);
      setActiveTab('results');
      await loadRecordings();
    } catch (error) {
      console.error('Error processing recording:', error);
      alert('Failed to analyze recording. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleFileUpload = async (file: File) => {
    setIsAnalyzing(true);

    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const arrayBuffer = await file.arrayBuffer();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      const duration = Math.floor(audioBuffer.duration);
      await audioContext.close();

      const timestamp = Date.now();
      const fileName = `upload-${timestamp}-${file.name}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('audio-recordings')
        .upload(fileName, file);

      let audioUrl = '';

      if (uploadError) {
        console.error('Storage upload failed, using blob URL:', uploadError);
        audioUrl = URL.createObjectURL(file);
      } else {
        const { data: { publicUrl } } = supabase.storage
          .from('audio-recordings')
          .getPublicUrl(uploadData.path);
        audioUrl = publicUrl;
      }

      const { data: recordingData, error: recordingError } = await supabase
        .from('recordings')
        .insert({
          title: file.name,
          audio_url: audioUrl,
          duration,
          file_size: file.size,
          file_type: file.type,
          analyzed: false,
        })
        .select()
        .single();

      if (recordingError) {
        console.error('Error saving recording:', recordingError);
        throw recordingError;
      }

      const analysisResult = await analyzeAudioEmotion(file);

      const { data: analysisData, error: analysisError } = await supabase
        .from('emotion_analyses')
        .insert({
          recording_id: recordingData.id,
          emotion: analysisResult.primaryEmotion,
          confidence: analysisResult.confidence,
          emotions_data: { emotions: analysisResult.allEmotions },
        })
        .select()
        .single();

      if (analysisError) {
        console.error('Error saving analysis:', analysisError);
        throw analysisError;
      }

      await supabase
        .from('recordings')
        .update({ analyzed: true })
        .eq('id', recordingData.id);

      const completedRecording: RecordingWithAnalysis = {
        ...recordingData,
        emotion_analyses: [analysisData],
      };

      setCurrentRecording(completedRecording);
      setActiveTab('results');
      await loadRecordings();
    } catch (error) {
      console.error('Error processing file:', error);
      alert('Failed to analyze audio file. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleDeleteRecording = async (id: string) => {
    if (!confirm('Are you sure you want to delete this recording?')) {
      return;
    }

    const { error } = await supabase.from('recordings').delete().eq('id', id);

    if (error) {
      console.error('Error deleting recording:', error);
      alert('Failed to delete recording');
      return;
    }

    if (currentRecording?.id === id) {
      setCurrentRecording(null);
    }

    await loadRecordings();
  };

  const handleSelectRecording = (recording: RecordingWithAnalysis) => {
    setCurrentRecording(recording);
    setActiveTab('results');
  };

  const tabs = [
    { id: 'analyze' as TabType, label: 'Analyze', icon: Mic },
    { id: 'results' as TabType, label: 'Results', icon: BarChart3 },
    { id: 'trends' as TabType, label: 'Trends', icon: TrendingUp },
    { id: 'history' as TabType, label: 'History', icon: History },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <header className="text-center mb-12">
          <h1 className="text-5xl font-bold text-white mb-3 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
            Audio Emotion Analysis
          </h1>
          <p className="text-slate-400 text-lg">AI-Powered Sentiment Detection & Analysis</p>
        </header>

        <div className="mb-8">
          <div className="flex flex-wrap gap-2 bg-slate-800/50 p-2 rounded-xl border border-slate-700">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 min-w-[140px] flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
                    activeTab === tab.id
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/50'
                      : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        <main>
          {isAnalyzing && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
              <div className="bg-slate-800 rounded-2xl p-8 border border-slate-700 text-center max-w-md">
                <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">Analyzing Audio...</h3>
                <p className="text-slate-400">Processing emotional patterns and features</p>
              </div>
            </div>
          )}

          {activeTab === 'analyze' && (
            <AudioRecorder
              onRecordingComplete={handleRecordingComplete}
              onFileUpload={handleFileUpload}
            />
          )}

          {activeTab === 'results' && <ResultsView recording={currentRecording} />}

          {activeTab === 'trends' && <TrendsView recordings={recordings} />}

          {activeTab === 'history' && (
            <HistoryView
              recordings={recordings}
              onSelectRecording={handleSelectRecording}
              onDeleteRecording={handleDeleteRecording}
            />
          )}
        </main>
      </div>
    </div>
  );
}

export default App;
