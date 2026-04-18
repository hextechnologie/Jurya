import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { extractKeywords, summarizeText } from '@/lib/interview-personalization'

export async function POST(request: NextRequest) {
  try {
    const {
      resumeText,
      resumeFileName,
      jobTitle,
      industry,
      experienceLevel,
      jobDescription,
      language,
      interviewerType,
      interviewType,
      interviewRound,
      yearsOfExperience,
      mainSkills,
      weakAreas,
      targetCompany,
      realCompanyMode,
    } = await request.json()

    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized - No token provided' }, { status: 401 })
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: {
          headers: {
            Authorization: authHeader,
          },
        },
      }
    )

    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized - Invalid token' }, { status: 401 })
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    if (profile.interviews_used_this_month >= profile.interviews_limit) {
      return NextResponse.json({ error: 'Interview limit reached' }, { status: 403 })
    }

    // Normalize the onboarding inputs once so every later question can stay highly personalized.
    const keywordSource = [resumeText || '', jobDescription || '', ...(mainSkills || [])].join('\n')
    const personalizationKeywords = extractKeywords(keywordSource)
    const normalizedSkills = Array.isArray(mainSkills) && mainSkills.length > 0
      ? mainSkills
      : personalizationKeywords.slice(0, 6)

    const baseSessionPayload = {
      user_id: user.id,
      job_role: jobTitle,
      industry: industry || null,
      difficulty_level: (experienceLevel || 'mid').toLowerCase(),
      status: 'in_progress' as const,
      total_questions: 6,
      questions_answered: 0,
    }

    const enhancedSessionPayload = {
      ...baseSessionPayload,
      interview_config: {
        resumeText: summarizeText(resumeText || '', 2500),
        resumeFileName,
        jobDescription: summarizeText(jobDescription || '', 2500),
        language: language || 'en',
        interviewerType: interviewerType || 'Hiring Manager',
        interviewType: interviewType || 'Mixed',
        interviewRound: interviewRound || 'First Round',
        yearsOfExperience: yearsOfExperience || 0,
        mainSkills: normalizedSkills,
        weakAreas: weakAreas || [],
        role: jobTitle,
        targetCompany: targetCompany || '',
        realCompanyMode: Boolean(realCompanyMode),
        personalizationKeywords,
      },
    }

    // Some deployed databases may still be missing the newer interview_config column.
    // Retry without that field so interview creation still works instead of blocking the user.
    let { data: session, error: sessionError } = await supabaseAdmin
      .from('interview_sessions')
      .insert(enhancedSessionPayload)
      .select()
      .single()

    if (sessionError?.message?.toLowerCase().includes('interview_config')) {
      console.warn('interview_config column missing; retrying with base session payload')

      const fallbackResult = await supabaseAdmin
        .from('interview_sessions')
        .insert(baseSessionPayload)
        .select()
        .single()

      session = fallbackResult.data
      sessionError = fallbackResult.error
    }

    if (sessionError) {
      return NextResponse.json({ error: sessionError.message }, { status: 500 })
    }

    await supabaseAdmin
      .from('profiles')
      .update({ interviews_used_this_month: profile.interviews_used_this_month + 1 })
      .eq('id', user.id)

    return NextResponse.json({ sessionId: session.id, personalizationKeywords })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
