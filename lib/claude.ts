import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
})

// --- Jurya: Jury simulation prompts ---

export const EXAMINER_SYSTEM_PROMPT = `Vous êtes un membre expérimenté d'un jury de concours oral de la fonction publique française ou d'admission en grande école. Vous êtes sérieux, bienveillant mais rigoureux, et vous suivez strictement la grille d'évaluation (rubrique) du concours.

Déroulement de l'épreuve :
1. Phase 1 — « Exposé libre » (5 minutes) : le candidat présente son parcours, ses motivations et son projet professionnel. Vous écoutez sans interrompre.
2. Phase 2 — « Questions du jury » (reste de la session) : vous posez des questions structurées selon la rubrique du concours. Les questions doivent évaluer :
   - La connaissance de l'environnement professionnel et institutionnel
   - La motivation et la cohérence du projet professionnel
   - Les aptitudes à l'analyse et à la synthèse
   - La capacité à communiquer et à gérer le stress

Consignes :
- Posez UNE question à la fois
- Adaptez le niveau à la catégorie du concours (A, B, C)
- Restez factuel et professionnel
- Toujours répondre en français
- Ne donnez PAS de feedback pendant l'épreuve — ce sera fait séparément`

export const FEEDBACK_SYSTEM_PROMPT = `Vous êtes un évaluateur expert de concours oraux. Analysez la prestation du candidat et produisez un rapport d'évaluation structuré.

Répondez UNIQUEMENT en JSON valide avec cette structure exacte :
{
  "score": <nombre 1-5>,
  "structure_exposé": {
    "note": <nombre 1-5>,
    "commentaire": "...",
    "citations": ["extrait 1 du candidat", "..."]
  },
  "motivation_cohérence": {
    "note": <nombre 1-5>,
    "commentaire": "...",
    "citations": ["..."]
  },
  "connaissance_environnement_professionnel": {
    "note": <nombre 1-5>,
    "commentaire": "...",
    "citations": ["..."]
  },
  "communication_gestion_stress": {
    "note": <nombre 1-5>,
    "commentaire": "...",
    "citations": ["..."]
  },
  "commentaire_général": "...",
  "points_forts": ["...", "..."],
  "axes_amélioration": ["...", "..."],
  "citations_transcription": ["les citations les plus significatives"]
}

Soyez précis, citez le candidat, et notez de façon réaliste (un 5/5 est exceptionnel).`

export async function generateSimulationQuestion(
  conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>,
  concoursIntitulé: string,
  concoursType: string,
  rubriqueJury: Record<string, any>,
  questionNumber: number
): Promise<string> {
  const rubriqueText = JSON.stringify(rubriqueJury, null, 2)

  const contextMessage = questionNumber === 1
    ? `Début de l'épreuve orale pour le concours : ${concoursIntitulé} (${concoursType}). Invitez le candidat à faire son exposé libre de 5 minutes.`
    : questionNumber === 2
    ? `L'exposé libre est terminé. Passez aux questions du jury en suivant la rubrique d'évaluation.`
    : ''

  const systemPrompt = `${EXAMINER_SYSTEM_PROMPT}

Rubrique d'évaluation du concours :
${rubriqueText}`

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    system: [
      {
        type: 'text',
        text: systemPrompt,
        cache_control: { type: 'ephemeral' },
      },
    ],
    messages: [
      ...(contextMessage ? [{ role: 'user' as const, content: contextMessage }] : []),
      ...conversationHistory,
    ],
  })

  const content = response.content[0]
  return content.type === 'text' ? content.text : ''
}

export async function generateRapportÉvaluation(
  questions: Array<{ question: string; answer: string }>,
  concoursIntitulé: string,
  concoursType: string,
  rubriqueJury: Record<string, any>
): Promise<any> {
  const rubriqueText = JSON.stringify(rubriqueJury, null, 2)
  const transcription = questions
    .map((q, i) => `Q${i + 1}: ${q.question}\nR${i + 1}: ${q.answer}`)
    .join('\n\n')

  const prompt = `Concours : ${concoursIntitulé} (${concoursType})

Rubrique d'évaluation :
${rubriqueText}

Transcription de l'épreuve :
${transcription}

Produisez le rapport d'évaluation en JSON.`

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 2048,
    system: [
      {
        type: 'text',
        text: FEEDBACK_SYSTEM_PROMPT,
        cache_control: { type: 'ephemeral' },
      },
    ],
    messages: [
      { role: 'user', content: prompt },
    ],
  })

  const content = response.content[0]
  const text = content.type === 'text' ? content.text : '{}'

  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (jsonMatch) {
    try {
      return JSON.parse(jsonMatch[0])
    } catch {
      return getDefaultRapport()
    }
  }
  return getDefaultRapport()
}

export async function generateClassificationQuestion(
  topic: string,
  concoursType: string
): Promise<string> {
  const response = await anthropic.messages.create({
    model: 'claude-haiku-4-5',
    max_tokens: 512,
    messages: [
      {
        role: 'user',
        content: `Générez une question de jury pour un concours ${concoursType} sur le thème : "${topic}". La question doit être précise, en français, et adaptée au niveau du concours. Répondez uniquement avec la question, sans préambule.`,
      },
    ],
  })

  const content = response.content[0]
  return content.type === 'text' ? content.text : ''
}

function getDefaultRapport() {
  return {
    score: 3,
    structure_exposé: { note: 3, commentaire: 'Évaluation en cours de traitement.', citations: [] },
    motivation_cohérence: { note: 3, commentaire: 'Évaluation en cours de traitement.', citations: [] },
    connaissance_environnement_professionnel: { note: 3, commentaire: 'Évaluation en cours de traitement.', citations: [] },
    communication_gestion_stress: { note: 3, commentaire: 'Évaluation en cours de traitement.', citations: [] },
    commentaire_général: 'Le rapport d\'évaluation n\'a pas pu être généré correctement. Veuillez relancer la simulation.',
    points_forts: ['Tentative de réponse'],
    axes_amélioration: ['Approfondir la préparation'],
    citations_transcription: [],
  }
}

// Keep legacy exports for backward compatibility during migration
export const SYSTEM_PROMPT = EXAMINER_SYSTEM_PROMPT
export const generateInterviewQuestion = generateSimulationQuestion as any
export const generateFeedback = generateRapportÉvaluation as any
