import './globals.css';
import type { Viewport } from 'next';
import { Geist_Mono } from 'next/font/google';
import { NotificationProvider } from '@/src/modules/notifications/NotifcationContext';

export const viewport: Viewport = {
  viewportFit: 'cover',
};

const fontSans = Geist_Mono({ subsets: ['latin'], variable: '--font-sans' });

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${fontSans.variable}`}>
      <body className="antialiased">
        <NotificationProvider>{children}</NotificationProvider>
      </body>
    </html>
  );
}
