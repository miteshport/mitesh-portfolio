"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
} from "react";
import {
  SoundTrack,
  SoundChannel,
  SOUNDROOM_CHANNELS,
} from "@/data/soundroomTracks";
import { audio as uiAudio } from "@/utils/audioSystem";

interface SoundroomContextType {
  currentTrack: SoundTrack;
  currentChannel: SoundChannel;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  is432Hz: boolean;
  channels: SoundChannel[];
  togglePlay: () => void;
  playTrack: (track: SoundTrack) => void;
  nextTrack: () => void;
  prevTrack: () => void;
  selectChannel: (channelId: SoundChannel["id"]) => void;
  seek: (time: number) => void;
  setVolume: (vol: number) => void;
  toggleMute: () => void;
  toggle432Hz: () => void;
  getFrequencyData: () => Uint8Array;
}

const SoundroomContext = createContext<SoundroomContextType | null>(null);

declare global {
  interface Window {
    onYouTubeIframeAPIReady?: () => void;
    YT?: any;
  }
}

export function SoundroomProvider({ children }: { children: React.ReactNode }) {
  const [currentChannelId, setCurrentChannelId] =
    useState<SoundChannel["id"]>("titans");
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolumeState] = useState(0.85);
  const [isMuted, setIsMuted] = useState(false);
  const [is432Hz, setIs432Hz] = useState(false);
  const [isPlayerReady, setIsPlayerReady] = useState(false);

  const playerRef = useRef<any>(null);
  const progressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const freqDataRef = useRef<Uint8Array>(new Uint8Array(64));

  const currentChannel =
    SOUNDROOM_CHANNELS.find((c) => c.id === currentChannelId) ||
    SOUNDROOM_CHANNELS[0];
  const currentTrack =
    currentChannel.tracks[currentTrackIndex] || currentChannel.tracks[0];

  // 1. Load YouTube IFrame API once
  useEffect(() => {
    if (typeof window === "undefined") return;

    if (!window.YT) {
      const tag = document.createElement("script");
      tag.src = "https://www.youtube.com/iframe_api";
      const firstScriptTag = document.getElementsByTagName("script")[0];
      firstScriptTag?.parentNode?.insertBefore(tag, firstScriptTag);
    }

    const initPlayer = () => {
      if (window.YT && window.YT.Player && !playerRef.current) {
        playerRef.current = new window.YT.Player("soundroom-yt-player", {
          height: "1",
          width: "1",
          videoId: currentTrack.youtubeId,
          playerVars: {
            autoplay: 0,
            controls: 0,
            disablekb: 1,
            fs: 0,
            modestbranding: 1,
            playsinline: 1,
            rel: 0,
          },
          events: {
            onReady: (event: any) => {
              setIsPlayerReady(true);
              event.target.setVolume(isMuted ? 0 : volume * 100);
            },
            onStateChange: (event: any) => {
              if (event.data === window.YT.PlayerState.PLAYING) {
                setIsPlaying(true);
              } else if (
                event.data === window.YT.PlayerState.PAUSED ||
                event.data === window.YT.PlayerState.BUFFERING
              ) {
                if (event.data === window.YT.PlayerState.PAUSED) {
                  setIsPlaying(false);
                }
              } else if (event.data === window.YT.PlayerState.ENDED) {
                handleNext();
              }
            },
          },
        });
      }
    };

    if (window.YT && window.YT.Player) {
      initPlayer();
    } else {
      window.onYouTubeIframeAPIReady = initPlayer;
    }

    return () => {
      if (progressTimerRef.current) clearInterval(progressTimerRef.current);
    };
  }, []);

  // 2. Continuous time tracker for UI & Scrubber
  useEffect(() => {
    if (isPlaying) {
      progressTimerRef.current = setInterval(() => {
        if (playerRef.current && typeof playerRef.current.getCurrentTime === "function") {
          const t = playerRef.current.getCurrentTime() || 0;
          const d = playerRef.current.getDuration() || currentTrack.duration;
          setCurrentTime(t);
          if (d > 0) setDuration(d);
        }
      }, 500);
    } else {
      if (progressTimerRef.current) clearInterval(progressTimerRef.current);
    }

    return () => {
      if (progressTimerRef.current) clearInterval(progressTimerRef.current);
    };
  }, [isPlaying, currentTrack]);

  // 3. Handle Track Change & MediaSession Sync
  useEffect(() => {
    if (playerRef.current && isPlayerReady && currentTrack.youtubeId) {
      try {
        playerRef.current.loadVideoById(currentTrack.youtubeId);
        if (isPlaying) {
          playerRef.current.playVideo();
        }
      } catch {}
    }

    // Media Session API for iPhone Lock Screen & Android notification
    if (typeof window !== "undefined" && "mediaSession" in navigator) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: currentTrack.title,
        artist: currentTrack.artist,
        album: currentTrack.album,
        artwork: [
          { src: currentTrack.artwork, sizes: "512x512", type: "image/jpeg" },
        ],
      });

      navigator.mediaSession.setActionHandler("play", () => {
        playerRef.current?.playVideo();
        setIsPlaying(true);
      });
      navigator.mediaSession.setActionHandler("pause", () => {
        playerRef.current?.pauseVideo();
        setIsPlaying(false);
      });
      navigator.mediaSession.setActionHandler("previoustrack", handlePrev);
      navigator.mediaSession.setActionHandler("nexttrack", handleNext);
      navigator.mediaSession.setActionHandler("seekto", (details) => {
        if (details.seekTime !== undefined && playerRef.current) {
          playerRef.current.seekTo(details.seekTime, true);
          setCurrentTime(details.seekTime);
        }
      });
    }
  }, [currentTrack, isPlayerReady]);

  // 4. Volume & Mute Sync
  useEffect(() => {
    if (playerRef.current && typeof playerRef.current.setVolume === "function") {
      playerRef.current.setVolume(isMuted ? 0 : volume * 100);
    }
  }, [volume, isMuted]);

  const togglePlay = () => {
    uiAudio.playClick();
    if (!playerRef.current) return;

    if (isPlaying) {
      playerRef.current.pauseVideo();
      setIsPlaying(false);
    } else {
      playerRef.current.playVideo();
      setIsPlaying(true);
    }
  };

  const playTrack = (track: SoundTrack) => {
    uiAudio.playClick();
    const ch = SOUNDROOM_CHANNELS.find((c) => c.id === track.channel);
    if (ch) {
      setCurrentChannelId(ch.id);
      const idx = ch.tracks.findIndex((t) => t.id === track.id);
      setCurrentTrackIndex(idx >= 0 ? idx : 0);
    }
    if (playerRef.current) {
      playerRef.current.loadVideoById(track.youtubeId);
      playerRef.current.playVideo();
      setIsPlaying(true);
    }
  };

  const handleNext = useCallback(() => {
    uiAudio.playClick();
    setCurrentTrackIndex((prev) => (prev + 1) % currentChannel.tracks.length);
  }, [currentChannel]);

  const handlePrev = useCallback(() => {
    uiAudio.playClick();
    setCurrentTrackIndex(
      (prev) =>
        (prev - 1 + currentChannel.tracks.length) % currentChannel.tracks.length
    );
  }, [currentChannel]);

  const selectChannel = (channelId: SoundChannel["id"]) => {
    uiAudio.playClick();
    setCurrentChannelId(channelId);
    setCurrentTrackIndex(0);
  };

  const seek = (time: number) => {
    if (playerRef.current && typeof playerRef.current.seekTo === "function") {
      playerRef.current.seekTo(time, true);
      setCurrentTime(time);
    }
  };

  const setVolume = (vol: number) => {
    const clamped = Math.max(0, Math.min(1, vol));
    setVolumeState(clamped);
    if (clamped > 0 && isMuted) setIsMuted(false);
  };

  const toggleMute = () => {
    uiAudio.playClick();
    setIsMuted((prev) => !prev);
  };

  const toggle432Hz = () => {
    uiAudio.playClick();
    setIs432Hz((prev) => !prev);
  };

  // Live harmonic frequency simulation data for visualizer
  const getFrequencyData = (): Uint8Array => {
    const arr = freqDataRef.current;
    const now = Date.now() * 0.008;
    for (let i = 0; i < arr.length; i++) {
      if (isPlaying) {
        const bass = Math.sin(now * 1.5 + i * 0.2) * 50 + 120;
        const mid = Math.cos(now * 2.2 + i * 0.4) * 40 + 90;
        const pulse = Math.sin(now * 4.0 + i * 0.8) * 30 + 60;
        arr[i] = Math.min(255, Math.max(10, Math.floor((bass + mid + pulse) / 3)));
      } else {
        arr[i] = 4;
      }
    }
    return arr;
  };

  return (
    <SoundroomContext.Provider
      value={{
        currentTrack,
        currentChannel,
        isPlaying,
        currentTime,
        duration: duration || currentTrack.duration,
        volume,
        isMuted,
        is432Hz,
        channels: SOUNDROOM_CHANNELS,
        togglePlay,
        playTrack,
        nextTrack: handleNext,
        prevTrack: handlePrev,
        selectChannel,
        seek,
        setVolume,
        toggleMute,
        toggle432Hz,
        getFrequencyData,
      }}
    >
      {/* Headless Hidden YouTube Engine */}
      <div
        id="soundroom-yt-player-container"
        style={{
          position: "fixed",
          bottom: 0,
          right: 0,
          width: "1px",
          height: "1px",
          opacity: 0.001,
          pointerEvents: "none",
          zIndex: -1,
        }}
      >
        <div id="soundroom-yt-player" />
      </div>
      {children}
    </SoundroomContext.Provider>
  );
}

export function useSoundroom() {
  const context = useContext(SoundroomContext);
  if (!context) {
    throw new Error("useSoundroom must be used within a SoundroomProvider");
  }
  return context;
}
