import React, { useEffect, useRef, useState } from 'react';
import { Customer } from '../types';
import { formatFullAddress } from '../lib/utils';
import { useCustomerContext } from '../context/CustomerContext';
import Modal from '../components/ui/Modal';

const Customers: React.FC = () => {
    const { customers, setCustomers, updateCustomer, addCustomer, loading } = useCustomerContext();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

    useEffect(() => {
        // @ts-ignore
        if (window.lucide) {
            // @ts-ignore
            window.lucide.createIcons();
        }
    });

    const handleOpenEditModal = (customer: Customer) => {
        setEditingCustomer({ ...customer });
        setIsEditModalOpen(true);
    };

    const handleCloseEditModal = () => {
        setIsEditModalOpen(false);
        setEditingCustomer(null);
    };

    const handleUpdateCustomer = async () => {
        if (editingCustomer) {
            await updateCustomer(editingCustomer);
            handleCloseEditModal();
        }
    };

    const handleEditFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        if (!editingCustomer) return;
        setEditingCustomer({
            ...editingCustomer,
            [e.target.name]: e.target.value,
        });
    };

    const handleExportCSV = () => {
        const headers = ['id', 'fullName', 'phone', 'email', 'addressLine1', 'addressLine2', 'district', 'province', 'postcode'];
        const csvRows = [
            headers.join(','),
            ...customers.map(c => [
                c.id,
                `"${c.fullName.replace(/"/g, '""')}"`,
                c.phone,
                c.email || '',
                `"${(c.addressLine1 || '').replace(/"/g, '""')}"`,
                `"${(c.addressLine2 || '').replace(/"/g, '""')}"`,
                c.district,
                c.province,
                c.postcode,
            ].join(','))
        ];
        const csvContent = '\ufeff' + csvRows.join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', 'customers.csv');
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
                
                const requiredHeaders = ['id', 'fullName', 'phone', 'email'];
                if (!requiredHeaders.every(h => headers.includes(h))) {
                    throw new Error('CSV must contain id, fullName, phone, and email headers.');
                }

                const updatePromises: Promise<void>[] = [];
                const customersToUpdate: Customer[] = [];

                lines.slice(1).forEach(line => {
                    if (!line.trim()) return;
                    const values = line.split(',');
                    const entry: { [key: string]: string } = headers.reduce((obj, header, i) => {
                        obj[header] = (values[i] || '').trim().replace(/^"|"$/g, '').replace(/""/g, '"');
                        return obj;
                    }, {});

                    let { id, fullName, phone, email, addressLine1, addressLine2, district, province, postcode } = entry;
                    if (!fullName || !phone) return;
                    
                    const existingCustomer = customers.find(c => c.id === id);

                    const customerData: Customer = {
                        id: id || `C${Date.now()}${Math.random().toString(36).substr(2, 5)}`,
                        fullName,
                        phone,
                        email: email || undefined,
                        addressLine1: addressLine1 || '',
                        addressLine2: addressLine2 || '',
                        district: district || '',
                        province: province || '',
                        postcode: postcode || '',
                    };

                    customersToUpdate.push(customerData);

                    if (existingCustomer) {
                        updatePromises.push(updateCustomer(customerData));
                    } else {
                        updatePromises.push(addCustomer(customerData));
                    }
                });

                await Promise.all(updatePromises);
                alert('Customers imported successfully!');
            } catch (error) {
                console.error('Failed to import CSV:', error);
                alert(`Error importing CSV: ${(error as Error).message}`);
            } finally {
                if (event.target) event.target.value = '';
            }
        };
        reader.readAsText(file, 'UTF-8');
    };

    return (
        <>
            <div className="bg-white p-6 rounded-2xl shadow-sm">
                <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
                    <h1 className="text-3xl font-bold text-gray-800">Customer Management</h1>
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
                                <th className="p-3 text-sm font-semibold text-gray-500">Name</th>
                                <th className="p-3 text-sm font-semibold text-gray-500">Contact</th>
                                <th className="p-3 text-sm font-semibold text-gray-500">Address</th>
                                <th className="p-3 text-sm font-semibold text-gray-500 text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={4} className="text-center p-6 text-gray-500">Loading customers...</td>
                                </tr>
                            ) : customers.map((customer) => (
                                <tr key={customer.id} className="border-b hover:bg-gray-50">
                                    <td className="p-3 font-medium text-gray-800">{customer.fullName}</td>
                                    <td className="p-3 text-gray-600">
                                        <div>{customer.phone}</div>
                                        <div className="text-sm text-gray-500">{customer.email}</div>
                                    </td>
                                    <td className="p-3 text-gray-600 whitespace-pre-line text-sm">
                                        {formatFullAddress(customer)}\n{customer.postcode}
                                    </td>
                                    <td className="p-3 text-center">
                                        <button 
                                            onClick={() => handleOpenEditModal(customer)}
                                            className="text-blue-600 hover:text-blue-800 font-medium text-sm"
                                            aria-label={`Edit customer ${customer.fullName}`}
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
            {editingCustomer && (
                <Modal isOpen={isEditModalOpen} onClose={handleCloseEditModal} title={`Edit Customer: ${editingCustomer.fullName}`}>
                    <div className="space-y-4">
                        <div>
                            <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                            <input type="text" name="fullName" value={editingCustomer.fullName} onChange={handleEditFormChange} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm" />
                        </div>
                         <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                                <input type="text" name="phone" value={editingCustomer.phone} onChange={handleEditFormChange} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm" />
                            </div>
                            <div>
                                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                <input type="email" name="email" value={editingCustomer.email || ''} onChange={handleEditFormChange} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm" />
                            </div>
                        </div>
                        <div>
                            <label htmlFor="addressLine1" className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                            <textarea name="addressLine1" rows={3} value={editingCustomer.addressLine1} onChange={handleEditFormChange} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm" placeholder="Street address, etc." />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="district" className="block text-sm font-medium text-gray-700 mb-1">District</label>
                                <input type="text" name="district" value={editingCustomer.district} onChange={handleEditFormChange} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm" />
                            </div>
                             <div>
                                <label htmlFor="province" className="block text-sm font-medium text-gray-700 mb-1">Province</label>
                                <input type="text" name="province" value={editingCustomer.province} onChange={handleEditFormChange} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm" />
                            </div>
                        </div>
                        <div>
                            <label htmlFor="postcode" className="block text-sm font-medium text-gray-700 mb-1">Postcode</label>
                            <input type="text" name="postcode" value={editingCustomer.postcode} onChange={handleEditFormChange} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm" />
                        </div>
                    </div>
                    <div className="flex justify-end space-x-3 mt-6">
                        <button type="button" onClick={handleCloseEditModal} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">
                            Cancel
                        </button>
                        <button type="button" onClick={handleUpdateCustomer} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                            Save Changes
                        </button>
                    </div>
                </Modal>
            )}
        </>
    );
};

export default Customers;