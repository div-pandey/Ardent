// Neo4j Career Graph Seed Data
// Run these Cypher queries in Neo4j AuraDB Browser to seed career data

// ============================================
// CONSTRAINTS AND INDEXES
// ============================================

CREATE CONSTRAINT skill_name IF NOT EXISTS FOR (s:Skill) REQUIRE s.name IS UNIQUE;
CREATE CONSTRAINT role_name IF NOT EXISTS FOR (r:Role) REQUIRE r.name IS UNIQUE;
CREATE CONSTRAINT tech_name IF NOT EXISTS FOR (t:Technology) REQUIRE t.name IS UNIQUE;
CREATE CONSTRAINT cert_name IF NOT EXISTS FOR (c:Certification) REQUIRE c.name IS UNIQUE;
CREATE INDEX skill_category IF NOT EXISTS FOR (s:Skill) ON (s.category);

// ============================================
// ROLES
// ============================================

UNWIND [
  {name: 'Frontend Developer', level: 'entry', industry: 'technology', demandScore: 0.85},
  {name: 'Backend Developer', level: 'mid', industry: 'technology', demandScore: 0.82},
  {name: 'Full Stack Developer', level: 'mid', industry: 'technology', demandScore: 0.88},
  {name: 'Software Engineer', level: 'mid', industry: 'technology', demandScore: 0.90},
  {name: 'Data Analyst', level: 'entry', industry: 'technology', demandScore: 0.75},
  {name: 'Data Scientist', level: 'mid', industry: 'technology', demandScore: 0.80},
  {name: 'Data Engineer', level: 'mid', industry: 'technology', demandScore: 0.78},
  {name: 'ML Engineer', level: 'mid', industry: 'technology', demandScore: 0.85},
  {name: 'AI Engineer', level: 'senior', industry: 'technology', demandScore: 0.90},
  {name: 'DevOps Engineer', level: 'mid', industry: 'technology', demandScore: 0.80},
  {name: 'Cloud Architect', level: 'senior', industry: 'technology', demandScore: 0.82},
  {name: 'Product Manager', level: 'mid', industry: 'technology', demandScore: 0.85},
  {name: 'UX Designer', level: 'mid', industry: 'technology', demandScore: 0.72},
  {name: 'Mobile Developer', level: 'mid', industry: 'technology', demandScore: 0.78},
  {name: 'Cybersecurity Analyst', level: 'mid', industry: 'technology', demandScore: 0.82},
  {name: 'QA Engineer', level: 'mid', industry: 'technology', demandScore: 0.65},
  {name: 'Site Reliability Engineer', level: 'senior', industry: 'technology', demandScore: 0.80},
  {name: 'Blockchain Developer', level: 'mid', industry: 'technology', demandScore: 0.60},
  {name: 'Technical Lead', level: 'senior', industry: 'technology', demandScore: 0.85},
  {name: 'Engineering Manager', level: 'lead', industry: 'technology', demandScore: 0.80}
] AS roleData
MERGE (r:Role {name: roleData.name})
ON CREATE SET r.level = roleData.level,
              r.industry = roleData.industry,
              r.demandScore = roleData.demandScore;

// ============================================
// CAREER TRANSITIONS (LEADS_TO)
// ============================================

