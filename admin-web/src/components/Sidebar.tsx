'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Users, Bell, LogOut, Home, CreditCard, Package, Settings, Upload, Menu, X } from 'lucide-react';
import { signOutAdmin } from '@/services/auth';

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleSignOut = async () => {
    const result = await signOutAdmin();
    if (result.success) {
      router.push('/');
    }
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  const navItems = [
    { href: '/dashboard', icon: Home, label: 'Dashboard' },
    { href: '/dashboard/users', icon: Users, label: 'Users' },
    { href: '/dashboard/notifications', icon: Bell, label: 'Notifications' },
    { href: '/dashboard/migrate-users', icon: Upload, label: 'Migrate Users' },
  ];

  const subscriptionItems = [
    { href: '/dashboard/subscriptions', icon: CreditCard, label: 'Subscriptions' },
    { href: '/dashboard/subscriptions/plans', icon: Package, label: 'Plans' },
    { href: '/dashboard/subscriptions/settings', icon: Settings, label: 'Settings' },
  ];

  const SidebarContent = () => (
    <>
      <div className="p-4 md:p-6">
        <h1 className="text-xl md:text-2xl font-bold">Dular Admin</h1>
      </div>

      <nav className="flex-1 px-2 md:px-4 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={closeMobileMenu}
              className={`flex items-center gap-3 px-3 md:px-4 py-2.5 md:py-3 rounded-lg mb-2 transition-colors ${
                isActive
                  ? 'bg-primary-600 text-white'
                  : 'text-gray-300 hover:bg-gray-800'
              }`}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              <span className="text-sm md:text-base">{item.label}</span>
            </Link>
          );
        })}

        {/* Subscription Section */}
        <div className="mt-6 mb-3 px-3 md:px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
          Premium & Revenue
        </div>
        {subscriptionItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={closeMobileMenu}
              className={`flex items-center gap-3 px-3 md:px-4 py-2.5 md:py-3 rounded-lg mb-2 transition-colors ${
                isActive
                  ? 'bg-primary-600 text-white'
                  : 'text-gray-300 hover:bg-gray-800'
              }`}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              <span className="text-sm md:text-base">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-3 md:p-4">
        <button
          onClick={handleSignOut}
          className="flex items-center gap-3 px-3 md:px-4 py-2.5 md:py-3 rounded-lg w-full text-gray-300 hover:bg-gray-800 transition-colors"
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          <span className="text-sm md:text-base">Sign Out</span>
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className="md:hidden fixed top-4 left-4 z-50 p-2 bg-gray-900 text-white rounded-lg shadow-lg hover:bg-gray-800 transition-colors"
        aria-label="Toggle menu"
      >
        {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-30"
          onClick={closeMobileMenu}
        />
      )}

      {/* Desktop Sidebar */}
      <div className="hidden md:flex w-64 bg-gray-900 text-white min-h-screen flex-col fixed left-0 top-0">
        <SidebarContent />
      </div>

      {/* Mobile Sidebar Drawer */}
      <div
        className={`md:hidden fixed left-0 top-0 h-full w-64 bg-gray-900 text-white flex flex-col z-40 transform transition-transform duration-300 ease-in-out ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <SidebarContent />
      </div>
    </>
  );
}
