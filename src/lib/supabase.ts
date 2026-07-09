// Re-export from the proxy client so legacy imports still resolve.
// Do not add direct supabase-js usage here.
export { auth, db, storage } from './client';
