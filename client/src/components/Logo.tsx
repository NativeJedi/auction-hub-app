import Link from 'next/link';
import { Gavel } from 'lucide-react';

type LogoProps = {
  href: string;
};

export default function Logo({ href }: LogoProps) {
  return (
    <Link href={href} className="flex items-center gap-2 font-semibold">
      <span className="inline-flex size-8 items-center justify-center rounded-md bg-primary/10 text-primary">
        <Gavel className="size-[18px]" />
      </span>
      AuctionHub
    </Link>
  );
}
