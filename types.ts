
export interface Customer {
  id: string;
  fullName: string;
  phone: string;
  email?: string;
  addressLine1: string;
  addressLine2?: string;
  district: string;
  province: string;
  postcode: string;
}

export interface OrderItem {
  sku: string;
  name: string;
  qty: number;
  price: number;
}

export enum PaymentStatus {
  PAID = "Paid",
  PENDING = "Pending",
  COD = "COD",
}

export enum ShippingStatus {
  PENDING = "Pending",
  SHIPPED = "Shipped",
  DELIVERED = "Delivered",
}

export interface Order {
  id: string;
  code: string;
  customerId?: string;
  customer?: Customer;
  customerContact?: string;
  orderType?: 'online' | 'pos';
  items: OrderItem[];
  totalAmount: number;
  codAmount?: number;
  channel: string;
  createdAt: string;
  deliveryDate?: string;
  paymentStatus: PaymentStatus;
  shippingStatus: ShippingStatus;
  shipping: {
    carrier: string;
    service: string;
    tracking?: string;
    trackingUrl?: string;
  };
  remarks?: string;
}

export interface LabelPayload {
  orderCode: string;
  recipientName: string;
  phone: string;
  fullAddress: string;
  postcode: string;
  carrier: string;
  service: string;
  tracking?: string;
  trackingUrl?: string;
  codAmount?: number;
  itemsSummary: string;
  shopLogoUrl: string;
  shopName: string;
  shopPhone: string;
  shopAddress?: string;
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  imageUrl: string;
  price: number;
  stock: {
    available: number;
    reserved: number;
  };
}