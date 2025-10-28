import { createClient, SupabaseClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

// Supabase Configuration
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('Missing Supabase configuration. Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

// Create Supabase client with service role key (bypasses RLS)
export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

/**
 * Test Supabase connection
 */
export async function testConnection(): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('config')
      .select('key, value')
      .limit(1);

    if (error) {
      console.error('Supabase connection test failed:', error.message);
      return false;
    }

    console.log('Supabase connection established successfully');
    return true;
  } catch (error) {
    console.error('Supabase connection failed:', error);
    return false;
  }
}

/**
 * Execute raw SQL query (for complex queries not supported by Supabase client)
 * Uses Supabase's RPC function
 */
export async function executeRawSQL(query: string, params: any[] = []): Promise<any> {
  try {
    // Note: You'll need to create a PostgreSQL function in Supabase for this
    // For now, use Supabase client methods instead of raw SQL
    throw new Error('Raw SQL execution not implemented. Use Supabase client methods instead.');
  } catch (error) {
    console.error('SQL execution failed:', error);
    throw error;
  }
}

/**
 * Helper function to convert Supabase response to array
 */
export function toArray<T>(data: T | T[] | null): T[] {
  if (!data) return [];
  return Array.isArray(data) ? data : [data];
}

/**
 * Helper function to handle Supabase errors
 */
export function handleSupabaseError(error: any, context: string): never {
  console.error(`${context}:`, error);
  throw new Error(`${context}: ${error.message || 'Unknown error'}`);
}

/**
 * Type-safe query builder helper
 */
export class QueryBuilder<T> {
  private tableName: string;
  private selectColumns: string = '*';
  private whereConditions: Array<{ column: string; operator: string; value: any }> = [];
  private orderByColumn?: string;
  private orderDirection: 'asc' | 'desc' = 'asc';
  private limitValue?: number;

  constructor(tableName: string) {
    this.tableName = tableName;
  }

  select(columns: string = '*'): this {
    this.selectColumns = columns;
    return this;
  }

  where(column: string, operator: string, value: any): this {
    this.whereConditions.push({ column, operator, value });
    return this;
  }

  orderBy(column: string, direction: 'asc' | 'desc' = 'asc'): this {
    this.orderByColumn = column;
    this.orderDirection = direction;
    return this;
  }

  limit(value: number): this {
    this.limitValue = value;
    return this;
  }

  async execute(): Promise<T[]> {
    let query = supabase.from(this.tableName).select(this.selectColumns);

    // Apply where conditions
    for (const condition of this.whereConditions) {
      const { column, operator, value } = condition;
      
      switch (operator) {
        case '=':
          query = query.eq(column, value);
          break;
        case '!=':
          query = query.neq(column, value);
          break;
        case '>':
          query = query.gt(column, value);
          break;
        case '>=':
          query = query.gte(column, value);
          break;
        case '<':
          query = query.lt(column, value);
          break;
        case '<=':
          query = query.lte(column, value);
          break;
        case 'LIKE':
          query = query.like(column, value);
          break;
        case 'IN':
          query = query.in(column, value);
          break;
        case 'IS NULL':
          query = query.is(column, null);
          break;
        case 'IS NOT NULL':
          query = query.not(column, 'is', null);
          break;
        default:
          throw new Error(`Unsupported operator: ${operator}`);
      }
    }

    // Apply order by
    if (this.orderByColumn) {
      query = query.order(this.orderByColumn, { ascending: this.orderDirection === 'asc' });
    }

    // Apply limit
    if (this.limitValue) {
      query = query.limit(this.limitValue);
    }

    const { data, error } = await query;

    if (error) {
      handleSupabaseError(error, `Query failed for table ${this.tableName}`);
    }

    return toArray(data as T[]);
  }

  async executeSingle(): Promise<T | null> {
    const results = await this.limit(1).execute();
    return results.length > 0 ? results[0] : null;
  }
}

/**
 * Create a new query builder for a table
 */
export function query<T>(tableName: string): QueryBuilder<T> {
  return new QueryBuilder<T>(tableName);
}

/**
 * Insert a record
 */
export async function insert<T>(tableName: string, data: Partial<T>): Promise<T> {
  const { data: result, error } = await supabase
    .from(tableName)
    .insert(data as any)
    .select()
    .single();

  if (error) {
    handleSupabaseError(error, `Insert failed for table ${tableName}`);
  }

  return result as T;
}

/**
 * Update a record
 */
export async function update<T>(
  tableName: string,
  id: number,
  data: Partial<T>
): Promise<T> {
  const { data: result, error } = await supabase
    .from(tableName)
    .update(data as any)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    handleSupabaseError(error, `Update failed for table ${tableName}`);
  }

  return result as T;
}

/**
 * Delete a record
 */
export async function deleteRecord(tableName: string, id: number): Promise<void> {
  const { error } = await supabase
    .from(tableName)
    .delete()
    .eq('id', id);

  if (error) {
    handleSupabaseError(error, `Delete failed for table ${tableName}`);
  }
}

/**
 * Find a record by ID
 */
export async function findById<T>(tableName: string, id: number): Promise<T | null> {
  const { data, error } = await supabase
    .from(tableName)
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // No rows returned
      return null;
    }
    handleSupabaseError(error, `Find by ID failed for table ${tableName}`);
  }

  return data as T;
}

/**
 * Find all records
 */
export async function findAll<T>(tableName: string): Promise<T[]> {
  const { data, error } = await supabase
    .from(tableName)
    .select('*');

  if (error) {
    handleSupabaseError(error, `Find all failed for table ${tableName}`);
  }

  return toArray(data as T[]);
}

/**
 * Count records
 */
export async function count(tableName: string, whereColumn?: string, whereValue?: any): Promise<number> {
  let query = supabase
    .from(tableName)
    .select('*', { count: 'exact', head: true });

  if (whereColumn && whereValue !== undefined) {
    query = query.eq(whereColumn, whereValue);
  }

  const { count: result, error } = await query;

  if (error) {
    handleSupabaseError(error, `Count failed for table ${tableName}`);
  }

  return result || 0;
}

// Export for backward compatibility with MySQL pool pattern
export const pool = {
  query: async (sql: string, params?: any[]) => {
    throw new Error('Direct SQL queries not supported with Supabase. Use Supabase client methods instead.');
  },
  getConnection: async () => {
    throw new Error('Connection pooling not applicable with Supabase. Use Supabase client instead.');
  }
};

