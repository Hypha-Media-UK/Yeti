/**
 * Generic mapper utilities for converting database rows to domain objects
 * 
 * This module provides reusable functions for mapping snake_case database fields
 * to camelCase domain object properties. This eliminates duplication across
 * all repository classes.
 */

/**
 * Map a single database row from snake_case to camelCase
 * 
 * @param row - Database row with snake_case fields
 * @param fieldMap - Mapping of camelCase keys to snake_case database columns
 * @returns Mapped domain object
 * 
 * @example
 * const FIELD_MAP = {
 *   id: 'id',
 *   firstName: 'first_name',
 *   lastName: 'last_name',
 *   isActive: 'is_active',
 * };
 * 
 * const user = mapSnakeToCamel<User>(row, FIELD_MAP);
 */
export function mapSnakeToCamel<T>(row: any, fieldMap: Record<string, string>): T {
  if (!row) {
    throw new Error('Cannot map null or undefined row');
  }

  const result: any = {};
  
  for (const [camelKey, snakeKey] of Object.entries(fieldMap)) {
    // Handle nested properties (e.g., 'shifts.name')
    if (snakeKey.includes('.')) {
      const parts = snakeKey.split('.');
      let value = row;
      for (const part of parts) {
        value = value?.[part];
        if (value === undefined) break;
      }
      result[camelKey] = value;
    } else {
      result[camelKey] = row[snakeKey];
    }
  }
  
  return result as T;
}

/**
 * Map an array of database rows to domain objects
 * 
 * @param rows - Array of database rows with snake_case fields
 * @param fieldMap - Mapping of camelCase keys to snake_case database columns
 * @returns Array of mapped domain objects
 * 
 * @example
 * const users = mapRowsSnakeToCamel<User>(rows, FIELD_MAP);
 */
export function mapRowsSnakeToCamel<T>(rows: any[], fieldMap: Record<string, string>): T[] {
  if (!rows || !Array.isArray(rows)) {
    return [];
  }
  
  return rows.map(row => mapSnakeToCamel<T>(row, fieldMap));
}

/**
 * Map a domain object from camelCase to snake_case for database operations
 * 
 * This is the inverse of mapSnakeToCamel, used for INSERT and UPDATE operations.
 * 
 * @param obj - Domain object with camelCase properties
 * @param fieldMap - Mapping of camelCase keys to snake_case database columns
 * @param includeUndefined - Whether to include undefined values (default: false)
 * @returns Database row object with snake_case fields
 * 
 * @example
 * const FIELD_MAP = {
 *   firstName: 'first_name',
 *   lastName: 'last_name',
 *   isActive: 'is_active',
 * };
 * 
 * const dbRow = mapCamelToSnake({ firstName: 'John', lastName: 'Doe' }, FIELD_MAP);
 * // Returns: { first_name: 'John', last_name: 'Doe' }
 */
export function mapCamelToSnake(
  obj: any,
  fieldMap: Record<string, string>,
  includeUndefined = false
): any {
  if (!obj) {
    return {};
  }

  const result: any = {};
  
  for (const [camelKey, snakeKey] of Object.entries(fieldMap)) {
    const value = obj[camelKey];
    
    // Skip undefined values unless explicitly requested
    if (value === undefined && !includeUndefined) {
      continue;
    }
    
    result[snakeKey] = value;
  }
  
  return result;
}

/**
 * Create a partial field map for update operations
 * 
 * This helper creates a field map containing only the fields present in the updates object.
 * Useful for UPDATE operations where you only want to update specific fields.
 * 
 * @param updates - Partial domain object with fields to update
 * @param fullFieldMap - Complete field mapping
 * @returns Filtered field map containing only fields present in updates
 * 
 * @example
 * const updates = { firstName: 'Jane' };
 * const partialMap = createPartialFieldMap(updates, FULL_FIELD_MAP);
 * const dbUpdates = mapCamelToSnake(updates, partialMap);
 */
export function createPartialFieldMap(
  updates: any,
  fullFieldMap: Record<string, string>
): Record<string, string> {
  const partialMap: Record<string, string> = {};
  
  for (const [camelKey, snakeKey] of Object.entries(fullFieldMap)) {
    if (camelKey in updates) {
      partialMap[camelKey] = snakeKey;
    }
  }
  
  return partialMap;
}

