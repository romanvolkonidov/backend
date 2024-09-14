// src/components/ui/Checkbox.js

import React from 'react';

const Checkbox = (props) => {
  return (
    <input
      type="checkbox"
      className="form-checkbox h-5 w-5 text-blue-600"
      {...props}
    />
  );
};

export default Checkbox;