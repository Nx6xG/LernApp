import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/components/layout/AuthProvider';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'LernApp - Dein persönlicher Lernbegleiter',
  description:
    'Erstelle Karteikarten, Quizfragen und Notizen. Lerne mit Spaced Repetition und Active Recall.',
  keywords: ['lernen', 'karteikarten', 'quiz', 'spaced repetition', 'bildung'],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de">
      <body className={inter.className}>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
