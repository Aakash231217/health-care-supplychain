import { Card } from '@/components/ui/card';
import { Database } from 'lucide-react';

export function Architecture() {
  const architectureComponents = [
    {
      title: 'Client Layer',
      items: [
        'Web browsers accessing the application',
        'Mobile browsers with responsive design',
        'External API consumers (future expansion)'
      ]
    },
    {
      title: 'Presentation Layer (Frontend)',
      items: [
        'Next.js 14: Server-side rendering and routing',
        'React: Component-based UI',
        'TailwindCSS: Utility-first styling',
        'shadcn/ui: Pre-built component library',
        'React Query + tRPC: Data fetching and caching'
      ]
    },
    {
      title: 'API Layer (Backend)',
      items: [
        'tRPC Routers: Type-safe API endpoints',
        'Business Logic: Core application rules',
        'Authentication: NextAuth.js for user management',
        'Validation: Zod schemas for data integrity'
      ]
    },
    {
      title: 'Data Layer',
      items: [
        'Prisma ORM: Database abstraction and type safety',
        'PostgreSQL: Primary data storage',
        'Redis: Caching and session management'
      ]
    },
    {
      title: 'Infrastructure Services',
      items: [
        'Neon: Managed PostgreSQL hosting',
        'Upstash: Serverless Redis',
        'UploadThing/Cloudinary: File storage',
        'Resend: Transactional emails',
        'Sentry: Error tracking and monitoring'
      ]
    }
  ];

  const dataFlows = [
    { 
      title: 'Request Flow',
      flow: 'Client → Next.js → tRPC Router → Business Logic → Prisma → Database'
    },
    {
      title: 'Authentication Flow',
      flow: 'Client → NextAuth → Session Validation → Protected Routes'
    },
    {
      title: 'File Upload Flow',
      flow: 'Client → Upload Component → UploadThing API → Storage → URL Return'
    },
    {
      title: 'Caching Strategy',
      flow: 'Request → Check Redis Cache → If miss, query DB → Cache result → Return'
    }
  ];

  const designPrinciples = [
    { principle: 'Type Safety', desc: 'End-to-end type safety with TypeScript, tRPC, and Prisma' },
    { principle: 'Scalability', desc: 'Stateless architecture with external service integration' },
    { principle: 'Performance', desc: 'Server-side rendering, caching, and optimized queries' },
    { principle: 'Security', desc: 'Authentication, authorization, and input validation at every layer' },
    { principle: 'Maintainability', desc: 'Clear separation of concerns and modular structure' }
  ];

  return (
    <section id="architecture" className="mb-16">
      <h2 className="text-3xl font-bold mb-6">System Architecture</h2>
      <p className="mb-6 text-gray-600">
        The Healthcare Supply Chain Management System follows a modern, scalable architecture 
        pattern with clear separation of concerns:
      </p>

      <div className="space-y-8">
        {/* Architecture Overview Diagram */}
        <Card className="p-6 bg-gray-900 text-white overflow-x-auto">
          <pre className="text-xs whitespace-pre font-mono">
{`┌─────────────────────────────────────────────────────────────────────────────┐
│                                 CLIENT LAYER                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐           │
│  │   Web Browser   │  │  Mobile Browser │  │  API Consumers  │           │
│  └────────┬────────┘  └────────┬────────┘  └────────┬────────┘           │
│           └─────────────────────┴─────────────────────┘                     │
└─────────────────────────────────────┼───────────────────────────────────────┘
                                      │ HTTPS
┌─────────────────────────────────────┼───────────────────────────────────────┐
│                          PRESENTATION LAYER                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│  ┌───────────────────────────────────────────────────────────────────┐     │
│  │                        Next.js 14 Application                      │     │
│  ├───────────────────────────────────────────────────────────────────┤     │
│  │  ┌─────────────┐  ┌──────────────┐  ┌───────────────┐           │     │
│  │  │   Pages &   │  │  Components  │  │  Static Assets │           │     │
│  │  │   Routes    │  │  (shadcn/ui) │  │  (Images/CSS)  │           │     │
│  │  └─────────────┘  └──────────────┘  └───────────────┘           │     │
│  └───────────────────────────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │ tRPC/HTTP
┌─────────────────────────────────────┼───────────────────────────────────────┐
│                           API LAYER (Backend)                                │
├─────────────────────────────────────────────────────────────────────────────┤
│  ┌───────────────────────────────────────────────────────────────────┐     │
│  │                         tRPC API Routes                            │     │
│  ├───────────────────────────────────────────────────────────────────┤     │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐         │     │
│  │  │ Product  │  │  Vendor  │  │   RFQ    │  │ Shipment │         │     │
│  │  │  Router  │  │  Router  │  │  Router  │  │  Router  │         │     │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────┘         │     │
│  └───────────────────────────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
┌─────────────────────────────────────┼───────────────────────────────────────┐
│                           DATA LAYER                                         │
├─────────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────┐  ┌─────────────────────────┐                 │
│  │      Prisma ORM         │  │    Redis Cache          │                 │
│  │  ┌─────────────────┐    │  │  ┌─────────────────┐    │                 │
│  │  │ Type-Safe Query │    │  │  │ Session Storage │    │                 │
│  │  │   Generator     │    │  │  │ Temporary Data  │    │                 │
│  │  └─────────────────┘    │  │  └─────────────────┘    │                 │
│  └────────────┬────────────┘  └────────────┬────────────┘                 │
└───────────────┼─────────────────────────────┼───────────────────────────────┘
                │                             │
┌───────────────┼─────────────────────────────┼───────────────────────────────┐
│         INFRASTRUCTURE & EXTERNAL SERVICES                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐           │
│  │   PostgreSQL    │  │  Redis/Upstash  │  │   File Storage  │           │
│  │     (Neon)      │  │                 │  │  (UploadThing)  │           │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘           │
└─────────────────────────────────────────────────────────────────────────────┘`}
          </pre>
        </Card>

        {/* Architecture Components */}
        <div className="space-y-6">
          <h3 className="text-2xl font-semibold">Architecture Components</h3>
          
          <div className="space-y-4">
            {architectureComponents.map((component, idx) => (
              <Card key={idx} className="p-4">
                <h4 className="font-semibold mb-2">{component.title}</h4>
                <ul className="space-y-1">
                  {component.items.map((item, itemIdx) => (
                    <li key={itemIdx} className="text-sm text-gray-600 flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </Card>
            ))}
          </div>
        </div>

        {/* Data Flow */}
        <div className="space-y-4">
          <h3 className="text-2xl font-semibold">Data Flow</h3>
          <div className="grid md:grid-cols-2 gap-4">
            {dataFlows.map((flow, idx) => (
              <Card key={idx} className="p-4">
                <h4 className="font-semibold mb-2">{flow.title}</h4>
                <code className="text-sm bg-gray-100 p-2 rounded block break-all">
                  {flow.flow}
                </code>
              </Card>
            ))}
          </div>
        </div>

        {/* Key Design Principles */}
        <div className="space-y-4">
          <h3 className="text-2xl font-semibold">Key Design Principles</h3>
          <div className="space-y-2">
            {designPrinciples.map((item, idx) => (
              <div key={idx} className="flex gap-4 p-3 rounded-lg bg-gray-50">
                <span className="font-semibold text-primary">{item.principle}:</span>
                <span className="text-gray-600">{item.desc}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
