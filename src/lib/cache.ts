function cacheUrl(key: string) {
    return `/api/cache/${encodeURIComponent(key)}`;
}

async function readJson<T>(res: Response): Promise<T> {
    const data = await res.json();
    if (!res.ok) {
        throw new Error(data.error || `Cache request failed: ${res.status}`);
    }

    return data as T;
}

export const cacheApi = {
    get: async <T>(key: string) => {
        const res = await fetch(cacheUrl(key), { cache: 'no-store' });
        const data = await readJson<{ value: T | null }>(res);
        return data.value;
    },
    set: async (key: string, value: unknown, ttlSeconds?: number) => {
        const res = await fetch(cacheUrl(key), {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ value, ttlSeconds })
        });

        return readJson<{ ok: true }>(res);
    },
    del: async (key: string) => {
        const res = await fetch(cacheUrl(key), { method: 'DELETE' });
        return readJson<{ ok: true; deleted: number }>(res);
    }
};
