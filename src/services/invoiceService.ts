import { db } from '../lib/client';

export interface InvoiceLineItem {
    id?: string;
    itemType: 'Rent' | 'Utility' | 'Maintenance' | 'Other';
    description?: string;
    amount: number;
    quantity: number;
}

export interface CreateInvoiceDto {
    assignmentId: string;
    dueDate: string;
    lineItems: { type: 'Rent' | 'Utility' | 'Maintenance' | 'Other'; description?: string; amount: number; quantity: number; }[];
    notes?: string;
}

export const invoiceService = {
    async create(data: CreateInvoiceDto) {
        const totalAmount = data.lineItems.reduce((s, i) => s + i.amount * i.quantity, 0);

        const { data: assignment, error: aErr } = await db.from('renter_unit_assignments')
            .select('renter_id, unit_id').eq('id', data.assignmentId).single();
        if (aErr) throw new Error(aErr.message);

        const { data: invoice, error } = await db.from('invoices').insert({
            invoice_number: `INV-${Date.now()}`,
            assignment_id: data.assignmentId,
            renter_id: assignment.renter_id,
            unit_id: assignment.unit_id,
            due_date: data.dueDate,
            total_amount: totalAmount,
            outstanding_amount: totalAmount,
            status: 'Draft',
            notes: data.notes ?? null,
        }).select().single();
        if (error) throw new Error(error.message);

        const { error: liErr } = await db.from('invoice_line_items').insert(
            data.lineItems.map(li => ({
                invoice_id: invoice.id,
                item_type: li.type,
                description: li.description ?? null,
                amount: li.amount,
                quantity: li.quantity,
            }))
        );
        if (liErr) throw new Error(liErr.message);
        return invoice;
    },

    async issue(id: string) {
        const { data, error } = await db.from('invoices')
            .update({ status: 'Issued', issued_date: new Date().toISOString() })
            .eq('id', id).select().single();
        if (error) throw new Error(error.message);
        return data;
    },

    async getAll(params?: { status?: string; propertyId?: string; renterId?: string; dateFrom?: string; dateTo?: string; page?: number; pageSize?: number; }) {
        const page = params?.page ?? 1;
        const pageSize = params?.pageSize ?? 50;
        const from = (page - 1) * pageSize;

        let q = db.from('invoices')
            .select('*, renters(id, full_name, email, phone), units(id, unit_number, properties(id, name)), invoice_line_items(*)', { count: 'exact' })
            .eq('is_deleted', false)
            .range(from, from + pageSize - 1);

        if (params?.status) q = q.eq('status', params.status);
        if (params?.renterId) q = q.eq('renter_id', params.renterId);
        if (params?.dateFrom) q = q.gte('due_date', params.dateFrom);
        if (params?.dateTo) q = q.lte('due_date', params.dateTo);

        const { data, error, count } = await q;
        if (error) throw new Error(error.message);
        return {
            items: data ?? [],
            pagination: { page, pageSize, total: count ?? 0, totalPages: Math.ceil((count ?? 0) / pageSize) },
        };
    },

    async getById(id: string) {
        const { data, error } = await db.from('invoices')
            .select('*, renters(*), units(*, properties(*)), invoice_line_items(*), payments(*)')
            .eq('id', id).single();
        if (error) throw new Error(error.message);
        return data;
    },

    async getMyInvoices(renterId: string, page = 1, pageSize = 50) {
        const from = (page - 1) * pageSize;
        const { data, error, count } = await db.from('invoices')
            .select('*, units(id, unit_number, properties(id, name)), invoice_line_items(*)', { count: 'exact' })
            .eq('renter_id', renterId)
            .eq('is_deleted', false)
            .range(from, from + pageSize - 1);
        if (error) throw new Error(error.message);
        return {
            items: data ?? [],
            pagination: { page, pageSize, total: count ?? 0, totalPages: Math.ceil((count ?? 0) / pageSize) },
        };
    },
};
