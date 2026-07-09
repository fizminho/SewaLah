import { auth, db } from '../lib/client';

export interface OwnerQuickStats {
    totalProperties: number;
    activeRenters: number;
    vacantUnits: number;
    totalMonthlyRent: number;
    outstandingAmount: number;
    overdueCount: number;
}

export interface OwnerThisMonth {
    paidInvoices: number;
    unpaidInvoices: number;
    collectionRate: number;
}

export interface OwnerThisYear {
    paidInvoicesYTD: number;
    unpaidInvoicesYTD: number;
    totalToReceiveYTD: number;
    collectionRateYTD: number;
    averageMonthlyCollection: number;
    trendVsLastMonth: number;
}

export interface OwnerKPIs {
    daysSalesOutstanding: number;
    latePaymentRate: number;
    renterChurnRate: number;
    occupancyRate: number;
    averageRentPerUnit: number;
    largestOutstandingInvoice: number;
    oldestOverdueInvoiceDays: number;
}

export interface RenterQuickStats {
    totalAmountDue: number;
    amountPaidThisMonth: number;
    paymentStatus: string;
    daysUntilDue: number;
    overdueDays: number;
}

export interface RenterObligations {
    totalOutstanding: number;
    unpaidInvoicesCount: number;
    earliestDueDate?: string;
    paymentStatus: string;
    daysOverdue: number;
}

// ── helpers ───────────────────────────────────────────────────────────────────

async function ownerPropertyIds(ownerId: string): Promise<string[]> {
    const { data } = await db.from('properties').select('id').eq('owner_id', ownerId).eq('is_deleted', false);
    return (data ?? []).map((p: any) => p.id);
}

async function ownerUnitIds(ownerId: string): Promise<string[]> {
    const pids = await ownerPropertyIds(ownerId);
    if (!pids.length) return [];
    const { data } = await db.from('units').select('id').in('property_id', pids).eq('is_deleted', false);
    return (data ?? []).map((u: any) => u.id);
}

async function ownerRenterIds(ownerId: string): Promise<string[]> {
    const { data } = await db.from('renters').select('id').eq('owner_id', ownerId).eq('is_deleted', false);
    return (data ?? []).map((r: any) => r.id);
}

// ── service ───────────────────────────────────────────────────────────────────

