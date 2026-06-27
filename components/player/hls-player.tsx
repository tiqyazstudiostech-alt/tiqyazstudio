"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import type HlsType from "hls.js";
import { logPlayStartAction, logPlayCompleteAction } from "@/app/actions/watch";

// ─── Types ────────────────────────────────────────────────────────────────────

interface QualityLevel { height: number; bitrate: number }

export interface HlsPlayerProps {
  src: string;
  episodeId: string;
  titleId: string;
  durationSec?: number;
  seriesTitle: string;
  episodeTitle?: string;
  episodeNumber: number;
  backdropUrl?: string;
  resumePosition?: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(sec: number): string {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = Math.floor(sec % 60);
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function clamp(v: number, lo: number, hi: number) { return Math.max(lo, Math.min(hi, v)); }

// ─── Icons ────────────────────────────────────────────────────────────────────

function IconPlay() {
  return <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden><path d="M8 5.14v13.72L19 12 8 5.14z" /></svg>;
}
function IconPause() {
  return <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden><rect x="6" y="4" width="4" height="16" rx="1" /><rect x="14" y="4" width="4" height="16" rx="1" /></svg>;
}
function IconVolumeFull() {
  return <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3A4.5 4.5 0 0014 7.97v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" /></svg>;
}
function IconVolumeLow() {
  return <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden><path d="M5 9v6h4l5 5V4L9 9H5zm11 3a4.5 4.5 0 00-2.5-4.03v8.05A4.5 4.5 0 0016 12z" /></svg>;
}
function IconVolumeMute() {
  return <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden><path d="M3.63 3.63a.996.996 0 000 1.41L7.29 8.7 7 9H4c-.55 0-1 .45-1 1v4c0 .55.45 1 1 1h3l3.29 3.29c.63.63 1.71.18 1.71-.71v-4.17l4.18 4.18c-.49.37-1.02.68-1.6.91-.36.15-.58.53-.58.92 0 .72.73 1.18 1.39.91.8-.33 1.55-.77 2.22-1.31l1.34 1.34a.996.996 0 101.41-1.41L5.05 3.63c-.39-.39-1.02-.39-1.42 0zM19 12c0 .82-.15 1.61-.41 2.34l1.53 1.53c.56-1.17.88-2.48.88-3.87 0-3.83-2.4-7.11-5.78-8.4-.59-.23-1.22.23-1.22.86v.19c0 .38.25.71.61.85C17.18 6.54 19 9.06 19 12zm-8.71-6.29l-.17.17L12 7.76V6.41c0-.89-1.08-1.33-1.71-.7z" /></svg>;
}
function IconFullscreen() {
  return <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden><path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z" /></svg>;
}
function IconExitFullscreen() {
  return <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden><path d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z" /></svg>;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function HlsPlayer({
  src: initialSrc,
  episodeId,
  titleId,
  durationSec,
  seriesTitle,
  episodeTitle,
  episodeNumber,
  backdropUrl,
  resumePosition,
}: HlsPlayerProps) {
  const containerRef        = useRef<HTMLDivElement>(null);
  const videoRef            = useRef<HTMLVideoElement>(null);
  const hlsRef              = useRef<HlsType | null>(null);
  const srcRef              = useRef(initialSrc);
  const seekBarRef          = useRef<HTMLDivElement>(null);
  const hideTimerRef        = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Stable value refs — read by callbacks without creating closure dependencies.
  const currentTimeRef      = useRef(0);
  const durationRef         = useRef(durationSec ?? 0);
  const lastProgressSaveRef = useRef(0);
  const startedRef          = useRef(false);
  const completedRef        = useRef(false);
  const abandonRef          = useRef(false);
  const seekingRef          = useRef(false);

  const [playing,          setPlaying]          = useState(false);
  const [currentTime,      setCurrentTime]      = useState(0);
  const [duration,         setDuration]         = useState(durationSec ?? 0);
  const [bufferedEnd,      setBufferedEnd]      = useState(0);
  const [volume,           setVolume]           = useState(1);
  const [muted,            setMuted]            = useState(false);
  const [fullscreen,       setFullscreen]       = useState(false);
  const [showControls,     setShowControls]     = useState(true);
  const [levels,           setLevels]           = useState<QualityLevel[]>([]);
  const [currentLevel,     setCurrentLevel]     = useState(-1);
  const [buffering,        setBuffering]        = useState(true);
  const [playerError,      setPlayerError]      = useState<string | null>(null);
  const [showQuality,      setShowQuality]      = useState(false);
  const [isSeeking,        setIsSeeking]        = useState(false);
  // Show resume prompt only if there's a meaningful saved position.
  const [showResumePrompt, setShowResumePrompt] = useState((resumePosition ?? 0) > 5);

  // ── Controls visibility ─────────────────────────────────────────────────────

  const scheduleHide = useCallback(() => {
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    hideTimerRef.current = setTimeout(() => {
      if (!seekingRef.current) setShowControls(false);
    }, 3000);
  }, []);

  const revealControls = useCallback(() => {
    setShowControls(true);
    scheduleHide();
  }, [scheduleHide]);

  // ── Progress save (sendBeacon — fire-and-forget, safe on unmount) ───────────

  const saveProgress = useCallback((completed: boolean) => {
    const pos = Math.floor(currentTimeRef.current);
    if (pos < 1) return;
    const dur = durationRef.current > 0 ? Math.floor(durationRef.current) : null;
    const body = JSON.stringify({
      positionSec: pos,
      ...(dur !== null && { durationSec: dur }),
      completed,
    });
    navigator.sendBeacon(
      `/api/watch/${episodeId}/progress`,
      new Blob([body], { type: "application/json" }),
    );
  }, [episodeId]);

  // ── sendBeacon for abandon ──────────────────────────────────────────────────

  const sendAbandon = useCallback(() => {
    if (abandonRef.current || completedRef.current) return;
    abandonRef.current = true;
    navigator.sendBeacon(
      `/api/watch/${episodeId}/event`,
      new Blob([JSON.stringify({ type: "PLAY_ABANDON" })], { type: "application/json" }),
    );
  }, [episodeId]);

  // ── HLS init ────────────────────────────────────────────────────────────────

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    let destroyed = false;

    async function init() {
      if (video!.canPlayType("application/vnd.apple.mpegurl")) {
        video!.src = srcRef.current;
        return;
      }

      const { default: Hls } = await import("hls.js");
      if (!Hls.isSupported()) { setPlayerError("HLS is not supported in this browser."); return; }
      if (destroyed) return;

      const hls = new Hls({ enableWorker: true, lowLatencyMode: false });
      hlsRef.current = hls;
      hls.loadSource(srcRef.current);
      hls.attachMedia(video!);

      hls.on(Hls.Events.MANIFEST_PARSED, (_e, data) => {
        setLevels(data.levels.map((l) => ({ height: l.height, bitrate: l.bitrate })));
      });
      hls.on(Hls.Events.LEVEL_SWITCHED, (_e, data) => { setCurrentLevel(data.level); });
      hls.on(Hls.Events.ERROR, async (_e, data) => {
        if (!data.fatal) return;
        if (data.type === Hls.ErrorTypes.MEDIA_ERROR) { hls.recoverMediaError(); return; }
        if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
          try {
            const res = await fetch(`/api/watch/${episodeId}/signed-url`);
            if (!res.ok) throw new Error();
            const { url } = (await res.json()) as { url: string };
            srcRef.current = url;
            hls.stopLoad(); hls.loadSource(url); hls.startLoad();
          } catch { setPlayerError("Playback failed. Please refresh the page."); }
          return;
        }
        setPlayerError("Playback failed. Please refresh the page.");
      });
    }

