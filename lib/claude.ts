import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
})

export const SYSTEM_PROMPT = `You are a professional interview coach. Your role is to conduct realistic job interviews and provide constructive feedback.

Instructions:
1. Ask ONE interview question at a time based on the job role and difficulty level
2. After the user answers, provide structured feedback in this EXACT JSON format:
{
  "score": <number 1-10>,
  "strengths": ["strength 1", "strength 2"],
  "weaknesses": ["weakness 1", "weakness 2"],
  "improved_answer": "A better version of their answer with specific improvements"
}

3. After providing feedback, ask the next relevant interview question
4. Keep questions realistic and appropriate for the specified job role and level
5. Be encouraging but honest in your feedback
6. For junior level: Focus on fundamentals, attitude, and learning ability
7. For mid level: Expect solid technical knowledge and some experience
8. For senior level: Expect deep expertise, leadership, and strategic thinking

Always maintain a professional, supportive tone.`

export async function generateInterviewQuestion(
  conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>,
  jobRole: string,
  difficultyLevel: string,
  questionNumber: number
): Promise<string> {
  const contextMessage = questionNumber === 1
    ? `Start the interview for a ${difficultyLevel} ${jobRole} position. Ask the first question.`
    : ''

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    system: SYSTEM_PROMPT,
    messages: [
      ...(contextMessage ? [{ role: 'user' as const, content: contextMessage }] : []),
      ...conversationHistory,
    ],
  })

  const content = response.content[0]
  return content.type === 'text' ? content.text : ''
}

export async function generateFeedback(
  question: string,
  answer: string,
  jobRole: string,
  difficultyLevel: string
): Promise<{
  score: number
  strengths: string[]
  weaknesses: string[]
  improved_answer: string
  nextQuestion: string
}> {
  const prompt = `The candidate was asked: "${question}"
Their answer: "${answer}"

Job Role: ${jobRole}
Level: ${difficultyLevel}

Provide detailed feedback in JSON format, then ask the next interview question.`

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 2048,
    system: SYSTEM_PROMPT,
    messages: [
      { role: 'user', content: prompt },
    ],
  })

  const content = response.content[0]
  const text = content.type === 'text' ? content.text : ''

  // Extract JSON feedback and next question
  const jsonMatch = text.match(/\{[\s\S]*?\}/)
  const feedback = jsonMatch ? JSON.parse(jsonMatch[0]) : {
    score: 5,
    strengths: ['Answer provided'],
    weaknesses: ['Could be more detailed'],
    improved_answer: 'Consider expanding your answer with specific examples.',
  }

  // Extract next question (text after the JSON)
  const nextQuestionMatch = text.split(/\}[\s\S]*?(?=\n|$)/)
  const nextQuestion = nextQuestionMatch[1]?.trim() || 'Tell me about a challenging project you worked on.'

  return { ...feedback, nextQuestion }
}