export const dashboardService = {
    async getOwnerQuickStats(): Promise<OwnerQuickStats> {
        const { data: { user } } = await auth.getUser();
        const oid = user!.id;

        const [propRes, rentRes, unitRes, invRes] = await Promise.all([
            db.from('properties').select('id', { count: 'exact' }).eq('owner_id', oid).eq('is_deleted', false),
            db.from('renters').select('id', { count: 'exact' }).eq('owner_id', oid).eq('is_active', true).eq('is_deleted', false),
            db.from('units').select('id, is_active, renter_unit_assignments(id)').eq('is_deleted', false)
                .in('property_id', await ownerPropertyIds(oid)),
            db.from('invoices').select('outstanding_amount, status').eq('is_deleted', false)
                .in('unit_id', await ownerUnitIds(oid)),
        ]);

        const units = unitRes.data ?? [];
        const invoices = invRes.data ?? [];
        const vacantUnits = units.filter((u: any) => u.is_active && !u.renter_unit_assignments?.length).length;
        const outstandingAmount = invoices.reduce((s: number, i: any) => s + (i.outstanding_amount ?? 0), 0);
        const overdueCount = invoices.filter((i: any) => i.status === 'Overdue').length;

        const { data: asgn } = await db.from('renter_unit_assignments')
            .select('monthly_rent').is('end_date', null).in('unit_id', await ownerUnitIds(oid));
        const totalMonthlyRent = (asgn ?? []).reduce((s: number, a: any) => s + (a.monthly_rent ?? 0), 0);

        return {
            totalProperties: propRes.count ?? 0,
            activeRenters: rentRes.count ?? 0,
            vacantUnits,
            totalMonthlyRent,
            outstandingAmount,
            overdueCount,
        };
    },

    async getOwnerThisMonth(): Promise<OwnerThisMonth> {
        const { data: { user } } = await auth.getUser();
        const now = new Date();
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
        const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString();
        const uids = await ownerUnitIds(user!.id);

        const { data: invoices } = await db.from('invoices').select('status')
            .in('unit_id', uids).gte('due_date', monthStart).lte('due_date', monthEnd).eq('is_deleted', false);

        const all = invoices ?? [];
        const paid = all.filter((i: any) => i.status === 'Paid').length;
        const unpaid = all.filter((i: any) => i.status !== 'Paid' && i.status !== 'Cancelled').length;
        const total = paid + unpaid;
        return { paidInvoices: paid, unpaidInvoices: unpaid, collectionRate: total > 0 ? Math.round((paid / total) * 100) : 0 };
    },

    async getOwnerThisYear(): Promise<OwnerThisYear> {
        const { data: { user } } = await auth.getUser();
        const yearStart = new Date(new Date().getFullYear(), 0, 1).toISOString();
        const uids = await ownerUnitIds(user!.id);

        const { data: invoices } = await db.from('invoices').select('status, total_amount')
            .in('unit_id', uids).gte('due_date', yearStart).eq('is_deleted', false);

        const all = invoices ?? [];
        const paid = all.filter((i: any) => i.status === 'Paid');
        const unpaid = all.filter((i: any) => i.status !== 'Paid' && i.status !== 'Cancelled');
        const totalToReceive = all.reduce((s: number, i: any) => s + (i.total_amount ?? 0), 0);
        const paidAmount = paid.reduce((s: number, i: any) => s + (i.total_amount ?? 0), 0);
        return {
            paidInvoicesYTD: paid.length,
            unpaidInvoicesYTD: unpaid.length,
            totalToReceiveYTD: totalToReceive,
            collectionRateYTD: totalToReceive > 0 ? Math.round((paidAmount / totalToReceive) * 100) : 0,
            averageMonthlyCollection: Math.round(paidAmount / (new Date().getMonth() + 1)),
            trendVsLastMonth: 0,
        };
    },

    async getOwnerKPIs(): Promise<OwnerKPIs> {
        const { data: { user } } = await auth.getUser();
        const uids = await ownerUnitIds(user!.id);

        const { data: invoices } = await db.from('invoices').select('status, outstanding_amount, due_date')
            .in('unit_id', uids).eq('is_deleted', false);
        const { data: units } = await db.from('units').select('id, base_rent, renter_unit_assignments(id)')
            .in('id', uids).eq('is_deleted', false);

        const all = invoices ?? [];
        const overdue = all.filter((i: any) => i.status === 'Overdue');
        const now = new Date();
        const oldestOverdue = overdue.reduce((max: number, i: any) => {
            const days = Math.floor((now.getTime() - new Date(i.due_date).getTime()) / 86400000);
            return days > max ? days : max;
        }, 0);
        const allUnits = units ?? [];
        const occupied = allUnits.filter((u: any) => u.renter_unit_assignments?.length > 0).length;
        const occupancyRate = allUnits.length > 0 ? Math.round((occupied / allUnits.length) * 100) : 0;
        const avgRent = allUnits.length > 0
            ? Math.round(allUnits.reduce((s: number, u: any) => s + (u.base_rent ?? 0), 0) / allUnits.length) : 0;

        return {
            daysSalesOutstanding: 0,
            latePaymentRate: all.length > 0 ? Math.round((overdue.length / all.length) * 100) : 0,
            renterChurnRate: 0,
            occupancyRate,
            averageRentPerUnit: avgRent,
            largestOutstandingInvoice: Math.max(0, ...all.map((i: any) => i.outstanding_amount ?? 0)),
            oldestOverdueInvoiceDays: oldestOverdue,
        };
    },

    async getOwnerRecentActivity() {
        const { data: { user } } = await auth.getUser();
        const rids = await ownerRenterIds(user!.id);
        if (!rids.length) return [];
        const { data } = await db.from('payments').select('id, amount_paid, created_at')
            .in('renter_id', rids).order('created_at', { ascending: false }).limit(10);
        return (data ?? []).map((p: any) => ({
            id: p.id, type: 'Payment',
            description: `Payment of RM${p.amount_paid} received`,
            timestamp: p.created_at,
        }));
    },

    async getRenterQuickStats(renterId: string): Promise<RenterQuickStats> {
        const now = new Date();
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

        const [{ data: invoices }, { data: payments }] = await Promise.all([
            db.from('invoices').select('outstanding_amount, due_date, status')
                .eq('renter_id', renterId).neq('status', 'Paid').neq('status', 'Cancelled'),
            db.from('payments').select('amount_paid').eq('renter_id', renterId)
                .eq('status', 'Verified').gte('payment_date', monthStart),
        ]);

        const all = invoices ?? [];
        const totalDue = all.reduce((s: number, i: any) => s + (i.outstanding_amount ?? 0), 0);
        const paidThisMonth = (payments ?? []).reduce((s: number, p: any) => s + (p.amount_paid ?? 0), 0);
        const earliest = [...all].sort((a: any, b: any) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime())[0];
        const daysUntilDue = earliest ? Math.floor((new Date(earliest.due_date).getTime() - now.getTime()) / 86400000) : 0;

        return {
            totalAmountDue: totalDue,
            amountPaidThisMonth: paidThisMonth,
            paymentStatus: totalDue === 0 ? 'Paid' : daysUntilDue < 0 ? 'Overdue' : 'Pending',
            daysUntilDue: Math.max(0, daysUntilDue),
            overdueDays: daysUntilDue < 0 ? Math.abs(daysUntilDue) : 0,
        };
    },

    async getRenterObligations(renterId: string): Promise<RenterObligations> {
        const { data: invoices } = await db.from('invoices').select('outstanding_amount, due_date, status')
            .eq('renter_id', renterId).neq('status', 'Paid').neq('status', 'Cancelled');

        const all = invoices ?? [];
        const total = all.reduce((s: number, i: any) => s + (i.outstanding_amount ?? 0), 0);
        const sorted = [...all].sort((a: any, b: any) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime());
        const earliest = sorted[0];
        const now = new Date();
        const daysOverdue = earliest
            ? Math.max(0, Math.floor((now.getTime() - new Date(earliest.due_date).getTime()) / 86400000)) : 0;

        return {
            totalOutstanding: total,
            unpaidInvoicesCount: all.length,
            earliestDueDate: earliest?.due_date,
            paymentStatus: total === 0 ? 'Paid' : daysOverdue > 0 ? 'Overdue' : 'Pending',
            daysOverdue,
        };
    },

    async getRenterRentals(renterId: string) {
        const { data } = await db.from('renter_unit_assignments')
            .select('id, monthly_rent, units(id, unit_number, properties(id, name, address))')
            .eq('renter_id', renterId).is('end_date', null);
        return data ?? [];
    },

    async getRenterPaymentHistory(renterId: string) {
        const { data } = await db.from('payments').select('amount_paid')
            .eq('renter_id', renterId).eq('status', 'Verified');
        const totalPaid = (data ?? []).reduce((s: number, p: any) => s + (p.amount_paid ?? 0), 0);
        return { totalPaidYTD: totalPaid, averagePaymentTime: 'N/A', onTimeRate: 'N/A' };
    },

    async getRenterRecentActivity(renterId: string) {
        const { data } = await db.from('payments').select('id, amount_paid, created_at')
            .eq('renter_id', renterId).order('created_at', { ascending: false }).limit(5);
        return (data ?? []).map((p: any) => ({
            id: p.id, type: 'Payment',
            description: `Payment of RM${p.amount_paid} submitted`,
            timestamp: p.created_at,
        }));
    },
};
