'use client';

const FormLayout = ({
  title,
  children,
  footer,
  submitLabel,
  onSubmit,
}: React.PropsWithChildren<{
  title: string;
  footer: React.ReactNode;
  submitLabel: string;
  onSubmit: (e: React.FormEvent) => void;
}>) => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(e);
  };

  return (
    <div className="card w-full max-w-md shadow-xl bg-base-100 transition-colors">
      <div className="card-body">
        <h2 className="card-title text-center">{title}</h2>
        <form className="space-y-4 mt-2" onSubmit={handleSubmit}>
          {children}
          <button type="submit" className="btn btn-primary w-full">
            {submitLabel}
          </button>
        </form>
        <div className="mt-4">{footer}</div>
      </div>
    </div>
  );
};

export default FormLayout;
