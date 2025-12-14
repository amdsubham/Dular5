'use client';

import { useEffect, useState } from 'react';
import {
  getSubscriptionPlans,
  saveSubscriptionPlan,
  deleteSubscriptionPlan,
  type SubscriptionPlan,
} from '@/services/subscriptions';
import { Package, Edit, Trash2, Plus, Check, X } from 'lucide-react';
import Link from 'next/link';

export default function PlansManagementPage() {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingPlan, setEditingPlan] = useState<SubscriptionPlan | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    loadPlans();
  }, []);

  const loadPlans = async () => {
    try {
      setLoading(true);
      const plansData = await getSubscriptionPlans();
      setPlans(plansData);
    } catch (error) {
      console.error('Error loading plans:', error);
      alert('Failed to load plans');
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePlan = async (planId: string) => {
    if (!confirm(`Are you sure you want to delete the ${planId} plan?`)) {
      return;
    }

    try {
      await deleteSubscriptionPlan(planId);
      alert('Plan deleted successfully!');
      loadPlans();
    } catch (error) {
      console.error('Error deleting plan:', error);
      alert('Failed to delete plan');
    }
  };

  const handleToggleActive = async (plan: SubscriptionPlan) => {
    try {
      await saveSubscriptionPlan({
        ...plan,
        active: !plan.active,
      });
      alert(`Plan ${plan.active ? 'deactivated' : 'activated'} successfully!`);
      loadPlans();
    } catch (error) {
      console.error('Error toggling plan status:', error);
      alert('Failed to update plan status');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading plans...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Subscription Plans</h1>
          <p className="text-gray-600 mt-2">Manage your subscription tiers and pricing</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add New Plan
        </button>
      </div>

      {/* Plans Table */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Plan
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Price
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Duration
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Swipe Limit
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {plans.map((plan) => (
              <tr key={plan.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="bg-primary-100 p-2 rounded-lg">
                      <Package className="w-5 h-5 text-primary-600" />
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">{plan.displayName}</div>
                      <div className="text-sm text-gray-600">{plan.description}</div>
                      {plan.popular && (
                        <span className="inline-block bg-yellow-100 text-yellow-800 text-xs font-semibold px-2 py-0.5 rounded mt-1">
                          POPULAR
                        </span>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="font-bold text-gray-900">₹{plan.price}</div>
                  <div className="text-sm text-gray-600">{plan.currency}</div>
                </td>
                <td className="px-6 py-4">
                  <div className="font-medium text-gray-900">{plan.duration} days</div>
                </td>
                <td className="px-6 py-4">
                  <div className="font-medium text-gray-900">
                    {plan.swipeLimit === -1 ? 'Unlimited' : plan.swipeLimit}
                  </div>
                  <div className="text-sm text-gray-600">per day</div>
                </td>
                <td className="px-6 py-4">
                  <button
                    onClick={() => handleToggleActive(plan)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                      plan.active
                        ? 'bg-green-100 text-green-800 hover:bg-green-200'
                        : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                    } transition-colors`}
                  >
                    {plan.active ? (
                      <>
                        <Check className="w-3 h-3" />
                        Active
                      </>
                    ) : (
                      <>
                        <X className="w-3 h-3" />
                        Inactive
                      </>
                    )}
                  </button>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/dashboard/subscriptions/plans/${plan.id}`}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Edit Plan"
                    >
                      <Edit className="w-4 h-4" />
                    </Link>
                    <button
                      onClick={() => handleDeletePlan(plan.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete Plan"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {plans.length === 0 && (
          <div className="text-center py-12">
            <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-4">No subscription plans found</p>
            <button
              onClick={() => setShowAddModal(true)}
              className="text-primary-600 hover:text-primary-700 font-medium"
            >
              Create your first plan →
            </button>
          </div>
        )}
      </div>

      {/* Features Summary */}
      <div className="mt-6 bg-white rounded-xl shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Plan Features</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <div key={plan.id} className="border border-gray-200 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-3">{plan.displayName}</h3>
              <ul className="space-y-2">
                {plan.features.map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                    <span className="text-green-500 mt-0.5">✓</span>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Add Plan Modal (placeholder - you can enhance this) */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-8 max-w-md w-full">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Add New Plan</h2>
            <p className="text-gray-600 mb-6">
              Use the individual plan editor to create a new subscription plan.
            </p>
            <div className="flex gap-3">
              <Link
                href="/dashboard/subscriptions/plans/new"
                className="flex-1 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg text-center transition-colors"
              >
                Go to Plan Editor
              </Link>
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
