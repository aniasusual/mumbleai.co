/**
 * useVoiceRecorder — portable microphone recording for browser and mobile webviews.
 * Prefers MediaRecorder with a supported MIME type and falls back to WAV capture.
 */
import { useState, useRef, useCallback, useEffect } from "react";

const RECORDER_MIME_CANDIDATES = [
  "audio/webm;codecs=opus",
  "audio/webm",
  "audio/mp4",
  "audio/mp4;codecs=mp4a.40.2",
  "video/mp4",
  "audio/ogg;codecs=opus",
  "audio/ogg",
];

const normalizeMimeType = (mimeType = "") => {
  const normalized = mimeType.split(";")[0].trim().toLowerCase();
  if (normalized === "video/mp4") return "audio/mp4";
  if (normalized === "audio/x-wav" || normalized === "audio/wave") return "audio/wav";
  return normalized;
};

const getAudioContextClass = () => window.AudioContext || window.webkitAudioContext;

const encodeWav = (samples, sampleRate) => {
  const totalSamples = samples.reduce((count, chunk) => count + chunk.length, 0);
  const buffer = new ArrayBuffer(44 + totalSamples * 2);
  const view = new DataView(buffer);

  const writeString = (offset, text) => {
    for (let i = 0; i < text.length; i += 1) {
      view.setUint8(offset + i, text.charCodeAt(i));
    }
  };

  writeString(0, "RIFF");
  view.setUint32(4, 36 + totalSamples * 2, true);
  writeString(8, "WAVE");
  writeString(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeString(36, "data");
  view.setUint32(40, totalSamples * 2, true);

  let offset = 44;
  for (const chunk of samples) {
    for (let i = 0; i < chunk.length; i += 1) {
      const sample = Math.max(-1, Math.min(1, chunk[i]));
      view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true);
      offset += 2;
    }
  }

  return new Blob([buffer], { type: "audio/wav" });
};

