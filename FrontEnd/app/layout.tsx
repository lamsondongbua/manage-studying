import "./globals.css";
import { Providers } from "./providers";
import { MusicPlayer } from "@/components/music/music-player";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Providers>
          {children}
          <MusicPlayer />
        </Providers>
      </body>
    </html>
  );
}
