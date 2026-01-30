"use client";

import React, { useEffect, useRef, useState } from "react";
import { useMusic } from "@/contexts/music-context";
import { useSelector } from "react-redux";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  Volume1,
  RotateCcw,
  Shuffle,
} from "lucide-react";
import { formatTime } from "@/util/date";
import { toast } from "react-toastify";

export const MusicPlayer: React.FC = () => {
  const {
    currentTrack,
    isPlaying,
    setIsPlaying,
    currentTime,
    setCurrentTime,
    volume,
    setVolume,
    currentTrackIndex,
    setCurrentTrackIndex,
    playlist,
    repeatMode,
    setRepeatMode,
    isShuffle,
    setIsShuffle,
  } = useMusic();

  const audioRef = useRef<HTMLAudioElement>(null);
  const [duration, setDuration] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  // ✅ Lấy access token từ Redux store (với fallback)
  const accessToken = useSelector(
    (state: any) => state.user?.accessToken || "",
  );

useEffect(() => {
  if (!audioRef.current || !currentTrack) return;

  const audio = audioRef.current;

  audio.pause();
  setIsLoading(true);

  audio.src = currentTrack.fileUrl; // ✅ CLOUDINARY URL
  audio.load();
  setCurrentTime(0);

  if (isPlaying) {
    audio.play().catch(() => {
      setIsPlaying(false);
    });
  }

  return () => {
    audio.pause();
  };
}, [currentTrack?.fileUrl]);

  // ✅ Effect riêng cho điều khiển play/pause
  useEffect(() => {
    if (!audioRef.current || !currentTrack) return;

    const audio = audioRef.current;

    if (isPlaying) {
      const playPromise = audio.play();

      if (playPromise !== undefined) {
        playPromise.catch((error) => {
          console.error("Phát nhạc thất bại:", error);
          setIsPlaying(false);
        });
      }
    } else {
      audio.pause();
    }
  }, [isPlaying]);

  // Cập nhật volume
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  // Cập nhật thời gian
  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  // Metadata đã load
  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration || 0);
    }
    setIsLoading(false);
  };



  const handleCanPlay = () => {
    setIsLoading(false);
  };

  // Bài hát kết thúc
  const handleEnded = () => {
    if (repeatMode === "one") {
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch(console.error);
      }
    } else {
      handleNextTrack();
    }
  };

  // Bài tiếp theo
  const handleNextTrack = () => {
    if (playlist.length === 0) return;

    let nextIndex: number;

    if (isShuffle) {
      // ✅ Tránh lặp lại bài hiện tại khi shuffle
      let randomIndex = Math.floor(Math.random() * playlist.length);
      if (playlist.length > 1 && randomIndex === currentTrackIndex) {
        randomIndex = (randomIndex + 1) % playlist.length;
      }
      nextIndex = randomIndex;
    } else {
      nextIndex = (currentTrackIndex + 1) % playlist.length;
    }

    setCurrentTrackIndex(nextIndex);
    setIsPlaying(true);
  };

  // Bài trước đó
  const handlePrevTrack = () => {
    if (playlist.length === 0) return;

    if (currentTime > 3) {
      // Khởi động lại bài hiện tại nếu đã phát hơn 3 giây
      setCurrentTime(0);
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
      }
    } else {
      // Quay về bài trước
      const prevIndex =
        (currentTrackIndex - 1 + playlist.length) % playlist.length;
      setCurrentTrackIndex(prevIndex);
    }
    setIsPlaying(true);
  };

  // Tua
  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!audioRef.current || !duration) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    const newTime = percent * duration;

    setCurrentTime(newTime);
    audioRef.current.currentTime = newTime;
  };

  // MusicPlayer.tsx

  const handleError = (e: React.SyntheticEvent<HTMLAudioElement, Event>) => {
    const audio = e.currentTarget;
    const error = audio.error;

    let errorMessage = "Lỗi không xác định";
    let errorDetails = {};

    if (error) {
      switch (error.code) {
        case error.MEDIA_ERR_ABORTED:
          errorMessage = "Tải nhạc bị hủy bỏ";
          break;
        case error.MEDIA_ERR_NETWORK:
          errorMessage = "Lỗi mạng khi tải nhạc";
          break;
        case error.MEDIA_ERR_DECODE:
          errorMessage = "Lỗi giải mã file nhạc";
          break;
        case error.MEDIA_ERR_SRC_NOT_SUPPORTED:
          errorMessage =
            "Định dạng file không được hỗ trợ hoặc URL không hợp lệ";
          break;
      }

      errorDetails = {
        code: error.code,
        message: error.message,
        customMessage: errorMessage,
      };
    }

    console.error("❌ CHI TIẾT LỖI AUDIO:", {
      ...errorDetails,
      currentSrc: audio.src,
      currentTrack: currentTrack?.title,
      trackFileUrl: currentTrack?.fileUrl,
      networkState: audio.networkState,
      readyState: audio.readyState,
      accessToken: accessToken ? `${accessToken.substring(0, 20)}...` : "none",
    });

    toast.error(errorMessage);
    setIsLoading(false);
    setIsPlaying(false);
  };

  // Chuyển đổi chế độ repeat
  const handleRepeat = () => {
    const modes: Array<"off" | "one" | "all"> = ["off", "all", "one"];
    const currentIndex = modes.indexOf(repeatMode);
    const nextIndex = (currentIndex + 1) % modes.length;
    setRepeatMode(modes[nextIndex]);
  };

  if (!currentTrack || playlist.length === 0) {
    return (
      <div className="fixed left-0 right-0 bg-gradient-to-t from-gray-900 to-gray-800 border-t border-gray-700 p-4">
        <div className="text-center text-gray-400">
          <p>Chưa có nhạc</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-gray-900 via-gray-800 to-gray-800/50 backdrop-blur-md border-t border-gray-700/50 shadow-2xl z-50">
      <audio
        ref={audioRef}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleEnded}
        onLoadStart={() => setIsLoading(true)}
        onCanPlay={handleCanPlay}
        onError={handleError}
        crossOrigin="anonymous"
        preload="metadata"
      />

      {/* Thanh tiến trình */}
      <div className="px-4 pt-3 pb-2">
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <span>{formatTime(currentTime)}</span>
          <div
            className="flex-1 bg-gray-700/50 rounded-full h-1 cursor-pointer hover:h-1.5 transition-all group"
            onClick={handleSeek}
          >
            <div
              className="bg-gradient-to-r from-blue-500 to-cyan-500 h-full rounded-full transition-all pointer-events-none"
              style={{
                width: `${duration ? (currentTime / duration) * 100 : 0}%`,
              }}
            />
          </div>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      {/* Điều khiển chính */}
      <div className="px-4 py-3 flex items-center justify-between gap-4">
        {/* Thông tin bài hát */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white truncate">
            {currentTrack.title}
          </p>
          <p className="text-xs text-gray-400 truncate">
            {currentTrack.artist}
          </p>
        </div>

        {/* Nút điều khiển */}
        <div className="flex items-center gap-3">
          {/* Repeat */}
          <button
            onClick={handleRepeat}
            className={`p-1.5 rounded-lg transition-all ${
              repeatMode === "off"
                ? "text-gray-400 hover:text-white"
                : repeatMode === "one"
                  ? "text-red-500 bg-red-500/10 hover:bg-red-500/20"
                  : "text-blue-500 bg-blue-500/10 hover:bg-blue-500/20"
            }`}
            title={`Lặp lại: ${repeatMode}`}
          >
            <RotateCcw size={16} />
            {repeatMode === "one" && <span className="text-xs ml-0.5">1</span>}
          </button>

          {/* Shuffle */}
          <button
            onClick={() => setIsShuffle(!isShuffle)}
            className={`p-1.5 rounded-lg transition-all ${
              isShuffle
                ? "text-green-500 bg-green-500/10"
                : "text-gray-400 hover:text-white"
            }`}
            title="Phát ngẫu nhiên"
          >
            <Shuffle size={16} />
          </button>

          {/* Bài trước */}
          <button
            onClick={handlePrevTrack}
            className="p-2 rounded-lg text-gray-300 hover:text-white hover:bg-white/10 transition-all"
            title="Bài trước"
          >
            <SkipBack size={18} />
          </button>

          {/* Play/Pause */}
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            disabled={isLoading}
            className="p-3 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 text-white hover:from-blue-600 hover:to-cyan-600 transition-all hover:scale-105 disabled:opacity-50"
            title={isPlaying ? "Tạm dừng" : "Phát"}
          >
            {isLoading ? (
              <div className="animate-spin">
                <Play size={20} />
              </div>
            ) : isPlaying ? (
              <Pause size={20} fill="currentColor" />
            ) : (
              <Play size={20} fill="currentColor" />
            )}
          </button>

          {/* Bài tiếp theo */}
          <button
            onClick={handleNextTrack}
            className="p-2 rounded-lg text-gray-300 hover:text-white hover:bg-white/10 transition-all"
            title="Bài tiếp theo"
          >
            <SkipForward size={18} />
          </button>

          {/* Âm lượng */}
          <div className="flex items-center gap-2">
            <Volume1 size={16} className="text-gray-400" />
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={volume}
              onChange={(e) => setVolume(parseFloat(e.target.value))}
              className="w-12 h-1 bg-gray-700 rounded-full cursor-pointer accent-blue-500"
              title={`Âm lượng: ${Math.round(volume * 100)}%`}
            />
          </div>
        </div>

        {/* Thông tin playlist */}
        <div className="text-xs text-gray-400 whitespace-nowrap">
          {currentTrackIndex + 1} / {playlist.length}
        </div>
      </div>
    </div>
  );
};;
