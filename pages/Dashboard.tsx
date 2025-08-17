import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../components/ui/Card';
import { formatCurrency, formatDate } from '../lib/utils';
import { useLabelContext } from '../context/LabelContext';
import { useOrderContext } from '../context/OrderContext';
import { Order } from '../types';

const StatCard: React.FC<{ title: string; value: string; icon: string }> = ({ title, value, icon }) => (
    <Card title={title} icon={icon}>
        <p className="text-3xl font-bold text-gray-800">{value}</p>
    </Card>
);

const LatestSales: React.FC = () => {
    const navigate = useNavigate();
    const { setSelectedOrderIds } = useLabelContext();
    const { orders } = useOrderContext();
    const recentOrders = orders.slice(0, 5);

    const handlePrintLabel = (orderId: string) => {
        setSelectedOrderIds(new Set([orderId]));
        navigate('/labels');
    };

    useEffect(() => {
        // @ts-ignore
        if (window.lucide) {
            // @ts-ignore
            window.lucide.createIcons();
        }
    });

    return (
        <div className="bg-white p-6 rounded-2xl shadow-sm mt-8">
            <h3 className="text-xl font-semibold text-gray-700 mb-4">Latest Sales</h3>
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead>
                        <tr className="border-b">
                            <th className="p-3 text-sm font-semibold text-gray-500">Order Code</th>
                            <th className="p-3 text-sm font-semibold text-gray-500">Time</th>
                            <th className="p-3 text-sm font-semibold text-gray-500">Amount</th>
                            <th className="p-3 text-sm font-semibold text-gray-500">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {recentOrders.map((order: Order) => (
                            <tr key={order.id} className="border-b hover:bg-gray-50">
                                <td className="p-3 font-medium text-gray-800">{order.code}</td>
                                <td className="p-3 text-gray-600">{formatDate(order.createdAt)}</td>
                                <td className="p-3 text-gray-600">{formatCurrency(order.totalAmount)}</td>
                                <td className="p-3">
                                    <button
                                        onClick={() => handlePrintLabel(order.id)}
                                        className="flex items-center text-sm text-blue-600 hover:text-blue-800"
                                        aria-label={`Print label for order ${order.code}`}
                                    >
                                        <i data-lucide="printer" className="w-4 h-4 mr-2"></i>
                                        Print Label
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};


const Dashboard: React.FC = () => {
    const { orders, loading } = useOrderContext();

    if (loading) {
        return (
             <div className="flex justify-center items-center h-full">
                <div className="text-center">
                    <h1 className="text-3xl font-bold text-gray-800 mb-6">Dashboard</h1>
                    <p className="text-gray-500">Loading data...</p>
                </div>
            </div>
        );
    }
    
    const todayRevenue = orders.filter(o => new Date(o.createdAt).toDateString() === new Date().toDateString()).reduce((acc, order) => acc + order.totalAmount, 0);
    const thisMonthSales = orders.length;
    const thisMonthAmount = orders.reduce((acc, order) => acc + order.totalAmount, 0);

    return (
        <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-6">Dashboard</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard title="Today's Revenue" value={formatCurrency(todayRevenue)} icon="dollar-sign" />
                <StatCard title="This Month's Sales" value={`${thisMonthSales} Orders`} icon="shopping-cart" />
                <StatCard title="This Month's Revenue" value={formatCurrency(thisMonthAmount)} icon="trending-up" />
                <StatCard title="Low Stock Items" value="5" icon="package-x" />
            </div>
            <LatestSales />
        </div>
    );
};

export default Dashboard;