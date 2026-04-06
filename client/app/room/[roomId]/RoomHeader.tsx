type Props = React.PropsWithChildren<{ title: string; description: string }>;

const RoomHeader = ({ title, description, children }: Props) => {
  return (
    <header className="bg-background border-b px-4 sm:px-6 py-3 sm:py-3.5 flex items-center justify-between gap-3 flex-shrink-0">
      <div className="min-w-0">
        <p className="text-base sm:text-lg font-medium truncate">{title}</p>
        <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 truncate">{description}</p>
      </div>
      <div className="flex items-center gap-2">{children}</div>
    </header>
  );
};

export default RoomHeader;
