import React from 'react';

export const Select = ({ value, onValueChange, children }) => (
  <select
    value={value}
    onChange={(e) => onValueChange(e.target.value)}
    className="border p-2 rounded"
  >
    {children}
  </select>
);

export const SelectContent = ({ children }) => (
  <>{children}</>
);

export const SelectItem = ({ value, children }) => (
  <option value={value}>
    {children}
  </option>
);

export const SelectTrigger = ({ children, className }) => (
  <div className={className}>
    {children}
  </div>
);

export const SelectValue = ({ placeholder }) => (
  <span>{placeholder}</span>
);