import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    return NextResponse.json({ success: true, review: body })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}