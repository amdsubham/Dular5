'use client';

import { useEffect, useState } from 'react';
import { getUserStats } from '@/services/users';
import { Users, UserCheck, AlertTriangle } from 'lucide-react';
import Link from 'next/link';

interface Stats {
  total: number;
  today: number;
  deleteRequests: number;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats>({ total: 0, today: 0, deleteRequests: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const data = await getUserStats();
      setStats(data);
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: 'Total Users',
      value: stats.total,
      icon: Users,
      color: 'bg-blue-500',
      link: '/dashboard/users'
    },
    {
      title: 'New Today',
      value: stats.today,
      icon: UserCheck,
      color: 'bg-green-500',
      link: '/dashboard/users?filter=today'
    },
    {
      title: 'Delete Requests',
      value: stats.deleteRequests,
      icon: AlertTriangle,
      color: 'bg-red-500',
      link: '/dashboard/users?filter=deleteRequests'
    }
  ];

  if (loading) {
    return <div className="text-center py-8">Loading statistics...</div>;
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <Link key={card.title} href={card.link}>
              <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm font-medium">{card.title}</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">{card.value}</p>
                  </div>
                  <div className={`${card.color} p-4 rounded-full`}>
                    <Icon className="w-8 h-8 text-white" />
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="space-y-3">
            <Link
              href="/dashboard/users?action=create"
              className="block w-full bg-primary-600 hover:bg-primary-700 text-white font-medium py-3 px-4 rounded-lg transition-colors text-center"
            >
              Create New User
            </Link>
            <Link
              href="/dashboard/notifications"
              className="block w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors text-center"
            >
              Send Notification
            </Link>
            <Link
              href="/dashboard/users"
              className="block w-full bg-gray-600 hover:bg-gray-700 text-white font-medium py-3 px-4 rounded-lg transition-colors text-center"
            >
              View All Users
            </Link>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">System Info</h2>
          <div className="space-y-3 text-gray-700">
            <div className="flex justify-between py-2 border-b">
              <span className="font-medium">Platform</span>
              <span>Dular Admin v1.0</span>
            </div>
            <div className="flex justify-between py-2 border-b">
              <span className="font-medium">Database</span>
              <span>Firebase Firestore</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="font-medium">Status</span>
              <span className="text-green-600 font-semibold">Active</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
