"use client";

import React from "react";
import { MusicLibrary } from "@/components/music/music-library";

export default function MusicPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800 p-6 pb-32">
      <div className="max-w-6xl mx-auto">
        <MusicLibrary />
      </div>
    </div>
  );
}
