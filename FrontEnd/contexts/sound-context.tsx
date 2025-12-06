"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
} from "react";

interface SoundContextType {
  selectedSound: string;
  volume: number;
  setSelectedSound: (sound: string) => void;
  setVolume: (volume: number) => void;
  playCompletionSound: () => Promise<void>; // ✅ Return Promise
  isPlaying: boolean;
  stopSound: () => void;
}

const SoundContext = createContext<SoundContextType | undefined>(undefined);

export const SoundProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [selectedSound, setSelectedSound] = useState("sound1");
  const [volume, setVolume] = useState(80);
  const [isPlaying, setIsPlaying] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Load settings from localStorage
  useEffect(() => {
    const savedSound = localStorage.getItem("completionSound");
    const savedVolume = localStorage.getItem("completionVolume");

    if (savedSound) setSelectedSound(savedSound);
    if (savedVolume) setVolume(Number(savedVolume));
  }, []);

  // Save settings to localStorage
  useEffect(() => {
    localStorage.setItem("completionSound", selectedSound);
    localStorage.setItem("completionVolume", volume.toString());
  }, [selectedSound, volume]);

  const stopSound = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
    setIsPlaying(false);
  };

  const playCompletionSound = (): Promise<void> => {
    if (selectedSound === "none") return Promise.resolve();

    // Stop any currently playing sound
    stopSound();

    return new Promise((resolve) => {
      // Create new audio instance
      const audio = new Audio(`/sounds/${selectedSound}.mp3`);
      audio.volume = volume / 100;
      audioRef.current = audio;

      setIsPlaying(true);

      // Handle when sound ends
      audio.onended = () => {
        setIsPlaying(false);
        audioRef.current = null;
        resolve(); // ✅ Resolve promise khi âm thanh kết thúc
      };

      // Handle errors
      audio.onerror = () => {
        console.error("Error playing sound:", selectedSound);
        setIsPlaying(false);
        audioRef.current = null;
        resolve(); // ✅ Resolve ngay cả khi có lỗi
      };

      // Play the sound
      audio.play().catch((error) => {
        console.error("Error playing sound:", error);
        setIsPlaying(false);
        audioRef.current = null;
        resolve(); // ✅ Resolve nếu play() fail
      });
    });
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopSound();
    };
  }, []);

  return (
    <SoundContext.Provider
      value={{
        selectedSound,
        volume,
        setSelectedSound,
        setVolume,
        playCompletionSound,
        isPlaying,
        stopSound,
      }}
    >
      {children}
    </SoundContext.Provider>
  );
};

export const useSoundContext = () => {
  const ctx = useContext(SoundContext);
  if (!ctx)
    throw new Error("useSoundContext must be used within SoundProvider");
  return ctx;
};
