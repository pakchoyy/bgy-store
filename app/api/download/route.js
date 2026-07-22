import { NextResponse } from 'next/server';

export async function GET(request) {
  return NextResponse.json({ message: 'Download endpoint — Coming Soon' }, { status: 200 });
}
