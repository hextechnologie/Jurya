import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

type SpeakerId = 'president' | 'technique' | 'rh'

function buildSystemPrompt(
  concoursIntitulé: string,
  rubriqueText: string,
  phase: string,
  turnIndex: number,
  difficulty: string,
  candidateName: string,
  lastSpeaker: SpeakerId,
): string {
  const difficultyDesc =
    difficulty === 'bienveillant'
      ? 'Le jury est bienveillant, encourage le candidat, relances douces.'
      : difficulty === 'exigeant'
      ? 'Le jury est très exigeant, relances fréquentes, ton rigoureux mais respectueux.'
      : 'Le jury est professionnel et neutre, questions classiques de concours.'

  const nameInstruction = candidateName
    ? `Le candidat s'appelle "${candidateName}". Si vous le nommez, utilisez exactement ce nom, jamais une approximation. Ne déformez pas le nom.`
    : 'Ne nommez pas le candidat, utilisez simplement "vous".'

  const speakerRules = `
Membres du jury :
- president : Mme Laurent (Présidente) — ouvre la séance, pose les questions de synthèse et de motivation principale, conclut.
- technique : M. Bernard (Technique) — interroge sur les aspects métier, les connaissances professionnelles, les mises en situation opérationnelles.
- rh : Mme Moreau (RH) — questionne la motivation, la trajectoire professionnelle, les soft skills, la posture.

Dernier à avoir parlé : ${lastSpeaker}.
Règle : ne choisissez PAS le même next_speaker deux fois de suite sauf si c'est le president pour conclure une phase.`

  if (phase === 'exposé_libre') {
    return `Vous êtes Mme Laurent, présidente du jury, pour le concours : ${concoursIntitulé}.
${nameInstruction}
${difficultyDesc}

Le candidat vient de terminer son exposé libre. Votre rôle : transition vers la phase de questions (2-3 phrases max).
- Remerciez sobrement l'exposé
- Annoncez que vous passez aux questions
- Ne posez PAS encore de question
- Répondez en texte brut, SANS markdown (pas d'astérisques, pas de tirets, pas de #)
- Soyez professionnel, bienveillant mais sobre`
  }

  return `Vous êtes un jury de concours oral pour le concours : ${concoursIntitulé}.
${nameInstruction}
${difficultyDesc}
${speakerRules}

Rubrique d'évaluation :
${rubriqueText}

Phase : questions du jury (tour ${turnIndex}).

IMPORTANT : Répondez UNIQUEMENT avec ce JSON valide, sans markdown, sans balises :
{
  "next_speaker": "<president|technique|rh>",
  "question": "<question unique, directe, en français, sans markdown>"
}

Consignes pour la question :
- UNE seule question, ouverte (pas oui/non)
- Pertinente pour le concours et la rubrique
- Adaptée au niveau de difficulté
- Rebondissez sur les réponses précédentes si pertinent
- Variez les thèmes selon le speaker
- AUCUN markdown dans la question (pas d'astérisques, pas de tirets en début de ligne, pas de #)
- AUCUN feedback ni note pendant l'épreuve`
}

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
      difficulty = 'standard',
      candidateName = '',
      lastSpeaker = 'president',
      sujet,
    } = body

    if (!simulationId || !concoursIntitulé || !conversationHistory) {
      return NextResponse.json({ error: 'Paramètres manquants.' }, { status: 400 })
    }

    const rubriqueText = rubriqueJury ? JSON.stringify(rubriqueJury, null, 2) : '{}'
    const systemPrompt = buildSystemPrompt(
      concoursIntitulé,
      rubriqueText,
      phase,
      turnIndex,
      difficulty,
      candidateName,
      lastSpeaker as SpeakerId,
    )

    const messages: Array<{ role: 'user' | 'assistant'; content: string }> = []
    for (const turn of conversationHistory) {
      messages.push({
        role: turn.role === 'assistant' ? 'assistant' : 'user',
        content: turn.content,
      })
    }

    // Seed context for early turns
    if (phase === 'questions_jury' && turnIndex <= 3 && messages.length === 0) {
      const subjectContext = sujet
        ? `Le sujet tiré au sort est : "${sujet}".`
        : `Choisissez un sujet adapté au concours ${concoursIntitulé}.`
      messages.push({ role: 'user', content: subjectContext })
    }

    if (messages.length === 0) {
      messages.push({ role: 'user', content: "Commencez l'épreuve." })
    }

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 512,
      system: systemPrompt,
      messages,
    })

    const rawText = response.content[0]?.type === 'text' ? response.content[0].text : ''

    // Determine next phase
    let nextPhase = phase
    if (phase === 'exposé_libre') nextPhase = 'questions_jury'

    // For exposé transition: plain text response
    if (phase === 'exposé_libre') {
      const clean = rawText.replace(/\*\*/g, '').replace(/\*/g, '').replace(/^#+\s/gm, '').trim()
      return NextResponse.json({
        question: clean,
        next_speaker: 'president',
        turnIndex,
        phase: nextPhase,
      })
    }

    // For questions: parse JSON response
    let nextSpeaker: SpeakerId = 'technique'
    let question = rawText.trim()

    const jsonMatch = rawText.match(/\{[\s\S]*?\}/)
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[0])
        if (parsed.next_speaker && ['president', 'technique', 'rh'].includes(parsed.next_speaker)) {
          nextSpeaker = parsed.next_speaker as SpeakerId
        }
        if (parsed.question) {
          question = parsed.question
        }
      } catch { /* use raw text */ }
    }

    // Strip any remaining markdown from the question
    const cleanQuestion = question
      .replace(/\*\*(.+?)\*\*/gs, '$1')
      .replace(/\*(.+?)\*/gs, '$1')
      .replace(/#{1,6}\s+/gm, '')
      .replace(/^[-*+]\s+/gm, '')
      .trim()

    return NextResponse.json({
      question: cleanQuestion,
      next_speaker: nextSpeaker,
      turnIndex,
      phase: nextPhase,
    })
  } catch (err: unknown) {
    console.error('Erreur /api/simulation/question:', err)
    const message = err instanceof Error ? err.message : 'Erreur interne'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
