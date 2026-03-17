import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/components/layout/AuthProvider';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'LernApp - Dein persönlicher Lernbegleiter',
  description:
    'Erstelle Karteikarten, Quizfragen und Notizen. Lerne mit Spaced Repetition und Active Recall.',
  keywords: ['lernen', 'karteikarten', 'quiz', 'spaced repetition', 'bildung'],
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'LernApp',
  },
};

export const viewport: Viewport = {
  themeColor: '#4c6ef5',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de">
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
      </head>
      <body className={inter.className}>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
