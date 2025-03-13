import React from 'react';

const InputField = ({ id, label, type, value, onChange, required = false }) => {
  return (
    <div className="mb-4">
      <label htmlFor={id} className="block text-sm font-medium text-gray-700">{label}</label>
      <input
        type={type}
        id={id}
        className="mt-1 p-2 w-full border rounded-lg"
        value={value}
        onChange={onChange}
        required={required}
      />
    </div>
  );
};

export default InputField;