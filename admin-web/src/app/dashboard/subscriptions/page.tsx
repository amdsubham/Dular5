'use client';

import { useEffect, useState } from 'react';
import {
  getSubscriptionPlans,
  getSubscriptionConfig,
  getRevenueStats,
  getSubscriptionStats,
  type SubscriptionPlan,
  type SubscriptionConfig,
  type RevenueStats,
  type SubscriptionStats,
} from '@/services/subscriptions';
import { DollarSign, Users, TrendingUp, CreditCard, Settings, Package } from 'lucide-react';
import Link from 'next/link';

export default function SubscriptionsPage() {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [config, setConfig] = useState<SubscriptionConfig | null>(null);
  const [revenueStats, setRevenueStats] = useState<RevenueStats | null>(null);
  const [subscriptionStats, setSubscriptionStats] = useState<SubscriptionStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [plansData, configData, revenue, subStats] = await Promise.all([
        getSubscriptionPlans(),
        getSubscriptionConfig(),
        getRevenueStats(),
        getSubscriptionStats(),
      ]);

      setPlans(plansData);
      setConfig(configData);
      setRevenueStats(revenue);
      setSubscriptionStats(subStats);
    } catch (error) {
      console.error('Error loading subscription data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading subscription data...</p>
        </div>
      </div>
    );
  }

  const statCards = [
    {
      title: 'Total Revenue',
      value: `₹${revenueStats?.totalRevenue.toLocaleString() || 0}`,
      subtitle: `₹${revenueStats?.todayRevenue || 0} today`,
      icon: DollarSign,
      color: 'bg-green-500',
      link: '/dashboard/subscriptions/transactions',
    },
    {
      title: 'Premium Users',
      value: subscriptionStats?.premiumUsers || 0,
      subtitle: `${subscriptionStats?.conversionRate.toFixed(1)}% conversion`,
      icon: Users,
      color: 'bg-blue-500',
      link: '/dashboard/subscriptions/users',
    },
    {
      title: 'Active Subscriptions',
      value: subscriptionStats?.activeSubscriptions || 0,
      subtitle: `${subscriptionStats?.expiredSubscriptions || 0} expired`,
      icon: TrendingUp,
      color: 'bg-purple-500',
      link: '/dashboard/subscriptions/users',
    },
    {
      title: 'Successful Payments',
      value: revenueStats?.successfulTransactions || 0,
      subtitle: `${revenueStats?.failedTransactions || 0} failed`,
      icon: CreditCard,
      color: 'bg-indigo-500',
      link: '/dashboard/subscriptions/transactions',
    },
  ];

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4 md:mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Subscription Management</h1>
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
          <Link
            href="/dashboard/subscriptions/settings"
            className="flex items-center justify-center gap-2 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors text-sm md:text-base"
          >
            <Settings className="w-4 h-4 md:w-5 md:h-5" />
            Settings
          </Link>
          <Link
            href="/dashboard/subscriptions/plans/new"
            className="flex items-center justify-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg transition-colors text-sm md:text-base"
          >
            <Package className="w-4 h-4 md:w-5 md:h-5" />
            Add Plan
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-4 md:mb-8">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <Link key={card.title} href={card.link}>
              <div className="bg-white rounded-xl shadow-md p-4 md:p-6 hover:shadow-lg transition-shadow cursor-pointer">
                <div className="flex items-center justify-between mb-3 md:mb-4">
                  <div className={`${card.color} p-2 md:p-3 rounded-full`}>
                    <Icon className="w-5 h-5 md:w-6 md:h-6 text-white" />
                  </div>
                </div>
                <h3 className="text-gray-600 text-xs md:text-sm font-medium mb-1">{card.title}</h3>
                <p className="text-xl md:text-2xl font-bold text-gray-900 mb-1">{card.value}</p>
                <p className="text-xs md:text-sm text-gray-500">{card.subtitle}</p>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Subscription Plans */}
      <div className="bg-white rounded-xl shadow-md p-4 md:p-6 mb-4 md:mb-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4 md:mb-6">
          <h2 className="text-lg md:text-xl font-semibold text-gray-900">Subscription Plans</h2>
          <Link
            href="/dashboard/subscriptions/plans"
            className="text-primary-600 hover:text-primary-700 font-medium text-xs md:text-sm"
          >
            Manage All Plans →
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {plans.map((plan) => (
            <Link key={plan.id} href={`/dashboard/subscriptions/plans/${plan.id}`}>
              <div className="border-2 border-gray-200 rounded-xl p-4 md:p-6 hover:border-primary-500 transition-colors cursor-pointer relative">
                {plan.popular && (
                  <div className="absolute -top-2 md:-top-3 left-1/2 transform -translate-x-1/2 bg-primary-500 text-white text-xs font-bold px-2 md:px-3 py-1 rounded-full">
                    POPULAR
                  </div>
                )}
                {!plan.active && (
                  <div className="absolute top-3 md:top-4 right-3 md:right-4 bg-gray-500 text-white text-xs font-bold px-2 py-1 rounded">
                    INACTIVE
                  </div>
                )}

                <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-2">{plan.displayName}</h3>
                <p className="text-gray-600 text-xs md:text-sm mb-3 md:mb-4">{plan.description}</p>

                <div className="mb-3 md:mb-4">
                  <span className="text-2xl md:text-3xl font-bold text-primary-600">₹{plan.price}</span>
                  <span className="text-gray-600 text-xs md:text-sm ml-2">/ {plan.duration} days</span>
                </div>

                <div className="space-y-1.5 md:space-y-2">
                  <div className="flex items-center gap-2 text-xs md:text-sm text-gray-700">
                    <span className="text-green-500">✓</span>
                    <span>
                      {plan.swipeLimit === -1 ? 'Unlimited' : plan.swipeLimit} daily swipes
                    </span>
                  </div>
                  {plan.features.slice(0, 3).map((feature, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-xs md:text-sm text-gray-700">
                      <span className="text-green-500">✓</span>
                      <span>{feature}</span>
                    </div>
                  ))}
                  {plan.features.length > 3 && (
                    <div className="text-xs md:text-sm text-gray-500 ml-6">
                      +{plan.features.length - 3} more features
                    </div>
                  )}
                </div>

                <div className="mt-3 md:mt-4 pt-3 md:pt-4 border-t border-gray-200">
                  <div className="flex justify-between text-xs md:text-sm">
                    <span className="text-gray-600">Revenue:</span>
                    <span className="font-semibold text-gray-900">
                      ₹{revenueStats?.revenueByPlan[plan.id]?.revenue.toLocaleString() || 0}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs md:text-sm mt-1">
                    <span className="text-gray-600">Sales:</span>
                    <span className="font-semibold text-gray-900">
                      {revenueStats?.revenueByPlan[plan.id]?.count || 0}
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Configuration Summary */}
      {config && (
        <div className="bg-white rounded-xl shadow-md p-4 md:p-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4 md:mb-6">
            <h2 className="text-lg md:text-xl font-semibold text-gray-900">Configuration</h2>
            <Link
              href="/dashboard/subscriptions/settings"
              className="text-primary-600 hover:text-primary-700 font-medium text-xs md:text-sm"
            >
              Edit Settings →
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            <div className="border border-gray-200 rounded-lg p-3 md:p-4">
              <p className="text-gray-600 text-xs md:text-sm mb-1">Free Trial Limit</p>
              <p className="text-xl md:text-2xl font-bold text-gray-900">{config.freeTrialSwipeLimit}</p>
              <p className="text-gray-500 text-xs mt-1">swipes/day</p>
            </div>

            <div className="border border-gray-200 rounded-lg p-3 md:p-4">
              <p className="text-gray-600 text-xs md:text-sm mb-1">Payment Gateway</p>
              <p className="text-xs md:text-sm font-mono text-gray-900">
                CCAvenue
              </p>
              <p className="text-gray-500 text-xs mt-1">
                Active
              </p>
            </div>

            <div className="border border-gray-200 rounded-lg p-3 md:p-4">
              <p className="text-gray-600 text-xs md:text-sm mb-1">Subscriptions</p>
              <p className="text-xl md:text-2xl font-bold text-gray-900">
                {config.subscriptionEnabled ? 'Enabled' : 'Disabled'}
              </p>
              <p className="text-gray-500 text-xs mt-1">system status</p>
            </div>

            <div className="border border-gray-200 rounded-lg p-3 md:p-4">
              <p className="text-gray-600 text-xs md:text-sm mb-1">Last Updated</p>
              <p className="text-xs md:text-sm text-gray-900">
                {config.updatedAt.toLocaleDateString()}
              </p>
              <p className="text-gray-500 text-xs mt-1">by {config.updatedBy}</p>
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="mt-4 md:mt-6 grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
        <Link
          href="/dashboard/subscriptions/plans"
          className="bg-gradient-to-r from-purple-500 to-indigo-500 rounded-xl p-4 md:p-6 text-white hover:shadow-lg transition-shadow"
        >
          <Package className="w-6 h-6 md:w-8 md:h-8 mb-2 md:mb-3" />
          <h3 className="text-base md:text-lg font-semibold mb-1 md:mb-2">Manage Plans</h3>
          <p className="text-xs md:text-sm text-white/80">Add, edit, or remove subscription plans</p>
        </Link>

        <Link
          href="/dashboard/subscriptions/users"
          className="bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl p-4 md:p-6 text-white hover:shadow-lg transition-shadow"
        >
          <Users className="w-6 h-6 md:w-8 md:h-8 mb-2 md:mb-3" />
          <h3 className="text-base md:text-lg font-semibold mb-1 md:mb-2">User Subscriptions</h3>
          <p className="text-xs md:text-sm text-white/80">View all user subscription statuses</p>
        </Link>

        <Link
          href="/dashboard/subscriptions/transactions"
          className="bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl p-4 md:p-6 text-white hover:shadow-lg transition-shadow"
        >
          <CreditCard className="w-6 h-6 md:w-8 md:h-8 mb-2 md:mb-3" />
          <h3 className="text-base md:text-lg font-semibold mb-1 md:mb-2">Transactions</h3>
          <p className="text-xs md:text-sm text-white/80">View payment history and analytics</p>
        </Link>
      </div>
    </div>
  );
}
