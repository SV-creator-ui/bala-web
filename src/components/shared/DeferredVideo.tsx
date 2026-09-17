"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";

type NetworkInformation = EventTarget & {
  saveData?: boolean;
};

type NavigatorWithConnection = Navigator & {
  connection?: NetworkInformation;
};

type DeferredVideoProps = {
  src: string;
  poster: string;
  alt: string;
  className?: string;
};

const MOBILE_QUERY = "(max-width: 768px), (pointer: coarse)";
const MANUAL_VIDEO_PLAY_EVENT = "bala:manual-video-play";

function getConnection() {
  return (navigator as NavigatorWithConnection).connection;
}

function requiresManualPlayback() {
  return window.matchMedia(MOBILE_QUERY).matches || Boolean(getConnection()?.saveData);
}

function subscribeToStaticPreference(onChange: () => void) {
  const mediaQuery = window.matchMedia(MOBILE_QUERY);
  const connection = getConnection();

  mediaQuery.addEventListener("change", onChange);
  connection?.addEventListener("change", onChange);

  return () => {
    mediaQuery.removeEventListener("change", onChange);
    connection?.removeEventListener("change", onChange);
  };
}

export default function DeferredVideo({
  src,
  poster,
  alt,
  className,
}: DeferredVideoProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const instanceIdRef = useRef(Symbol("deferred-video"));
  const [isNearViewport, setIsNearViewport] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [wasManuallyActivated, setWasManuallyActivated] = useState(false);
  const [manualPlayRequested, setManualPlayRequested] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const manualPlaybackRequired = useSyncExternalStore(
    subscribeToStaticPreference,
    requiresManualPlayback,
    () => false
  );
  const shouldAttachVideo = manualPlaybackRequired
    ? wasManuallyActivated
    : isNearViewport;

  useEffect(() => {
    const container = containerRef.current;
    if (!container || typeof IntersectionObserver === "undefined") return;

    const loadObserver = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting || entry.intersectionRatio < 0.15) return;
        setIsNearViewport(true);
        loadObserver.disconnect();
      },
      { threshold: 0.15 }
    );

    const visibilityObserver = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting && entry.intersectionRatio >= 0.15);
      },
      { threshold: [0, 0.15] }
    );

    loadObserver.observe(container);
    visibilityObserver.observe(container);

    return () => {
      loadObserver.disconnect();
      visibilityObserver.disconnect();
    };
  }, []);

  useEffect(() => {
    if (!manualPlaybackRequired) return;

    const pauseForAnotherVideo = (event: Event) => {
      const { detail } = event as CustomEvent<symbol>;
      if (detail === instanceIdRef.current) return;

      setManualPlayRequested(false);
      videoRef.current?.pause();
    };

    window.addEventListener(MANUAL_VIDEO_PLAY_EVENT, pauseForAnotherVideo);
    return () =>
      window.removeEventListener(MANUAL_VIDEO_PLAY_EVENT, pauseForAnotherVideo);
  }, [manualPlaybackRequired]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const shouldPlay = manualPlaybackRequired
      ? manualPlayRequested
      : isVisible;

    if (shouldPlay) {
      void video.play().catch(() => {});
    } else {
      video.pause();
    }
  }, [isVisible, manualPlaybackRequired, manualPlayRequested, shouldAttachVideo]);

  const requestManualPlay = () => {
    window.dispatchEvent(
      new CustomEvent(MANUAL_VIDEO_PLAY_EVENT, {
        detail: instanceIdRef.current,
      })
    );
    setWasManuallyActivated(true);
    setManualPlayRequested(true);
  };

  const toggleManualPlayback = () => {
    if (!manualPlaybackRequired) return;

    const video = videoRef.current;
    if (!video || video.paused) {
      requestManualPlay();
    } else {
      setManualPlayRequested(false);
      video.pause();
    }
  };

  const showPlayOverlay = manualPlaybackRequired && !isPlaying;

  return (
    <div ref={containerRef} className="relative h-full w-full">
      {shouldAttachVideo ? (
        <video
          ref={videoRef}
          src={src}
          poster={poster}
          muted
          loop
          playsInline
          preload="none"
          aria-label={
            manualPlaybackRequired
              ? isPlaying
                ? "Pristabdyti video"
                : "Žiūrėti video"
              : alt
          }
          role={manualPlaybackRequired ? "button" : undefined}
          tabIndex={manualPlaybackRequired ? 0 : undefined}
          className={className}
          onClick={toggleManualPlayback}
          onKeyDown={(event) => {
            if (
              manualPlaybackRequired &&
              (event.key === "Enter" || event.key === " ")
            ) {
              event.preventDefault();
              toggleManualPlayback();
            }
          }}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onCanPlay={() => {
            const shouldPlay = manualPlaybackRequired
              ? manualPlayRequested
              : isVisible;
            if (shouldPlay) void videoRef.current?.play().catch(() => {});
          }}
        />
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={poster}
          alt={alt}
          loading="lazy"
          decoding="async"
          className={className}
        />
      )}
      {showPlayOverlay && (
        <button
          type="button"
          aria-label="Žiūrėti video"
          onClick={requestManualPlay}
          className="absolute left-1/2 top-1/2 z-20 flex -translate-x-1/2 -translate-y-1/2 items-center gap-2 whitespace-nowrap rounded-full border border-white/30 bg-black/75 px-4 py-3 text-white shadow-lg backdrop-blur-sm transition-transform active:scale-95"
        >
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            className="h-5 w-5 fill-current"
          >
            <path d="M8 5.5v13l10-6.5-10-6.5Z" />
          </svg>
          <span className="text-xs font-bold uppercase tracking-wide">
            Žiūrėti video
          </span>
        </button>
      )}
    </div>
  );
}
