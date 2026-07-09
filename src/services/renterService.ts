import { auth, db } from '../lib/client';

export interface CreateRenterDto {
    fullName: string;
    email?: string;
    phone?: string;
    idNumber?: string;
}

export interface UpdateRenterDto {
    fullName: string;
    email?: string;
    phone?: string;
    idNumber?: string;
}

export interface AssignUnitDto {
    unitId: string;
    startDate: string;
    monthlyRent: number;
    endDate?: string;
}

const toRenter = (r: any) => ({
    id: r.id,
    fullName: r.full_name,
    email: r.email,
    phone: r.phone,
    idNumber: r.id_number,
    isActive: r.is_active,
    activeAssignments: r.renter_unit_assignments ?? [],
});

export const renterService = {
    async create(data: CreateRenterDto) {
        const { data: { user } } = await auth.getUser();
        const { data: row, error } = await db.from('renters').insert({
            full_name: data.fullName,
            email: data.email ?? null,
            phone: data.phone ?? null,
            id_number: data.idNumber ?? null,
            owner_id: user!.id,
            is_active: true,
        }).select().single();
        if (error) throw new Error(error.message);
        return toRenter(row);
    },

    async getAll(page = 1, pageSize = 50) {
        const { data: { user } } = await auth.getUser();
        const from = (page - 1) * pageSize;
        const { data, error, count } = await db.from('renters')
            .select('*, renter_unit_assignments(*)', { count: 'exact' })
            .eq('owner_id', user!.id)
            .eq('is_deleted', false)
            .range(from, from + pageSize - 1);
        if (error) throw new Error(error.message);
        return {
            items: (data ?? []).map(toRenter),
            pagination: { page, pageSize, total: count ?? 0, totalPages: Math.ceil((count ?? 0) / pageSize) },
        };
    },

    async update(id: string, data: UpdateRenterDto) {
        const { data: row, error } = await db.from('renters').update({
            full_name: data.fullName,
            email: data.email ?? null,
            phone: data.phone ?? null,
            id_number: data.idNumber ?? null,
        }).eq('id', id).select().single();
        if (error) throw new Error(error.message);
        return toRenter(row);
    },

    async delete(id: string) {
        const { error } = await db.from('renters').update({ is_deleted: true }).eq('id', id);
        if (error) throw new Error(error.message);
    },

    async assignUnit(renterId: string, data: AssignUnitDto) {
        const { data: row, error } = await db.from('renter_unit_assignments').insert({
            renter_id: renterId,
            unit_id: data.unitId,
            start_date: data.startDate,
            end_date: data.endDate ?? null,
            monthly_rent: data.monthlyRent,
        }).select().single();
        if (error) throw new Error(error.message);
        return row;
    },

    async updateRent(assignmentId: string, monthlyRent: number) {
        const { data: row, error } = await db.from('renter_unit_assignments')
            .update({ monthly_rent: monthlyRent })
            .eq('id', assignmentId)
            .select().single();
        if (error) throw new Error(error.message);
        return row;
    },
};
