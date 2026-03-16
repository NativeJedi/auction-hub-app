import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/ui-kit/ui/table';
import { getAlignmentClass } from './alignment';
import { Columns } from './columns';

type DataTableProps<T> = {
  data: T[];
  columns: Columns<T>;
};

export function DataTable<T>({ data, columns }: DataTableProps<T>) {
  return (
    <div className="border rounded-lg overflow-hidden">
      <Table>
        <TableHeader className="sticky top-0 bg-background z-10">
          <TableRow>
            {columns.map((column, i) => (
              <TableHead key={i} className={getAlignmentClass(column.align)}>
                {column.header}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>

        <TableBody>
          {data.map((row, rowIndex) => (
            <TableRow key={rowIndex}>
              {columns.map((column, colIndex) => (
                <TableCell key={colIndex} className={getAlignmentClass(column.align)}>
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
