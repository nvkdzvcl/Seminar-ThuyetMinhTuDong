import { useEffect, useRef, useState, useCallback } from 'react';
import type { POI } from '../../types';
import { postListenEvent } from '../../services/analyticsService';

interface AudioPlayerProps {
  poi: POI;
  tourId: string;
  onExit?: () => void;
}

export function AudioPlayer({ poi, tourId, onExit }: AudioPlayerProps) {
  const [playing, setPlaying] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const synthRef = useRef<SpeechSynthesisUtterance | null>(null);
  const startTimeRef = useRef<number>(0);
  const timerRef = useRef<number>(0);
  const reportedRef = useRef(false);

  const stop = useCallback(() => {
    setPlaying(false);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    if (synthRef.current) {
      window.speechSynthesis.cancel();
    }
    clearInterval(timerRef.current);

    // Report listen event if > 10s
    const duration = Date.now() - startTimeRef.current;
    if (duration >= 10000 && !reportedRef.current) {
      reportedRef.current = true;
      postListenEvent(poi.id, tourId, duration);
    }
  }, [poi.id, tourId]);

  const play = useCallback(() => {
    reportedRef.current = false;
    startTimeRef.current = Date.now();
    setElapsed(0);
    setPlaying(true);

    timerRef.current = window.setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTimeRef.current) / 1000));
    }, 1000);

    if (poi.audioUrl) {
      const audio = new Audio(poi.audioUrl);
      audioRef.current = audio;
      audio.play().catch(() => {});
      audio.onended = () => stop();
    } else if (poi.textToSpeech) {
      const utter = new SpeechSynthesisUtterance(poi.textToSpeech);
      utter.lang = 'vi-VN';
      utter.rate = 0.9;
      synthRef.current = utter;
      utter.onend = () => stop();
      window.speechSynthesis.speak(utter);
    }
  }, [poi, stop]);

  // Auto-play on mount
  useEffect(() => {
    play();
    return () => stop();
  }, [poi.id]);

  return (
    <div className="rounded-xl bg-white p-4 shadow-lg border border-green-200">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 text-lg">
          {playing ? '🔊' : '🔇'}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-800 truncate">{poi.name}</p>
          <p className="text-xs text-gray-400">
            {poi.audioUrl ? 'Audio' : 'TTS'} | {elapsed}s
          </p>
        </div>
        <div className="flex gap-2">
          {playing ? (
            <button onClick={stop}
              className="rounded-lg bg-red-100 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-200">
              Dừng
            </button>
          ) : (
            <button onClick={play}
              className="rounded-lg bg-green-100 px-3 py-1.5 text-sm font-medium text-green-600 hover:bg-green-200">
              Phát lại
            </button>
          )}
        </div>
      </div>
      {poi.textToSpeech && (
        <p className="mt-2 text-xs text-gray-500 italic line-clamp-2">{poi.textToSpeech}</p>
      )}
    </div>
  );
}