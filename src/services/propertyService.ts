import { auth, db } from '../lib/client';

export interface Property {
    id: string;
    name: string;
    address: string;
    rentalMode: 'WholeProperty' | 'ByRoom';
    description?: string;
    isActive: boolean;
    unitCount?: number;
    activeRenterCount?: number;
}

export interface CreatePropertyDto {
    name: string;
    address: string;
    rentalMode: 'WholeProperty' | 'ByRoom';
    description?: string;
}

export interface UpdatePropertyDto {
    name: string;
    address: string;
    description?: string;
    isActive: boolean;
}

const toProperty = (r: any): Property => ({
    id: r.id,
    name: r.name,
    address: r.address,
    rentalMode: r.rental_mode,
    description: r.description,
    isActive: r.is_active,
    unitCount: r.unit_count ?? 0,
    activeRenterCount: r.active_renter_count ?? 0,
});

async function ownerId(): Promise<string> {
    const { data: { user } } = await auth.getUser();
    return user!.id;
}

export const propertyService = {
    async create(data: CreatePropertyDto) {
        const owner = await ownerId();
        const { data: row, error } = await db.from('properties').insert({
            name: data.name,
            address: data.address,
            rental_mode: data.rentalMode,
            description: data.description ?? null,
            owner_id: owner,
            is_active: true,
        }).select().single();
        if (error) throw new Error(error.message);
        return toProperty(row);
    },

    async getAll(page = 1, pageSize = 50) {
        const owner = await ownerId();
        const from = (page - 1) * pageSize;
        const { data, error, count } = await db.from('properties')
            .select('*', { count: 'exact' })
            .eq('owner_id', owner)
            .eq('is_deleted', false)
            .range(from, from + pageSize - 1);
        if (error) throw new Error(error.message);
        return {
            items: (data ?? []).map(toProperty),
            pagination: { page, pageSize, total: count ?? 0, totalPages: Math.ceil((count ?? 0) / pageSize) },
        };
    },

    async getById(id: string) {
        const { data, error } = await db.from('properties')
            .select('*, units(*, renter_unit_assignments(*, renters(*)))')
            .eq('id', id)
            .eq('is_deleted', false)
            .single();
        if (error) throw new Error(error.message);
        return data;
    },

    async update(id: string, data: UpdatePropertyDto) {
        const { data: row, error } = await db.from('properties').update({
            name: data.name,
            address: data.address,
            description: data.description ?? null,
            is_active: data.isActive,
        }).eq('id', id).select().single();
        if (error) throw new Error(error.message);
        return toProperty(row);
    },

    async delete(id: string) {
        const { error } = await db.from('properties').update({ is_deleted: true }).eq('id', id);
        if (error) throw new Error(error.message);
    },
};
