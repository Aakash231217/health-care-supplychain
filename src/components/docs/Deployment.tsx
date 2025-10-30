import { Card } from '@/components/ui/card';

export function Deployment() {
  return (
    <section id="deployment" className="mb-16">
      <h2 className="text-3xl font-bold mb-6">Deployment Architecture</h2>
      
      <Card className="p-6 bg-gray-900 text-white overflow-x-auto mb-6">
        <pre className="text-xs whitespace-pre font-mono">
{`┌─────────────────────────────────────────────────────────────┐
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
└─────────────────────────────────────────────────────────────┘`}
        </pre>
      </Card>

      <div className="space-y-6">
        <div>
          <h3 className="text-xl font-semibold mb-3">Vercel Deployment (Recommended)</h3>
          <ol className="list-decimal list-inside space-y-2 ml-4">
            <li>Push code to GitHub</li>
            <li>Import project in Vercel</li>
            <li>Add environment variables</li>
            <li>Deploy</li>
          </ol>
        </div>

        <div>
          <h3 className="text-xl font-semibold mb-3">Manual Deployment</h3>
          <Card className="p-4 bg-gray-100">
            <pre className="text-sm">
{`npm run build
npm run start`}
            </pre>
          </Card>
        </div>

        <div>
          <h3 className="text-xl font-semibold mb-3">Environment Variables</h3>
          <div className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">Required variables:</h4>
              <ul className="space-y-1 text-sm">
                <li>• <code className="bg-gray-100 px-1">DATABASE_URL</code> - PostgreSQL connection</li>
                <li>• <code className="bg-gray-100 px-1">NEXTAUTH_URL</code> - Your app URL</li>
                <li>• <code className="bg-gray-100 px-1">NEXTAUTH_SECRET</code> - Secret for NextAuth</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">Optional:</h4>
              <ul className="space-y-1 text-sm">
                <li>• <code className="bg-gray-100 px-1">UPSTASH_REDIS_REST_URL</code> - Redis cache</li>
                <li>• <code className="bg-gray-100 px-1">RESEND_API_KEY</code> - Email service</li>
                <li>• <code className="bg-gray-100 px-1">UPLOADTHING_SECRET</code> - File uploads</li>
                <li>• <code className="bg-gray-100 px-1">NEXT_PUBLIC_SENTRY_DSN</code> - Error monitoring</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
