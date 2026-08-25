import { createId } from '@/lib/id';

import type { Resume } from '../schema';
import { createEmptyResume } from './factories';

/**
 * Demo content, so a first-time visitor sees a finished document instead of an
 * empty form. Loaded explicitly from the onboarding screen — never merged into
 * a real resume.
 */
export const createSampleResume = (): Resume => {
  const base = createEmptyResume();

  return {
    ...base,

    basics: {
      ...base.basics,
      fullName: 'Muhammad Rasel',
      headline: 'Senior Software Engineer | Next.js Expert | Team Leadership',
    },

    contact: {
      ...base.contact,
      phone: '+8801781182143',
      email: 'mdraselswe@gmail.com',
      location: 'Dhaka, Bangladesh',
      linkedin: 'https://www.linkedin.com/in/mdraselswe',
      github: 'https://github.com/mdraselswe',
      portfolio: 'https://mdraselswe.github.io/portfolio',
      links: [],
    },

    summary: {
      mode: 'summary',
      text:
        '**Senior Frontend Engineer** with **8+ years of experience** specializing in ' +
        'high-performance web applications using **React.js and Next.js**. Proven expertise in ' +
        'architecting **scalable UI systems**, leading **cross-functional teams**, and ' +
        'integrating **AI solutions (LLM APIs)** to enhance engagement.',
    },

    experience: [
      {
        id: createId('exp'),
        role: 'Senior Software Engineer',
        company: 'Shikho Technologies Bangladesh Ltd',
        companyNote:
          'A technology company focused on enhancing learning experiences through digital platforms.',
        location: 'Banani, Dhaka, Bangladesh',
        employmentType: '',
        dates: { start: '2022-12', end: '', current: true },
        bullets: [
          '**Spearheaded Bohubrihi development** using **Next.js and GraphQL**, achieving a **40% improvement in site loading speed**.',
          '**Architected a custom component library**, reducing frontend development time by **30%** for engineering teams.',
          '**Integrated LLM APIs and AI tools**, improving developer productivity by **25%** and enhancing user interaction.',
          '**Mentored 3+ junior engineers**, maintaining code quality through **PR reviews** and standardizing **Agile** workflows.',
        ],
        tech: [],
      },
      {
        id: createId('exp'),
        role: 'Front End Engineer',
        company: 'Grameen Digital Health (Ex Telenor) of Grameen Telecom Trust',
        companyNote:
          'A digital health service aimed at improving healthcare accessibility through technology.',
        location: 'Bashundhara, Dhaka, Bangladesh',
        employmentType: '',
        dates: { start: '2020-11', end: '2022-11', current: false },
        bullets: [
          '**Enhanced core web components** for digital health, ensuring **100% mobile responsiveness** across all platforms.',
          'Migrated complex application state to the React Context API, eliminating redundant re-renders and reducing latency by 15%.',
          '**Integrated automated static code analysis**, resulting in a **15% reduction in production bugs**.',
        ],
        tech: [],
      },
      {
        id: createId('exp'),
        role: 'Software Engineer',
        company: 'Shohoz Ltd.',
        companyNote: 'A platform providing on-demand food, ticket and transportation services.',
        location: 'Banani, Dhaka, Bangladesh',
        employmentType: '',
        dates: { start: '2019-08', end: '2020-10', current: false },
        bullets: [
          '**Contributed to Shohoz Food Web** using reusable React components, delivering **5+ major feature updates** ahead of schedule.',
          '**Streamlined documentation** using **Storybook**, which accelerated developer onboarding by **20%**.',
        ],
        tech: [],
      },
      {
        id: createId('exp'),
        role: 'Software Engineer',
        company: 'Shimahin Limited',
        companyNote: 'A company providing web development and design services.',
        location: 'Banani, Dhaka, Bangladesh',
        employmentType: '',
        dates: { start: '2018-04', end: '2019-07', current: false },
        bullets: [
          'Standardized cross-browser performance by 95% across legacy and modern environments through automated multi-platform testing and custom CSS/JS polyfills.',
          'Architected a scalable UI library of 10+ reusable components using React and Docz, driving a 25% increase in development velocity.',
        ],
        tech: [],
      },
    ],

    education: [
      {
        id: createId('edu'),
        degree: 'B.Sc. in Software Engineering',
        major: '',
        institute: 'Daffodil International University - DIU',
        board: '',
        location: 'Dhanmondi, Bangladesh',
        dates: { start: '2014-04', end: '2018-01', current: false },
        result: 'CGPA: 3.20',
        resultScale: '',
        thesis: '',
        coursework: [],
        bullets: [],
      },
    ],

    skills: [
      {
        id: createId('skl'),
        category: 'Frontend',
        level: '',
        icon: 'auto',
        items: [
          'React.js', 'Next.js', 'JavaScript (ES6+)', 'TypeScript', 'Tailwind CSS',
          'Ant Design', 'Material UI', 'Figma', 'Framer Motion',
        ],
      },
      {
        id: createId('skl'),
        category: 'Backend',
        level: '',
        icon: 'auto',
        items: ['Node.js', 'Express.js', 'MySQL', 'PostgreSQL', 'MongoDB'],
      },
      {
        id: createId('skl'),
        category: 'State & API',
        level: '',
        icon: 'auto',
        items: ['Redux', 'Zustand', 'RTK Query', 'REST API', 'Context API', 'GraphQL'],
      },
      {
        id: createId('skl'),
        category: 'AI',
        level: '',
        icon: 'auto',
        items: ['Cursor AI', 'Claude Code', 'Gemini CLI', 'MCP'],
      },
      {
        id: createId('skl'),
        category: 'Tools',
        level: '',
        icon: 'auto',
        items: ['Storybook', 'Docz', 'Strapi', 'Apito', 'Prettier', 'ESLint', 'NPM', 'Yarn'],
      },
      {
        id: createId('skl'),
        category: 'Leadership',
        level: '',
        icon: 'auto',
        items: ['Team Mentoring', 'Agile Methodology', 'Project Management'],
      },
    ],

    projects: [
      {
        id: createId('prj'),
        name: 'Pregnancy Tracker',
        subtitle: 'Comprehensive health tracking web app',
        role: '',
        dates: { start: '', end: '', current: false },
        liveUrl: 'https://rb.gy/fe44zz',
        sourceUrl: 'https://rb.gy/uvzuyw',
        tech: [],
        bullets: [
          'Achieved user engagement growth of 55% by developing a health-tracking application with Next.js to monitor milestones.',
        ],
      },
      {
        id: createId('prj'),
        name: 'Blood Reach',
        subtitle: 'Emergency blood donation connector',
        role: '',
        dates: { start: '', end: '', current: false },
        liveUrl: 'https://rb.gy/d0u2ct',
        sourceUrl: 'https://rb.gy/8qbd41',
        tech: [],
        bullets: [
          'Enhanced real-time connectivity, resulting in a 35% increase in donor engagement, by deploying a Next.js platform.',
          'Integrated real-time data fetching that reduced donor-matching time by 30% for emergency life-saving resources.',
        ],
      },
      {
        id: createId('prj'),
        name: 'Shikho Shop',
        subtitle: 'E-commerce platform',
        role: '',
        dates: { start: '', end: '', current: false },
        liveUrl: 'https://rb.gy/l6ngqi',
        sourceUrl: '',
        tech: [],
        bullets: [
          'Built a dynamic e-commerce application using Next.js, TypeScript and Tailwind CSS, focusing on a 100% responsive shopping experience.',
          'Implemented reusable UI components, which accelerated feature deployment time by 20% and ensured brand consistency.',
        ],
      },
      {
        id: createId('prj'),
        name: 'Bohubrihi',
        subtitle: 'Leading skill-learning platform in Bangladesh',
        role: '',
        dates: { start: '', end: '', current: false },
        liveUrl: 'https://rb.gy/fus7nm',
        sourceUrl: '',
        tech: [],
        bullets: [
          'Engineered high-performance features for a premier EdTech platform; boosted page load speeds by 40% via custom server-side caching strategies.',
          'Boosted discoverability and Core Web Vitals by achieving a 90+ Lighthouse score, leveraging SSR and semantic HTML to drive organic traffic growth.',
        ],
      },
    ],

    certifications: [
      {
        id: createId('crt'),
        name: 'JavaScript Essential Training',
        issuer: 'Lynda.com',
        issued: '2017-09',
        expires: '',
        credentialId: '',
        url: '',
      },
      {
        id: createId('crt'),
        name: 'CSS Essential Training 3',
        issuer: 'Lynda.com',
        issued: '2017-10',
        expires: '',
        credentialId: '',
        url: '',
      },
    ],

    achievements: [
      {
        id: createId('ach'),
        title: 'Strategic Project Leadership',
        icon: 'crown',
        description:
          'Spearheaded the end-to-end development and architectural transition of Bohubrihi (a premier EdTech platform) at Shikho, leading the team to a 40% improvement in site performance.',
      },
      {
        id: createId('ach'),
        title: 'Enterprise-Level Integrations',
        icon: 'heart',
        description:
          'Orchestrated complex third-party service integrations at Shikho with Ami Probashi, Grameenphone and bKash, expanding platform utility and user reach.',
      },
      {
        id: createId('ach'),
        title: 'Healthcare Ecosystem Collaboration',
        icon: 'plug',
        description:
          'Led the technical collaboration with Amar Lab at Grameen Digital Health to integrate health e-commerce services, ensuring 100% mobile responsiveness and accessibility.',
      },
      {
        id: createId('ach'),
        title: 'High-Impact Individual Contribution',
        icon: 'person',
        description:
          'Individually executed over 80% of the Shohoz Food Web service development, delivering major feature updates ahead of schedule.',
      },
    ],

    languages: [
      { id: createId('lng'), name: 'Bengali', level: 'native', note: '' },
      { id: createId('lng'), name: 'English', level: 'professional', note: '' },
    ],

    meta: {
      ...base.meta,
      documentName: 'Muhammad Rasel - Senior Software Engineer',
      /*
       * Headings and order follow the reference document this sample
       * reproduces. Both are standard names, so the ATS engine treats them as
       * recognised rather than as renames — see `isRecognisedHeading`.
       */
      sectionOrder: [
        'summary',
        'experience',
        'skills',
        'education',
        'achievements',
        'certifications',
        'projects',
        'languages',
        'awards',
        'training',
        'publications',
        'conferences',
        'patents',
        'volunteering',
        'extracurricular',
        'memberships',
        'interests',
        'personal',
        'references',
        'declaration',
        'signature',
      ],
      sections: {
        ...base.meta.sections,
        experience: { enabled: true, heading: 'Professional Experience', showIcons: true },
        skills: { enabled: true, heading: 'Technical Skills', showIcons: true },
        achievements: { enabled: true, heading: 'Key Achievements', showIcons: true },
        languages: { enabled: true, heading: '', showIcons: true },
      },
    },
  };
};
