import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/layout/Layout';
import Dashboard from './pages/Dashboard';
import Orders from './pages/Orders';
import LabelPrinter from './pages/LabelPrinter';
import Inventory from './pages/Inventory';
import Customers from './pages/Customers';
import POS from './pages/POS';
import { LabelProvider } from './context/LabelContext';
import { OrderProvider } from './context/OrderContext';
import { CustomerProvider } from './context/CustomerContext';
import { ProductProvider } from './context/ProductContext';

export default function App(): React.ReactNode {
  return (
    <LabelProvider>
      <OrderProvider>
        <CustomerProvider>
          <ProductProvider>
            <HashRouter>
              <Layout>
                <Routes>
                  <Route path="/" element={<Navigate to="/dashboard" replace />} />
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/orders" element={<Orders />} />
                  <Route path="/customers" element={<Customers />} />
                  <Route path="/inventory" element={<Inventory />} />
                  <Route path="/labels" element={<LabelPrinter />} />
                  <Route path="/pos" element={<POS />} />
                  <Route path="*" element={<Navigate to="/dashboard" replace />} />
                </Routes>
              </Layout>
            </HashRouter>
          </ProductProvider>
        </CustomerProvider>
      </OrderProvider>
    </LabelProvider>
  );
}