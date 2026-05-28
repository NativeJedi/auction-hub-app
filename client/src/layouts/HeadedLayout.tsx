import SiteHeader from '@/src/layouts/SiteHeader';

type Props = React.PropsWithChildren<{
  showControls?: boolean;
  showLogout?: boolean;
}>;
export default function HeadedLayout({ children, showLogout = true, showControls = true }: Props) {
  return (
    <div className="flex flex-col min-h-dvh">
      <SiteHeader showLogout={showLogout} showControls={showControls} />
      <main className="flex-1 flex flex-col p-4 sm:p-6 space-y-4 sm:space-y-6">{children}</main>
    </div>
  );
}
