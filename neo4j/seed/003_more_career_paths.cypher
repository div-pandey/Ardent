// ============================================
// Neo4j Career Graph - More Career Paths Expansion
// ============================================

// Expand into specific engineering domains
MERGE (:Role {name: 'Frontend Architect', level: 'senior', industry: 'technology', demandScore: 0.85})
MERGE (:Role {name: 'Backend Architect', level: 'senior', industry: 'technology', demandScore: 0.85})
MERGE (:Role {name: 'Machine Learning Architect', level: 'senior', industry: 'technology', demandScore: 0.95})
MERGE (:Role {name: 'Data Architecture Lead', level: 'lead', industry: 'technology', demandScore: 0.88})
MERGE (:Role {name: 'Security Engineer', level: 'mid', industry: 'technology', demandScore: 0.85})
MERGE (:Role {name: 'Penetration Tester', level: 'mid', industry: 'technology', demandScore: 0.80})
MERGE (:Role {name: 'CISO', level: 'executive', industry: 'technology', demandScore: 0.90})

// Expand into Product & Design
MERGE (:Role {name: 'UI Designer', level: 'mid', industry: 'design', demandScore: 0.78})
MERGE (:Role {name: 'Product Designer', level: 'senior', industry: 'design', demandScore: 0.85})
MERGE (:Role {name: 'Director of Product', level: 'director', industry: 'technology', demandScore: 0.85})
MERGE (:Role {name: 'Growth Hacker', level: 'mid', industry: 'marketing', demandScore: 0.75})
MERGE (:Role {name: 'Technical Writer', level: 'mid', industry: 'technology', demandScore: 0.65})

// Transitions
MATCH (a:Role {name: 'Frontend Developer'}), (b:Role {name: 'Frontend Architect'})
MERGE (a)-[:LEADS_TO {avgTransitionMonths: 48, commonality: 0.4, difficulty: 'hard'}]->(b);

MATCH (a:Role {name: 'Backend Developer'}), (b:Role {name: 'Backend Architect'})
MERGE (a)-[:LEADS_TO {avgTransitionMonths: 48, commonality: 0.4, difficulty: 'hard'}]->(b);

MATCH (a:Role {name: 'ML Engineer'}), (b:Role {name: 'Machine Learning Architect'})
MERGE (a)-[:LEADS_TO {avgTransitionMonths: 36, commonality: 0.3, difficulty: 'expert'}]->(b);

MATCH (a:Role {name: 'Software Engineer'}), (b:Role {name: 'Security Engineer'})
MERGE (a)-[:LEADS_TO {avgTransitionMonths: 18, commonality: 0.2, difficulty: 'hard'}]->(b);

MATCH (a:Role {name: 'Security Engineer'}), (b:Role {name: 'Penetration Tester'})
MERGE (a)-[:LEADS_TO {avgTransitionMonths: 12, commonality: 0.5, difficulty: 'moderate'}]->(b);

MATCH (a:Role {name: 'Cybersecurity Analyst'}), (b:Role {name: 'CISO'})
MERGE (a)-[:LEADS_TO {avgTransitionMonths: 96, commonality: 0.1, difficulty: 'expert'}]->(b);

MATCH (a:Role {name: 'UX Designer'}), (b:Role {name: 'Product Designer'})
MERGE (a)-[:LEADS_TO {avgTransitionMonths: 24, commonality: 0.8, difficulty: 'moderate'}]->(b);

MATCH (a:Role {name: 'UI Designer'}), (b:Role {name: 'Product Designer'})
MERGE (a)-[:LEADS_TO {avgTransitionMonths: 24, commonality: 0.6, difficulty: 'moderate'}]->(b);

MATCH (a:Role {name: 'Product Manager'}), (b:Role {name: 'Director of Product'})
MERGE (a)-[:LEADS_TO {avgTransitionMonths: 60, commonality: 0.3, difficulty: 'hard'}]->(b);

MATCH (a:Role {name: 'Software Engineer'}), (b:Role {name: 'Technical Writer'})
MERGE (a)-[:LEADS_TO {avgTransitionMonths: 6, commonality: 0.1, difficulty: 'easy'}]->(b);

// Additional Skills
MERGE (:Skill {name: 'System Design', category: 'architecture', demandScore: 0.95})
MERGE (:Skill {name: 'Figma', category: 'design', demandScore: 0.90})
MERGE (:Skill {name: 'Cybersecurity Principles', category: 'security', demandScore: 0.85})
MERGE (:Skill {name: 'Technical Writing', category: 'soft_skill', demandScore: 0.70});

// Link Skills
MATCH (r:Role {name: 'Frontend Architect'}), (s:Skill {name: 'System Design'})
MERGE (r)-[:REQUIRES {importance: 'critical', proficiencyLevel: 'expert'}]->(s);

MATCH (r:Role {name: 'Backend Architect'}), (s:Skill {name: 'System Design'})
MERGE (r)-[:REQUIRES {importance: 'critical', proficiencyLevel: 'expert'}]->(s);

MATCH (r:Role {name: 'Product Designer'}), (s:Skill {name: 'Figma'})
MERGE (r)-[:REQUIRES {importance: 'critical', proficiencyLevel: 'expert'}]->(s);

MATCH (r:Role {name: 'Security Engineer'}), (s:Skill {name: 'Cybersecurity Principles'})
MERGE (r)-[:REQUIRES {importance: 'critical', proficiencyLevel: 'advanced'}]->(s);
