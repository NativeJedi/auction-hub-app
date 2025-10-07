'use client';

type Props = {
  id: string;
  label: string;
  value: number;
  onChange: (value: number) => void;
  placeholder?: string;
  min?: number;
  max?: number;
  step?: number;
};

function NumberField({
  id,
  label,
  value,
  onChange,
  placeholder = '',
  min = 0,
  max = Number.MAX_SAFE_INTEGER,
  step = 500,
}: Props) {
  const handleChange = (val: number) => {
    let newVal = val;
    if (newVal < min) newVal = min;
    if (newVal > max) newVal = max;

    onChange(newVal);
  };

  return (
    <div className="form-control w-full">
      <label className="label" htmlFor={id}>
        <span className="label-text">{label}</span>
      </label>
      <input
        id={id}
        type="number"
        placeholder={placeholder}
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={(e) => handleChange(Number(e.target.value))}
        className="input input-bordered w-full focus:outline-none focus:ring-1 focus:ring-primary focus:ring-offset-1 transition-colors duration-200"
      />
    </div>
  );
}

export default NumberField;
