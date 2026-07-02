import LogoutButton from '@/src/components/LogoutButton';
import Logo from '@/src/components/Logo';

type Props = {
  showLogout?: boolean;
  showControls?: boolean;
  logoHref?: string;
};

const SiteHeader = ({ showLogout, showControls, logoHref = '/crm/auctions' }: Props) => {
  return (
    <header className="sticky top-0 z-50 border-b bg-background/85 backdrop-blur pt-[env(safe-area-inset-top)]">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-3">
        <Logo href={logoHref} />
        {showControls && (
          <div className="flex items-center gap-2">{showLogout && <LogoutButton />}</div>
        )}
      </div>
    </header>
  );
};

export default SiteHeader;
