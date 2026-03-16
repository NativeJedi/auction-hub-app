import './globals.css';
import { Geist_Mono } from 'next/font/google';
import { NotificationProvider } from '@/src/modules/notifications/NotifcationContext';

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
