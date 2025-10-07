import './globals.css';
import { NotificationProvider } from '@/src/modules/notifications/NotifcationContext';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning data-theme="corporate">
      <body className="min-h-screen bg-background text-foreground antialiased">
        <NotificationProvider>{children}</NotificationProvider>
      </body>
    </html>
  );
}
