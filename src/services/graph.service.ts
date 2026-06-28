/**
 * Graph Service
 * Handles all Neo4j graph operations for the Career Intelligence Graph.
 */

import { readQuery, writeQuery } from '@/lib/neo4j/driver';
import type {
  GraphNode,
  GraphEdge,
  CareerGraph,
  SkillGapResult,
  SkillRecommendation,
  CareerPathRoute,
} from '@/types/graph.types';

/**
 * Build a user's career graph from Neo4j.
 */
export async function getUserGraph(userId: string): Promise<CareerGraph> {
  const cypher = `
    MATCH (u:User {userId: $userId})-[r]-(n)
    OPTIONAL MATCH (n)-[r2]-(m)
    WHERE m IS NULL OR NOT m:User
    RETURN u, r, n, r2, m
  `;

  const records = await readQuery<Record<string, unknown>>(cypher, { userId });

  const nodesMap = new Map<string, GraphNode>();
  const edgesMap = new Map<string, GraphEdge>();

  for (const record of records) {
    // Process nodes and relationships from Neo4j records
    processRecord(record, nodesMap, edgesMap);
  }

  // Second pass: Update node types based on relationships
  for (const edge of edgesMap.values()) {
    if (edge.type === 'TARGETS_ROLE') {
      const targetNode = nodesMap.get(edge.target);
      if (targetNode && targetNode.type === 'role') {
        targetNode.type = 'role_target';
      }
    }
  }

  return {
    nodes: Array.from(nodesMap.values()),
    edges: Array.from(edgesMap.values()),
  };
}

/**
 * Sync user skills to Neo4j graph.
 */
export async function syncUserSkills(
  userId: string,
  skills: { name: string; proficiency: string; category: string }[]
): Promise<void> {
  // First ensure user node exists
  await writeQuery(
    `MERGE (u:User {userId: $userId}) RETURN u`,
    { userId }
  );

  // Sync each skill
  for (const skill of skills) {
    await writeQuery(
      `
      MATCH (u:User {userId: $userId})
      MERGE (s:Skill {name: $skillName})
      ON CREATE SET s.category = $category
      MERGE (u)-[r:HAS_SKILL]->(s)
      SET r.proficiency = $proficiency, r.updatedAt = timestamp()
      `,
      {
        userId,
        skillName: skill.name,
        proficiency: skill.proficiency,
        category: skill.category,
      }
    );
  }
}

/**
 * Set user's current and target role in the graph.
 */
export async function setUserRoles(
  userId: string,
  currentRole: string,
  targetRole: string
): Promise<void> {
  await writeQuery(
    `
    MERGE (u:User {userId: $userId})
    WITH u
    OPTIONAL MATCH (u)-[rc:CURRENTLY_IN]->()
    DELETE rc
    WITH u
    OPTIONAL MATCH (u)-[rt:TARGETS_ROLE]->()
    DELETE rt
    WITH u
    OPTIONAL MATCH (existingCr:Role) WHERE toLower(existingCr.name) = toLower($currentRole)
    OPTIONAL MATCH (existingTr:Role) WHERE toLower(existingTr.name) = toLower($targetRole)
    WITH u, 
         COALESCE(existingCr.name, $currentRole) AS finalCrName,
         COALESCE(existingTr.name, $targetRole) AS finalTrName
    MERGE (cr:Role {name: finalCrName})
    MERGE (tr:Role {name: finalTrName})
    MERGE (u)-[:CURRENTLY_IN]->(cr)
    MERGE (u)-[:TARGETS_ROLE]->(tr)
    `,
    { userId, currentRole, targetRole }
  );
}

/**
 * Find career paths between two roles using graph traversal.
 */
