// app/providers.tsx
"use client";

import { Provider } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";
import { store, persistor } from "../redux/store";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { SoundProvider } from "@/contexts/sound-context";
import { AdminProvider } from "@/contexts/admin-context"; // ✅ THÊM IMPORT
import { MusicProvider } from "@/contexts/music-context"; // ✅ THÊM IMPORT MUSIC PROVIDER
import FocusModeGuard from "@/components/focus/FocusModeGuard";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <Provider store={store}>
      <PersistGate
        loading={
          <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 flex items-center justify-center">
            <div className="animate-pulse text-white text-center">
              <div className="w-12 h-12 bg-white rounded-full mx-auto mb-4 animate-spin"></div>
              <p>Đang khôi phục phiên...</p>
            </div>
          </div>
        }
        persistor={persistor}
      >
        <GoogleOAuthProvider
          clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!}
        >
          <SoundProvider>
            <MusicProvider>
              {/* ✅ WRAP AdminProvider */}
              <AdminProvider>
                <FocusModeGuard /> {/* ✅ GLOBAL */}
                {children}
                <ToastContainer
                  position="top-right"
                  autoClose={3000}
                  hideProgressBar={false}
                  newestOnTop={false}
                  closeOnClick
                  rtl={false}
                  pauseOnFocusLoss
                  draggable
                  pauseOnHover
                  theme="colored"
                />
              </AdminProvider>
            </MusicProvider>
          </SoundProvider>
        </GoogleOAuthProvider>
      </PersistGate>
    </Provider>
  );
}
