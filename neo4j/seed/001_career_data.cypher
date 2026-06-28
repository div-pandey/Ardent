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

CREATE (:Role {name: 'Frontend Developer', level: 'entry', industry: 'technology', demandScore: 0.85})
CREATE (:Role {name: 'Backend Developer', level: 'mid', industry: 'technology', demandScore: 0.82})
CREATE (:Role {name: 'Full Stack Developer', level: 'mid', industry: 'technology', demandScore: 0.88})
CREATE (:Role {name: 'Software Engineer', level: 'mid', industry: 'technology', demandScore: 0.90})
CREATE (:Role {name: 'Data Analyst', level: 'entry', industry: 'technology', demandScore: 0.75})
CREATE (:Role {name: 'Data Scientist', level: 'mid', industry: 'technology', demandScore: 0.80})
CREATE (:Role {name: 'Data Engineer', level: 'mid', industry: 'technology', demandScore: 0.78})
CREATE (:Role {name: 'ML Engineer', level: 'mid', industry: 'technology', demandScore: 0.85})
CREATE (:Role {name: 'AI Engineer', level: 'senior', industry: 'technology', demandScore: 0.90})
CREATE (:Role {name: 'DevOps Engineer', level: 'mid', industry: 'technology', demandScore: 0.80})
CREATE (:Role {name: 'Cloud Architect', level: 'senior', industry: 'technology', demandScore: 0.82})
CREATE (:Role {name: 'Product Manager', level: 'mid', industry: 'technology', demandScore: 0.85})
CREATE (:Role {name: 'UX Designer', level: 'mid', industry: 'technology', demandScore: 0.72})
CREATE (:Role {name: 'Mobile Developer', level: 'mid', industry: 'technology', demandScore: 0.78})
CREATE (:Role {name: 'Cybersecurity Analyst', level: 'mid', industry: 'technology', demandScore: 0.82})
CREATE (:Role {name: 'QA Engineer', level: 'mid', industry: 'technology', demandScore: 0.65})
CREATE (:Role {name: 'Site Reliability Engineer', level: 'senior', industry: 'technology', demandScore: 0.80})
CREATE (:Role {name: 'Blockchain Developer', level: 'mid', industry: 'technology', demandScore: 0.60})
CREATE (:Role {name: 'Technical Lead', level: 'senior', industry: 'technology', demandScore: 0.85})
CREATE (:Role {name: 'Engineering Manager', level: 'lead', industry: 'technology', demandScore: 0.80});

// ============================================
// CAREER TRANSITIONS (LEADS_TO)
// ============================================

MATCH (a:Role {name: 'Frontend Developer'}), (b:Role {name: 'Full Stack Developer'})
CREATE (a)-[:LEADS_TO {avgTransitionMonths: 12, commonality: 0.7, difficulty: 'moderate'}]->(b);

MATCH (a:Role {name: 'Frontend Developer'}), (b:Role {name: 'Software Engineer'})
CREATE (a)-[:LEADS_TO {avgTransitionMonths: 6, commonality: 0.5, difficulty: 'easy'}]->(b);

MATCH (a:Role {name: 'Frontend Developer'}), (b:Role {name: 'UX Designer'})
CREATE (a)-[:LEADS_TO {avgTransitionMonths: 8, commonality: 0.3, difficulty: 'moderate'}]->(b);

MATCH (a:Role {name: 'Frontend Developer'}), (b:Role {name: 'Mobile Developer'})
CREATE (a)-[:LEADS_TO {avgTransitionMonths: 6, commonality: 0.4, difficulty: 'easy'}]->(b);

MATCH (a:Role {name: 'Backend Developer'}), (b:Role {name: 'Full Stack Developer'})
CREATE (a)-[:LEADS_TO {avgTransitionMonths: 8, commonality: 0.6, difficulty: 'easy'}]->(b);

MATCH (a:Role {name: 'Backend Developer'}), (b:Role {name: 'DevOps Engineer'})
CREATE (a)-[:LEADS_TO {avgTransitionMonths: 10, commonality: 0.4, difficulty: 'moderate'}]->(b);