export async function findCareerPaths(
  userId: string,
  currentRole: string,
  targetRole: string,
  maxDepth: number = 5
): Promise<CareerPathRoute[]> {
  const cypher = `
    // 1. Find all paths between current and target
    MATCH path = (start:Role)-[:LEADS_TO*1..${maxDepth}]->(end:Role)
    WHERE toLower(start.name) = toLower($currentRole) AND toLower(end.name) = toLower($targetRole)
    
    // 2. Identify the immediate next role in the path to calculate readiness for it
    WITH path, 
         nodes(path) AS pathNodes,
         [node IN nodes(path) | node.name] AS roleNames,
         reduce(months = 0, r IN relationships(path) | months + COALESCE(r.avgTransitionMonths, 12)) AS totalMonths,
         reduce(diff = 'easy', r IN relationships(path) | 
           CASE WHEN r.difficulty = 'hard' OR diff = 'hard' THEN 'hard'
                WHEN r.difficulty = 'moderate' OR diff = 'moderate' THEN 'moderate'
                ELSE 'easy' END
         ) AS difficulty
    
    // The next role is either the target itself (direct) or the first intermediate
    WITH path, pathNodes, roleNames, totalMonths, difficulty,
         pathNodes[1] AS nextRole
         
    // 3. Get User's skills
    OPTIONAL MATCH (u:User {userId: $userId})-[:HAS_SKILL]->(userSkill:Skill)
    WITH path, roleNames, totalMonths, difficulty, nextRole, collect(userSkill.name) AS userSkills
    
    // 4. Get Required Skills for the NEXT role
    OPTIONAL MATCH (nextRole)-[:REQUIRES_SKILL]->(reqSkill:Skill)
    WITH path, roleNames, totalMonths, difficulty, nextRole, userSkills, collect(reqSkill.name) AS requiredSkills
    
    // 5. Calculate Overlap and Missing Skills
    WITH path, roleNames, totalMonths, difficulty,
         size(requiredSkills) AS totalReq,
         size([s IN requiredSkills WHERE s IN userSkills]) AS acquiredReq,
         [s IN requiredSkills WHERE NOT s IN userSkills][0..3] AS keyNewSkills
         
    RETURN roleNames, totalMonths, difficulty, 
           CASE WHEN totalReq > 0 THEN toInteger(round((toFloat(acquiredReq) / totalReq) * 100)) ELSE 0 END AS skillOverlapPercent,
           keyNewSkills
    ORDER BY totalMonths ASC
    LIMIT 5
  `;

  const records = await readQuery<{
    roleNames: string[];
    totalMonths: { low: number } | number;
    difficulty: string;
    skillOverlapPercent: { low: number } | number;
    keyNewSkills: string[];
  }>(cypher, { userId, currentRole, targetRole });

  return records.map((record, index) => ({
    name: `Route ${index + 1}: ${record.roleNames.slice(1, -1).join(' → ') || 'Direct'}`,
    steps: record.roleNames,
    totalMonths: typeof record.totalMonths === 'object' ? record.totalMonths.low : Number(record.totalMonths),
    difficulty: record.difficulty as 'Easy' | 'Moderate' | 'Hard',
    skillOverlap: typeof record.skillOverlapPercent === 'object' ? record.skillOverlapPercent.low : Number(record.skillOverlapPercent),
    keyNewSkills: record.keyNewSkills || [],
    recommended: index === 0,
  }));
}

/**
 * Analyze skill gaps between user's skills and a target role.
 */
export async function analyzeSkillGap(
  userId: string,
  targetRole: string
): Promise<SkillGapResult> {
  const cypher = `
    MATCH (u:User {userId: $userId})-[:HAS_SKILL]->(userSkill:Skill)
    WITH collect(userSkill.name) AS userSkills
    
    MATCH (target:Role)-[req:REQUIRES_SKILL]->(required:Skill)
    WHERE toLower(target.name) = toLower($targetRole)
    
    WITH userSkills, 
         collect({
           name: required.name, 
           category: required.category,
           difficulty: required.difficulty,
           estimatedHours: required.estimatedHours,
           importance: req.importance
         }) AS requiredSkills
    
    RETURN userSkills, requiredSkills
  `;

  const records = await readQuery<{
    userSkills: string[];
    requiredSkills: {
      name: string;
      category: string;
      difficulty: string;
      estimatedHours: number;
      importance: string;
    }[];
  }>(cypher, { userId, targetRole });

  if (records.length === 0) {
    return {
      readinessScore: 0,
      totalRequired: 0,
      acquiredCount: 0,
      matchingSkills: [],
      missingSkills: [],
      transferableSkills: [],
    };
  }

  const { userSkills, requiredSkills } = records[0];
  const userSkillSet = new Set(userSkills);

  const matchingSkills = requiredSkills
    .filter((s) => userSkillSet.has(s.name))
    .map((s) => ({ name: s.name, category: s.category }));

  const missingSkills = requiredSkills
    .filter((s) => !userSkillSet.has(s.name))
    .map((s) => ({
      name: s.name,
      category: s.category,
      difficulty: s.difficulty || 'intermediate',
      estimatedHours: s.estimatedHours || 40,
      importance: s.importance || 'must_have',
      prerequisites: [],
      prerequisitesMet: true,
      priorityScore: s.importance === 'must_have' ? 10 : s.importance === 'nice_to_have' ? 5 : 2,
    }));

  const totalRequired = requiredSkills.length;
  const acquiredCount = matchingSkills.length;
  const readinessScore = totalRequired > 0 ? Math.round((acquiredCount / totalRequired) * 100) : 0;

  return {
    readinessScore,
    totalRequired,
    acquiredCount,
    matchingSkills,
    missingSkills,
    transferableSkills: [],
  };
}

