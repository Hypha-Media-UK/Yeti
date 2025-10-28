#!/usr/bin/env python3
"""
MySQL to Supabase (PostgreSQL) Data Migration Script
Migrates all data from MySQL Docker container to Supabase PostgreSQL

Requirements:
    pip install mysql-connector-python psycopg2-binary python-dotenv

Usage:
    python migrate_data.py
"""

import mysql.connector
import psycopg2
from psycopg2.extras import execute_values
import os
from dotenv import load_dotenv
from datetime import datetime
import sys

# Load environment variables
load_dotenv()

# MySQL Configuration (from Docker)
MYSQL_CONFIG = {
    'host': 'localhost',
    'port': 3307,  # Docker mapped port
    'user': 'root',
    'password': 'root_password',
    'database': 'staff_rota'
}

# Supabase PostgreSQL Configuration
# Get these from your Supabase project settings > Database
SUPABASE_CONFIG = {
    'host': os.getenv('SUPABASE_DB_HOST'),  # e.g., aws-1-eu-west-2.pooler.supabase.com
    'port': int(os.getenv('SUPABASE_DB_PORT', '6543')),
    'user': os.getenv('SUPABASE_DB_USER', 'postgres'),
    'password': os.getenv('SUPABASE_DB_PASSWORD'),
    'database': 'postgres'
}

# Table migration order (respects foreign key dependencies)
TABLES = [
    'config',
    'buildings',
    'departments',
    'services',
    'shifts',
    'staff',
    'staff_allocations',
    'fixed_schedules',
    'manual_assignments',
    'staff_absences',
    'staff_contracted_hours',
    'area_operational_hours'
]

# Column mappings for type conversions
COLUMN_MAPPINGS = {
    'staff': {
        'status': lambda v: v,  # ENUM values stay the same
    },
    'manual_assignments': {
        'shift_type': lambda v: v,  # ENUM values stay the same
        'area_type': lambda v: v if v else None,
    },
    'staff_absences': {
        'absence_type': lambda v: v,  # ENUM values stay the same
    },
    'staff_allocations': {
        'area_type': lambda v: v,  # ENUM values stay the same
    },
    'area_operational_hours': {
        'area_type': lambda v: v,  # ENUM values stay the same
    },
    'shifts': {
        'type': lambda v: v,  # ENUM values stay the same
    }
}


def connect_mysql():
    """Connect to MySQL database"""
    try:
        conn = mysql.connector.connect(**MYSQL_CONFIG)
        print(f"✓ Connected to MySQL: {MYSQL_CONFIG['database']}")
        return conn
    except Exception as e:
        print(f"✗ MySQL connection failed: {e}")
        sys.exit(1)


def connect_postgres():
    """Connect to Supabase PostgreSQL database"""
    try:
        conn = psycopg2.connect(**SUPABASE_CONFIG)
        print(f"✓ Connected to Supabase PostgreSQL")
        return conn
    except Exception as e:
        print(f"✗ PostgreSQL connection failed: {e}")
        print(f"  Make sure you've set SUPABASE_DB_HOST and SUPABASE_DB_PASSWORD in .env")
        sys.exit(1)


def get_table_columns(mysql_cursor, table_name):
    """Get column names for a table"""
    mysql_cursor.execute(f"DESCRIBE {table_name}")
    columns = [row[0] for row in mysql_cursor.fetchall()]
    return columns


def convert_value(value, column_name, table_name):
    """Convert MySQL value to PostgreSQL compatible value"""
    if value is None:
        return None
    
    # Apply custom column mappings if defined
    if table_name in COLUMN_MAPPINGS and column_name in COLUMN_MAPPINGS[table_name]:
        return COLUMN_MAPPINGS[table_name][column_name](value)
    
    # Convert MySQL TINYINT(1) to PostgreSQL BOOLEAN
    if isinstance(value, int) and value in (0, 1):
        # Check if this is likely a boolean field
        if any(keyword in column_name.lower() for keyword in ['is_', 'include_']):
            return bool(value)
    
    return value


