import type { ResumeData, SectionKey } from '../types'

const DEFAULT_ORDER: SectionKey[] = [
  'summary',
  'experience',
  'education',
  'projects',
  'skills',
  'certifications',
  'languages',
]

export function emptyResume(): ResumeData {
  return {
    basics: {
      fullName: '',
      headline: '',
      email: '',
      phone: '',
      location: '',
      website: '',
      linkedin: '',
      github: '',
    },
    summary: '',
    experience: [],
    education: [],
    projects: [],
    skills: [],
    certifications: [],
    languages: [],
    sectionOrder: DEFAULT_ORDER,
    hiddenSections: [],
  }
}

export function sampleResume(): ResumeData {
  return {
    basics: {
      fullName: 'Alex Chen',
      headline: 'Senior Full-Stack Engineer',
      email: 'alex.chen@example.com',
      phone: '+1 (555) 013-2847',
      location: 'San Francisco, CA',
      website: 'alexchen.dev',
      linkedin: 'linkedin.com/in/alexchen',
      github: 'github.com/alexchen',
    },
    summary:
      'Full-stack engineer with 8 years of experience building scalable SaaS platforms. Led teams of up to 6 engineers, shipped products used by 2M+ users, and specialized in React, Node.js, and cloud-native architecture on AWS.',
    experience: [
      {
        id: 'exp-1',
        company: 'Nimbus Labs',
        position: 'Senior Full-Stack Engineer',
        location: 'San Francisco, CA',
        startDate: 'Mar 2022',
        endDate: 'Present',
        highlights: [
          'Architected a multi-tenant billing platform processing $40M ARR, reducing invoice errors by 92%',
          'Led migration from a PHP monolith to React + Node.js microservices, cutting deploy time from 2 hours to 8 minutes',
          'Mentored 4 mid-level engineers; introduced code review standards adopted across 3 teams',
        ],
      },
      {
        id: 'exp-2',
        company: 'Brightpath Inc.',
        position: 'Software Engineer',
        location: 'Remote',
        startDate: 'Jun 2018',
        endDate: 'Feb 2022',
        highlights: [
          'Built a real-time analytics dashboard with WebSockets serving 50k concurrent users',
          'Reduced API p95 latency from 800ms to 120ms via query optimization and Redis caching',
          'Owned CI/CD pipeline on GitHub Actions covering 1,200+ automated tests',
        ],
      },
    ],
    education: [
      {
        id: 'edu-1',
        institution: 'University of California, Berkeley',
        degree: 'B.S.',
        field: 'Computer Science',
        location: 'Berkeley, CA',
        startDate: '2014',
        endDate: '2018',
        score: 'GPA 3.8/4.0',
      },
    ],
    projects: [
      {
        id: 'prj-1',
        name: 'OpenMetrics',
        url: 'github.com/alexchen/openmetrics',
        description: 'Open-source observability toolkit with 4.2k GitHub stars',
        highlights: [
          'Designed a plugin architecture supporting 30+ community-built exporters',
        ],
      },
    ],
    skills: [
      {
        id: 'skl-1',
        category: 'Languages',
        skills: ['TypeScript', 'JavaScript', 'Python', 'SQL', 'Go'],
      },
      {
        id: 'skl-2',
        category: 'Frameworks & Tools',
        skills: ['React', 'Node.js', 'PostgreSQL', 'Redis', 'Docker', 'AWS', 'Kubernetes'],
      },
    ],
    certifications: [
      {
        id: 'crt-1',
        name: 'AWS Certified Solutions Architect – Associate',
        issuer: 'Amazon Web Services',
        date: '2023',
        url: '',
      },
    ],
    languages: [
      { id: 'lng-1', name: 'English', fluency: 'Native' },
      { id: 'lng-2', name: 'Mandarin', fluency: 'Professional' },
    ],
    sectionOrder: DEFAULT_ORDER,
    hiddenSections: [],
  }
}
