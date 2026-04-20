import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const HESITATION_REGEX = /\b(euh|hum|heu|ben|bah|voilà|du coup|en fait|donc|c'est-à-dire|c'est à dire|à savoir|comment dire)\b/gi

const REPORT_SYSTEM_PROMPT = `Vous êtes un évaluateur expert de concours oraux français de la fonction publique.
Analysez la prestation du candidat et produisez un rapport qualitatif structuré.

Répondez UNIQUEMENT en JSON valide avec cette structure exacte :
{
  "axisScores": {
    "structure": <1-5>,
    "motivation": <1-5>,
    "communication": <1-5>,
    "connaissances": <1-5>,
    "stress": <1-5>,
    "argumentation": <1-5>
  },
  "overallLevel": "<lacunaire|à travailler|correct|solide|excellent>",
  "synthesePhrase": "Une phrase de synthèse franche et honnête sur la prestation globale.",
  "impressionGlobale": "3 à 5 phrases décrivant l'impression générale comme le jury la rédigerait en délibéré. Honnête et nuancé.",
  "strengths": [
    { "label": "point positif court", "detail": "explication avec citation si possible", "turnIndex": <int|null> }
  ],
  "weaknesses": [
    { "label": "axe à travailler court", "detail": "conseil pratique", "turnIndex": <int|null>, "priority": <1|2|3> }
  ],
  "extraitsMarquants": [
    { "turnIndex": <int>, "role": "jury|candidate", "quote": "extrait exact", "comment": "pourquoi notable", "type": "force|faiblesse|point_cle" }
  ],
  "reformulations": [
    { "original": "ce que le candidat a dit", "suggested": "formulation plus efficace", "context": "explication" }
  ],
  "planAction": [
    { "action": "action concrète", "duree": "~2h", "priorite": <1|2|3> }
  ]
}

Échelle des axisScores (1-5) :
1 Lacunaire — absence quasi totale, signal disqualifiant
2 À travailler — présent mais défaillances majeures récurrentes
3 Correct — niveau minimal attendu pour un admissible
4 Solide — au-dessus de la moyenne, sans faille majeure
5 Excellent — performance rare, cohérente et remarquable

Règles :
- Aucun chiffre /20 ni notation scolaire — uniquement les niveaux ci-dessus
- weaknesses.priority : 1=critique (bloque l'admissibilité), 2=importante, 3=à améliorer
- planAction entre 3 et 5 actions concrètes et immédiatement applicables
- Citez le candidat pour étayer forces et faiblesses
- Soyez bienveillant mais rigoureusement honnête`

function getDefaultReport() {
  return {
    axisScores: { structure: 2, motivation: 2, communication: 2, connaissances: 2, stress: 2, argumentation: 2 },
    overallLevel: 'à travailler',
    synthesePhrase: "La session était trop courte pour une analyse complète. Veuillez relancer une simulation complète.",
    impressionGlobale: "La prestation n'a pas pu être analysée en raison d'une session trop courte ou d'une erreur technique.",
    strengths: [],
    weaknesses: [{ label: 'Session incomplète', detail: "Relancez une simulation complète.", turnIndex: null, priority: 1 }],
    extraitsMarquants: [],
    reformulations: [],
    planAction: [{ action: 'Relancer une simulation complète', duree: '30 min', priorite: 1 }],
  }
}

function computeMetrics(turns: Array<{ role: string; contentText: string; phase: string }>) {
  const candidateTurns = turns.filter(t => t.role === 'candidate')
  const totalWords = candidateTurns.reduce((acc, t) => acc + t.contentText.trim().split(/\s+/).length, 0)
  const hesitations = candidateTurns.reduce((acc, t) => {
    return acc + (t.contentText.match(HESITATION_REGEX)?.length ?? 0)
  }, 0)
  // Estimate: ~120 words/min average reading pace for spoken French
  const estimatedMinutes = totalWords / 120
  const wpm = estimatedMinutes > 0.1 ? Math.round(totalWords / estimatedMinutes) : 0
  const candidateRatio = turns.length > 0 ? candidateTurns.length / turns.length : 0

  return { totalWords, hesitations, wpm, candidateRatio }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { simulationId, turns, concoursIntitulé, rubriqueJury, difficulty, sessionStartedAt, durationMinutes } = body

    if (!simulationId || !concoursIntitulé) {
      return NextResponse.json({ error: 'Paramètres manquants.' }, { status: 400 })
    }

    const rubriqueText = rubriqueJury ? JSON.stringify(rubriqueJury, null, 2) : '{}'
    const safeTurns = turns ?? []
    const transcript = safeTurns
      .map((t: { turnIndex: number; role: string; contentText: string; phase: string }) =>
        `[Tour ${t.turnIndex} — ${t.role === 'jury' ? 'JURY' : 'CANDIDAT'} — ${t.phase}]\n${t.contentText}`
      )
      .join('\n\n')

    const metrics = computeMetrics(safeTurns)

    const userPrompt = `Concours : ${concoursIntitulé}
Difficulté : ${difficulty ?? 'standard'}
Rubrique : ${rubriqueText}
Métriques calculées : ${metrics.totalWords} mots candidat, ${metrics.wpm} mots/min, ${metrics.hesitations} hésitations

Transcription (${safeTurns.length} tours) :
${transcript || '(Aucun échange — session trop courte)'}

Produisez le rapport JSON.`

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2500,
      system: REPORT_SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userPrompt }],
    })

    const rawText = response.content[0]?.type === 'text' ? response.content[0].text : '{}'
    let report = getDefaultReport()
    const jsonMatch = rawText.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      try { report = { ...getDefaultReport(), ...JSON.parse(jsonMatch[0]) } } catch { /* use default */ }
    }

    const reportWithMetrics = {
      ...report,
      metrics,
      sessionMeta: {
        startedAt: sessionStartedAt ?? new Date().toISOString(),
        durationMinutes: durationMinutes ?? 30,
        concoursIntitulé,
        difficulty: difficulty ?? 'standard',
        turnCount: safeTurns.length,
      },
    }

    // Persist to Supabase (best-effort)
    try {
      await supabaseAdmin.from('simulation_reports').upsert({
        simulation_id: simulationId,
        report_data: reportWithMetrics,
        generation_model: 'claude-sonnet-4-6',
      }, { onConflict: 'simulation_id' })
    } catch { /* ignore */ }

    try {
      await supabaseAdmin
        .from('simulations')
        .update({ status: 'completed' })
        .eq('id', simulationId)
    } catch { /* ignore */ }

    return NextResponse.json({ success: true, report: reportWithMetrics })
  } catch (err) {
    console.error('Erreur rapport:', err)
    return NextResponse.json({ error: 'Erreur interne.' }, { status: 500 })
  }
}
