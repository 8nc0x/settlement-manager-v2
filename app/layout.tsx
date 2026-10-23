import type {Metadata} from 'next';
import './globals.css';
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

export const metadata: Metadata = {
  title: 'SettleTrack - Multi-Tier Settlement & UTR Record System',
  description: 'Multi-tier settlement record and clearing software for Admins, Sub-Admins, and Merchants with UPI/Bank payouts, UTR proof verification, and permanent ledger records.',
  openGraph: {
    title: 'SettleTrack - Multi-Tier Settlement & UTR Record System',
    description: 'Multi-tier settlement record and clearing software for Admins, Sub-Admins, and Merchants with UPI/Bank payouts, UTR proof verification, and permanent ledger records.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SettleTrack - Multi-Tier Settlement & UTR Record System',
    description: 'Multi-tier settlement record and clearing software for Admins, Sub-Admins, and Merchants with UPI/Bank payouts, UTR proof verification, and permanent ledger records.',
  },
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en" className={cn("font-sans", geist.variable)}>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
