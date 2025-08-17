import React, { useState, useEffect, useRef } from 'react';
import { Product } from '../types';
import Badge from '../components/ui/Badge';
import Modal from '../components/ui/Modal';
import { useProductContext } from '../context/ProductContext';

const Inventory: React.FC = () => {
  const { products, loading, updateProduct, addProduct, updateStock } = useProductContext();
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [adjustment, setAdjustment] = useState<number>(0);
  const [reason, setReason] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  useEffect(() => {
    // @ts-ignore
    if (window.lucide) {
        // @ts-ignore
        window.lucide.createIcons();
    }
  });

  const handleOpenAdjustModal = (product: Product) => {
    setSelectedProduct(product);
    setAdjustment(0);
    setReason('');
    setIsAdjustModalOpen(true);
  };
  
  const handleOpenEditModal = (product: Product) => {
    setEditingProduct({ ...product });
    setIsEditModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsAdjustModalOpen(false);
    setIsEditModalOpen(false);
    setSelectedProduct(null);
    setEditingProduct(null);
  };

  const handleStockAdjust = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;

    await updateStock(selectedProduct.id, adjustment);
    
    console.log(`Adjusted stock for ${selectedProduct.sku} by ${adjustment}. Reason: ${reason}`);
    handleCloseModal();
  };

  const handleProductUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    await updateProduct(editingProduct);
    handleCloseModal();
  };
  
  const handleExportCSV = () => {
    const headers = ['id', 'sku', 'name', 'imageUrl', 'price', 'available', 'reserved'];
    const csvRows = [
        headers.join(','),
        ...products.map(p => [
            p.id,
            p.sku,
            `"${p.name.replace(/"/g, '""')}"`,
            p.imageUrl,
            p.price,
            p.stock.available,
            p.stock.reserved
        ].join(','))
    ];
    const csvContent = '\ufeff' + csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', 'products.csv');
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
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

            const requiredHeaders = ['sku', 'name', 'price', 'available', 'reserved'];
            if (!requiredHeaders.every(h => headers.includes(h))) {
                throw new Error('CSV must contain sku, name, price, available, and reserved headers.');
            }

            const existingProductsMap = new Map(products.map(p => [p.sku, p]));
            const updatePromises: Promise<void>[] = [];

            lines.slice(1).forEach(line => {
                if (!line.trim()) return;
                
                const values = line.split(',');
                const entry: { [key: string]: string } = headers.reduce((obj, header, i) => {
                    obj[header] = (values[i] || '').trim().replace(/^"|"$/g, '').replace(/""/g, '"');
                    return obj;
                }, {});
                
                const { sku, name, imageUrl, available, reserved, price } = entry;
                if (!sku) return;

                const availableNum = parseInt(available, 10);
                const reservedNum = parseInt(reserved, 10) || 0;
                const priceNum = parseFloat(price);

                if (isNaN(availableNum) || isNaN(priceNum)) {
                    console.warn(`Skipping SKU ${sku} due to invalid stock or price numbers.`);
                    return;
                }

                const existingProduct = existingProductsMap.get(sku);
                if (existingProduct) {
                    const updated = {
                        ...existingProduct,
                        name: name || existingProduct.name,
                        imageUrl: imageUrl || existingProduct.imageUrl,
                        price: priceNum,
                        stock: { available: availableNum, reserved: reservedNum },
                    };
                    updatePromises.push(updateProduct(updated));
                } else {
                     const newProduct = {
                        id: `P${Date.now()}${Math.random().toString(36).substr(2, 5)}`,
                        sku,
                        name: name || 'New Product',
                        imageUrl: imageUrl || 'https://picsum.photos/seed/newbook/200',
                        price: priceNum,
                        stock: { available: availableNum, reserved: reservedNum }
                    };
                    updatePromises.push(addProduct(newProduct));
                }
            });

            await Promise.all(updatePromises);
            alert('Products imported successfully!');
        } catch (error) {
            console.error('Failed to import CSV:', error);
            alert(`Error importing CSV: ${(error as Error).message}`);
        } finally {
            if(event.target) event.target.value = '';
        }
    };
    reader.readAsText(file, 'UTF-8');
  };


  const StockStatusBadge: React.FC<{ available: number }> = ({ available }) => {
    if (available <= 0) {
      return <Badge color="gray">Out of Stock</Badge>;
    }
    if (available <= 10) {
      return <Badge color="yellow">Low Stock</Badge>;
    }
    return <Badge color="green">In Stock</Badge>;
  };

  return (
    <>
      <div className="bg-white p-6 rounded-2xl shadow-sm">
        <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
            <h1 className="text-3xl font-bold text-gray-800">Inventory Management</h1>
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
            </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="p-3 text-sm font-semibold text-gray-500">Product</th>
                <th className="p-3 text-sm font-semibold text-gray-500">SKU</th>
                <th className="p-3 text-sm font-semibold text-gray-500 text-center">Available</th>
                <th className="p-3 text-sm font-semibold text-gray-500 text-center">Reserved</th>
                <th className="p-3 text-sm font-semibold text-gray-500 text-center">Total</th>
                <th className="p-3 text-sm font-semibold text-gray-500 text-center">Status</th>
                <th className="p-3 text-sm font-semibold text-gray-500 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                 <tr>
                    <td colSpan={7} className="text-center p-6 text-gray-500">Loading inventory...</td>
                </tr>
              ) : products.map((product) => (
                <tr key={product.id} className="border-b hover:bg-gray-50">
                  <td className="p-3">
                    <div className="flex items-center">
                      <img src={product.imageUrl} alt={product.name} className="w-10 h-10 rounded-md object-cover mr-4" />
                      <span className="font-medium text-gray-800">{product.name}</span>
                    </div>
                  </td>
                  <td className="p-3 text-gray-600">{product.sku}</td>
                  <td className="p-3 text-gray-800 font-medium text-center">{product.stock.available}</td>
                  <td className="p-3 text-gray-600 text-center">{product.stock.reserved}</td>
                  <td className="p-3 text-gray-600 font-bold text-center">{product.stock.available + product.stock.reserved}</td>
                  <td className="p-3 text-center"><StockStatusBadge available={product.stock.available} /></td>
                  <td className="p-3 text-center space-x-4">
                     <button 
                      onClick={() => handleOpenEditModal(product)}
                      className="text-blue-600 hover:text-blue-800 font-medium text-sm"
                      aria-label={`Edit product ${product.name}`}
                    >
                      Edit
                    </button>
                    <button 
                      onClick={() => handleOpenAdjustModal(product)}
                      className="text-blue-600 hover:text-blue-800 font-medium text-sm"
                      aria-label={`Adjust stock for ${product.name}`}
                    >
                      Adjust
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Stock Adjustment Modal */}
      {selectedProduct && (
        <Modal 
          isOpen={isAdjustModalOpen} 
          onClose={handleCloseModal} 
          title={`Adjust Stock: ${selectedProduct.name}`}
        >
          <form onSubmit={handleStockAdjust}>
            <p className="text-sm text-gray-600 mb-4">
              Current available stock: <span className="font-bold">{selectedProduct.stock.available}</span>
            </p>
            <div className="mb-4">
              <label htmlFor="adjustment" className="block text-sm font-medium text-gray-700 mb-1">
                Adjustment Amount
              </label>
              <input
                type="number"
                id="adjustment"
                value={adjustment}
                onChange={(e) => setAdjustment(parseInt(e.target.value, 10) || 0)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g., 50 or -10"
                required
              />
               <p className="text-xs text-gray-500 mt-1">Use a positive number to add stock, a negative number to remove.</p>
            </div>
            <div className="mb-6">
              <label htmlFor="reason" className="block text-sm font-medium text-gray-700 mb-1">
                Reason for Adjustment
              </label>
              <textarea
                id="reason"
                rows={3}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g., New shipment received, Stock count correction"
                required
              ></textarea>
            </div>
            <div className="flex justify-end space-x-3">
              <button 
                type="button" 
                onClick={handleCloseModal}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
              >
                Cancel
              </button>
              <button 
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Confirm Adjustment
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Product Edit Modal */}
      {editingProduct && (
        <Modal 
          isOpen={isEditModalOpen} 
          onClose={handleCloseModal} 
          title={`Edit Product: ${editingProduct.name}`}
        >
          <form onSubmit={handleProductUpdate} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Product Name</label>
              <input type="text" id="name" value={editingProduct.name} onChange={e => setEditingProduct({...editingProduct, name: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" />
            </div>
            <div className="grid grid-cols-2 gap-4">
               <div>
                <label htmlFor="sku" className="block text-sm font-medium text-gray-700 mb-1">SKU</label>
                <input type="text" id="sku" value={editingProduct.sku} onChange={e => setEditingProduct({...editingProduct, sku: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" />
              </div>
              <div>
                <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">Price</label>
                <input type="number" id="price" value={editingProduct.price} onChange={e => setEditingProduct({...editingProduct, price: parseFloat(e.target.value) || 0})} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" />
              </div>
            </div>
            <div>
              <label htmlFor="imageUrl" className="block text-sm font-medium text-gray-700 mb-1">Image URL</label>
              <input type="text" id="imageUrl" value={editingProduct.imageUrl} onChange={e => setEditingProduct({...editingProduct, imageUrl: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" />
            </div>
            <div className="flex justify-end space-x-3 pt-4">
              <button type="button" onClick={handleCloseModal} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">
                Cancel
              </button>
              <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                Save Changes
              </button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
};

export default Inventory;