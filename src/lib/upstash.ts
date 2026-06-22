const upstashUrl = process.env.UPSTASH_REDIS_REST_URL;
const upstashToken = process.env.UPSTASH_REDIS_REST_TOKEN;

function assertUpstashConfig() {
    if (!upstashUrl || !upstashToken) {
        throw new Error('Missing UPSTASH_REDIS_REST_URL or UPSTASH_REDIS_REST_TOKEN');
    }
}

async function command<T>(args: unknown[]): Promise<T> {
    assertUpstashConfig();

    const res = await fetch(upstashUrl!, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${upstashToken}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(args),
        cache: 'no-store'
    });

    if (!res.ok) {
        const message = await res.text();
        throw new Error(`Upstash request failed: ${res.status} ${message}`);
    }

    const data = await res.json() as { result?: T; error?: string };
    if (data.error) {
        throw new Error(data.error);
    }

    return data.result as T;
}

export const redis = {
    get: <T>(key: string) => command<string | null>(['GET', key]).then((value) => {
        if (value === null) return null;
        return JSON.parse(value) as T;
    }),
    set: (key: string, value: unknown, ttlSeconds?: number) => {
        const args = ttlSeconds
            ? ['SET', key, JSON.stringify(value), 'EX', ttlSeconds]
            : ['SET', key, JSON.stringify(value)];

        return command<'OK'>(args);
    },
    del: (key: string) => command<number>(['DEL', key]),
    ping: () => command<string>(['PING'])
};

export const isUpstashConfigured = Boolean(upstashUrl && upstashToken);
