'use client';

const FormChangeViewButton = ({
  label,
  children,
  onClick,
}: React.PropsWithChildren<{ label: string; onClick: () => void }>) => (
  <p className="text-center text-base-content mt-2">
    <span>{label}</span>
    <button
      className="
        btn btn-link ml-2 p-0
        text-base-content
        hover:text-primary/90
        focus:text-primary/90
        focus:outline-none focus:ring-1 focus:ring-primary/50
      "
      onClick={onClick}
    >
      {children}
    </button>
  </p>
);

export default FormChangeViewButton;
