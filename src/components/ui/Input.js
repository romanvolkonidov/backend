// src/components/ui/Input.js

import React from 'react';

const Input = (props) => {
  return (
    <input
      className="border rounded py-2 px-3 text-gray-700"
      {...props}
    />
  );
};

export default Input;