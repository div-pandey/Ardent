// ============================================
// Neo4j Career Graph - Initial Paths & Relationships
// ============================================

// 1. Foundational Roles
UNWIND [
  {name: 'System Administrator', level: 'entry', industry: 'technology', demandScore: 0.70},
  {name: 'Network Engineer', level: 'mid', industry: 'technology', demandScore: 0.75},
  {name: 'Database Administrator', level: 'mid', industry: 'technology', demandScore: 0.78},
  {name: 'IT Support Specialist', level: 'entry', industry: 'technology', demandScore: 0.80},
  {name: 'Scrum Master', level: 'mid', industry: 'technology', demandScore: 0.82},
  {name: 'Agile Coach', level: 'senior', industry: 'technology', demandScore: 0.85}
] AS roleData
MERGE (r:Role {name: roleData.name})
ON CREATE SET r.level = roleData.level,
              r.industry = roleData.industry,
              r.demandScore = roleData.demandScore;

// 2. Career Transitions (LEADS_TO)
UNWIND [
  {from: 'IT Support Specialist', to: 'System Administrator', months: 18, commonality: 0.8, difficulty: 'moderate'},
  {from: 'System Administrator', to: 'DevOps Engineer', months: 24, commonality: 0.6, difficulty: 'hard'},
  {from: 'Database Administrator', to: 'Data Engineer', months: 12, commonality: 0.5, difficulty: 'moderate'},
  {from: 'Software Engineer', to: 'Scrum Master', months: 12, commonality: 0.2, difficulty: 'easy'},
  {from: 'Scrum Master', to: 'Agile Coach', months: 24, commonality: 0.7, difficulty: 'moderate'},
  {from: 'Data Analyst', to: 'Product Manager', months: 18, commonality: 0.3, difficulty: 'hard'}
] AS t
MATCH (a:Role {name: t.from}), (b:Role {name: t.to})
MERGE (a)-[r:LEADS_TO]->(b)
ON CREATE SET r.avgTransitionMonths = t.months,
              r.commonality = t.commonality,
              r.difficulty = t.difficulty;

// 3. Skills (MERGE by name to respect uniqueness constraint)
UNWIND [
  {name: 'Linux Administration', category: 'tool', difficulty: 'intermediate', estimatedHours: 40, popularity: 0.80},
  {name: 'Docker', category: 'tool', difficulty: 'intermediate', estimatedHours: 40, popularity: 0.80},
  {name: 'Kubernetes', category: 'tool', difficulty: 'advanced', estimatedHours: 80, popularity: 0.65},
  {name: 'Agile Methodologies', category: 'methodology', difficulty: 'beginner', estimatedHours: 20, popularity: 0.85},
  {name: 'SQL', category: 'programming_language', difficulty: 'beginner', estimatedHours: 40, popularity: 0.85},
  {name: 'PostgreSQL', category: 'tool', difficulty: 'intermediate', estimatedHours: 40, popularity: 0.70}
] AS sData
MERGE (s:Skill {name: sData.name})
ON CREATE SET s.category = sData.category,
              s.difficulty = sData.difficulty,
              s.estimatedHours = sData.estimatedHours,
              s.popularity = sData.popularity;

// 4. Role Skill Requirements (REQUIRES_SKILL)
UNWIND [
  {role: 'System Administrator', skill: 'Linux Administration', importance: 'must_have', minimumLevel: 'advanced'},
  {role: 'DevOps Engineer', skill: 'Docker', importance: 'must_have', minimumLevel: 'advanced'},
  {role: 'DevOps Engineer', skill: 'Kubernetes', importance: 'must_have', minimumLevel: 'intermediate'},
  {role: 'Scrum Master', skill: 'Agile Methodologies', importance: 'must_have', minimumLevel: 'advanced'},
  {role: 'Database Administrator', skill: 'SQL', importance: 'must_have', minimumLevel: 'advanced'}
] AS req
MATCH (r:Role {name: req.role}), (s:Skill {name: req.skill})
MERGE (r)-[rel:REQUIRES_SKILL]->(s)
ON CREATE SET rel.importance = req.importance,
              rel.minimumLevel = req.minimumLevel;
