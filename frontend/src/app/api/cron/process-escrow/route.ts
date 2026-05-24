import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  // Verify Vercel cron secret
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const backendUrl = process.env.BACKEND_URL;
  if (!backendUrl) {
    return NextResponse.json({ error: 'BACKEND_URL not configured' }, { status: 500 });
  }

  try {
    const res = await fetch(`${backendUrl}/api/v1/internal/cron/process-escrow`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Cron-Secret': process.env.CRON_SECRET || '',
      },
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    console.error('Cron proxy error:', err);
    return NextResponse.json({ error: 'Failed to reach backend' }, { status: 502 });
  }
}
