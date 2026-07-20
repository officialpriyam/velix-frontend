import { NextRequest, NextResponse } from 'next/server';
import http from 'http';
import https from 'https';

const BINARY_PREFIXES = ['compiler/artifact', 'generator/download/', 'generator/preview/'];

export async function GET(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
    return proxy(req, (await params).path.join('/'), 'GET');
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
    return proxy(req, (await params).path.join('/'), 'POST');
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
    return proxy(req, (await params).path.join('/'), 'PATCH');
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
    return proxy(req, (await params).path.join('/'), 'PUT');
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
    return proxy(req, (await params).path.join('/'), 'DELETE');
}

async function proxy(req: NextRequest, path: string, method: string): Promise<NextResponse> {
    try {
        let body: string | undefined;
        if (method !== 'GET' && method !== 'DELETE') {
            try {
                const ab = await req.arrayBuffer();
                body = Buffer.from(ab).toString('utf-8');
            } catch {}
        }

        const cookie = req.headers.get('cookie') || '';
        const contentType = req.headers.get('content-type') || 'application/json';
        const isBinary = BINARY_PREFIXES.some(p => path.startsWith(p));

        const result = await httpRequest(path, method, body, cookie, contentType, isBinary);

        if (isBinary) {
            const headers = new Headers();
            headers.set('Content-Type', result.headers['content-type'] || 'application/octet-stream');
            if (result.headers['content-disposition']) {
                headers.set('Content-Disposition', result.headers['content-disposition']);
            }
            return new NextResponse(result.rawBuffer || new Uint8Array(), { status: result.status, headers });
        }

        const headers = new Headers();
        headers.set('Content-Type', 'application/json');

        const setCookies = result.setCookies;
        if (setCookies.length > 0) {
            const res = new NextResponse(JSON.stringify(result.data), { status: result.status, headers });
            for (const sc of setCookies) {
                res.headers.append('Set-Cookie', sc);
            }
            return res;
        }

        return NextResponse.json(result.data, { status: result.status });
    } catch (err: any) {
        console.error(`[API Proxy /${path}] Error:`, err.message);
        return NextResponse.json({ error: err.message || 'Proxy failed' }, { status: 500 });
    }
}

interface ProxyResult {
    status: number;
    data?: any;
    rawBuffer?: Uint8Array;
    rawBody?: string;
    headers: Record<string, string>;
    setCookies: string[];
}

function httpRequest(path: string, method: string, body?: string, cookie?: string, contentType?: string, binary: boolean = false): Promise<ProxyResult> {
    const backendUrl = process.env.BACKEND_URL || 'http://127.0.0.1:3006';
    const parsed = new URL(backendUrl);

    return new Promise((resolve, reject) => {
        const isHttps = parsed.protocol === 'https:';
        const options: http.RequestOptions = {
            hostname: parsed.hostname,
            port: parsed.port || (isHttps ? 443 : 80),
            path: `/api/${path}`,
            method,
            headers: {
                'Content-Type': contentType || 'application/json',
                ...(cookie ? { 'cookie': cookie } : {}),
                ...(body ? { 'Content-Length': Buffer.byteLength(body) } : {})
            },
            timeout: 180000
        };

        const client = isHttps ? https : http;
        const req = client.request(options, (res) => {
            const chunks: Buffer[] = [];
            const respHeaders: Record<string, string> = {};
            const setCookies: string[] = [];

            Object.entries(res.headers).forEach(([k, v]) => {
                if (v === undefined) return;
                if (k.toLowerCase() === 'set-cookie') {
                    const vals = Array.isArray(v) ? v : [v];
                    setCookies.push(...vals);
                } else {
                    respHeaders[k] = Array.isArray(v) ? v[0] : v;
                }
            });

            res.on('data', (chunk) => chunks.push(chunk));
            res.on('end', () => {
                const rawBuffer = Buffer.concat(chunks);

                if (binary) {
                    resolve({ status: res.statusCode || 500, rawBuffer: new Uint8Array(rawBuffer), headers: respHeaders, setCookies });
                    return;
                }

                const rawBody = rawBuffer.toString('utf-8');
                try {
                    resolve({ status: res.statusCode || 500, data: JSON.parse(rawBody), rawBody, headers: respHeaders, setCookies });
                } catch {
                    resolve({ status: res.statusCode || 500, data: { raw: rawBody }, rawBody, headers: respHeaders, setCookies });
                }
            });
        });

        req.on('error', reject);
        req.on('timeout', () => { req.destroy(); reject(new Error('Request timed out')); });
        if (body) req.write(body);
        req.end();
    });
}
