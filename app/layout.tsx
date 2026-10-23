import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Inter, JetBrains_Mono } from 'next/font/google';
import { cn } from '@/lib/utils';
import SessionProviderWrapper from '@/components/SessionProviderWrapper';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'SettleTrack — Multi-Tier Settlement & UTR Record System',
  description:
    'Production-grade multi-tier settlement record and clearing software for Admins, Sub-Admins, and Merchants with UPI/Bank payouts, UTR proof verification, and permanent ledger records.',
  applicationName: 'SettleTrack',
  icons: {
    icon: '/favicon.ico',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#f7f7f4',
  colorScheme: 'light',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={cn('font-sans', inter.variable, jetbrainsMono.variable)}>
      <body className="bg-[#f7f7f4] text-[#26251e] antialiased min-h-screen selection:bg-[#f54e00]/20 selection:text-[#f54e00]" suppressHydrationWarning>
        <SessionProviderWrapper>{children}</SessionProviderWrapper>
      </body>
    </html>
  );
}
