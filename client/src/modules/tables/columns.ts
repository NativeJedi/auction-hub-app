import { Alignment } from './alignment';

export type Column<T> = {
  header: string;
  align?: Alignment;
  className?: string;
  render: (row: T) => React.ReactNode;
};

export type Columns<T> = Column<T>[];
