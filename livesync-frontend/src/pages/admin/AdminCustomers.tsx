import React, { useState } from 'react';
import { useOrders } from '../../hooks';
import { INITIAL_CUSTOMERS } from '../../data/mockInitialData';
import { Customer } from '../../types';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { Users, Search, Mail, Phone, MapPin, Eye, ShoppingBag, Calendar, CheckCircle2 } from 'lucide-react';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';

export const AdminCustomers: React.FC = () => {
  const { orders } = useOrders();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  // Compute active orders and total orders dynamically from shared orders store
  const customersWithStats = INITIAL_CUSTOMERS.map((cust) => {
    const custOrders = orders.filter(
      (o) =>
        o.customerId === cust.customerId ||
        o.customerEmail?.toLowerCase() === cust.email.toLowerCase() ||
        o.customerName.toLowerCase() === cust.name.toLowerCase()
    );

    const activeCount = custOrders.filter(
      (o) => o.orderStatus !== 'DELIVERED' && o.orderStatus !== 'CANCELLED'
    ).length;

    const totalOrdersCount = Math.max(cust.totalOrders, custOrders.length);
    const totalSpendCalc = custOrders.reduce((sum, o) => sum + o.totalAmount, cust.totalSpent);

    return {
      ...cust,
      totalOrders: totalOrdersCount,
      activeOrders: activeCount,
      totalSpent: totalSpendCalc,
    };
  });

  const filteredCustomers = customersWithStats.filter((cust) => {
    const query = searchQuery.toLowerCase();
    return (
      cust.name.toLowerCase().includes(query) ||
      cust.email.toLowerCase().includes(query) ||
      cust.phone.includes(query)
    );
  });

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-fade-in font-sans">
      <div className="pb-2 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-xs font-medium border border-indigo-200 mb-1.5">
            <Users className="w-3.5 h-3.5" />
            <span>Master Operations • Customer Directory</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Customer Management</h1>
          <p className="text-xs text-slate-500">
            Directory of registered consumer profiles, total order history, and account statuses.
          </p>
        </div>

        <div className="text-xs font-semibold text-slate-500">
          Total Accounts: <strong className="text-slate-900">{customersWithStats.length}</strong>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search customers by name, email, or phone..."
            className="w-full text-xs pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
          />
        </div>
      </div>

      {/* Customer Table (Section 18 Specification) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-100">
              <tr>
                <th className="py-3 px-4">Customer Name</th>
                <th className="py-3 px-4">Email</th>
                <th className="py-3 px-4">Phone</th>
                <th className="py-3 px-4">Total Orders</th>
                <th className="py-3 px-4">Active Orders</th>
                <th className="py-3 px-4">Registration Date</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredCustomers.map((cust) => (
                <tr key={cust.customerId} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3 px-4">
                    <div className="font-bold text-slate-900">{cust.name}</div>
                    <div className="text-[10px] text-slate-400 font-mono">ID: {cust.customerId}</div>
                  </td>
                  <td className="py-3 px-4 text-slate-600">
                    {cust.email}
                  </td>
                  <td className="py-3 px-4 text-slate-600 font-mono">
                    {cust.phone}
                  </td>
                  <td className="py-3 px-4 font-bold text-slate-800">
                    {cust.totalOrders}
                  </td>
                  <td className="py-3 px-4">
                    <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                      cust.activeOrders > 0
                        ? 'bg-amber-50 text-amber-700 border border-amber-200'
                        : 'bg-slate-100 text-slate-500'
                    }`}>
                      {cust.activeOrders} active
                    </span>
                  </td>
                  <td className="py-3 px-4 font-mono text-[10px] text-slate-400">
                    {formatDate(cust.joinedDate)}
                  </td>
                  <td className="py-3 px-4">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      {cust.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedCustomer(cust)}
                      leftIcon={<Eye className="w-3 h-3" />}
                    >
                      View
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Customer Details Modal */}
      {selectedCustomer && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedCustomer(null)}
          title={`Customer Record: ${selectedCustomer.name}`}
        >
          <div className="space-y-4 text-xs font-sans">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">{selectedCustomer.name}</h3>
                <p className="text-slate-500">{selectedCustomer.email}</p>
                <p className="text-[10px] text-slate-400 font-mono mt-0.5">Account ID: {selectedCustomer.customerId}</p>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">
                {selectedCustomer.status}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-lg border border-slate-100">
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Contact Phone</span>
                <p className="font-semibold text-slate-800">{selectedCustomer.phone}</p>
              </div>
              <div className="p-3 rounded-lg border border-slate-100">
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Registration Date</span>
                <p className="font-semibold text-slate-800">{formatDate(selectedCustomer.joinedDate)}</p>
              </div>
            </div>

            <div className="p-3 rounded-lg border border-slate-100">
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Default Delivery Address</span>
              <p className="font-semibold text-slate-800">{selectedCustomer.address}</p>
            </div>

            {/* Orders summary */}
            <div className="p-3 rounded-xl bg-indigo-50/50 border border-indigo-100 flex justify-between items-center">
              <div>
                <span className="text-[10px] font-bold uppercase text-indigo-700 block">Total Lifetime Orders</span>
                <span className="text-base font-bold text-indigo-900">{selectedCustomer.totalOrders} orders</span>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-bold uppercase text-indigo-700 block">Total Revenue Contribution</span>
                <span className="text-base font-mono font-bold text-indigo-900">{formatCurrency(selectedCustomer.totalSpent)}</span>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
