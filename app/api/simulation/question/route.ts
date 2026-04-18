import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      simulationId,
      concoursIntitulé,
      rubriqueJury,
      conversationHistory,
      phase,
      turnIndex,
    } = body

    if (!simulationId || !concoursIntitulé || !conversationHistory) {
      return NextResponse.json(
        { error: 'Paramètres manquants.' },
        { status: 400 }
      )
    }

    const rubriqueText = rubriqueJury ? JSON.stringify(rubriqueJury, null, 2) : '{}'

    // Build system prompt based on phase
    let systemPrompt: string

    if (phase === 'exposé_libre') {
      systemPrompt = `Vous êtes un membre expérimenté d'un jury de concours oral pour le concours : ${concoursIntitulé}.

Le candidat est en phase d'exposé libre. Il vient de terminer sa présentation.
Votre rôle : fournir une brève transition (1-2 phrases) pour passer à la phase de questions du jury.
- Remerciez brièvement le candidat
- Indiquez que vous allez passer aux questions
- Ne posez PAS encore de question
- Soyez professionnel et bienveillant
- Répondez uniquement en français`
    } else {
      systemPrompt = `Vous êtes un membre expérimenté d'un jury de concours oral pour le concours : ${concoursIntitulé}.

Rubrique d'évaluation du concours :
${rubriqueText}

Phase actuelle : Questions du jury (tour ${turnIndex}).

Consignes :
- Posez UNE seule question à la fois
- La question doit être pertinente par rapport à la rubrique d'évaluation
- Adaptez la difficulté au fil de la conversation (si le candidat répond bien, approfondissez ; s'il est en difficulté, reformulez)
- Variez les thèmes : motivation, connaissances professionnelles, mise en situation, actualité du secteur
- Restez factuel, professionnel, bienveillant mais exigeant
- Ne donnez PAS de feedback ou de note pendant l'épreuve
- Répondez uniquement en français
- Si le candidat a dit quelque chose d'intéressant, rebondissez dessus
- Évitez les questions fermées (oui/non) — privilégiez les questions ouvertes`
    }

    const messages: Array<{ role: 'user' | 'assistant'; content: string }> = []

    // Convert conversation history
    for (const turn of conversationHistory) {
      messages.push({
        role: turn.role === 'assistant' ? 'assistant' : 'user',
        content: turn.content,
      })
    }

    // If it's the transition from exposé to questions, add context
    if (phase === 'questions_jury' && turnIndex <= 3) {
      messages.push({
        role: 'user',
        content: 'L\'exposé libre est terminé. Passez aux questions du jury.',
      })
    }

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      system: systemPrompt,
      messages,
    })

    const content = response.content[0]
    const questionText = content.type === 'text' ? content.text : ''

    // Determine if phase should change
    let nextPhase = phase
    if (phase === 'exposé_libre') {
      nextPhase = 'questions_jury'
    }

    return NextResponse.json({
      question: questionText,
      turnIndex,
      phase: nextPhase,
    })
  } catch (err: unknown) {
    console.error('Erreur /api/simulation/question:', err)
    const message = err instanceof Error ? err.message : 'Erreur interne'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
