import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Code } from 'lucide-react';

export function GettingStarted() {
  return (
    <section id="getting-started" className="space-y-6 py-12 border-t">
      <div className="space-y-3">
        <h2 className="text-3xl font-bold tracking-tighter">Getting Started</h2>
        <p className="text-gray-600">Quick setup guide to run the Healthcare Supply Chain Management System locally.</p>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Prerequisites</CardTitle>
            <CardDescription>Ensure you have these installed on your system</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-gray-600">
              <li>• Node.js 18.0 or higher</li>
              <li>• npm or yarn package manager</li>
              <li>• Git</li>
              <li>• SQLite (comes bundled with Prisma)</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Installation Steps</CardTitle>
            <CardDescription>Follow these steps to set up the project</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-semibold mb-2">1. Clone the Repository</h4>
              <div className="bg-gray-100 p-3 rounded-lg">
                <code className="text-sm">
                  git clone https://github.com/yourusername/healthcare-supply-chain.git
                </code>
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-2">2. Install Dependencies</h4>
              <div className="bg-gray-100 p-3 rounded-lg">
                <code className="text-sm">
                  cd healthcare-supply-chain<br />
                  npm install
                </code>
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-2">3. Set up Environment Variables</h4>
              <div className="bg-gray-100 p-3 rounded-lg">
                <code className="text-sm">
                  cp .env.example .env
                </code>
              </div>
              <p className="text-sm text-gray-600 mt-2">
                Update the .env file with your configuration settings
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-2">4. Initialize Database</h4>
              <div className="bg-gray-100 p-3 rounded-lg">
                <code className="text-sm">
                  npx prisma db push<br />
                  npx prisma generate
                </code>
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-2">5. Run Development Server</h4>
              <div className="bg-gray-100 p-3 rounded-lg">
                <code className="text-sm">
                  npm run dev
                </code>
              </div>
              <p className="text-sm text-gray-600 mt-2">
                The application will be available at http://localhost:3000
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Initial Setup</CardTitle>
            <CardDescription>Configure the system after installation</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-gray-600">
              <li>• Create an admin account through the registration page</li>
              <li>• Set up initial inventory categories</li>
              <li>• Configure supplier information</li>
              <li>• Add initial stock items</li>
              <li>• Set up alert thresholds for low stock</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
