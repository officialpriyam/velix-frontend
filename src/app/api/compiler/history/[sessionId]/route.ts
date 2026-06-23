import { NextRequest, NextResponse } from 'next/server';

const BACKEND = 'http://127.0.0.1:3006';

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ sessionId: string }> }
) {
    try {
        const { sessionId } = await params;
        const cookie = req.headers.get('cookie') || '';

        const res = await fetch(`${BACKEND}/api/compiler/history/${sessionId}`, {
            headers: { 'cookie': cookie }
        });

        const data = await res.json();
        return NextResponse.json(data, { status: res.status });
    } catch (err: any) {
        return NextResponse.json({ error: err.message || 'History fetch failed' }, { status: 500 });
    }
}
