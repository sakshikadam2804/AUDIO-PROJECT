import { EmotionScore } from '../types';

export interface AnalysisResult {
  primaryEmotion: string;
  confidence: number;
  allEmotions: EmotionScore[];
}

export async function analyzeAudioEmotion(audioBlob: Blob): Promise<AnalysisResult> {
  const humeApiKey = import.meta.env.VITE_HUME_API_KEY;

  if (humeApiKey) {
    return analyzeWithHumeAI(audioBlob, humeApiKey);
  }

  return analyzeWithAudioFeatures(audioBlob);
}

async function analyzeWithHumeAI(audioBlob: Blob, apiKey: string): Promise<AnalysisResult> {
  const formData = new FormData();
  formData.append('file', audioBlob, 'audio.wav');

  try {
    const response = await fetch('https://api.hume.ai/v0/batch/jobs', {
      method: 'POST',
      headers: {
        'X-Hume-Api-Key': apiKey,
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Hume AI API request failed');
    }

    const data = await response.json();
    return parseHumeAIResponse(data);
  } catch (error) {
    console.error('Hume AI analysis failed, falling back to audio features:', error);
    return analyzeWithAudioFeatures(audioBlob);
  }
}

function parseHumeAIResponse(data: any): AnalysisResult {
  const emotions = data.results?.[0]?.predictions?.[0]?.emotions || [];

  const sortedEmotions = emotions
    .map((e: any) => ({
      name: e.name,
      score: e.score,
    }))
    .sort((a: EmotionScore, b: EmotionScore) => b.score - a.score);

  return {
    primaryEmotion: sortedEmotions[0]?.name || 'Neutral',
    confidence: sortedEmotions[0]?.score || 0.5,
    allEmotions: sortedEmotions,
  };
}

async function analyzeWithAudioFeatures(audioBlob: Blob): Promise<AnalysisResult> {
  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  const arrayBuffer = await audioBlob.arrayBuffer();
  const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

  const channelData = audioBuffer.getChannelData(0);

  const energy = calculateEnergy(channelData);
  const zeroCrossingRate = calculateZeroCrossingRate(channelData);
  const pitch = estimatePitch(channelData, audioBuffer.sampleRate);
  const spectralCentroid = calculateSpectralCentroid(channelData, audioBuffer.sampleRate);

  const emotions = classifyEmotionFromFeatures(energy, zeroCrossingRate, pitch, spectralCentroid);

  await audioContext.close();

  return emotions;
}

function calculateEnergy(data: Float32Array): number {
  let sum = 0;
  for (let i = 0; i < data.length; i++) {
    sum += data[i] * data[i];
  }
  return Math.sqrt(sum / data.length);
}

function calculateZeroCrossingRate(data: Float32Array): number {
  let crossings = 0;
  for (let i = 1; i < data.length; i++) {
    if ((data[i] >= 0 && data[i - 1] < 0) || (data[i] < 0 && data[i - 1] >= 0)) {
      crossings++;
    }
  }
  return crossings / data.length;
}

function estimatePitch(data: Float32Array, sampleRate: number): number {
  const maxShift = Math.floor(sampleRate / 50);
  let bestCorrelation = 0;
  let bestShift = 0;

  for (let shift = Math.floor(sampleRate / 500); shift < maxShift; shift++) {
    let correlation = 0;
    const limit = Math.min(data.length - shift, 1000);

    for (let i = 0; i < limit; i++) {
      correlation += data[i] * data[i + shift];
    }

    if (correlation > bestCorrelation) {
      bestCorrelation = correlation;
      bestShift = shift;
    }
  }

  return bestShift > 0 ? sampleRate / bestShift : 0;
}

function calculateSpectralCentroid(data: Float32Array, sampleRate: number): number {
  const fftSize = 2048;
  const realPart = new Float32Array(fftSize);
  const imagPart = new Float32Array(fftSize);

  for (let i = 0; i < Math.min(fftSize, data.length); i++) {
    realPart[i] = data[i];
    imagPart[i] = 0;
  }

  let weightedSum = 0;
  let magnitudeSum = 0;

  for (let i = 0; i < fftSize / 2; i++) {
    const magnitude = Math.sqrt(realPart[i] * realPart[i] + imagPart[i] * imagPart[i]);
    const frequency = (i * sampleRate) / fftSize;
    weightedSum += frequency * magnitude;
    magnitudeSum += magnitude;
  }

  return magnitudeSum > 0 ? weightedSum / magnitudeSum : 0;
}

function classifyEmotionFromFeatures(
  energy: number,
  zcr: number,
  pitch: number,
  spectralCentroid: number
): AnalysisResult {
  const emotions: EmotionScore[] = [];

  const normalizedEnergy = Math.min(energy * 100, 1);
  const normalizedZCR = Math.min(zcr * 1000, 1);
  const normalizedPitch = Math.min(pitch / 500, 1);
  const normalizedSC = Math.min(spectralCentroid / 5000, 1);

  const happyScore = (normalizedEnergy * 0.3 + normalizedPitch * 0.4 + normalizedSC * 0.3);
  emotions.push({ name: 'Happy', score: Math.max(0, Math.min(1, happyScore)) });

  const sadScore = ((1 - normalizedEnergy) * 0.4 + (1 - normalizedPitch) * 0.4 + (1 - normalizedZCR) * 0.2);
  emotions.push({ name: 'Sad', score: Math.max(0, Math.min(1, sadScore)) });

  const angryScore = (normalizedEnergy * 0.35 + normalizedZCR * 0.35 + normalizedSC * 0.3);
  emotions.push({ name: 'Angry', score: Math.max(0, Math.min(1, angryScore)) });

  const fearScore = (normalizedZCR * 0.4 + normalizedPitch * 0.3 + normalizedEnergy * 0.3);
  emotions.push({ name: 'Fear', score: Math.max(0, Math.min(1, fearScore)) });

  const surpriseScore = (normalizedPitch * 0.4 + normalizedEnergy * 0.3 + normalizedZCR * 0.3);
  emotions.push({ name: 'Surprise', score: Math.max(0, Math.min(1, surpriseScore)) });

  const calmScore = ((1 - normalizedEnergy) * 0.4 + (1 - normalizedZCR) * 0.4 + normalizedPitch * 0.2);
  emotions.push({ name: 'Calm', score: Math.max(0, Math.min(1, calmScore)) });

  const neutralScore = 1 - Math.max(...emotions.map(e => e.score));
  emotions.push({ name: 'Neutral', score: Math.max(0, Math.min(1, neutralScore)) });

  const normalizedEmotions = normalizeEmotionScores(emotions);
  const sortedEmotions = normalizedEmotions.sort((a, b) => b.score - a.score);

  return {
    primaryEmotion: sortedEmotions[0].name,
    confidence: sortedEmotions[0].score,
    allEmotions: sortedEmotions,
  };
}

function normalizeEmotionScores(emotions: EmotionScore[]): EmotionScore[] {
  const total = emotions.reduce((sum, e) => sum + e.score, 0);

  if (total === 0) {
    const equalScore = 1 / emotions.length;
    return emotions.map(e => ({ ...e, score: equalScore }));
  }

  return emotions.map(e => ({
    ...e,
    score: e.score / total,
  }));
}
