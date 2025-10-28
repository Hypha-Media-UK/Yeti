# Staff Rota: MySQL → Supabase + Vercel Migration Guide

This guide walks you through migrating the Staff Rota application from MySQL/Docker to Supabase (PostgreSQL) and deploying to Vercel.

## 📋 Prerequisites

- [ ] Supabase account (https://supabase.com)
- [ ] Vercel account (https://vercel.com)
- [ ] Python 3.8+ (for data migration script)
- [ ] Node.js 18+ (for Vercel deployment)
- [ ] Current MySQL database running in Docker

## 🗄️ Phase 1: Database Migration to Supabase

### Step 1.1: Create Supabase Project

1. Go to https://supabase.com/dashboard
2. Click "New Project"
3. Fill in details:
   - **Name**: `staff-rota` (or your preferred name)
   - **Database Password**: Generate a strong password (save this!)
   - **Region**: Choose closest to your users (e.g., `eu-west-2` for UK)
4. Click "Create new project" (takes ~2 minutes)

### Step 1.2: Get Supabase Connection Details

Once your project is created:

1. Go to **Project Settings** → **Database**
2. Note down these values:
   - **Host**: `db.xxx.supabase.co`
   - **Database name**: `postgres`
   - **Port**: `5432`
   - **User**: `postgres`
   - **Password**: (the one you set during project creation)

3. Also note from **Project Settings** → **API**:
   - **Project URL**: `https://xxx.supabase.co`
   - **anon/public key**: `eyJhbGc...` (for frontend)
   - **service_role key**: `eyJhbGc...` (for backend - keep secret!)

### Step 1.3: Create PostgreSQL Schema

1. Open Supabase **SQL Editor**
2. Copy the entire contents of `database/supabase/001_schema.sql`
3. Paste into SQL Editor and click **Run**
4. Verify all tables were created (check **Table Editor** sidebar)

### Step 1.4: Migrate Data from MySQL

1. **Install Python dependencies**:
   ```bash
   pip install mysql-connector-python psycopg2-binary python-dotenv
   ```

2. **Create `.env` file** in project root (if not exists):
   ```bash
   # Add these Supabase credentials
   SUPABASE_DB_HOST=db.xxx.supabase.co
   SUPABASE_DB_PASSWORD=your_database_password
   ```

3. **Ensure MySQL Docker container is running**:
   ```bash
   docker-compose ps mysql
   # Should show "Up" status
   ```

4. **Run migration script**:
   ```bash
   cd database/supabase
   python migrate_data.py
   ```

5. **Verify migration**:
   - Script will show row counts for each table
   - Check Supabase **Table Editor** to browse data
   - All counts should match your MySQL database

### Step 1.5: Verify Data in Supabase

1. Go to Supabase **Table Editor**
2. Check each table has data:
   - `staff` - should have ~90 staff members
   - `buildings` - should have 16 buildings
   - `departments` - should have 66 departments
   - `services` - should have 9 services
   - `manual_assignments` - check for any existing assignments
   - `staff_absences` - check for any absences
   - etc.

---

## 🔧 Phase 2: Backend Migration

### Step 2.1: Install Supabase Client

```bash
cd backend
npm install @supabase/supabase-js
```

### Step 2.2: Update Database Configuration

The backend needs to be updated to use Supabase instead of MySQL2. I'll create the necessary files in the next steps.

**Key Changes Needed**:
1. Replace `mysql2` with `@supabase/supabase-js`
2. Update `backend/src/config/database.ts`
3. Update all repository files to use PostgreSQL syntax
4. Update ENUM handling (PostgreSQL uses different syntax)
5. Update AUTO_INCREMENT → SERIAL handling

### Step 2.3: Environment Variables

Create `backend/.env.production`:
```env
# Supabase Configuration
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
SUPABASE_ANON_KEY=eyJhbGc...

# Application
NODE_ENV=production
PORT=3000
TZ=Europe/London
```

---

## 🚀 Phase 3: Vercel Deployment

### Step 3.1: Prepare Backend for Vercel Serverless

Vercel uses serverless functions, so we need to adapt the Express app.

**Create `api/index.ts`** (Vercel entry point):
```typescript
import app from '../backend/src/app';

export default app;
```

**Create `vercel.json`**:
```json
{
  "version": 2,
  "builds": [
    {
      "src": "api/index.ts",
      "use": "@vercel/node"
    },
    {
      "src": "frontend/package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "dist"
      }
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "/api/index.ts"
    },
    {
      "src": "/(.*)",
      "dest": "/frontend/$1"
    }
  ],
  "env": {
    "NODE_ENV": "production"
  }
}
```

### Step 3.2: Deploy to Vercel

**Option A: Using Vercel CLI**
```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy
vercel --prod
```

**Option B: Using GitHub Integration**
1. Push code to GitHub
2. Go to https://vercel.com/new
3. Import your GitHub repository
4. Configure:
   - **Framework Preset**: Other
   - **Root Directory**: `./`
   - **Build Command**: `cd frontend && npm install && npm run build`
   - **Output Directory**: `frontend/dist`
5. Add Environment Variables:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `SUPABASE_ANON_KEY`
   - `NODE_ENV=production`
6. Click **Deploy**

### Step 3.3: Update Frontend API URL

Update `frontend/.env.production`:
```env
VITE_API_URL=https://your-app.vercel.app/api
```

---

## ✅ Phase 4: Testing & Verification

### Step 4.1: Test Backend API

```bash
# Test health endpoint
curl https://your-app.vercel.app/api/health

# Test staff endpoint
curl https://your-app.vercel.app/api/staff

# Test rota endpoint
curl https://your-app.vercel.app/api/rota/day/2025-10-28
```

### Step 4.2: Test Frontend

1. Visit `https://your-app.vercel.app`
2. Check all pages load correctly:
   - Day View (rota)
   - Config page
   - Staff management
3. Test functionality:
   - Create temporary assignment
   - Mark absence
   - View area assignments

### Step 4.3: Verify Data Integrity

- [ ] All staff members visible
- [ ] Departments and services load
- [ ] Shift assignments work
- [ ] Absences display correctly
- [ ] Operational hours respected

---

## 🔄 Rollback Plan

If migration fails, you can rollback:

1. **Keep MySQL Docker running** (don't delete until migration is verified)
2. **Backup before migration**:
   ```bash
   docker exec staff_rota_mysql mysqldump -u root -proot_password staff_rota > backup_pre_migration.sql
   ```
3. **Restore if needed**:
   ```bash
   docker exec -i staff_rota_mysql mysql -u root -proot_password staff_rota < backup_pre_migration.sql
   ```

---

## 📊 Migration Checklist

### Database
- [ ] Supabase project created
- [ ] PostgreSQL schema created (001_schema.sql)
- [ ] Data migrated from MySQL
- [ ] Row counts verified
- [ ] Foreign keys working
- [ ] Indexes created

### Backend
- [ ] Supabase client installed
- [ ] Database config updated
- [ ] Repository files updated for PostgreSQL
- [ ] Environment variables configured
- [ ] API endpoints tested locally

### Frontend
- [ ] API URL updated
- [ ] Build tested locally
- [ ] Environment variables set

### Deployment
- [ ] Vercel project created
- [ ] Environment variables added
- [ ] Backend deployed
- [ ] Frontend deployed
- [ ] Custom domain configured (optional)

### Testing
- [ ] Health check passes
- [ ] All API endpoints work
- [ ] Frontend loads correctly
- [ ] Data displays properly
- [ ] CRUD operations work
- [ ] Absences system works
- [ ] Temporary assignments work

---

## 🆘 Troubleshooting

### Issue: Migration script fails

**Solution**: Check MySQL Docker is running:
```bash
docker-compose ps mysql
docker-compose logs mysql
```

### Issue: Supabase connection fails

**Solution**: Verify credentials in `.env`:
- Check `SUPABASE_DB_HOST` is correct
- Check `SUPABASE_DB_PASSWORD` matches project password
- Try connecting with `psql`:
  ```bash
  psql "postgresql://postgres:PASSWORD@db.xxx.supabase.co:5432/postgres"
  ```

### Issue: Vercel deployment fails

**Solution**: Check build logs in Vercel dashboard:
- Ensure all dependencies are in `package.json`
- Check environment variables are set
- Verify build command is correct

### Issue: ENUM type errors

**Solution**: PostgreSQL ENUM types are case-sensitive. Ensure values match exactly:
- MySQL: `'Regular'` → PostgreSQL: `'Regular'` ✓
- MySQL: `'day'` → PostgreSQL: `'day'` ✓

---

## 📚 Next Steps

After successful migration:

1. **Monitor Performance**: Check Supabase dashboard for query performance
2. **Set up Backups**: Configure automated backups in Supabase
3. **Enable RLS**: Add Row Level Security policies if needed
4. **Custom Domain**: Add custom domain in Vercel settings
5. **SSL Certificate**: Vercel provides automatic SSL
6. **Analytics**: Add Vercel Analytics for monitoring

---

## 🔗 Useful Links

- [Supabase Documentation](https://supabase.com/docs)
- [Vercel Documentation](https://vercel.com/docs)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Supabase JavaScript Client](https://supabase.com/docs/reference/javascript/introduction)

---

**Need Help?** Check the troubleshooting section or create an issue in the repository.

