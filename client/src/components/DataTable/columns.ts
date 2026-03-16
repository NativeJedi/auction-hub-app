import { Alignment } from '@/src/ui/components/DataTable/alignment';

export type Column<T> = {
  header: string;
  align?: Alignment;
  render: (row: T) => React.ReactNode;
};

export type Columns<T> = Column<T>[];
