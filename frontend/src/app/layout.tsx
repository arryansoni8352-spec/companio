import '@/styles/globals.css';
import type { Metadata, Viewport } from 'next';

export const metadata: Metadata = {
  title: 'COMPANIO — Privacy-First Connections Platform',
  description: 'Privacy-first social connections. Meet live matches, book verified rental companions, and chat with custom AI friends.',
  keywords: ['connections', 'privacy', 'companionship', 'ai friend', 'matchmaking'],
  manifest: '/manifest.json',
  icons: { icon: '/favicon.ico' },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0a0a0a' },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
