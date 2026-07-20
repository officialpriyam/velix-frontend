type SupabaseFilter = Record<string, string | number | boolean | null>;

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

function assertSupabaseConfig() {
    if (!supabaseUrl || !supabaseAnonKey) {
        throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY');
    }
}

function buildUrl(table: string, filters?: SupabaseFilter) {
    assertSupabaseConfig();

    const url = new URL(`/rest/v1/${table}`, supabaseUrl);
    if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
            if (value !== undefined) {
                url.searchParams.set(key, `eq.${value}`);
            }
        });
    }

    return url;
}

async function request<T>(url: URL, init?: RequestInit): Promise<T> {
    assertSupabaseConfig();

    const res = await fetch(url, {
        ...init,
        headers: {
            apikey: supabaseAnonKey!,
            Authorization: `Bearer ${supabaseAnonKey}`,
            'Content-Type': 'application/json',
            Prefer: 'return=representation',
            ...init?.headers
        }
    });

    if (!res.ok) {
        const message = await res.text();
        throw new Error(`Supabase request failed: ${res.status} ${message}`);
    }

    if (res.status === 204) {
        return undefined as T;
    }

    return res.json() as Promise<T>;
}

export const supabaseDb = {
    select: <T>(table: string, filters?: SupabaseFilter) => {
        return request<T[]>(buildUrl(table, filters), { method: 'GET' });
    },
    insert: <T>(table: string, values: Record<string, unknown> | Record<string, unknown>[]) => {
        return request<T[]>(buildUrl(table), {
            method: 'POST',
            body: JSON.stringify(values)
        });
    },
    update: <T>(table: string, filters: SupabaseFilter, values: Record<string, unknown>) => {
        return request<T[]>(buildUrl(table, filters), {
            method: 'PATCH',
            body: JSON.stringify(values)
        });
    },
    remove: <T>(table: string, filters: SupabaseFilter) => {
        return request<T[]>(buildUrl(table, filters), { method: 'DELETE' });
    }
};

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);
