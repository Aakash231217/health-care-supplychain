import { Card } from '@/components/ui/card';

export function ProjectStructure() {
  return (
    <section id="project-structure" className="mb-16">
      <h2 className="text-3xl font-bold mb-6">Project Structure</h2>
      <Card className="p-6 bg-gray-100">
        <pre className="text-sm">
{`├── prisma/
│   └── schema.prisma          # Database schema
├── src/
│   ├── app/                   # Next.js app directory
│   │   ├── api/
│   │   │   └── trpc/         # tRPC API routes
│   │   ├── dashboard/        # Dashboard pages
│   │   ├── docs/            # Documentation page
│   │   └── page.tsx         # Homepage
│   ├── components/
│   │   ├── ui/              # shadcn/ui components
│   │   ├── products/        # Product-related components
│   │   ├── docs/            # Documentation components
│   │   └── providers/       # React context providers
│   ├── lib/
│   │   ├── db.ts            # Prisma client
│   │   ├── utils.ts         # Utility functions
│   │   └── trpc/            # tRPC client setup
│   └── server/
│       ├── trpc.ts          # tRPC configuration
│       └── routers/         # tRPC API routers
├── .env.example             # Environment variables template
├── package.json
├── README.md
└── BUILD_SUMMARY.md         # Build documentation`}
        </pre>
      </Card>

      <div className="mt-6 space-y-4">
        <h3 className="text-xl font-semibold">Key Directories</h3>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="p-4 border rounded-lg bg-white">
            <h4 className="font-medium mb-2">app/</h4>
            <p className="text-sm text-gray-600">
              Next.js App Router pages and API routes. Each folder represents a route.
            </p>
          </div>
          <div className="p-4 border rounded-lg bg-white">
            <h4 className="font-medium mb-2">components/</h4>
            <p className="text-sm text-gray-600">
              Reusable React components organized by feature/domain.
            </p>
          </div>
          <div className="p-4 border rounded-lg bg-white">
            <h4 className="font-medium mb-2">server/</h4>
            <p className="text-sm text-gray-600">
              Backend logic including tRPC routers and business logic.
            </p>
          </div>
          <div className="p-4 border rounded-lg bg-white">
            <h4 className="font-medium mb-2">prisma/</h4>
            <p className="text-sm text-gray-600">
              Database schema and migration files.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
