'use client';

import { useEffect, useState } from 'react';
import {
  getSubscriptionConfig,
  updateSubscriptionConfig,
  initializeDefaultPlans,
  type SubscriptionConfig,
} from '@/services/subscriptions';
import { Save, Settings as SettingsIcon, AlertCircle, Plus } from 'lucide-react';

export default function SubscriptionSettingsPage() {
  const [config, setConfig] = useState<SubscriptionConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [initializing, setInitializing] = useState(false);
  const [formData, setFormData] = useState({
    freeTrialSwipeLimit: 5,
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
      <div className="mb-4 md:mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Subscription Settings</h1>
        <p className="text-sm md:text-base text-gray-600 mt-1 md:mt-2">Configure subscription system settings</p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
          {/* Main Settings */}
          <div className="lg:col-span-2 space-y-4 md:space-y-6">
            {/* General Settings */}
            <div className="bg-white rounded-xl shadow-md p-4 md:p-6">
              <div className="flex items-center gap-2 md:gap-3 mb-4 md:mb-6">
                <div className="bg-blue-100 p-1.5 md:p-2 rounded-lg">
                  <SettingsIcon className="w-4 h-4 md:w-5 md:h-5 text-blue-600" />
                </div>
                <h2 className="text-lg md:text-xl font-semibold text-gray-900">General Settings</h2>
              </div>

              <div className="space-y-3 md:space-y-4">
                <div>
                  <label className="block text-xs md:text-sm font-medium text-gray-700 mb-2">
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
                    className="w-full px-3 md:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm md:text-base"
                    required
                  />
                  <p className="text-xs md:text-sm text-gray-600 mt-1.5 md:mt-2">
                    Number of swipes per day for free (non-premium) users
                  </p>
                </div>

                <div className="pt-3 md:pt-4 border-t border-gray-200">
                  <label className="flex items-start gap-2 md:gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.subscriptionEnabled}
                      onChange={(e) =>
                        setFormData({ ...formData, subscriptionEnabled: e.target.checked })
                      }
                      className="w-4 h-4 md:w-5 md:h-5 text-primary-600 rounded focus:ring-primary-500 mt-0.5"
                    />
                    <div>
                      <div className="font-medium text-gray-900 text-sm md:text-base">Enable Subscriptions</div>
                      <div className="text-xs md:text-sm text-gray-600">
                        When disabled, all users get unlimited swipes and no subscription features are shown
                      </div>
                    </div>
                  </label>
                </div>
              </div>
            </div>

            {/* Payment Info */}
            <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-xl p-4 md:p-6">
              <h3 className="font-semibold text-gray-900 mb-2 md:mb-3 text-sm md:text-base">Payment Gateway</h3>
              <p className="text-xs md:text-sm text-gray-700 mb-2 md:mb-3">
                This app uses <strong>Instamojo</strong> for payment processing. Payments are handled securely through their platform.
              </p>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 md:p-4">
                <div className="flex items-start gap-2 md:gap-3">
                  <AlertCircle className="w-4 h-4 md:w-5 md:h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-blue-900 mb-1 text-xs md:text-sm">Instamojo Configuration</h4>
                    <p className="text-xs md:text-sm text-blue-700">
                      Instamojo API credentials and webhook configuration are managed in the Firebase Cloud Functions environment.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar - Info & Actions */}
          <div className="space-y-4 md:space-y-6">
            {/* Current Status */}
            <div className="bg-white rounded-xl shadow-md p-4 md:p-6">
              <h2 className="text-base md:text-lg font-semibold text-gray-900 mb-3 md:mb-4">Current Status</h2>

              <div className="space-y-3 md:space-y-4">
                <div>
                  <div className="text-xs md:text-sm text-gray-600 mb-1">Subscription System</div>
                  <div
                    className={`inline-flex items-center gap-1.5 md:gap-2 px-2.5 md:px-3 py-1 md:py-1.5 rounded-full text-xs md:text-sm font-semibold ${
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
                  <div className="text-xs md:text-sm text-gray-600 mb-1">Payment Gateway</div>
                  <div className="inline-flex items-center gap-1.5 md:gap-2 px-2.5 md:px-3 py-1 md:py-1.5 rounded-full text-xs md:text-sm font-semibold bg-purple-100 text-purple-800">
                    Instamojo
                  </div>
                </div>

                <div className="pt-3 md:pt-4 border-t border-gray-200">
                  <div className="text-xs md:text-sm text-gray-600 mb-1">Last Updated</div>
                  <div className="text-xs md:text-sm font-medium text-gray-900">
                    {config?.updatedAt.toLocaleString() || 'Never'}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">by {config?.updatedBy || 'N/A'}</div>
                </div>
              </div>
            </div>

            {/* Info Notice */}
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 md:p-6">
              <div className="flex items-start gap-2 md:gap-3">
                <AlertCircle className="w-4 h-4 md:w-5 md:h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-amber-900 mb-1.5 md:mb-2 text-sm md:text-base">Important</h3>
                  <ul className="text-xs md:text-sm text-amber-800 space-y-0.5 md:space-y-1">
                    <li>• Changes take effect immediately</li>
                    <li>• Test thoroughly before enabling</li>
                    <li>• Monitor transactions regularly</li>
                    <li>• Subscription data is stored securely</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Initialize Default Plans Button */}
            <button
              type="button"
              onClick={handleInitializeDefaultPlans}
              disabled={initializing}
              className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 md:px-6 py-2.5 md:py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm md:text-base"
            >
              {initializing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 md:h-5 md:w-5 border-b-2 border-white"></div>
                  Initializing...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 md:w-5 md:h-5" />
                  Initialize Default Plans
                </>
              )}
            </button>

            {/* Save Button */}
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
