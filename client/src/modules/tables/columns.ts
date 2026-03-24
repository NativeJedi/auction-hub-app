import { Alignment } from './alignment';

export type Column<T> = {
  header: string;
  align?: Alignment;
  render: (row: T) => React.ReactNode;
};

export type Columns<T> = Column<T>[];
