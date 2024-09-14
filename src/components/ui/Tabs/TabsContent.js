// src/components/ui/TabsContent.js

import React from 'react';

const TabsContent = ({ value, children }) => {
  return (
    <div className={`tabs-content ${value}`}>
      {children}
    </div>
  );
};

export default TabsContent;