
// ============================================
// FILE: components/sidebar/SuperAdminSidebar.tsx
// ============================================
'use client'
import React, { useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Store, 
  Users, 
  ShoppingBag, 
  DollarSign, 
  BarChart3, 
  Settings, 
  Bell, 
  MessageSquare, 
  FileText, 
  MapPin, 
  Tag, 
  UserCog, 
  ChevronDown, 
  ChevronRight, 
  LogOut, 
  Menu,
  Loader2
} from 'lucide-react';
//  import { getCurrentUser } from '@/lib/getUserFromServer';
import db from '@workspace/database'

// Navigation configuration
const navigationConfig = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
    path: '/dashboard',
  },
  {
    id: 'restaurants',
    label: 'Restaurants',
    icon: Store,
    path: '/restaurants',
    submenu: [
      { id: 'all-restaurants', label: 'All Restaurants', path: '/restaurants/applications' },
      { id: 'pending-approval', label: 'Pending Approval', path: '/restaurants/applications', badge: 12 },
      { id: 'categories', label: 'Categories', path: '/restaurants/categories' },
      { id: 'cuisines', label: 'Cuisines', path: '/restaurants/cuisines' },
    ]
  },
  {
    id: 'orders',
    label: 'Orders',
    icon: ShoppingBag,
    path: '/orders',
    badge: 24,
    submenu: [
      { id: 'all-orders', label: 'All Orders', path: '/orders/all' },
      { id: 'active-orders', label: 'Active Orders', path: '/orders/active', badge: 8 },
      { id: 'completed', label: 'Completed', path: '/orders/completed' },
      { id: 'cancelled', label: 'Cancelled', path: '/orders/cancelled' },
    ]
  },
  {
    id: 'users',
    label: 'Users',
    icon: Users,
    path: '/users',
    submenu: [
      { id: 'customers', label: 'Customers', path: '/users/customers' },
      { id: 'delivery-partners', label: 'Delivery Partners', path: '/users/delivery' },
      { id: 'restaurant-owners', label: 'Restaurant Owners', path: '/users/owners' },
    ]
  },
  {
    id: 'payments',
    label: 'Payments',
    icon: DollarSign,
    path: '/payments',
    submenu: [
      { id: 'transactions', label: 'Transactions', path: '/payments/transactions' },
      { id: 'payouts', label: 'Payouts', path: '/payments/payouts' },
      { id: 'refunds', label: 'Refunds', path: '/payments/refunds' },
    ]
  },
  {
    id: 'analytics',
    label: 'Analytics',
    icon: BarChart3,
    path: '/analytics',
    submenu: [
      { id: 'revenue', label: 'Revenue', path: '/analytics/revenue' },
      { id: 'performance', label: 'Performance', path: '/analytics/performance' },
      { id: 'trends', label: 'Trends', path: '/analytics/trends' },
    ]
  },
  {
    id: 'promotions',
    label: 'Promotions',
    icon: Tag,
    path: '/promotions',
    submenu: [
      { id: 'coupons', label: 'Coupons', path: '/promotions/coupons' },
      { id: 'offers', label: 'Offers', path: '/promotions/offers' },
      { id: 'campaigns', label: 'Campaigns', path: '/promotions/campaigns' },
    ]
  },
  {
    id: 'locations',
    label: 'Locations',
    icon: MapPin,
    path: '/locations',
  },
  {
    id: 'reviews',
    label: 'Reviews & Ratings',
    icon: MessageSquare,
    path: '/reviews',
    badge: 5,
  },
  {
    id: 'reports',
    label: 'Reports',
    icon: FileText,
    path: '/reports',
  },
  {
    id: 'notifications',
    label: 'Notifications',
    icon: Bell,
    path: '/notifications',
  },
  {
    id: 'admins',
    label: 'Admin Management',
    icon: UserCog,
    path: '/admins',
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: Settings,
    path: '/settings',
  },
];

type NavItemProps = {
  item: {
    id: string;
    label: string;
    icon?: React.ElementType;
    path?: string;
    badge?: number;
    submenu?: Array<{
      id: string;
      label: string;
      path: string;
      badge?: number;
    }>;
  };
  isSubmenuItem?: boolean;
  activeItem: string;
  expandedItems: Record<string, boolean>;
  isCollapsed: boolean;
  onItemClick: (id: string, hasSubmenu: boolean, path?: string) => void;
};

