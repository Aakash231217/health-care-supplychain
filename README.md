Healthcare Supply Chain Management System

A comprehensive platform designed to streamline the procurement, tracking, and management of medical products and supplies.

Tech Stack

- Frontend: Next.js 14, React, TailwindCSS, shadcn/ui
- Backend: tRPC, Prisma ORM
- Database: PostgreSQL (Neon)
- Cache: Redis (Upstash)
- Auth: NextAuth.js
- File Storage: UploadThing / Cloudinary
- Email: Resend
- Monitoring: Sentry

Features

- ✅ Product Management - Centralized catalog with automated parsing
- ✅ Vendor Management - Track vendor performance and certifications
- ✅ RFQ & Procurement - Automated quote requests and bid comparison
- ✅ Shipment Tracking - Real-time visibility with carrier integration
- ✅ Quality & Compliance - Automated quality checks and audits
- ✅ Analytics & Reports - Data-driven insights and KPI tracking

System Architecture

Overview

The Healthcare Supply Chain Management System follows a modern, scalable architecture pattern with clear separation of concerns:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                 CLIENT LAYER                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐           │
│  │   Web Browser   │  │  Mobile Browser │  │  API Consumers  │           │
│  └────────┬────────┘  └────────┬────────┘  └────────┬────────┘           │
│           │                     │                     │                     │
│           └─────────────────────┴─────────────────────┘                     │
│                                 │                                           │
└─────────────────────────────────┼───────────────────────────────────────────┘
                                  │ HTTPS
┌─────────────────────────────────┼───────────────────────────────────────────┐
│                                 ▼                                           │
│                          PRESENTATION LAYER                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌───────────────────────────────────────────────────────────────────┐     │
│  │                        Next.js 14 Application                      │     │
│  ├───────────────────────────────────────────────────────────────────┤     │
│  │  ┌─────────────┐  ┌──────────────┐  ┌───────────────┐           │     │
│  │  │   Pages &   │  │  Components  │  │  Static Assets │           │     │
│  │  │   Routes    │  │  (shadcn/ui) │  │  (Images/CSS)  │           │     │
│  │  └─────────────┘  └──────────────┘  └───────────────┘           │     │
│  │                                                                   │     │
│  │  ┌─────────────────────────────────────────────────────────┐     │     │
│  │  │                    React Query + tRPC Client              │     │     │
│  │  └─────────────────────────────────────────────────────────┘     │     │
│  └───────────────────────────────────────────────────────────────────┘     │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
                                  │ tRPC/HTTP
┌─────────────────────────────────┼───────────────────────────────────────────┐
│                                 ▼                                           │
│                           API LAYER (Backend)                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌───────────────────────────────────────────────────────────────────┐     │
│  │                         tRPC API Routes                            │     │
│  ├───────────────────────────────────────────────────────────────────┤     │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐         │     │
│  │  │ Product  │  │  Vendor  │  │   RFQ    │  │ Shipment │         │     │
│  │  │  Router  │  │  Router  │  │  Router  │  │  Router  │         │     │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────┘         │     │
│  └───────────────────────────────────────────────────────────────────┘     │
│                                                                             │
│  ┌───────────────────────────────────────────────────────────────────┐     │
│  │                      Business Logic Layer                          │     │
│  ├───────────────────────────────────────────────────────────────────┤     │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │     │
│  │  │   Auth &    │  │ Validation  │  │   Business   │              │     │
│  │  │  Security   │  │   (Zod)     │  │    Rules     │              │     │
│  │  │ (NextAuth)  │  │             │  │              │              │     │
│  │  └─────────────┘  └─────────────┘  └─────────────┘              │     │
│  └───────────────────────────────────────────────────────────────────┘     │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
                                  │
┌─────────────────────────────────┼───────────────────────────────────────────┐
│                                 ▼                                           │
│                           DATA LAYER                                         │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────┐  ┌─────────────────────────┐                 │
│  │      Prisma ORM         │  │    Redis Cache          │                 │
│  │  ┌─────────────────┐    │  │  ┌─────────────────┐    │                 │
│  │  │ Type-Safe Query │    │  │  │ Session Storage │    │                 │
│  │  │   Generator     │    │  │  │ Temporary Data  │    │                 │
│  │  └─────────────────┘    │  │  └─────────────────┘    │                 │
│  └────────────┬────────────┘  └────────────┬────────────┘                 │
│               │                             │                               │
└───────────────┼─────────────────────────────┼───────────────────────────────┘
                │                             │
┌───────────────┼─────────────────────────────┼───────────────────────────────┐
│               ▼                             ▼                               │
│         INFRASTRUCTURE & EXTERNAL SERVICES                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐           │
│  │   PostgreSQL    │  │  Redis/Upstash  │  │   File Storage  │           │
│  │     (Neon)      │  │                 │  │  (UploadThing)  │           │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘           │
│                                                                             │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐           │
│  │  Email Service  │  │    Monitoring   │  │    External     │           │
│  │    (Resend)     │  │    (Sentry)     │  │      APIs       │           │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘           │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

Architecture Components

1. Client Layer
   - Web browsers accessing the application
   - Mobile browsers with responsive design
   - External API consumers (future expansion)

2. Presentation Layer (Frontend)
   - Next.js 14: Server-side rendering and routing
   - React: Component-based UI
   - TailwindCSS: Utility-first styling
   - shadcn/ui: Pre-built component library
   - React Query + tRPC: Data fetching and caching

