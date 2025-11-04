'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { trpc } from '@/lib/trpc/client';
import { Loader2, Search, Building2, Users, Package, Globe, Award, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';

interface VendorResearchButtonProps {
  vendorId: string;
  vendorName: string;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg';
}

export function VendorResearchButton({
  vendorId,
  vendorName,
  variant = 'outline',
  size = 'default',
}: VendorResearchButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isResearching, setIsResearching] = useState(false);

  const utils = trpc.useUtils();

  // Get existing intelligence
  const { data: intelligence, isLoading } = trpc.vendor.getVendorIntelligence.useQuery(
    { vendorId },
    { enabled: isOpen }
  );

  // Research mutation
  const researchMutation = trpc.vendor.researchVendor.useMutation({
    onSuccess: (data) => {
      toast.success('Vendor research completed!', {
        description: `${vendorName} classified as: ${data.intelligence.supplierClassification}`,
      });
      utils.vendor.getVendorIntelligence.invalidate({ vendorId });
      setIsResearching(false);
    },
    onError: (error) => {
      toast.error('Research failed', {
        description: error.message,
      });
      setIsResearching(false);
    },
  });

  const handleResearch = async () => {
    setIsResearching(true);
    researchMutation.mutate({ vendorId });
  };

  const getClassificationColor = (classification?: string | null) => {
    switch (classification) {
      case 'Bulk Supplier':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'Mid-size Distributor':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'Small Retailer':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
    }
  };

  const isDataStale =
    intelligence?.lastResearchedAt &&
    Date.now() - new Date(intelligence.lastResearchedAt).getTime() > 30 * 24 * 60 * 60 * 1000;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant={variant} size={size} className="gap-2">
          <Search className="h-4 w-4" />
          Research Vendor
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Vendor Intelligence: {vendorName}
          </DialogTitle>
          <DialogDescription>
            Automated research and classification of vendor capabilities
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        ) : intelligence && intelligence.researchStatus === 'COMPLETED' ? (
          <div className="space-y-6">
            {/* Classification Header */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500 mb-2">Classification</p>
                    <Badge className={`text-lg px-4 py-1 ${getClassificationColor(intelligence.supplierClassification)}`}>
                      {intelligence.supplierClassification || 'Unknown'}
                    </Badge>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">Confidence Score</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {((intelligence.confidenceScore || 0) * 100).toFixed(0)}%
                    </p>
                  </div>
                </div>
                {intelligence.classificationScore !== null && (
                  <div className="mt-4 pt-4 border-t">
                    <p className="text-sm text-gray-500">Classification Score</p>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{
                            width: `${Math.min(Math.max((intelligence.classificationScore + 10) * 5, 0), 100)}%`,
                          }}
                        />
                      </div>
                      <span className="text-sm font-medium">{intelligence.classificationScore}</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Company Profile */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Building2 className="h-4 w-4" />
                  Company Profile
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-4">
                {intelligence.businessType && (
                  <div>
                    <p className="text-sm text-gray-500">Business Type</p>
                    <p className="font-medium">{intelligence.businessType}</p>
                  </div>
                )}
                {intelligence.companySize && (
                  <div>
                    <p className="text-sm text-gray-500">Company Size</p>
                    <p className="font-medium">{intelligence.companySize}</p>
                  </div>
                )}
                {intelligence.employeeCount && (
                  <div>
                    <p className="text-sm text-gray-500">Employees</p>
                    <p className="font-medium flex items-center gap-1">
                      <Users className="h-4 w-4 text-gray-400" />
                      {intelligence.employeeCount}
                    </p>
                  </div>
                )}
                {intelligence.yearsInBusiness && (
                  <div>
                    <p className="text-sm text-gray-500">Years in Business</p>
                    <p className="font-medium">{intelligence.yearsInBusiness} years</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Order Capacity */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Package className="h-4 w-4" />
                  Order Capacity
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-4">
                {intelligence.minimumOrderQty && (
                  <div>
                    <p className="text-sm text-gray-500">Minimum Order Quantity</p>
                    <p className="font-medium">{intelligence.minimumOrderQty.toLocaleString()} units</p>
                  </div>
                )}
                {intelligence.typicalOrderSize && (
                  <div>
                    <p className="text-sm text-gray-500">Typical Order Size</p>
                    <p className="font-medium">{intelligence.typicalOrderSize}</p>
                  </div>
                )}
                {intelligence.orderCapacityScore && (
                  <div>
                    <p className="text-sm text-gray-500">Capacity Score</p>
                    <p className="font-medium flex items-center gap-1">
                      <TrendingUp className="h-4 w-4 text-green-500" />
                      {intelligence.orderCapacityScore}/10
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Market Presence */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Globe className="h-4 w-4" />
                  Market Presence
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  {intelligence.geographicCoverage && (
                    <div>
                      <p className="text-sm text-gray-500">Geographic Coverage</p>
                      <p className="font-medium">{intelligence.geographicCoverage}</p>
                    </div>
                  )}
                  {intelligence.numberOfLocations && (
                    <div>
                      <p className="text-sm text-gray-500">Number of Locations</p>
                      <p className="font-medium">{intelligence.numberOfLocations}</p>
                    </div>
                  )}
                </div>
                {intelligence.primaryClientTypes && intelligence.primaryClientTypes.length > 0 && (
                  <div>
                    <p className="text-sm text-gray-500 mb-2">Primary Client Types</p>
                    <div className="flex flex-wrap gap-2">
                      {intelligence.primaryClientTypes.map((type) => (
                        <Badge key={type} variant="secondary">
                          {type}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Certifications */}
            {intelligence.certificationsFound && intelligence.certificationsFound.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Award className="h-4 w-4" />
                    Certifications
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {intelligence.certificationsFound.map((cert) => (
                      <Badge key={cert} variant="outline" className="text-green-700 border-green-300">
                        {cert}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Metadata */}
            <Card>
              <CardContent className="pt-6">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  {intelligence.officialWebsite && (
                    <div>
                      <p className="text-gray-500">Official Website</p>
                      <a
                        href={intelligence.officialWebsite}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        {intelligence.officialWebsite}
                      </a>
                    </div>
                  )}
                  {intelligence.dataSource && (
                    <div>
                      <p className="text-gray-500">Data Sources</p>
                      <p className="font-medium">{intelligence.dataSource}</p>
                    </div>
                  )}
                  {intelligence.lastResearchedAt && (
                    <div>
                      <p className="text-gray-500">Last Researched</p>
                      <p className="font-medium">
                        {new Date(intelligence.lastResearchedAt).toLocaleDateString()}
                        {isDataStale && <span className="text-yellow-600 ml-2">(Stale)</span>}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Re-research Button */}
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={handleResearch}
                disabled={isResearching}
                className="gap-2"
              >
                {isResearching ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Researching...
                  </>
                ) : (
                  <>
                    <Search className="h-4 w-4" />
                    Re-research
                  </>
                )}
              </Button>
            </div>
          </div>
        ) : intelligence?.researchStatus === 'FAILED' ? (
          <div className="text-center py-12">
            <p className="text-red-600 mb-4">Research failed</p>
            <p className="text-sm text-gray-500 mb-6">{intelligence.researchError}</p>
            <Button onClick={handleResearch} disabled={isResearching} className="gap-2">
              {isResearching ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Researching...
                </>
              ) : (
                <>
                  <Search className="h-4 w-4" />
                  Try Again
                </>
              )}
            </Button>
          </div>
        ) : (
          <div className="text-center py-12">
            <Building2 className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No Research Data Available</h3>
            <p className="text-sm text-gray-500 mb-6">
              Click below to automatically research this vendor's capabilities and classification.
            </p>
            <Button onClick={handleResearch} disabled={isResearching} size="lg" className="gap-2">
              {isResearching ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Researching... (30-60s)
                </>
              ) : (
                <>
                  <Search className="h-4 w-4" />
                  Start Research
                </>
              )}
            </Button>
            <p className="text-xs text-gray-400 mt-4">
              This will search the web for company information, certifications, and order capacity.
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
