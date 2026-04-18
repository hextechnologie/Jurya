export type CoachingMetrics = {
  confidence: number
  clarity: number
  filler_words: number
  star_method_score: number
  keywords_used: number
  answer_length: 'Too Short' | 'Perfect' | 'Too Long'
  tone: 'Professional 🎯' | 'Casual 😊' | 'Nervous 😰'
}

export type StructuredFeedback = {
  score: number
  strengths: string[]
  weaknesses: string[]
  ideal_answer: string
  improved_answer: string
  quick_fix: string
  difference_points: string[]
  language?: string
  metrics: CoachingMetrics
}

const STOP_WORDS = new Set([
  'about', 'after', 'again', 'also', 'an', 'and', 'any', 'are', 'because', 'been', 'before',
  'being', 'between', 'both', 'but', 'can', 'could', 'each', 'for', 'from', 'had', 'have',
  'having', 'her', 'here', 'him', 'his', 'how', 'into', 'its', 'just', 'like', 'more',
  'most', 'our', 'out', 'over', 'role', 'team', 'that', 'the', 'their', 'them', 'then',
  'there', 'these', 'they', 'this', 'those', 'through', 'under', 'very', 'was', 'were',
  'what', 'when', 'where', 'which', 'while', 'will', 'with', 'would', 'your', 'you', 'years',
])

export function extractKeywords(text: string, maxKeywords = 12): string[] {
  const tokens = (text.toLowerCase().match(/[a-z][a-z0-9+#.-]{2,}/g) || [])
    .filter((token) => !STOP_WORDS.has(token))

  const counts = new Map<string, number>()
  for (const token of tokens) {
    counts.set(token, (counts.get(token) || 0) + 1)
  }

  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, maxKeywords)
    .map(([word]) => word)
}

export function summarizeText(text: string, maxLength = 600): string {
  const normalized = text.replace(/\s+/g, ' ').trim()
  if (normalized.length <= maxLength) return normalized
  return `${normalized.slice(0, maxLength)}...`
}

export function estimateCommunicationMetrics(answer: string, score = 5, relevantKeywords: string[] = []): CoachingMetrics {
  const fillerMatches = answer.match(/\b(um|uh|like|basically|actually|you know|i mean|sort of|kind of|euh|genre|donc|en fait|après)\b/gi) || []
  const wordCount = answer.trim().split(/\s+/).filter(Boolean).length
  const sentenceCount = Math.max(answer.split(/[.!?]+/).filter(Boolean).length, 1)
  const avgSentenceLength = sentenceCount > 0 ? wordCount / sentenceCount : wordCount
  const actionWords = answer.match(/\b(led|built|delivered|improved|increased|reduced|launched|owned|designed|implemented|created|j.ai|développé|piloté|conçu)\b/gi) || []
  const starSignals = answer.match(/\b(situation|task|action|result|résultat|projet|mission|impact)\b/gi) || []
  const keywordHits = relevantKeywords.filter((keyword) => answer.toLowerCase().includes(keyword.toLowerCase())).length

  const confidence = clamp(Math.round(score * 8 + actionWords.length * 4 - fillerMatches.length * 3), 35, 99)
  const clarity = clamp(Math.round(score * 8 + (avgSentenceLength <= 24 ? 10 : 4) - fillerMatches.length * 2), 35, 99)
  const starMethodScore = clamp(Math.round(score + starSignals.length), 1, 10)
  const answerLength = wordCount < 40 ? 'Too Short' : wordCount > 180 ? 'Too Long' : 'Perfect'
  const tone = fillerMatches.length >= 7 ? 'Nervous 😰' : confidence < 55 ? 'Casual 😊' : 'Professional 🎯'

  return {
    confidence,
    clarity,
    filler_words: fillerMatches.length,
    star_method_score: starMethodScore,
    keywords_used: keywordHits,
    answer_length: answerLength,
    tone,
  }
}

export function normalizeFeedback(raw: Partial<StructuredFeedback>, answer: string, relevantKeywords: string[] = []): StructuredFeedback {
  const score = typeof raw.score === 'number' ? raw.score : 6
  const estimatedMetrics = estimateCommunicationMetrics(answer, score, relevantKeywords)
  const metrics = {
    ...estimatedMetrics,
    ...(raw.metrics || {}),
  }

  return {
    score,
    strengths: Array.isArray(raw.strengths) && raw.strengths.length > 0 ? raw.strengths : ['Clear attempt to answer the question'],
    weaknesses: Array.isArray(raw.weaknesses) && raw.weaknesses.length > 0 ? raw.weaknesses : ['Add more detail and measurable outcomes'],
    ideal_answer: raw.ideal_answer || 'Start with the situation, explain your actions clearly, and finish with a strong measurable result.',
    improved_answer: raw.improved_answer || 'Here is a stronger STAR-style version: briefly set the context, explain what you did, and close with the result and impact.',
    quick_fix: raw.quick_fix || 'Start with the Situation, explain your Action clearly, and finish with the measurable Result.',
    difference_points: Array.isArray(raw.difference_points) && raw.difference_points.length > 0 ? raw.difference_points : [
      'The ideal answer is more structured and easier to follow.',
      'It uses stronger action verbs and specific technical details.',
      'It ends with a clear result and measurable impact.',
    ],
    language: raw.language || 'en',
    metrics,
  }
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}
