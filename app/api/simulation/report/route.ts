import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
})

// Server-side Supabase client with service role for writes
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const REPORT_SYSTEM_PROMPT = `Vous êtes un évaluateur expert de concours oraux français. Analysez la prestation complète du candidat et produisez un rapport d'évaluation détaillé.

Répondez UNIQUEMENT en JSON valide avec cette structure exacte :
{
  "overallScore": <nombre de 0 à 20, décimale possible>,
  "overallVerdict": "<très_insuffisant|insuffisant|moyen|bien|très_bien|excellent>",
  "axisScores": {
    "structure_exposé": {
      "score": <1-5>,
      "max": 5,
      "evidence": [
        { "turnIndex": <int>, "quote": "citation exacte du candidat", "comment": "analyse" }
      ],
      "recommendationFr": "conseil concret"
    },
    "motivation_cohérence": { ... même structure },
    "connaissance_environnement": { ... même structure },
    "communication_stress": { ... même structure }
  },
  "strengths": [
    { "axis": "nom de l'axe", "comment": "ce qui est bien", "evidenceTurnIndex": <int> }
  ],
  "weaknesses": [
    { "axis": "nom de l'axe", "comment": "ce qui est à améliorer", "evidenceTurnIndex": <int> }
  ],
  "juryPerceptionFr": "Un paragraphe décrivant ce que le jury aurait probablement pensé en interne pendant cette épreuve. Soyez réaliste et nuancé.",
  "improvementPlan": [
    "Action concrète 1",
    "Action concrète 2",
    "Action concrète 3"
  ],
  "reformulationExamples": [
    {
      "original": "ce que le candidat a dit",
      "suggested": "une meilleure formulation",
      "context": "pourquoi c'est mieux"
    }
  ],
  "transcriptAnnotations": [
    {
      "turnIndex": <int>,
      "type": "<filler|strength|weakness>",
      "text": "le passage concerné",
      "comment": "explication"
    }
  ]
}

Consignes :
- Notez sur /20 de façon réaliste (un 18+ est exceptionnel, réservé aux prestations quasi parfaites)
- Citez toujours le candidat pour appuyer vos évaluations
- Le jury_perception doit être une réflexion interne honnête, pas un feedback poli
- Les reformulations doivent être concrètes et immédiatement applicables
- Le plan d'amélioration doit contenir 3 à 5 actions réalistes
- Identifiez les mots parasites (euh, voilà, donc, en fait, du coup, genre) dans les annotations
- Soyez bienveillant mais exigeant dans votre notation`

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { simulationId, turns, concoursIntitulé, rubriqueJury } = body

    if (!simulationId || !turns || !concoursIntitulé) {
      return NextResponse.json(
        { error: 'Paramètres manquants.' },
        { status: 400 }
      )
    }

    const rubriqueText = rubriqueJury ? JSON.stringify(rubriqueJury, null, 2) : '{}'

    // Build transcript
    const transcript = turns
      .map((t: { turnIndex: number; role: string; contentText: string; phase: string }) =>
        `[Tour ${t.turnIndex} — ${t.role === 'jury' ? 'JURY' : 'CANDIDAT'} — ${t.phase}]\n${t.contentText}`
      )
      .join('\n\n')

    const userPrompt = `Concours : ${concoursIntitulé}

Rubrique d'évaluation :
${rubriqueText}

Transcription complète de l'épreuve (${turns.length} tours) :

${transcript}

Produisez le rapport d'évaluation complet en JSON.`

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 4096,
      system: [
        {
          type: 'text',
          text: REPORT_SYSTEM_PROMPT,
          cache_control: { type: 'ephemeral' },
        },
      ],
      messages: [
        { role: 'user', content: userPrompt },
      ],
    })

    const content = response.content[0]
    const rawText = content.type === 'text' ? content.text : '{}'

    // Parse JSON from response
    let report
    const jsonMatch = rawText.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      try {
        report = JSON.parse(jsonMatch[0])
      } catch {
        report = getDefaultReport()
      }
    } else {
      report = getDefaultReport()
    }

    // Save report to Supabase
    const { data: savedReport, error: insertErr } = await supabaseAdmin
      .from('simulation_reports')
      .insert({
        simulation_id: simulationId,
        overall_score: report.overallScore ?? 10,
        overall_verdict: report.overallVerdict ?? 'moyen',
        strengths: report.strengths ?? [],
        weaknesses: report.weaknesses ?? [],
        axis_scores: report.axisScores ?? {},
        jury_perception_fr: report.juryPerceptionFr ?? '',
        improvement_plan: report.improvementPlan ?? [],
        reformulation_examples: report.reformulationExamples ?? [],
        transcript_annotations: report.transcriptAnnotations ?? [],
        generation_model: 'claude-sonnet-4-6',
      })
      .select()
      .single()

    if (insertErr) {
      console.error('Erreur insertion rapport:', insertErr)
    }

    // Update simulation status
    await supabaseAdmin
      .from('simulations')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        overall_score: report.overallScore ?? null,
      })
      .eq('id', simulationId)

    return NextResponse.json({
      report: savedReport || report,
      simulationId,
    })
  } catch (err: unknown) {
    console.error('Erreur /api/simulation/report:', err)
    const message = err instanceof Error ? err.message : 'Erreur interne'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

function getDefaultReport() {
  return {
    overallScore: 10,
    overallVerdict: 'moyen',
    axisScores: {
      structure_exposé: {
        score: 2.5, max: 5, evidence: [],
        recommendationFr: 'Structurez davantage votre exposé avec une introduction, un développement et une conclusion.',
      },
      motivation_cohérence: {
        score: 2.5, max: 5, evidence: [],
        recommendationFr: 'Exprimez plus clairement vos motivations et le lien avec votre projet professionnel.',
      },
      connaissance_environnement: {
        score: 2.5, max: 5, evidence: [],
        recommendationFr: 'Approfondissez vos connaissances de l\'environnement institutionnel et professionnel.',
      },
      communication_stress: {
        score: 2.5, max: 5, evidence: [],
        recommendationFr: 'Travaillez votre aisance à l\'oral et la gestion du stress.',
      },
    },
    strengths: [{ axis: 'Général', comment: 'Le candidat a tenté de répondre aux questions.' }],
    weaknesses: [{ axis: 'Général', comment: 'La préparation semble insuffisante.' }],
    juryPerceptionFr: 'Le rapport n\'a pas pu être généré correctement. Veuillez relancer une simulation.',
    improvementPlan: ['Préparer un exposé structuré', 'Réviser les fondamentaux du concours', 'S\'entraîner à l\'oral'],
    reformulationExamples: [],
    transcriptAnnotations: [],
  }
}
