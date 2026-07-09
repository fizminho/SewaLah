import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { propertyService } from '../services/propertyService';
import { invoiceService } from '../services/invoiceService';
import { paymentService } from '../services/paymentService';
import { PropertyDetailModel, InvoiceModel } from '../types';
import { Card, Button, Badge, Spinner, Alert } from '../components/Common/UIComponents';
import Pagination from '../components/Common/Pagination';
import { formatCurrency } from '../utils/currencyUtils';
import { formatDate } from '../utils/dateUtils';
import EditPropertyModal from '../components/Owner/EditPropertyModal';

type TabType = 'overview' | 'units' | 'invoices';

interface PaymentRecord {
    id: string;
    transactionNumber: string;
    invoiceId?: string;
    amountPaid: number;
    paymentDate: string;
    paymentMethod: string;
    renter?: { fullName: string };
    unit?: { unitNumber: string };
    invoice?: any;
    status?: string;
}

const EnhancedPropertyDetailsPage = () => {
    const { id } = useParams();
    const [property, setProperty] = useState<PropertyDetailModel | null>(null);
    const [invoices, setInvoices] = useState<InvoiceModel[]>([]);
    const [payments, setPayments] = useState<Record<string, PaymentRecord[]>>({});
    const [expandedInvoice, setExpandedInvoice] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<TabType>('overview');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(5);

    useEffect(() => {
        const fetchData = async () => {
            if (!id) return;
            setIsLoading(true);
            try {
                const [propData, invoicesResult, paymentsResult] = await Promise.all([
                    propertyService.getById(id),
                    invoiceService.getAll({ propertyId: id }),
                    paymentService.getAll(),
                ]);

                // Normalize property data
                const units = (propData.units || []).map((u: any) => ({
                    id: u.id,
                    unitNumber: u.unit_number ?? u.unitNumber,
                    description: u.description,
                    baseRent: u.base_rent ?? u.baseRent ?? 0,
                    isActive: u.is_active ?? u.isActive ?? true,
                    assignments: (u.renter_unit_assignments || []).map((a: any) => ({
                        id: a.id,
                        startDate: a.start_date ?? a.startDate,
                        endDate: a.end_date ?? a.endDate,
                        monthlyRent: a.monthly_rent ?? a.monthlyRent,
                        renter: a.renters ? { id: a.renters.id, fullName: a.renters.full_name, email: a.renters.email } : null,
                    })),
                }));

                setProperty({
                    id: propData.id,
                    name: propData.name,
                    address: propData.address,
                    rentalMode: propData.rental_mode ?? propData.rentalMode,
                    description: propData.description,
                    isActive: propData.is_active ?? propData.isActive,
                    createdAt: propData.created_at ?? propData.createdAt,
                    units,
                    invoiceSummary: { total: 0, paid: 0, overdue: 0, totalAmount: 0 },
                });

                // Normalize invoices
                const normalizedInvoices = (invoicesResult.items || []).map((inv: any) => ({
                    id: inv.id,
                    invoiceNumber: inv.invoice_number ?? inv.invoiceNumber,
                    status: inv.status,
                    totalAmount: inv.total_amount ?? inv.totalAmount ?? 0,
                    outstandingAmount: inv.outstanding_amount ?? inv.outstandingAmount ?? 0,
                    dueDate: inv.due_date ?? inv.dueDate,
                    renter: inv.renters ? { id: inv.renters.id, fullName: inv.renters.full_name } : (inv.renter ?? {}),
                    unit: inv.units ? { id: inv.units.id, unitNumber: inv.units.unit_number } : (inv.unit ?? {}),
                    property: { id: propData.id, name: propData.name },
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
                setError('Failed to fetch property details');
            } finally {
                setIsLoading(false);
            }
        };
        if (id) fetchData();
    }, [id]);

    const handleEditProperty = async (propertyId: string, updatedData: any) => {
        try {
            await propertyService.update(propertyId, updatedData);
            const data = await propertyService.getById(propertyId);
            setProperty(data as any);
            setIsEditModalOpen(false);
        } catch (err: any) {
            alert(err.message || 'Failed to update property');
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

    if (!property) {
        return <Alert variant="warning" title="Not Found">Property not found</Alert>;
    }

    const vacantUnits = property.units.filter(u => !u.assignments || u.assignments.length === 0).length;
    const occupancyRate = property.units.length > 0 
        ? Math.round(((property.units.length - vacantUnits) / property.units.length) * 100)
        : 0;

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

    const paginatedInvoices = invoices.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    return (
        <div className="space-y-4 lg:space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                    <Link to="/owner/properties" className="text-blue-600 hover:text-blue-700 text-xs lg:text-sm mb-2 inline-block">
                        ← Back to Properties
                    </Link>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mt-2">
                        <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 break-words">{property.name}</h1>
                        <Badge variant={property.isActive ? 'success' : 'warning'}>
                            {property.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                    </div>
                    <p className="text-sm lg:text-base text-gray-600 mt-1 break-words">{property.address}</p>
                </div>
                <Button 
                    variant="primary"
                    size="lg"
                    onClick={() => setIsEditModalOpen(true)}
                    className="w-full sm:w-auto shrink-0"
                >
                    ✏️ Edit Property
                </Button>
            </div>

            <EditPropertyModal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                onSave={handleEditProperty}
                property={property}
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
                        <p className="text-xs font-semibold text-purple-600 uppercase tracking-wide">Occupancy</p>
                        <p className="text-lg lg:text-2xl font-bold text-purple-900 mt-2">{occupancyRate.toFixed(2)}%</p>
                        <p className="text-xs text-purple-700 mt-2">{property.units.length - vacantUnits} of {property.units.length} units</p>
                    </div>
                </Card>
            </div>

            <Card>
                <div className="border-b border-gray-200 overflow-x-auto">
                    <div className="flex gap-4 lg:gap-8 px-4 lg:px-6 min-w-max">
                        {[
                            { id: 'overview', label: '📋 Overview' },
                            { id: 'units', label: '🏠 Units & Renters' },
                            { id: 'invoices', label: '📄 Invoices' }
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
                                    <h3 className="text-sm font-semibold text-gray-900 mb-4">Property Information</h3>
                                    <dl className="space-y-3">
                                        <div>
                                            <dt className="text-xs font-medium text-gray-600">Rental Mode</dt>
                                            <dd className="text-sm text-gray-900 mt-1">{property.rentalMode}</dd>
                                        </div>
                                        <div>
                                            <dt className="text-xs font-medium text-gray-600">Total Units</dt>
                                            <dd className="text-sm text-gray-900 mt-1">{property.units.length}</dd>
                                        </div>
                                        <div>
                                            <dt className="text-xs font-medium text-gray-600">Vacant Units</dt>
                                            <dd className="text-sm text-gray-900 mt-1">{vacantUnits}</dd>
                                        </div>
                                        <div>
                                            <dt className="text-xs font-medium text-gray-600">Description</dt>
                                            <dd className="text-sm text-gray-900 mt-1">{property.description || 'No description'}</dd>
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
                                            <dt className="text-xs font-medium text-gray-600">Collection Rate</dt>
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
                                            <dt className="text-xs font-medium text-gray-600">Total Payments Processed</dt>
                                            <dd className="text-sm text-gray-900 mt-1">{formatCurrency(paymentStats.totalProcessed)}</dd>
                                        </div>
                                    </dl>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'units' && (
                        <div className="space-y-4">
                            {property.units.length === 0 ? (
                                <p className="text-gray-500 text-center py-8">No units found for this property</p>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {property.units.map(unit => (
                                        <div key={unit.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                                            <div className="flex items-start justify-between mb-3">
                                                <div>
                                                    <h4 className="font-semibold text-gray-900">Unit {unit.unitNumber}</h4>
                                                    <p className="text-xs text-gray-600 mt-1">{unit.description || 'No description'}</p>
                                                </div>
                                                <Badge variant={unit.isActive ? 'success' : 'warning'}>
                                                    {unit.isActive ? 'Active' : 'Inactive'}
                                                </Badge>
                                            </div>
                                            <div className="mb-3 pb-3 border-b border-gray-200">
                                                <p className="text-sm text-gray-600">Base Rent: <span className="font-semibold text-gray-900">{formatCurrency(unit.baseRent)}</span></p>
                                            </div>
                                            <div>
                                                <p className="text-xs font-medium text-gray-600 mb-2">Assigned Renters:</p>
                                                {unit.assignments && unit.assignments.length > 0 ? (
                                                    <ul className="space-y-2">
                                                        {unit.assignments.map(assignment => (
                                                            <li key={assignment.id} className="text-sm bg-blue-50 p-2 rounded hover:bg-blue-100 transition-colors">
                                                                <Link to={`/owner/renters/${assignment.renter.id}`} className="block">
                                                                    <p className="font-medium text-blue-600 hover:text-blue-800">{assignment.renter.fullName}</p>
                                                                    <p className="text-xs text-gray-600">{assignment.renter.email}</p>
                                                                    <p className="text-xs text-gray-600">Monthly: {formatCurrency(assignment.monthlyRent)}</p>
                                                                    <p className="text-xs text-gray-600">Start: {new Date(assignment.startDate).toLocaleDateString()}</p>
                                                                    <p className="text-xs text-gray-600">End: {assignment.endDate ? new Date(assignment.endDate).toLocaleDateString() : 'Ongoing'}</p>
                                                                </Link>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                ) : (
                                                    <p className="text-sm text-yellow-600 font-medium">Vacant</p>
                                                )}
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
                                                        <span className="text-xs text-gray-500 lg:hidden">Renter:</span>
                                                        <p className="text-xs lg:text-sm text-gray-600 truncate">{invoice.renter.fullName}</p>
                                                    </div>
                                                    <div className="flex justify-between lg:block">
                                                        <span className="text-xs text-gray-500 lg:hidden">Unit:</span>
                                                        <p className="text-xs lg:text-sm text-gray-600">{invoice.unit.unitNumber}</p>
                                                    </div>
                                                    <div className="flex justify-between lg:block">
                                                        <span className="text-xs text-gray-500 lg:hidden">Amount:</span>
                                                        <p className="text-sm lg:text-sm font-semibold text-gray-900">{formatCurrency(invoice.totalAmount)}</p>
                                                    </div>
                                                    <div className="flex items-center justify-between gap-2">
                                                        <div className="flex justify-between lg:block flex-1">
                                                            <span className="text-xs text-gray-500 lg:hidden">Due:</span>
                                                            <p className="text-xs lg:text-sm text-gray-600">{formatDate(invoice.dueDate)}</p>
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
                                                                        <span className="text-gray-600">{formatDate(payment.paymentDate)}</span>
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

export default EnhancedPropertyDetailsPage;
