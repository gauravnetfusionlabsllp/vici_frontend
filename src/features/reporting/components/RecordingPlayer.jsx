import { useEffect, useRef, useState } from 'react';
import { Play, Pause } from 'lucide-react';

// Formats seconds → "M:SS"; returns "0:00" for 0/invalid so the live label is never blank.
function fmtTime(sec) {
  const n = Number(sec);
  if (!Number.isFinite(n) || n <= 0) return '0:00';
  const s = Math.floor(n);
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${String(r).padStart(2, '0')}`;
}

/**
 * Custom audio player with a draggable seek bar.
 *
 * The browser-native <audio controls> seek bar can't be controlled programmatically and breaks
 * when the recording is served without duration metadata / HTTP Range support. This player owns
 * the slider, drives audio.currentTime directly, force-preloads the file (preload="auto") so
 * seek-to-anywhere works, and uses the backend-provided lengthSec as the authoritative duration.
 */
export default function RecordingPlayer({ src, title, lengthSec }) {
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [isSeeking, setIsSeeking] = useState(false);

  const initialDuration = Number(lengthSec);
  const [duration, setDuration] = useState(
    Number.isFinite(initialDuration) && initialDuration > 0 ? initialDuration : 0
  );

  // While the user drags, isSeeking suppresses timeupdate so the slider/timestamp don't fight the
  // drag. Read it through a ref inside the listener to avoid re-subscribing on every drag.
  const isSeekingRef = useRef(false);
  useEffect(() => {
    isSeekingRef.current = isSeeking;
  }, [isSeeking]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onLoadedMeta = () => {
      if (Number.isFinite(audio.duration) && audio.duration > 0) {
        setDuration(audio.duration);
      }
    };
    const onTimeUpdate = () => {
      if (!isSeekingRef.current) setCurrentTime(audio.currentTime);
    };
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    audio.addEventListener('loadedmetadata', onLoadedMeta);
    audio.addEventListener('durationchange', onLoadedMeta);
    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('play', onPlay);
    audio.addEventListener('pause', onPause);
    audio.addEventListener('ended', onEnded);

    return () => {
      audio.removeEventListener('loadedmetadata', onLoadedMeta);
      audio.removeEventListener('durationchange', onLoadedMeta);
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('play', onPlay);
      audio.removeEventListener('pause', onPause);
      audio.removeEventListener('ended', onEnded);
    };
  }, []);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) audio.play().catch(() => {});
    else audio.pause();
  };

  // onChange fires continuously while dragging — update the visual position only.
  const handleSeekChange = (e) => {
    setCurrentTime(Number(e.target.value));
  };

  // Commit the seek when the drag/keyboard interaction ends.
  const commitSeek = () => {
    const audio = audioRef.current;
    if (audio) audio.currentTime = currentTime;
    setIsSeeking(false);
  };

  const hasDuration = duration > 0;

  return (
    <div className="flex items-center gap-2 flex-1 min-w-0 max-w-[220px]">
      <audio ref={audioRef} preload="auto" src={src} title={title} className="hidden" />

      <button
        type="button"
        onClick={togglePlay}
        aria-label={isPlaying ? 'Pause recording' : 'Play recording'}
        className="inline-flex items-center justify-center w-7 h-7 rounded-md border border-border bg-secondary/40 text-muted-foreground hover:text-foreground hover:bg-secondary transition-smooth shrink-0"
      >
        {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
      </button>

      <input
        type="range"
        min={0}
        max={hasDuration ? duration : 0}
        step={0.1}
        value={currentTime}
        disabled={!hasDuration}
        onPointerDown={() => setIsSeeking(true)}
        onChange={handleSeekChange}
        onPointerUp={commitSeek}
        onKeyUp={commitSeek}
        aria-label="Seek recording"
        className="flex-1 min-w-0 h-1 accent-primary cursor-pointer disabled:cursor-default disabled:opacity-50"
      />

      <span className="text-[10px] font-mono-nums text-muted-foreground tabular-nums shrink-0">
        {fmtTime(currentTime)} / {hasDuration ? fmtTime(duration) : '--:--'}
      </span>
    </div>
  );
}
