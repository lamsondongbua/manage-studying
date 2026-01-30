"use client";

import React, { useState, useRef } from "react";
import { Upload, Plus, X, Loader2 } from "lucide-react";
import { useMusic } from "@/contexts/music-context";
import { toast } from "sonner";
import { uploadMusic } from "@/services/apiServices";

interface MusicUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (music: any) => void;
}

export const MusicUploadModal: React.FC<MusicUploadModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [artist, setArtist] = useState("");
  const [duration, setDuration] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPublic, setIsPublic] = useState(true); // mặc định public
  const { addToPlaylist } = useMusic();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    // Kiểm tra loại file
    const allowedTypes = [
      "audio/mpeg",
      "audio/wav",
      "audio/ogg",
      "audio/webm",
      "audio/aac",
      "audio/flac",
      "audio/mp3", // ✅ Thêm audio/mp3
    ];

    if (!allowedTypes.includes(selectedFile.type)) {
      toast.error("Loại file không hợp lệ. Vui lòng chọn file âm thanh.");
      return;
    }

    // Kiểm tra kích thước file (giới hạn 50MB)
    if (selectedFile.size > 50 * 1024 * 1024) {
      toast.error("Kích thước file vượt quá 50MB.");
      return;
    }

    setFile(selectedFile);

    // ✅ FIX: Tạo URL từ file được chọn và load vào audio
    const url = URL.createObjectURL(selectedFile);
    if (audioRef.current) {
      audioRef.current.src = url; // ✅ Dùng blob URL, không phải stream URL
      audioRef.current.load();
    }
  };

  const handleAudioLoaded = () => {
    if (audioRef.current && audioRef.current.duration) {
      setDuration(Math.round(audioRef.current.duration));
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!file || !title || !artist) {
      toast.error("Vui lòng điền đầy đủ thông tin");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("title", title);
    formData.append("artist", artist);
    formData.append("duration", duration.toString());
    formData.append("isPublic", String(isPublic));


    try {
      setIsLoading(true);

      const music = await uploadMusic(formData, setProgress);

      toast.success("Tải lên thành công");
      addToPlaylist(music);
      onSuccess?.(music);

      // ✅ Reset form sau khi tải lên thành công
      setFile(null);
      setTitle("");
      setArtist("");
      setDuration(0);
      setProgress(0);

      onClose();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Tải lên thất bại");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.currentTarget.classList.add("bg-blue-500/20");
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.currentTarget.classList.remove("bg-blue-500/20");
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.currentTarget.classList.remove("bg-blue-500/20");

    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) {
      const input = fileInputRef.current;
      if (input) {
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(droppedFile);
        input.files = dataTransfer.files;

        const event = new Event("change", { bubbles: true });
        input.dispatchEvent(event);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-gray-900 rounded-xl shadow-2xl max-w-md w-full mx-4 border border-gray-700">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Upload size={24} className="text-blue-500" />
            Tải lên nhạc
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
            disabled={isLoading}
          >
            <X size={24} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleUpload} className="p-6 space-y-4">
          {/* File input */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className="border-2 border-dashed border-gray-600 rounded-lg p-6 text-center cursor-pointer hover:border-blue-500 hover:bg-blue-500/5 transition-all"
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="audio/*"
              onChange={handleFileSelect}
              className="hidden"
              disabled={isLoading}
            />
            <div className="flex flex-col items-center gap-2">
              <Upload className="text-gray-400" size={32} />
              <p className="text-sm font-medium text-white">
                {file ? file.name : "Nhấn để tải lên hoặc kéo thả file"}
              </p>
              <p className="text-xs text-gray-400">
                MP3, WAV, OGG, WebM, AAC, hoặc FLAC tối đa 50MB
              </p>
            </div>
          </div>

          {/* Metadata inputs */}
          <div>
            <label className="block text-sm font-medium text-gray-200 mb-2">
              Tên bài hát *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Nhập tên bài hát"
              disabled={isLoading}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none transition-colors disabled:opacity-50"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-200 mb-2">
              Nghệ sĩ *
            </label>
            <input
              type="text"
              value={artist}
              onChange={(e) => setArtist(e.target.value)}
              placeholder="Nhập tên nghệ sĩ"
              disabled={isLoading}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none transition-colors disabled:opacity-50"
            />
          </div>

          {/* ✅ CHO ĐOẠN CHECKBOX VÀO ĐÂY */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={isPublic}
              onChange={(e) => setIsPublic(e.target.checked)}
              className="accent-blue-500"
            />
            <span className="text-sm text-gray-300">
              Công khai (cho phép mọi người nghe)
            </span>
          </div>

          {/* Duration display */}
          {duration > 0 && (
            <div className="text-sm text-gray-400">
              Thời lượng: {Math.floor(duration / 60)}:
              {String(duration % 60).padStart(2, "0")}
            </div>
          )}

          {/* Progress bar */}
          {isLoading && progress > 0 && (
            <div>
              <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
                <span>Đang tải lên...</span>
                <span>{progress}%</span>
              </div>
              <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isLoading || !file || !title.trim() || !artist.trim()}
              className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg hover:from-blue-700 hover:to-cyan-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 font-medium"
            >
              {isLoading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Đang tải lên...
                </>
              ) : (
                <>
                  <Plus size={18} />
                  Tải lên
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* ✅ Hidden audio element để phát hiện duration */}
      <audio ref={audioRef} onLoadedMetadata={handleAudioLoaded} />
    </div>
  );
};