def migrate_table(mysql_conn, pg_conn, table_name):
    """Migrate a single table from MySQL to PostgreSQL"""
    print(f"\n📦 Migrating table: {table_name}")
    
    mysql_cursor = mysql_conn.cursor()
    pg_cursor = pg_conn.cursor()
    
    try:
        # Get column names
        columns = get_table_columns(mysql_cursor, table_name)
        columns_without_id = [col for col in columns if col != 'id']
        
        # Fetch all data from MySQL
        mysql_cursor.execute(f"SELECT * FROM {table_name}")
        rows = mysql_cursor.fetchall()
        
        if not rows:
            print(f"  ⚠ No data to migrate")
            return
        
        print(f"  Found {len(rows)} rows")
        
        # Convert and insert data
        converted_rows = []
        for row in rows:
            # Skip the id column (auto-generated in PostgreSQL)
            row_dict = dict(zip(columns, row))
            converted_row = tuple(
                convert_value(row_dict[col], col, table_name)
                for col in columns_without_id
            )
            converted_rows.append(converted_row)

        # Prepare PostgreSQL insert statement for execute_values with ON CONFLICT
        # This allows re-running the migration without errors
        insert_query = f"""
            INSERT INTO {table_name} ({', '.join(columns_without_id)})
            VALUES %s
            ON CONFLICT DO NOTHING
        """

        # Batch insert using execute_values
        execute_values(pg_cursor, insert_query, converted_rows)
        
        # Reset sequence for id column
        pg_cursor.execute(f"""
            SELECT setval(pg_get_serial_sequence('{table_name}', 'id'), 
                         (SELECT MAX(id) FROM {table_name}), true)
        """)
        
        pg_conn.commit()
        print(f"  ✓ Migrated {len(converted_rows)} rows")
        
    except Exception as e:
        pg_conn.rollback()
        print(f"  ✗ Error migrating {table_name}: {e}")
        raise
    finally:
        mysql_cursor.close()
        pg_cursor.close()


def verify_migration(mysql_conn, pg_conn):
    """Verify row counts match between MySQL and PostgreSQL"""
    print("\n🔍 Verifying migration...")
    
    mysql_cursor = mysql_conn.cursor()
    pg_cursor = pg_conn.cursor()
    
    all_match = True
    
    for table in TABLES:
        mysql_cursor.execute(f"SELECT COUNT(*) FROM {table}")
        mysql_count = mysql_cursor.fetchone()[0]
        
        pg_cursor.execute(f"SELECT COUNT(*) FROM {table}")
        pg_count = pg_cursor.fetchone()[0]
        
        match = "✓" if mysql_count == pg_count else "✗"
        print(f"  {match} {table}: MySQL={mysql_count}, PostgreSQL={pg_count}")
        
        if mysql_count != pg_count:
            all_match = False
    
    mysql_cursor.close()
    pg_cursor.close()
    
    return all_match


def main():
    """Main migration function"""
    print("=" * 60)
    print("MySQL to Supabase PostgreSQL Migration")
    print("=" * 60)
    
    # Check environment variables
    if not SUPABASE_CONFIG['host'] or not SUPABASE_CONFIG['password']:
        print("\n✗ Missing Supabase configuration!")
        print("  Please set the following environment variables in .env:")
        print("    SUPABASE_DB_HOST=db.xxx.supabase.co")
        print("    SUPABASE_DB_PASSWORD=your_password")
        sys.exit(1)
    
    # Connect to databases
    mysql_conn = connect_mysql()
    pg_conn = connect_postgres()
    
    try:
        # Migrate each table
        for table in TABLES:
            migrate_table(mysql_conn, pg_conn, table)
        
        # Verify migration
        if verify_migration(mysql_conn, pg_conn):
            print("\n✅ Migration completed successfully!")
        else:
            print("\n⚠ Migration completed with warnings - row counts don't match")
        
    except Exception as e:
        print(f"\n✗ Migration failed: {e}")
        sys.exit(1)
    finally:
        mysql_conn.close()
        pg_conn.close()
        print("\n" + "=" * 60)


if __name__ == "__main__":
    main()

