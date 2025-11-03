import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Order, PaymentStatus, ShippingStatus } from '../types';
import { formatCurrency, formatDate } from '../lib/utils';
import { useLabelContext } from '../context/LabelContext';
import { useOrderContext } from '../context/OrderContext';
import Badge from '../components/ui/Badge';
import Modal from '../components/ui/Modal';

const Orders: React.FC = () => {
  const navigate = useNavigate();
  const { selectedOrderIds, setSelectedOrderIds, addOrderId, removeOrderId, clearOrderIds } = useLabelContext();
  const { orders, setOrders, updateOrder, loading } = useOrderContext();
  const [isAllSelected, setIsAllSelected] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('all');
  const [shippingStatusFilter, setShippingStatusFilter] = useState('all');
  
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);

  const getCustomerName = (order: Order): string => {
    if (order.customer) {
      return order.customer.fullName;
    }
    if (order.customerContact) {
      return order.customerContact.split('\n')[0] || 'N/A';
    }
    return 'N/A';
  }

  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
        const customerName = getCustomerName(order).toLowerCase();
        const query = searchQuery.toLowerCase();
        
        const matchesSearch = searchQuery === '' || order.code.toLowerCase().includes(query) || customerName.includes(query);
        const matchesPayment = paymentStatusFilter === 'all' || order.paymentStatus === paymentStatusFilter;
        const matchesShipping = shippingStatusFilter === 'all' || order.shippingStatus === shippingStatusFilter;

        return matchesSearch && matchesPayment && matchesShipping;
    });
  }, [orders, searchQuery, paymentStatusFilter, shippingStatusFilter]);

  useEffect(() => {
    clearOrderIds();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  useEffect(() => {
    // @ts-ignore
    if (window.lucide) {
      // @ts-ignore
      window.lucide.createIcons();
    }
  });
  
  useEffect(() => {
    if (filteredOrders.length > 0) {
        setIsAllSelected(filteredOrders.every(order => selectedOrderIds.has(order.id)));
    } else {
        setIsAllSelected(false);
    }
  }, [selectedOrderIds, filteredOrders]);

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked;
    const filteredOrderIds = filteredOrders.map(o => o.id);
    if (checked) {
      setSelectedOrderIds(prev => new Set([...prev, ...filteredOrderIds]));
    } else {
      setSelectedOrderIds(prev => {
        const newSet = new Set(prev);
        filteredOrderIds.forEach(id => newSet.delete(id));
        return newSet;
      });
    }
  };

  const handleSelectOne = (e: React.ChangeEvent<HTMLInputElement>, id: string) => {
    if (e.target.checked) {
      addOrderId(id);
    } else {
      removeOrderId(id);
    }
  };
  
  const handleCreateLabels = () => {
    if(selectedOrderIds.size > 0) {
        navigate('/labels');
    } else {
        alert("Please select at least one order.");
    }
  }

  const handleExportCSV = () => {
    const headers = ['code', 'orderType', 'customerName', 'customerContact', 'paymentStatus', 'shippingStatus', 'totalAmount', 'createdAt', 'shipping.carrier', 'shipping.service', 'shipping.tracking', 'remarks'];
    const csvRows = [
        headers.join(','),
        ...orders.map(o => [
            o.code,
            o.orderType || 'online',
            `"${(o.customer?.fullName || (o.customerContact ? o.customerContact.split('\n')[0] : '') || '').replace(/"/g, '""')}"`,
            `"${(o.customerContact || '').replace(/\n/g, ' ').replace(/"/g, '""')}"`,
            o.paymentStatus,
            o.shippingStatus,
            o.totalAmount,
            o.createdAt,
            o.shipping.carrier,
            o.shipping.service,
            o.shipping.tracking || '',
            `"${(o.remarks || '').replace(/"/g, '""')}"`,
        ].join(','))
    ];
    const csvContent = '\ufeff' + csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'orders.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
        try {
            let text = e.target?.result as string;
            if (text.charCodeAt(0) === 0xFEFF) {
                text = text.substring(1);
            }
            
            const lines = text.split(/\r\n|\n/);
            const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));

            const requiredHeaders = ['code', 'shippingStatus', 'shipping.tracking'];
            if (!requiredHeaders.every(h => headers.includes(h))) {
                throw new Error('CSV must contain code, shippingStatus, and shipping.tracking headers for updates.');
            }
            
            const updates = new Map<string, { status: ShippingStatus; tracking: string }>();
            
            lines.slice(1).forEach(line => {
                if (!line.trim()) return;
                const values = line.split(',');
                const entry: { [key: string]: string } = headers.reduce((obj, header, i) => {
                    obj[header] = (values[i] || '').trim().replace(/^"|"$/g, '').replace(/""/g, '"');
                    return obj;
                }, {});

                const code = entry.code;
                const status = entry.shippingStatus as ShippingStatus;
                const tracking = entry['shipping.tracking'];

                if (code && status && Object.values(ShippingStatus).includes(status)) {
                    updates.set(code, { status, tracking });
                }
            });

            const updatePromises: Promise<void>[] = [];
            const updatedOrders = orders.map(order => {
                if (updates.has(order.code)) {
                    const { status, tracking } = updates.get(order.code)!;
                    const newOrder = { 
                        ...order,
                        shippingStatus: status,
                        shipping: {
                            ...order.shipping,
                            tracking: tracking || undefined,
                            trackingUrl: undefined,
                        }
                    };

                    if (tracking && newOrder.shipping.carrier === 'Kerry Express') {
                        newOrder.shipping.trackingUrl = `https://th.kerryexpress.com/th/track/?track=${tracking}`;
                    }
                    updatePromises.push(updateOrder(newOrder));
                    return newOrder;
                }
                return order;
            });
            
            await Promise.all(updatePromises);
            setOrders(updatedOrders);
            alert(`${updates.size} orders updated successfully from CSV!`);

        } catch (error) {
            console.error('Failed to import CSV:', error);
            alert(`Error importing CSV: ${(error as Error).message}`);
        } finally {
            if(event.target) event.target.value = '';
        }
    };
    reader.readAsText(file, 'UTF-8');
  };
  
  const getPaymentStatusColor = (status: PaymentStatus): 'green' | 'yellow' | 'blue' => {
      switch (status) {
          case PaymentStatus.PAID: return 'green';
          case PaymentStatus.PENDING: return 'yellow';
          case PaymentStatus.COD: return 'blue';
      }
  };
  
  const getShippingStatusColor = (status: ShippingStatus): 'green' | 'blue' | 'gray' => {
      switch (status) {
          case ShippingStatus.DELIVERED: return 'green';
          case ShippingStatus.SHIPPED: return 'blue';
          case ShippingStatus.PENDING: return 'gray';
      }
  }

  const handleOpenEditModal = (order: Order) => {
    setEditingOrder({ ...order });
    setIsEditModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setEditingOrder(null);
  };
  
  const handleUpdateOrder = async () => {
    if (editingOrder) {
      await updateOrder(editingOrder);
      handleCloseEditModal();
    }
  };

  const handleEditFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    if (!editingOrder) return;
    const { name, value } = e.target;

    if (name.startsWith('shipping.')) {
        const field = name.split('.')[1];
        const newShipping = {
            ...editingOrder.shipping,
            [field]: value
        };

        if (field === 'tracking' && editingOrder.shipping.carrier === 'Kerry Express') {
            newShipping.trackingUrl = `https://th.kerryexpress.com/th/track/?track=${value}`;
        }

        setEditingOrder({
            ...editingOrder,
            shipping: newShipping
        });
    } else {
        setEditingOrder({
            ...editingOrder,
            [name]: value
        });
    }
  };

  return (
    <>
      <div className="bg-white p-6 rounded-2xl shadow-sm">
        <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
          <h1 className="text-3xl font-bold text-gray-800">Orders</h1>
          <div className="flex items-center space-x-2">
              <input type="file" ref={fileInputRef} onChange={handleFileChange} style={{ display: 'none' }} accept=".csv" />
              <button onClick={handleImportClick} className="flex items-center bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg shadow-sm hover:bg-gray-50 transition-colors text-sm">
                  <i data-lucide="upload" className="w-4 h-4 mr-2"></i>
                  Import CSV
              </button>
              <button onClick={handleExportCSV} className="flex items-center bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg shadow-sm hover:bg-gray-50 transition-colors text-sm">
                  <i data-lucide="download" className="w-4 h-4 mr-2"></i>
                  Export CSV
              </button>
              <button 
                onClick={handleCreateLabels}
                disabled={selectedOrderIds.size === 0}
                className="flex items-center bg-blue-600 text-white px-4 py-2 rounded-lg shadow-sm hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                <i data-lucide="printer" className="w-5 h-5 mr-2"></i>
                Create Label ({selectedOrderIds.size})
              </button>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-4 mb-4">
          <div className="relative flex-grow max-w-sm">
              <i data-lucide="search" className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"></i>
              <input
                  type="text"
                  placeholder="Search by Order Code or Customer..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
          </div>
          <div className="flex items-center gap-2">
              <label htmlFor="paymentStatusFilter" className="text-sm font-medium text-gray-600">Payment:</label>
              <select
                  id="paymentStatusFilter"
                  value={paymentStatusFilter}
                  onChange={e => setPaymentStatusFilter(e.target.value)}
                  className="bg-white border border-gray-300 rounded-lg shadow-sm py-2 pl-3 pr-8 text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                  <option value="all">All</option>
                  {Object.values(PaymentStatus).map(s => <option key={s} value={s}>{s}</option>)}
              </select>
          </div>
          <div className="flex items-center gap-2">
              <label htmlFor="shippingStatusFilter" className="text-sm font-medium text-gray-600">Shipping:</label>
              <select
                  id="shippingStatusFilter"
                  value={shippingStatusFilter}
                  onChange={e => setShippingStatusFilter(e.target.value)}
                  className="bg-white border border-gray-300 rounded-lg shadow-sm py-2 pl-3 pr-8 text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                  <option value="all">All</option>
                  {Object.values(ShippingStatus).map(s => <option key={s} value={s}>{s}</option>)}
              </select>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="p-3 w-12 text-center">
                  <input type="checkbox" checked={isAllSelected} onChange={handleSelectAll} className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" aria-label="Select all orders" />
                </th>
                <th className="p-3 text-sm font-semibold text-gray-500">Order Code</th>
                <th className="p-3 text-sm font-semibold text-gray-500">Customer</th>
                <th className="p-3 text-sm font-semibold text-gray-500">Payment</th>
                <th className="p-3 text-sm font-semibold text-gray-500">Shipping</th>
                <th className="p-3 text-sm font-semibold text-gray-500">Total</th>
                <th className="p-3 text-sm font-semibold text-gray-500">Date</th>
                <th className="p-3 text-sm font-semibold text-gray-500 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                    <td colSpan={8} className="text-center p-6 text-gray-500">Loading orders...</td>
                </tr>
              ) : filteredOrders.map((order) => (
                <tr key={order.id} className="border-b hover:bg-gray-50">
                  <td className="p-3 text-center">
                    <input
                      type="checkbox"
                      checked={selectedOrderIds.has(order.id)}
                      onChange={(e) => handleSelectOne(e, order.id)}
                      className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      aria-label={`Select order ${order.code}`}
                    />
                  </td>
                  <td className="p-3 font-medium text-gray-800">{order.code}</td>
                  <td className="p-3 text-gray-600">{getCustomerName(order)}</td>
                  <td className="p-3"><Badge color={getPaymentStatusColor(order.paymentStatus)}>{order.paymentStatus}</Badge></td>
                  <td className="p-3"><Badge color={getShippingStatusColor(order.shippingStatus)}>{order.shippingStatus}</Badge></td>
                  <td className="p-3 text-gray-600">{formatCurrency(order.totalAmount)}</td>
                  <td className="p-3 text-gray-600 text-sm">{formatDate(order.createdAt)}</td>
                  <td className="p-3 text-center">
                    <button 
                      onClick={() => handleOpenEditModal(order)}
                      className="text-blue-600 hover:text-blue-800 font-medium text-sm"
                      aria-label={`Edit order ${order.code}`}
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      {editingOrder && (
        <Modal isOpen={isEditModalOpen} onClose={handleCloseEditModal} title={`Edit Order: ${editingOrder.code}`}>
          <div className="space-y-4">
            {editingOrder.orderType === 'pos' && (
              <div>
                <label htmlFor="customerContact" className="block text-sm font-medium text-gray-700 mb-1">Customer Contact</label>
                <textarea 
                  id="customerContact" 
                  name="customerContact"
                  rows={4}
                  value={editingOrder.customerContact || ''}
                  onChange={handleEditFormChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            )}
            <div>
              <label htmlFor="paymentStatus" className="block text-sm font-medium text-gray-700 mb-1">Payment Status</label>
              <select id="paymentStatus" name="paymentStatus" value={editingOrder.paymentStatus} onChange={handleEditFormChange} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white">
                {Object.values(PaymentStatus).map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="shippingStatus" className="block text-sm font-medium text-gray-700 mb-1">Shipping Status</label>
              <select id="shippingStatus" name="shippingStatus" value={editingOrder.shippingStatus} onChange={handleEditFormChange} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white">
                {Object.values(ShippingStatus).map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="shipping.tracking" className="block text-sm font-medium text-gray-700 mb-1">Tracking Number</label>
              <input 
                type="text" 
                id="shipping.tracking" 
                name="shipping.tracking"
                value={editingOrder.shipping.tracking || ''}
                onChange={handleEditFormChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          <div className="flex justify-end space-x-3 mt-6">
            <button type="button" onClick={handleCloseEditModal} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">
              Cancel
            </button>
            <button type="button" onClick={handleUpdateOrder} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              Save Changes
            </button>
          </div>
        </Modal>
      )}
    </>
  );
};

export default Orders;