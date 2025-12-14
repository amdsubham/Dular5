'use client';

import { useEffect, useState } from 'react';
import { getUserSubscriptions, getPremiumUsers, type UserSubscription } from '@/services/subscriptions';
import { Users, Crown, Calendar, TrendingUp, Filter } from 'lucide-react';

export default function UserSubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState<UserSubscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'premium' | 'free' | 'active' | 'expired'>('all');

  useEffect(() => {
    loadSubscriptions();
  }, [filter]);

  const loadSubscriptions = async () => {
    try {
      setLoading(true);
      let data: UserSubscription[];

      if (filter === 'premium') {
        data = await getPremiumUsers();
      } else {
        data = await getUserSubscriptions(100);
      }

      // Apply additional filtering
      if (filter === 'free') {
        data = data.filter((sub) => sub.currentPlan === 'free');
      } else if (filter === 'active') {
        data = data.filter((sub) => sub.isActive && sub.isPremium);
      } else if (filter === 'expired') {
        data = data.filter(
          (sub) => !sub.isActive && sub.planEndDate && sub.planEndDate < new Date()
        );
      }

      setSubscriptions(data);
    } catch (error) {
      console.error('Error loading subscriptions:', error);
      alert('Failed to load user subscriptions');
    } finally {
      setLoading(false);
    }
  };

  const getPlanBadgeColor = (plan: string) => {
    switch (plan) {
      case 'monthly':
        return 'bg-purple-100 text-purple-800';
      case 'weekly':
        return 'bg-blue-100 text-blue-800';
      case 'daily':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (date: Date | null) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getDaysRemaining = (endDate: Date | null) => {
    if (!endDate) return 0;
    const now = new Date();
    const end = new Date(endDate);
    const diff = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return Math.max(0, diff);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading user subscriptions...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">User Subscriptions</h1>
        <p className="text-gray-600 mt-2">View and manage all user subscription statuses</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-md p-4 mb-6">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2 text-gray-700">
            <Filter className="w-4 h-4" />
            <span className="font-medium text-sm">Filter:</span>
          </div>

          {[
            { value: 'all', label: 'All Users' },
            { value: 'premium', label: 'Premium Only' },
            { value: 'free', label: 'Free Only' },
            { value: 'active', label: 'Active Subscriptions' },
            { value: 'expired', label: 'Expired' },
          ].map((filterOption) => (
            <button
              key={filterOption.value}
              onClick={() => setFilter(filterOption.value as any)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === filterOption.value
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {filterOption.label}
            </button>
          ))}

          <div className="ml-auto text-sm text-gray-600">
            <span className="font-semibold">{subscriptions.length}</span> users
          </div>
        </div>
      </div>

      {/* Subscriptions Table */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Current Plan
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Swipes Usage
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Subscription Period
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Lifetime Swipes
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {subscriptions.map((subscription) => {
                const daysRemaining = getDaysRemaining(subscription.planEndDate);

                return (
                  <tr key={subscription.userId} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="bg-gradient-to-br from-primary-400 to-primary-600 w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold">
                          {subscription.userId.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900 font-mono text-sm">
                            {subscription.userId.substring(0, 12)}...
                          </div>
                          <div className="text-xs text-gray-500">
                            Joined {formatDate(subscription.createdAt)}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {subscription.isPremium && <Crown className="w-4 h-4 text-yellow-500" />}
                        <span
                          className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${getPlanBadgeColor(
                            subscription.currentPlan
                          )}`}
                        >
                          {subscription.currentPlan.charAt(0).toUpperCase() +
                            subscription.currentPlan.slice(1)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {subscription.swipesUsedToday} / {subscription.swipesLimit === -1 ? '∞' : subscription.swipesLimit}
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                          <div
                            className="bg-primary-600 h-2 rounded-full"
                            style={{
                              width: `${
                                subscription.swipesLimit === -1
                                  ? 0
                                  : Math.min(
                                      (subscription.swipesUsedToday / subscription.swipesLimit) * 100,
                                      100
                                    )
                              }%`,
                            }}
                          ></div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {subscription.isPremium && subscription.planStartDate ? (
                        <div>
                          <div className="text-sm text-gray-900">
                            {formatDate(subscription.planStartDate)} -{' '}
                            {formatDate(subscription.planEndDate)}
                          </div>
                          <div className="flex items-center gap-1 text-xs text-gray-600 mt-1">
                            <Calendar className="w-3 h-3" />
                            {daysRemaining > 0 ? `${daysRemaining} days left` : 'Expired'}
                          </div>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-500">No subscription</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                          subscription.isActive && subscription.isPremium
                            ? 'bg-green-100 text-green-800'
                            : subscription.isPremium
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {subscription.isActive && subscription.isPremium
                          ? 'Active'
                          : subscription.isPremium
                          ? 'Expired'
                          : 'Free'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-gray-400" />
                        <span className="font-medium text-gray-900">
                          {subscription.totalSwipesAllTime.toLocaleString()}
                        </span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {subscriptions.length === 0 && (
            <div className="text-center py-12">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-2">No users found</p>
              <p className="text-sm text-gray-500">Try adjusting your filters</p>
            </div>
          )}
        </div>
      </div>

      {/* Payment History Summary */}
      <div className="mt-6 bg-white rounded-xl shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Payment History Summary</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {['daily', 'weekly', 'monthly'].map((plan) => {
            const planUsers = subscriptions.filter((sub) => sub.currentPlan === plan);
            const totalRevenue = planUsers.reduce(
              (sum, sub) => sum + (sub.paymentHistory?.reduce((s, p) => s + p.amount, 0) || 0),
              0
            );

            return (
              <div key={plan} className="border border-gray-200 rounded-lg p-4">
                <h3 className={`text-sm font-semibold mb-2 ${getPlanBadgeColor(plan)}`}>
                  {plan.charAt(0).toUpperCase() + plan.slice(1)} Plan
                </h3>
                <div className="text-2xl font-bold text-gray-900 mb-1">{planUsers.length}</div>
                <div className="text-sm text-gray-600">users</div>
                <div className="mt-2 pt-2 border-t border-gray-200">
                  <div className="text-xs text-gray-600">Total Revenue</div>
                  <div className="text-lg font-bold text-gray-900">₹{totalRevenue}</div>
                </div>
              </div>
            );
          })}

          <div className="border border-primary-200 bg-primary-50 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-primary-900 mb-2">Free Users</h3>
            <div className="text-2xl font-bold text-primary-900 mb-1">
              {subscriptions.filter((sub) => sub.currentPlan === 'free').length}
            </div>
            <div className="text-sm text-primary-700">users</div>
            <div className="mt-2 pt-2 border-t border-primary-200">
              <div className="text-xs text-primary-700">Conversion Potential</div>
              <div className="text-lg font-bold text-primary-900">High</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
