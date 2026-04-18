import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

export async function POST(request: NextRequest) {
  try {
    const { feedback, targetLanguage } = await request.json()

    if (!feedback || !targetLanguage) {
      return NextResponse.json({ error: 'Missing feedback or target language' }, { status: 400 })
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json({ feedback })
    }

    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
    const prompt = `Translate the following feedback object into ${targetLanguage}.
Keep the JSON structure exactly the same.
Do not change score or metrics values.
Return only valid JSON.

${JSON.stringify(feedback)}`

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1200,
      system: 'You are a translation assistant. Preserve JSON keys and return valid JSON only.',
      messages: [{ role: 'user', content: prompt }],
    })

    const content = response.content[0]
    const text = content.type === 'text' ? content.text : ''
    const jsonMatch = text.match(/\{[\s\S]*\}/)

    if (!jsonMatch) {
      return NextResponse.json({ feedback })
    }

    return NextResponse.json({ feedback: JSON.parse(jsonMatch[0]) })
  } catch (error: any) {
    console.error('Translate feedback error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
