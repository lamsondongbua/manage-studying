"use client";

import React, { useEffect, useState } from "react";
import { useMusic } from "@/contexts/music-context";
import { Play, Trash2, Music as MusicIcon, Loader2, Plus } from "lucide-react";
import { toast } from "sonner";
import {
  getUserMusic,
  getMusicById,
  deleteMusic,
  incrementPlayCount,
  getMusicStreamUrl,
} from "../../services/apiServices";
import { Music } from "../../types/index";
import { formatTime } from "@/util/date";
import { MusicUploadModal } from "./music-upload-modal";
import { useSelector } from "react-redux";

export const MusicLibrary: React.FC = () => {
  const [musicList, setMusicList] = useState<Music[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const { addToPlaylist, setCurrentTrackIndex, setPlaylist, setIsPlaying } =
    useMusic();

  const isAuthenticated = useSelector(
    (state: any) => state.user.loggedIn,
  );

  // Lấy access token để streaming
  const accessToken = useSelector((state: any) => state.user.accessToken);

  // ✅ FIX: Xử lý loading state đúng cách
  useEffect(() => {
    if (isAuthenticated) {
      fetchUserMusic();
    } else {
      // ✅ Nếu chưa đăng nhập, tắt loading ngay
      setIsLoading(false);
      setMusicList([]);
    }
  }, [isAuthenticated]);

  const fetchUserMusic = async () => {
    try {
      setIsLoading(true);
      const data = await getUserMusic();
      setMusicList(data || []);
    } catch (err) {
      console.error("Lỗi khi tải thư viện nhạc:", err);
      toast.error("Không thể tải thư viện nhạc");
    } finally {
      setIsLoading(false);
    }
  };

  // Phát một bài
 const handlePlayMusic = async (music: Music) => {
  try {
    console.log("🎵 Play Music Called:", {
      musicId: music._id,
      title: music.title,
      fileUrl: music.fileUrl, // ✅ Kiểm tra giá trị này
    });

    const fullMusic = await getMusicById(music._id);
    
    console.log("🎵 Full Music Data:", {
      fullMusicFileUrl: fullMusic.fileUrl,
      accessToken: accessToken ? `${accessToken.substring(0, 20)}...` : "none",
    });

    const streamUrl = getMusicStreamUrl(music._id, accessToken);
    
    console.log("🔗 Final Stream URL:", streamUrl);

    addToPlaylist({
      ...fullMusic,
      fileUrl: streamUrl,
    });

    setIsPlaying(true);
    await incrementPlayCount(music._id);
  } catch (error) {
    console.error("❌ Lỗi phát nhạc:", error);
    toast.error("Không thể phát nhạc");
  }
};

  // Xóa bài
  const handleDeleteMusic = async (id: string) => {
    if (!confirm("Bạn có chắc muốn xóa bài nhạc này?")) return;

    try {
      await deleteMusic(id);
      setMusicList((prev) => prev.filter((m) => m._id !== id));
      toast.success("Đã xóa bài nhạc");
    } catch (error) {
      console.error("Lỗi xóa nhạc:", error);
      toast.error("Không thể xóa bài nhạc");
    }
  };

  // Phát tất cả
  const handlePlayAll = () => {
    if (!musicList.length) {
      toast.error("Không có nhạc");
      return;
    }

    const playlistWithUrls = musicList.map((m) => ({
      ...m,
      fileUrl: getMusicStreamUrl(m._id, accessToken),
    }));

    setPlaylist(playlistWithUrls);
    setCurrentTrackIndex(0);
    setIsPlaying(true);
  };

  // ✅ Hiển thị loading
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="animate-spin text-blue-500" size={32} />
          <p className="text-gray-400">Đang tải thư viện nhạc...</p>
        </div>
      </div>
    );
  }

  // ✅ Hiển thị thông báo nếu chưa đăng nhập
  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <MusicIcon className="mx-auto text-gray-600 mb-4" size={64} />
          <h3 className="text-xl font-semibold text-gray-300 mb-2">
            Vui lòng đăng nhập
          </h3>
          <p className="text-gray-500">
            Bạn cần đăng nhập để xem thư viện nhạc của mình
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MusicIcon className="text-blue-500" size={24} />
          <h2 className="text-2xl font-bold text-white">Thư viện nhạc</h2>
          <span className="text-sm text-gray-400">({musicList.length})</span>
        </div>
        <div className="flex gap-2">
          {musicList.length > 0 && (
            <button
              onClick={handlePlayAll}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors flex items-center gap-2 font-medium"
            >
              <Play size={18} fill="currentColor" />
              Phát tất cả
            </button>
          )}
          <button
            onClick={() => setUploadModalOpen(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-2 font-medium"
          >
            <Plus size={18} />
            Tải lên
          </button>
        </div>
      </div>

      {/* Danh sách nhạc */}
      {musicList.length === 0 ? (
        <div className="border border-dashed border-gray-700 rounded-lg p-12 text-center">
          <MusicIcon className="mx-auto text-gray-600 mb-4" size={48} />
          <h3 className="text-lg font-semibold text-gray-300 mb-2">
            Chưa có nhạc nào
          </h3>
          <p className="text-gray-500 mb-4">
            Tải lên file nhạc đầu tiên để bắt đầu
          </p>
          <button
            onClick={() => setUploadModalOpen(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            Tải lên nhạc
          </button>
        </div>
      ) : (
        <div className="grid gap-3">
          {musicList.map((music) => (
            <div
              key={music._id}
              className="group bg-gray-800/50 hover:bg-gray-800 border border-gray-700/50 hover:border-gray-600 rounded-lg p-4 transition-all"
            >
              <div className="flex items-center gap-4">
                {/* Cover/Icon */}
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:shadow-lg transition-shadow">
                  <MusicIcon size={24} className="text-white" />
                </div>

                {/* Thông tin */}
                <div className="flex-1 min-w-0">
                  <p className="text-white font-semibold truncate">
                    {music.title}
                  </p>
                  <p className="text-sm text-gray-400 truncate">
                    {music.artist}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatTime(music.duration)} • {music.playCount || 0} lượt
                    phát
                  </p>
                </div>

                {/* Hành động */}
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => handlePlayMusic(music)}
                    className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                    title="Phát"
                  >
                    <Play size={18} fill="currentColor" />
                  </button>
                  <button
                    onClick={() => handleDeleteMusic(music._id)}
                    className="p-2 bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white rounded-lg transition-colors"
                    title="Xóa"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal tải lên */}
      <MusicUploadModal
        isOpen={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        onSuccess={() => fetchUserMusic()}
      />
    </div>
  );
};
