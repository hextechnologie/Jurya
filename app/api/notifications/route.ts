import { NextResponse } from 'next/server'
import { mockNotifications } from '@/lib/coach-marketplace'

export async function GET() {
  return NextResponse.json({ notifications: mockNotifications })
}