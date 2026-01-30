"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
} from "react";

interface Music {
  _id: string;
  title: string;
  artist: string;
  duration: number;
  fileUrl: string;
  coverImage?: string;
  fileName: string;
  playCount?: number;
}

interface MusicContextType {
  // Playlist
  playlist: Music[];
  currentTrackIndex: number;
  setPlaylist: (playlist: Music[]) => void;
  setCurrentTrackIndex: (index: number) => void;
  addToPlaylist: (music: Music) => void;
  removeFromPlaylist: (musicId: string) => void;

  // Playback control
  isPlaying: boolean;
  setIsPlaying: (playing: boolean) => void;
  currentTime: number;
  setCurrentTime: (time: number) => void;
  volume: number;
  setVolume: (volume: number) => void;

  // Queue
  queue: Music[];
  setQueue: (queue: Music[]) => void;

  // Player visibility
  showPlayer: boolean;
  setShowPlayer: (show: boolean) => void;

  // Get current track
  currentTrack: Music | null;

  // Playback mode
  repeatMode: "off" | "one" | "all"; // off, one, all
  setRepeatMode: (mode: "off" | "one" | "all") => void;
  isShuffle: boolean;
  setIsShuffle: (shuffle: boolean) => void;
}

const MusicContext = createContext<MusicContextType | undefined>(undefined);

export const MusicProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [playlist, setPlaylist] = useState<Music[]>([]);
  const [currentTrackIndex, setCurrentTrackIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [volume, setVolume] = useState<number>(1);
  const [queue, setQueue] = useState<Music[]>([]);
  const [showPlayer, setShowPlayer] = useState<boolean>(true);
  const [repeatMode, setRepeatMode] = useState<"off" | "one" | "all">("off");
  const [isShuffle, setIsShuffle] = useState<boolean>(false);

  const addToPlaylist = (music: Music) => {
    setPlaylist((prev) => {
      const exists = prev.find((m) => m._id === music._id);
      if (exists) return prev;
      return [...prev, music];
    });
  };

  

  const removeFromPlaylist = (musicId: string) => {
    setPlaylist((prev) => prev.filter((m) => m._id !== musicId));
  };

  const currentTrack = playlist[currentTrackIndex] || null;

  const value: MusicContextType = {
    playlist,
    currentTrackIndex,
    setPlaylist,
    setCurrentTrackIndex,
    addToPlaylist,
    removeFromPlaylist,
    isPlaying,
    setIsPlaying,
    currentTime,
    setCurrentTime,
    volume,
    setVolume,
    queue,
    setQueue,
    showPlayer,
    setShowPlayer,
    currentTrack,
    repeatMode,
    setRepeatMode,
    isShuffle,
    setIsShuffle,
  };

  return (
    <MusicContext.Provider value={value}>{children}</MusicContext.Provider>
  );
};

export const useMusic = () => {
  const context = useContext(MusicContext);
  if (!context) {
    throw new Error("useMusic must be used within MusicProvider");
  }
  return context;
};