3. API Layer (Backend)
   - tRPC Routers: Type-safe API endpoints
   - Business Logic: Core application rules
   - Authentication: NextAuth.js for user management
   - Validation: Zod schemas for data integrity

4. Data Layer
   - Prisma ORM: Database abstraction and type safety
   - PostgreSQL: Primary data storage
   - Redis: Caching and session management

5. Infrastructure Services
   - Neon: Managed PostgreSQL hosting
   - Upstash: Serverless Redis
   - UploadThing/Cloudinary: File storage
   - Resend: Transactional emails
   - Sentry: Error tracking and monitoring

Data Flow

1. Request Flow:
   ```
   Client → Next.js → tRPC Router → Business Logic → Prisma → Database
   ```

2. Authentication Flow:
   ```
   Client → NextAuth → Session Validation → Protected Routes
   ```

3. File Upload Flow:
   ```
   Client → Upload Component → UploadThing API → Storage → URL Return
   ```

4. Caching Strategy:
   ```
   Request → Check Redis Cache → If miss, query DB → Cache result → Return
   ```

Key Design Principles

1. Type Safety: End-to-end type safety with TypeScript, tRPC, and Prisma
2. Scalability: Stateless architecture with external service integration
3. Performance: Server-side rendering, caching, and optimized queries
4. Security: Authentication, authorization, and input validation at every layer
5. Maintainability: Clear separation of concerns and modular structure

Security Measures

- JWT-based authentication with NextAuth
- Role-based access control (RBAC) for different user types
- Input validation and sanitization with Zod
- SQL injection prevention via Prisma's prepared statements
- HTTPS enforcement in production
- Environment variable protection for sensitive data

Deployment Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Vercel Edge Network                   │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │   CDN/Edge  │  │   Lambda    │  │   Static    │        │
│  │   Caching   │  │  Functions  │  │   Assets    │        │
│  └─────────────┘  └─────────────┘  └─────────────┘        │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    External Services                         │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  │
│  │   Neon   │  │ Upstash  │  │ Upload   │  │  Resend  │  │
│  │    DB    │  │  Redis   │  │  Thing   │  │  Email   │  │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘  │
└─────────────────────────────────────────────────────────────┘
```

Getting Started

Prerequisites

- Node.js 18+ installed
- PostgreSQL database (Neon recommended)
- Redis instance (Upstash recommended)

Installation

1. Clone and install dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
cp .env.example .env
```

Then fill in your environment variables in `.env`:
- `DATABASE_URL` - Your PostgreSQL connection string
- `UPSTASH_REDIS_REST_URL` - Your Redis REST URL
- `UPSTASH_REDIS_REST_TOKEN` - Your Redis REST token
- `NEXTAUTH_SECRET` - Generate with: `openssl rand -base64 32`
- Other API keys as needed

3. Set up the database:
```bash
npx prisma generate
npx prisma db push
```

4. Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

Project Structure

```
├── prisma/
│   └── schema.prisma          Database schema
├── src/
│   ├── app/                   Next.js app directory
│   │   ├── api/
│   │   │   └── trpc/         tRPC API routes
│   │   ├── dashboard/        Dashboard pages
│   │   └── page.tsx          Homepage
│   ├── components/
│   │   ├── ui/               shadcn/ui components
│   │   └── providers/        React context providers
│   ├── lib/
│   │   ├── db.ts             Prisma client
│   │   ├── utils.ts          Utility functions
│   │   └── trpc/             tRPC client setup
│   └── server/
│       ├── trpc.ts           tRPC configuration
│       └── routers/          tRPC API routers
├── .env.example              Environment variables template
├── package.json
└── README.md
```

Database Schema

Key entities:
- User - System users with role-based access
- Product - Medical products and supplies
- Vendor - Supplier information and performance
- RFQ - Request for Quote management
- Quote - Vendor quotes and bids
- PurchaseOrder - Purchase order processing
- Shipment - Logistics and tracking
- QualityCheck - Compliance and quality assurance
- Invoice - Financial tracking

API Endpoints

The application uses tRPC for type-safe APIs. Available procedures:

Product
- `product.getAll` - List all products with pagination
- `product.getById` - Get product by ID
- `product.create` - Create new product
- `product.update` - Update product
- `product.delete` - Delete product
- `product.bulkUpload` - Bulk upload products

Development

Adding New Features

1. Database Changes: Update `prisma/schema.prisma`
2. API Routes: Add procedures in `src/server/routers/`
3. UI Components: Create components in `src/components/`
4. Pages: Add pages in `src/app/`

Running Prisma Studio

```bash
npx prisma studio
```

Deployment

Vercel (Recommended)

1. Push code to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy

Manual Deployment

```bash
npm run build
npm run start
```

Environment Variables

Required variables:
- `DATABASE_URL` - PostgreSQL connection
- `NEXTAUTH_URL` - Your app URL
- `NEXTAUTH_SECRET` - Secret for NextAuth

Optional:
- `UPSTASH_REDIS_REST_URL` - Redis cache
- `RESEND_API_KEY` - Email service
- `UPLOADTHING_SECRET` - File uploads
- `NEXT_PUBLIC_SENTRY_DSN` - Error monitoring

Contributing

1. Create a feature branch
2. Make your changes
3. Test thoroughly
4. Submit a pull request

License

Proprietary - All rights reserved

Support

For questions or support, contact the development team.
