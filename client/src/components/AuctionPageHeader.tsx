import { Fragment } from 'react';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';

export type Action = {
  component: React.ReactNode;
  isVisible?: boolean;
};

export type MetaItem = {
  text: string;
  isVisible?: boolean;
};

type BackLink = {
  href: string;
  label: string;
};

type AuctionPageHeaderProps = {
  title: string;
  back?: BackLink;
  badge?: React.ReactNode;
  actions?: Action[];
  description?: string | null;
  meta?: MetaItem[];
};

export default function AuctionPageHeader({
  title,
  back,
  badge,
  actions,
  description,
  meta,
}: AuctionPageHeaderProps) {
  const visibleActions = actions?.filter((a) => a.isVisible !== false) ?? [];

  return (
    <div>
      <div className="space-y-2">
        {back && (
          <Link
            href={back.href}
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
          >
            <ChevronLeft className="size-3" />
            {back.label}
          </Link>
        )}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
            {badge}
          </div>
          {visibleActions.length > 0 && (
            <div className="flex items-center gap-2 shrink-0 pt-0.5">
              {visibleActions.map((a, i) => (
                <Fragment key={i}>{a.component}</Fragment>
              ))}
            </div>
          )}
        </div>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
        {meta && (
          <p className="text-xs text-muted-foreground">
            {meta.filter((m) => m.isVisible !== false).map((m) => m.text).join(' · ')}
          </p>
        )}
      </div>
      <hr className="border-t mt-4" />
    </div>
  );
}
