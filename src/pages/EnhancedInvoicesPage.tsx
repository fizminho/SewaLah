import { useState, useEffect } from 'react';
import { FileText } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import CreateInvoiceModal from '../components/Owner/CreateInvoiceModal';
import RecordPaymentModal from '../components/Owner/RecordPaymentModal';
import InvoiceDetailModal from '../components/Common/InvoiceDetailModal';
import { Card, Button, Badge, Spinner, Alert } from '../components/Common/UIComponents';
import CustomSelect from '../components/Common/CustomSelect';
import Pagination from '../components/Common/Pagination';
import { formatCurrency } from '../utils/currencyUtils';
import { formatDate } from '../utils/dateUtils';
import { invoiceService } from '../services/invoiceService';
import { paymentService } from '../services/paymentService';
import { propertyService } from '../services/propertyService';
import { renterService } from '../services/renterService';
import { InvoiceModel, RenterModel } from '../types';

interface PaymentRecord {
    id: string;
    transactionNumber: string;
    invoiceId?: string;
    invoice?: { id: string };
    amountPaid: number;
    paymentDate: string;
    paymentMethod: string;
    status?: string;
    proofFilePath?: string;
}

const EnhancedInvoicesPage = () => {
    const { t } = useTranslation();
    const [invoices, setInvoices] = useState<InvoiceModel[]>([]);
    const [payments, setPayments] = useState<Record<string, PaymentRecord[]>>({});
    const [expandedInvoice, setExpandedInvoice] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [selectedInvoice, setSelectedInvoice] = useState<InvoiceModel | null>(null);

    const [statusFilter, setStatusFilter] = useState('');
    const [propertyFilter, setPropertyFilter] = useState('');
    const [renterFilter, setRenterFilter] = useState('');
    const [properties, setProperties] = useState<any[]>([]);
    const [renters, setRenters] = useState<RenterModel[]>([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(5);

    const fetchInvoices = async () => {
        setIsLoading(true);
        try {
            const [invoicesResult, paymentsResult] = await Promise.all([
                invoiceService.getAll({
                    status: statusFilter || undefined,
                    propertyId: propertyFilter || undefined,
                    renterId: renterFilter || undefined,
                }),
                paymentService.getAll(),
            ]);

            setInvoices(invoicesResult.items || []);
            setCurrentPage(1);

            const paymentsByInvoice: Record<string, PaymentRecord[]> = {};
            (paymentsResult.items || []).forEach((p: any) => {
                const invoiceId = p.invoice_id || p.invoiceId || p.invoice?.id;
                if (invoiceId) {
                    if (!paymentsByInvoice[invoiceId]) paymentsByInvoice[invoiceId] = [];
                    paymentsByInvoice[invoiceId].push({
                        id: p.id,
                        transactionNumber: p.transaction_number,
                        invoiceId,
                        amountPaid: p.amount_paid,
                        paymentDate: p.payment_date,
                        paymentMethod: p.payment_method,
                        status: p.status,
                        proofFilePath: p.proof_file_path,
                    });
                }
            });
            setPayments(paymentsByInvoice);
        } catch (err: any) {
            setError(t('failedToFetchInvoices'));
        } finally {
            setIsLoading(false);
        }
    };

    const fetchFilterData = async () => {
        try {
            const [propResult, rentResult] = await Promise.all([
                propertyService.getAll(),
                renterService.getAll(),
            ]);
            setProperties(propResult.items || []);
            setRenters(rentResult.items || []);
        } catch (err) {
            console.error('Failed to fetch filter data', err);
        }
    };

    useEffect(() => {
        fetchInvoices();
    }, [statusFilter, propertyFilter, renterFilter]);

    useEffect(() => {
        fetchFilterData();
    }, []);

    const getTotalPaid = (invoiceId: string): number => {
        const invoicePayments = payments[invoiceId];
        if (!invoicePayments || !Array.isArray(invoicePayments)) {
            return 0;
        }
        return invoicePayments
            .filter(p => p.status === 'Verified')
            .reduce((sum, p) => sum + (p.amountPaid || 0), 0);
    };

    const getInvoiceDisplayStatus = (invoice: InvoiceModel): { status: string; variant: 'success' | 'error' | 'info' | 'warning' } => {
        const totalPaid = getTotalPaid(invoice.id);
        
        if (invoice.status === 'Paid') {
            return { status: t('paid'), variant: 'success' };
        }
        
        if (totalPaid > 0 && totalPaid < invoice.totalAmount) {
            return { status: t('partialPaid'), variant: 'warning' };
        }
        
        if (invoice.status === 'Overdue') {
            return { status: t('overdue'), variant: 'error' };
        }
        
        if (invoice.status === 'Issued') {
            return { status: t('issued'), variant: 'info' };
        }
        
        return { status: invoice.status, variant: 'warning' };
    };

    const paginatedInvoices = invoices.slice(
        Math.max(0, (currentPage - 1) * itemsPerPage),
        Math.min(invoices.length, currentPage * itemsPerPage)
    );

    const handleAddInvoice = async (newInvoice: any) => {
        try {
            await invoiceService.create(newInvoice);
            fetchInvoices();
            setIsCreateModalOpen(false);
        } catch (err: any) {
            alert(err.message || 'Failed to create invoice');
        }
    };

    const handleIssueInvoice = async (id: string) => {
        if (!confirm(t('areYouSureIssue'))) return;
        try {
            await invoiceService.issue(id);
            fetchInvoices();
        } catch (err: any) {
            alert(err.message || t('failedToIssueInvoice'));
        }
    };

    const handleRecordPayment = async (payment: any) => {
        try {
            if (!selectedInvoice) return;
            await paymentService.record({
                invoiceId: selectedInvoice.id,
                renterId: (selectedInvoice as any).renter_id || selectedInvoice.renter?.id,
                amountPaid: payment.amount,
                paymentDate: payment.date,
                paymentMethod: payment.method,
                notes: payment.notes,
            });
            fetchInvoices();
            setIsRecordModalOpen(false);
            setSelectedInvoice(null);
        } catch (err: any) {
            alert(err.message || t('failedToRecordPayment'));
        }
    };

    const handleViewPdf = (pdfFilePath: string) => {
        window.open(pdfFilePath, '_blank');
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-96">
                <Spinner size="lg" />
            </div>
        );
    }

    return (
        <div className="space-y-4 lg:space-y-6">
            {error && <Alert variant="error" title={t('error')}>{error}</Alert>}

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex-shrink-0">
                    <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">{t('invoices')}</h1>
                    <p className="text-xs lg:text-sm text-gray-600 mt-1">{t('manageTrackInvoices')}</p>
                </div>
                <Button variant="primary" size="lg" onClick={() => setIsCreateModalOpen(true)} className="w-full sm:w-auto shrink-0">
                    ➕ {t('createInvoice')}
                </Button>
            </div>

            <CreateInvoiceModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onSave={handleAddInvoice}
            />

            <RecordPaymentModal
                isOpen={isRecordModalOpen}
                onClose={() => {
                    setIsRecordModalOpen(false);
                    setSelectedInvoice(null);
                }}
                onSave={handleRecordPayment}
                invoiceNumber={selectedInvoice?.invoiceNumber || ''}
                maxAmount={selectedInvoice ? selectedInvoice.totalAmount - getTotalPaid(selectedInvoice.id) : 0}
            />

            <InvoiceDetailModal
                isOpen={isDetailModalOpen}
                onClose={() => {
                    setIsDetailModalOpen(false);
                    setSelectedInvoice(null);
                }}
                invoiceId={selectedInvoice?.id || ''}
            />

            <Card>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    <div>
                        <label className="text-xs font-semibold text-gray-700 mb-2 block">{t('status')}</label>
                        <CustomSelect
                            options={[
                                { value: '', label: t('allStatuses') },
                                { value: 'Draft', label: t('draft') },
                                { value: 'Issued', label: t('issued') },
                                { value: 'Paid', label: t('paid') },
                                { value: 'Overdue', label: t('overdue') },
                            ]}
                            value={statusFilter}
                            onChange={setStatusFilter}
                            placeholder={t('selectStatus')}
                        />
                    </div>
                    <div>
                        <label className="text-xs font-semibold text-gray-700 mb-2 block">{t('property')}</label>
                        <CustomSelect
                            options={[
                                { value: '', label: t('allProperties') },
                                ...properties.map(p => ({ value: p.id, label: p.name }))
                            ]}
                            value={propertyFilter}
                            onChange={setPropertyFilter}
                            placeholder={t('selectProperty')}
                        />
                    </div>
                    <div>
                        <label className="text-xs font-semibold text-gray-700 mb-2 block">{t('renter')}</label>
                        <CustomSelect
                            options={[
                                { value: '', label: t('allRenters') },
                                ...renters.map(r => ({ value: r.id, label: r.fullName }))
                            ]}
                            value={renterFilter}
                            onChange={setRenterFilter}
                            placeholder={t('selectRenter')}
                        />
                    </div>
                </div>
            </Card>

            <div className="space-y-3">
                {invoices.length === 0 ? (
                    <Card>
                        <div className="text-center py-12">
                            <FileText size={48} className="mx-auto text-gray-300 mb-4" />
                            <h3 className="text-lg font-semibold text-gray-900 mb-1">{t('noInvoicesYet')}</h3>
                            <p className="text-sm text-gray-600">{t('createFirstInvoice')}</p>
                        </div>
                    </Card>
                ) : (
                    <>
                        {paginatedInvoices.map(invoice => (
                            <div key={invoice.id} className="border border-gray-200 rounded-lg bg-white overflow-hidden">
                                <button
                                    onClick={() => setExpandedInvoice(expandedInvoice === invoice.id ? null : invoice.id)}
                                    className="w-full px-3 lg:px-4 py-3 lg:py-2.5 flex items-start lg:items-center gap-2 lg:gap-3 hover:bg-gray-50 transition-colors"
                                >
                                    <span className="text-blue-600 font-bold text-sm lg:text-base transition-transform shrink-0 mt-0.5 lg:mt-0" style={{
                                        transform: expandedInvoice === invoice.id ? 'rotate(180deg)' : 'rotate(0deg)'
                                    }}>▼</span>
                                    <div className="flex-1 grid grid-cols-1 lg:grid-cols-6 gap-2 lg:gap-4 text-left">
                                        <div className="flex justify-between lg:block">
                                            <span className="text-xs text-gray-500 lg:hidden">{t('invoice')}:</span>
                                            <p className="text-xs lg:text-sm font-medium text-gray-900">{invoice.invoiceNumber}</p>
                                        </div>
                                        <div className="flex justify-between lg:block">
                                            <span className="text-xs text-gray-500 lg:hidden">{t('property')}:</span>
                                            <p className="text-xs lg:text-sm text-gray-600 truncate">{invoice.property.name}</p>
                                        </div>
                                        <div className="flex justify-between lg:block">
                                            <span className="text-xs text-gray-500 lg:hidden">{t('renter')}:</span>
                                            <p className="text-xs lg:text-sm text-gray-600 truncate">{invoice.renter.fullName}</p>
                                        </div>
                                        <div className="flex justify-between lg:block">
                                            <span className="text-xs text-gray-500 lg:hidden">{t('amount')}:</span>
                                            <p className="text-sm lg:text-sm font-semibold text-gray-900">{formatCurrency(invoice.totalAmount)}</p>
                                        </div>
                                        <div className="flex justify-between lg:block">
                                            <span className="text-xs text-gray-500 lg:hidden">{t('dueDate')}:</span>
                                            <p className="text-xs lg:text-sm text-gray-600">{formatDate(invoice.dueDate)}</p>
                                        </div>
                                        <div className="flex items-center justify-between gap-2">
                                            <Badge variant={getInvoiceDisplayStatus(invoice).variant} size="sm">
                                                {getInvoiceDisplayStatus(invoice).status}
                                            </Badge>
                                            <div className="flex gap-1">
                                                {(invoice.status === 'Issued' || invoice.status === 'Overdue') && (
                                                    <Button
                                                        variant="tertiary"
                                                        size="sm"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setSelectedInvoice(invoice);
                                                            setIsRecordModalOpen(true);
                                                        }}
                                                        className="text-xs px-2 py-1"
                                                    >
                                                        {t('record')}
                                                    </Button>
                                                )}
                                                {(invoice as any).pdfFilePath && (
                                                    <Button
                                                        variant="tertiary"
                                                        size="sm"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleViewPdf((invoice as any).pdfFilePath);
                                                        }}
                                                        className="text-xs px-2 py-1"
                                                    >
                                                        📄
                                                    </Button>
                                                )}
                                                {invoice.status === 'Draft' && (
                                                    <Button
                                                        variant="tertiary"
                                                        size="sm"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleIssueInvoice(invoice.id);
                                                        }}
                                                        className="text-xs px-2 py-1"
                                                    >
                                                        {t('issue')}
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </button>
                                {expandedInvoice === invoice.id && (
                                    <div className="bg-blue-50 border-t border-gray-200 px-3 lg:px-4 py-3 lg:py-2.5">
                                        <p className="text-xs font-semibold text-gray-700 mb-2">{t('payments')}</p>
                                        {!payments[invoice.id] || !Array.isArray(payments[invoice.id]) || payments[invoice.id].length === 0 ? (
                                            <p className="text-xs text-gray-600">{t('noPaymentsRecorded')}</p>
                                        ) : (
                                            <div className="space-y-2">
                                                {payments[invoice.id].map(payment => (
                                                    <div key={payment.id} className="flex flex-col lg:flex-row lg:items-center justify-between text-xs bg-white p-2 lg:p-2 rounded border border-gray-200 gap-1 lg:gap-0">
                                                        <div className="flex justify-between lg:block lg:w-32">
                                                            <span className="text-gray-500 lg:hidden">{t('transaction')}:</span>
                                                            <span className="font-medium text-blue-600">{payment.transactionNumber}</span>
                                                        </div>
                                                        <div className="flex justify-between lg:block lg:w-24">
                                                            <span className="text-gray-500 lg:hidden">{t('date')}:</span>
                                                            <span className="text-gray-600">{formatDate(payment.paymentDate)}</span>
                                                        </div>
                                                        <div className="flex justify-between lg:block lg:w-24">
                                                            <span className="text-gray-500 lg:hidden">{t('amount')}:</span>
                                                            <span className="font-semibold text-green-600">{formatCurrency(payment?.amountPaid || 0)}</span>
                                                        </div>
                                                        <div className="flex justify-between lg:block lg:w-24">
                                                            <span className="text-gray-500 lg:hidden">{t('method')}:</span>
                                                            <span className="text-gray-600">{payment?.paymentMethod || '-'}</span>
                                                        </div>
                                                        <div className="flex justify-between lg:justify-start items-center">
                                                            <span className="text-gray-500 lg:hidden">{t('status')}:</span>
                                                            <Badge variant={payment?.status === 'Verified' ? 'success' : payment?.status === 'Pending' ? 'warning' : 'error'}>
                                                                {payment?.status === 'Verified' ? t('verified') : payment?.status === 'Pending' ? t('pending') : payment?.status === 'Rejected' ? t('rejected') : t('unknown')}
                                                            </Badge>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))}
                        {invoices.length > 0 && (
                            <Card className="mt-3">
                                <Pagination
                                    currentPage={currentPage}
                                    totalItems={invoices.length}
                                    itemsPerPage={itemsPerPage}
                                    onPageChange={setCurrentPage}
                                    onItemsPerPageChange={(value) => {
                                        setItemsPerPage(value);
                                        setCurrentPage(1);
                                    }}
                                />
                            </Card>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default EnhancedInvoicesPage;
