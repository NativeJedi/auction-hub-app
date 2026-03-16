import React from 'react';

const RoomSection = ({
  children,
  title,
  action,
}: React.PropsWithChildren<{ title: string; action?: React.ReactNode }>) => {
  return (
    <section className="flex-1 flex flex-col space-y-4">
      <header className="flex flex-row items-center justify-between">
        <h2 className="text-2xl font-semibold">{title}</h2>

        {action}
      </header>

      {children}
    </section>
  );
};

export default RoomSection;
