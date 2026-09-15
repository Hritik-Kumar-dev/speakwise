import { SCENARIOS } from '../../../src/lib/scenarios';
import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json(SCENARIOS);
}