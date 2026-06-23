import { NextRequest, NextResponse } from 'next/server';
import http from 'http';

function proxyRequest(path: string, method: string, body?: any, cookie?: string): Promise<{ status: number; data: any; stream?: NodeJS.ReadableStream; headers?: Record<string, string> }> {
    return new Promise((resolve, reject) => {
        const postData = body ? JSON.stringify(body) : undefined;
        const options: http.RequestOptions = {
            hostname: '127.0.0.1',
            port: 3006,
            path: `/api/compiler/${path}`,
            method,
            headers: {
                'Content-Type': 'application/json',
                ...(cookie ? { 'cookie': cookie } : {}),
                ...(postData ? { 'Content-Length': Buffer.byteLength(postData) } : {})
            },
            timeout: 180000
        };

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => { data += chunk; });
            res.on('end', () => {
                try {
                    resolve({ status: res.statusCode || 500, data: JSON.parse(data) });
                } catch {
                    resolve({ status: res.statusCode || 500, data: { raw: data } });
                }
            });
        });

        req.on('error', (err) => reject(err));
        req.on('timeout', () => { req.destroy(); reject(new Error('Request timed out')); });

        if (postData) req.write(postData);
        req.end();
    });
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const cookie = req.headers.get('cookie') || '';
        const { status, data } = await proxyRequest('run', 'POST', body, cookie);
        return NextResponse.json(data, { status });
    } catch (err: any) {
        console.error('[API /compiler/run] Error:', err.message);
        return NextResponse.json({ error: err.message || 'Compiler proxy failed' }, { status: 500 });
    }
}
