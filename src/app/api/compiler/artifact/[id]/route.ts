import { NextRequest } from 'next/server';

const BACKEND = 'http://127.0.0.1:3006';

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const cookie = req.headers.get('cookie') || '';

        const res = await fetch(`${BACKEND}/api/compiler/artifact/${id}`, {
            headers: { 'cookie': cookie }
        });

        if (!res.ok) {
            return new Response('Artifact not found', { status: res.status });
        }

        const contentType = res.headers.get('content-type') || 'application/octet-stream';
        const contentDisposition = res.headers.get('content-disposition') || 'attachment';

        return new Response(res.body, {
            status: 200,
            headers: {
                'Content-Type': contentType,
                'Content-Disposition': contentDisposition
            }
        });
    } catch (err: any) {
        return new Response('Download failed', { status: 500 });
    }
}
