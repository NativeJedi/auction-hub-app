import { PropsWithChildren } from 'react';

type Props = {
  headers: Array<{
    text: string;
    centered?: boolean;
  }>;
};

const TableLayout = ({ headers, children }: PropsWithChildren<Props>) => {
  return (
    <div className="border border-base-300 rounded-lg shadow-sm overflow-hidden">
      <div className="overflow-x-auto max-h-[500px]">
        <table className="table table-zebra w-full">
          <thead className="bg-base-200 sticky top-0 z-1">
            <tr>
              {headers.map((header, index) => (
                <th key={index} className={header.centered ? 'text-center' : ''}>
                  {header.text}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>{children}</tbody>
        </table>
      </div>
    </div>
  );
};

export default TableLayout;
