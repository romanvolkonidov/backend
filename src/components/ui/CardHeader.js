// src/components/ui/CardHeader.js

import React from 'react';

const CardHeader = ({ children }) => {
  return (
    <div className="p-4 border-b">
      {children}
    </div>
  );
};

export default CardHeader;