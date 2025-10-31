import { SupabaseClient } from '@supabase/supabase-js';
import { supabase } from '../config/database';
import { isNotFoundError } from '../utils/error.utils';

/**
 * Base repository class providing common CRUD operations
 * Eliminates code duplication across all repositories
 * 
 * @template TEntity - The domain entity type (e.g., Building, Staff)
 * @template TRow - The database row type (snake_case fields)
 * @template TCreateInput - Input type for creating entities
 * @template TUpdateInput - Input type for updating entities
 */
export abstract class BaseRepository<
  TEntity,
  TRow,
  TCreateInput = Partial<TEntity>,
  TUpdateInput = Partial<TEntity>
> {
  protected readonly client: SupabaseClient;
  protected abstract readonly tableName: string;

  constructor(client: SupabaseClient = supabase) {
    this.client = client;
  }

  /**
   * Map database row to domain entity
   * Must be implemented by each repository
   */
  protected abstract mapRowToEntity(row: TRow): TEntity;

  /**
   * Map domain entity to database row for insert
   * Must be implemented by each repository
   */
  protected abstract mapEntityToInsertRow(input: TCreateInput): Partial<TRow>;

  /**
   * Map domain entity to database row for update
   * Must be implemented by each repository
   */
  protected abstract mapEntityToUpdateRow(input: TUpdateInput): Partial<TRow>;

  /**
   * Find all entities with optional filtering
   * Override this method to add custom filtering logic
   */
  async findAll(filters?: Record<string, any>): Promise<TEntity[]> {
    let query = this.client
      .from(this.tableName)
      .select('*');

    // Apply is_active filter by default (can be overridden)
    if (filters?.includeInactive !== true) {
      query = query.eq('is_active', true);
    }

    // Apply custom filters
    if (filters) {
      query = this.applyFilters(query, filters);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to find ${this.tableName}: ${error.message}`);
    }

    return (data || []).map(row => this.mapRowToEntity(row as TRow));
  }

  /**
   * Apply custom filters to query
   * Override this method to add repository-specific filtering
   */
  protected applyFilters(query: any, filters: Record<string, any>): any {
    // Default implementation - can be overridden
    return query;
  }

  /**
   * Find entity by ID
   */
  async findById(id: number): Promise<TEntity | null> {
    const { data, error } = await this.client
      .from(this.tableName)
      .select('*')
      .eq('id', id)
      .eq('is_active', true)
      .single();

    if (error) {
      if (isNotFoundError(error)) {
        return null;
      }
      throw new Error(`Failed to find ${this.tableName} by id: ${error.message}`);
    }

    return data ? this.mapRowToEntity(data as TRow) : null;
  }

  /**
   * Create a new entity
   */
  async create(input: TCreateInput): Promise<TEntity> {
    const insertData = this.mapEntityToInsertRow(input);

    const { data, error } = await this.client
      .from(this.tableName)
      .insert(insertData)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create ${this.tableName}: ${error.message}`);
    }

    return this.mapRowToEntity(data as TRow);
  }

  /**
   * Update an existing entity
   */
  async update(id: number, input: TUpdateInput): Promise<TEntity | null> {
    const updateData = this.mapEntityToUpdateRow(input);

    // If no fields to update, return current entity
    if (Object.keys(updateData).length === 0) {
      return this.findById(id);
    }

    const { data, error } = await this.client
      .from(this.tableName)
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (isNotFoundError(error)) {
        return null;
      }
      throw new Error(`Failed to update ${this.tableName}: ${error.message}`);
    }

    return data ? this.mapRowToEntity(data as TRow) : null;
  }

  /**
   * Soft delete an entity (set is_active = false)
   */
  async delete(id: number): Promise<boolean> {
    const { error } = await this.client
      .from(this.tableName)
      .update({ is_active: false })
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to delete ${this.tableName}: ${error.message}`);
    }

    return true;
  }

  /**
   * Hard delete an entity (permanently remove from database)
   * Use with caution - prefer soft delete
   */
  async hardDelete(id: number): Promise<boolean> {
    const { error } = await this.client
      .from(this.tableName)
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to hard delete ${this.tableName}: ${error.message}`);
    }

    return true;
  }

  /**
   * Count entities with optional filtering
   */
  async count(filters?: Record<string, any>): Promise<number> {
    let query = this.client
      .from(this.tableName)
      .select('*', { count: 'exact', head: true });

    if (filters?.includeInactive !== true) {
      query = query.eq('is_active', true);
    }

    if (filters) {
      query = this.applyFilters(query, filters);
    }

    const { count, error } = await query;

    if (error) {
      throw new Error(`Failed to count ${this.tableName}: ${error.message}`);
    }

    return count || 0;
  }

  /**
   * Check if entity exists by ID
   */
  async exists(id: number): Promise<boolean> {
    const entity = await this.findById(id);
    return entity !== null;
  }
}