MATCH (a:Role {name: 'Backend Developer'}), (b:Role {name: 'Data Engineer'})
CREATE (a)-[:LEADS_TO {avgTransitionMonths: 12, commonality: 0.3, difficulty: 'moderate'}]->(b);

MATCH (a:Role {name: 'Full Stack Developer'}), (b:Role {name: 'Technical Lead'})
CREATE (a)-[:LEADS_TO {avgTransitionMonths: 24, commonality: 0.3, difficulty: 'hard'}]->(b);

MATCH (a:Role {name: 'Full Stack Developer'}), (b:Role {name: 'Product Manager'})
CREATE (a)-[:LEADS_TO {avgTransitionMonths: 18, commonality: 0.2, difficulty: 'hard'}]->(b);

MATCH (a:Role {name: 'Full Stack Developer'}), (b:Role {name: 'ML Engineer'})
CREATE (a)-[:LEADS_TO {avgTransitionMonths: 14, commonality: 0.2, difficulty: 'hard'}]->(b);

MATCH (a:Role {name: 'Data Analyst'}), (b:Role {name: 'Data Scientist'})
CREATE (a)-[:LEADS_TO {avgTransitionMonths: 12, commonality: 0.6, difficulty: 'moderate'}]->(b);

MATCH (a:Role {name: 'Data Analyst'}), (b:Role {name: 'Data Engineer'})
CREATE (a)-[:LEADS_TO {avgTransitionMonths: 10, commonality: 0.4, difficulty: 'moderate'}]->(b);

MATCH (a:Role {name: 'Data Scientist'}), (b:Role {name: 'ML Engineer'})
CREATE (a)-[:LEADS_TO {avgTransitionMonths: 8, commonality: 0.5, difficulty: 'moderate'}]->(b);

MATCH (a:Role {name: 'ML Engineer'}), (b:Role {name: 'AI Engineer'})
CREATE (a)-[:LEADS_TO {avgTransitionMonths: 12, commonality: 0.4, difficulty: 'hard'}]->(b);

MATCH (a:Role {name: 'DevOps Engineer'}), (b:Role {name: 'Cloud Architect'})
CREATE (a)-[:LEADS_TO {avgTransitionMonths: 18, commonality: 0.3, difficulty: 'hard'}]->(b);

MATCH (a:Role {name: 'DevOps Engineer'}), (b:Role {name: 'Site Reliability Engineer'})
CREATE (a)-[:LEADS_TO {avgTransitionMonths: 12, commonality: 0.5, difficulty: 'moderate'}]->(b);

MATCH (a:Role {name: 'Software Engineer'}), (b:Role {name: 'Technical Lead'})
CREATE (a)-[:LEADS_TO {avgTransitionMonths: 36, commonality: 0.3, difficulty: 'hard'}]->(b);

MATCH (a:Role {name: 'Technical Lead'}), (b:Role {name: 'Engineering Manager'})
CREATE (a)-[:LEADS_TO {avgTransitionMonths: 24, commonality: 0.4, difficulty: 'hard'}]->(b);

// ============================================
// SKILLS (50+ skills)
// ============================================

