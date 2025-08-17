
import React, { useEffect } from 'react';
import { NavLink } from 'react-router-dom';

const iconMap = {
  LayoutDashboard: "layout-dashboard",
  ShoppingCart: "shopping-cart",
  Printer: "printer",
  BookOpen: "book-open",
  Package: "package",
  Users: "users",
  PlusCircle: "plus-circle",
};

const NavItem: React.FC<{ to: string; icon: keyof typeof iconMap; children: React.ReactNode }> = ({ to, icon, children }) => (
  <NavLink
    to={to}
    className={({ isActive }) =>
      `flex items-center px-4 py-3 text-gray-700 hover:bg-blue-100 hover:text-blue-600 rounded-lg transition-colors duration-200 ${
        isActive ? 'bg-blue-100 text-blue-600 font-semibold' : ''
      }`
    }
  >
    <i data-lucide={iconMap[icon]} className="w-5 h-5 mr-3"></i>
    <span>{children}</span>
  </NavLink>
);

const Sidebar: React.FC = () => {
    useEffect(() => {
        // @ts-ignore
        if (window.lucide) {
            // @ts-ignore
            window.lucide.createIcons();
        }
    });
  return (
    <aside className="w-64 bg-white shadow-md flex-shrink-0 no-print">
      <div className="p-6 flex items-center">
         <div className="bg-blue-500 p-2 rounded-lg mr-3">
             <i data-lucide={iconMap.BookOpen} className="w-8 h-8 text-white"></i>
         </div>
        <h1 className="text-xl font-bold text-gray-800">BookStore</h1>
      </div>
      <nav className="px-4">
        <NavItem to="/dashboard" icon="LayoutDashboard">Dashboard</NavItem>
        <NavItem to="/orders" icon="ShoppingCart">Orders</NavItem>
        <NavItem to="/pos" icon="PlusCircle">POS / New Order</NavItem>
        <NavItem to="/customers" icon="Users">Customers</NavItem>
        <NavItem to="/inventory" icon="Package">Inventory</NavItem>
        <NavItem to="/labels" icon="Printer">Print Labels</NavItem>
      </nav>
    </aside>
  );
};

export default Sidebar;