/**
 * Get skill recommendations ordered by relevance to a target role.
 */
export async function getSkillRecommendations(
  userId: string,
  targetRole: string,
  limit: number = 10
): Promise<SkillRecommendation[]> {
  const cypher = `
    MATCH (target:Role)-[req:REQUIRES_SKILL]->(skill:Skill)
    WHERE toLower(target.name) = toLower($targetRole)
    AND NOT EXISTS {
      MATCH (u:User {userId: $userId})-[:HAS_SKILL]->(skill)
    }
    OPTIONAL MATCH (skill)<-[:DEPENDS_ON]-(dependent:Skill)
    WITH skill, req, count(dependent) AS dependentCount
    RETURN skill.name AS name,
           skill.category AS category,
           skill.difficulty AS difficulty,
           skill.estimatedHours AS estimatedHours,
           req.importance AS importance,
           (CASE req.importance WHEN 'must_have' THEN 10 WHEN 'nice_to_have' THEN 5 ELSE 2 END) + dependentCount AS relevanceScore
    ORDER BY relevanceScore DESC
    LIMIT $limit
  `;

  return readQuery<SkillRecommendation>(cypher, { userId, targetRole, limit });
}

// Helper to sanitize Neo4j Integers into plain JS numbers
function sanitizeNeo4jProperties(properties: any): any {
  if (properties === null || properties === undefined) return properties;
  
  if (typeof properties === 'object') {
    // If it's a Neo4j Integer
    if ('low' in properties && 'high' in properties) {
      return Number(properties.low);
    }
    
    // Arrays
    if (Array.isArray(properties)) {
      return properties.map(sanitizeNeo4jProperties);
    }
    
    // Objects
    const sanitized: Record<string, any> = {};
    for (const [key, val] of Object.entries(properties)) {
      sanitized[key] = sanitizeNeo4jProperties(val);
    }
    return sanitized;
  }
  
  return properties;
}

// Helper to process Neo4j records into nodes and edges
function processRecord(
  record: Record<string, unknown>,
  nodesMap: Map<string, GraphNode>,
  edgesMap: Map<string, GraphEdge>
): void {
  for (const [, value] of Object.entries(record)) {
    if (!value || typeof value !== 'object') continue;
    
    const obj = value as any;
    
    if ('labels' in obj && 'properties' in obj) {
      // It's a Node
      const id = String(obj.elementId ?? obj.identity?.low ?? obj.identity);
      if (!nodesMap.has(id)) {
        nodesMap.set(id, {
          id,
          label: obj.labels[0] === 'User' ? 'Me' : String(obj.properties.name || obj.properties.title || obj.properties.userId || 'Unknown'),
          type: mapLabelToType(obj.labels[0] || 'skill'),
          properties: sanitizeNeo4jProperties(obj.properties || {}),
        });
      }
    } else if ('type' in obj && ('start' in obj || 'startNodeElementId' in obj) && ('end' in obj || 'endNodeElementId' in obj)) {
      // It's a Relationship
      const id = String(obj.elementId ?? obj.identity?.low ?? obj.identity);
      if (!edgesMap.has(id)) {
        edgesMap.set(id, {
          id,
          source: String(obj.startNodeElementId ?? obj.start?.low ?? obj.start),
          target: String(obj.endNodeElementId ?? obj.end?.low ?? obj.end),
          type: String(obj.type) as GraphEdge['type'],
          properties: sanitizeNeo4jProperties(obj.properties || {}),
        });
      }
    }
  }
}

function mapLabelToType(label: string): GraphNode['type'] {
  const map: Record<string, GraphNode['type']> = {
    User: 'user',
    Skill: 'skill',
    Role: 'role',
    Technology: 'technology',
    Certification: 'certification',
    Project: 'project',
    LearningPath: 'learning_path',
  };
  return map[label] || 'skill';
}
