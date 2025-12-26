'use client';

import { useEffect, useState } from 'react';
import {
  getTransactions,
  getRevenueStats,
  type Transaction,
  type RevenueStats,
} from '@/services/subscriptions';
import { CreditCard, Check, X, Clock, DollarSign, TrendingUp, Download } from 'lucide-react';

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [revenueStats, setRevenueStats] = useState<RevenueStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'success' | 'failed' | 'pending'>('all');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [transactionsData, stats] = await Promise.all([getTransactions(200), getRevenueStats()]);

      setTransactions(transactionsData);
      setRevenueStats(stats);
    } catch (error) {
      console.error('Error loading transactions:', error);
      alert('Failed to load transactions');
    } finally {
      setLoading(false);
    }
  };

  const filteredTransactions =
    filter === 'all'
      ? transactions
      : transactions.filter((txn) => txn.status === filter);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold">
            <Check className="w-3 h-3" />
            Success
          </span>
        );
      case 'failed':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-100 text-red-800 rounded-full text-xs font-semibold">
            <X className="w-3 h-3" />
            Failed
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-semibold">
            <Clock className="w-3 h-3" />
            Pending
          </span>
        );
      default:
        return <span className="text-gray-600">{status}</span>;
    }
  };

  const exportTransactions = () => {
    const csv = [
      ['Transaction ID', 'User', 'Plan', 'Amount', 'Status', 'Date', 'Payment ID'].join(','),
      ...filteredTransactions.map((txn) =>
        [
          txn.id,
          txn.userEmail,
          txn.planName,
          txn.amount,
          txn.status,
          new Date(txn.createdAt).toLocaleString(),
          txn.instamojoPaymentId || 'N/A',
        ].join(',')
      ),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transactions_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading transactions...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4 md:mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Transactions</h1>
          <p className="text-sm md:text-base text-gray-600 mt-1 md:mt-2">Payment history and revenue analytics</p>
        </div>
        <button
          onClick={exportTransactions}
          className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors text-sm md:text-base w-full sm:w-auto"
        >
          <Download className="w-4 h-4 md:w-5 md:h-5" />
          Export CSV
        </button>
      </div>

      {/* Revenue Stats */}
      {revenueStats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-4 md:mb-8">
          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-md p-4 md:p-6 text-white">
            <div className="flex items-center justify-between mb-3 md:mb-4">
              <DollarSign className="w-6 h-6 md:w-8 md:h-8" />
              <span className="text-xs md:text-sm font-medium opacity-90">Total Revenue</span>
            </div>
            <div className="text-2xl md:text-3xl font-bold mb-1">₹{revenueStats.totalRevenue.toLocaleString()}</div>
            <div className="text-xs md:text-sm opacity-90">All time</div>
          </div>

          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-md p-4 md:p-6 text-white">
            <div className="flex items-center justify-between mb-3 md:mb-4">
              <TrendingUp className="w-6 h-6 md:w-8 md:h-8" />
              <span className="text-xs md:text-sm font-medium opacity-90">This Month</span>
            </div>
            <div className="text-2xl md:text-3xl font-bold mb-1">₹{revenueStats.monthRevenue.toLocaleString()}</div>
            <div className="text-xs md:text-sm opacity-90">
              ₹{revenueStats.todayRevenue.toLocaleString()} today
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-md p-4 md:p-6 text-white">
            <div className="flex items-center justify-between mb-3 md:mb-4">
              <Check className="w-6 h-6 md:w-8 md:h-8" />
              <span className="text-xs md:text-sm font-medium opacity-90">Success Rate</span>
            </div>
            <div className="text-2xl md:text-3xl font-bold mb-1">
              {revenueStats.totalTransactions > 0
                ? Math.round(
                    (revenueStats.successfulTransactions / revenueStats.totalTransactions) * 100
                  )
                : 0}
              %
            </div>
            <div className="text-xs md:text-sm opacity-90">
              {revenueStats.successfulTransactions} / {revenueStats.totalTransactions} successful
            </div>
          </div>

          <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl shadow-md p-4 md:p-6 text-white">
            <div className="flex items-center justify-between mb-3 md:mb-4">
              <CreditCard className="w-6 h-6 md:w-8 md:h-8" />
              <span className="text-xs md:text-sm font-medium opacity-90">Avg Order Value</span>
            </div>
            <div className="text-2xl md:text-3xl font-bold mb-1">
              ₹{Math.round(revenueStats.averageOrderValue)}
            </div>
            <div className="text-xs md:text-sm opacity-90">Per transaction</div>
          </div>
        </div>
      )}

      {/* Revenue by Plan */}
      {revenueStats && (
        <div className="bg-white rounded-xl shadow-md p-4 md:p-6 mb-4 md:mb-8">
          <h2 className="text-lg md:text-xl font-semibold text-gray-900 mb-3 md:mb-4">Revenue by Plan</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {Object.entries(revenueStats.revenueByPlan).map(([planId, data]) => (
              <div key={planId} className="border border-gray-200 rounded-lg p-3 md:p-4">
                <h3 className="font-semibold text-gray-900 mb-2 md:mb-3 capitalize text-sm md:text-base">{planId} Plan</h3>
                <div className="space-y-1.5 md:space-y-2">
                  <div className="flex justify-between text-xs md:text-sm">
                    <span className="text-gray-600">Total Revenue:</span>
                    <span className="font-semibold text-gray-900">₹{data.revenue.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-xs md:text-sm">
                    <span className="text-gray-600">Transactions:</span>
                    <span className="font-semibold text-gray-900">{data.count}</span>
                  </div>
                  <div className="flex justify-between text-xs md:text-sm">
                    <span className="text-gray-600">Avg Value:</span>
                    <span className="font-semibold text-gray-900">
                      ₹{Math.round(data.revenue / data.count)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-md p-3 md:p-4 mb-4 md:mb-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 md:gap-4 flex-wrap">
          <span className="font-medium text-xs md:text-sm text-gray-700">Filter:</span>

          <div className="flex flex-wrap gap-2 w-full sm:w-auto">
            {[
              { value: 'all', label: 'All' },
              { value: 'success', label: 'Success' },
              { value: 'failed', label: 'Failed' },
              { value: 'pending', label: 'Pending' },
            ].map((filterOption) => (
              <button
                key={filterOption.value}
                onClick={() => setFilter(filterOption.value as any)}
                className={`px-3 md:px-4 py-1.5 md:py-2 rounded-lg text-xs md:text-sm font-medium transition-colors ${
                  filter === filterOption.value
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {filterOption.label}
              </button>
            ))}
          </div>

          <div className="sm:ml-auto text-xs md:text-sm text-gray-600 w-full sm:w-auto text-left sm:text-right">
            <span className="font-semibold">{filteredTransactions.length}</span> transactions
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px]">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-3 md:px-6 py-3 md:py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Transaction
                </th>
                <th className="px-3 md:px-6 py-3 md:py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  User
                </th>
                <th className="px-3 md:px-6 py-3 md:py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Plan
                </th>
                <th className="px-3 md:px-6 py-3 md:py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-3 md:px-6 py-3 md:py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-3 md:px-6 py-3 md:py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-3 md:px-6 py-3 md:py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Payment ID
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredTransactions.map((transaction) => (
                <tr key={transaction.id} className="hover:bg-gray-50">
                  <td className="px-3 md:px-6 py-3 md:py-4">
                    <div className="flex items-center gap-2 md:gap-3">
                      <div className="bg-primary-100 p-1.5 md:p-2 rounded-lg">
                        <CreditCard className="w-3 h-3 md:w-4 md:h-4 text-primary-600" />
                      </div>
                      <div>
                        <div className="font-medium text-gray-900 text-xs md:text-sm font-mono">
                          {transaction.id.substring(0, 12)}...
                        </div>
                        <div className="text-xs text-gray-500">{transaction.provider}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 md:px-6 py-3 md:py-4">
                    <div>
                      <div className="font-medium text-gray-900 text-xs md:text-sm">
                        {transaction.userName}
                      </div>
                      <div className="text-xs text-gray-500">{transaction.userEmail}</div>
                    </div>
                  </td>
                  <td className="px-3 md:px-6 py-3 md:py-4">
                    <span className="inline-block px-2 md:px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-semibold">
                      {transaction.planName}
                    </span>
                  </td>
                  <td className="px-3 md:px-6 py-3 md:py-4">
                    <div className="font-bold text-gray-900 text-xs md:text-sm">
                      {transaction.currency} {transaction.amount}
                    </div>
                  </td>
                  <td className="px-3 md:px-6 py-3 md:py-4">{getStatusBadge(transaction.status)}</td>
                  <td className="px-3 md:px-6 py-3 md:py-4">
                    <div>
                      <div className="text-xs md:text-sm text-gray-900">
                        {new Date(transaction.createdAt).toLocaleDateString()}
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(transaction.createdAt).toLocaleTimeString()}
                      </div>
                    </div>
                  </td>
                  <td className="px-3 md:px-6 py-3 md:py-4">
                    {transaction.instamojoPaymentId ? (
                      <div className="text-xs md:text-sm font-mono text-gray-900">
                        {transaction.instamojoPaymentId.substring(0, 15)}...
                      </div>
                    ) : (
                      <span className="text-xs md:text-sm text-gray-500">N/A</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredTransactions.length === 0 && (
            <div className="text-center py-8 md:py-12 px-4">
              <CreditCard className="w-10 h-10 md:w-12 md:h-12 text-gray-400 mx-auto mb-3 md:mb-4" />
              <p className="text-sm md:text-base text-gray-600 mb-1 md:mb-2">No transactions found</p>
              <p className="text-xs md:text-sm text-gray-500">Try adjusting your filters</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
