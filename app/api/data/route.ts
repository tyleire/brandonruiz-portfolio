import { NextResponse } from 'next/server';
import { getData, saveData } from '@/lib/data';
import { getSession } from '@/lib/session';

export async function GET() {
  const data = await getData();
  return NextResponse.json(data);
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session.admin_auth) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 403 });
  }
  const body = await req.json();
  await saveData(body);
  return NextResponse.json({ ok: true });
}
