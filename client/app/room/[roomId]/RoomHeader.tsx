type Props = {
  auction: {
    name: string;
    description?: string;
  };
};

const RoomHeader = ({ auction }: Props) => (
  <header className="mb-6">
    <h1 className="text-3xl font-bold">{auction.name}</h1>
    {auction?.description && <p>{auction.description}</p>}
  </header>
);

export default RoomHeader;
