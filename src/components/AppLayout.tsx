import { NavLink as RouterNavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Building2,
  Users,
  Receipt,
  Bell,
  BarChart3,
  LogOut,
  Menu,
  X,
  ChevronLeft,
  FileText, // <-- NEW: Added this icon for the Ledger!
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useState } from 'react';
import { Button } from '@/components/ui/button';

// ---> ADDED INVOICES TO LANDLORD MENU <---
const landlordNavItems = [
  { title: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { title: 'Properties', path: '/properties', icon: Building2 },
  { title: 'Tenants', path: '/tenants', icon: Users },
  { title: 'Billing', path: '/billing', icon: Receipt },
  { title: 'Invoices', path: '/invoices', icon: FileText }, 
  { title: 'Reports', path: '/reports', icon: BarChart3 },
  { title: 'Notifications', path: '/notifications', icon: Bell },
];

// ---> ADDED INVOICES TO TENANT MENU <---
const tenantNavItems = [
  { title: 'Dashboard', path: '/tenant-dashboard', icon: LayoutDashboard },
  { title: 'Billing History', path: '/billing-history', icon: FileText }, 
  { title: 'Notifications', path: '/tenant-notifications', icon: Bell },
];

export const AppLayout = ({ children }: { children: React.ReactNode }) => {
  const { logout } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  // Read directly from the browser's hard drive!
  const role = localStorage.getItem('user_role');

  const navItems = role === 'tenant' ? tenantNavItems : landlordNavItems;
  const displayName = role === 'tenant' ? 'Tenant Account' : 'Landlord Account';

  return (
    <div className="min-h-screen flex w-full bg-background">
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-foreground/20 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`fixed lg:sticky top-0 left-0 z-50 h-screen bg-sidebar text-sidebar-foreground flex flex-col transition-all duration-300
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          ${collapsed ? 'w-16' : 'w-64'}
        `}
      >
        <div className={`flex items-center gap-3 p-4 border-b border-sidebar-border ${collapsed ? 'justify-center' : ''}`}>
          <div className="h-9 w-9 rounded-lg bg-sidebar-primary flex items-center justify-center flex-shrink-0">
            <Building2 className="h-5 w-5 text-sidebar-primary-foreground" />
          </div>
          {!collapsed && <span className="text-lg font-display font-bold text-sidebar-accent-foreground">PangaRent</span>}
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden ml-auto text-sidebar-foreground hover:text-sidebar-accent-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 py-4 space-y-1 px-2 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <RouterNavLink
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
                  ${isActive
                    ? 'bg-sidebar-accent text-sidebar-primary'
                    : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                  }
                  ${collapsed ? 'justify-center' : ''}
                `}
              >
                <item.icon className="h-5 w-5 flex-shrink-0" />
                {!collapsed && <span>{item.title}</span>}
              </RouterNavLink>
            );
          })}
        </nav>

        <div className="hidden lg:flex px-2 pb-2">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sidebar-foreground hover:bg-sidebar-accent text-sm"
          >
            <ChevronLeft className={`h-4 w-4 transition-transform ${collapsed ? 'rotate-180' : ''}`} />
            {!collapsed && <span>Collapse</span>}
          </button>
        </div>

        <div className={`p-4 border-t border-sidebar-border ${collapsed ? 'flex justify-center' : ''}`}>
          {!collapsed && (
            <div className="mb-3">
              <p className="text-sm font-medium text-sidebar-accent-foreground truncate">{displayName}</p>
              <p className="text-xs text-sidebar-foreground truncate capitalize">{role}</p>
            </div>
          )}
          <button
            onClick={logout}
            className={`flex items-center gap-2 text-sm text-sidebar-foreground hover:text-destructive transition-colors ${collapsed ? '' : 'w-full'}`}
          >
            <LogOut className="h-4 w-4" />
            {!collapsed && <span>Sign out</span>}
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-h-screen">
        <header className="sticky top-0 z-30 bg-card border-b border-border px-4 py-3 flex items-center gap-4">
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setSidebarOpen(true)}>
            <Menu className="h-5 w-5" />
          </Button>
          <div className="flex-1" />
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-accent flex items-center justify-center text-accent-foreground text-sm font-bold">
              {displayName.charAt(0)}
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 md:p-6 lg:p-8 animate-fade-in">
          {children}
        </main>
      </div>
    </div>
  );
};