UNWIND [
  {from: 'Frontend Developer', to: 'Full Stack Developer', months: 12, commonality: 0.7, difficulty: 'moderate'},
  {from: 'Frontend Developer', to: 'Software Engineer', months: 6, commonality: 0.5, difficulty: 'easy'},
  {from: 'Frontend Developer', to: 'UX Designer', months: 8, commonality: 0.3, difficulty: 'moderate'},
  {from: 'Frontend Developer', to: 'Mobile Developer', months: 6, commonality: 0.4, difficulty: 'easy'},
  {from: 'Backend Developer', to: 'Full Stack Developer', months: 8, commonality: 0.6, difficulty: 'easy'},
  {from: 'Backend Developer', to: 'DevOps Engineer', months: 10, commonality: 0.4, difficulty: 'moderate'},
  {from: 'Backend Developer', to: 'Data Engineer', months: 12, commonality: 0.3, difficulty: 'moderate'},
  {from: 'Full Stack Developer', to: 'Technical Lead', months: 24, commonality: 0.3, difficulty: 'hard'},
  {from: 'Full Stack Developer', to: 'Product Manager', months: 18, commonality: 0.2, difficulty: 'hard'},
  {from: 'Full Stack Developer', to: 'ML Engineer', months: 14, commonality: 0.2, difficulty: 'hard'},
  {from: 'Data Analyst', to: 'Data Scientist', months: 12, commonality: 0.6, difficulty: 'moderate'},
  {from: 'Data Analyst', to: 'Data Engineer', months: 10, commonality: 0.4, difficulty: 'moderate'},
  {from: 'Data Scientist', to: 'ML Engineer', months: 8, commonality: 0.5, difficulty: 'moderate'},
  {from: 'ML Engineer', to: 'AI Engineer', months: 12, commonality: 0.4, difficulty: 'hard'},
  {from: 'DevOps Engineer', to: 'Cloud Architect', months: 18, commonality: 0.3, difficulty: 'hard'},
  {from: 'DevOps Engineer', to: 'Site Reliability Engineer', months: 12, commonality: 0.5, difficulty: 'moderate'},
  {from: 'Software Engineer', to: 'Technical Lead', months: 36, commonality: 0.3, difficulty: 'hard'},
  {from: 'Technical Lead', to: 'Engineering Manager', months: 24, commonality: 0.4, difficulty: 'hard'}
] AS t
MATCH (a:Role {name: t.from}), (b:Role {name: t.to})
MERGE (a)-[r:LEADS_TO]->(b)
ON CREATE SET r.avgTransitionMonths = t.months,
              r.commonality = t.commonality,
              r.difficulty = t.difficulty;

// ============================================
// SKILLS (50+ skills)
// ============================================

UNWIND [
  {name: 'JavaScript', category: 'programming_language', difficulty: 'beginner', estimatedHours: 100, popularity: 0.95},
  {name: 'TypeScript', category: 'programming_language', difficulty: 'intermediate', estimatedHours: 60, popularity: 0.85},
  {name: 'Python', category: 'programming_language', difficulty: 'beginner', estimatedHours: 80, popularity: 0.92},
  {name: 'Java', category: 'programming_language', difficulty: 'intermediate', estimatedHours: 120, popularity: 0.75},
  {name: 'Go', category: 'programming_language', difficulty: 'intermediate', estimatedHours: 80, popularity: 0.60},
  {name: 'Rust', category: 'programming_language', difficulty: 'advanced', estimatedHours: 150, popularity: 0.40},
  {name: 'SQL', category: 'programming_language', difficulty: 'beginner', estimatedHours: 40, popularity: 0.85},
  {name: 'HTML/CSS', category: 'programming_language', difficulty: 'beginner', estimatedHours: 50, popularity: 0.90},
  {name: 'React', category: 'framework', difficulty: 'intermediate', estimatedHours: 80, popularity: 0.90},
  {name: 'Next.js', category: 'framework', difficulty: 'intermediate', estimatedHours: 60, popularity: 0.75},
  {name: 'Node.js', category: 'framework', difficulty: 'intermediate', estimatedHours: 60, popularity: 0.80},
  {name: 'Django', category: 'framework', difficulty: 'intermediate', estimatedHours: 60, popularity: 0.55},
  {name: 'Flask', category: 'framework', difficulty: 'beginner', estimatedHours: 30, popularity: 0.45},
  {name: 'Express.js', category: 'framework', difficulty: 'beginner', estimatedHours: 30, popularity: 0.65},
  {name: 'NumPy', category: 'library', difficulty: 'beginner', estimatedHours: 20, popularity: 0.70},
  {name: 'Pandas', category: 'library', difficulty: 'beginner', estimatedHours: 30, popularity: 0.72},
  {name: 'Scikit-learn', category: 'library', difficulty: 'intermediate', estimatedHours: 50, popularity: 0.65},
  {name: 'TensorFlow', category: 'library', difficulty: 'advanced', estimatedHours: 100, popularity: 0.70},
  {name: 'PyTorch', category: 'library', difficulty: 'advanced', estimatedHours: 100, popularity: 0.68},
  {name: 'Machine Learning', category: 'concept', difficulty: 'advanced', estimatedHours: 200, popularity: 0.80},
  {name: 'Deep Learning', category: 'concept', difficulty: 'advanced', estimatedHours: 150, popularity: 0.65},
  {name: 'Statistics', category: 'concept', difficulty: 'intermediate', estimatedHours: 80, popularity: 0.70},
  {name: 'Data Visualization', category: 'concept', difficulty: 'beginner', estimatedHours: 30, popularity: 0.60},
  {name: 'System Design', category: 'concept', difficulty: 'advanced', estimatedHours: 100, popularity: 0.75},
  {name: 'REST APIs', category: 'concept', difficulty: 'beginner', estimatedHours: 20, popularity: 0.85},
  {name: 'GraphQL', category: 'concept', difficulty: 'intermediate', estimatedHours: 30, popularity: 0.50},
  {name: 'Git', category: 'tool', difficulty: 'beginner', estimatedHours: 15, popularity: 0.95},
  {name: 'Docker', category: 'tool', difficulty: 'intermediate', estimatedHours: 40, popularity: 0.80},
  {name: 'Kubernetes', category: 'tool', difficulty: 'advanced', estimatedHours: 80, popularity: 0.65},
  {name: 'CI/CD', category: 'concept', difficulty: 'intermediate', estimatedHours: 30, popularity: 0.75},
  {name: 'AWS', category: 'tool', difficulty: 'intermediate', estimatedHours: 80, popularity: 0.82},
  {name: 'PostgreSQL', category: 'tool', difficulty: 'intermediate', estimatedHours: 40, popularity: 0.70},
  {name: 'MongoDB', category: 'tool', difficulty: 'beginner', estimatedHours: 25, popularity: 0.55},
  {name: 'Redis', category: 'tool', difficulty: 'intermediate', estimatedHours: 20, popularity: 0.55},
  {name: 'Linux', category: 'tool', difficulty: 'intermediate', estimatedHours: 40, popularity: 0.75},
  {name: 'Agile/Scrum', category: 'methodology', difficulty: 'beginner', estimatedHours: 10, popularity: 0.80},
  {name: 'Communication', category: 'soft_skill', difficulty: 'beginner', estimatedHours: 0, popularity: 0.95},
  {name: 'Problem Solving', category: 'soft_skill', difficulty: 'beginner', estimatedHours: 0, popularity: 0.95},
  {name: 'Leadership', category: 'soft_skill', difficulty: 'intermediate', estimatedHours: 0, popularity: 0.80},
  {name: 'MLOps', category: 'concept', difficulty: 'advanced', estimatedHours: 60, popularity: 0.55},
  {name: 'NLP', category: 'concept', difficulty: 'advanced', estimatedHours: 100, popularity: 0.55},
  {name: 'Computer Vision', category: 'concept', difficulty: 'advanced', estimatedHours: 100, popularity: 0.50},
  {name: 'Feature Engineering', category: 'concept', difficulty: 'intermediate', estimatedHours: 40, popularity: 0.55},
  {name: 'Data Cleaning', category: 'concept', difficulty: 'beginner', estimatedHours: 20, popularity: 0.65},
  {name: 'A/B Testing', category: 'concept', difficulty: 'intermediate', estimatedHours: 15, popularity: 0.50}
] AS sData
MERGE (s:Skill {name: sData.name})
ON CREATE SET s.category = sData.category,
              s.difficulty = sData.difficulty,
              s.estimatedHours = sData.estimatedHours,
              s.popularity = sData.popularity;

