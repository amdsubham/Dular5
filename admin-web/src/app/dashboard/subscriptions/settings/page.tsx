'use client';

import { useEffect, useState } from 'react';
import {
  getSubscriptionConfig,
  updateSubscriptionConfig,
  initializeDefaultPlans,
  type SubscriptionConfig,
} from '@/services/subscriptions';
import { Save, Eye, EyeOff, Key, Settings as SettingsIcon, AlertCircle, Plus } from 'lucide-react';

export default function SubscriptionSettingsPage() {
  const [config, setConfig] = useState<SubscriptionConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [initializing, setInitializing] = useState(false);
  const [showSecret, setShowSecret] = useState(false);
  const [showWorkingKey, setShowWorkingKey] = useState(false);
  const [formData, setFormData] = useState({
    freeTrialSwipeLimit: 5,
    ccavenueAccessCode: '',
    ccavenueMerchantId: '',
    ccavenueWorkingKey: '',
    subscriptionEnabled: true,
    updatedBy: 'admin',
  });

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      setLoading(true);
      const configData = await getSubscriptionConfig();
      if (configData) {
        setConfig(configData);
        setFormData({
          freeTrialSwipeLimit: configData.freeTrialSwipeLimit,
          ccavenueAccessCode: configData.ccavenueAccessCode,
          ccavenueMerchantId: configData.ccavenueMerchantId,
          ccavenueWorkingKey: configData.ccavenueWorkingKey,
          subscriptionEnabled: configData.subscriptionEnabled,
          updatedBy: 'admin',
        });
      }
    } catch (error) {
      console.error('Error loading config:', error);
      alert('Failed to load configuration');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.freeTrialSwipeLimit < 0) {
      alert('Free trial limit cannot be negative');
      return;
    }

    if (!formData.ccavenueAccessCode || !formData.ccavenueMerchantId || !formData.ccavenueWorkingKey) {
      alert('CCAvenue credentials are required');
      return;
    }

    try {
      setSaving(true);
      await updateSubscriptionConfig(formData);
      alert('Configuration updated successfully!');
      loadConfig();
    } catch (error) {
      console.error('Error updating config:', error);
      alert('Failed to update configuration');
    } finally {
      setSaving(false);
    }
  };

  const handleInitializeDefaultPlans = async () => {
    if (!confirm('Initialize default subscription plans? This will create 3 default plans (Daily, Weekly, Monthly) if they don\'t already exist.')) {
      return;
    }

    try {
      setInitializing(true);
      const result = await initializeDefaultPlans();

      if (result.success) {
        alert(`✅ ${result.message}`);
      } else {
        alert(`❌ ${result.message}\n\nError: ${result.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error initializing plans:', error);
      alert('Failed to initialize default plans. Check console for details.');
    } finally {
      setInitializing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Subscription Settings</h1>
        <p className="text-gray-600 mt-2">Configure subscription system and payment gateway</p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Settings */}
          <div className="lg:col-span-2 space-y-6">
            {/* General Settings */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="bg-blue-100 p-2 rounded-lg">
                  <SettingsIcon className="w-5 h-5 text-blue-600" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900">General Settings</h2>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Free Trial Swipe Limit <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={formData.freeTrialSwipeLimit}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        freeTrialSwipeLimit: parseInt(e.target.value) || 0,
                      })
                    }
                    min="0"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    required
                  />
                  <p className="text-sm text-gray-600 mt-2">
                    Number of swipes per day for free (non-premium) users
                  </p>
                </div>

                <div className="pt-4 border-t border-gray-200">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.subscriptionEnabled}
                      onChange={(e) =>
                        setFormData({ ...formData, subscriptionEnabled: e.target.checked })
                      }
                      className="w-5 h-5 text-primary-600 rounded focus:ring-primary-500"
                    />
                    <div>
                      <div className="font-medium text-gray-900">Enable Subscriptions</div>
                      <div className="text-sm text-gray-600">
                        Allow users to purchase premium subscriptions
                      </div>
                    </div>
                  </label>
                </div>
              </div>
            </div>

            {/* CCAvenue Configuration */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="bg-purple-100 p-2 rounded-lg">
                  <Key className="w-5 h-5 text-purple-600" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900">CCAvenue Configuration</h2>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Merchant ID <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.ccavenueMerchantId}
                    onChange={(e) => setFormData({ ...formData, ccavenueMerchantId: e.target.value })}
                    placeholder="2718018"
                    className="w-full px-4 py-2 font-mono text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    required
                  />
                  <p className="text-sm text-gray-600 mt-2">
                    Your CCAvenue Merchant ID
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Access Code <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showSecret ? 'text' : 'password'}
                      value={formData.ccavenueAccessCode}
                      onChange={(e) =>
                        setFormData({ ...formData, ccavenueAccessCode: e.target.value })
                      }
                      placeholder="AVNF94KH56AC67FNCA"
                      className="w-full px-4 py-2 pr-12 font-mono text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowSecret(!showSecret)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    >
                      {showSecret ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  <p className="text-sm text-gray-600 mt-2">
                    Your CCAvenue Access Code for your application
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Working Key <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showWorkingKey ? 'text' : 'password'}
                      value={formData.ccavenueWorkingKey}
                      onChange={(e) =>
                        setFormData({ ...formData, ccavenueWorkingKey: e.target.value })
                      }
                      placeholder="E6FF0434306EFA9066D8BFB4C55C8F81"
                      className="w-full px-4 py-2 pr-12 font-mono text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowWorkingKey(!showWorkingKey)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    >
                      {showWorkingKey ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  <p className="text-sm text-gray-600 mt-2">
                    Your CCAvenue Working Key (kept confidential)
                  </p>
                </div>

                {/* Info Alert */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-blue-900 mb-1">CCAvenue Integration</h4>
                      <p className="text-sm text-blue-700">
                        Payments will be processed securely through CCAvenue gateway. Make sure to test with test credentials before going live.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Getting CCAvenue Keys */}
            <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-xl p-6">
              <h3 className="font-semibold text-gray-900 mb-3">How to Get CCAvenue Keys</h3>
              <ol className="space-y-2 text-sm text-gray-700">
                <li className="flex gap-2">
                  <span className="font-semibold">1.</span>
                  <span>
                    Go to{' '}
                    <a
                      href="https://www.ccavenue.com/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary-600 hover:underline"
                    >
                      CCAvenue Dashboard
                    </a>{' '}
                    and create a merchant account
                  </span>
                </li>
                <li className="flex gap-2">
                  <span className="font-semibold">2.</span>
                  <span>Complete your KYC verification</span>
                </li>
                <li className="flex gap-2">
                  <span className="font-semibold">3.</span>
                  <span>Navigate to Settings → Generate Working Key</span>
                </li>
                <li className="flex gap-2">
                  <span className="font-semibold">4.</span>
                  <span>
                    Get your Merchant ID, Access Code, and Working Key
                  </span>
                </li>
                <li className="flex gap-2">
                  <span className="font-semibold">5.</span>
                  <span>Copy all credentials and paste them above</span>
                </li>
              </ol>
            </div>
          </div>

          {/* Sidebar - Info & Actions */}
          <div className="space-y-6">
            {/* Current Status */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Current Status</h2>

              <div className="space-y-4">
                <div>
                  <div className="text-sm text-gray-600 mb-1">Subscription System</div>
                  <div
                    className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-semibold ${
                      formData.subscriptionEnabled
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    <div
                      className={`w-2 h-2 rounded-full ${
                        formData.subscriptionEnabled ? 'bg-green-600' : 'bg-gray-600'
                      }`}
                    ></div>
                    {formData.subscriptionEnabled ? 'Enabled' : 'Disabled'}
                  </div>
                </div>

                <div>
                  <div className="text-sm text-gray-600 mb-1">Payment Gateway</div>
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-semibold bg-purple-100 text-purple-800">
                    <Key className="w-3 h-3" />
                    CCAvenue
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-200">
                  <div className="text-sm text-gray-600 mb-1">Last Updated</div>
                  <div className="text-sm font-medium text-gray-900">
                    {config?.updatedAt.toLocaleString() || 'Never'}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">by {config?.updatedBy || 'N/A'}</div>
                </div>
              </div>
            </div>

            {/* Security Notice */}
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-amber-900 mb-2">Security Notice</h3>
                  <ul className="text-sm text-amber-800 space-y-1">
                    <li>• Never share your API secrets</li>
                    <li>• Keep your working key secure</li>
                    <li>• Test integration before going live</li>
                    <li>• Regularly monitor transactions</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Initialize Default Plans Button */}
            <button
              type="button"
              onClick={handleInitializeDefaultPlans}
              disabled={initializing}
              className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {initializing ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Initializing...
                </>
              ) : (
                <>
                  <Plus className="w-5 h-5" />
                  Initialize Default Plans
                </>
              )}
            </button>

            {/* Save Button */}
            <button
              type="submit"
              disabled={saving}
              className="w-full flex items-center justify-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  Save Settings
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
