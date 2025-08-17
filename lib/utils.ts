
import { Customer } from '../types';

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('th-TH', {
    style: 'currency',
    currency: 'THB',
    minimumFractionDigits: 2,
  }).format(amount);
};

export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('th-TH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const formatFullAddress = (customer: Customer): string => {
  let address = customer.addressLine1;
  if (customer.addressLine2) {
    address += ` ${customer.addressLine2}`;
  }
  address += `\nอ.${customer.district} จ.${customer.province}`;
  return address;
};

export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) {
    return text;
  }
  return text.slice(0, maxLength) + '…';
};

// Helper to remove undefined values from nested objects, which Firestore doesn't support.
export const cleanForFirestore = (data: object): object => {
    if (!data) return data;
    return JSON.parse(JSON.stringify(data));
};
