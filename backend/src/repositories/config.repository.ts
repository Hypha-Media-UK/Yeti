import { pool } from '../config/database';
import { ConfigRow, InsertResult } from '../types/database.types';

export class ConfigRepository {
  async getByKey(key: string): Promise<string | null> {
    const [rows] = await pool.query<ConfigRow[]>(
      'SELECT value FROM config WHERE `key` = ?',
      [key]
    );
    return rows.length > 0 ? rows[0].value : null;
  }

  async setByKey(key: string, value: string): Promise<void> {
    await pool.query<InsertResult>(
      'INSERT INTO config (`key`, value) VALUES (?, ?) ON DUPLICATE KEY UPDATE value = ?',
      [key, value, value]
    );
  }

  async getAll(): Promise<Record<string, string>> {
    const [rows] = await pool.query<ConfigRow[]>('SELECT `key`, value FROM config');
    const config: Record<string, string> = {};
    rows.forEach(row => {
      config[row.key] = row.value;
    });
    return config;
  }
}

