/**
 * Ardent Subscription Tier Configuration
 * ─────────────────────────────────────────
 * Central source of truth for all tier limits across the platform.
 * Used by API routes and frontend components alike.
 */

export type TierName = 'free' | 'pro' | 'max';

export interface TierConfig {
  name: string;
  label: string;
  /** Max total roadmaps a user can have saved */
  maxRoadmaps: number;
  /** Max new roadmaps a user can generate per month */
  roadmapsPerMonth: number;
  /** Resume parses per day */
  resumeParsesPerDay: number;
  /** Mentorship messages per hour */
  mentorshipMsgsPerHour: number;
  /** Resource access level */
  resourceAccess: 'search' | 'panel' | 'ai';
  /** Number of daily micro-challenges */
  challengesPerDay: number;
  /** Whether challenges include code snippets/debugging */
  challengeIncludesCode: boolean;
  /** Level of explanation for challenges */
  challengeExplanationLevel: 'basic' | 'detailed' | 'deep_dive';
  /** Mock interviews per month */
  interviewsPerMonth: number;
  /** Interview feedback detail level */
  interviewFeedbackLevel: 'basic' | 'detailed' | 'deep_dive';
  /** Access to advanced interview topics (e.g. System Design) */
  advancedInterviews: boolean;
  /** Day in the Life scenarios per month */
  scenariosPerMonth: number;
  /** Scenario complexity level */
  scenarioComplexity: 'basic' | 'moderate' | 'high';
}

export const TIER_CONFIG: Record<TierName, TierConfig> = {
  free: {
    name: 'free',
    label: 'Starter',
    maxRoadmaps: 3,
    roadmapsPerMonth: 1,
    resumeParsesPerDay: 5,
    mentorshipMsgsPerHour: 10,
    resourceAccess: 'search',
    challengesPerDay: 3,
    challengeIncludesCode: false,
    challengeExplanationLevel: 'basic',
    interviewsPerMonth: 1,
    interviewFeedbackLevel: 'basic',
    advancedInterviews: false,
    scenariosPerMonth: 1,
    scenarioComplexity: 'basic',
  },
  pro: {
    name: 'pro',
    label: 'Pro',
    maxRoadmaps: 15,
    roadmapsPerMonth: 5,
    resumeParsesPerDay: 15,
    mentorshipMsgsPerHour: 50,
    resourceAccess: 'panel',
    challengesPerDay: 5,
    challengeIncludesCode: true,
    challengeExplanationLevel: 'detailed',
    interviewsPerMonth: 5,
    interviewFeedbackLevel: 'detailed',
    advancedInterviews: false,
    scenariosPerMonth: 5,
    scenarioComplexity: 'moderate',
  },
  max: {
    name: 'max',
    label: 'Max',
    maxRoadmaps: 100,
    roadmapsPerMonth: 25,
    resumeParsesPerDay: 50,
    mentorshipMsgsPerHour: 999,
    resourceAccess: 'ai',
    challengesPerDay: 5,
    challengeIncludesCode: true,
    challengeExplanationLevel: 'deep_dive',
    interviewsPerMonth: 9999, // practically unlimited
    interviewFeedbackLevel: 'deep_dive',
    advancedInterviews: true,
    scenariosPerMonth: 9999,
    scenarioComplexity: 'high',
  },
};

