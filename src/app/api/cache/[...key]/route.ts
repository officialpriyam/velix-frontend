import { NextRequest, NextResponse } from 'next/server';
import { redis } from '@/lib/upstash';

export const runtime = 'nodejs';

type RouteContext = {
    params: Promise<{ key: string[] }>;
};

async function readKey(context: RouteContext) {
    const { key } = await context.params;
    return key.map(decodeURIComponent).join('/');
}

function errorResponse(error: unknown, status = 500) {
    return NextResponse.json(
        { error: error instanceof Error ? error.message : 'Cache request failed' },
        { status }
    );
}

export async function GET(_request: NextRequest, context: RouteContext) {
    try {
        const key = await readKey(context);
        const value = await redis.get<unknown>(key);

        return NextResponse.json({ value });
    } catch (error) {
        return errorResponse(error);
    }
}

export async function PUT(request: NextRequest, context: RouteContext) {
    try {
        const key = await readKey(context);
        const { value, ttlSeconds } = await request.json();

        await redis.set(key, value, ttlSeconds);

        return NextResponse.json({ ok: true });
    } catch (error) {
        return errorResponse(error);
    }
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
    try {
        const key = await readKey(context);
        const deleted = await redis.del(key);

        return NextResponse.json({ ok: true, deleted });
    } catch (error) {
        return errorResponse(error);
    }
}
