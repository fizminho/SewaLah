import { useState, useEffect } from 'react';
import { Card, StatCard, Spinner, Alert } from '../components/Common/UIComponents';
import { formatDate, formatDateTime } from '../utils/dateUtils';
import { dashboardService } from '../services/dashboardService';
import { useAuth } from '../hooks/useAuth';
import { db } from '../lib/client';
import { RenterDashboardData } from '../types';

const RenterDashboard = () => {
    const { user } = useAuth();
    const [dashboardData, setDashboardData] = useState<RenterDashboardData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!user) return;
        const fetchDashboard = async () => {
            try {
                // Find renter record linked to this user's email
                const { data: renter } = await db.from('renters')
                    .select('id')
                    .eq('email', user.email)
                    .single();

                if (!renter) throw new Error('Renter profile not found');

                const [quickStats, obligations, rentals, paymentHistory, recentActivity] = await Promise.all([
                    dashboardService.getRenterQuickStats(renter.id),
                    dashboardService.getRenterObligations(renter.id),
                    dashboardService.getRenterRentals(renter.id),
                    dashboardService.getRenterPaymentHistory(renter.id),
                    dashboardService.getRenterRecentActivity(renter.id),
                ]);

                setDashboardData({
                    quickStats: {
                        totalDue: quickStats.totalAmountDue,
                        paidThisMonth: quickStats.amountPaidThisMonth,
                        paymentStatus: quickStats.paymentStatus,
                        daysUntilDue: quickStats.daysUntilDue,
                    },
                    obligations: {
                        totalOutstanding: obligations.totalOutstanding,
                        unpaidInvoices: obligations.unpaidInvoicesCount,
                        earliestDueDate: obligations.earliestDueDate ?? '',
                    },
                    rentals: (rentals as any[]).map((r: any) => ({
                        id: r.id,
                        propertyName: r.units?.properties?.name ?? '',
                        unitNumber: r.units?.unit_number ?? '',
                        address: r.units?.properties?.address ?? '',
                        monthlyRent: r.monthly_rent,
                    })),
                    paymentHistory,
                    recentActivity,
                });
            } catch (err: any) {
                setError(err.message || 'Failed to fetch dashboard data');
            } finally {
                setIsLoading(false);
            }
        };
        fetchDashboard();
    }, [user]);

    const getStatusColor = (status: string) => {
        if (status === 'OVERDUE') return 'text-[#d13438]';
        if (status === 'PENDING') return 'text-[#ffb900]';
        return 'text-[#107c10]';
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-96">
                <Spinner size="lg" />
            </div>
        );
    }

    if (!dashboardData) return <Alert variant="error" title="Error">{error}</Alert>;

    return (
        <div className="space-y-8">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="border-l-4 border-[#d13438]">
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-sm text-gray-600 mb-2">Total Due</p>
                            <p className="text-3xl font-bold text-[#d13438]">RM {dashboardData.quickStats.totalDue.toLocaleString()}</p>
                        </div>
                        <span className="text-4xl opacity-20">💸</span>
                    </div>
                </Card>
                
                <Card className="border-l-4 border-[#107c10]">
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-sm text-gray-600 mb-2">Paid This Month</p>
                            <p className="text-3xl font-bold text-[#107c10]">RM {dashboardData.quickStats.paidThisMonth.toLocaleString()}</p>
                        </div>
                        <span className="text-4xl opacity-20">✓</span>
                    </div>
                </Card>
                
                <Card className={`border-l-4 ${
                    dashboardData.quickStats.paymentStatus === 'OVERDUE' ? 'border-[#d13438]' : 
                    dashboardData.quickStats.paymentStatus === 'PENDING' ? 'border-[#ffb900]' : 
                    'border-[#107c10]'
                }`}>
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-sm text-gray-600 mb-2">Payment Status</p>
                            <p className={`text-3xl font-bold ${getStatusColor(dashboardData.quickStats.paymentStatus)}`}>
                                {dashboardData.quickStats.paymentStatus}
                            </p>
                        </div>
                        <span className="text-4xl opacity-20">📊</span>
                    </div>
                </Card>
                
                <StatCard
                    label="Days Until Due"
                    value={`${dashboardData.quickStats.daysUntilDue} Days`}
                    icon="⏰"
                />
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Current Obligations */}
                <Card className="border-l-4 border-yellow-500">
                    <div className="flex items-start justify-between mb-4">
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900">Current Obligations</h3>
                            <p className="text-sm text-gray-600 mt-1">Outstanding payments</p>
                        </div>
                        <span className="text-4xl">📋</span>
                    </div>
                    <div className="space-y-4">
                        <div className="flex justify-between items-center py-3 border-b border-gray-200">
                            <span className="text-sm font-medium text-gray-600">Total Outstanding</span>
                            <span className="text-lg font-bold text-gray-900">RM {dashboardData.obligations.totalOutstanding.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between items-center py-3 border-b border-gray-200">
                            <span className="text-sm font-medium text-gray-600">Unpaid Invoices</span>
                            <span className="text-lg font-bold text-gray-900">{dashboardData.obligations.unpaidInvoices}</span>
                        </div>
                        <div className="flex justify-between items-center py-3">
                            <span className="text-sm font-medium text-gray-600">Earliest Due Date</span>
                            <span className="text-lg font-bold text-[#d13438]">
                                {dashboardData.obligations.earliestDueDate ? formatDate(dashboardData.obligations.earliestDueDate) : 'N/A'}
                            </span>
                        </div>
                    </div>
                </Card>

                {/* My Rentals */}
                <Card>
                    <div className="flex items-start justify-between mb-4">
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900">My Rentals</h3>
                            <p className="text-sm text-gray-600 mt-1">Active rental properties</p>
                        </div>
                        <span className="text-4xl">🏠</span>
                    </div>
                    <div className="space-y-3">
                        {dashboardData.rentals.length === 0 ? (
                            <p className="text-sm text-gray-500 text-center py-8">No active rentals</p>
                        ) : (
                            dashboardData.rentals.map((rental) => (
                                <div key={rental.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                                    <div>
                                        <p className="text-sm font-bold text-gray-900">{rental.propertyName} - {rental.unitNumber}</p>
                                        <p className="text-xs text-gray-600 mt-1">{rental.address}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-lg font-bold text-[#0078d4]">RM {rental.monthlyRent.toLocaleString()}</p>
                                        <p className="text-xs text-gray-600">per month</p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </Card>
            </div>

            {/* Payment History KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="border-l-4 border-[#0078d4]">
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-sm text-gray-600 mb-2">Total Paid YTD</p>
                            <p className="text-3xl font-bold text-gray-900">RM {dashboardData.paymentHistory.totalPaidYTD.toLocaleString()}</p>
                        </div>
                        <span className="text-4xl opacity-20">💰</span>
                    </div>
                </Card>
                
                <Card className="border-l-4 border-[#0078d4]">
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-sm text-gray-600 mb-2">Average Payment Time</p>
                            <p className="text-3xl font-bold text-gray-900">{dashboardData.paymentHistory.averagePaymentTime}</p>
                        </div>
                        <span className="text-4xl opacity-20">⏱️</span>
                    </div>
                </Card>
                
                <Card className="border-l-4 border-[#107c10]">
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-sm text-gray-600 mb-2">On-Time Rate</p>
                            <p className="text-3xl font-bold text-gray-900">{dashboardData.paymentHistory.onTimeRate}</p>
                        </div>
                        <span className="text-4xl opacity-20">📈</span>
                    </div>
                </Card>
            </div>

            {/* Recent Activity */}
            <Card>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
                {(!dashboardData.recentActivity || dashboardData.recentActivity.length === 0) ? (
                    <div className="text-center py-8 text-gray-500">
                        No recent activity found.
                    </div>
                ) : (
                    <div className="space-y-3">
                        {dashboardData.recentActivity.map((activity) => (
                            <div key={activity.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
                                        📝
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-gray-900">{activity.description}</p>
                                        <p className="text-xs text-gray-600">{formatDateTime(activity.timestamp)}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </Card>
        </div>
    );
};

export default RenterDashboard;