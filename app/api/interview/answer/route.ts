import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import Anthropic from '@anthropic-ai/sdk'
import { Resend } from 'resend'
import { estimateCommunicationMetrics, normalizeFeedback } from '@/lib/interview-personalization'

const getLanguageName = (code: string) => {
  const languages: Record<string, string> = {
    en: 'English',
    fr: 'French',
    es: 'Spanish',
    ar: 'Arabic',
  }

  return languages[code] || 'English'
}

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const SYSTEM_PROMPT = `You are a senior interview coach.
Evaluate the answer and return ONLY valid JSON in this exact shape:
{
  "score": 1-10,
  "strengths": ["...", "..."],
  "weaknesses": ["...", "..."],
  "ideal_answer": "A concise high-quality example answer that directly addresses the question.",
  "improved_answer": "Rewrite the candidate's answer using the STAR method and stronger wording.",
  "quick_fix": "One most important actionable tip.",
  "difference_points": ["...", "...", "..."],
  "language": "en|fr|ar",
  "metrics": {
    "confidence": 0-100,
    "clarity": 0-100,
    "filler_words": 0,
    "star_method_score": 0-10,
    "keywords_used": 0,
    "answer_length": "Too Short|Perfect|Too Long",
    "tone": "Professional 🎯|Casual 😊|Nervous 😰"
  }
}
Be encouraging, practical, specific, and keep all natural-language text in the requested interview language only.`

