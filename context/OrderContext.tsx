import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { Order, Customer } from '../types';
import { orders as initialOrders } from '../data/mockData';
import { db } from '../lib/firebase';
import { cleanForFirestore } from '../lib/utils';

interface OrderContextType {
  orders: Order[];
  loading: boolean;
  setOrders: React.Dispatch<React.SetStateAction<Order[]>>;
  addOrder: (order: Order) => Promise<void>;
  updateOrder: (updatedOrder: Order) => Promise<void>;
}

const OrderContext = createContext<OrderContextType | undefined>(undefined);

export const OrderProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        // Fetch all customers first to map them to orders
        const customersCollectionRef = db.collection('customers');
        const customerSnapshot = await customersCollectionRef.get();
        const customersMap: Map<string, Customer> = new Map(customerSnapshot.docs.map(doc => [doc.id, doc.data() as Customer]));
        
        // Fetch orders, ordered by creation date
        const ordersCollectionRef = db.collection('orders');
        const q = ordersCollectionRef.orderBy('createdAt', 'desc');
        const orderSnapshot = await q.get();

        if (orderSnapshot.empty) {
          console.log("No orders found in Firestore, seeding from mock data...");
          const batch = db.batch();
          for (const order of initialOrders) {
            const docRef = db.collection('orders').doc(order.id);
            const orderForFirestore = { ...order };
            // @ts-ignore
            delete orderForFirestore.customer; // Remove nested object before storing
            batch.set(docRef, cleanForFirestore(orderForFirestore));
          }
          await batch.commit();
          
          // Enrich orders with customer data for the UI
          const ordersWithCustomers = initialOrders.map(o => ({
            ...o,
            customer: o.customerId ? customersMap.get(o.customerId) : undefined,
          })).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

          setOrders(ordersWithCustomers);

        } else {
          const ordersList = orderSnapshot.docs.map(doc => {
            const orderData = doc.data() as Order;
            return {
              ...orderData,
              customer: orderData.customerId ? customersMap.get(orderData.customerId) : undefined
            };
          });
          setOrders(ordersList);
        }
      } catch (error) {
        console.error("Error fetching orders from Firestore:", error);
        // Fallback to mock data on error
        setOrders(initialOrders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  const addOrder = async (order: Order) => {
    const orderForFirestore = { ...order };
    // @ts-ignore
    delete orderForFirestore.customer; // Do not store nested customer data
    
    const orderRef = db.collection('orders').doc(order.id);
    await orderRef.set(cleanForFirestore(orderForFirestore));
    setOrders(prevOrders => [order, ...prevOrders].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
  };

  const updateOrder = async (updatedOrder: Order) => {
    const orderRef = db.collection('orders').doc(updatedOrder.id);
    const orderForFirestore = { ...updatedOrder };
    // @ts-ignore
    delete orderForFirestore.customer; // Do not store nested customer data

    await orderRef.update(cleanForFirestore(orderForFirestore));
    setOrders(prevOrders => 
      prevOrders.map(order => 
        order.id === updatedOrder.id ? updatedOrder : order
      )
    );
  };

  return (
    <OrderContext.Provider value={{ orders, loading, setOrders, addOrder, updateOrder }}>
      {children}
    </OrderContext.Provider>
  );
};

export const useOrderContext = (): OrderContextType => {
  const context = useContext(OrderContext);
  if (context === undefined) {
    throw new Error('useOrderContext must be used within a OrderProvider');
  }
  return context;
};