// ============================================
// SKILL DEPENDENCIES (DEPENDS_ON)
// ============================================

UNWIND [
  {from: 'React', to: 'JavaScript', strength: 'required'},
  {from: 'TypeScript', to: 'JavaScript', strength: 'required'},
  {from: 'Next.js', to: 'React', strength: 'required'},
  {from: 'Node.js', to: 'JavaScript', strength: 'required'},
  {from: 'Express.js', to: 'Node.js', strength: 'required'},
  {from: 'Machine Learning', to: 'Python', strength: 'required'},
  {from: 'Machine Learning', to: 'Statistics', strength: 'required'},
  {from: 'Deep Learning', to: 'Machine Learning', strength: 'required'},
  {from: 'TensorFlow', to: 'Python', strength: 'required'},
  {from: 'TensorFlow', to: 'Deep Learning', strength: 'recommended'},
  {from: 'PyTorch', to: 'Python', strength: 'required'},
  {from: 'Scikit-learn', to: 'Python', strength: 'required'},
  {from: 'NumPy', to: 'Python', strength: 'required'},
  {from: 'Pandas', to: 'Python', strength: 'required'},
  {from: 'Kubernetes', to: 'Docker', strength: 'required'},
  {from: 'NLP', to: 'Deep Learning', strength: 'required'},
  {from: 'Computer Vision', to: 'Deep Learning', strength: 'required'},
  {from: 'MLOps', to: 'Docker', strength: 'recommended'},
  {from: 'MLOps', to: 'CI/CD', strength: 'recommended'},
  {from: 'Feature Engineering', to: 'Pandas', strength: 'recommended'}
] AS dep
MATCH (a:Skill {name: dep.from}), (b:Skill {name: dep.to})
MERGE (a)-[r:DEPENDS_ON]->(b)
ON CREATE SET r.strength = dep.strength;

