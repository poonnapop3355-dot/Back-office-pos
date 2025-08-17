import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { Customer } from '../types';
import { customers as initialCustomers } from '../data/mockData';
import { db } from '../lib/firebase';
import { cleanForFirestore } from '../lib/utils';

interface CustomerContextType {
  customers: Customer[];
  loading: boolean;
  setCustomers: React.Dispatch<React.SetStateAction<Customer[]>>;
  addCustomer: (customer: Customer) => Promise<void>;
  updateCustomer: (updatedCustomer: Customer) => Promise<void>;
}

const CustomerContext = createContext<CustomerContextType | undefined>(undefined);

export const CustomerProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const customersCollectionRef = db.collection('customers');
        const customerSnapshot = await customersCollectionRef.get();
        if (customerSnapshot.empty) {
          console.log("No customers found in Firestore, seeding from mock data...");
          const batch = db.batch();
          for (const customer of initialCustomers) {
            const docRef = db.collection('customers').doc(customer.id);
            batch.set(docRef, cleanForFirestore(customer));
          }
          await batch.commit();
          setCustomers(initialCustomers);
        } else {
          const customersList = customerSnapshot.docs.map(doc => doc.data() as Customer);
          setCustomers(customersList);
        }
      } catch (error) {
        console.error("Error fetching customers from Firestore:", error);
        setCustomers(initialCustomers);
      } finally {
        setLoading(false);
      }
    };
    fetchCustomers();
  }, []);

  const addCustomer = async (customer: Customer) => {
    const phoneExists = customer.phone && customers.some(c => c.phone === customer.phone);
    const nameExists = !customer.phone && customer.fullName && customers.some(c => c.fullName === customer.fullName);

    if (phoneExists || nameExists) {
      return; 
    }
    
    const customerRef = db.collection('customers').doc(customer.id);
    await customerRef.set(cleanForFirestore(customer));
    setCustomers(prevCustomers => [customer, ...prevCustomers]);
  };

  const updateCustomer = async (updatedCustomer: Customer) => {
    const customerRef = db.collection('customers').doc(updatedCustomer.id);
    await customerRef.update(cleanForFirestore({ ...updatedCustomer }));
    setCustomers(prevCustomers => 
      prevCustomers.map(customer => 
        customer.id === updatedCustomer.id ? updatedCustomer : customer
      )
    );
  };

  return (
    <CustomerContext.Provider value={{ customers, loading, setCustomers, addCustomer, updateCustomer }}>
      {children}
    </CustomerContext.Provider>
  );
};

export const useCustomerContext = (): CustomerContextType => {
  const context = useContext(CustomerContext);
  if (context === undefined) {
    throw new Error('useCustomerContext must be used within a CustomerProvider');
  }
  return context;
};