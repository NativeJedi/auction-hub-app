'use client';

const TextField = ({
  label,
  placeholder,
  id,
  type = 'text',
  value,
  onChange,
}: {
  value?: string;
  label: string;
  placeholder: string;
  id: string;
  type?: string;
  onChange: (value: string) => void;
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => onChange(e.target.value);

  return (
    <div className="form-control w-full">
      <label className="label">
        <span className="label-text">{label}</span>
      </label>
      <input
        id={id}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={handleChange}
        className="input input-bordered w-full focus:outline-none focus:ring-1 focus:ring-primary focus:ring-offset-1 transition-colors duration-200"
      />
    </div>
  );
};

export default TextField;