CREATE (:Skill {name: 'JavaScript', category: 'programming_language', difficulty: 'beginner', estimatedHours: 100, popularity: 0.95})
CREATE (:Skill {name: 'TypeScript', category: 'programming_language', difficulty: 'intermediate', estimatedHours: 60, popularity: 0.85})
CREATE (:Skill {name: 'Python', category: 'programming_language', difficulty: 'beginner', estimatedHours: 80, popularity: 0.92})
CREATE (:Skill {name: 'Java', category: 'programming_language', difficulty: 'intermediate', estimatedHours: 120, popularity: 0.75})
CREATE (:Skill {name: 'Go', category: 'programming_language', difficulty: 'intermediate', estimatedHours: 80, popularity: 0.60})
CREATE (:Skill {name: 'Rust', category: 'programming_language', difficulty: 'advanced', estimatedHours: 150, popularity: 0.40})
CREATE (:Skill {name: 'SQL', category: 'programming_language', difficulty: 'beginner', estimatedHours: 40, popularity: 0.85})
CREATE (:Skill {name: 'HTML/CSS', category: 'programming_language', difficulty: 'beginner', estimatedHours: 50, popularity: 0.90})
CREATE (:Skill {name: 'React', category: 'framework', difficulty: 'intermediate', estimatedHours: 80, popularity: 0.90})
CREATE (:Skill {name: 'Next.js', category: 'framework', difficulty: 'intermediate', estimatedHours: 60, popularity: 0.75})
CREATE (:Skill {name: 'Node.js', category: 'framework', difficulty: 'intermediate', estimatedHours: 60, popularity: 0.80})
CREATE (:Skill {name: 'Django', category: 'framework', difficulty: 'intermediate', estimatedHours: 60, popularity: 0.55})
CREATE (:Skill {name: 'Flask', category: 'framework', difficulty: 'beginner', estimatedHours: 30, popularity: 0.45})
CREATE (:Skill {name: 'Express.js', category: 'framework', difficulty: 'beginner', estimatedHours: 30, popularity: 0.65})
CREATE (:Skill {name: 'NumPy', category: 'library', difficulty: 'beginner', estimatedHours: 20, popularity: 0.70})
CREATE (:Skill {name: 'Pandas', category: 'library', difficulty: 'beginner', estimatedHours: 30, popularity: 0.72})
CREATE (:Skill {name: 'Scikit-learn', category: 'library', difficulty: 'intermediate', estimatedHours: 50, popularity: 0.65})
CREATE (:Skill {name: 'TensorFlow', category: 'library', difficulty: 'advanced', estimatedHours: 100, popularity: 0.70})
CREATE (:Skill {name: 'PyTorch', category: 'library', difficulty: 'advanced', estimatedHours: 100, popularity: 0.68})
CREATE (:Skill {name: 'Machine Learning', category: 'concept', difficulty: 'advanced', estimatedHours: 200, popularity: 0.80})
CREATE (:Skill {name: 'Deep Learning', category: 'concept', difficulty: 'advanced', estimatedHours: 150, popularity: 0.65})
CREATE (:Skill {name: 'Statistics', category: 'concept', difficulty: 'intermediate', estimatedHours: 80, popularity: 0.70})
CREATE (:Skill {name: 'Data Visualization', category: 'concept', difficulty: 'beginner', estimatedHours: 30, popularity: 0.60})
CREATE (:Skill {name: 'System Design', category: 'concept', difficulty: 'advanced', estimatedHours: 100, popularity: 0.75})
CREATE (:Skill {name: 'REST APIs', category: 'concept', difficulty: 'beginner', estimatedHours: 20, popularity: 0.85})
CREATE (:Skill {name: 'GraphQL', category: 'concept', difficulty: 'intermediate', estimatedHours: 30, popularity: 0.50})
CREATE (:Skill {name: 'Git', category: 'tool', difficulty: 'beginner', estimatedHours: 15, popularity: 0.95})
CREATE (:Skill {name: 'Docker', category: 'tool', difficulty: 'intermediate', estimatedHours: 40, popularity: 0.80})
CREATE (:Skill {name: 'Kubernetes', category: 'tool', difficulty: 'advanced', estimatedHours: 80, popularity: 0.65})
CREATE (:Skill {name: 'CI/CD', category: 'concept', difficulty: 'intermediate', estimatedHours: 30, popularity: 0.75})
CREATE (:Skill {name: 'AWS', category: 'tool', difficulty: 'intermediate', estimatedHours: 80, popularity: 0.82})
CREATE (:Skill {name: 'PostgreSQL', category: 'tool', difficulty: 'intermediate', estimatedHours: 40, popularity: 0.70})
CREATE (:Skill {name: 'MongoDB', category: 'tool', difficulty: 'beginner', estimatedHours: 25, popularity: 0.55})
CREATE (:Skill {name: 'Redis', category: 'tool', difficulty: 'intermediate', estimatedHours: 20, popularity: 0.55})
CREATE (:Skill {name: 'Linux', category: 'tool', difficulty: 'intermediate', estimatedHours: 40, popularity: 0.75})
CREATE (:Skill {name: 'Agile/Scrum', category: 'methodology', difficulty: 'beginner', estimatedHours: 10, popularity: 0.80})
CREATE (:Skill {name: 'Communication', category: 'soft_skill', difficulty: 'beginner', estimatedHours: 0, popularity: 0.95})
CREATE (:Skill {name: 'Problem Solving', category: 'soft_skill', difficulty: 'beginner', estimatedHours: 0, popularity: 0.95})
CREATE (:Skill {name: 'Leadership', category: 'soft_skill', difficulty: 'intermediate', estimatedHours: 0, popularity: 0.80})
CREATE (:Skill {name: 'MLOps', category: 'concept', difficulty: 'advanced', estimatedHours: 60, popularity: 0.55})
CREATE (:Skill {name: 'NLP', category: 'concept', difficulty: 'advanced', estimatedHours: 100, popularity: 0.55})
CREATE (:Skill {name: 'Computer Vision', category: 'concept', difficulty: 'advanced', estimatedHours: 100, popularity: 0.50})
CREATE (:Skill {name: 'Feature Engineering', category: 'concept', difficulty: 'intermediate', estimatedHours: 40, popularity: 0.55})
CREATE (:Skill {name: 'Data Cleaning', category: 'concept', difficulty: 'beginner', estimatedHours: 20, popularity: 0.65})
CREATE (:Skill {name: 'A/B Testing', category: 'concept', difficulty: 'intermediate', estimatedHours: 15, popularity: 0.50});

