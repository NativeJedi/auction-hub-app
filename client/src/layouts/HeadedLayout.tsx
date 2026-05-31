import SiteHeader from '@/src/layouts/SiteHeader';

type Props = React.PropsWithChildren<{
  showControls?: boolean;
  showLogout?: boolean;
  logoHref?: string;
}>;
export default function HeadedLayout({
  children,
  showLogout = true,
  showControls = true,
  logoHref,
}: Props) {
  return (
    <div className="flex flex-col min-h-dvh">
      <SiteHeader showLogout={showLogout} showControls={showControls} logoHref={logoHref} />
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-5 py-4 sm:py-6 space-y-4 sm:space-y-6">
        {children}
      </main>
    </div>
  );
}