// ============================================
// ROLE REQUIRES SKILL (REQUIRES_SKILL)
// ============================================

UNWIND [
  {role: 'Frontend Developer', skill: 'JavaScript', importance: 'must_have', minimumLevel: 'intermediate'},
  {role: 'Frontend Developer', skill: 'React', importance: 'must_have', minimumLevel: 'intermediate'},
  {role: 'Frontend Developer', skill: 'HTML/CSS', importance: 'must_have', minimumLevel: 'advanced'},
  {role: 'Frontend Developer', skill: 'TypeScript', importance: 'nice_to_have', minimumLevel: 'beginner'},
  {role: 'Frontend Developer', skill: 'Git', importance: 'must_have', minimumLevel: 'beginner'},

  {role: 'ML Engineer', skill: 'Python', importance: 'must_have', minimumLevel: 'advanced'},
  {role: 'ML Engineer', skill: 'Machine Learning', importance: 'must_have', minimumLevel: 'advanced'},
  {role: 'ML Engineer', skill: 'TensorFlow', importance: 'must_have', minimumLevel: 'intermediate'},
  {role: 'ML Engineer', skill: 'Statistics', importance: 'must_have', minimumLevel: 'intermediate'},
  {role: 'ML Engineer', skill: 'SQL', importance: 'nice_to_have', minimumLevel: 'intermediate'},
  {role: 'ML Engineer', skill: 'Docker', importance: 'nice_to_have', minimumLevel: 'beginner'},
  {role: 'ML Engineer', skill: 'Deep Learning', importance: 'must_have', minimumLevel: 'intermediate'},

  {role: 'Full Stack Developer', skill: 'JavaScript', importance: 'must_have', minimumLevel: 'advanced'},
  {role: 'Full Stack Developer', skill: 'React', importance: 'must_have', minimumLevel: 'intermediate'},
  {role: 'Full Stack Developer', skill: 'Node.js', importance: 'must_have', minimumLevel: 'intermediate'},
  {role: 'Full Stack Developer', skill: 'SQL', importance: 'must_have', minimumLevel: 'intermediate'},
  {role: 'Full Stack Developer', skill: 'Git', importance: 'must_have', minimumLevel: 'intermediate'},
  {role: 'Full Stack Developer', skill: 'Docker', importance: 'nice_to_have', minimumLevel: 'beginner'},
  {role: 'Full Stack Developer', skill: 'PostgreSQL', importance: 'nice_to_have', minimumLevel: 'beginner'},

  {role: 'Data Scientist', skill: 'Python', importance: 'must_have', minimumLevel: 'advanced'},
  {role: 'Data Scientist', skill: 'Statistics', importance: 'must_have', minimumLevel: 'advanced'},
  {role: 'Data Scientist', skill: 'Machine Learning', importance: 'must_have', minimumLevel: 'intermediate'},
  {role: 'Data Scientist', skill: 'SQL', importance: 'must_have', minimumLevel: 'intermediate'},
  {role: 'Data Scientist', skill: 'Pandas', importance: 'must_have', minimumLevel: 'intermediate'},
  {role: 'Data Scientist', skill: 'Data Visualization', importance: 'must_have', minimumLevel: 'intermediate'},

  {role: 'DevOps Engineer', skill: 'Docker', importance: 'must_have', minimumLevel: 'advanced'},
  {role: 'DevOps Engineer', skill: 'Kubernetes', importance: 'must_have', minimumLevel: 'intermediate'},
  {role: 'DevOps Engineer', skill: 'CI/CD', importance: 'must_have', minimumLevel: 'advanced'},
  {role: 'DevOps Engineer', skill: 'Linux', importance: 'must_have', minimumLevel: 'advanced'},
  {role: 'DevOps Engineer', skill: 'AWS', importance: 'must_have', minimumLevel: 'intermediate'},
  {role: 'DevOps Engineer', skill: 'Git', importance: 'must_have', minimumLevel: 'advanced'}
] AS req
MATCH (r:Role {name: req.role}), (s:Skill {name: req.skill})
MERGE (r)-[rel:REQUIRES_SKILL]->(s)
ON CREATE SET rel.importance = req.importance,
              rel.minimumLevel = req.minimumLevel;
