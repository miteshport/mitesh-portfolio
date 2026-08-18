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
  playCustomUrl: (url: string, title?: string, artist?: string) => void;
  nextTrack: () => void;
  prevTrack: () => void;
  selectChannel: (channelId: string) => void;
  seek: (time: number) => void;
  setVolume: (vol: number) => void;
  toggleMute: () => void;
  toggle432Hz: () => void;
  getFrequencyData: () => Uint8Array;
}

const SoundroomContext = createContext<SoundroomContextType | null>(null);

export function SoundroomProvider({ children }: { children: React.ReactNode }) {
  const [currentChannelId, setCurrentChannelId] = useState<string>("hindi-romance");
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [customTrack, setCustomTrack] = useState<SoundTrack | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolumeState] = useState(0.85);
  const [isMuted, setIsMuted] = useState(false);
  const [is432Hz, setIs432Hz] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const isPlayingRef = useRef(false);
  const freqDataRef = useRef<Uint8Array>(new Uint8Array(64));

  const currentChannel =
    SOUNDROOM_CHANNELS.find((c) => c.id === currentChannelId) ||
    SOUNDROOM_CHANNELS[0];

  const currentTrack: SoundTrack =
    customTrack ||
    currentChannel.tracks[currentTrackIndex] ||
    currentChannel.tracks[0];

  const handleNextTrack = useCallback(() => {
    uiAudio.playClick();
    if (customTrack) setCustomTrack(null);
    setCurrentTrackIndex((prev) => (prev + 1) % currentChannel.tracks.length);
  }, [currentChannel, customTrack]);

  const handlePrevTrack = useCallback(() => {
    uiAudio.playClick();
    if (customTrack) setCustomTrack(null);
    setCurrentTrackIndex(
      (prev) =>
        (prev - 1 + currentChannel.tracks.length) % currentChannel.tracks.length
    );
  }, [currentChannel, customTrack]);

  // 1. Initialize Native Audio Element (W3C MediaSession + iOS/Android Lock Screen Standard)
  useEffect(() => {
    if (typeof window === "undefined") return;

    const audio = new Audio();
    audio.preload = "auto";
    audio.crossOrigin = "anonymous";
    audioRef.current = audio;

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
      if (audio.duration && !isNaN(audio.duration) && isFinite(audio.duration)) {
        setDuration(audio.duration);
      }

      // Sync Lock Screen Timeline Position
      if (
        typeof window !== "undefined" &&
        "mediaSession" in navigator &&
        "setPositionState" in navigator.mediaSession &&
        audio.duration &&
        isFinite(audio.duration) &&
        !isNaN(audio.duration) &&
        audio.duration > 0
      ) {
        try {
          navigator.mediaSession.setPositionState({
            duration: audio.duration,
            playbackRate: audio.playbackRate || 1,
            position: Math.min(audio.currentTime, audio.duration),
          });
        } catch {
          // Ignore transient position state errors
        }
      }
    };

    const handleLoadedMetadata = () => {
      if (audio.duration && !isNaN(audio.duration) && isFinite(audio.duration)) {
        setDuration(audio.duration);
      }
    };

    // Continuous Autoplay on Track Ended (Not applicable for live streams)
    const handleEnded = () => {
      isPlayingRef.current = true;
      handleNextTrack();
    };

    const handlePlay = () => {
      setIsPlaying(true);
      isPlayingRef.current = true;
      if (typeof window !== "undefined" && "mediaSession" in navigator) {
        navigator.mediaSession.playbackState = "playing";
      }
    };

    const handlePause = () => {
      if (!audio.ended) {
        setIsPlaying(false);
        isPlayingRef.current = false;
        if (typeof window !== "undefined" && "mediaSession" in navigator) {
          navigator.mediaSession.playbackState = "paused";
        }
      }
    };

    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("ended", handleEnded);
    audio.addEventListener("play", handlePlay);
    audio.addEventListener("pause", handlePause);

    return () => {
      audio.pause();
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("ended", handleEnded);
      audio.removeEventListener("play", handlePlay);
      audio.removeEventListener("pause", handlePause);
      audio.src = "";
    };
  }, [handleNextTrack]);

  // 2. Track Change: Seamless Autoplay Next Track & Sync Media Session
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentTrack) return;

    const targetSrc = currentTrack.streamUrl || `/audio/${currentTrack.id}.m4a`;
    audio.src = targetSrc;
    audio.volume = isMuted ? 0 : volume;

    // Autoplay if session is active
    if (isPlayingRef.current || isPlaying) {
      audio
        .play()
        .then(() => {
          setIsPlaying(true);
          isPlayingRef.current = true;
        })
        .catch((err) => {
          console.warn("[Soundroom] Audio transition:", err);
        });
    }

    // W3C Media Session API for iOS Control Center & Android Lock Screen
    if (typeof window !== "undefined" && "mediaSession" in navigator) {
      try {
        navigator.mediaSession.metadata = new MediaMetadata({
          title: currentTrack.title,
          artist: currentTrack.artist,
          album: currentTrack.album || "Soundroom Master Vault",
          artwork: [
            {
              src: currentTrack.artwork,
              sizes: "512x512",
              type: "image/jpeg",
            },
          ],
        });

        navigator.mediaSession.setActionHandler("play", () => {
          isPlayingRef.current = true;
          audio.play().catch(() => {});
          setIsPlaying(true);
        });

        navigator.mediaSession.setActionHandler("pause", () => {
          isPlayingRef.current = false;
          audio.pause();
          setIsPlaying(false);
        });

        navigator.mediaSession.setActionHandler("previoustrack", handlePrevTrack);
        navigator.mediaSession.setActionHandler("nexttrack", handleNextTrack);

        // Fast-Forward & Rewind 10s from Lock Screen / Steering Wheel
        navigator.mediaSession.setActionHandler("seekbackward", (details) => {
          const skip = details.seekOffset || 10;
          audio.currentTime = Math.max(0, audio.currentTime - skip);
          setCurrentTime(audio.currentTime);
        });

        navigator.mediaSession.setActionHandler("seekforward", (details) => {
          const skip = details.seekOffset || 10;
          audio.currentTime = Math.min(audio.duration || 9999, audio.currentTime + skip);
          setCurrentTime(audio.currentTime);
        });

        navigator.mediaSession.setActionHandler("seekto", (details) => {
          if (details.seekTime !== undefined && audio) {
            audio.currentTime = details.seekTime;
            setCurrentTime(details.seekTime);
          }
        });
      } catch (e) {
        console.warn("MediaSession registration:", e);
      }
    }
  }, [currentTrack, handleNextTrack, handlePrevTrack]);

  // 3. Volume & Mute Sync
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  const togglePlay = () => {
    uiAudio.playClick();
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      isPlayingRef.current = false;
      audio.pause();
      setIsPlaying(false);
    } else {
      isPlayingRef.current = true;
      audio
        .play()
        .then(() => {
          setIsPlaying(true);
        })
        .catch((err) => {
          console.warn("[Soundroom] Play error:", err);
        });
    }
  };

  const playTrack = (track: SoundTrack) => {
    uiAudio.playClick();
    setCustomTrack(null);

    // Find if track belongs to current channel or different channel
    const chIndex = currentChannel.tracks.findIndex((t) => t.id === track.id);
    if (chIndex !== -1) {
      setCurrentTrackIndex(chIndex);
    } else {
      // Search in all channels
      const targetChannel = SOUNDROOM_CHANNELS.find((c) =>
        c.tracks.some((t) => t.id === track.id)
      );
      if (targetChannel) {
        setCurrentChannelId(targetChannel.id);
        const idx = targetChannel.tracks.findIndex((t) => t.id === track.id);
        setCurrentTrackIndex(Math.max(0, idx));
      }
    }

    isPlayingRef.current = true;
    if (audioRef.current) {
      const src = track.streamUrl || `/audio/${track.id}.m4a`;
      audioRef.current.src = src;
      audioRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
    }
  };

  // Play any external stream or YouTube/audio URL on the fly
  const playCustomUrl = (url: string, title = "Custom Stream / Audio", artist = "Live Link") => {
    uiAudio.playClick();
    const custom: SoundTrack = {
      id: `custom-${Date.now()}`,
      title: title || "Custom Audio Stream",
      artist: artist || "Direct Stream",
      album: "User Stream / Live",
      channel: "custom",
      duration: 0,
      streamUrl: url,
      isLiveStream: true,
      artwork: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=400&auto=format&fit=crop",
    };
    setCustomTrack(custom);
    isPlayingRef.current = true;
    if (audioRef.current) {
      audioRef.current.src = url;
      audioRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
    }
  };

  const nextTrack = () => handleNextTrack();
  const prevTrack = () => handlePrevTrack();

  const selectChannel = (channelId: string) => {
    uiAudio.playClick();
    setCustomTrack(null);
    setCurrentChannelId(channelId);
    setCurrentTrackIndex(0);
  };

  const seek = (time: number) => {
    if (audioRef.current && !currentTrack.isLiveStream) {
      audioRef.current.currentTime = time;
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
        arr[i] = Math.min(
          255,
          Math.max(10, Math.floor((bass + mid + pulse) / 3))
        );
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
        playCustomUrl,
        nextTrack,
        prevTrack,
        selectChannel,
        seek,
        setVolume,
        toggleMute,
        toggle432Hz,
        getFrequencyData,
      }}
    >
      {children}
    </SoundroomContext.Provider>
  );
}

export function useSoundroom() {
  const ctx = useContext(SoundroomContext);
  if (!ctx) {
    throw new Error("useSoundroom must be used within SoundroomProvider");
  }
  return ctx;
}
