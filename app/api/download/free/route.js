import { NextResponse } from 'next/server';

export async function POST(request) {
  return NextResponse.json({ message: 'Free download endpoint — Coming Soon' }, { status: 200 });
}
