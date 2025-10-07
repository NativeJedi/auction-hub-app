'use client';

import { useState } from 'react';

type Option = {
  value: string | number;
  label: string;
};

interface DropdownProps {
  id: string;
  label: string;
  options: Option[];
  value: Option['value'];
  onChange: (value: Option['value']) => void;
}

export function Dropdown({ id, value, label, options, onChange }: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleSelect = (option: Option) => {
    onChange(option.value);
    setIsOpen(false);
  };

  const selected = options.find((option) => option.value === value) || options[0];

  return (
    <div className="form-control w-full relative">
      <label className="label cursor-pointer" htmlFor={id}>
        <span className="label-text">{label}</span>
      </label>

      <button
        id={id}
        type="button"
        className="cursor-pointer input input-bordered w-full text-left focus:outline-none focus:ring-1 focus:ring-primary focus:ring-offset-1 transition-colors duration-200 flex justify-between items-center"
        onClick={() => setIsOpen(!isOpen)}
      >
        {selected.label}
        <span className="ml-2">▾</span>
      </button>

      {isOpen && (
        <ul className="absolute z-100 mt-1 w-full bg-base-100 border border-base-content/20 rounded-md shadow-lg max-h-60 overflow-auto">
          {options.map((option) => (
            <li key={option.value}>
              <button
                className="w-full text-left px-3 py-2 hover:bg-primary/10"
                onClick={() => handleSelect(option)}
              >
                {option.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
