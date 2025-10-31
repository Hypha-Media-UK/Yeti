import { describe, it, expect } from 'vitest';
import {
  mapSnakeToCamel,
  mapRowsSnakeToCamel,
  mapCamelToSnake,
  createPartialFieldMap,
} from '../mapper.utils';

describe('mapper.utils', () => {
  describe('mapSnakeToCamel', () => {
    it('should map snake_case fields to camelCase', () => {
      const row = {
        id: 1,
        first_name: 'John',
        last_name: 'Doe',
        is_active: true,
        created_at: '2024-01-01',
      };

      const fieldMap = {
        id: 'id',
        firstName: 'first_name',
        lastName: 'last_name',
        isActive: 'is_active',
        createdAt: 'created_at',
      };

      const result = mapSnakeToCamel(row, fieldMap);

      expect(result).toEqual({
        id: 1,
        firstName: 'John',
        lastName: 'Doe',
        isActive: true,
        createdAt: '2024-01-01',
      });
    });

    it('should handle null values', () => {
      const row = {
        id: 1,
        description: null,
      };

      const fieldMap = {
        id: 'id',
        description: 'description',
      };

      const result = mapSnakeToCamel(row, fieldMap);

      expect(result).toEqual({
        id: 1,
        description: null,
      });
    });

    it('should throw error for null row', () => {
      const fieldMap = { id: 'id' };
      expect(() => mapSnakeToCamel(null, fieldMap)).toThrow('Cannot map null or undefined row');
    });

    it('should throw error for undefined row', () => {
      const fieldMap = { id: 'id' };
      expect(() => mapSnakeToCamel(undefined, fieldMap)).toThrow('Cannot map null or undefined row');
    });

    it('should handle missing fields gracefully', () => {
      const row = {
        id: 1,
        first_name: 'John',
      };

      const fieldMap = {
        id: 'id',
        firstName: 'first_name',
        lastName: 'last_name', // Missing in row
      };

      const result = mapSnakeToCamel(row, fieldMap);

      expect(result).toEqual({
        id: 1,
        firstName: 'John',
        lastName: undefined,
      });
    });
  });

  describe('mapRowsSnakeToCamel', () => {
    it('should map array of rows', () => {
      const rows = [
        { id: 1, first_name: 'John', last_name: 'Doe' },
        { id: 2, first_name: 'Jane', last_name: 'Smith' },
      ];

      const fieldMap = {
        id: 'id',
        firstName: 'first_name',
        lastName: 'last_name',
      };

      const result = mapRowsSnakeToCamel(rows, fieldMap);

      expect(result).toEqual([
        { id: 1, firstName: 'John', lastName: 'Doe' },
        { id: 2, firstName: 'Jane', lastName: 'Smith' },
      ]);
    });

    it('should return empty array for null input', () => {
      const fieldMap = { id: 'id' };
      expect(mapRowsSnakeToCamel(null as any, fieldMap)).toEqual([]);
    });

    it('should return empty array for undefined input', () => {
      const fieldMap = { id: 'id' };
      expect(mapRowsSnakeToCamel(undefined as any, fieldMap)).toEqual([]);
    });

    it('should return empty array for non-array input', () => {
      const fieldMap = { id: 'id' };
      expect(mapRowsSnakeToCamel({} as any, fieldMap)).toEqual([]);
    });

    it('should handle empty array', () => {
      const fieldMap = { id: 'id' };
      expect(mapRowsSnakeToCamel([], fieldMap)).toEqual([]);
    });
  });

  describe('mapCamelToSnake', () => {
    it('should map camelCase fields to snake_case', () => {
      const obj = {
        id: 1,
        firstName: 'John',
        lastName: 'Doe',
        isActive: true,
      };

      const fieldMap = {
        id: 'id',
        firstName: 'first_name',
        lastName: 'last_name',
        isActive: 'is_active',
      };

      const result = mapCamelToSnake(obj, fieldMap);

      expect(result).toEqual({
        id: 1,
        first_name: 'John',
        last_name: 'Doe',
        is_active: true,
      });
    });

    it('should skip undefined values by default', () => {
      const obj = {
        id: 1,
        firstName: 'John',
        lastName: undefined,
      };

      const fieldMap = {
        id: 'id',
        firstName: 'first_name',
        lastName: 'last_name',
      };

      const result = mapCamelToSnake(obj, fieldMap);

      expect(result).toEqual({
        id: 1,
        first_name: 'John',
      });
      expect(result).not.toHaveProperty('last_name');
    });

    it('should include undefined values when requested', () => {
      const obj = {
        id: 1,
        firstName: 'John',
        lastName: undefined,
      };

      const fieldMap = {
        id: 'id',
        firstName: 'first_name',
        lastName: 'last_name',
      };

      const result = mapCamelToSnake(obj, fieldMap, true);

      expect(result).toEqual({
        id: 1,
        first_name: 'John',
        last_name: undefined,
      });
    });

    it('should handle null values', () => {
      const obj = {
        id: 1,
        description: null,
      };

      const fieldMap = {
        id: 'id',
        description: 'description',
      };

      const result = mapCamelToSnake(obj, fieldMap);

      expect(result).toEqual({
        id: 1,
        description: null,
      });
    });

    it('should return empty object for null input', () => {
      const fieldMap = { id: 'id' };
      expect(mapCamelToSnake(null, fieldMap)).toEqual({});
    });

    it('should return empty object for undefined input', () => {
      const fieldMap = { id: 'id' };
      expect(mapCamelToSnake(undefined, fieldMap)).toEqual({});
    });
  });

  describe('createPartialFieldMap', () => {
    it('should create field map for only present fields', () => {
      const updates = {
        firstName: 'Jane',
        isActive: false,
      };

      const fullFieldMap = {
        id: 'id',
        firstName: 'first_name',
        lastName: 'last_name',
        isActive: 'is_active',
        createdAt: 'created_at',
      };

      const result = createPartialFieldMap(updates, fullFieldMap);

      expect(result).toEqual({
        firstName: 'first_name',
        isActive: 'is_active',
      });
    });

    it('should handle empty updates object', () => {
      const updates = {};
      const fullFieldMap = {
        id: 'id',
        firstName: 'first_name',
      };

      const result = createPartialFieldMap(updates, fullFieldMap);

      expect(result).toEqual({});
    });

    it('should include fields with undefined values', () => {
      const updates = {
        firstName: 'Jane',
        lastName: undefined,
      };

      const fullFieldMap = {
        firstName: 'first_name',
        lastName: 'last_name',
        isActive: 'is_active',
      };

      const result = createPartialFieldMap(updates, fullFieldMap);

      expect(result).toEqual({
        firstName: 'first_name',
        lastName: 'last_name',
      });
    });
  });

  describe('Integration tests', () => {
    it('should handle complete CRUD cycle', () => {
      const fieldMap = {
        id: 'id',
        firstName: 'first_name',
        lastName: 'last_name',
        isActive: 'is_active',
        createdAt: 'created_at',
      };

      // Simulate database row
      const dbRow = {
        id: 1,
        first_name: 'John',
        last_name: 'Doe',
        is_active: true,
        created_at: '2024-01-01',
      };

      // Map to domain object
      const domainObj = mapSnakeToCamel(dbRow, fieldMap);
      expect(domainObj).toEqual({
        id: 1,
        firstName: 'John',
        lastName: 'Doe',
        isActive: true,
        createdAt: '2024-01-01',
      });

      // Simulate update
      const updates = {
        firstName: 'Jane',
        isActive: false,
      };

      // Map back to database format
      const partialMap = createPartialFieldMap(updates, fieldMap);
      const dbUpdates = mapCamelToSnake(updates, partialMap);

      expect(dbUpdates).toEqual({
        first_name: 'Jane',
        is_active: false,
      });
    });
  });
});

