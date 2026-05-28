import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/ui-kit/ui/table';
import { cn } from '@/src/ui-kit/utils';
import { getAlignmentClass } from './alignment';
import { Columns } from './columns';

type DataTableProps<T> = {
  data: T[];
  columns: Columns<T>;
  emptyState?: React.ReactNode;
};

const defaultEmptyState = <p className="text-sm text-muted-foreground">No data</p>;

export function DataTable<T>({ data, columns, emptyState }: DataTableProps<T>) {
  if (data.length === 0) {
    return (
      <div className="border rounded-lg">
        <div className="flex flex-col items-center gap-3 py-12">
          {emptyState ?? defaultEmptyState}
        </div>
      </div>
    );
  }

  return (
    <div className="border rounded-lg overflow-x-auto">
      <Table className="min-w-[640px]">
        <TableHeader className="sticky top-0 bg-background z-10">
          <TableRow>
            {columns.map((column, i) => (
              <TableHead key={i} className={cn(getAlignmentClass(column.align), column.className)}>
                {column.header}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>

        <TableBody>
          {data.map((row, rowIndex) => (
            <TableRow key={rowIndex}>
              {columns.map((column, colIndex) => (
                <TableCell
                  key={colIndex}
                  className={cn(getAlignmentClass(column.align), column.className)}
                >
                  {column.render(row)}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
