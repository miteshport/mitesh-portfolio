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

export function SoundroomProvider({ children }: { children: React.ReactNode }) {
  const [currentChannelId, setCurrentChannelId] =
    useState<SoundChannel["id"]>("user-vault");
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolumeState] = useState(0.85);
  const [isMuted, setIsMuted] = useState(false);
  const [is432Hz, setIs432Hz] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const freqDataRef = useRef<Uint8Array>(new Uint8Array(64));

  const currentChannel =
    SOUNDROOM_CHANNELS.find((c) => c.id === currentChannelId) ||
    SOUNDROOM_CHANNELS[0];
  const currentTrack =
    currentChannel.tracks[currentTrackIndex] || currentChannel.tracks[0];

  const handleNextTrack = useCallback(() => {
    uiAudio.playClick();
    setCurrentTrackIndex((prev) => (prev + 1) % currentChannel.tracks.length);
  }, [currentChannel]);

  const handlePrevTrack = useCallback(() => {
    uiAudio.playClick();
    setCurrentTrackIndex(
      (prev) =>
        (prev - 1 + currentChannel.tracks.length) % currentChannel.tracks.length
    );
  }, [currentChannel]);

  // 1. Initialize Native Audio Element (Apple & Android Lock Screen Standard)
  useEffect(() => {
    if (typeof window === "undefined") return;

    const audio = new Audio();
    audio.preload = "auto";
    audio.crossOrigin = "anonymous";
    audioRef.current = audio;

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
      if (audio.duration && !isNaN(audio.duration)) {
        setDuration(audio.duration);
      }
    };

    const handleLoadedMetadata = () => {
      if (audio.duration && !isNaN(audio.duration)) {
        setDuration(audio.duration);
      }
    };

    const handleEnded = () => {
      handleNextTrack();
    };

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

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

  // 2. Track Change: Load Native Audio Source & Sync Media Session
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentTrack) return;

    const nativeSrc = `/audio/${currentTrack.id}.m4a`;
    audio.src = nativeSrc;
    audio.volume = isMuted ? 0 : volume;

    if (isPlaying) {
      audio.play().catch((err) => {
        console.warn("[Soundroom] Auto-playback interrupted:", err);
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
          audio.play().catch(() => {});
          setIsPlaying(true);
        });

        navigator.mediaSession.setActionHandler("pause", () => {
          audio.pause();
          setIsPlaying(false);
        });

        navigator.mediaSession.setActionHandler("previoustrack", handlePrevTrack);
        navigator.mediaSession.setActionHandler("nexttrack", handleNextTrack);

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
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.play().then(() => setIsPlaying(true)).catch(() => {});
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
    const audio = audioRef.current;
    if (audio) {
      audio.src = `/audio/${track.id}.m4a`;
      audio.play().then(() => setIsPlaying(true)).catch(() => {});
    }
  };

  const selectChannel = (channelId: SoundChannel["id"]) => {
    uiAudio.playClick();
    setCurrentChannelId(channelId);
    setCurrentTrackIndex(0);
  };

  const seek = (time: number) => {
    if (audioRef.current) {
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
        nextTrack: handleNextTrack,
        prevTrack: handlePrevTrack,
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
  const context = useContext(SoundroomContext);
  if (!context) {
    throw new Error("useSoundroom must be used within a SoundroomProvider");
  }
  return context;
}
