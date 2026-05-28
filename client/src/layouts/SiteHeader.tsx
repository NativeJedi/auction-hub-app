import LanguageSwitcher from '@/src/components/LanguageSwitcher';
import LogoutButton from '@/src/components/LogoutButton';

type Props = {
  showLogout?: boolean;
  showControls?: boolean;
};

const SiteHeader = ({ showLogout, showControls }: Props) => {
  return (
    <header className="h-[52px] border-b bg-background flex items-center justify-between px-4 sm:px-6">
      <span className="font-semibold">AuctionHub</span>
      {showControls && (
        <div className="flex items-center gap-2">
          <LanguageSwitcher />
          {showLogout && <LogoutButton />}
        </div>
      )}
    </header>
  );
};

export default SiteHeader;
