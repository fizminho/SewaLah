import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../hooks/useAuth';
import { db } from '../../lib/client';
import EarlyAccessBanner from './EarlyAccessBanner';
import FeedbackButton from './FeedbackButton';
import LanguageSwitcher from './LanguageSwitcher';

interface NavItem {
  label: string;
  path: string;
  icon: string;
  badge?: number;
}

const EnhancedLayout: React.FC = () => {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [pendingPayments, setPendingPayments] = useState(0);
  const [overdueInvoices, setOverdueInvoices] = useState(0);
  const [renterInvoices, setRenterInvoices] = useState(0);
  const [earlyAccessMode, setEarlyAccessMode] = useState(false);

  // earlyAccessMode disabled - no backend config endpoint
  useEffect(() => { setEarlyAccessMode(false); }, []);

  useEffect(() => {
    if (!user) return;
    const fetchAlerts = async () => {
      if (user.role === 'Owner') {
        const [paymentsRes, invoicesRes] = await Promise.all([
          db.from('payments').select('id', { count: 'exact' }).eq('status', 'Pending'),
          db.from('invoices').select('id', { count: 'exact' }).eq('status', 'Overdue').eq('is_deleted', false),
        ]);
        setPendingPayments(paymentsRes.count ?? 0);
        setOverdueInvoices(invoicesRes.count ?? 0);
      } else if (user.role === 'Renter') {
        const { count } = await db.from('invoices')
          .select('id', { count: 'exact' })
          .eq('renter_id', user.id)
          .in('status', ['Overdue', 'Issued'])
          .eq('is_deleted', false);
        setRenterInvoices(count ?? 0);
      }
    };
    fetchAlerts();
  }, [user]);

  const ownerNavItems: NavItem[] = [
    { label: t('dashboard'), path: '/owner', icon: '📊' },
    { label: t('properties'), path: '/owner/properties', icon: '🏢' },
    { label: t('renters'), path: '/owner/renters', icon: '👥' },
    { label: t('invoices'), path: '/owner/invoices', icon: '📄', badge: overdueInvoices },
    { label: t('payments'), path: '/owner/payments', icon: '💳', badge: pendingPayments },
  ];

  const renterNavItems: NavItem[] = [
    { label: t('dashboard'), path: '/renter', icon: '📊' },
    { label: t('invoices'), path: '/renter/invoices', icon: '📄', badge: renterInvoices },
  ];

  const navItems = user?.role === 'Owner' ? ownerNavItems : renterNavItems;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="flex flex-col h-screen">
      {earlyAccessMode && <EarlyAccessBanner />}
      <div className="flex flex-1 bg-[#f5f5f5] overflow-hidden">
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0 fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transition-transform duration-300 flex flex-col shadow-lg lg:shadow-sm`}
      >
        {/* Logo */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-800 rounded-lg flex items-center justify-center text-white font-bold text-lg">
              S
            </div>
            <div>
              <h1 className="text-lg font-bold text-blue-600">Sewalah.Net</h1>
              <p className="text-xs text-gray-600">Rental Management</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {navItems.map((item) => (
            <button
              key={item.path}
              onClick={() => {
                navigate(item.path);
                setSidebarOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                isActive(item.path)
                  ? 'bg-blue-50 text-blue-600 border-l-4 border-blue-600'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <span className="text-xl">{item.icon}</span>
              <span className="flex-1 text-left text-sm font-medium">{item.label}</span>
              {item.badge !== undefined && item.badge > 0 && (
                <span className="bg-red-500 text-white text-xs rounded-full min-w-[20px] h-5 flex items-center justify-center font-semibold px-1.5">
                  {item.badge}
                </span>
              )}
            </button>
          ))}
        </nav>

        {/* Close button for mobile */}
        <div className="p-4 border-t border-gray-200 lg:hidden">
          <button
            onClick={() => setSidebarOpen(false)}
            className="w-full flex items-center justify-center py-2 text-gray-600 hover:text-blue-600 transition-colors"
          >
            {t('closeMenu')}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 shadow-sm">
          <div className="flex items-center justify-between px-4 lg:px-8 py-4">
            <div className="flex items-center gap-4">
              {/* Mobile Menu Button */}
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 text-gray-600 hover:text-blue-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <div>
                <h2 className="text-xl lg:text-2xl font-bold text-gray-900">
                  {navItems.find((item) => isActive(item.path))?.label || 'Dashboard'}
                </h2>
                <p className="text-xs lg:text-sm text-gray-600 hidden sm:block">
                  {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
              </div>
            </div>

            {/* User Menu */}
            <div className="flex items-center gap-3">
              <LanguageSwitcher />
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 lg:gap-3 px-2 lg:px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="w-8 h-8 lg:w-10 lg:h-10 bg-gradient-to-br from-teal-400 to-teal-600 rounded-full flex items-center justify-center text-white font-semibold text-sm lg:text-base">
                    {user?.fullName?.charAt(0).toUpperCase() ?? user?.email?.charAt(0).toUpperCase()}
                  </div>
                  <div className="text-left hidden md:block">
                    <p className="text-sm font-medium text-gray-900 truncate max-w-[150px]">{user?.fullName || user?.email}</p>
                    <p className="text-xs text-gray-600">{user?.role}</p>
                  </div>
                </button>

                {/* Dropdown Menu */}
                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      {t('logout')}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto">
          <div className="p-4 lg:p-8">
            <Outlet />
          </div>
        </main>
      </div>
      {earlyAccessMode && <FeedbackButton />}
    </div>
    </div>
  );
};

export default EnhancedLayout;
