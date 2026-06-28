// ============================================
// Neo4j Career Graph - Initial Paths & Relationships
// ============================================

// Add some missing foundational roles
MERGE (:Role {name: 'System Administrator', level: 'entry', industry: 'technology', demandScore: 0.70})
MERGE (:Role {name: 'Network Engineer', level: 'mid', industry: 'technology', demandScore: 0.75})
MERGE (:Role {name: 'Database Administrator', level: 'mid', industry: 'technology', demandScore: 0.78})
MERGE (:Role {name: 'IT Support Specialist', level: 'entry', industry: 'technology', demandScore: 0.80})
MERGE (:Role {name: 'Scrum Master', level: 'mid', industry: 'technology', demandScore: 0.82})
MERGE (:Role {name: 'Agile Coach', level: 'senior', industry: 'technology', demandScore: 0.85});

// Core Career Transitions
MATCH (a:Role {name: 'IT Support Specialist'}), (b:Role {name: 'System Administrator'})
MERGE (a)-[:LEADS_TO {avgTransitionMonths: 18, commonality: 0.8, difficulty: 'moderate'}]->(b);

MATCH (a:Role {name: 'System Administrator'}), (b:Role {name: 'DevOps Engineer'})
MERGE (a)-[:LEADS_TO {avgTransitionMonths: 24, commonality: 0.6, difficulty: 'hard'}]->(b);

MATCH (a:Role {name: 'Database Administrator'}), (b:Role {name: 'Data Engineer'})
MERGE (a)-[:LEADS_TO {avgTransitionMonths: 12, commonality: 0.5, difficulty: 'moderate'}]->(b);

MATCH (a:Role {name: 'Software Engineer'}), (b:Role {name: 'Scrum Master'})
MERGE (a)-[:LEADS_TO {avgTransitionMonths: 12, commonality: 0.2, difficulty: 'easy'}]->(b);

MATCH (a:Role {name: 'Scrum Master'}), (b:Role {name: 'Agile Coach'})
MERGE (a)-[:LEADS_TO {avgTransitionMonths: 24, commonality: 0.7, difficulty: 'moderate'}]->(b);

MATCH (a:Role {name: 'Data Analyst'}), (b:Role {name: 'Product Manager'})
MERGE (a)-[:LEADS_TO {avgTransitionMonths: 18, commonality: 0.3, difficulty: 'hard'}]->(b);

// Core Skills
MERGE (:Skill {name: 'Linux Administration', category: 'infrastructure', demandScore: 0.8})
MERGE (:Skill {name: 'Docker', category: 'infrastructure', demandScore: 0.9})
MERGE (:Skill {name: 'Kubernetes', category: 'infrastructure', demandScore: 0.85})
MERGE (:Skill {name: 'Agile Methodologies', category: 'management', demandScore: 0.85})
MERGE (:Skill {name: 'SQL', category: 'database', demandScore: 0.95})
MERGE (:Skill {name: 'PostgreSQL', category: 'database', demandScore: 0.90});

// Link Skills to Roles
MATCH (r:Role {name: 'System Administrator'}), (s:Skill {name: 'Linux Administration'})
MERGE (r)-[:REQUIRES {importance: 'high', proficiencyLevel: 'advanced'}]->(s);

MATCH (r:Role {name: 'DevOps Engineer'}), (s:Skill {name: 'Docker'})
MERGE (r)-[:REQUIRES {importance: 'high', proficiencyLevel: 'intermediate'}]->(s);

MATCH (r:Role {name: 'DevOps Engineer'}), (s:Skill {name: 'Kubernetes'})
MERGE (r)-[:REQUIRES {importance: 'high', proficiencyLevel: 'intermediate'}]->(s);

MATCH (r:Role {name: 'Scrum Master'}), (s:Skill {name: 'Agile Methodologies'})
MERGE (r)-[:REQUIRES {importance: 'critical', proficiencyLevel: 'advanced'}]->(s);

MATCH (r:Role {name: 'Database Administrator'}), (s:Skill {name: 'SQL'})
MERGE (r)-[:REQUIRES {importance: 'critical', proficiencyLevel: 'expert'}]->(s);
