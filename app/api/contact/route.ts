import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, email, subject, message } = body

    // Validate input
    if (!name || !email || !subject || !message) {
      return NextResponse.json(
        { error: 'Le nom, l\'e-mail, le sujet et le message sont requis' },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Format d\'e-mail invalide' },
        { status: 400 }
      )
    }

    // Save to Supabase
    const { data, error } = await supabase
      .from('contact_messages')
      .insert([
        {
          name,
          email,
          message: `Subject: ${subject}\n\n${message}`,
          status: 'unread',
        },
      ])
      .select()
      .single()

    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json(
        { error: 'Échec de l\'enregistrement. Veuillez réessayer.' },
        { status: 500 }
      )
    }

    // Send email notification using Resend
    if (process.env.RESEND_API_KEY) {
      try {
        const resend = new Resend(process.env.RESEND_API_KEY)

        await resend.emails.send({
          from: 'Jurya <onboarding@resend.dev>',
          to: 'abdelkarim.boudara@gmail.com',
          reply_to: email,
          subject: `[${subject}] Nouveau message du formulaire de contact de ${name}`,
          html: `
            <h2>Nouveau message de contact</h2>
            <p><strong>Nom :</strong> ${name}</p>
            <p><strong>E-mail :</strong> ${email}</p>
            <p><strong>Sujet :</strong> ${subject}</p>
            <p><strong>Message :</strong></p>
            <p>${message.replace(/\n/g, '<br>')}</p>
            <hr>
            <p><small>Envoyé le : ${new Date().toLocaleString()}</small></p>
          `,
        })
      } catch (emailError) {
        console.error('Email notification error:', emailError)
      }
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Merci pour votre message ! Nous vous répondrons sous 24 heures.',
        data,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Contact form error:', error)
    return NextResponse.json(
      { error: 'Une erreur inattendue s\'est produite. Veuillez réessayer plus tard.' },
      { status: 500 }
    )
  }
}
