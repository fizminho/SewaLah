/**
 * Supabase proxy client.
 * All DB queries and storage operations go through here.
 * Service files never import supabase-js directly.
 */
import { createClient, SupabaseClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!url || !key) {
    throw new Error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY');
}

const _client: SupabaseClient = createClient(url, key, {
    auth: { persistSession: true, autoRefreshToken: true },
});

// ── Auth ──────────────────────────────────────────────────────────────────────

export const auth = {
    signIn: (email: string, password: string) =>
        _client.auth.signInWithPassword({ email, password }),

    signUp: (email: string, password: string, meta?: Record<string, unknown>) =>
        _client.auth.signUp({ email, password, options: { data: meta } }),

    signOut: () => _client.auth.signOut(),

    getSession: () => _client.auth.getSession(),

    getUser: () => _client.auth.getUser(),

    onAuthStateChange: (cb: Parameters<SupabaseClient['auth']['onAuthStateChange']>[0]) =>
        _client.auth.onAuthStateChange(cb),
};

// ── Database ──────────────────────────────────────────────────────────────────

export const db = {
    from: (table: string) => _client.from(table),
};

// ── Storage ───────────────────────────────────────────────────────────────────

const BUCKET = 'payment-proofs';

export const storage = {
    /**
     * Upload a file to the payment-proofs bucket.
     * Returns the public URL — the bucket name and credentials are never
     * exposed to calling code.
     */
    async uploadProof(file: File): Promise<string> {
        const ext = file.name.split('.').pop();
        const path = `${crypto.randomUUID()}.${ext}`;
        const { error } = await _client.storage.from(BUCKET).upload(path, file, {
            cacheControl: '3600',
            upsert: false,
        });
        if (error) throw new Error(error.message);
        const { data } = _client.storage.from(BUCKET).getPublicUrl(path);
        return data.publicUrl;
    },

    /** Get a signed URL (60 min) for a private file path. */
    async signedUrl(path: string, expiresIn = 3600): Promise<string> {
        const { data, error } = await _client.storage
            .from(BUCKET)
            .createSignedUrl(path, expiresIn);
        if (error) throw new Error(error.message);
        return data.signedUrl;
    },
};
