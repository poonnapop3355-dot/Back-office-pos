
import React, { useState, useMemo, useEffect } from 'react';
import { useLabelContext } from '../context/LabelContext';
import { useOrderContext } from '../context/OrderContext';
import { LabelPayload, Order } from '../types';
import LabelSheet from '../components/labels/LabelSheet';
import { formatFullAddress, truncateText } from '../lib/utils';
import { Link, Navigate } from 'react-router-dom';

const LabelPrinter: React.FC = () => {
  const { selectedOrderIds } = useLabelContext();
  const { orders } = useOrderContext();
  const [layout, setLayout] = useState<'6-per-sheet' | '8-per-sheet'>('6-per-sheet');
  const [zoom, setZoom] = useState(0.75);
  
  useEffect(() => {
    // @ts-ignore
    if (window.lucide) {
      // @ts-ignore
      window.lucide.createIcons();
    }
  });

  const selectedOrders = useMemo(() => {
    return orders.filter(order => selectedOrderIds.has(order.id));
  }, [selectedOrderIds, orders]);

  const getLabelInfo = (order: Order): Pick<LabelPayload, 'recipientName' | 'phone' | 'fullAddress' | 'postcode'> => {
    if (order.customer) {
        return {
            recipientName: order.customer.fullName,
            phone: order.customer.phone,
            fullAddress: formatFullAddress(order.customer),
            postcode: order.customer.postcode
        }
    }
    if (order.customerContact) {
        const lines = order.customerContact.split('\n');
        const name = lines[0] || '';
        const phone = lines.find(l => l.match(/^[0-9-]{10,12}$/)) || '';
        const postcode = lines[lines.length - 1].match(/\d{5}/) ? lines[lines.length - 1] : '';
        const address = lines.slice(1, lines.length -1).filter(l => l !== phone).join('\n');
        return { recipientName: name, phone, fullAddress: address, postcode };
    }
    return { recipientName: 'N/A', phone: 'N/A', fullAddress: 'N/A', postcode: 'N/A' };
  }

  const labelData: LabelPayload[] = useMemo(() => {
    return selectedOrders.map((order: Order): LabelPayload => {
      const { recipientName, phone, fullAddress, postcode } = getLabelInfo(order);
      return {
        orderCode: order.code,
        recipientName,
        phone,
        fullAddress,
        postcode,
        carrier: order.shipping.carrier,
        service: order.shipping.service,
        tracking: order.shipping.tracking,
        trackingUrl: order.shipping.trackingUrl,
        codAmount: order.codAmount,
        itemsSummary: truncateText(order.items.map(item => `${item.name} (x${item.qty})`).join(', '), 60),
        shopLogoUrl: '', // No longer used
        shopName: 'ผู้ส่ง: หลิวเหล่าซือ',
        shopAddress: '145 ถ.ปฏิพัฒน์ ถ.ตลาดเหนือ อ.เมือง จ.ภูเก็ต 83000',
        shopPhone: 'โทร: 0647545296'
      }
    });
  }, [selectedOrders]);

  if (selectedOrderIds.size === 0) {
      return (
        <div className="text-center p-10 bg-white rounded-2xl shadow-sm">
            <h2 className="text-2xl font-bold text-gray-700">No Orders Selected</h2>
            <p className="text-gray-500 mt-2">Please select some orders to print labels for.</p>
            <Link to="/orders" className="mt-6 inline-block bg-blue-600 text-white px-6 py-2 rounded-lg shadow-sm hover:bg-blue-700 transition-colors">
                Go to Orders
            </Link>
        </div>
      );
  }

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="flex flex-col h-full">
        {/* Header and Controls */}
        <div className="no-print bg-white p-4 rounded-t-2xl shadow-sm border-b sticky top-0 z-10">
            <div className="flex flex-wrap justify-between items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800">Print Shipping Labels</h1>
                    <p className="text-gray-500">{selectedOrders.length} labels selected</p>
                </div>
                <div className="flex items-center space-x-4">
                    {/* Layout Selector */}
                    <div className="flex items-center space-x-2">
                        <span className="font-medium text-gray-600">Layout:</span>
                        <button onClick={() => setLayout('6-per-sheet')} className={`px-3 py-1 rounded-md text-sm ${layout === '6-per-sheet' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>6 per Sheet</button>
                        <button onClick={() => setLayout('8-per-sheet')} className={`px-3 py-1 rounded-md text-sm ${layout === '8-per-sheet' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>8 per Sheet</button>
                    </div>
                     {/* Zoom Control */}
                    <div className="flex items-center space-x-2">
                        <span className="font-medium text-gray-600">Zoom:</span>
                         <i data-lucide="zoom-out" className="w-5 h-5 text-gray-500 cursor-pointer" onClick={() => setZoom(z => Math.max(0.5, z-0.25))}></i>
                         <span className="w-12 text-center text-sm font-semibold text-gray-700">{(zoom*100).toFixed(0)}%</span>
                         <i data-lucide="zoom-in" className="w-5 h-5 text-gray-500 cursor-pointer" onClick={() => setZoom(z => Math.min(1.5, z+0.25))}></i>
                    </div>
                    {/* Action Buttons */}
                    <div className="flex items-center space-x-2">
                        <button 
                            className="bg-gray-500 text-white px-4 py-2 rounded-lg shadow-sm hover:bg-gray-600 transition-colors disabled:opacity-50"
                            disabled
                        >
                            Download PDF
                        </button>
                        <button onClick={handlePrint} className="flex items-center bg-green-600 text-white px-4 py-2 rounded-lg shadow-sm hover:bg-green-700 transition-colors">
                             <i data-lucide="printer" className="w-5 h-5 mr-2"></i>
                            Print Now
                        </button>
                    </div>
                </div>
            </div>
        </div>
        {/* Preview Area */}
        <div className="flex-grow overflow-auto p-8 bg-gray-200">
             <div style={{ transform: `scale(${zoom})`, transformOrigin: 'top center' }} className="transition-transform duration-300">
                <LabelSheet labels={labelData} layout={layout} />
             </div>
        </div>
    </div>
  );
};

export default LabelPrinter;