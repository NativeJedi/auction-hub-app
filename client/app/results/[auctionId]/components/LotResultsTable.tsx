import { Columns, DataTable } from '@/src/modules/tables';
import { StatusBadge, StatusMap } from '@/src/components/StatusBadge';
import { LotResult } from '@/src/api/dto/auction-results.dto';

type LotStatus = LotResult['status'];

const LOT_STATUS_MAP: StatusMap<LotStatus> = {
  sold: 'success',
  unsold: 'error',
  created: 'draft',
};

const columns: Columns<LotResult & { index: number }> = [
  { header: '#', render: (row) => row.index + 1 },
  { header: 'Name', render: (row) => row.name },
  { header: 'Status', render: (row) => <StatusBadge status={row.status} map={LOT_STATUS_MAP} /> },
  { header: 'Sold Price', render: (row) => row.soldPrice ?? '—' },
  { header: 'Buyer', render: (row) => row.buyerName ?? '—' },
];

type LotResultsTableProps = {
  lots: LotResult[];
};

const LotResultsTable = ({ lots }: LotResultsTableProps) => {
  const rows = lots.map((lot, index) => ({ ...lot, index }));

  return (
    <div className="overflow-x-auto">
      <DataTable data={rows} columns={columns} />
    </div>
  );
};

export default LotResultsTable;