// ============================================
// SKILL DEPENDENCIES (DEPENDS_ON)
// ============================================

MATCH (a:Skill {name: 'React'}), (b:Skill {name: 'JavaScript'}) CREATE (a)-[:DEPENDS_ON {strength: 'required'}]->(b);
MATCH (a:Skill {name: 'TypeScript'}), (b:Skill {name: 'JavaScript'}) CREATE (a)-[:DEPENDS_ON {strength: 'required'}]->(b);
MATCH (a:Skill {name: 'Next.js'}), (b:Skill {name: 'React'}) CREATE (a)-[:DEPENDS_ON {strength: 'required'}]->(b);
MATCH (a:Skill {name: 'Node.js'}), (b:Skill {name: 'JavaScript'}) CREATE (a)-[:DEPENDS_ON {strength: 'required'}]->(b);
MATCH (a:Skill {name: 'Express.js'}), (b:Skill {name: 'Node.js'}) CREATE (a)-[:DEPENDS_ON {strength: 'required'}]->(b);
MATCH (a:Skill {name: 'Machine Learning'}), (b:Skill {name: 'Python'}) CREATE (a)-[:DEPENDS_ON {strength: 'required'}]->(b);
MATCH (a:Skill {name: 'Machine Learning'}), (b:Skill {name: 'Statistics'}) CREATE (a)-[:DEPENDS_ON {strength: 'required'}]->(b);
MATCH (a:Skill {name: 'Deep Learning'}), (b:Skill {name: 'Machine Learning'}) CREATE (a)-[:DEPENDS_ON {strength: 'required'}]->(b);
MATCH (a:Skill {name: 'TensorFlow'}), (b:Skill {name: 'Python'}) CREATE (a)-[:DEPENDS_ON {strength: 'required'}]->(b);
MATCH (a:Skill {name: 'TensorFlow'}), (b:Skill {name: 'Deep Learning'}) CREATE (a)-[:DEPENDS_ON {strength: 'recommended'}]->(b);
MATCH (a:Skill {name: 'PyTorch'}), (b:Skill {name: 'Python'}) CREATE (a)-[:DEPENDS_ON {strength: 'required'}]->(b);
MATCH (a:Skill {name: 'Scikit-learn'}), (b:Skill {name: 'Python'}) CREATE (a)-[:DEPENDS_ON {strength: 'required'}]->(b);
MATCH (a:Skill {name: 'NumPy'}), (b:Skill {name: 'Python'}) CREATE (a)-[:DEPENDS_ON {strength: 'required'}]->(b);
MATCH (a:Skill {name: 'Pandas'}), (b:Skill {name: 'Python'}) CREATE (a)-[:DEPENDS_ON {strength: 'required'}]->(b);
MATCH (a:Skill {name: 'Kubernetes'}), (b:Skill {name: 'Docker'}) CREATE (a)-[:DEPENDS_ON {strength: 'required'}]->(b);
MATCH (a:Skill {name: 'NLP'}), (b:Skill {name: 'Deep Learning'}) CREATE (a)-[:DEPENDS_ON {strength: 'required'}]->(b);
MATCH (a:Skill {name: 'Computer Vision'}), (b:Skill {name: 'Deep Learning'}) CREATE (a)-[:DEPENDS_ON {strength: 'required'}]->(b);
MATCH (a:Skill {name: 'MLOps'}), (b:Skill {name: 'Docker'}) CREATE (a)-[:DEPENDS_ON {strength: 'recommended'}]->(b);
MATCH (a:Skill {name: 'MLOps'}), (b:Skill {name: 'CI/CD'}) CREATE (a)-[:DEPENDS_ON {strength: 'recommended'}]->(b);
MATCH (a:Skill {name: 'Feature Engineering'}), (b:Skill {name: 'Pandas'}) CREATE (a)-[:DEPENDS_ON {strength: 'recommended'}]->(b);

