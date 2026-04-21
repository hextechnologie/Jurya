import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

type SpeakerId = 'president' | 'technique' | 'rh'
type JuryMember = { id: SpeakerId; name: string; roleLabel: string; gender: string }

function buildSystemPrompt(
  concoursIntitulé: string,
  rubriqueText: string,
  phase: string,
  turnIndex: number,
  difficulty: string,
  candidateName: string,
  lastSpeaker: SpeakerId,
  juryMembers: JuryMember[],
): string {
  const president = juryMembers.find(m => m.id === 'president') ?? { name: 'Mme Laurent', roleLabel: 'Présidente', gender: 'female' }
  const technique = juryMembers.find(m => m.id === 'technique') ?? { name: 'M. Bernard', roleLabel: 'Technique', gender: 'male' }
  const rh        = juryMembers.find(m => m.id === 'rh')        ?? { name: 'Mme Moreau', roleLabel: 'RH', gender: 'female' }

  const diffDesc =
    difficulty === 'bienveillant'
      ? 'Le jury est bienveillant, encourage le candidat, relances douces et constructives.'
      : difficulty === 'exigeant'
      ? 'Le jury est très exigeant : relances fréquentes, ton incisif mais respectueux. N\'hésitez pas à interrompre poliment pour approfondir.'
      : 'Le jury est professionnel et neutre, questions directes de concours. Quelques relances sur les points imprécis.'

  const nameInstruction = candidateName
    ? `Le candidat s'appelle "${candidateName}". N'utilisez son nom QU'AU PREMIER tour de questions pour l'accueillir. Ensuite, utilisez uniquement "vous". Ne commencez JAMAIS une question par son nom. Variez vos débuts de phrase.`
    : "Utilisez simplement \"vous\" pour vous adresser au candidat. Ne commencez pas vos questions par son prénom."

  const humanness = `
Comportement humain attendu du jury :
- Vous pouvez interrompre brièvement le candidat s'il s'égare : "Je vous arrête un instant — pouvez-vous préciser… ?"
- Réagissez à ce que le candidat vient de dire : "Vous avez mentionné X, justement…" ou "C'est intéressant, mais…"
- Variez la formulation de vos questions. Évitez les débuts génériques comme "Pouvez-vous nous parler de…"
- Vous pouvez montrer un signe de suivi : "Je note…", "Hm, et concernant…"
- Gardez des questions courtes, directes. Pas de préambule de 3 phrases.
- Parfois une relance très brève suffit : "Et concrètement ?" ou "Vous êtes sûr de ça ?" ou "Développez."
`

  const speakerRules = `
Membres du jury — rôles STRICTEMENT définis, ne jamais les mélanger :

PRÉSIDENT : ${president.name}
- Il est le SEUL à : ouvrir la séance, accueillir le candidat, poser la question d’accroche sur le parcours et les motivations générales, effectuer les relances de synthèse ou de recadrage, clôre la session en remerciant le candidat.
- Ne pose PAS de questions techniques, réglementaires, métier ou de cas pratiques.

EXPERT TECHNIQUE : ${technique.name}
- Pose UNIQUEMENT des questions sur : connaissances réglementaires (lois, décrets, jurisprudence), cas pratiques et mises en situation professionnelle, procédures métier spécifiques au corps visé, enjeux techniques actuels du secteur.
- Ne pose PAS de questions sur la motivation personnelle, les valeurs, les soft skills ou le projet de vie.

RESSOURCES HUMAINES : ${rh.name}
- Pose UNIQUEMENT des questions sur : motivation profonde pour le service public, projet professionnel à moyen et long terme, déontologie du fonctionnaire, posture face à la hiérarchie et aux conflits, soft skills, valeurs personnelles liées au service public.
- Ne pose PAS de questions techniques, réglementaires ou de mises en situation métier.

Dernier à avoir parlé : ${lastSpeaker}.
Règle absolue : ne choisissez JAMAIS le même next_speaker deux fois de suite (sauf president pour conclure une phase). Le president ouvre TOUJOURS, clôt TOUJOURS. Entre les deux, technique et rh s’alternent. Ne jamais attribuer une question hors du rôle défini ci-dessus.`

  if (phase === 'exposé_libre') {
    return `Vous êtes ${president.name}, présidente du jury pour le concours : ${concoursIntitulé}.
${nameInstruction}
${diffDesc}

Le candidat vient de terminer son exposé. Votre rôle : transition vers la phase de questions (2-3 phrases max).
- Remerciez sobrement, sans jugement
- Annoncez le passage aux questions
- Ne posez PAS encore de question
- Texte brut, ZÉRO markdown (pas d'astérisques, pas de tirets, pas de #)`
  }

  return `Vous êtes un jury de concours oral français (fonction publique) pour : ${concoursIntitulé}.
${nameInstruction}
${diffDesc}
${humanness}
${speakerRules}

Rubrique d'évaluation :
${rubriqueText}

Phase : questions du jury (tour ${turnIndex}).

Répondez UNIQUEMENT avec ce JSON, sans markdown, sans blocs de code :
{
  "next_speaker": "<president|technique|rh>",
  "question": "<question en français, directe, naturelle, sans markdown>"
}

Règles pour la question :
- UNE seule question ou relance (jamais deux questions dans la même réponse)
- Rebondissez sur la dernière réponse du candidat si possible
- Variez les thèmes selon le rôle du speaker (technique ≠ rh ≠ president)
- Niveau de difficulté : ${difficulty}
- ZÉRO markdown dans la question (pas de **, pas de tirets, pas de #)
- ZÉRO feedback ni évaluation pendant l'épreuve — le jury ne note pas à voix haute`
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
      juryMembers,
    } = body

    if (!simulationId || !concoursIntitulé || !conversationHistory) {
      return NextResponse.json({ error: 'Paramètres manquants.' }, { status: 400 })
    }

    const defaultJury: JuryMember[] = [
      { id: 'president', name: 'Mme Catherine Laurent', roleLabel: 'Présidente',         gender: 'female' },
      { id: 'technique', name: 'M. Marc Bernard',       roleLabel: 'Expert technique',   gender: 'male'   },
      { id: 'rh',        name: 'Mme Sophie Moreau',     roleLabel: 'Ressources humaines', gender: 'female' },
    ]
    const jury: JuryMember[] = Array.isArray(juryMembers) && juryMembers.length === 3 ? juryMembers : defaultJury

    const rubriqueText = rubriqueJury ? JSON.stringify(rubriqueJury, null, 2) : '{}'

    // Detect rude/inappropriate language in last candidate turn
    const RUDE_PATTERNS = /putain|merde|con\b|conne\b|idiot|crétin|nul|incompétent|vous êtes nul|c'est nul|je m'en fous|laissez-moi|vous me faites chier|allez vous faire/i
    const lastCandidateTurn = [...(conversationHistory ?? [])].reverse().find((t: { role: string; content: string }) => t.role === 'user')
    if (lastCandidateTurn && RUDE_PATTERNS.test(lastCandidateTurn.content)) {
      const president = jury.find(m => m.id === 'president') ?? defaultJury[0]
      return NextResponse.json({
        question: `${president.name} intervient : "Je dois interrompre cette simulation. Le comportement adopté ne correspond pas aux standards attendus lors d'un entretien de concours. Je vous invite à prendre connaissance de votre rapport et à retravailler votre posture professionnelle."`,
        next_speaker: 'president',
        turnIndex,
        phase,
        end_session: true,
      })
    }
    const systemPrompt = buildSystemPrompt(
      concoursIntitulé,
      rubriqueText,
      phase,
      turnIndex,
      difficulty,
      candidateName,
      lastSpeaker as SpeakerId,
      jury,
    )

    const messages: Array<{ role: 'user' | 'assistant'; content: string }> = []
    for (const turn of conversationHistory) {
      messages.push({
        role: turn.role === 'assistant' ? 'assistant' : 'user',
        content: turn.content,
      })
    }

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
      max_tokens: 400,
      system: systemPrompt,
      messages,
    })

    const rawText = response.content[0]?.type === 'text' ? response.content[0].text : ''
    const stripMd = (s: string) =>
      s.replace(/\*\*(.+?)\*\*/gs, '$1').replace(/\*(.+?)\*/gs, '$1')
       .replace(/#{1,6}\s+/gm, '').replace(/^[-*+]\s+/gm, '').trim()

    let nextPhase = phase
    if (phase === 'exposé_libre') nextPhase = 'questions_jury'

    if (phase === 'exposé_libre') {
      return NextResponse.json({
        question: stripMd(rawText),
        next_speaker: 'president',
        turnIndex,
        phase: nextPhase,
      })
    }

    let nextSpeaker: SpeakerId = 'technique'
    let question = rawText.trim()

    const jsonMatch = rawText.match(/\{[\s\S]*?\}/)
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[0])
        if (['president', 'technique', 'rh'].includes(parsed.next_speaker)) {
          nextSpeaker = parsed.next_speaker as SpeakerId
        }
        if (parsed.question) question = parsed.question
      } catch { /* use raw text */ }
    }

    return NextResponse.json({
      question: stripMd(question),
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
