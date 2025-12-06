import { useState, useRef, useEffect } from 'react';
import { Mic, Square, Upload } from 'lucide-react';

interface AudioRecorderProps {
  onRecordingComplete: (blob: Blob, duration: number) => void;
  onFileUpload: (file: File) => void;
}

export function AudioRecorder({ onRecordingComplete, onFileUpload }: AudioRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm',
      });

      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const duration = Math.floor(recordingTime);
        onRecordingComplete(blob, duration);

        stream.getTracks().forEach((track) => track.stop());
        setRecordingTime(0);
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setIsRecording(true);

      startTimeRef.current = Date.now();
      timerRef.current = window.setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
        setRecordingTime(elapsed);
      }, 1000);
    } catch (error) {
      console.error('Error accessing microphone:', error);
      alert('Could not access microphone. Please check permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);

      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type.startsWith('audio/')) {
        onFileUpload(file);
      } else {
        alert('Please upload a valid audio file');
      }
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-8 border border-slate-700 shadow-2xl">
        <h2 className="text-2xl font-semibold text-white mb-3 text-center">
          Record or Upload Audio
        </h2>
        <p className="text-slate-400 text-center mb-8">
          Capture emotions from speech with AI analysis
        </p>

        <div className="border-2 border-dashed border-slate-600 rounded-xl p-12 mb-6">
          <div className="flex flex-col items-center">
            <div
              className={`w-32 h-32 rounded-full flex items-center justify-center mb-6 transition-all duration-300 ${
                isRecording
                  ? 'bg-red-500 animate-pulse shadow-lg shadow-red-500/50'
                  : 'bg-blue-600 shadow-lg shadow-blue-500/30'
              }`}
            >
              <Mic className="w-16 h-16 text-white" />
            </div>

            {isRecording ? (
              <div className="text-center">
                <p className="text-white text-lg mb-2">Recording...</p>
                <p className="text-red-400 text-3xl font-mono font-bold mb-6">
                  {formatTime(recordingTime)}
                </p>
                <button
                  onClick={stopRecording}
                  className="px-8 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2 mx-auto"
                >
                  <Square className="w-5 h-5" />
                  Stop Recording
                </button>
              </div>
            ) : (
              <div className="text-center">
                <p className="text-slate-400 mb-6">Click to start recording</p>
                <button
                  onClick={startRecording}
                  className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2 mx-auto shadow-lg"
                >
                  <Mic className="w-5 h-5" />
                  Start Recording
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="text-center">
          <p className="text-slate-400 mb-4">or</p>
          <label className="inline-flex items-center gap-2 px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium cursor-pointer transition-colors">
            <Upload className="w-5 h-5" />
            Upload Audio File
            <input
              type="file"
              accept="audio/*"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>
          <p className="text-slate-500 text-sm mt-3">Supports MP3, WAV, M4A, and more</p>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-3 gap-4 text-center">
        <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
          <p className="text-3xl font-bold text-blue-400 mb-1">7</p>
          <p className="text-slate-400 text-sm">Emotions</p>
          <p className="text-slate-500 text-xs mt-1">AI Analysis</p>
        </div>
        <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
          <p className="text-3xl font-bold text-green-400 mb-1">95%+</p>
          <p className="text-slate-400 text-sm">Accuracy</p>
          <p className="text-slate-500 text-xs mt-1">Advanced ML</p>
        </div>
        <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
          <p className="text-3xl font-bold text-purple-400 mb-1">Real-time</p>
          <p className="text-slate-400 text-sm">Speed</p>
          <p className="text-slate-500 text-xs mt-1">Instant Results</p>
        </div>
      </div>
    </div>
  );
}
