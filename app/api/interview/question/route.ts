import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import Anthropic from '@anthropic-ai/sdk'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const getLanguageName = (code: string): string => {
  const languages: Record<string, string> = {
    en: 'English',
    es: 'Spanish',
    fr: 'French',
    de: 'German',
    it: 'Italian',
    pt: 'Portuguese',
    ar: 'Arabic',
    zh: 'Chinese',
    ja: 'Japanese',
    ko: 'Korean',
  }
  return languages[code] || 'English'
}

const SYSTEM_PROMPT = `You are an elite AI interview coach.
Ask exactly one realistic interview question at a time.
Tailor every question to the candidate's resume, target job description, role, experience level, and strongest skills.
Keep the tone warm, direct, and professional.
Do not provide feedback here. Only ask the next best question.`

function buildFallbackQuestion(session: any, questionNumber: number) {
  const config = session.interview_config || {}
  const keywords = config.personalizationKeywords?.slice(0, 3).join(', ')
  const role = session.job_role || 'candidate'

  if (questionNumber === 1) {
    return `Tell me about yourself and why you're a strong fit for this ${role} role.`
  }

  if ((config.interviewType || 'Mixed') === 'Technical') {
    return `Walk me through a project where you used ${keywords || 'your core technical skills'} to solve a difficult problem.`
  }

  if ((config.interviewType || 'Mixed') === 'Behavioral') {
    return `Tell me about a time you handled a challenge related to ${keywords || 'teamwork or communication'}. What was the outcome?`
  }

  return `What is one example from your background that shows you can deliver results in this ${role} position?`
}

export async function POST(request: NextRequest) {
  try {
    const { sessionId } = await request.json()

    const { data: session, error: sessionError } = await supabaseAdmin
      .from('interview_sessions')
      .select('*')
      .eq('id', sessionId)
      .single()

    if (sessionError || !session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    const questionNumber = session.questions_answered + 1

    if (questionNumber > 6) {
      await supabaseAdmin
        .from('interview_sessions')
        .update({ status: 'completed' })
        .eq('id', sessionId)

      return NextResponse.json({ completed: true })
    }

    const config = session.interview_config || {}
    const language = config.language || 'en'
    const keywords = (config.personalizationKeywords || []).join(', ')
    const languageInstruction = language !== 'en'
      ? `Respond only in ${getLanguageName(language)}.`
      : 'Respond only in English.'

    const stageInstruction = [
      'Start with a short opener that checks background fit.',
      'Ask a question tied to the strongest matching skill from the resume.',
      'Ask about a measurable result or project impact.',
      'Test problem solving or collaboration in a realistic scenario.',
      'Ask a leadership, prioritization, or stakeholder question.',
      'Finish with a high-signal closing question that mirrors a final-round interview.'
    ][questionNumber - 1]

    const companyMode = config.realCompanyMode && config.targetCompany
      ? `Use the style and rigor typically expected in interviews at ${config.targetCompany}, without claiming insider knowledge.`
      : ''

    const prompt = `
Candidate target role: ${session.job_role}
Experience level: ${session.difficulty_level}
Interview type: ${config.interviewType || 'Mixed'}
Interviewer persona: ${config.interviewerType || 'Hiring Manager'}
Interview round: ${config.interviewRound || 'First Round'}
Years of experience: ${config.yearsOfExperience || 0}
Top skills and keywords: ${keywords || (config.mainSkills || []).join(', ') || 'general problem solving'}
Resume context: ${config.resumeText || 'Not provided'}
Job description context: ${config.jobDescription || 'Not provided'}
Weak areas to challenge: ${(config.weakAreas || []).join(', ') || 'none'}
${companyMode}
${languageInstruction}
This is question ${questionNumber} of 6.
${stageInstruction}

Ask only the interview question.`

    let question = buildFallbackQuestion(session, questionNumber)

    if (process.env.ANTHROPIC_API_KEY) {
      const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
      const response = await anthropic.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 300,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: prompt }],
      })

      const content = response.content[0]
      if (content.type === 'text' && content.text.trim()) {
        question = content.text.trim()
      }
    }

    return NextResponse.json({
      question,
      questionNumber,
      completed: false,
    })
  } catch (error: any) {
    console.error('Error generating question:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
