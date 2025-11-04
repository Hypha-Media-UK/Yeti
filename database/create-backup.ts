/**
 * Database Backup Script
 * Creates a complete SQL backup of the Yeti database
 */

import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

const PROJECT_REF = 'zqroxxjfkcmcxryuatex';
const SUPABASE_ACCESS_TOKEN = process.env.SUPABASE_ACCESS_TOKEN;

if (!SUPABASE_ACCESS_TOKEN) {
  console.error('Error: SUPABASE_ACCESS_TOKEN environment variable is not set');
  process.exit(1);
}

interface TableData {
  tableName: string;
  rows: any[];
}

async function query(sql: string): Promise<any[]> {
  const response = await fetch(
    `https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query: sql }),
    }
  );

  if (!response.ok) {
    throw new Error(`Query failed: ${response.statusText}`);
  }

  return await response.json();
}

async function getTables(): Promise<string[]> {
  const result = await query(`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_type = 'BASE TABLE' 
    ORDER BY table_name
  `);
  
  return result.map((row: any) => row.table_name);
}

async function getTableData(tableName: string): Promise<any[]> {
  return await query(`SELECT * FROM ${tableName} ORDER BY id`);
}

async function getTableSchema(tableName: string): Promise<string> {
  const columns = await query(`
    SELECT 
      column_name,
      data_type,
      character_maximum_length,
      is_nullable,
      column_default
    FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = '${tableName}'
    ORDER BY ordinal_position
  `);

  const columnDefs = columns.map((col: any) => {
    let def = `  ${col.column_name} ${col.data_type}`;
    
    if (col.character_maximum_length) {
      def += `(${col.character_maximum_length})`;
    }
    
    if (col.is_nullable === 'NO') {
      def += ' NOT NULL';
    }
    
    if (col.column_default) {
      def += ` DEFAULT ${col.column_default}`;
    }
    
    return def;
  });

  return `CREATE TABLE IF NOT EXISTS ${tableName} (\n${columnDefs.join(',\n')}\n);`;
}

function escapeValue(value: any): string {
  if (value === null || value === undefined) {
    return 'NULL';
  }
  
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  
  // Escape single quotes and wrap in quotes
  return `'${String(value).replace(/'/g, "''")}'`;
}

function generateInsertStatements(tableName: string, rows: any[]): string {
  if (rows.length === 0) {
    return `-- No data in ${tableName}\n`;
  }

  const columns = Object.keys(rows[0]);
  const columnList = columns.join(', ');
  
  const values = rows.map(row => {
    const vals = columns.map(col => escapeValue(row[col]));
    return `  (${vals.join(', ')})`;
  });

  return `INSERT INTO ${tableName} (${columnList}) VALUES\n${values.join(',\n')};\n`;
}

async function createBackup() {
  console.log('==========================================');
  console.log('Yeti Database Backup');
  console.log('==========================================');
  console.log(`Project: ${PROJECT_REF}`);
  console.log(`Timestamp: ${new Date().toISOString()}`);
  console.log('==========================================\n');

  try {
    // Create backups directory
    const backupsDir = join(process.cwd(), 'database', 'backups');
    mkdirSync(backupsDir, { recursive: true });

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
    const backupFile = join(backupsDir, `yeti_backup_${timestamp}.sql`);

    console.log('Fetching table list...');
    const tables = await getTables();
    console.log(`Found ${tables.length} tables\n`);

    let sqlContent = `-- Yeti Database Backup
-- Generated: ${new Date().toISOString()}
-- Project: ${PROJECT_REF}
-- Tables: ${tables.length}

SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;

`;

    // Get schema and data for each table
    for (const table of tables) {
      console.log(`Processing table: ${table}...`);
      
      const rows = await getTableData(table);
      console.log(`  - ${rows.length} rows`);

      sqlContent += `\n-- Table: ${table}\n`;
      sqlContent += `-- Rows: ${rows.length}\n\n`;
      
      if (rows.length > 0) {
        sqlContent += generateInsertStatements(table, rows);
      }
    }

    // Write backup file
    writeFileSync(backupFile, sqlContent, 'utf8');

    console.log('\n==========================================');
    console.log('✅ Backup completed successfully!');
    console.log('==========================================');
    console.log(`Backup file: ${backupFile}`);
    console.log('==========================================\n');

  } catch (error) {
    console.error('\n==========================================');
    console.error('❌ Backup failed!');
    console.error('==========================================');
    console.error(error);
    process.exit(1);
  }
}

createBackup();

