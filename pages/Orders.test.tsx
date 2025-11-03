import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react';
import Orders from '../pages/Orders';
import { OrderProvider } from '../context/OrderContext';
import { LabelProvider } from '../context/LabelContext';
import { CustomerProvider } from '../context/CustomerContext';
import { ProductProvider } from '../context/ProductContext';
import { Order, ShippingStatus, PaymentStatus } from '../types';
import { MemoryRouter } from 'react-router-dom';

jest.mock('../lib/firebase');

const mockOrders: Order[] = [
  {
    id: '1',
    code: 'ORD-001',
    shipping: {
      carrier: 'Kerry Express',
      service: 'Standard',
      tracking: 'KET12345',
      trackingUrl: 'https://th.kerryexpress.com/th/track/?track=KET12345',
    },
    shippingStatus: ShippingStatus.SHIPPED,
    paymentStatus: PaymentStatus.PAID,
    totalAmount: 100,
    createdAt: '2023-01-01T00:00:00.000Z',
  },
];

const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <MemoryRouter>
      <LabelProvider>
        <OrderProvider>
          <CustomerProvider>
            <ProductProvider>
              {component}
            </ProductProvider>
          </CustomerProvider>
        </OrderProvider>
      </LabelProvider>
    </MemoryRouter>
  );
};

describe('Orders Page', () => {
  test('should update trackingUrl when tracking number is edited for Kerry Express', async () => {
    // Mock the orders context to provide our test data
    const updateOrder = jest.fn();
    jest.spyOn(require('../context/OrderContext'), 'useOrderContext').mockReturnValue({
        orders: mockOrders,
        setOrders: jest.fn(),
        updateOrder,
        loading: false,
    });

    renderWithProviders(<Orders />);

    // Open the edit modal
    fireEvent.click(screen.getByText('Edit'));

    // Change the tracking number
    const trackingInput = screen.getByLabelText('Tracking Number');
    fireEvent.change(trackingInput, { target: { value: 'KET54321' } });

    // Save changes
    fireEvent.click(screen.getByText('Save Changes'));

    // Check if the updateOrder function was called with the correct trackingUrl
    const updatedOrder = updateOrder.mock.calls[0][0];
    expect(updatedOrder.shipping.trackingUrl).toBe('https://th.kerryexpress.com/th/track/?track=KET54321');
  });
});
