import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Product, Order, Customer, PaymentStatus, ShippingStatus } from '../types';
import { useOrderContext } from '../context/OrderContext';
import { useCustomerContext } from '../context/CustomerContext';
import { useProductContext } from '../context/ProductContext';
import { formatCurrency } from '../lib/utils';
import Modal from '../components/ui/Modal';

type CartItem = { product: Product; quantity: number };

const POS: React.FC = () => {
    const navigate = useNavigate();
    const { addOrder } = useOrderContext();
    const { addCustomer } = useCustomerContext();
    const { products, loading } = useProductContext();
    const [cart, setCart] = useState<Map<string, CartItem>>(new Map());
    const [isCheckoutOpen, setCheckoutOpen] = useState(false);
    const [customerContact, setCustomerContact] = useState('');
    const [remarks, setRemarks] = useState('');
    const [orderDate, setOrderDate] = useState(new Date().toISOString().split('T')[0]);
    const [deliveryDate, setDeliveryDate] = useState(() => {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        return tomorrow.toISOString().split('T')[0];
    });
    const [shippingStatus, setShippingStatus] = useState<ShippingStatus>(ShippingStatus.PENDING);
    
    useEffect(() => {
        // @ts-ignore
        if (window.lucide) {
            // @ts-ignore
            window.lucide.createIcons();
        }
    });

    const cartArray = useMemo(() => Array.from(cart.values()), [cart]);

    const totalAmount = useMemo(() => {
        return cartArray.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
    }, [cartArray]);

    const addToCart = (product: Product) => {
        setCart(prevCart => {
            const newCart = new Map(prevCart);
            const existingItem = newCart.get(product.id);
            if (existingItem) {
                existingItem.quantity += 1;
            } else {
                newCart.set(product.id, { product, quantity: 1 });
            }
            return newCart;
        });
    };

    const updateQuantity = (productId: string, newQuantity: number) => {
        setCart(prevCart => {
            const newCart = new Map(prevCart);
            const item = newCart.get(productId);
            if (item) {
                if (newQuantity > 0) {
                    item.quantity = newQuantity;
                } else {
                    newCart.delete(productId);
                }
            }
            return newCart;
        });
    };
    
    const handleSaveOrder = async () => {
        if (cart.size === 0 || !customerContact.trim()) {
            alert("Please add items to cart and enter customer contact information.");
            return;
        }

        const contactLines = customerContact.trim().split('\n').filter(line => line.trim() !== '');
        let newCustomerId = `C${Date.now()}`;
        if (contactLines.length > 0) {
            const name = contactLines[0].trim();
            const phoneRegex = /[0-9-]{10,12}/;
            const phoneLine = contactLines.find(line => phoneRegex.test(line))?.trim() || '';
            const addressLines = contactLines.filter(line => line.trim().toLowerCase() !== name.toLowerCase() && line.trim() !== phoneLine);
            const fullAddress = addressLines.join('\n');
            
            const newCustomer: Customer = {
                id: newCustomerId,
                fullName: name,
                phone: phoneLine,
                addressLine1: fullAddress,
                district: '',
                province: '',
                postcode: '',
            };
            await addCustomer(newCustomer);
        }

        const newOrder: Order = {
            id: `ORD${Date.now()}`,
            code: `POS${Date.now()}`,
            orderType: 'pos',
            customerContact,
            customerId: newCustomerId,
            remarks,
            items: cartArray.map(item => ({
                sku: item.product.sku,
                name: item.product.name,
                qty: item.quantity,
                price: item.product.price
            })),
            totalAmount,
            channel: 'POS',
            createdAt: new Date(orderDate).toISOString(),
            deliveryDate: deliveryDate ? new Date(deliveryDate).toISOString() : undefined,
            paymentStatus: PaymentStatus.PAID,
            shippingStatus: shippingStatus,
            shipping: {
                carrier: 'Kerry Express',
                service: 'Next Day',
            },
        };

        await addOrder(newOrder);
        alert('Order created successfully!');
        
        setCart(new Map());
        setCustomerContact('');
        setRemarks('');
        setOrderDate(new Date().toISOString().split('T')[0]);
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        setDeliveryDate(tomorrow.toISOString().split('T')[0]);
        setShippingStatus(ShippingStatus.PENDING);
        setCheckoutOpen(false);

        navigate('/orders');
    }

    if (loading) {
        return (
            <div className="flex justify-center items-center h-full">
                <p className="text-gray-500">Loading products...</p>
            </div>
        );
    }

    return (
        <div className="flex gap-6 h-[calc(100vh-4rem)]">
            {/* Product List */}
            <div className="w-2/3 bg-white p-6 rounded-2xl shadow-sm overflow-y-auto">
                <h1 className="text-3xl font-bold text-gray-800 mb-6">Products</h1>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {products.map(product => (
                        <div key={product.id} className="border rounded-lg p-4 flex flex-col items-center text-center shadow-sm hover:shadow-md transition-shadow">
                            <img src={product.imageUrl} alt={product.name} className="w-24 h-24 object-cover rounded-md mb-3" />
                            <p className="font-semibold text-gray-800 text-sm flex-grow">{product.name}</p>
                            <p className="text-gray-600 mb-2">{formatCurrency(product.price)}</p>
                            <button 
                                onClick={() => addToCart(product)}
                                className="w-full bg-blue-500 text-white px-3 py-1.5 rounded-md hover:bg-blue-600 text-sm transition-colors disabled:bg-gray-300"
                                disabled={product.stock.available <= 0}
                            >
                                {product.stock.available > 0 ? 'Add to Cart' : 'Out of Stock'}
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            {/* Cart Sidebar */}
            <div className="w-1/3 bg-white p-6 rounded-2xl shadow-sm flex flex-col">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">Cart</h2>
                {cart.size === 0 ? (
                    <div className="flex-grow flex items-center justify-center text-gray-500">
                        Your cart is empty
                    </div>
                ) : (
                    <div className="flex-grow overflow-y-auto -mr-6 pr-6">
                        {cartArray.map(({ product, quantity }) => (
                            <div key={product.id} className="flex items-center gap-4 mb-4">
                                <img src={product.imageUrl} alt={product.name} className="w-14 h-14 object-cover rounded-md" />
                                <div className="flex-grow">
                                    <p className="font-medium text-sm">{product.name}</p>
                                    <p className="text-gray-500 text-sm">{formatCurrency(product.price)}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button onClick={() => updateQuantity(product.id, quantity - 1)} className="w-6 h-6 rounded-full border text-gray-600">-</button>
                                    <span>{quantity}</span>
                                    <button onClick={() => updateQuantity(product.id, quantity + 1)} className="w-6 h-6 rounded-full border text-gray-600">+</button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
                <div className="border-t pt-4 mt-4">
                    <div className="flex justify-between items-center font-bold text-lg mb-4">
                        <span>Total</span>
                        <span>{formatCurrency(totalAmount)}</span>
                    </div>
                    <button 
                        onClick={() => setCheckoutOpen(true)}
                        disabled={cart.size === 0}
                        className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                    >
                       Checkout
                    </button>
                </div>
            </div>
            
            <Modal isOpen={isCheckoutOpen} onClose={() => setCheckoutOpen(false)} title="Create New Order">
                 <div className="space-y-4">
                    <div>
                        <label htmlFor="customerContact" className="block text-sm font-medium text-gray-700 mb-1">Customer Contact</label>
                        <textarea 
                            id="customerContact" 
                            rows={4}
                            value={customerContact}
                            onChange={(e) => setCustomerContact(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Paste full customer info here (Name, Phone, Address...)"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="orderDate" className="block text-sm font-medium text-gray-700 mb-1">Order Date</label>
                            <input type="date" id="orderDate" value={orderDate} onChange={e => setOrderDate(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" />
                        </div>
                        <div>
                            <label htmlFor="deliveryDate" className="block text-sm font-medium text-gray-700 mb-1">Delivery Date</label>
                            <input type="date" id="deliveryDate" value={deliveryDate} onChange={e => setDeliveryDate(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" />
                        </div>
                    </div>
                    <div>
                        <label htmlFor="shippingStatus" className="block text-sm font-medium text-gray-700 mb-1">Shipping Status</label>
                        <select id="shippingStatus" value={shippingStatus} onChange={e => setShippingStatus(e.target.value as ShippingStatus)} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white">
                            {Object.values(ShippingStatus).map(status => <option key={status} value={status}>{status}</option>)}
                        </select>
                    </div>
                     <div>
                        <label htmlFor="remarks" className="block text-sm font-medium text-gray-700 mb-1">Remarks</label>
                        <textarea 
                            id="remarks" 
                            rows={2}
                             value={remarks}
                            onChange={(e) => setRemarks(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Optional notes for this order"
                        />
                    </div>
                    <div className="border-t pt-4">
                         <h3 className="font-semibold mb-2">Order Summary</h3>
                         <p>{cart.size} items</p>
                         <p className="font-bold text-xl">Total: {formatCurrency(totalAmount)}</p>
                    </div>
                 </div>
                 <div className="flex justify-end space-x-3 mt-6">
                    <button type="button" onClick={() => setCheckoutOpen(false)} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">
                        Cancel
                    </button>
                    <button type="button" onClick={handleSaveOrder} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                        Save Order
                    </button>
                </div>
            </Modal>
        </div>
    );
};

export default POS;