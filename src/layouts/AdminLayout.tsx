import React from 'react';
import {
  LayoutDashboard,
  BarChart3,
  Users,
  UserCog,
  Mail,
  Settings,
  Activity,
  TestTube,
  Cog,
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<any>;
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();

  const navigationItems = [
    { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
    { name: 'Analytics', href: '/admin/analytics', icon: BarChart3 },
    { name: 'Leads', href: '/admin/leads', icon: Users },
    { name: 'Users', href: '/admin/users', icon: UserCog },
    { name: 'Emails', href: '/admin/emails', icon: Mail },
    { name: 'Integrations', href: '/admin/integrations', icon: Settings },
    { name: 'System Health', href: '/admin/system-health', icon: Activity },
    { name: 'Experiments', href: '/admin/experiments', icon: TestTube },
    { name: 'Settings', href: '/admin/settings', icon: Cog },
  ];

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="w-64 bg-gray-800 text-white flex flex-col">
        <div className="p-4 text-lg font-semibold border-b border-gray-700">
          Admin Panel
        </div>
        <nav className="flex-1 p-4">
          <ul>
            {navigationItems.map((item) => (
              <li key={item.name} className="mb-2">
                <Link
                  to={item.href}
                  className={`flex items-center p-2 rounded-md hover:bg-gray-700 ${
                    location.pathname === item.href ? 'bg-gray-700' : ''
                  }`}
                >
                  <item.icon className="w-4 h-4 mr-2" />
                  {item.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-x-hidden overflow-y-auto p-6">
        {children}
      </div>
    </div>
  );
}