export function useVoiceRecorder() {
  const [isRecording, setIsRecording] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);

  const mediaRecorderRef = useRef(null);
  const mediaMimeTypeRef = useRef("");
  const recordingModeRef = useRef(null);
  const recordingActiveRef = useRef(false);
  const audioChunksRef = useRef([]);
  const wavChunksRef = useRef([]);
  const sampleRateRef = useRef(44100);
  const analyserRef = useRef(null);
  const animFrameRef = useRef(null);
  const streamRef = useRef(null);
  const audioContextRef = useRef(null);
  const sourceNodeRef = useRef(null);
  const monitorGainRef = useRef(null);
  const processorNodeRef = useRef(null);

  const stopLevelMeter = useCallback(() => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    setAudioLevel(0);
  }, []);

  const cleanupAudioGraph = useCallback(async () => {
    if (processorNodeRef.current) {
      processorNodeRef.current.disconnect();
      processorNodeRef.current.onaudioprocess = null;
      processorNodeRef.current = null;
    }
    if (sourceNodeRef.current) {
      sourceNodeRef.current.disconnect();
      sourceNodeRef.current = null;
    }
    if (monitorGainRef.current) {
      monitorGainRef.current.disconnect();
      monitorGainRef.current = null;
    }
    if (audioContextRef.current) {
      const audioContext = audioContextRef.current;
      audioContextRef.current = null;
      await audioContext.close().catch(() => {});
    }
    analyserRef.current = null;
  }, []);

  const cleanupStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  }, []);

  const resetRecorderRefs = useCallback(() => {
    mediaRecorderRef.current = null;
    mediaMimeTypeRef.current = "";
    recordingModeRef.current = null;
    recordingActiveRef.current = false;
    audioChunksRef.current = [];
    wavChunksRef.current = [];
    sampleRateRef.current = 44100;
  }, []);

  const finalizeStop = useCallback(async () => {
    stopLevelMeter();
    cleanupStream();
    await cleanupAudioGraph();
    setIsRecording(false);
    resetRecorderRefs();
  }, [cleanupAudioGraph, cleanupStream, resetRecorderRefs, stopLevelMeter]);

  useEffect(() => {
    return () => {
      recordingActiveRef.current = false;
      stopLevelMeter();
      cleanupStream();
      cleanupAudioGraph().catch(() => {});
    };
  }, [cleanupAudioGraph, cleanupStream, stopLevelMeter]);

  const startLevelMeter = useCallback((analyser) => {
    const dataArray = new Uint8Array(analyser.frequencyBinCount);
    const updateLevel = () => {
      analyser.getByteFrequencyData(dataArray);
      const avg = dataArray.reduce((sum, value) => sum + value, 0) / dataArray.length;
      setAudioLevel(avg / 128);
      animFrameRef.current = requestAnimationFrame(updateLevel);
    };
    updateLevel();
  }, []);

  const buildMediaRecorder = useCallback((stream) => {
    if (typeof MediaRecorder === "undefined") return null;

    for (const mimeType of RECORDER_MIME_CANDIDATES) {
      if (typeof MediaRecorder.isTypeSupported === "function" && !MediaRecorder.isTypeSupported(mimeType)) {
        continue;
      }
      try {
        const recorder = new MediaRecorder(stream, { mimeType });
        return { recorder, mimeType: normalizeMimeType(recorder.mimeType || mimeType) };
      } catch (_) {
        // Try the next candidate.
      }
    }

    try {
      const recorder = new MediaRecorder(stream);
      const mimeType = normalizeMimeType(recorder.mimeType);
      return mimeType ? { recorder, mimeType } : null;
    } catch (_) {
      return null;
    }
  }, []);

  const startRecording = useCallback(async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      throw new Error("Microphone recording is not supported on this device.");
    }

    const AudioContextClass = getAudioContextClass();
    if (!AudioContextClass) {
      throw new Error("Audio processing is not supported on this device.");
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      streamRef.current = stream;

      const audioContext = new AudioContextClass();
      audioContextRef.current = audioContext;
      if (audioContext.state === "suspended") {
        await audioContext.resume();
      }

      const source = audioContext.createMediaStreamSource(stream);
      sourceNodeRef.current = source;

      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      analyserRef.current = analyser;

      const monitorGain = audioContext.createGain();
      monitorGain.gain.value = 0;
      monitorGainRef.current = monitorGain;

      source.connect(analyser);
      analyser.connect(monitorGain);
      monitorGain.connect(audioContext.destination);
      startLevelMeter(analyser);

      const mediaSetup = buildMediaRecorder(stream);
      audioChunksRef.current = [];
      wavChunksRef.current = [];
      recordingActiveRef.current = true;

      if (mediaSetup) {
        const { recorder, mimeType } = mediaSetup;
        mediaRecorderRef.current = recorder;
        mediaMimeTypeRef.current = mimeType || "audio/webm";
        recordingModeRef.current = "media-recorder";
        recorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            audioChunksRef.current.push(event.data);
          }
        };
        recorder.start();
      } else {
        recordingModeRef.current = "wav-fallback";
        mediaMimeTypeRef.current = "audio/wav";
        sampleRateRef.current = audioContext.sampleRate;

        const processor = audioContext.createScriptProcessor(4096, 1, 1);
        processorNodeRef.current = processor;
        processor.onaudioprocess = (event) => {
          if (!recordingActiveRef.current) return;
          const input = event.inputBuffer.getChannelData(0);
          wavChunksRef.current.push(new Float32Array(input));
        };
        source.connect(processor);
        processor.connect(monitorGain);
      }

      setIsRecording(true);
    } catch (error) {
      await finalizeStop();
      throw error;
    }
  }, [buildMediaRecorder, finalizeStop, startLevelMeter]);

  const stopRecording = useCallback(async () => {
    if (!recordingModeRef.current) return null;

    recordingActiveRef.current = false;

    if (recordingModeRef.current === "wav-fallback") {
      const blob = encodeWav(wavChunksRef.current, sampleRateRef.current);
      await finalizeStop();
      return blob;
    }

    if (!mediaRecorderRef.current || mediaRecorderRef.current.state === "inactive") {
      await finalizeStop();
      return null;
    }

    return new Promise((resolve, reject) => {
      const recorder = mediaRecorderRef.current;
      recorder.onstop = async () => {
        const mimeType = mediaMimeTypeRef.current || "audio/webm";
        const blob = new Blob(audioChunksRef.current, { type: mimeType });
        await finalizeStop();
        resolve(blob);
      };
      recorder.onerror = async (event) => {
        await finalizeStop();
        reject(event?.error || new Error("Recording failed."));
      };
      recorder.stop();
    });
  }, [finalizeStop]);

  return { isRecording, audioLevel, startRecording, stopRecording };
}
