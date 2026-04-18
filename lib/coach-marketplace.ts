export type CoachReview = {
  author: string
  role: string
  rating: number
  comment: string
}

export type CoachAvailabilityPreview = {
  date: string
  label: string
  slots: string[]
}

export type MarketplaceCoach = {
  id: string
  name: string
  title: string
  price: number
  rating: number
  reviewCount: number
  availableNow: boolean
  languages: string[]
  specializations: string[]
  bio: string
  about: string
  yearsExperience: number
  sessionsBooked: number
  avatar: string
  companies: string[]
  timeline: { company: string; role: string; years: string }[]
  availability: CoachAvailabilityPreview[]
  reviews: CoachReview[]
}

export const marketplaceSpecializations = ['Tech', 'Finance', 'Marketing', 'Sales', 'Healthcare', 'Product', 'Design']

export const mockCoaches: MarketplaceCoach[] = [
  {
    id: 'sarah-chen',
    name: 'Sarah Chen',
    title: 'Senior Staff Engineer at Google',
    price: 180,
    rating: 4.9,
    reviewCount: 128,
    availableNow: true,
    languages: ['English', 'French'],
    specializations: ['Tech', 'Product'],
    bio: 'I help engineers and PMs turn nervous interview answers into polished, high-impact stories.',
    about: 'Former Google and Stripe interviewer with 10+ years of experience helping candidates land senior product and engineering roles. I focus on storytelling, systems design, and leadership calibration.',
    yearsExperience: 11,
    sessionsBooked: 420,
    avatar: 'from-violet-500 to-blue-500',
    companies: ['Google', 'Stripe', 'Notion'],
    timeline: [
      { company: 'Google', role: 'Staff Engineer', years: '2021 - Present' },
      { company: 'Stripe', role: 'Engineering Manager', years: '2018 - 2021' },
      { company: 'Notion', role: 'Senior Engineer', years: '2015 - 2018' },
    ],
    availability: [
      { date: '2026-04-18', label: 'Tomorrow', slots: ['09:00', '11:30', '16:00'] },
      { date: '2026-04-19', label: 'Saturday', slots: ['10:00', '14:00'] },
    ],
    reviews: [
      { author: 'Maya', role: 'Backend Engineer', rating: 5, comment: 'Sharp, practical, and incredibly supportive.' },
      { author: 'Omar', role: 'PM Candidate', rating: 5, comment: 'The mock interview felt exactly like a real panel.' },
    ],
  },
  {
    id: 'daniel-rodriguez',
    name: 'Daniel Rodriguez',
    title: 'Ex-Meta Product Manager',
    price: 140,
    rating: 4.8,
    reviewCount: 94,
    availableNow: false,
    languages: ['English', 'Spanish'],
    specializations: ['Product', 'Marketing'],
    bio: 'I coach PM candidates on product sense, execution, and confidence under pressure.',
    about: 'I have coached more than 300 product candidates for Meta, Uber, and startup roles. Sessions are practical, structured, and personalized to your level.',
    yearsExperience: 9,
    sessionsBooked: 312,
    avatar: 'from-fuchsia-500 to-indigo-500',
    companies: ['Meta', 'Uber'],
    timeline: [
      { company: 'Meta', role: 'Senior PM', years: '2020 - 2024' },
      { company: 'Uber', role: 'Product Manager', years: '2017 - 2020' },
    ],
    availability: [
      { date: '2026-04-18', label: 'Tomorrow', slots: ['13:00', '18:00'] },
      { date: '2026-04-20', label: 'Monday', slots: ['09:00', '12:00', '15:00'] },
    ],
    reviews: [
      { author: 'Lina', role: 'PM', rating: 5, comment: 'Helped me sharpen weak answers into leadership stories.' },
      { author: 'Karim', role: 'Associate PM', rating: 4, comment: 'Great feedback and honest calibration.' },
    ],
  },
  {
    id: 'amina-haddad',
    name: 'Amina Haddad',
    title: 'Finance Leadership Interview Coach',
    price: 110,
    rating: 4.7,
    reviewCount: 76,
    availableNow: true,
    languages: ['English', 'French', 'Arabic'],
    specializations: ['Finance', 'Sales'],
    bio: 'I help finance and consulting candidates structure answers with clarity and commercial impact.',
    about: 'Former Big Four manager turned interview coach. I specialize in executive presence, case-style answers, and high-stakes finance interviews.',
    yearsExperience: 12,
    sessionsBooked: 208,
    avatar: 'from-emerald-500 to-cyan-500',
    companies: ['Deloitte', 'EY'],
    timeline: [
      { company: 'Deloitte', role: 'Senior Manager', years: '2019 - 2024' },
      { company: 'EY', role: 'Finance Consultant', years: '2013 - 2019' },
    ],
    availability: [
      { date: '2026-04-18', label: 'Tomorrow', slots: ['08:30', '10:00', '17:30'] },
      { date: '2026-04-21', label: 'Tuesday', slots: ['09:30', '11:00'] },
    ],
    reviews: [
      { author: 'Nora', role: 'FP&A Analyst', rating: 5, comment: 'Fantastic structure and confidence coaching.' },
      { author: 'Youssef', role: 'Consulting Candidate', rating: 4, comment: 'Very practical mock case feedback.' },
    ],
  },
  {
    id: 'jamie-lee',
    name: 'Jamie Lee',
    title: 'Healthcare and Operations Coach',
    price: 95,
    rating: 4.6,
    reviewCount: 52,
    availableNow: false,
    languages: ['English'],
    specializations: ['Healthcare', 'Operations'],
    bio: 'I help candidates express operational impact and leadership in regulated environments.',
    about: 'I have spent 14 years leading operations and interview panels in healthcare and medtech. My sessions focus on calm delivery and practical examples.',
    yearsExperience: 14,
    sessionsBooked: 166,
    avatar: 'from-orange-500 to-pink-500',
    companies: ['Philips', 'Cleveland Clinic'],
    timeline: [
      { company: 'Philips', role: 'Operations Director', years: '2020 - Present' },
      { company: 'Cleveland Clinic', role: 'Program Lead', years: '2012 - 2020' },
    ],
    availability: [
      { date: '2026-04-19', label: 'Saturday', slots: ['09:00', '10:30'] },
      { date: '2026-04-22', label: 'Wednesday', slots: ['14:00', '16:00'] },
    ],
    reviews: [
      { author: 'Taylor', role: 'Operations Manager', rating: 5, comment: 'Wonderful coach for real-world leadership examples.' },
    ],
  },
]

export function getCoachById(id: string) {
  return mockCoaches.find((coach) => coach.id === id)
}

export const mockNotifications = [
  { id: '1', title: 'Session starting soon', message: 'Your session with Sarah Chen starts in 1 hour.', type: 'reminder', read: false, created_at: '1h ago' },
  { id: '2', title: 'Booking confirmed', message: 'Daniel Rodriguez accepted your coaching request.', type: 'booking', read: false, created_at: '3h ago' },
  { id: '3', title: 'New review received', message: 'A candidate left you a 5-star review.', type: 'review', read: true, created_at: '1d ago' },
]

export const mockUpcomingCoachSessions = [
  { id: 'booking-1', coachName: 'Sarah Chen', topic: 'System design mock', date: 'Apr 18', time: '11:30', duration: 60 },
  { id: 'booking-2', coachName: 'Amina Haddad', topic: 'Finance leadership answers', date: 'Apr 22', time: '09:30', duration: 45 },
]
