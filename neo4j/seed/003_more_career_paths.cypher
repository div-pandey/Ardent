// ============================================
// Neo4j Career Graph - More Career Paths Expansion
// ============================================

// 1. Roles (Engineering, Product, Design, Security)
UNWIND [
  {name: 'Frontend Architect', level: 'senior', industry: 'technology', demandScore: 0.85},
  {name: 'Backend Architect', level: 'senior', industry: 'technology', demandScore: 0.85},
  {name: 'Machine Learning Architect', level: 'senior', industry: 'technology', demandScore: 0.95},
  {name: 'Data Architecture Lead', level: 'lead', industry: 'technology', demandScore: 0.88},
  {name: 'Security Engineer', level: 'mid', industry: 'technology', demandScore: 0.85},
  {name: 'Penetration Tester', level: 'mid', industry: 'technology', demandScore: 0.80},
  {name: 'CISO', level: 'executive', industry: 'technology', demandScore: 0.90},
  {name: 'UI Designer', level: 'mid', industry: 'design', demandScore: 0.78},
  {name: 'Product Designer', level: 'senior', industry: 'design', demandScore: 0.85},
  {name: 'Director of Product', level: 'director', industry: 'technology', demandScore: 0.85},
  {name: 'Growth Hacker', level: 'mid', industry: 'marketing', demandScore: 0.75},
  {name: 'Technical Writer', level: 'mid', industry: 'technology', demandScore: 0.65}
] AS roleData
MERGE (r:Role {name: roleData.name})
ON CREATE SET r.level = roleData.level,
              r.industry = roleData.industry,
              r.demandScore = roleData.demandScore;

// 2. Career Transitions (LEADS_TO)
UNWIND [
  {from: 'Frontend Developer', to: 'Frontend Architect', months: 48, commonality: 0.4, difficulty: 'hard'},
  {from: 'Backend Developer', to: 'Backend Architect', months: 48, commonality: 0.4, difficulty: 'hard'},
  {from: 'ML Engineer', to: 'Machine Learning Architect', months: 36, commonality: 0.3, difficulty: 'hard'},
  {from: 'Software Engineer', to: 'Security Engineer', months: 18, commonality: 0.2, difficulty: 'hard'},
  {from: 'Security Engineer', to: 'Penetration Tester', months: 12, commonality: 0.5, difficulty: 'moderate'},
  {from: 'Cybersecurity Analyst', to: 'CISO', months: 96, commonality: 0.1, difficulty: 'hard'},
  {from: 'UX Designer', to: 'Product Designer', months: 24, commonality: 0.8, difficulty: 'moderate'},
  {from: 'UI Designer', to: 'Product Designer', months: 24, commonality: 0.6, difficulty: 'moderate'},
  {from: 'Product Manager', to: 'Director of Product', months: 60, commonality: 0.3, difficulty: 'hard'},
  {from: 'Software Engineer', to: 'Technical Writer', months: 6, commonality: 0.1, difficulty: 'easy'}
] AS t
MATCH (a:Role {name: t.from}), (b:Role {name: t.to})
MERGE (a)-[r:LEADS_TO]->(b)
ON CREATE SET r.avgTransitionMonths = t.months,
              r.commonality = t.commonality,
              r.difficulty = t.difficulty;

// 3. Additional Skills (MERGE by name to respect uniqueness constraint)
UNWIND [
  {name: 'System Design', category: 'concept', difficulty: 'advanced', estimatedHours: 100, popularity: 0.75},
  {name: 'Figma', category: 'tool', difficulty: 'intermediate', estimatedHours: 40, popularity: 0.90},
  {name: 'Cybersecurity Principles', category: 'concept', difficulty: 'intermediate', estimatedHours: 50, popularity: 0.85},
  {name: 'Technical Writing', category: 'soft_skill', difficulty: 'intermediate', estimatedHours: 30, popularity: 0.70}
] AS sData
MERGE (s:Skill {name: sData.name})
ON CREATE SET s.category = sData.category,
              s.difficulty = sData.difficulty,
              s.estimatedHours = sData.estimatedHours,
              s.popularity = sData.popularity;

// 4. Role Skill Requirements (REQUIRES_SKILL)
UNWIND [
  {role: 'Frontend Architect', skill: 'System Design', importance: 'must_have', minimumLevel: 'advanced'},
  {role: 'Backend Architect', skill: 'System Design', importance: 'must_have', minimumLevel: 'advanced'},
  {role: 'Product Designer', skill: 'Figma', importance: 'must_have', minimumLevel: 'advanced'},
  {role: 'Security Engineer', skill: 'Cybersecurity Principles', importance: 'must_have', minimumLevel: 'advanced'}
] AS req
MATCH (r:Role {name: req.role}), (s:Skill {name: req.skill})
MERGE (r)-[rel:REQUIRES_SKILL]->(s)
ON CREATE SET rel.importance = req.importance,
              rel.minimumLevel = req.minimumLevel;
