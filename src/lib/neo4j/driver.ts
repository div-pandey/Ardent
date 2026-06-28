import neo4j, { Driver } from 'neo4j-driver';

declare global {
  var _neo4jDriver: Driver | undefined;
}

export function getDriver(): Driver {
  if (!globalThis._neo4jDriver) {
    const uri = process.env.NEO4J_URI;
    const user = process.env.NEO4J_USERNAME;
    const password = process.env.NEO4J_PASSWORD;

    if (!uri || !user || !password) {
      throw new Error(
        'Neo4j connection details not configured. Set NEO4J_URI, NEO4J_USERNAME, and NEO4J_PASSWORD environment variables.'
      );
    }

    globalThis._neo4jDriver = neo4j.driver(uri, neo4j.auth.basic(user, password), {
      maxConnectionPoolSize: 50,
      connectionTimeout: 10000,
      connectionAcquisitionTimeout: 10000,
      maxConnectionLifetime: 3 * 60 * 1000, // 3 minutes to prevent Aura drops
      maxTransactionRetryTime: 30000,
      logging: {
        level: 'warn',
        logger: (level, message) => {
          // Silence verbose session expired warnings as they are auto-retried
          if (message.includes('SessionExpired')) return;
          console.log(`[Neo4j ${level}] ${message}`);
        },
      },
    });
  }

  return globalThis._neo4jDriver;
}

export async function closeDriver(): Promise<void> {
  if (globalThis._neo4jDriver) {
    await globalThis._neo4jDriver.close();
    globalThis._neo4jDriver = undefined;
  }
}

/**
 * Execute a read-only Cypher query and return the records.
 */
export async function readQuery<T>(
  cypher: string,
  params: Record<string, unknown> = {}
): Promise<T[]> {
  const session = getDriver().session({ defaultAccessMode: neo4j.session.READ });
  try {
    const result = await session.run(cypher, params);
    return result.records.map((record) => record.toObject() as T);
  } finally {
    await session.close();
  }
}

/**
 * Execute a write Cypher query and return the records.
 */
export async function writeQuery<T>(
  cypher: string,
  params: Record<string, unknown> = {}
): Promise<T[]> {
  const session = getDriver().session({ defaultAccessMode: neo4j.session.WRITE });
  try {
    const result = await session.run(cypher, params);
    return result.records.map((record) => record.toObject() as T);
  } finally {
    await session.close();
  }
}
