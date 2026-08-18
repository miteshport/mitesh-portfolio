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

export function extractYouTubeId(url: string): string | null {
  if (!url) return null;
  const clean = url.trim();
  // 11 character direct ID
  if (/^[a-zA-Z0-9_-]{11}$/.test(clean)) return clean;
  // youtu.be/ID
  const shortMatch = clean.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/);
  if (shortMatch) return shortMatch[1];
  // youtube.com/watch?v=ID or music.youtube.com/watch?v=ID
  const longMatch = clean.match(/[?&]v=([a-zA-Z0-9_-]{11})/);
  if (longMatch) return longMatch[1];
  // youtube.com/embed/ID
  const embedMatch = clean.match(/youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/);
  if (embedMatch) return embedMatch[1];
  return null;
}

interface SoundroomContextType {
  currentTrack: SoundTrack;
  currentChannel: SoundChannel;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  is432Hz: boolean;
  isShuffle: boolean;
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
  toggleShuffle: () => void;
  getFrequencyData: () => Uint8Array;
}

const SoundroomContext = createContext<SoundroomContextType | null>(null);

declare global {
  interface Window {
    YT?: any;
    onYouTubeIframeAPIReady?: () => void;
  }
}

export function SoundroomProvider({ children }: { children: React.ReactNode }) {
  const [currentChannelId, setCurrentChannelId] = useState<string>("user-vault");
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [customTrack, setCustomTrack] = useState<SoundTrack | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolumeState] = useState(0.85);
  const [isMuted, setIsMuted] = useState(false);
  const [is432Hz, setIs432Hz] = useState(false);
  const [isShuffle, setIsShuffle] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const ytPlayerRef = useRef<any>(null);
  const isPlayingRef = useRef(false);
  const isYtModeRef = useRef(false);
  const freqDataRef = useRef<Uint8Array>(new Uint8Array(64));

  const currentChannel =
    SOUNDROOM_CHANNELS.find((c) => c.id === currentChannelId) ||
    SOUNDROOM_CHANNELS[0];

  const currentTrack: SoundTrack =
    customTrack ||
    currentChannel.tracks[currentTrackIndex] ||
    currentChannel.tracks[0];

  // Load YouTube IFrame API once
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!window.YT) {
      const tag = document.createElement("script");
      tag.src = "https://www.youtube.com/iframe_api";
      const firstScriptTag = document.getElementsByTagName("script")[0];
      firstScriptTag?.parentNode?.insertBefore(tag, firstScriptTag);
    }
  }, []);

  const handleNextTrack = useCallback(() => {
    uiAudio.playClick();
    if (customTrack) setCustomTrack(null);
    if (isShuffle && currentChannel.tracks.length > 1) {
      setCurrentTrackIndex((prev) => {
        let nextIdx = Math.floor(Math.random() * currentChannel.tracks.length);
        if (nextIdx === prev && currentChannel.tracks.length > 1) {
          nextIdx = (nextIdx + 1) % currentChannel.tracks.length;
        }
        return nextIdx;
      });
    } else {
      setCurrentTrackIndex((prev) => (prev + 1) % currentChannel.tracks.length);
    }
  }, [currentChannel, customTrack, isShuffle]);

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
      if (!isYtModeRef.current) {
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
          } catch {}
        }
      }
    };

    const handleLoadedMetadata = () => {
      if (!isYtModeRef.current && audio.duration && !isNaN(audio.duration) && isFinite(audio.duration)) {
        setDuration(audio.duration);
      }
    };

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
      if (!audio.ended && !isYtModeRef.current) {
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

  // YouTube Poll Timer for currentTime/duration when in YouTube mode
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isYtModeRef.current && isPlaying) {
      interval = setInterval(() => {
        if (ytPlayerRef.current && ytPlayerRef.current.getCurrentTime) {
          const curr = ytPlayerRef.current.getCurrentTime() || 0;
          const dur = ytPlayerRef.current.getDuration() || 0;
          setCurrentTime(curr);
          if (dur > 0) setDuration(dur);

          if (
            typeof window !== "undefined" &&
            "mediaSession" in navigator &&
            "setPositionState" in navigator.mediaSession &&
            dur > 0
          ) {
            try {
              navigator.mediaSession.setPositionState({
                duration: dur,
                playbackRate: 1,
                position: Math.min(curr, dur),
              });
            } catch {}
          }
        }
      }, 500);
    }
    return () => clearInterval(interval);
  }, [isPlaying]);

  // 2. Track Change: Seamless Autoplay Next Track & Sync Media Session
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentTrack) return;

    // Check if this is a custom YouTube URL track
    const ytId = currentTrack.youtubeId && currentTrack.isExternal ? currentTrack.youtubeId : null;

    if (ytId) {
      // YouTube Audio Bridge Mode
      isYtModeRef.current = true;
      audio.pause();

      if (window.YT && window.YT.Player) {
        if (ytPlayerRef.current && ytPlayerRef.current.loadVideoById) {
          ytPlayerRef.current.loadVideoById(ytId);
          if (isPlayingRef.current || isPlaying) ytPlayerRef.current.playVideo();
        } else {
          ytPlayerRef.current = new window.YT.Player("youtube-audio-bridge", {
            height: "1",
            width: "1",
            videoId: ytId,
            playerVars: {
              autoplay: isPlayingRef.current || isPlaying ? 1 : 0,
              controls: 0,
              playsinline: 1,
            },
            events: {
              onReady: (event: any) => {
                event.target.setVolume(isMuted ? 0 : volume * 100);
                if (isPlayingRef.current || isPlaying) event.target.playVideo();
              },
              onStateChange: (event: any) => {
                if (event.data === 1) { // Playing
                  setIsPlaying(true);
                  isPlayingRef.current = true;
                  if ("mediaSession" in navigator) navigator.mediaSession.playbackState = "playing";
                } else if (event.data === 2) { // Paused
                  setIsPlaying(false);
                  isPlayingRef.current = false;
                  if ("mediaSession" in navigator) navigator.mediaSession.playbackState = "paused";
                } else if (event.data === 0) { // Ended
                  handleNextTrack();
                }
              },
            },
          });
        }
      }
    } else {
      // Native Audio Element Mode (/audio/ track or live stream)
      isYtModeRef.current = false;
      if (ytPlayerRef.current && ytPlayerRef.current.pauseVideo) {
        ytPlayerRef.current.pauseVideo();
      }

      const targetSrc = currentTrack.streamUrl || `/audio/${currentTrack.id}.m4a`;
      audio.src = targetSrc;
      audio.volume = isMuted ? 0 : volume;

      if (isPlayingRef.current || isPlaying) {
        audio
          .play()
          .then(() => {
            setIsPlaying(true);
            isPlayingRef.current = true;
          })
          .catch((err) => {
            console.warn("[Soundroom] Native audio transition:", err);
          });
      }
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
          if (isYtModeRef.current && ytPlayerRef.current) {
            ytPlayerRef.current.playVideo();
          } else if (audio) {
            audio.play().catch(() => {});
          }
          setIsPlaying(true);
        });

        navigator.mediaSession.setActionHandler("pause", () => {
          isPlayingRef.current = false;
          if (isYtModeRef.current && ytPlayerRef.current) {
            ytPlayerRef.current.pauseVideo();
          } else if (audio) {
            audio.pause();
          }
          setIsPlaying(false);
        });

        navigator.mediaSession.setActionHandler("previoustrack", handlePrevTrack);
        navigator.mediaSession.setActionHandler("nexttrack", handleNextTrack);

        navigator.mediaSession.setActionHandler("seekbackward", (details) => {
          const skip = details.seekOffset || 10;
          if (isYtModeRef.current && ytPlayerRef.current) {
            const cur = ytPlayerRef.current.getCurrentTime() || 0;
            ytPlayerRef.current.seekTo(Math.max(0, cur - skip), true);
          } else if (audio) {
            audio.currentTime = Math.max(0, audio.currentTime - skip);
            setCurrentTime(audio.currentTime);
          }
        });

        navigator.mediaSession.setActionHandler("seekforward", (details) => {
          const skip = details.seekOffset || 10;
          if (isYtModeRef.current && ytPlayerRef.current) {
            const cur = ytPlayerRef.current.getCurrentTime() || 0;
            ytPlayerRef.current.seekTo(cur + skip, true);
          } else if (audio) {
            audio.currentTime = Math.min(audio.duration || 9999, audio.currentTime + skip);
            setCurrentTime(audio.currentTime);
          }
        });

        navigator.mediaSession.setActionHandler("seekto", (details) => {
          if (details.seekTime !== undefined) {
            if (isYtModeRef.current && ytPlayerRef.current) {
              ytPlayerRef.current.seekTo(details.seekTime, true);
            } else if (audio) {
              audio.currentTime = details.seekTime;
              setCurrentTime(details.seekTime);
            }
          }
        });
      } catch (e) {
        console.warn("MediaSession registration:", e);
      }
    }
  }, [currentTrack, handleNextTrack, handlePrevTrack]);

  // Volume Sync
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
    if (ytPlayerRef.current && ytPlayerRef.current.setVolume) {
      ytPlayerRef.current.setVolume(isMuted ? 0 : volume * 100);
    }
  }, [volume, isMuted]);

  const togglePlay = () => {
    uiAudio.playClick();

    if (isPlaying) {
      isPlayingRef.current = false;
      if (isYtModeRef.current && ytPlayerRef.current) {
        ytPlayerRef.current.pauseVideo();
      } else if (audioRef.current) {
        audioRef.current.pause();
      }
      setIsPlaying(false);
    } else {
      isPlayingRef.current = true;
      if (isYtModeRef.current && ytPlayerRef.current) {
        ytPlayerRef.current.playVideo();
        setIsPlaying(true);
      } else if (audioRef.current) {
        audioRef.current
          .play()
          .then(() => setIsPlaying(true))
          .catch((err) => console.warn("[Soundroom] Play error:", err));
      }
    }
  };

  const playTrack = (track: SoundTrack) => {
    uiAudio.playClick();
    setCustomTrack(null);

    const chIndex = currentChannel.tracks.findIndex((t) => t.id === track.id);
    if (chIndex !== -1) {
      setCurrentTrackIndex(chIndex);
    } else {
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

  // Play any YouTube link, custom MP3, or Icecast stream
  const playCustomUrl = async (url: string, title = "Custom Stream / Audio", artist = "Live Link") => {
    uiAudio.playClick();
    const ytId = extractYouTubeId(url);

    try {
      const res = await fetch(`/api/audio/stream?url=${encodeURIComponent(url)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.streamUrl) {
          // Native Audio Stream Resolved (Plays with screen locked / browser minimized!)
          const custom: SoundTrack = {
            id: `stream-${ytId || Date.now()}`,
            title: data.title || title,
            artist: data.artist || artist,
            album: "Soundroom Live Stream",
            channel: "custom",
            streamUrl: data.streamUrl,
            duration: data.duration || 0,
            isLiveStream: false,
            artwork: data.artwork || `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`,
          };
          setCustomTrack(custom);
          isPlayingRef.current = true;
          isYtModeRef.current = false;
          if (audioRef.current) {
            audioRef.current.src = data.streamUrl;
            audioRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
          }
          return;
        }
      }
    } catch {}

    if (ytId) {
      // YouTube Link Ingestion Fallback
      const custom: SoundTrack = {
        id: `yt-${ytId}`,
        title: title !== "Custom Stream / Audio" ? title : "YouTube Commute Mix",
        artist: artist !== "Live Link" ? artist : "YouTube Audio Stream",
        album: "YouTube Live Link",
        channel: "custom",
        youtubeId: ytId,
        isLiveStream: false,
        duration: 0,
        artwork: `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`,
      };
      // @ts-ignore
      custom.isExternal = true;
      setCustomTrack(custom);
      isPlayingRef.current = true;
      isYtModeRef.current = true;
    } else {
      // Direct MP3 or Shoutcast/Icecast Stream URL
      const custom: SoundTrack = {
        id: `stream-${Date.now()}`,
        title: title || "Direct Audio Stream",
        artist: artist || "Web Stream URL",
        album: "Live Stream Feed",
        channel: "custom",
        duration: 0,
        streamUrl: url,
        isLiveStream: true,
        artwork: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=400&auto=format&fit=crop",
      };
      setCustomTrack(custom);
      isPlayingRef.current = true;
      isYtModeRef.current = false;
      if (audioRef.current) {
        audioRef.current.src = url;
        audioRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
      }
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
    if (isYtModeRef.current && ytPlayerRef.current) {
      ytPlayerRef.current.seekTo(time, true);
      setCurrentTime(time);
    } else if (audioRef.current && !currentTrack.isLiveStream) {
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

  const toggleShuffle = () => {
    uiAudio.playClick();
    setIsShuffle((prev) => !prev);
  };

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
        isShuffle,
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
        toggleShuffle,
        getFrequencyData,
      }}
    >
      {/* Hidden YouTube Audio Bridge Element */}
      <div
        id="youtube-audio-bridge"
        style={{
          position: "fixed",
          top: -9999,
          left: -9999,
          width: "1px",
          height: "1px",
          opacity: 0.01,
          pointerEvents: "none",
        }}
      />
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
