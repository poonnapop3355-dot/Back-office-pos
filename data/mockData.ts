
import { Customer, Order, PaymentStatus, ShippingStatus, Product } from '../types';

export const customers: Customer[] = [
  { id: 'C001', fullName: 'สมชาย ใจดี', phone: '081-234-5678', email: 'somchai.j@example.com', addressLine1: '123/45 หมู่ 6 ซอยพัฒนา', district: 'เมือง', province: 'กรุงเทพมหานคร', postcode: '10200' },
  { id: 'C002', fullName: 'มานี รักเรียน', phone: '082-345-6789', email: 'manee.r@example.com', addressLine1: '99/1 ถนนสุขุมวิท', addressLine2: 'อาคาร B ชั้น 10', district: 'คลองเตย', province: 'กรุงเทพมหานคร', postcode: '10110' },
  { id: 'C003', fullName: 'สมศรี มีสุข', phone: '093-456-7890', email: 'somsri.m@example.com', addressLine1: '55 หมู่บ้านรุ่งเรือง', district: 'สันทราย', province: 'เชียงใหม่', postcode: '50210' },
  { id: 'C004', fullName: 'วิชัย เก่งกาจ', phone: '085-678-9012', email: 'wichai.k@example.com', addressLine1: '456 ถนนมิตรภาพ', district: 'เมือง', province: 'ขอนแก่น', postcode: '40000' },
  { id: 'C005', fullName: 'อรุณี ศรีสวัสดิ์', phone: '061-789-0123', email: 'arunee.s@example.com', addressLine1: '789/10 หมู่ 3', district: 'หาดใหญ่', province: 'สงขลา', postcode: '90110' },
];

export const orders: Order[] = Array.from({ length: 14 }, (_, i) => {
    const customer = customers[i % customers.length];
    const isCod = i % 3 === 0;
    const totalAmount = 550 + i * 25;
    return {
        id: `ORD00${i + 1}`,
        code: `PO202407${String(i + 1).padStart(4, '0')}`,
        orderType: 'online',
        customerId: customer.id,
        customer,
        items: [
            { sku: 'BK-001', name: 'React สำหรับผู้เริ่มต้น', qty: 1, price: 350 },
            { sku: 'BK-002', name: 'Tailwind CSS ฉบับสมบูรณ์', qty: 1, price: 200 + i*25 },
        ],
        totalAmount,
        codAmount: isCod ? totalAmount : undefined,
        channel: i % 2 === 0 ? 'Website' : 'Shopee',
        createdAt: new Date(Date.now() - i * 3600000).toISOString(),
        paymentStatus: isCod ? PaymentStatus.COD : PaymentStatus.PAID,
        shippingStatus: i % 4 === 0 ? ShippingStatus.PENDING : ( i % 4 === 1 ? ShippingStatus.SHIPPED : ShippingStatus.DELIVERED),
        shipping: {
            carrier: 'Kerry Express',
            service: 'Next Day',
            tracking: i % 4 !== 0 ? `KER${Date.now() + i}`.slice(0,15) : undefined,
            trackingUrl: i % 4 !== 0 ? `https://th.kerryexpress.com/th/track/?track=KER${Date.now() + i}`.slice(0,50) : undefined,
        },
    };
});

export const products: Product[] = [
  {
    id: 'P001',
    sku: 'BK-001',
    name: 'React สำหรับผู้เริ่มต้น',
    imageUrl: 'https://picsum.photos/seed/reactbook/200',
    price: 350,
    stock: {
      available: 58,
      reserved: 12,
    },
  },
  {
    id: 'P002',
    sku: 'BK-002',
    name: 'Tailwind CSS ฉบับสมบูรณ์',
    imageUrl: 'https://picsum.photos/seed/tailwindbook/200',
    price: 220,
    stock: {
      available: 34,
      reserved: 5,
    },
  },
  {
    id: 'P003',
    sku: 'BK-003',
    name: 'TypeScript Deep Dive',
    imageUrl: 'https://picsum.photos/seed/tsbook/200',
    price: 450,
    stock: {
      available: 8,
      reserved: 2,
    },
  },
  {
    id: 'P004',
    sku: 'BK-004',
    name: 'Node.js Design Patterns',
    imageUrl: 'https://picsum.photos/seed/nodebook/200',
    price: 400,
    stock: {
      available: 15,
      reserved: 7,
    },
  },
  {
    id: 'P005',
    sku: 'BK-005',
    name: 'The Pragmatic Programmer',
    imageUrl: 'https://picsum.photos/seed/pragprog/200',
    price: 500,
    stock: {
      available: 0,
      reserved: 3,
    },
  },
];
