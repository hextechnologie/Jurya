import { NextRequest, NextResponse } from 'next/server'

/** Strip markdown so TTS never reads asterisks, hashes, etc. */
function stripMarkdown(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/gs, '$1')
    .replace(/\*(.+?)\*/gs, '$1')
    .replace(/__(.+?)__/gs, '$1')
    .replace(/_(.+?)_/gs, '$1')
    .replace(/#{1,6}\s+/gm, '')
    .replace(/`(.+?)`/g, '$1')
    .replace(/\[(.+?)\]\(.+?\)/g, '$1')
    .replace(/^[-*+]\s+/gm, '')
    .replace(/^\d+\.\s+/gm, '')
    .trim()
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { text, voiceId, voiceSettings } = body as {
      text: string
      voiceId: string
      voiceSettings?: { stability: number; similarity_boost: number; style: number; use_speaker_boost: boolean }
    }

    if (!text?.trim() || !voiceId) {
      return NextResponse.json({ error: 'Missing params' }, { status: 400 })
    }

    const apiKey = process.env.ELEVENLABS_API_KEY
    if (!apiKey) {
      console.error('TTS: ELEVENLABS_API_KEY is not set in environment variables')
      // 503 signals client to use Web Speech API fallback
      return NextResponse.json({ error: 'ElevenLabs not configured' }, { status: 503 })
    }

    const clean = stripMarkdown(text)
    if (!clean) return NextResponse.json({ error: 'Empty text' }, { status: 400 })

    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/stream`,
      {
        method: 'POST',
        headers: {
          'xi-api-key': apiKey,
          'Content-Type': 'application/json',
          Accept: 'audio/mpeg',
        },
        body: JSON.stringify({
          text: clean,
          model_id: 'eleven_flash_v2_5',
          voice_settings: voiceSettings ?? {
            stability: 0.32,
            similarity_boost: 0.82,
            style: 0.42,
            use_speaker_boost: true,
          },
        }),
      }
    )

    if (!response.ok) {
      const err = await response.text().catch(() => '')
      console.error('ElevenLabs TTS upstream error:', response.status, err)
      return NextResponse.json({ error: 'TTS upstream failed' }, { status: 502 })
    }

    const buf = await response.arrayBuffer()
    return new NextResponse(buf, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Cache-Control': 'no-store',
      },
    })
  } catch (err) {
    console.error('TTS route error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