/** Pre-mapped resource database for Max users (top skills → curated links) */
export const SKILL_RESOURCES: Record<string, { title: string; url: string; type: 'doc' | 'video' | 'course' | 'article' }[]> = {
  'JavaScript': [
    { title: 'MDN JavaScript Guide', url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide', type: 'doc' },
    { title: 'JavaScript.info — Modern JS Tutorial', url: 'https://javascript.info/', type: 'course' },
    { title: 'Traversy Media — JS Crash Course', url: 'https://www.youtube.com/watch?v=hdI2bqOjy3c', type: 'video' },
  ],
  'TypeScript': [
    { title: 'TypeScript Official Handbook', url: 'https://www.typescriptlang.org/docs/handbook/', type: 'doc' },
    { title: 'Total TypeScript — Matt Pocock', url: 'https://www.totaltypescript.com/', type: 'course' },
    { title: 'No BS TS — Jack Herrington', url: 'https://www.youtube.com/watch?v=LKVHFHJsiO0', type: 'video' },
  ],
  'React': [
    { title: 'React Official Docs', url: 'https://react.dev/', type: 'doc' },
    { title: 'React Tutorial — freeCodeCamp', url: 'https://www.freecodecamp.org/learn/front-end-development-libraries/#react', type: 'course' },
    { title: 'React Full Course 2024 — Traversy', url: 'https://www.youtube.com/watch?v=LDB4uaJ87e0', type: 'video' },
  ],
  'Next.js': [
    { title: 'Next.js Official Docs', url: 'https://nextjs.org/docs', type: 'doc' },
    { title: 'Next.js Learn Course', url: 'https://nextjs.org/learn', type: 'course' },
    { title: 'Next.js Full Tutorial — Codevolution', url: 'https://www.youtube.com/watch?v=9P8mASSREYM', type: 'video' },
  ],
  'Python': [
    { title: 'Python Official Tutorial', url: 'https://docs.python.org/3/tutorial/', type: 'doc' },
    { title: 'Automate the Boring Stuff', url: 'https://automatetheboringstuff.com/', type: 'course' },
    { title: 'Python for Beginners — Mosh', url: 'https://www.youtube.com/watch?v=kqtD5dpn9C8', type: 'video' },
  ],
  'Node.js': [
    { title: 'Node.js Official Docs', url: 'https://nodejs.org/en/docs/', type: 'doc' },
    { title: 'Node.js Tutorial — The Net Ninja', url: 'https://www.youtube.com/watch?v=zb3Qk8SG5Ms', type: 'video' },
    { title: 'NodeSchool Workshoppers', url: 'https://nodeschool.io/', type: 'course' },
  ],
  'SQL': [
    { title: 'SQLBolt — Interactive Lessons', url: 'https://sqlbolt.com/', type: 'course' },
    { title: 'W3Schools SQL Tutorial', url: 'https://www.w3schools.com/sql/', type: 'doc' },
    { title: 'SQL Full Course — freeCodeCamp', url: 'https://www.youtube.com/watch?v=HXV3zeQKqGY', type: 'video' },
  ],
  'Docker': [
    { title: 'Docker Official Getting Started', url: 'https://docs.docker.com/get-started/', type: 'doc' },
    { title: 'Docker Tutorial — TechWorld with Nana', url: 'https://www.youtube.com/watch?v=3c-iBn73dDE', type: 'video' },
    { title: 'Play with Docker', url: 'https://labs.play-with-docker.com/', type: 'course' },
  ],
  'AWS': [
    { title: 'AWS Free Digital Training', url: 'https://aws.amazon.com/training/digital/', type: 'course' },
    { title: 'AWS Docs', url: 'https://docs.aws.amazon.com/', type: 'doc' },
    { title: 'AWS Certified Cloud Practitioner — freeCodeCamp', url: 'https://www.youtube.com/watch?v=SOTamWNgDKc', type: 'video' },
  ],
  'Git': [
    { title: 'Pro Git Book (free)', url: 'https://git-scm.com/book/en/v2', type: 'doc' },
    { title: 'Learn Git Branching', url: 'https://learngitbranching.js.org/', type: 'course' },
    { title: 'Git & GitHub — Traversy', url: 'https://www.youtube.com/watch?v=SWYqp7iY_Tc', type: 'video' },
  ],
  'CI/CD': [
    { title: 'GitHub Actions Docs', url: 'https://docs.github.com/en/actions', type: 'doc' },
    { title: 'CI/CD Pipeline Tutorial — TechWorld with Nana', url: 'https://www.youtube.com/watch?v=R8_veQiYBjI', type: 'video' },
    { title: 'GitLab CI/CD Tutorial', url: 'https://docs.gitlab.com/ee/ci/', type: 'doc' },
  ],
  'System Design': [
    { title: 'System Design Primer (GitHub)', url: 'https://github.com/donnemartin/system-design-primer', type: 'doc' },
    { title: 'Gaurav Sen — System Design', url: 'https://www.youtube.com/c/GauravSensei', type: 'video' },
    { title: 'Designing Data-Intensive Applications', url: 'https://dataintensive.net/', type: 'course' },
  ],
  'Kubernetes': [
    { title: 'Kubernetes Official Tutorials', url: 'https://kubernetes.io/docs/tutorials/', type: 'doc' },
    { title: 'Kubernetes Full Course — TechWorld with Nana', url: 'https://www.youtube.com/watch?v=X48VuDVv0do', type: 'video' },
    { title: 'Kubernetes the Hard Way', url: 'https://github.com/kelseyhightower/kubernetes-the-hard-way', type: 'course' },
  ],
  'GraphQL': [
    { title: 'GraphQL Official Docs', url: 'https://graphql.org/learn/', type: 'doc' },
    { title: 'How to GraphQL (Tutorial)', url: 'https://www.howtographql.com/', type: 'course' },
    { title: 'GraphQL Full Course — freeCodeCamp', url: 'https://www.youtube.com/watch?v=ed8SzALpx1Q', type: 'video' },
  ],
  'MongoDB': [
    { title: 'MongoDB University (Free Courses)', url: 'https://university.mongodb.com/', type: 'course' },
    { title: 'MongoDB Official Docs', url: 'https://www.mongodb.com/docs/', type: 'doc' },
    { title: 'MongoDB Crash Course — Traversy', url: 'https://www.youtube.com/watch?v=-56x56UppqQ', type: 'video' },
  ],
  'Testing': [
    { title: 'Testing JavaScript — Kent C. Dodds', url: 'https://testingjavascript.com/', type: 'course' },
    { title: 'Jest Official Docs', url: 'https://jestjs.io/docs/getting-started', type: 'doc' },
    { title: 'React Testing Library Guide', url: 'https://testing-library.com/docs/react-testing-library/intro/', type: 'doc' },
  ],
  'CSS': [
    { title: 'MDN CSS Guide', url: 'https://developer.mozilla.org/en-US/docs/Web/CSS', type: 'doc' },
    { title: 'CSS Tricks', url: 'https://css-tricks.com/', type: 'article' },
    { title: 'Kevin Powell — CSS King', url: 'https://www.youtube.com/@KevinPowell', type: 'video' },
  ],
  'Tailwind CSS': [
    { title: 'Tailwind CSS Docs', url: 'https://tailwindcss.com/docs', type: 'doc' },
    { title: 'Tailwind Labs YouTube', url: 'https://www.youtube.com/@TailwindLabs', type: 'video' },
  ],
  'Machine Learning': [
    { title: 'Andrew Ng — Machine Learning (Coursera)', url: 'https://www.coursera.org/learn/machine-learning', type: 'course' },
    { title: 'Scikit-learn Docs', url: 'https://scikit-learn.org/stable/user_guide.html', type: 'doc' },
    { title: 'StatQuest — ML Fundamentals', url: 'https://www.youtube.com/@statquest', type: 'video' },
  ],
  'Data Science': [
    { title: 'Kaggle Learn (Free Micro-Courses)', url: 'https://www.kaggle.com/learn', type: 'course' },
    { title: 'Towards Data Science (Medium)', url: 'https://towardsdatascience.com/', type: 'article' },
    { title: 'Data Science Handbook', url: 'https://jakevdp.github.io/PythonDataScienceHandbook/', type: 'doc' },
  ],
  'DevOps': [
    { title: 'DevOps Roadmap (roadmap.sh)', url: 'https://roadmap.sh/devops', type: 'doc' },
    { title: 'DevOps Bootcamp — TechWorld with Nana', url: 'https://www.youtube.com/watch?v=0cDg7QiMiTY', type: 'video' },
  ],
};

/**
 * Generates search URLs for the "Free" tier View Resources.
 */
export function getSearchResourceURLs(skills: string[], milestoneTitle: string) {
  const query = encodeURIComponent(`${milestoneTitle} ${skills.slice(0, 3).join(' ')} tutorial`);
  return {
    google: `https://www.google.com/search?q=${query}`,
    youtube: `https://www.youtube.com/results?search_query=${query}`,
  };
}
