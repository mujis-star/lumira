import type { Metadata } from 'next';
import './globals.css';
import { ThemeProvider } from '@/context/ThemeContext';
import { AuthProvider } from '@/context/AuthContext';
import { PostProvider } from '@/context/PostContext';
import { StoryProvider } from '@/context/StoryContext';
import { ChatProvider } from '@/context/ChatContext';
import { NotificationProvider } from '@/context/NotificationContext';

export const metadata: Metadata = {
  title: 'Lumira',
  description: 'Lumira — Capture, edit & share photos, reels, stories & messages with friends and creators.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className="dark">
      <body className="antialiased selection:bg-[#0095f6]/30">
        <ThemeProvider>
          <AuthProvider>
            <PostProvider>
              <StoryProvider>
                <ChatProvider>
                  <NotificationProvider>{children}</NotificationProvider>
                </ChatProvider>
              </StoryProvider>
            </PostProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
