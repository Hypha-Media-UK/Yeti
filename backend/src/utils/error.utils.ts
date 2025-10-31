/**
 * Error handling utilities for PostgreSQL/Supabase
 */

/**
 * Check if error is a unique constraint violation (duplicate entry)
 * PostgreSQL error code: 23505
 * 
 * @param error - Error object from database operation
 * @returns true if error is a duplicate key violation
 */
export function isDuplicateError(error: any): boolean {
  return error?.code === '23505';
}

/**
 * Check if error is a not found error
 * Supabase/PostgREST error code: PGRST116
 * 
 * @param error - Error object from Supabase query
 * @returns true if no rows were returned
 */
export function isNotFoundError(error: any): boolean {
  return error?.code === 'PGRST116';
}

/**
 * Check if error is a foreign key violation
 * PostgreSQL error code: 23503
 * 
 * @param error - Error object from database operation
 * @returns true if error is a foreign key constraint violation
 */
export function isForeignKeyError(error: any): boolean {
  return error?.code === '23503';
}

/**
 * Get a user-friendly error message for database errors
 * 
 * @param error - Error object from database operation
 * @param entityName - Name of the entity (e.g., "building", "staff member")
 * @returns User-friendly error message
 */
export function getDatabaseErrorMessage(error: any, entityName: string): string {
  if (isDuplicateError(error)) {
    return `A ${entityName} with this name already exists`;
  }
  
  if (isForeignKeyError(error)) {
    return `Cannot delete ${entityName} because it is referenced by other records`;
  }
  
  return `Failed to process ${entityName}`;
}

