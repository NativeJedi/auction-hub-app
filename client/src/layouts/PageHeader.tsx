import React from 'react';

const PageHeader = ({ title, action }: { title: string; action: React.ReactNode }) => {
  return (
    <header className="flex flex-row items-center justify-between">
      <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
      {action}
    </header>
  );
};

export default PageHeader;
