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

function getConnection() {
  return (navigator as NavigatorWithConnection).connection;
}

function preferStaticMedia() {
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
  const [isNearViewport, setIsNearViewport] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const prefersStatic = useSyncExternalStore(
    subscribeToStaticPreference,
    preferStaticMedia,
    () => true
  );
  const shouldAttachVideo = isNearViewport && !prefersStatic;

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
    const video = videoRef.current;
    if (!video) return;

    if (isVisible) {
      void video.play().catch(() => {});
    } else {
      video.pause();
    }
  }, [isVisible, shouldAttachVideo]);

  return (
    <div ref={containerRef} className="h-full w-full">
      {shouldAttachVideo ? (
        <video
          ref={videoRef}
          src={src}
          poster={poster}
          muted
          loop
          playsInline
          preload="none"
          aria-label={alt}
          className={className}
          onCanPlay={() => {
            if (isVisible) void videoRef.current?.play().catch(() => {});
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
    </div>
  );
}