// ============================================
// ROLE REQUIRES SKILL (REQUIRES_SKILL)
// ============================================

MATCH (r:Role {name: 'Frontend Developer'}), (s:Skill {name: 'JavaScript'}) CREATE (r)-[:REQUIRES_SKILL {importance: 'must_have', minimumLevel: 'intermediate'}]->(s);
MATCH (r:Role {name: 'Frontend Developer'}), (s:Skill {name: 'React'}) CREATE (r)-[:REQUIRES_SKILL {importance: 'must_have', minimumLevel: 'intermediate'}]->(s);
MATCH (r:Role {name: 'Frontend Developer'}), (s:Skill {name: 'HTML/CSS'}) CREATE (r)-[:REQUIRES_SKILL {importance: 'must_have', minimumLevel: 'advanced'}]->(s);
MATCH (r:Role {name: 'Frontend Developer'}), (s:Skill {name: 'TypeScript'}) CREATE (r)-[:REQUIRES_SKILL {importance: 'nice_to_have', minimumLevel: 'beginner'}]->(s);
MATCH (r:Role {name: 'Frontend Developer'}), (s:Skill {name: 'Git'}) CREATE (r)-[:REQUIRES_SKILL {importance: 'must_have', minimumLevel: 'beginner'}]->(s);

MATCH (r:Role {name: 'ML Engineer'}), (s:Skill {name: 'Python'}) CREATE (r)-[:REQUIRES_SKILL {importance: 'must_have', minimumLevel: 'advanced'}]->(s);
MATCH (r:Role {name: 'ML Engineer'}), (s:Skill {name: 'Machine Learning'}) CREATE (r)-[:REQUIRES_SKILL {importance: 'must_have', minimumLevel: 'advanced'}]->(s);
MATCH (r:Role {name: 'ML Engineer'}), (s:Skill {name: 'TensorFlow'}) CREATE (r)-[:REQUIRES_SKILL {importance: 'must_have', minimumLevel: 'intermediate'}]->(s);
MATCH (r:Role {name: 'ML Engineer'}), (s:Skill {name: 'Statistics'}) CREATE (r)-[:REQUIRES_SKILL {importance: 'must_have', minimumLevel: 'intermediate'}]->(s);
MATCH (r:Role {name: 'ML Engineer'}), (s:Skill {name: 'SQL'}) CREATE (r)-[:REQUIRES_SKILL {importance: 'nice_to_have', minimumLevel: 'intermediate'}]->(s);
MATCH (r:Role {name: 'ML Engineer'}), (s:Skill {name: 'Docker'}) CREATE (r)-[:REQUIRES_SKILL {importance: 'nice_to_have', minimumLevel: 'beginner'}]->(s);
MATCH (r:Role {name: 'ML Engineer'}), (s:Skill {name: 'Deep Learning'}) CREATE (r)-[:REQUIRES_SKILL {importance: 'must_have', minimumLevel: 'intermediate'}]->(s);

