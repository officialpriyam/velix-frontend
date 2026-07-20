import { NextResponse } from 'next/server';
import { isUpstashConfigured, redis } from '@/lib/upstash';
import { isSupabaseConfigured } from '@/lib/supabase';

export const runtime = 'nodejs';

export async function GET() {
    let redisStatus: 'ok' | 'missing_config' | 'error' = 'missing_config';

    if (isUpstashConfigured) {
        try {
            await redis.ping();
            redisStatus = 'ok';
        } catch {
            redisStatus = 'error';
        }
    }

    return NextResponse.json({
        supabase: isSupabaseConfigured ? 'configured' : 'missing_config',
        upstash: redisStatus
    });
}
