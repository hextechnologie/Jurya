import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const sessionId = params.id

    // Fetch session
    const { data: session, error: sessionError } = await supabaseAdmin
      .from('interview_sessions')
      .select('*')
      .eq('id', sessionId)
      .single()

    if (sessionError || !session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    // Fetch answers
    const { data: answers } = await supabaseAdmin
      .from('interview_answers')
      .select('*')
      .eq('session_id', sessionId)
      .order('question_number', { ascending: true })

    // Build message history
    const messages = []
    if (answers && answers.length > 0) {
      for (const answer of answers) {
        messages.push({ role: 'assistant', content: answer.question_text })
        messages.push({ role: 'user', content: answer.user_answer })
        if (answer.ai_feedback) {
          messages.push({ role: 'feedback', content: 'Feedback', feedback: answer.ai_feedback })
        }
      }
    }

    return NextResponse.json({ session, messages })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const sessionId = params.id
    const authHeader = request.headers.get('Authorization')
    
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    
    // Verify user from token
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get the session to verify ownership
    const { data: session, error: fetchError } = await supabaseAdmin
      .from('interview_sessions')
      .select('*')
      .eq('id', sessionId)
      .single()

    if (fetchError || !session) {
      return NextResponse.json({ error: 'Interview session not found' }, { status: 404 })
    }

    if (session.user_id !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Delete the interview session (answers will cascade delete due to foreign key)
    const { error: deleteError } = await supabaseAdmin
      .from('interview_sessions')
      .delete()
      .eq('id', sessionId)

    if (deleteError) {
      throw deleteError
    }

    // NOTE: We do NOT refund the interview credit
    // The user has already used their credit to start the interview

    return NextResponse.json(
      { 
        success: true, 
        message: 'Interview deleted successfully. Credits are not refunded.' 
      },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('Error deleting interview:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to delete interview' },
      { status: 500 }
    )
  }
}
