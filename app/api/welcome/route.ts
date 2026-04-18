import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { email, firstName, userType, targetJobRole, title } = body as {
      email: string
      firstName: string
      userType: 'candidate' | 'coach'
      targetJobRole?: string
      title?: string
    }

    if (!email || !firstName || !userType) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const resendApiKey = process.env.RESEND_API_KEY
    if (!resendApiKey) {
      // Resend not configured — skip silently (non-breaking)
      return NextResponse.json({ ok: true, skipped: true })
    }

    const subject =
      userType === 'candidate'
        ? `Bienvenue sur Jurya, ${firstName} ! 🎉`
        : `Bienvenue ${firstName} ! Votre profil est en ligne 🎉`

    const html =
      userType === 'candidate'
        ? candidateEmail(firstName, targetJobRole)
        : coachEmail(firstName, title)

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: process.env.RESEND_FROM_EMAIL || 'Jurya <onboarding@resend.dev>',
        to: email,
        subject,
        html,
      }),
    })

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}))
      console.error('[welcome email] Resend error:', errData)
      return NextResponse.json({ error: 'Email send failed' }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[welcome email] unexpected error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

function candidateEmail(firstName: string, targetJobRole?: string) {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0a0f1e;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#e5e7eb">
  <div style="max-width:580px;margin:40px auto;background:#111827;border-radius:16px;overflow:hidden;border:1px solid rgba(255,255,255,0.1)">
    <!-- Header -->
    <div style="background:linear-gradient(135deg,#7c3aed,#2563eb);padding:32px 32px 24px">
      <p style="margin:0 0 8px;font-size:13px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;color:rgba(255,255,255,0.7)">Jurya</p>
      <h1 style="margin:0;font-size:26px;font-weight:700;color:#fff">Bienvenue, ${firstName} ! 🎉</h1>
    </div>
    <!-- Body -->
    <div style="padding:32px">
      <p style="margin:0 0 16px;line-height:1.6;color:#d1d5db">
        Votre compte candidat est prêt. ${targetJobRole ? `Nous avons noté votre objectif : <strong style="color:#a78bfa">${targetJobRole}</strong>. ` : ''}Commencez dès maintenant avec des simulations orales propulsées par l'IA et recevez un retour détaillé sur chaque réponse.
      </p>
      <ul style="margin:0 0 24px;padding-left:20px;line-height:1.8;color:#9ca3af">
        <li>Simulations IA illimitées (Plan gratuit : 3/mois)</li>
        <li>Score personnalisé et retour par réponse</li>
        <li>Réservez des sessions 1-à-1 avec des membres de jury experts</li>
        <li>Suivez vos progrès avec des graphiques</li>
      </ul>
      <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'https://interview-coach.app'}/dashboard"
        style="display:inline-block;background:linear-gradient(135deg,#7c3aed,#2563eb);color:#fff;text-decoration:none;font-weight:600;font-size:15px;padding:14px 28px;border-radius:10px">
        Commencer →
      </a>
    </div>
    <!-- Footer -->
    <div style="padding:20px 32px;border-top:1px solid rgba(255,255,255,0.08);font-size:12px;color:#6b7280">
      Vous recevez cet e-mail car vous avez créé un compte sur Jurya.
      <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'https://interview-coach.app'}" style="color:#8b5cf6;text-decoration:none">interview-coach.app</a>
    </div>
  </div>
</body>
</html>`
}

function coachEmail(firstName: string, title?: string) {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0a0f1e;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#e5e7eb">
  <div style="max-width:580px;margin:40px auto;background:#111827;border-radius:16px;overflow:hidden;border:1px solid rgba(255,255,255,0.1)">
    <!-- Header -->
    <div style="background:linear-gradient(135deg,#059669,#2563eb);padding:32px 32px 24px">
      <p style="margin:0 0 8px;font-size:13px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;color:rgba(255,255,255,0.7)">Jurya — Espace jury</p>
      <h1 style="margin:0;font-size:26px;font-weight:700;color:#fff">Bienvenue ${firstName} ! 🎉</h1>
    </div>
    <!-- Body -->
    <div style="padding:32px">
      <p style="margin:0 0 16px;line-height:1.6;color:#d1d5db">
        ${title ? `Votre profil en tant que <strong style="color:#34d399">${title}</strong> est maintenant en ligne` : 'Votre profil de membre de jury est maintenant en ligne'} sur Jurya. Les candidats recherchent déjà des membres de jury experts — complétez votre profil pour être découvert plus rapidement.
      </p>
      <ul style="margin:0 0 24px;padding-left:20px;line-height:1.8;color:#9ca3af">
        <li>Ajoutez vos disponibilités dans l'Espace jury</li>
        <li>Définissez vos tarifs et spécialisations</li>
        <li>Répondez rapidement aux demandes de réservation</li>
        <li>Gagnez 80 % de chaque session (nous prenons 20 %)</li>
      </ul>
      <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'https://interview-coach.app'}/coach/dashboard"
        style="display:inline-block;background:linear-gradient(135deg,#059669,#2563eb);color:#fff;text-decoration:none;font-weight:600;font-size:15px;padding:14px 28px;border-radius:10px">
        Accéder à l'Espace jury →
      </a>
    </div>
    <!-- Footer -->
    <div style="padding:20px 32px;border-top:1px solid rgba(255,255,255,0.08);font-size:12px;color:#6b7280">
      Vous recevez cet e-mail car vous êtes inscrit en tant que membre de jury sur Jurya.
      <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'https://interview-coach.app'}" style="color:#34d399;text-decoration:none">interview-coach.app</a>
    </div>
  </div>
</body>
</html>`
}
