import { useState, useEffect } from 'react';
import { CreditCard } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Card, Button, Badge, Spinner, Alert } from '../components/Common/UIComponents';
import CustomSelect from '../components/Common/CustomSelect';
import DateRangePicker from '../components/Common/DateRangePicker';
import Pagination from '../components/Common/Pagination';
import { formatCurrency } from '../utils/currencyUtils';
import { PaymentModel } from '../types';
import { paymentService } from '../services/paymentService';

const EnhancedPaymentsPage = () => {
    const { t } = useTranslation();
    const [payments, setPayments] = useState<PaymentModel[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [statusFilter, setStatusFilter] = useState('Pending');
    const [dateRange, setDateRange] = useState({ from: '', to: '' });
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(5);

    const fetchPayments = async () => {
        setIsLoading(true);
        try {
            const result = await paymentService.getAll({
                status: statusFilter || undefined,
            });
            setPayments(result.items || []);
            setCurrentPage(1);
        } catch (err: any) {
            setError(t('failedToFetchPayments'));
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchPayments();
    }, [statusFilter, dateRange]);

    const paginatedPayments = payments.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const handleVerifyPayment = async (id: string) => {
        if (!confirm(t('areYouSureVerify'))) return;
        try {
            await paymentService.verify(id);
            alert(t('paymentVerified'));
            fetchPayments();
        } catch (err: any) {
            alert(err.message || t('failedToVerifyPayment'));
        }
    };

    const handleRejectPayment = async (id: string) => {
        const reason = prompt(t('enterRejectionReason'));
        if (!reason) return;
        try {
            await paymentService.reject(id, reason);
            alert(t('paymentRejected'));
            fetchPayments();
        } catch (err: any) {
            alert(err.message || t('failedToRejectPayment'));
        }
    };

    const handleViewProof = (proofFilePath: string) => {
        window.open(proofFilePath, '_blank');
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-96">
                <Spinner size="lg" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {error && <Alert variant="error" title={t('error')}>{error}</Alert>}

            <div>
                <h1 className="text-3xl font-bold text-gray-900">{t('payments')}</h1>
                <p className="text-sm text-gray-600 mt-1">{t('trackManagePayments')}</p>
            </div>

            {/* Filters */}
            <Card>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="text-xs font-semibold text-gray-700 mb-2 block">{t('status')}</label>
                        <CustomSelect
                            options={[
                                { value: '', label: t('allStatuses') },
                                { value: 'Pending', label: t('pending') },
                                { value: 'Verified', label: t('verified') },
                                { value: 'Rejected', label: t('rejected') },
                            ]}
                            value={statusFilter}
                            onChange={setStatusFilter}
                            placeholder={t('selectStatus')}
                        />
                    </div>
                    <div>
                        <DateRangePicker
                            label={t('paymentDateRange')}
                            value={dateRange}
                            onChange={setDateRange}
                        />
                    </div>
                </div>
            </Card>

            {/* Payments Table */}
            <Card className="overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-200">
                                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-900">{t('transactionNumber')}</th>
                                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-900">{t('invoiceNumber')}</th>
                                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-900">{t('renter')}</th>
                                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-900">{t('amount')}</th>
                                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-900">{t('paymentDate')}</th>
                                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-900">{t('method')}</th>
                                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-900">{t('status')}</th>
                                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-900">{t('actions')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {payments.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="px-4 py-12 text-center">
                                        <div className="flex flex-col items-center justify-center">
                                            <CreditCard size={48} className="text-gray-300 mb-4" />
                                            <h3 className="text-lg font-semibold text-gray-900 mb-1">{t('noPaymentsFound')}</h3>
                                            <p className="text-sm text-gray-600">{t('paymentsWillAppear')}</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                paginatedPayments.map((payment) => (
                                    <tr key={payment.id} className="border-b border-gray-200 hover:bg-gray-50 transition-colors">
                                        <td className="px-4 py-2.5 text-sm font-medium text-blue-600">
                                            {payment.transactionNumber}
                                        </td>
                                        <td className="px-4 py-2.5 text-sm font-medium text-blue-600">
                                            {payment.invoice.invoiceNumber}
                                        </td>
                                        <td className="px-4 py-2.5 text-sm text-gray-900">
                                            {payment.renter?.fullName}
                                        </td>
                                        <td className="px-4 py-2.5 text-sm font-semibold text-gray-900">
                                            {formatCurrency(payment.amountPaid)}
                                        </td>
                                        <td className="px-4 py-2.5 text-sm text-gray-600">
                                            {new Date(payment.paymentDate).toLocaleDateString()}
                                        </td>
                                        <td className="px-4 py-2.5 text-sm text-gray-600">
                                            {payment.paymentMethod}
                                            {payment.notes && (
                                                <div className="text-xs text-gray-400">Ref: {payment.notes}</div>
                                            )}
                                        </td>
                                        <td className="px-4 py-2.5 text-sm">
                                            <Badge variant={
                                                payment.status === 'Verified' ? 'success' :
                                                payment.status === 'Rejected' ? 'error' : 'warning'
                                            }>
                                                {payment.status === 'Verified' ? t('verified') : payment.status === 'Rejected' ? t('rejected') : t('pending')}
                                            </Badge>
                                        </td>
                                        <td className="px-4 py-2.5 text-sm">
                                            <div className="flex gap-1">
                                                {payment.proofFilePath && (
                                                    <Button
                                                        variant="tertiary"
                                                        size="sm"
                                                        onClick={() => handleViewProof(payment.proofFilePath!)}
                                                    >
                                                        {t('proof')}
                                                    </Button>
                                                )}
                                                {payment.status === 'Pending' && (
                                                    <>
                                                        <Button
                                                            variant="tertiary"
                                                            size="sm"
                                                            onClick={() => handleVerifyPayment(payment.id)}
                                                        >
                                                            {t('verify')}
                                                        </Button>
                                                        <Button
                                                            variant="danger"
                                                            size="sm"
                                                            onClick={() => handleRejectPayment(payment.id)}
                                                        >
                                                            {t('reject')}
                                                        </Button>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
                {payments.length > 0 && (
                    <Pagination
                        currentPage={currentPage}
                        totalItems={payments.length}
                        itemsPerPage={itemsPerPage}
                        onPageChange={setCurrentPage}
                        onItemsPerPageChange={(value) => {
                            setItemsPerPage(value);
                            setCurrentPage(1);
                        }}
                    />
                )}
            </Card>
        </div>
    );
};

export default EnhancedPaymentsPage;
