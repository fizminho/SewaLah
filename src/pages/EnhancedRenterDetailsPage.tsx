import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { renterService } from '../services/renterService';
import { invoiceService } from '../services/invoiceService';
import { paymentService } from '../services/paymentService';
import { db } from '../lib/client';
import { InvoiceModel } from '../types';
import { Card, Button, Badge, Spinner, Alert } from '../components/Common/UIComponents';
import Pagination from '../components/Common/Pagination';
import { formatCurrency } from '../utils/currencyUtils';
import EditRenterModal from '../components/Owner/EditRenterModal';
import EditAssignmentModal from '../components/Owner/EditAssignmentModal';

type TabType = 'overview' | 'assignments' | 'invoices';

interface RenterDetail {
    id: string;
    fullName: string;
    email?: string;
    phone?: string;
    idNumber?: string;
    isActive: boolean;
    activeAssignments?: Assignment[];
}

interface Assignment {
    id: string;
    unitNumber: string;
    propertyName: string;
    propertyId: string;
    unitId: string;
    startDate: string;
    endDate?: string;
    monthlyRent: number;
    paymentStatus?: string;
}

interface PaymentRecord {
    id: string;
    transactionNumber: string;
    invoiceId?: string;
    amountPaid: number;
    paymentDate: string;
    paymentMethod: string;
    status?: string;
}

