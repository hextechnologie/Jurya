import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const REPORT_SYSTEM_PROMPT = `Vous êtes un évaluateur expert de concours oraux français de la fonction publique.
Analysez la prestation du candidat et produisez un rapport qualitatif pur. AUCUNE note chiffrée.

Répondez UNIQUEMENT en JSON valide avec cette structure :
{
  "impressionGlobale": "Un paragraphe de 3 à 5 phrases décrivant l'impression générale laissée par le candidat, comme le jury la rédigerait en délibéré. Soyez honnête et nuancé.",
  "tags": [
    "Structure : solide",
    "Motivation : convaincante",
    "Communication : à travailler",
    "Connaissance du corps : lacunaire"
  ],
  "strengths": [
    { "label": "ce qui a marché", "detail": "explication avec citation du candidat si possible", "turnIndex": <int ou null> }
  ],
  "weaknesses": [
    { "label": "ce qu'il faut travailler", "detail": "conseil pratique + timestamp si pertinent", "turnIndex": <int ou null> }
  ],
  "extraitsMarquants": [
    {
      "turnIndex": <int>,
      "role": "jury ou candidate",
      "quote": "extrait exact de la transcription",
      "comment": "pourquoi cet extrait est notable",
      "type": "force ou faiblesse ou point_cle"
    }
  ],
  "reformulations": [
    {
      "original": "ce que le candidat a dit",
      "suggested": "formulation plus efficace",
      "context": "courte explication de l'amélioration"
    }
  ],
  "planAction": [
    "Action concrète et réaliste 1",
    "Action concrète et réaliste 2",
    "Action concrète et réaliste 3"
  ]
}

Règles strictes :
- Aucun chiffre ni note sur X/20 — uniquement des appréciations qualitatives
- Les tags doivent suivre le format "Axe : appréciation" (4 à 6 tags au total)
- Axes possibles : Structure, Motivation, Communication, Connaissance du corps, Gestion du stress, Aisance orale, Argumentation
- Appréciations possibles : très solide, solide, satisfaisante, à consolider, à travailler, lacunaire
- Citez toujours le candidat pour étayer les forces et faiblesses
- Soyez bienveillant mais réaliste
- Le plan d'action : 3 à 5 actions, concrètes et immédiatement applicables`

function getDefaultReport() {
  return {
    impressionGlobale: "La prestation n'a pas pu être analysée en raison d'une session trop courte ou d'une erreur technique. Veuillez relancer une simulation.",
    tags: ['Session : incomplète'],
    strengths: [],
    weaknesses: [{ label: 'Session incomplète', detail: 'La simulation n\'a pas produit assez d\'échanges pour une analyse.', turnIndex: null }],
    extraitsMarquants: [],
    reformulations: [],
    planAction: ['Relancer une simulation complète pour obtenir un rapport détaillé.'],
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { simulationId, turns, concoursIntitulé, rubriqueJury, difficulty } = body

    if (!simulationId || !concoursIntitulé) {
      return NextResponse.json({ error: 'Paramètres manquants.' }, { status: 400 })
    }

    const rubriqueText = rubriqueJury ? JSON.stringify(rubriqueJury, null, 2) : '{}'
    const transcript = (turns ?? [])
      .map((t: { turnIndex: number; role: string; contentText: string; phase: string }) =>
        `[Tour ${t.turnIndex} — ${t.role === 'jury' ? 'JURY' : 'CANDIDAT'} — ${t.phase}]\n${t.contentText}`
      )
      .join('\n\n')

    const userPrompt = `Concours : ${concoursIntitulé}
Niveau de difficulté du jury : ${difficulty ?? 'standard'}
Rubrique d'évaluation : ${rubriqueText}

Transcription complète (${(turns ?? []).length} tours) :
${transcript || '(Aucun échange enregistré — session trop courte)'}

Produisez le rapport qualitatif en JSON.`

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 4096,
      system: REPORT_SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userPrompt }],
    })

    const rawText = response.content[0]?.type === 'text' ? response.content[0].text : '{}'
    let report = getDefaultReport()
    const jsonMatch = rawText.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      try { report = JSON.parse(jsonMatch[0]) } catch { /* use default */ }
    }

    // Persist to Supabase (best-effort)
    try {
      await supabaseAdmin.from('simulation_reports').insert({
        simulation_id: simulationId,
        report_data: report,
        generation_model: 'claude-sonnet-4-6',
      })
    } catch { /* table may not exist yet — ignore */ }

    try {
      await supabaseAdmin
        .from('simulations')
        .update({ status: 'completed' })
        .eq('id', simulationId)
    } catch { /* ignore */ }

    // Always store report in a way the rapport page can access
    if (simulationId.startsWith('local_')) {
      // Session-based sim — store report in a known key
      // (report page will fetch from API directly via simulationId)
    }

    return NextResponse.json({ success: true, report })
  } catch (err) {
    console.error('Erreur rapport:', err)
    return NextResponse.json({ error: 'Erreur interne.' }, { status: 500 })
  }
}
