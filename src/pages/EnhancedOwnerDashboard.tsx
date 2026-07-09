import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, StatCard, Spinner, Alert } from '../components/Common/UIComponents';
import { formatCurrency } from '../utils/currencyUtils';
import { formatDateTime } from '../utils/dateUtils';
import { dashboardService, OwnerQuickStats, OwnerThisMonth } from '../services/dashboardService';
import CreatePropertyModal from '../components/Owner/CreatePropertyModal';
import CreateRenterModal from '../components/Owner/CreateRenterModal';
import CreateInvoiceModal from '../components/Owner/CreateInvoiceModal';
import RecordPaymentModal from '../components/Owner/RecordPaymentModal';
import { renterService } from '../services/renterService';
import { invoiceService } from '../services/invoiceService';
import { paymentService } from '../services/paymentService';
import { propertyService } from '../services/propertyService';

const EnhancedOwnerDashboard: React.FC = () => {
  const { t } = useTranslation();
  const [quickStats, setQuickStats] = useState<OwnerQuickStats | null>(null);
  const [monthStats, setMonthStats] = useState<OwnerThisMonth | null>(null);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showPropertyModal, setShowPropertyModal] = useState(false);
  const [showRenterModal, setShowRenterModal] = useState(false);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const [quick, month, activity] = await Promise.all([
          dashboardService.getOwnerQuickStats(),
          dashboardService.getOwnerThisMonth(),
          dashboardService.getOwnerRecentActivity(),
        ]);
        setQuickStats(quick);
        setMonthStats(month);
        setRecentActivity(activity || []);
        setError(null);
      } catch (err) {
        setError(t('failedToLoadDashboard'));
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const refreshDashboard = async () => {
    const [quick, month, activity] = await Promise.all([
      dashboardService.getOwnerQuickStats(),
      dashboardService.getOwnerThisMonth(),
      dashboardService.getOwnerRecentActivity(),
    ]);
    setQuickStats(quick);
    setMonthStats(month);
    setRecentActivity(activity || []);
  };

  const handleCreateProperty = async (propertyData: any) => {
    try {
      await propertyService.create(propertyData);
      setShowPropertyModal(false);
      setError(null);
      await refreshDashboard();
    } catch (err: any) {
      setError(err.message || 'Failed to create property');
    }
  };

  const handleCreateRenter = async (renterData: any) => {
    try {
      const { fullName, email, phone, idNumber, unitId, startDate, monthlyRent } = renterData;
      const renter = await renterService.create({ fullName, email, phone, idNumber });
      await renterService.assignUnit(renter.id, { unitId, startDate, monthlyRent });
      setShowRenterModal(false);
      setError(null);
      await refreshDashboard();
    } catch (err: any) {
      setError(err.message || 'Failed to create renter');
    }
  };

  const handleCreateInvoice = async (invoiceData: any) => {
    try {
      await invoiceService.create(invoiceData);
      setShowInvoiceModal(false);
      setError(null);
      await refreshDashboard();
    } catch (err: any) {
      setError(err.message || 'Failed to create invoice');
    }
  };

  const handleRecordPayment = async (paymentData: any) => {
    try {
      const invoice = await invoiceService.getById(paymentData.invoiceId);
      await paymentService.record({
        invoiceId: paymentData.invoiceId,
        renterId: invoice.renter_id,
        amountPaid: paymentData.amount,
        paymentDate: paymentData.date,
        paymentMethod: paymentData.method,
        notes: paymentData.notes,
      });
      setShowPaymentModal(false);
      setError(null);
      await refreshDashboard();
    } catch (err: any) {
      setError(err.message || 'Failed to record payment');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6 lg:space-y-8">
      {error && <Alert variant="error" title={t('error')}>{error}</Alert>}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-6">
        <StatCard
          label={t('totalProperties')}
          value={quickStats?.totalProperties || 0}
          icon="🏢"
        />
        <StatCard
          label={t('activeRenters')}
          value={quickStats?.activeRenters || 0}
          icon="👥"
        />
        <StatCard
          label={t('monthlyRent')}
          value={formatCurrency(quickStats?.totalMonthlyRent || 0)}
          icon="💰"
          trend={{ value: 12, isPositive: true }}
        />
        <StatCard
          label={t('collectionRate')}
          value={`${(monthStats?.collectionRate || 0).toFixed(2)}%`}
          icon="📊"
        />
      </div>

      {/* Secondary Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 lg:gap-6">
        <Card className="border-l-4 border-yellow-500">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-xs lg:text-sm text-gray-600 mb-1 lg:mb-2">{t('unpaidInvoices')}</p>
              <p className="text-2xl lg:text-3xl font-bold text-yellow-600">{monthStats?.unpaidInvoices || 0}</p>
            </div>
            <span className="text-3xl lg:text-4xl shrink-0">📋</span>
          </div>
        </Card>

        <Card className="border-l-4 border-red-500">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-xs lg:text-sm text-gray-600 mb-1 lg:mb-2">{t('outstandingAmount')}</p>
              <p className="text-lg lg:text-3xl font-bold text-red-600 break-words">{formatCurrency(quickStats?.outstandingAmount || 0)}</p>
            </div>
            <span className="text-3xl lg:text-4xl shrink-0">⚠️</span>
          </div>
        </Card>

        <Card className="border-l-4 border-green-500">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-xs lg:text-sm text-gray-600 mb-1 lg:mb-2">{t('paidThisMonth')}</p>
              <p className="text-2xl lg:text-3xl font-bold text-green-600">{monthStats?.paidInvoices || 0}</p>
            </div>
            <span className="text-3xl lg:text-4xl shrink-0">✓</span>
          </div>
        </Card>
      </div>

      {/* Important Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Overdue Invoices Alert */}
        {quickStats && quickStats.overdueCount > 0 && (
          <Card className="border-l-4 border-red-500 bg-red-50">
            <div className="flex flex-col sm:flex-row items-start justify-between gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">⚠️</span>
                  <h4 className="text-sm font-bold text-red-900">{t('overduePayments')}</h4>
                </div>
                <p className="text-xs text-red-700 mb-2">
                  {quickStats.overdueCount} {t('invoicesOverdue')}
                </p>
                <p className="text-lg font-bold text-red-900">
                  {formatCurrency(quickStats.outstandingAmount)}
                </p>
              </div>
              <button className="text-xs bg-red-600 text-white px-3 py-1.5 rounded-lg hover:bg-red-700 transition-colors whitespace-nowrap">
                {t('viewDetails')}
              </button>
            </div>
          </Card>
        )}

        {/* Vacant Units Alert */}
        {quickStats && quickStats.vacantUnits > 0 && (
          <Card className="border-l-4 border-yellow-500 bg-yellow-50">
            <div className="flex flex-col sm:flex-row items-start justify-between gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">🏠</span>
                  <h4 className="text-sm font-bold text-yellow-900">{t('vacantUnits')}</h4>
                </div>
                <p className="text-xs text-yellow-700 mb-2">
                  {quickStats.vacantUnits} {t('unitsAvailable')}
                </p>
                <p className="text-sm font-semibold text-yellow-900">
                  {t('potentialRevenue')}
                </p>
              </div>
              <button className="text-xs bg-yellow-600 text-white px-3 py-1.5 rounded-lg hover:bg-yellow-700 transition-colors whitespace-nowrap">
                {t('assignRenter')}
              </button>
            </div>
          </Card>
        )}
      </div>

      {/* Recent Activity */}
      <Card>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('recentActivity')}</h3>
        <div className="space-y-3">
          {!recentActivity || recentActivity.length === 0 ? (
            <div className="text-center py-8 text-gray-500 text-sm">
              {t('noRecentActivity')}
            </div>
          ) : (
            recentActivity.slice(0, Math.min(5, recentActivity.length)).map((activity: any, index: number) => (
              <div key={index} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors gap-2">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                    activity.type === 'payment' ? 'bg-green-100 text-green-600' :
                    activity.type === 'invoice' ? 'bg-blue-100 text-blue-600' :
                    activity.type === 'renter' ? 'bg-purple-100 text-purple-600' :
                    'bg-gray-100 text-gray-600'
                  }`}>
                    {activity.type === 'payment' ? '💳' :
                     activity.type === 'invoice' ? '📄' :
                     activity.type === 'renter' ? '👤' : '📝'}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{activity.description}</p>
                    <p className="text-xs text-gray-600">{formatDateTime(activity.timestamp)}</p>
                  </div>
                </div>
                {activity.amount && (
                  <span className={`text-sm font-semibold ${
                    activity.type === 'payment' ? 'text-green-600' : 'text-gray-900'
                  }`}>
                    {formatCurrency(activity.amount)}
                  </span>
                )}
              </div>
            ))
          )}
        </div>
      </Card>

      {/* Modals */}
      <CreatePropertyModal
        isOpen={showPropertyModal}
        onClose={() => setShowPropertyModal(false)}
        onSave={handleCreateProperty}
      />
      <CreateRenterModal
        isOpen={showRenterModal}
        onClose={() => setShowRenterModal(false)}
        onSave={handleCreateRenter}
      />
      <CreateInvoiceModal
        isOpen={showInvoiceModal}
        onClose={() => setShowInvoiceModal(false)}
        onSave={handleCreateInvoice}
      />
      <RecordPaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        onSave={handleRecordPayment}
      />
    </div>
  );
};

export default EnhancedOwnerDashboard;