    init();

    return () => {
      destroyed = true;
      hlsRef.current?.destroy();
      hlsRef.current = null;
      saveProgress(completedRef.current);
      sendAbandon();
    };
  }, [episodeId, saveProgress, sendAbandon]);

  // ── Video DOM events ────────────────────────────────────────────────────────

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    function onPlay() {
      setPlaying(true);
      setBuffering(false);
      if (!startedRef.current) {
        startedRef.current = true;
        logPlayStartAction(episodeId, titleId);
      }
    }

    function onPause() {
      setPlaying(false);
      saveProgress(completedRef.current);
    }

    function onWaiting() { setBuffering(true); }
    function onCanPlay() { setBuffering(false); }

    function onVolumeChange() {
      const v = videoRef.current;
      if (!v) return;
      setVolume(v.volume);
      setMuted(v.muted);
    }

    function onDurationChange() {
      const v = videoRef.current;
      if (!v) return;
      if (isFinite(v.duration) && v.duration > 0) {
        durationRef.current = v.duration;
        setDuration(v.duration);
      }
    }

    function onTimeUpdate() {
      const v = videoRef.current;
      if (!v) return;
      currentTimeRef.current = v.currentTime;
      setCurrentTime(v.currentTime);

      if (v.buffered.length > 0) {
        setBufferedEnd(v.buffered.end(v.buffered.length - 1));
      }

      // Throttle: save progress every ~10 s of playback.
      if (v.currentTime - lastProgressSaveRef.current >= 10) {
        lastProgressSaveRef.current = v.currentTime;
        saveProgress(false);
      }

      // 95% threshold → mark complete.
      if (!completedRef.current && v.duration > 0 && v.currentTime / v.duration >= 0.95) {
        completedRef.current = true;
        logPlayCompleteAction(episodeId, titleId);
        saveProgress(true);
      }
    }

    function onEnded() {
      setPlaying(false);
      if (!completedRef.current) {
        completedRef.current = true;
        logPlayCompleteAction(episodeId, titleId);
        saveProgress(true);
      }
    }

    video.addEventListener("play",           onPlay);
    video.addEventListener("pause",          onPause);
    video.addEventListener("waiting",        onWaiting);
    video.addEventListener("canplay",        onCanPlay);
    video.addEventListener("volumechange",   onVolumeChange);
    video.addEventListener("durationchange", onDurationChange);
    video.addEventListener("timeupdate",     onTimeUpdate);
    video.addEventListener("ended",          onEnded);

    return () => {
      video.removeEventListener("play",           onPlay);
      video.removeEventListener("pause",          onPause);
      video.removeEventListener("waiting",        onWaiting);
      video.removeEventListener("canplay",        onCanPlay);
      video.removeEventListener("volumechange",   onVolumeChange);
      video.removeEventListener("durationchange", onDurationChange);
      video.removeEventListener("timeupdate",     onTimeUpdate);
      video.removeEventListener("ended",          onEnded);
    };
  }, [episodeId, titleId, saveProgress]);

  // ── Keyboard shortcuts ──────────────────────────────────────────────────────

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const video = videoRef.current;
      if (!video) return;
      const tag = (e.target as HTMLElement).tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      switch (e.code) {
        case "Space": case "KeyK":
          e.preventDefault(); video.paused ? video.play() : video.pause(); revealControls(); break;
        case "ArrowLeft":
          e.preventDefault(); video.currentTime = clamp(video.currentTime - 10, 0, video.duration); revealControls(); break;
        case "ArrowRight":
          e.preventDefault(); video.currentTime = clamp(video.currentTime + 10, 0, video.duration); revealControls(); break;
        case "ArrowUp":
          e.preventDefault(); video.volume = clamp(video.volume + 0.1, 0, 1); revealControls(); break;
        case "ArrowDown":
          e.preventDefault(); video.volume = clamp(video.volume - 0.1, 0, 1); revealControls(); break;
        case "KeyM":
          e.preventDefault(); video.muted = !video.muted; revealControls(); break;
        case "KeyF":
          e.preventDefault();
          document.fullscreenElement
            ? document.exitFullscreen()
            : containerRef.current?.requestFullscreen();
          break;
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [revealControls]);

  // ── Fullscreen detection ────────────────────────────────────────────────────

  useEffect(() => {
    function onChange() { setFullscreen(!!document.fullscreenElement); }
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  // ── beforeunload: save progress + abandon ───────────────────────────────────

  useEffect(() => {
    function onUnload() { saveProgress(completedRef.current); sendAbandon(); }
    window.addEventListener("beforeunload", onUnload);
    return () => window.removeEventListener("beforeunload", onUnload);
  }, [saveProgress, sendAbandon]);

  // ── Timer cleanup ───────────────────────────────────────────────────────────

  useEffect(() => () => { if (hideTimerRef.current) clearTimeout(hideTimerRef.current); }, []);

  // ── Handlers ────────────────────────────────────────────────────────────────

  function togglePlay() {
    const v = videoRef.current;
    if (!v) return;
    v.paused ? v.play() : v.pause();
  }

  function handleResume() {
    const v = videoRef.current;
    if (!v || !resumePosition) return;
    v.currentTime = resumePosition;
    setShowResumePrompt(false);
    v.play();
  }

  function handleStartOver() {
    setShowResumePrompt(false);
    videoRef.current?.play();
  }

  function toggleMute() {
    const v = videoRef.current;
    if (v) v.muted = !v.muted;
  }

  function toggleFullscreen() {
    document.fullscreenElement
      ? document.exitFullscreen()
      : containerRef.current?.requestFullscreen();
  }

  function onVolumeSlider(e: React.ChangeEvent<HTMLInputElement>) {
    const v = videoRef.current;
    if (!v) return;
    const vol = parseFloat(e.target.value);
    v.volume = vol; v.muted = vol === 0;
  }

  function seekTo(clientX: number) {
    const v   = videoRef.current;
    const bar = seekBarRef.current;
    if (!v || !bar || !duration) return;
    const rect = bar.getBoundingClientRect();
    v.currentTime = clamp((clientX - rect.left) / rect.width, 0, 1) * duration;
  }

  function onSeekPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    seekingRef.current = true; setIsSeeking(true);
    seekBarRef.current?.setPointerCapture(e.pointerId);
    seekTo(e.clientX);
  }
  function onSeekPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (seekingRef.current) seekTo(e.clientX);
  }
  function onSeekPointerUp(e: React.PointerEvent<HTMLDivElement>) {
    seekingRef.current = false; setIsSeeking(false);
    seekBarRef.current?.releasePointerCapture(e.pointerId);
  }

  function setQuality(level: number) {
    const hls = hlsRef.current;
    if (hls) hls.currentLevel = level;
    setCurrentLevel(level); setShowQuality(false);
  }

  // ── Derived ──────────────────────────────────────────────────────────────────

  const progressPct  = duration > 0 ? (currentTime / duration) * 100 : 0;
  const bufferedPct  = duration > 0 ? (bufferedEnd / duration) * 100 : 0;
  const qualityLabel = currentLevel === -1 ? "Auto" : (levels[currentLevel]?.height ?? "?") + "p";
  const VolumeIcon   = muted || volume === 0 ? IconVolumeMute : volume < 0.5 ? IconVolumeLow : IconVolumeFull;

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div
      ref={containerRef}
      className="relative w-full bg-black select-none"
      style={{ aspectRatio: "16 / 9", maxHeight: "100dvh" }}
      onMouseMove={revealControls}
      onMouseLeave={() => { if (playing) setShowControls(false); }}
    >
      {/* Backdrop while buffering */}
      {buffering && backdropUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={backdropUrl} alt="" className="absolute inset-0 w-full h-full object-cover opacity-30 pointer-events-none" />
      )}

      <video ref={videoRef} className="w-full h-full" playsInline preload="metadata" crossOrigin="anonymous" onClick={togglePlay} />

      {/* Spinner */}
      {buffering && !playerError && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-10 h-10 rounded-full border-2 border-white/25 border-t-white animate-spin" />
        </div>
      )}

      {/* Error */}
      {playerError && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80">
          <div className="text-center px-6">
            <p className="text-white/80 text-sm mb-4">{playerError}</p>
            <button type="button" className="px-4 py-2 bg-gold text-gold-fg text-sm font-semibold rounded-lg" onClick={() => window.location.reload()}>Retry</button>
          </div>
        </div>
      )}

      {/* Big play button when paused */}
      {!playing && !buffering && !playerError && !showResumePrompt && (
        <button type="button" aria-label="Play" className="absolute inset-0 flex items-center justify-center" onClick={togglePlay}>
          <div className="w-16 h-16 rounded-full bg-black/60 flex items-center justify-center hover:bg-black/80 transition-colors">
            <svg className="w-8 h-8 text-white translate-x-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5.14v13.72L19 12 8 5.14z" /></svg>
          </div>
        </button>
      )}

      {/* ── Resume prompt ──────────────────────────────────────────────────── */}
      {showResumePrompt && !buffering && !playerError && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="bg-black/80 backdrop-blur-sm border border-white/10 rounded-2xl px-6 py-5 flex flex-col items-center gap-4 text-center max-w-xs mx-4">
            <p className="text-white font-semibold text-sm">Resume watching?</p>
            <p className="text-white/50 text-xs">
              You left off at {fmt(resumePosition ?? 0)}
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                className="px-4 py-2 bg-gold text-gold-fg text-sm font-semibold rounded-lg hover:bg-gold-hover transition-colors"
                onClick={handleResume}
              >
                Resume
              </button>
              <button
                type="button"
                className="px-4 py-2 bg-white/10 text-white/80 text-sm font-medium rounded-lg hover:bg-white/20 transition-colors"
                onClick={handleStartOver}
              >
                Start over
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Controls overlay ───────────────────────────────────────────────── */}
      <div
        className={
          "absolute inset-0 flex flex-col justify-end transition-opacity duration-300 pointer-events-none " +
          (showControls ? "opacity-100" : "opacity-0")
        }
      >
        {/* Gradient */}
        <div className="absolute inset-0 pointer-events-none" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.15) 40%, rgba(0,0,0,0.35) 100%)" }} />

        {/* Title */}
        <div className="relative pointer-events-auto px-5 pt-4">
          <p className="text-white font-semibold text-sm leading-tight drop-shadow">{seriesTitle}</p>
          {episodeTitle && <p className="text-white/60 text-xs">E{episodeNumber}. {episodeTitle}</p>}
        </div>

        <div className="flex-1" />

        {/* Seek bar */}
        <div className="relative pointer-events-auto px-5 pb-2">
          <div
            ref={seekBarRef}
            className="relative h-1 rounded-full bg-white/25 cursor-pointer group"
            onPointerDown={onSeekPointerDown}
            onPointerMove={onSeekPointerMove}
            onPointerUp={onSeekPointerUp}
          >
            <div className="absolute inset-y-0 left-0 bg-white/35 rounded-full pointer-events-none" style={{ width: `${bufferedPct}%` }} />
            <div className="absolute inset-y-0 left-0 bg-gold rounded-full pointer-events-none" style={{ width: `${progressPct}%` }} />
            <div
              className={"absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-gold shadow pointer-events-none transition-opacity " + (isSeeking ? "opacity-100" : "opacity-0 group-hover:opacity-100")}
              style={{ left: `calc(${progressPct}% - 6px)` }}
            />
          </div>
        </div>

        {/* Bottom bar */}
        <div className="relative pointer-events-auto flex items-center gap-3 px-5 pb-4">
          <button type="button" aria-label={playing ? "Pause" : "Play"} className="text-white hover:text-gold transition-colors shrink-0" onClick={togglePlay}>
            {playing ? <IconPause /> : <IconPlay />}
          </button>

          {/* Volume */}
          <div className="flex items-center gap-1.5 group/vol">
            <button type="button" aria-label={muted || volume === 0 ? "Unmute" : "Mute"} className="text-white hover:text-gold transition-colors shrink-0" onClick={toggleMute}>
              <VolumeIcon />
            </button>
            <input
              type="range" min={0} max={1} step={0.05} value={muted ? 0 : volume}
              onChange={onVolumeSlider} aria-label="Volume"
              className="cursor-pointer accent-gold h-1 rounded w-0 opacity-0 transition-all duration-200 group-hover/vol:w-20 group-hover/vol:opacity-100"
            />
          </div>

          <span className="text-white/70 text-xs tabular-nums ml-1 shrink-0">{fmt(currentTime)} / {fmt(duration)}</span>

          <div className="flex-1" />

          {/* Quality */}
          {levels.length > 0 && (
            <div className="relative">
              <button type="button" className="text-white/70 hover:text-white text-xs font-mono transition-colors px-1" onClick={() => setShowQuality((v) => !v)}>
                {qualityLabel}
              </button>
              {showQuality && (
                <div className="absolute bottom-8 right-0 bg-black/95 border border-white/10 rounded-lg overflow-hidden min-w-[72px]">
                  <button type="button" className={"block w-full text-left px-3 py-1.5 text-xs hover:bg-white/10 transition-colors " + (currentLevel === -1 ? "text-gold" : "text-white")} onClick={() => setQuality(-1)}>Auto</button>
                  {levels.map((l, i) => (
                    <button key={i} type="button" className={"block w-full text-left px-3 py-1.5 text-xs hover:bg-white/10 transition-colors " + (currentLevel === i ? "text-gold" : "text-white")} onClick={() => setQuality(i)}>{l.height}p</button>
                  ))}
                </div>
              )}
            </div>
          )}

          <button type="button" aria-label={fullscreen ? "Exit fullscreen" : "Fullscreen"} className="text-white hover:text-gold transition-colors shrink-0" onClick={toggleFullscreen}>
            {fullscreen ? <IconExitFullscreen /> : <IconFullscreen />}
          </button>
        </div>
      </div>
    </div>
  );
}
