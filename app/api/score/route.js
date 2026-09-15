import { scoreFreeform } from '../../../src/lib/score';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { transcript, duration } = await request.json();
    const result = scoreFreeform(String(transcript || ''), Number(duration) || 0);
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json({ error: 'Provide a valid transcript and duration.' }, { status: 400 });
  }
}