export async function POST(request: NextRequest) {
  try {
    const { sessionId, answer, questionNumber, questionText } = await request.json()

    const { data: session } = await supabaseAdmin
      .from('interview_sessions')
      .select('*')
      .eq('id', sessionId)
      .single()

    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    const config = session.interview_config || {}
    const language = config.language || 'en'
    const languageName = getLanguageName(language)
    const relevantKeywords = (config.personalizationKeywords || config.mainSkills || []) as string[]
    const fallbackMetrics = estimateCommunicationMetrics(answer, 6, relevantKeywords)

    const fallbackByLanguage: Record<string, {
      strengths: string[]
      weaknesses: string[]
      idealAnswer: string
      improvedAnswer: string
      quickFix: string
      differences: string[]
    }> = {
      fr: {
        strengths: ['Vous avez répondu directement à la question'],
        weaknesses: ['Ajoutez un exemple plus précis avec un résultat mesurable'],
        idealAnswer: 'Une réponse forte doit présenter brièvement le contexte, expliquer votre action et montrer clairement le résultat.',
        improvedAnswer: `Voici une version plus forte selon la méthode STAR : ${answer}`,
        quickFix: 'Commencez par la situation, expliquez clairement votre action, puis terminez par le résultat.',
        differences: [
          'La réponse idéale est mieux structurée.',
          'Elle contient plus de détails techniques et d’impact.',
          'Elle se termine par un résultat concret et crédible.',
        ],
      },
      ar: {
        strengths: ['أجبت على السؤال بشكل مباشر'],
        weaknesses: ['أضف مثالاً أكثر دقة مع نتيجة قابلة للقياس'],
        idealAnswer: 'الإجابة القوية تبدأ بالسياق ثم تشرح ما قمت به وتنتهي بالنتيجة الواضحة.',
        improvedAnswer: `إليك نسخة أقوى باستخدام أسلوب STAR: ${answer}`,
        quickFix: 'ابدأ بالموقف ثم اشرح الإجراء الذي قمت به ثم اختم بالنتيجة.',
        differences: [
          'الإجابة المثالية أكثر تنظيماً.',
          'تستخدم تفاصيل تقنية أوضح.',
          'تنتهي بنتيجة ملموسة وقوية.',
        ],
      },
      en: {
        strengths: ['You answered the question directly'],
        weaknesses: ['Use a more specific example and outcome'],
        idealAnswer: 'A strong answer should briefly set the context, explain your action, and show the measurable result.',
        improvedAnswer: `Here is a stronger STAR-style version: ${answer}`,
        quickFix: 'Start with the situation, explain your action clearly, then close with the result.',
        differences: [
          'The ideal answer is more structured.',
          'It uses stronger technical detail and clearer ownership.',
          'It ends with a concrete measurable result.',
        ],
      },
    }

    const localizedFallback = fallbackByLanguage[language] || fallbackByLanguage.en

    let feedback = normalizeFeedback({
      score: 6,
      strengths: localizedFallback.strengths,
      weaknesses: localizedFallback.weaknesses,
      ideal_answer: localizedFallback.idealAnswer,
      improved_answer: localizedFallback.improvedAnswer,
      quick_fix: localizedFallback.quickFix,
      difference_points: localizedFallback.differences,
      language,
      metrics: fallbackMetrics,
    }, answer, relevantKeywords)

    if (process.env.ANTHROPIC_API_KEY) {
      const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
      const prompt = `
Job Role: ${session.job_role}
Difficulty Level: ${session.difficulty_level}
Interview Type: ${config.interviewType || 'Mixed'}
Interview language: ${languageName}
Question Number: ${questionNumber}
Question Asked: ${questionText}
Relevant Skills: ${relevantKeywords.join(', ')}
Candidate Answer: ${answer}

Return the coaching feedback as valid JSON only.
All natural-language content must be written entirely in ${languageName}.`

      const response = await anthropic.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 1200,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: prompt }],
      })

      const content = response.content[0]
      const text = content.type === 'text' ? content.text : ''
      const jsonMatch = text.match(/\{[\s\S]*\}/)

      if (jsonMatch) {
        try {
          feedback = normalizeFeedback(JSON.parse(jsonMatch[0]), answer, relevantKeywords)
        } catch (parseError) {
          console.error('Feedback JSON parse error:', parseError)
        }
      }
    }

    await supabaseAdmin
      .from('interview_answers')
      .delete()
      .eq('session_id', sessionId)
      .eq('question_number', questionNumber)

    const { error: insertError } = await supabaseAdmin
      .from('interview_answers')
      .insert({
        session_id: sessionId,
        question_number: questionNumber,
        question_text: questionText || 'Interview question',
        user_answer: answer,
        ai_feedback: feedback,
        score: feedback.score,
      })

    if (insertError) {
      console.error('Error saving answer:', insertError)
    }

    const completed = questionNumber >= 6

    if (completed) {
      const { data: allAnswers } = await supabaseAdmin
        .from('interview_answers')
        .select('*')
        .eq('session_id', sessionId)

      const averageScore = allAnswers && allAnswers.length > 0
        ? Number((allAnswers.reduce((sum, item) => sum + Number(item.score || 0), 0) / allAnswers.length).toFixed(1))
        : Number(feedback.score || 0)

      await supabaseAdmin
        .from('interview_sessions')
        .update({
          questions_answered: questionNumber,
          status: 'completed',
          overall_score: averageScore,
          completed_at: new Date().toISOString(),
        })
        .eq('id', sessionId)

      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('email, full_name')
        .eq('id', session.user_id)
        .single()

      if (process.env.RESEND_API_KEY && profile?.email) {
        try {
          const resend = new Resend(process.env.RESEND_API_KEY)
          const scoreColor = averageScore >= 8 ? '#22c55e' : averageScore >= 5 ? '#f59e0b' : '#ef4444'
          const summaryUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://interview-coach-tau.vercel.app'}/interview/summary/${sessionId}`
          const motivation = averageScore >= 7
            ? 'Great job — keep practicing and try to beat your score next time.'
            : 'You are getting closer. Focus on one improvement area and come back stronger.'

          await resend.emails.send({
            from: 'Interview Coach <onboarding@resend.dev>',
            to: profile.email,
            subject: `Your interview summary for ${session.job_role}`,
            html: `
              <div style="background:#0b1020;padding:32px;font-family:Arial,sans-serif;color:#f8fafc;">
                <div style="max-width:640px;margin:0 auto;background:#111827;border:1px solid rgba(139,92,246,0.35);border-radius:20px;padding:32px;">
                  <h2 style="margin-top:0;color:#a78bfa;">Interview Summary</h2>
                  <p><strong>Job role:</strong> ${session.job_role}</p>
                  <p><strong>Overall score:</strong> <span style="color:${scoreColor};font-weight:700;">${averageScore}/10</span></p>
                  <p><strong>Confidence:</strong> ${feedback.metrics.confidence}%</p>
                  <p><strong>Clarity:</strong> ${feedback.metrics.clarity}%</p>
                  <h3 style="color:#4ade80;">Top 3 strengths</h3>
                  <ul>${(feedback.strengths || []).slice(0, 3).map((item: string) => `<li>${item}</li>`).join('')}</ul>
                  <h3 style="color:#fbbf24;">Top 3 areas to improve</h3>
                  <ul>${(feedback.weaknesses || []).slice(0, 3).map((item: string) => `<li>${item}</li>`).join('')}</ul>
                  <p style="margin-top:20px;color:#cbd5e1;">${motivation}</p>
                  <a href="${summaryUrl}" style="display:inline-block;margin-top:12px;background:linear-gradient(90deg,#8b5cf6,#3b82f6);color:#fff;padding:12px 18px;border-radius:10px;text-decoration:none;font-weight:700;">View full session</a>
                </div>
              </div>
            `,
          })
        } catch (emailError) {
          console.error('Summary email error:', emailError)
        }
      }
    } else {
      await supabaseAdmin
        .from('interview_sessions')
        .update({ questions_answered: questionNumber })
        .eq('id', sessionId)
    }

    return NextResponse.json({ feedback, completed })
  } catch (error: any) {
    console.error('Error processing answer:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
