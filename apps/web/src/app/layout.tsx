import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'TypeBrawl — Retro Multiplayer Typing Arena',
  description: 'Master touch typing with 8-bit retro quests, code syntax drills, and real-time display-board multiplayer typing battles with friends!',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-retro-dark text-slate-100 min-h-screen font-sans antialiased selection:bg-amber-400 selection:text-slate-950">
        {children}
      </body>
    </html>
  );
}
