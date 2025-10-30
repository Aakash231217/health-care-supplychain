# Setup Instructions

## Initial Setup Steps

### 1. Environment Variables

Copy `.env.example` to `.env` and fill in the following:

#### Required Variables:

**Database (Neon PostgreSQL)**
```
DATABASE_URL="postgresql://username:password@your-neon-host/database?sslmode=require"
```

**NextAuth**
```
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key"  # Generate with: openssl rand -base64 32
```

#### Optional but Recommended:

**Redis (Upstash)**
```
UPSTASH_REDIS_REST_URL="your-upstash-url"
UPSTASH_REDIS_REST_TOKEN="your-upstash-token"
```

**Email (Resend)**
```
RESEND_API_KEY="re_xxxxxxxxxxxx"
```

**File Storage (UploadThing)**
```
UPLOADTHING_SECRET="sk_live_xxxxxxxxxxxx"
UPLOADTHING_APP_ID="your-app-id"
```

### 2. Database Setup

```bash
# Generate Prisma Client
npx prisma generate

# Push schema to database (development)
npx prisma db push

# OR run migrations (production)
npx prisma migrate dev --name init
```

### 3. View Database

```bash
npx prisma studio
```

This will open a web interface to view and edit your database.

### 4. Run Development Server

```bash
npm run dev
```

Visit http://localhost:3000

## Third-Party Services Setup

### Neon (PostgreSQL Database)

1. Go to https://neon.tech
2. Create account and new project
3. Copy connection string
4. Paste in `DATABASE_URL`

### Upstash (Redis)

1. Go to https://upstash.com
2. Create database
3. Copy REST URL and Token
4. Paste in environment variables

### Resend (Email)

1. Go to https://resend.com
2. Create API key
3. Paste in `RESEND_API_KEY`

### UploadThing (File Storage)

1. Go to https://uploadthing.com
2. Create app
3. Get Secret and App ID
4. Paste in environment variables

## Testing the Setup

1. Start dev server: `npm run dev`
2. Open http://localhost:3000
3. You should see the homepage
4. Check database connection via Prisma Studio

## Common Issues

### Issue: Database connection error
- **Solution**: Check DATABASE_URL format and credentials
- Ensure IP is whitelisted in Neon dashboard

### Issue: Prisma client not found
- **Solution**: Run `npx prisma generate`

### Issue: Port 3000 already in use
- **Solution**: Use different port: `PORT=3001 npm run dev`

## Next Steps

After setup:
1. Create test user through the UI or Prisma Studio
2. Upload sample products
3. Test RFQ workflow
4. Explore analytics dashboard
