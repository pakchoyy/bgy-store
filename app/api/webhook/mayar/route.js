import { NextResponse } from 'next/server';

export async function POST(request) {
  return NextResponse.json({ message: 'Mayar webhook endpoint — Coming Soon' }, { status: 200 });
}
