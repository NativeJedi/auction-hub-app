import { Badge } from '@/ui-kit/ui/badge';
import { StatusMap } from '@/src/components/StatusBadge/types';

type StatusBadgeProps<T extends string> = {
  status: T;
  map: StatusMap<T>;
};

export function StatusBadge<T extends string>({ status, map }: StatusBadgeProps<T>) {
  const variant = map[status] ?? 'secondary';

  return <Badge variant={variant}>{status}</Badge>;
}
