export interface InvoiceModel {
    id: string;
    invoiceNumber: string;
    status: InvoiceStatus;
    totalAmount: number;
    outstandingAmount: number;
    dueDate: string;
    issuedDate?: string;
    renter: RenterBasicModel;
    unit: UnitBasicModel;
    property: PropertyBasicModel;
}

export interface PropertyBasicModel {
    id: string;
    name: string;
}

export interface UnitBasicModel {
    id: string;
    unitNumber: string;
}

export interface RenterModel {
    id: string;
    fullName: string;
    email?: string;
    phone?: string;
    isActive: boolean;
}

export enum RentalMode {
    WholeProperty = 'WholeProperty',
    ByRoom = 'ByRoom'
}

export enum InvoiceStatus {
    Draft = 'Draft',
    Issued = 'Issued',
    Overdue = 'Overdue',
    Paid = 'Paid',
    Cancelled = 'Cancelled'
}

export enum AuditAction {
    Create = 'Create',
    Update = 'Update',
    Delete = 'Delete'
}

export interface PropertyModel {
    id: string;
    name: string;
    address: string;
    rentalMode: RentalMode;
    description?: string;
    isActive: boolean;
    createdAt: string;
    unitCount: number;
    activeRenterCount: number;
}

export interface RenterBasicModel {
    id: string;
    fullName: string;
    email?: string;
    phone?: string;
}

export interface AssignmentModel {
    id: string;
    startDate: string;
    endDate?: string;
    monthlyRent: number;
    renter: RenterBasicModel;
}

export interface UnitModel {
    id: string;
    unitNumber: string;
    description?: string;
    baseRent: number;
    isActive: boolean;
    assignments: AssignmentModel[];
}

export interface InvoiceSummaryModel {
    total: number;
    paid: number;
    overdue: number;
    totalAmount: number;
}

export interface PropertyDetailModel {
    id: string;
    name: string;
    address: string;
    rentalMode: RentalMode;
    description?: string;
    isActive: boolean;
    createdAt: string;
    units: UnitModel[];
    invoiceSummary: InvoiceSummaryModel;
}

export interface PaginationModel {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
}

export interface PaginatedResult<T> {
    items: T[];
    pagination: PaginationModel;
}

export interface OwnerQuickStats {
    totalProperties: number;
    activeRenters: number;
    vacantUnits: number;
    monthlyRent: number;
    outstandingAmount: number;
}

export interface MonthlyStats {
    paidInvoices: number;
    unpaidInvoices: number;
    collectionRate: number;
}

export interface YearlyStats {
    ytdPaid: number;
    ytdUnpaid: number;
    ytdCollectionRate: number;
}

export interface KPIMetrics {
    daysSalesOutstanding: number;
    latePaymentRate: string;
    occupancyRate: string;
    churnRate: string;
}

export interface RecentActivity {
    id: string;
    type: string;
    description: string;
    timestamp: string;
}

export interface OwnerDashboardData {
    quickStats: OwnerQuickStats;
    thisMonth: MonthlyStats;
    thisYear: YearlyStats;
    kpis: KPIMetrics;
    recentActivity: RecentActivity[];
}

export interface RenterQuickStats {
    totalDue: number;
    paidThisMonth: number;
    paymentStatus: string;
    daysUntilDue: number;
}

export interface RenterObligations {
    totalOutstanding: number;
    unpaidInvoices: number;
    earliestDueDate: string;
}

export interface RentalUnit {
    id: string;
    propertyName: string;
    unitNumber: string;
    address: string;
    monthlyRent: number;
}

export interface PaymentHistory {
    totalPaidYTD: number;
    averagePaymentTime: string;
    onTimeRate: string;
}

export interface RenterDashboardData {
    quickStats: RenterQuickStats;
    obligations: RenterObligations;
    rentals: RentalUnit[];
    paymentHistory: PaymentHistory;
    recentActivity: RecentActivity[];
}

export interface PaymentModel {
    id: string;
    transactionNumber: string;
    amountPaid: number;
    paymentDate: string;
    paymentMethod: string;
    status: string;
    proofFilePath?: string;
    notes?: string;
    invoice: {
        id: string;
        invoiceNumber: string;
        totalAmount: number;
        dueDate?: string;
    };
    renter?: {
        id: string;
        fullName: string;
    };
    unit?: {
        id: string;
        unitNumber: string;
    };
    property?: {
        id: string;
        name: string;
    };
}