MATCH (r:Role {name: 'Full Stack Developer'}), (s:Skill {name: 'JavaScript'}) CREATE (r)-[:REQUIRES_SKILL {importance: 'must_have', minimumLevel: 'advanced'}]->(s);
MATCH (r:Role {name: 'Full Stack Developer'}), (s:Skill {name: 'React'}) CREATE (r)-[:REQUIRES_SKILL {importance: 'must_have', minimumLevel: 'intermediate'}]->(s);
MATCH (r:Role {name: 'Full Stack Developer'}), (s:Skill {name: 'Node.js'}) CREATE (r)-[:REQUIRES_SKILL {importance: 'must_have', minimumLevel: 'intermediate'}]->(s);
MATCH (r:Role {name: 'Full Stack Developer'}), (s:Skill {name: 'SQL'}) CREATE (r)-[:REQUIRES_SKILL {importance: 'must_have', minimumLevel: 'intermediate'}]->(s);
MATCH (r:Role {name: 'Full Stack Developer'}), (s:Skill {name: 'Git'}) CREATE (r)-[:REQUIRES_SKILL {importance: 'must_have', minimumLevel: 'intermediate'}]->(s);
MATCH (r:Role {name: 'Full Stack Developer'}), (s:Skill {name: 'Docker'}) CREATE (r)-[:REQUIRES_SKILL {importance: 'nice_to_have', minimumLevel: 'beginner'}]->(s);
MATCH (r:Role {name: 'Full Stack Developer'}), (s:Skill {name: 'PostgreSQL'}) CREATE (r)-[:REQUIRES_SKILL {importance: 'nice_to_have', minimumLevel: 'beginner'}]->(s);

MATCH (r:Role {name: 'Data Scientist'}), (s:Skill {name: 'Python'}) CREATE (r)-[:REQUIRES_SKILL {importance: 'must_have', minimumLevel: 'advanced'}]->(s);
MATCH (r:Role {name: 'Data Scientist'}), (s:Skill {name: 'Statistics'}) CREATE (r)-[:REQUIRES_SKILL {importance: 'must_have', minimumLevel: 'advanced'}]->(s);
MATCH (r:Role {name: 'Data Scientist'}), (s:Skill {name: 'Machine Learning'}) CREATE (r)-[:REQUIRES_SKILL {importance: 'must_have', minimumLevel: 'intermediate'}]->(s);
MATCH (r:Role {name: 'Data Scientist'}), (s:Skill {name: 'SQL'}) CREATE (r)-[:REQUIRES_SKILL {importance: 'must_have', minimumLevel: 'intermediate'}]->(s);
MATCH (r:Role {name: 'Data Scientist'}), (s:Skill {name: 'Pandas'}) CREATE (r)-[:REQUIRES_SKILL {importance: 'must_have', minimumLevel: 'intermediate'}]->(s);
MATCH (r:Role {name: 'Data Scientist'}), (s:Skill {name: 'Data Visualization'}) CREATE (r)-[:REQUIRES_SKILL {importance: 'must_have', minimumLevel: 'intermediate'}]->(s);

MATCH (r:Role {name: 'DevOps Engineer'}), (s:Skill {name: 'Docker'}) CREATE (r)-[:REQUIRES_SKILL {importance: 'must_have', minimumLevel: 'advanced'}]->(s);
MATCH (r:Role {name: 'DevOps Engineer'}), (s:Skill {name: 'Kubernetes'}) CREATE (r)-[:REQUIRES_SKILL {importance: 'must_have', minimumLevel: 'intermediate'}]->(s);
MATCH (r:Role {name: 'DevOps Engineer'}), (s:Skill {name: 'CI/CD'}) CREATE (r)-[:REQUIRES_SKILL {importance: 'must_have', minimumLevel: 'advanced'}]->(s);
MATCH (r:Role {name: 'DevOps Engineer'}), (s:Skill {name: 'Linux'}) CREATE (r)-[:REQUIRES_SKILL {importance: 'must_have', minimumLevel: 'advanced'}]->(s);
MATCH (r:Role {name: 'DevOps Engineer'}), (s:Skill {name: 'AWS'}) CREATE (r)-[:REQUIRES_SKILL {importance: 'must_have', minimumLevel: 'intermediate'}]->(s);
MATCH (r:Role {name: 'DevOps Engineer'}), (s:Skill {name: 'Git'}) CREATE (r)-[:REQUIRES_SKILL {importance: 'must_have', minimumLevel: 'advanced'}]->(s);
