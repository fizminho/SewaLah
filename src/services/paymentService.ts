import { db, storage } from '../lib/client';

export interface RecordPaymentDto {
    invoiceId: string;
    renterId: string;
    amountPaid: number;
    paymentDate: string;
    paymentMethod: 'BankTransfer' | 'Cash' | 'Cheque';
    proofFile?: File;
    notes?: string;
}

export const paymentService = {
    async record(data: RecordPaymentDto) {
        // File upload routed through storage proxy — bucket name never exposed here
        const proofFilePath = data.proofFile
            ? await storage.uploadProof(data.proofFile)
            : null;

        const { data: payment, error } = await db.from('payments').insert({
            transaction_number: `TXN-${Date.now()}`,
            invoice_id: data.invoiceId,
            renter_id: data.renterId,
            amount_paid: data.amountPaid,
            payment_date: data.paymentDate,
            payment_method: data.paymentMethod,
            proof_file_path: proofFilePath,
            notes: data.notes ?? null,
            status: 'Pending',
        }).select().single();
        if (error) throw new Error(error.message);
        return payment;
    },

    async verify(id: string) {
        const { data: payment, error: fetchErr } = await db.from('payments')
            .select('invoice_id, amount_paid').eq('id', id).single();
        if (fetchErr) throw new Error(fetchErr.message);

        const { error } = await db.from('payments').update({ status: 'Verified' }).eq('id', id);
        if (error) throw new Error(error.message);

        const { data: invoice } = await db.from('invoices')
            .select('outstanding_amount').eq('id', payment.invoice_id).single();
        if (invoice) {
            const newOutstanding = Math.max(0, invoice.outstanding_amount - payment.amount_paid);
            await db.from('invoices').update({
                outstanding_amount: newOutstanding,
                status: newOutstanding === 0 ? 'Paid' : 'Issued',
                paid_date: newOutstanding === 0 ? new Date().toISOString() : null,
            }).eq('id', payment.invoice_id);
        }
    },

    async reject(id: string, reason: string) {
        const { error } = await db.from('payments')
            .update({ status: 'Rejected', notes: reason }).eq('id', id);
        if (error) throw new Error(error.message);
    },

    async getAll(params?: { status?: string; invoiceId?: string; renterId?: string; page?: number; pageSize?: number; }) {
        const page = params?.page ?? 1;
        const pageSize = params?.pageSize ?? 50;
        const from = (page - 1) * pageSize;

        let q = db.from('payments')
            .select('*, invoices(id, invoice_number, total_amount, due_date), renters(id, full_name)', { count: 'exact' })
            .range(from, from + pageSize - 1);

        if (params?.status) q = q.eq('status', params.status);
        if (params?.invoiceId) q = q.eq('invoice_id', params.invoiceId);
        if (params?.renterId) q = q.eq('renter_id', params.renterId);

        const { data, error, count } = await q;
        if (error) throw new Error(error.message);
        return {
            items: data ?? [],
            pagination: { page, pageSize, total: count ?? 0, totalPages: Math.ceil((count ?? 0) / pageSize) },
        };
    },

    async getMyPayments(renterId: string, page = 1, pageSize = 50) {
        const from = (page - 1) * pageSize;
        const { data, error, count } = await db.from('payments')
            .select('*, invoices(id, invoice_number, total_amount, due_date)', { count: 'exact' })
            .eq('renter_id', renterId)
            .range(from, from + pageSize - 1);
        if (error) throw new Error(error.message);
        return {
            items: data ?? [],
            pagination: { page, pageSize, total: count ?? 0, totalPages: Math.ceil((count ?? 0) / pageSize) },
        };
    },
};
