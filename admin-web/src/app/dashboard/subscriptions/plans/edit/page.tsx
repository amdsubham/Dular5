'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  getSubscriptionPlan,
  saveSubscriptionPlan,
  type SubscriptionPlan,
} from '@/services/subscriptions';
import { Save, ArrowLeft, Plus, Trash2 } from 'lucide-react';
import Link from 'next/link';

export default function PlanEditorPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const planId = searchParams.get('id') || 'new';
  const isNewPlan = planId === 'new';

  const [loading, setLoading] = useState(!isNewPlan);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<Omit<SubscriptionPlan, 'createdAt' | 'updatedAt'>>({
    id: '',
    name: '',
    displayName: '',
    description: '',
    price: 0,
    currency: 'INR',
    duration: 7,
    swipeLimit: 100,
    features: [],
    active: true,
    popular: false,
  });
  const [newFeature, setNewFeature] = useState('');

  useEffect(() => {
    if (!isNewPlan) {
      loadPlan();
    }
  }, [planId]);

  const loadPlan = async () => {
    try {
      setLoading(true);
      const plan = await getSubscriptionPlan(planId);
      if (plan) {
        setFormData(plan);
      } else {
        alert('Plan not found');
        router.push('/dashboard/subscriptions/plans');
      }
    } catch (error) {
      console.error('Error loading plan:', error);
      alert('Failed to load plan');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.id || !formData.name || !formData.displayName) {
      alert('Please fill in all required fields');
      return;
    }

    if (formData.price <= 0) {
      alert('Price must be greater than 0');
      return;
    }

    if (formData.duration <= 0) {
      alert('Duration must be greater than 0');
      return;
    }

    try {
      setSaving(true);
      await saveSubscriptionPlan(formData);
      alert(`Plan ${isNewPlan ? 'created' : 'updated'} successfully!`);
      router.push('/dashboard/subscriptions/plans');
    } catch (error) {
      console.error('Error saving plan:', error);
      alert('Failed to save plan');
    } finally {
      setSaving(false);
    }
  };

  const handleAddFeature = () => {
    if (newFeature.trim()) {
      setFormData({
        ...formData,
        features: [...formData.features, newFeature.trim()],
      });
      setNewFeature('');
    }
  };

  const handleRemoveFeature = (index: number) => {
    setFormData({
      ...formData,
      features: formData.features.filter((_, i) => i !== index),
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading plan...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-3 md:gap-4 mb-4 md:mb-8">
        <Link
          href="/dashboard/subscriptions/plans"
          className="p-1.5 md:p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-4 h-4 md:w-5 md:h-5 text-gray-600" />
        </Link>
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
            {isNewPlan ? 'Create New Plan' : `Edit ${formData.displayName}`}
          </h1>
          <p className="text-sm md:text-base text-gray-600 mt-0.5 md:mt-1">
            {isNewPlan ? 'Set up a new subscription tier' : 'Modify plan details and pricing'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-4 md:space-y-6">
            {/* Basic Information */}
            <div className="bg-white rounded-xl shadow-md p-4 md:p-6">
              <h2 className="text-lg md:text-xl font-semibold text-gray-900 mb-4 md:mb-6">Basic Information</h2>

              <div className="space-y-3 md:space-y-4">
                <div>
                  <label className="block text-xs md:text-sm font-medium text-gray-700 mb-2">
                    Plan ID <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.id}
                    onChange={(e) => setFormData({ ...formData, id: e.target.value })}
                    disabled={!isNewPlan}
                    placeholder="e.g., weekly"
                    className="w-full px-3 md:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-100 text-sm md:text-base"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Unique identifier (lowercase, no spaces). Cannot be changed after creation.
                  </p>
                </div>

                <div>
                  <label className="block text-xs md:text-sm font-medium text-gray-700 mb-2">
                    Internal Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Weekly Plan"
                    className="w-full px-3 md:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm md:text-base"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs md:text-sm font-medium text-gray-700 mb-2">
                    Display Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.displayName}
                    onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                    placeholder="e.g., Weekly Plan"
                    className="w-full px-3 md:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm md:text-base"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs md:text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="e.g., Perfect for regular daters"
                    rows={3}
                    className="w-full px-3 md:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm md:text-base"
                  />
                </div>
              </div>
            </div>

            {/* Pricing & Limits */}
            <div className="bg-white rounded-xl shadow-md p-4 md:p-6">
              <h2 className="text-lg md:text-xl font-semibold text-gray-900 mb-4 md:mb-6">Pricing & Limits</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                <div>
                  <label className="block text-xs md:text-sm font-medium text-gray-700 mb-2">
                    Price (₹) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={formData.price}
                    onChange={(e) =>
                      setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })
                    }
                    min="0"
                    step="1"
                    className="w-full px-3 md:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm md:text-base"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs md:text-sm font-medium text-gray-700 mb-2">Currency</label>
                  <select
                    value={formData.currency}
                    onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                    className="w-full px-3 md:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm md:text-base"
                  >
                    <option value="INR">INR (₹)</option>
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs md:text-sm font-medium text-gray-700 mb-2">
                    Duration (days) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={formData.duration}
                    onChange={(e) =>
                      setFormData({ ...formData, duration: parseInt(e.target.value) || 0 })
                    }
                    min="1"
                    className="w-full px-3 md:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm md:text-base"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs md:text-sm font-medium text-gray-700 mb-2">
                    Daily Swipe Limit <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={formData.swipeLimit}
                    onChange={(e) =>
                      setFormData({ ...formData, swipeLimit: parseInt(e.target.value) || 0 })
                    }
                    min="-1"
                    className="w-full px-3 md:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm md:text-base"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">Use -1 for unlimited swipes</p>
                </div>
              </div>
            </div>

            {/* Features */}
            <div className="bg-white rounded-xl shadow-md p-4 md:p-6">
              <h2 className="text-lg md:text-xl font-semibold text-gray-900 mb-4 md:mb-6">Features</h2>

              <div className="space-y-2 md:space-y-3 mb-3 md:mb-4">
                {formData.features.map((feature, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 md:gap-3 bg-gray-50 px-3 md:px-4 py-2.5 md:py-3 rounded-lg"
                  >
                    <span className="text-green-500 text-sm md:text-base">✓</span>
                    <span className="flex-1 text-gray-900 text-xs md:text-sm">{feature}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveFeature(index)}
                      className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5 md:w-4 md:h-4" />
                    </button>
                  </div>
                ))}
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  value={newFeature}
                  onChange={(e) => setNewFeature(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddFeature())}
                  placeholder="Add a new feature..."
                  className="flex-1 px-3 md:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm md:text-base"
                />
                <button
                  type="button"
                  onClick={handleAddFeature}
                  className="flex items-center justify-center gap-2 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors text-sm md:text-base"
                >
                  <Plus className="w-3.5 h-3.5 md:w-4 md:h-4" />
                  Add
                </button>
              </div>
            </div>
          </div>

          {/* Sidebar - Settings & Preview */}
          <div className="space-y-4 md:space-y-6">
            {/* Settings */}
            <div className="bg-white rounded-xl shadow-md p-4 md:p-6">
              <h2 className="text-base md:text-lg font-semibold text-gray-900 mb-3 md:mb-4">Settings</h2>

              <div className="space-y-3 md:space-y-4">
                <label className="flex items-start gap-2 md:gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.active}
                    onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                    className="w-4 h-4 md:w-5 md:h-5 text-primary-600 rounded focus:ring-primary-500 mt-0.5"
                  />
                  <div>
                    <div className="font-medium text-gray-900 text-sm md:text-base">Active</div>
                    <div className="text-xs md:text-sm text-gray-600">Plan is available for purchase</div>
                  </div>
                </label>

                <label className="flex items-start gap-2 md:gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.popular}
                    onChange={(e) => setFormData({ ...formData, popular: e.target.checked })}
                    className="w-4 h-4 md:w-5 md:h-5 text-primary-600 rounded focus:ring-primary-500 mt-0.5"
                  />
                  <div>
                    <div className="font-medium text-gray-900 text-sm md:text-base">Popular</div>
                    <div className="text-xs md:text-sm text-gray-600">Show "Popular" badge</div>
                  </div>
                </label>
              </div>
            </div>

            {/* Preview */}
            <div className="bg-white rounded-xl shadow-md p-4 md:p-6">
              <h2 className="text-base md:text-lg font-semibold text-gray-900 mb-3 md:mb-4">Preview</h2>

              <div className="border-2 border-primary-200 rounded-lg p-3 md:p-4 bg-primary-50/30">
                {formData.popular && (
                  <div className="text-center mb-2 md:mb-3">
                    <span className="bg-primary-500 text-white text-xs font-bold px-2.5 md:px-3 py-1 rounded-full">
                      POPULAR
                    </span>
                  </div>
                )}

                <h3 className="text-base md:text-lg font-bold text-gray-900 mb-1">{formData.displayName}</h3>
                <p className="text-xs md:text-sm text-gray-600 mb-2 md:mb-3">{formData.description}</p>

                <div className="mb-2 md:mb-3">
                  <span className="text-xl md:text-2xl font-bold text-primary-600">₹{formData.price}</span>
                  <span className="text-xs md:text-sm text-gray-600 ml-1">/ {formData.duration} days</span>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-xs md:text-sm text-gray-700">
                    <span className="text-green-500">✓</span>
                    <span>
                      {formData.swipeLimit === -1 ? 'Unlimited' : formData.swipeLimit} daily swipes
                    </span>
                  </div>
                  {formData.features.slice(0, 3).map((feature, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-xs md:text-sm text-gray-700">
                      <span className="text-green-500">✓</span>
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Actions */}
            <button
              type="submit"
              disabled={saving}
              className="w-full flex items-center justify-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-4 md:px-6 py-2.5 md:py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm md:text-base"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 md:h-5 md:w-5 border-b-2 border-white"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 md:w-5 md:h-5" />
                  {isNewPlan ? 'Create Plan' : 'Save Changes'}
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