const EnhancedRenterDetailsPage = () => {
    const { id } = useParams();
    const [renter, setRenter] = useState<RenterDetail | null>(null);
    const [invoices, setInvoices] = useState<InvoiceModel[]>([]);
    const [payments, setPayments] = useState<Record<string, PaymentRecord[]>>({});
    const [expandedInvoice, setExpandedInvoice] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<TabType>('overview');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isEditAssignmentModalOpen, setIsEditAssignmentModalOpen] = useState(false);
    const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(5);

    useEffect(() => {
        const fetchData = async () => {
            if (!id) return;
            setIsLoading(true);
            try {
                const [rentersResult, invoicesResult, paymentsResult] = await Promise.all([
                    renterService.getAll(1, 200),
                    invoiceService.getAll({ renterId: id }),
                    paymentService.getAll({ renterId: id }),
                ]);

                const renterData = rentersResult.items?.find((r: any) => r.id === id);
                if (!renterData) throw new Error('Renter not found');
                setRenter(renterData);

                const normalizedInvoices = (invoicesResult.items || []).map((inv: any) => ({
                    id: inv.id,
                    invoiceNumber: inv.invoice_number ?? inv.invoiceNumber,
                    status: inv.status,
                    totalAmount: inv.total_amount ?? inv.totalAmount ?? 0,
                    outstandingAmount: inv.outstanding_amount ?? inv.outstandingAmount ?? 0,
                    dueDate: inv.due_date ?? inv.dueDate,
                    renter: inv.renters ? { id: inv.renters.id, fullName: inv.renters.full_name } : (inv.renter ?? {}),
                    unit: inv.units ? { id: inv.units.id, unitNumber: inv.units.unit_number } : (inv.unit ?? {}),
                    property: inv.units?.properties ? { id: inv.units.properties.id, name: inv.units.properties.name } : (inv.property ?? {}),
                }));
                setInvoices(normalizedInvoices);

                const paymentsByInvoice: Record<string, PaymentRecord[]> = {};
                (paymentsResult.items || []).forEach((p: any) => {
                    const invoiceId = p.invoice_id || p.invoiceId;
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
                        });
                    }
                });
                setPayments(paymentsByInvoice);
            } catch (err: any) {
                setError('Failed to fetch renter details');
            } finally {
                setIsLoading(false);
            }
        };
        if (id) fetchData();
    }, [id]);

    const handleEditRenter = async (renterId: string, updatedData: any) => {
        try {
            await renterService.update(renterId, updatedData);
            const result = await renterService.getAll(1, 200);
            const updatedRenter = result.items?.find((r: any) => r.id === id);
            if (updatedRenter) setRenter(updatedRenter);
            setIsEditModalOpen(false);
        } catch (err: any) {
            alert(err.message || 'Failed to update renter');
        }
    };

    const handleVacantUnit = async (assignmentId: string) => {
        if (!window.confirm('Are you sure you want to vacant this unit?')) return;
        try {
            await db.from('renter_unit_assignments').update({ end_date: new Date().toISOString().split('T')[0] }).eq('id', assignmentId);
            alert('Unit vacated successfully!');
            const result = await renterService.getAll(1, 200);
            const updatedRenter = result.items?.find((r: any) => r.id === id);
            if (updatedRenter) setRenter(updatedRenter);
        } catch (err: any) {
            alert(err.message || 'Failed to vacant unit');
        }
    };

    const handleUpdateAssignment = async (assignmentId: string, data: { monthlyRent: number; endDate: string | null }) => {
        try {
            await renterService.updateRent(assignmentId, data.monthlyRent);
            if (data.endDate) {
                await db.from('renter_unit_assignments').update({ end_date: data.endDate }).eq('id', assignmentId);
            }
            alert('Assignment updated successfully!');
            const result = await renterService.getAll(1, 200);
            const updatedRenter = result.items?.find((r: any) => r.id === id);
            if (updatedRenter) setRenter(updatedRenter);
            setIsEditAssignmentModalOpen(false);
        } catch (err: any) {
            alert(err.message || 'Failed to update assignment');
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-96">
                <Spinner size="lg" />
            </div>
        );
    }

    if (error) {
        return <Alert variant="error" title="Error">{error}</Alert>;
    }

    if (!renter) {
        return <Alert variant="warning" title="Not Found">Renter not found</Alert>;
    }

    const invoiceStats = {
        total: invoices.length,
        paid: invoices.filter(i => i.status === 'Paid').length,
        overdue: invoices.filter(i => i.status === 'Overdue').length,
        outstanding: invoices.filter(i => i.status === 'Issued' || i.status === 'Overdue').length,
        totalAmount: invoices.reduce((sum, i) => sum + i.totalAmount, 0),
        outstandingAmount: invoices.reduce((sum, i) => sum + i.outstandingAmount, 0)
    };

    const paymentStats = {
        totalProcessed: Object.values(payments).flat().reduce((sum, p) => sum + (p?.amountPaid || 0), 0),
        count: Object.values(payments).flat().length
    };

    const totalMonthlyRent = renter.activeAssignments?.reduce((sum, a) => sum + a.monthlyRent, 0) || 0;

    const paginatedInvoices = invoices.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    return (
        <div className="space-y-4 lg:space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                    <Link to="/owner/renters" className="text-blue-600 hover:text-blue-700 text-xs lg:text-sm mb-2 inline-block">
                        ← Back to Renters
                    </Link>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mt-2">
                        <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 break-words">{renter.fullName}</h1>
                        <Badge variant={renter.isActive ? 'success' : 'warning'}>
                            {renter.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                    </div>
                    <p className="text-sm lg:text-base text-gray-600 mt-1 break-words">{renter.email || 'No email'}</p>
                </div>
                <Button 
                    variant="primary"
                    size="lg"
                    onClick={() => setIsEditModalOpen(true)}
                    className="w-full sm:w-auto shrink-0"
                >
                    ✏️ Edit Renter
                </Button>
            </div>

            <EditRenterModal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                onSave={handleEditRenter}
                renter={renter}
            />

            <EditAssignmentModal
                isOpen={isEditAssignmentModalOpen}
                onClose={() => setIsEditAssignmentModalOpen(false)}
                onSave={handleUpdateAssignment}
                assignment={selectedAssignment}
            />

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
                <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                    <div className="p-3 lg:p-4">
                        <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide">Total Invoiced</p>
                        <p className="text-lg lg:text-2xl font-bold text-blue-900 mt-2 break-words">{formatCurrency(invoiceStats.totalAmount)}</p>
                        <p className="text-xs text-blue-700 mt-2">{invoiceStats.total} invoices</p>
                    </div>
                </Card>

                <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
                    <div className="p-3 lg:p-4">
                        <p className="text-xs font-semibold text-green-600 uppercase tracking-wide">Paid</p>
                        <p className="text-lg lg:text-2xl font-bold text-green-900 mt-2 break-words">{formatCurrency(invoiceStats.totalAmount - invoiceStats.outstandingAmount)}</p>
                        <p className="text-xs text-green-700 mt-2">{invoiceStats.paid} paid invoices</p>
                    </div>
                </Card>

                <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
                    <div className="p-3 lg:p-4">
                        <p className="text-xs font-semibold text-red-600 uppercase tracking-wide">Outstanding</p>
                        <p className="text-lg lg:text-2xl font-bold text-red-900 mt-2 break-words">{formatCurrency(invoiceStats.outstandingAmount)}</p>
                        <p className="text-xs text-red-700 mt-2">{invoiceStats.outstanding} pending</p>
                    </div>
                </Card>

                <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
                    <div className="p-3 lg:p-4">
                        <p className="text-xs font-semibold text-purple-600 uppercase tracking-wide">Monthly Rent</p>
                        <p className="text-lg lg:text-2xl font-bold text-purple-900 mt-2 break-words">{formatCurrency(totalMonthlyRent)}</p>
                        <p className="text-xs text-purple-700 mt-2">{renter.activeAssignments?.length || 0} units</p>
                    </div>
                </Card>
            </div>

            <Card>
                <div className="border-b border-gray-200 overflow-x-auto">
                    <div className="flex gap-4 lg:gap-8 px-4 lg:px-6 min-w-max">
                        {[
                            { id: 'overview', label: '📋 Overview' },
                            { id: 'assignments', label: '🏠 Unit Assignments' },
                            { id: 'invoices', label: '💰 Invoices & Payments' }
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as TabType)}
                                className={`py-3 lg:py-4 px-1 border-b-2 font-medium text-xs lg:text-sm transition-colors whitespace-nowrap ${
                                    activeTab === tab.id
                                        ? 'border-blue-600 text-blue-600'
                                        : 'border-transparent text-gray-600 hover:text-gray-900'
                                }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="p-4 lg:p-6">
                    {activeTab === 'overview' && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <h3 className="text-sm font-semibold text-gray-900 mb-4">Renter Information</h3>
                                    <dl className="space-y-3">
                                        <div>
                                            <dt className="text-xs font-medium text-gray-600">Full Name</dt>
                                            <dd className="text-sm text-gray-900 mt-1">{renter.fullName}</dd>
                                        </div>
                                        <div>
                                            <dt className="text-xs font-medium text-gray-600">Email</dt>
                                            <dd className="text-sm text-gray-900 mt-1">{renter.email || 'Not provided'}</dd>
                                        </div>
                                        <div>
                                            <dt className="text-xs font-medium text-gray-600">Phone</dt>
                                            <dd className="text-sm text-gray-900 mt-1">{renter.phone || 'Not provided'}</dd>
                                        </div>
                                        <div>
                                            <dt className="text-xs font-medium text-gray-600">ID Number</dt>
                                            <dd className="text-sm text-gray-900 mt-1">{renter.idNumber || 'Not provided'}</dd>
                                        </div>
                                        <div>
                                            <dt className="text-xs font-medium text-gray-600">Active Units</dt>
                                            <dd className="text-sm text-gray-900 mt-1">{renter.activeAssignments?.length || 0}</dd>
                                        </div>
                                    </dl>
                                </div>

                                <div>
                                    <h3 className="text-sm font-semibold text-gray-900 mb-4">Financial Overview</h3>
                                    <dl className="space-y-3">
                                        <div>
                                            <dt className="text-xs font-medium text-gray-600">Total Invoices</dt>
                                            <dd className="text-sm text-gray-900 mt-1">{invoiceStats.total}</dd>
                                        </div>
                                        <div>
                                            <dt className="text-xs font-medium text-gray-600">Payment Rate</dt>
                                            <dd className="text-sm text-gray-900 mt-1">
                                                {invoiceStats.total > 0 
                                                    ? ((invoiceStats.paid / invoiceStats.total) * 100).toFixed(2)
                                                    : (0).toFixed(2)}%
                                            </dd>
                                        </div>
                                        <div>
                                            <dt className="text-xs font-medium text-gray-600">Overdue Invoices</dt>
                                            <dd className="text-sm text-red-600 font-medium mt-1">{invoiceStats.overdue}</dd>
                                        </div>
                                        <div>
                                            <dt className="text-xs font-medium text-gray-600">Total Payments Made</dt>
                                            <dd className="text-sm text-gray-900 mt-1">{formatCurrency(paymentStats.totalProcessed)}</dd>
                                        </div>
                                        <div>
                                            <dt className="text-xs font-medium text-gray-600">Monthly Rent Total</dt>
                                            <dd className="text-sm text-gray-900 mt-1">{formatCurrency(totalMonthlyRent)}</dd>
                                        </div>
                                    </dl>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'assignments' && (
                        <div className="space-y-4">
                            {!renter.activeAssignments || renter.activeAssignments.length === 0 ? (
                                <p className="text-gray-500 text-center py-8">No unit assignments found</p>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {renter.activeAssignments.map(assignment => (
                                        <div key={assignment.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                                            <div className="flex items-start justify-between mb-3">
                                                <div>
                                                    <h4 className="font-semibold text-gray-900">Unit {assignment.unitNumber}</h4>
                                                    <p className="text-xs text-gray-600 mt-1">{assignment.propertyName}</p>
                                                </div>
                                                {assignment.paymentStatus && (
                                                    <Badge variant={
                                                        assignment.paymentStatus === 'Paid' ? 'success' :
                                                        assignment.paymentStatus === 'Overdue' ? 'error' :
                                                        assignment.paymentStatus === 'Pending' ? 'warning' : 'info'
                                                    }>
                                                        {assignment.paymentStatus}
                                                    </Badge>
                                                )}
                                            </div>
                                            <div className="space-y-2">
                                                <div className="flex justify-between text-sm">
                                                    <span className="text-gray-600">Monthly Rent:</span>
                                                    <span className="font-semibold text-gray-900">{formatCurrency(assignment.monthlyRent)}</span>
                                                </div>
                                                <div className="flex justify-between text-sm">
                                                    <span className="text-gray-600">Start Date:</span>
                                                    <span className="text-gray-900">{new Date(assignment.startDate).toLocaleDateString()}</span>
                                                </div>
                                                <div className="flex justify-between text-sm">
                                                    <span className="text-gray-600">End Date:</span>
                                                    <span className="text-gray-900">{assignment.endDate ? new Date(assignment.endDate).toLocaleDateString() : 'Ongoing'}</span>
                                                </div>
                                            </div>
                                            <div className="mt-3 pt-3 border-t border-gray-200 flex items-center justify-between">
                                                <Link 
                                                    to={`/owner/properties/${assignment.propertyId}`}
                                                    className="text-xs text-blue-600 hover:text-blue-700"
                                                >
                                                    View Property →
                                                </Link>
                                                <div className="flex gap-2">
                                                    <Button
                                                        variant="tertiary"
                                                        size="sm"
                                                        onClick={() => {
                                                            setSelectedAssignment(assignment);
                                                            setIsEditAssignmentModalOpen(true);
                                                        }}
                                                    >
                                                        Edit
                                                    </Button>
                                                    <Button
                                                        variant="tertiary"
                                                        size="sm"
                                                        onClick={() => handleVacantUnit(assignment.id)}
                                                    >
                                                        Vacant
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'invoices' && (
                        <div className="space-y-3">
                            {invoices.length === 0 ? (
                                <p className="text-gray-500 text-center py-8 text-sm">No invoices found</p>
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
                                                <div className="flex-1 grid grid-cols-1 lg:grid-cols-5 gap-2 lg:gap-4 text-left">
                                                    <div className="flex justify-between lg:block">
                                                        <span className="text-xs text-gray-500 lg:hidden">Invoice:</span>
                                                        <p className="text-xs lg:text-sm font-medium text-gray-900">{invoice.invoiceNumber}</p>
                                                    </div>
                                                    <div className="flex justify-between lg:block">
                                                        <span className="text-xs text-gray-500 lg:hidden">Property:</span>
                                                        <p className="text-xs lg:text-sm text-gray-600 truncate">{invoice.property.name}</p>
                                                    </div>
                                                    <div className="flex justify-between lg:block">
                                                        <span className="text-xs text-gray-500 lg:hidden">Unit:</span>
                                                        <p className="text-xs lg:text-sm text-gray-600">Unit {invoice.unit.unitNumber}</p>
                                                    </div>
                                                    <div className="flex justify-between lg:block">
                                                        <span className="text-xs text-gray-500 lg:hidden">Amount:</span>
                                                        <p className="text-sm lg:text-sm font-semibold text-gray-900">{formatCurrency(invoice.totalAmount)}</p>
                                                    </div>
                                                    <div className="flex items-center justify-between gap-2">
                                                        <div className="flex justify-between lg:block flex-1">
                                                            <span className="text-xs text-gray-500 lg:hidden">Due:</span>
                                                            <p className="text-xs lg:text-sm text-gray-600">{new Date(invoice.dueDate).toLocaleDateString()}</p>
                                                        </div>
                                                        <Badge variant={
                                                            invoice.status === 'Paid' ? 'success' :
                                                            invoice.status === 'Overdue' ? 'error' :
                                                            invoice.status === 'Issued' ? 'info' : 'warning'
                                                        } size="sm">
                                                            {invoice.status}
                                                        </Badge>
                                                    </div>
                                                </div>
                                            </button>
                                            {expandedInvoice === invoice.id && (
                                                <div className="bg-blue-50 border-t border-gray-200 px-3 lg:px-4 py-3 lg:py-2.5">
                                                    <p className="text-xs font-semibold text-gray-700 mb-2">Payments</p>
                                                    {!payments[invoice.id] || payments[invoice.id].length === 0 ? (
                                                        <p className="text-xs text-gray-600">No payments recorded</p>
                                                    ) : (
                                                        <div className="space-y-2">
                                                            {payments[invoice.id].map(payment => (
                                                                <div key={payment.id} className="flex flex-col lg:flex-row lg:items-center justify-between text-xs bg-white p-2 rounded border border-gray-200 gap-1 lg:gap-0">
                                                                    <div className="flex justify-between lg:block lg:w-32">
                                                                        <span className="text-gray-500 lg:hidden">Transaction:</span>
                                                                        <span className="font-medium text-blue-600">{payment.transactionNumber}</span>
                                                                    </div>
                                                                    <div className="flex justify-between lg:block lg:w-24">
                                                                        <span className="text-gray-500 lg:hidden">Date:</span>
                                                                        <span className="text-gray-600">{new Date(payment.paymentDate).toLocaleDateString()}</span>
                                                                    </div>
                                                                    <div className="flex justify-between lg:block lg:w-24">
                                                                        <span className="text-gray-500 lg:hidden">Amount:</span>
                                                                        <span className="font-semibold text-green-600">{formatCurrency(payment?.amountPaid || 0)}</span>
                                                                    </div>
                                                                    <div className="flex justify-between lg:block lg:w-24">
                                                                        <span className="text-gray-500 lg:hidden">Method:</span>
                                                                        <span className="text-gray-600">{payment?.paymentMethod || '-'}</span>
                                                                    </div>
                                                                    <div className="flex justify-between lg:justify-start items-center">
                                                                        <span className="text-gray-500 lg:hidden">Status:</span>
                                                                        <Badge variant={payment?.status === 'Verified' ? 'success' : payment?.status === 'Pending' ? 'warning' : 'error'} size="sm">
                                                                            {payment?.status || 'Unknown'}
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
                                        <div className="mt-3 border-t border-gray-200 pt-3">
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
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    )}
                </div>
            </Card>
        </div>
    );
};

export default EnhancedRenterDetailsPage;