const NavItem: React.FC<NavItemProps> = ({ 
  item, 
  isSubmenuItem = false, 
  activeItem, 
  expandedItems, 
  isCollapsed, 
  onItemClick 
}) => {
  const Icon = item.icon;
  const isActive = activeItem === item.id;
  const isExpanded = expandedItems[item.id];
  const hasSubmenu = item.submenu && item.submenu.length > 0;

  return (
    <div>
      <button
        onClick={() => onItemClick(item.id, !!hasSubmenu, item.path)}
        className={`w-full flex items-center justify-between px-4 py-3 text-sm font-medium transition-all duration-200 ${
          isActive
            ? 'bg-red-50 text-red-600 border-r-4 border-red-600'
            : 'text-gray-700 hover:bg-gray-50'
        } ${isSubmenuItem ? 'pl-12' : ''} ${!isCollapsed ? 'lg:px-4' : 'lg:justify-center lg:px-2'} ${isSubmenuItem ? '' : 'justify-center lg:justify-between'}`}
      >
        <div className="flex items-center gap-3 min-w-0 flex-1 justify-center lg:justify-start">
          {Icon && <Icon className="flex-shrink-0 w-5 h-5" />}
          <span className="truncate hidden lg:inline">{(!isCollapsed || isSubmenuItem) && item.label}</span>
          {item.badge && (
            <span className="ml-auto bg-red-500 text-white text-xs px-2 py-0.5 rounded-full hidden lg:inline">
              {(!isCollapsed || isSubmenuItem) && item.badge}
            </span>
          )}
        </div>
        {hasSubmenu && (
          <div className="ml-2 hidden lg:block">
            {(!isCollapsed || isSubmenuItem) && (isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />)}
          </div>
        )}
      </button>
      
      {hasSubmenu && isExpanded && (
        <div className="bg-gray-50 hidden lg:block">
          {(!isCollapsed || isSubmenuItem) && item.submenu?.map((subItem) => (
            <NavItem 
              key={subItem.id} 
              item={subItem} 
              isSubmenuItem 
              activeItem={activeItem}
              expandedItems={expandedItems}
              isCollapsed={isCollapsed}
              onItemClick={onItemClick}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const SuperAdminSidebar: React.FC = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  
  const [activeItem, setActiveItem] = useState('dashboard');
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const toggleSubmenu = (id: string) => {
    setExpandedItems(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const handleItemClick = (id: string, hasSubmenu: boolean, path?: string) => {
    if (hasSubmenu) {
      toggleSubmenu(id);
    } else {
      setActiveItem(id);
      if (path) {
        router.push(path);
      }
    }
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await signOut({ 
        callbackUrl: '/auth/login',
        redirect: true 
      });
    } catch (error) {
      console.error('Logout error:', error);
      setIsLoggingOut(false);
    }
  };

  // Get user initials
  const getUserInitials = () => {
    if (!session?.user?.name) return 'SA';
    return session.user.name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // const profile =  getCurrentUser()
  // if(!profile) return 

//   const restaurants= await db.restaurantApplication.findMany({
// where:{
  
// }
//   })


  
  // Loading state
  if (status === 'loading') {
    return (
      <div className="fixed top-0 left-0 h-screen w-20 lg:w-72 bg-white border-r border-gray-200 z-40 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-red-500" />
      </div>
    );
  }

    if (!session?.user || session.user.role !== 'SUPERADMIN') {
    return null; // or redirect
  }

  return (
    <>
      {/* Sidebar - Always visible, icon-only on mobile, full on desktop */}
      <div
        className={`fixed top-0 left-0 h-screen bg-white border-r border-gray-200 z-40 transition-all duration-300 flex flex-col ${
          isCollapsed ? 'w-20' : 'w-20 lg:w-72'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-center lg:justify-between p-4 border-b border-gray-200">
          <div className="w-10 h-10 bg-red-500 rounded-lg flex items-center justify-center flex-shrink-0">
            <span className="text-white font-bold text-xl">Z</span>
          </div>
          <div className="hidden lg:block lg:flex-1 lg:ml-2">
            {!isCollapsed && (
              <div>
                <h1 className="text-lg font-bold text-gray-900">Zomato</h1>
                <p className="text-xs text-gray-500">Super Admin</p>
              </div>
            )}
          </div>
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-2 hover:bg-gray-100 rounded-lg hidden lg:block"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
          {navigationConfig.map(item => (
            <NavItem 
              key={item.id} 
              item={item} 
              activeItem={activeItem}
              expandedItems={expandedItems}
              isCollapsed={isCollapsed}
              onItemClick={handleItemClick}
            />
          ))}
        </nav>

        {/* Footer */}
        <div className="border-t border-gray-200">
          <div className="p-4 hidden lg:block">
            {!isCollapsed && session?.user && (
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-orange-500 rounded-full flex items-center justify-center flex-shrink-0">
                  {session.user.image ? (
                    <img 
                      src={session.user.image} 
                      alt={session.user.name || 'User'} 
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <span className="text-white font-semibold text-sm">
                      {getUserInitials()}
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">
                    {session.user.name || 'Super Admin'}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {session.user.email || 'admin@zomato.com'}
                  </p>
                </div>
              </div>
            )}
          </div>
          
          {/* Mobile profile */}
          <div className="lg:hidden p-4 flex justify-center">
            <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-orange-500 rounded-full flex items-center justify-center">
              {session?.user?.image ? (
                <img 
                  src={session.user.image} 
                  alt={session.user.name || 'User'} 
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <span className="text-white font-semibold text-sm">
                  {getUserInitials()}
                </span>
              )}
            </div>
          </div>

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors justify-center lg:justify-start disabled:opacity-50 disabled:cursor-not-allowed ${
              isCollapsed ? 'lg:justify-center' : ''
            }`}
          >
            {isLoggingOut ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <LogOut className="w-5 h-5" />
            )}
            <span className="hidden lg:inline">
              {!isCollapsed && (isLoggingOut ? 'Logging out...' : 'Logout')}
            </span>
          </button>
        </div>
      </div>
    </>
  );
};

export default SuperAdminSidebar;

// ============================================
// FILE: app/dashboard/layout.tsx
// ============================================
// import SuperAdminSidebar from '@/components/sidebar/SuperAdminSidebar';

// export default function DashboardLayout({
//   children,
// }: {
//   children: React.ReactNode;
// }) {
//   return (
//     <div className="flex min-h-screen bg-gray-50">
//       <SuperAdminSidebar />
//       <main className="flex-1 ml-20 lg:ml-72 transition-all duration-300">
//         {children}
//       </main>
//     </div>
//   );
// }