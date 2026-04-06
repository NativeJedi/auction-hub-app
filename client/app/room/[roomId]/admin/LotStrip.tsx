import { cn } from '@/ui-kit/utils';

type LotStatus = 'done' | 'active' | 'upcoming';

type StripLot = {
  id: string;
  name: string;
  status: LotStatus;
  soldPrice?: string;
};

type Props = {
  lots: StripLot[];
};

const LotStrip = ({ lots }: Props) => (
  <div className="flex gap-1.5 overflow-x-auto px-3 py-2.5 border-b [scrollbar-width:none] [&::-webkit-scrollbar]:hidden flex-shrink-0">
    {lots.map((lot, index) => (
      <div
        key={lot.id}
        className={cn(
          'flex flex-col gap-0.5 px-2.5 py-1.5 rounded-md border min-w-[110px] max-w-[110px] flex-shrink-0',
          lot.status === 'active' && 'border-primary bg-primary/5',
          lot.status === 'done' && 'opacity-50'
        )}
      >
        <span
          className={cn(
            'text-[10px] text-muted-foreground',
            lot.status === 'active' && 'text-primary'
          )}
        >
          Lot {index + 1}
          {lot.status === 'active' ? ' · active' : ''}
        </span>
        <span
          className={cn(
            'text-xs font-medium truncate text-muted-foreground',
            lot.status === 'done' && 'line-through',
            lot.status === 'active' && 'text-primary'
          )}
        >
          {lot.name}
        </span>
        {lot.soldPrice && (
          <span className="text-[10px] font-medium text-success">{lot.soldPrice}</span>
        )}
      </div>
    ))}
  </div>
);

export default LotStrip;
export type { StripLot };
