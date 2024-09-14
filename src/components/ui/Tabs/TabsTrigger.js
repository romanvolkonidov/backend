// src/components/ui/TabsTrigger.js

import React from 'react';

const TabsTrigger = ({ value, children }) => {
  return (
    <button className={`tabs-trigger ${value}`}>
      {children}
    </button>
  );
};

export default TabsTrigger;