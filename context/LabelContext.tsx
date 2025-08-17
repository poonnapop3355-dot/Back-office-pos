
import React, { createContext, useState, useContext, ReactNode } from 'react';

interface LabelContextType {
  selectedOrderIds: Set<string>;
  setSelectedOrderIds: React.Dispatch<React.SetStateAction<Set<string>>>;
  addOrderId: (id: string) => void;
  removeOrderId: (id: string) => void;
  clearOrderIds: () => void;
}

const LabelContext = createContext<LabelContextType | undefined>(undefined);

export const LabelProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [selectedOrderIds, setSelectedOrderIds] = useState<Set<string>>(new Set());

  const addOrderId = (id: string) => {
    setSelectedOrderIds(prev => new Set(prev).add(id));
  };

  const removeOrderId = (id: string) => {
    setSelectedOrderIds(prev => {
      const newSet = new Set(prev);
      newSet.delete(id);
      return newSet;
    });
  };
  
  const clearOrderIds = () => {
      setSelectedOrderIds(new Set());
  }

  return (
    <LabelContext.Provider value={{ selectedOrderIds, setSelectedOrderIds, addOrderId, removeOrderId, clearOrderIds }}>
      {children}
    </LabelContext.Provider>
  );
};

export const useLabelContext = (): LabelContextType => {
  const context = useContext(LabelContext);
  if (context === undefined) {
    throw new Error('useLabelContext must be used within a LabelProvider');
  }
  return context;
};
