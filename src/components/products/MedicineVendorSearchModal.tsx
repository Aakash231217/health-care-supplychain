'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { trpc } from '@/lib/trpc/client';
import { 
  Loader2, Search, Building2, Package, Globe, Award, 
  TrendingUp, ExternalLink, Mail, Phone, MapPin, Save,
  AlertCircle, CheckCircle2, Factory, Store, Truck
} from 'lucide-react';
import { toast } from 'sonner';

interface MedicineVendorSearchModalProps {
  productId?: string;
  productName?: string;
  concentration?: string;
  trigger?: React.ReactNode;
}

interface VendorCardProps {
  vendor: any;
  productId?: string;
  onSave?: () => void;
}

function VendorCard({ vendor, productId, onSave }: VendorCardProps) {
  const [saving, setSaving] = useState(false);
  
  const saveVendorMutation = trpc.product.saveDiscoveredVendor.useMutation({
    onSuccess: (data) => {
      toast.success(
        data.created ? 'Vendor saved successfully!' : 'Vendor already exists in system'
      );
      setSaving(false);
      onSave?.();
    },
    onError: (error) => {
      toast.error('Failed to save vendor', {
        description: error.message,
      });
      setSaving(false);
    },
  });

  const handleSaveVendor = () => {
    setSaving(true);
    saveVendorMutation.mutate({
      companyName: vendor.companyName,
      website: vendor.website,
      businessType: vendor.businessType,
      contactInfo: vendor.contactInfo || {},
      certifications: vendor.certifications || [],
      productId,
    });
  };

  const getBusinessTypeIcon = (type: string) => {
    switch (type) {
      case 'Wholesaler':
        return <Package className="h-4 w-4" />;
      case 'Distributor':
        return <Truck className="h-4 w-4" />;
      case 'Manufacturer':
        return <Factory className="h-4 w-4" />;
      case 'Retailer':
        return <Store className="h-4 w-4" />;
      default:
        return <Building2 className="h-4 w-4" />;
    }
  };

  const getBusinessTypeColor = (type: string) => {
    switch (type) {
      case 'Wholesaler':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'Distributor':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'Manufacturer':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'Retailer':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
    }
  };

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg flex items-center gap-2">
              {getBusinessTypeIcon(vendor.businessType)}
              {vendor.companyName}
            </CardTitle>
            <div className="flex items-center gap-2 mt-2">
              <Badge className={getBusinessTypeColor(vendor.businessType)}>
                {vendor.businessType}
              </Badge>
              <Badge variant="outline" className="text-xs">
                Confidence: {(vendor.confidence * 100).toFixed(0)}%
              </Badge>
            </div>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={handleSaveVendor}
            disabled={saving}
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Save
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Snippet */}
        {vendor.snippet && (
          <p className="text-sm text-gray-600 line-clamp-2">{vendor.snippet}</p>
        )}

        {/* Volume Indicators */}
        {vendor.volumeIndicators && (
          <div className="flex flex-wrap gap-2">
            {vendor.volumeIndicators.bulkSupplier && (
              <Badge variant="secondary" className="text-xs">
                <TrendingUp className="h-3 w-3 mr-1" />
                Bulk Supplier
              </Badge>
            )}
            {vendor.volumeIndicators.minimumOrderQty && (
              <Badge variant="secondary" className="text-xs">
                MOQ: {vendor.volumeIndicators.minimumOrderQty}
              </Badge>
            )}
            {vendor.volumeIndicators.servesHospitals && (
              <Badge variant="secondary" className="text-xs">
                Serves Hospitals
              </Badge>
            )}
            {vendor.volumeIndicators.internationalShipping && (
              <Badge variant="secondary" className="text-xs">
                <Globe className="h-3 w-3 mr-1" />
                International
              </Badge>
            )}
          </div>
        )}

        {/* Certifications */}
        {vendor.certifications && vendor.certifications.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {vendor.certifications.map((cert: string) => (
              <Badge key={cert} variant="outline" className="text-xs text-green-700 border-green-300">
                <Award className="h-3 w-3 mr-1" />
                {cert}
              </Badge>
            ))}
          </div>
        )}

        {/* Contact Info */}
        <div className="space-y-2 text-sm">
          {vendor.website && (
            <a
              href={vendor.website}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-blue-600 hover:underline"
            >
              <ExternalLink className="h-3 w-3" />
              Visit Website
            </a>
          )}
          {vendor.contactInfo?.email && (
            <div className="flex items-center gap-2 text-gray-600">
              <Mail className="h-3 w-3" />
              {vendor.contactInfo.email}
            </div>
          )}
          {vendor.contactInfo?.phone && (
            <div className="flex items-center gap-2 text-gray-600">
              <Phone className="h-3 w-3" />
              {vendor.contactInfo.phone}
            </div>
          )}
          {vendor.contactInfo?.address && (
            <div className="flex items-center gap-2 text-gray-600">
              <MapPin className="h-3 w-3" />
              {vendor.contactInfo.address}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export function MedicineVendorSearchModal({
  productId,
  productName,
  concentration,
  trigger,
}: MedicineVendorSearchModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [medicineName, setMedicineName] = useState(productName || '');
  const [dosage, setDosage] = useState(concentration || '');
  const [country, setCountry] = useState('');
  const [searchDepth, setSearchDepth] = useState(3);
  const [useAIAggregation, setUseAIAggregation] = useState(true);
  const [searchResult, setSearchResult] = useState<any>(null);

  const searchMutation = trpc.product.searchVendorsByMedicineName.useMutation({
    onSuccess: (data) => {
      setSearchResult(data);
      toast.success(`Found ${data.vendorsFound} vendors!`);
    },
    onError: (error) => {
      toast.error('Search failed', {
        description: error.message,
      });
    },
  });

  const handleSearch = () => {
    if (!medicineName.trim()) {
      toast.error('Please enter a medicine name');
      return;
    }

    setSearchResult(null);
    searchMutation.mutate({
      medicineName: medicineName.trim(),
      dosage: dosage.trim() || undefined,
      country: country.trim() || undefined,
      searchDepth,
      useAIAggregation,
    });
  };

  const getCategoryCount = (category: string) => {
    if (!searchResult) return 0;
    return searchResult.vendors[category]?.length || 0;
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" className="gap-2">
            <Search className="h-4 w-4" />
            Find Vendors
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Find Vendors for Medicine
          </DialogTitle>
          <DialogDescription>
            Search for wholesalers, distributors, and suppliers of specific medicines
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Search Form */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="medicine-name">Medicine Name *</Label>
              <Input
                id="medicine-name"
                value={medicineName}
                onChange={(e) => setMedicineName(e.target.value)}
                placeholder="e.g., Amoxicillin"
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>
            <div>
              <Label htmlFor="dosage">Dosage/Concentration</Label>
              <Input
                id="dosage"
                value={dosage}
                onChange={(e) => setDosage(e.target.value)}
                placeholder="e.g., 500mg"
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>
            <div>
              <Label htmlFor="country">Country/Region</Label>
              <Input
                id="country"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                placeholder="e.g., USA, Europe, Latvia"
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>
            <div>
              <Label htmlFor="search-depth">Search Depth</Label>
              <select
                id="search-depth"
                value={searchDepth}
                onChange={(e) => setSearchDepth(Number(e.target.value))}
                className="w-full px-3 py-2 border rounded-md"
              >
                <option value={1}>Quick (1 query)</option>
                <option value={3}>Standard (3 queries)</option>
                <option value={5}>Deep (5 queries)</option>
              </select>
            </div>
          </div>

          {/* AI Aggregation Toggle */}
          <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
            <div className="flex items-center gap-2">
              <div>
                <Label htmlFor="ai-aggregation" className="font-semibold">
                  Use AI-Powered Search
                </Label>
                <p className="text-sm text-gray-600 mt-1">
                  Combines ChatGPT, Google, and Bing results for comprehensive vendor discovery
                </p>
              </div>
            </div>
            <Switch
              id="ai-aggregation"
              checked={useAIAggregation}
              onCheckedChange={setUseAIAggregation}
            />
          </div>

          <Button 
            onClick={handleSearch} 
            disabled={searchMutation.isPending}
            className="w-full gap-2"
          >
            {searchMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Searching... {useAIAggregation ? '(20-40s)' : '(30-60s)'}
              </>
            ) : (
              <>
                <Search className="h-4 w-4" />
                Search for Vendors
              </>
            )}
          </Button>

          {/* Results */}
          {searchResult && (
            <div className="space-y-4">
              {/* Summary */}
              <Card>
                <CardContent className="pt-6">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                    <div>
                      <p className="text-2xl font-bold text-blue-600">{getCategoryCount('wholesalers')}</p>
                      <p className="text-sm text-gray-500">Wholesalers</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-purple-600">{getCategoryCount('distributors')}</p>
                      <p className="text-sm text-gray-500">Distributors</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-green-600">{getCategoryCount('manufacturers')}</p>
                      <p className="text-sm text-gray-500">Manufacturers</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-orange-600">{getCategoryCount('retailers')}</p>
                      <p className="text-sm text-gray-500">Retailers</p>
                    </div>
                  </div>
                  <div className="mt-4 flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500">
                        Search completed in {searchResult.searchMetadata.searchTime.toFixed(1)}s
                      </span>
                      {searchResult.searchMetadata.sourcesUsed && (
                        <Badge variant="outline" className="text-xs">
                          Sources: {searchResult.searchMetadata.sourcesUsed.join(', ')}
                        </Badge>
                      )}
                    </div>
                    <Badge 
                      variant={searchResult.searchMetadata.dataQuality === 'High' ? 'default' : 
                               searchResult.searchMetadata.dataQuality === 'Medium' ? 'secondary' : 'outline'}
                    >
                      {searchResult.searchMetadata.dataQuality} Quality Data
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              {/* Tabbed Results */}
              <Tabs defaultValue="wholesalers" className="w-full">
                <TabsList className="grid w-full grid-cols-5">
                  <TabsTrigger value="wholesalers">
                    Wholesalers ({getCategoryCount('wholesalers')})
                  </TabsTrigger>
                  <TabsTrigger value="distributors">
                    Distributors ({getCategoryCount('distributors')})
                  </TabsTrigger>
                  <TabsTrigger value="manufacturers">
                    Manufacturers ({getCategoryCount('manufacturers')})
                  </TabsTrigger>
                  <TabsTrigger value="retailers">
                    Retailers ({getCategoryCount('retailers')})
                  </TabsTrigger>
                  <TabsTrigger value="uncategorized">
                    Other ({getCategoryCount('uncategorized')})
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="wholesalers" className="space-y-4">
                  {searchResult.vendors.wholesalers.length > 0 ? (
                    searchResult.vendors.wholesalers.map((vendor: any, index: number) => (
                      <VendorCard 
                        key={index} 
                        vendor={vendor} 
                        productId={productId}
                        onSave={() => {
                          // Optionally refresh or update UI
                        }}
                      />
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      No wholesalers found
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="distributors" className="space-y-4">
                  {searchResult.vendors.distributors.length > 0 ? (
                    searchResult.vendors.distributors.map((vendor: any, index: number) => (
                      <VendorCard 
                        key={index} 
                        vendor={vendor} 
                        productId={productId}
                        onSave={() => {}}
                      />
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      No distributors found
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="manufacturers" className="space-y-4">
                  {searchResult.vendors.manufacturers.length > 0 ? (
                    searchResult.vendors.manufacturers.map((vendor: any, index: number) => (
                      <VendorCard 
                        key={index} 
                        vendor={vendor} 
                        productId={productId}
                        onSave={() => {}}
                      />
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      No manufacturers found
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="retailers" className="space-y-4">
                  {searchResult.vendors.retailers.length > 0 ? (
                    searchResult.vendors.retailers.map((vendor: any, index: number) => (
                      <VendorCard 
                        key={index} 
                        vendor={vendor} 
                        productId={productId}
                        onSave={() => {}}
                      />
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      No retailers found
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="uncategorized" className="space-y-4">
                  {searchResult.vendors.uncategorized.length > 0 ? (
                    searchResult.vendors.uncategorized.map((vendor: any, index: number) => (
                      <VendorCard 
                        key={index} 
                        vendor={vendor} 
                        productId={productId}
                        onSave={() => {}}
                      />
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      No uncategorized vendors found
                    </div>
                  )}
                </TabsContent>
              </Tabs>

              {/* AI Insights */}
              {searchResult.searchMetadata.aiInsights && (
                <Card className="border-blue-200 bg-blue-50">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <AlertCircle className="h-5 w-5 text-blue-600" />
                      AI Analysis & Insights
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {searchResult.searchMetadata.aiInsights.summary && (
                      <div>
                        <h4 className="font-medium text-sm text-blue-900 mb-1">Summary</h4>
                        <p className="text-sm text-blue-700">{searchResult.searchMetadata.aiInsights.summary}</p>
                      </div>
                    )}
                    {searchResult.searchMetadata.aiInsights.marketAnalysis && (
                      <div>
                        <h4 className="font-medium text-sm text-blue-900 mb-1">Market Analysis</h4>
                        <p className="text-sm text-blue-700">{searchResult.searchMetadata.aiInsights.marketAnalysis}</p>
                      </div>
                    )}
                    {searchResult.searchMetadata.aiInsights.recommendations && searchResult.searchMetadata.aiInsights.recommendations.length > 0 && (
                      <div>
                        <h4 className="font-medium text-sm text-blue-900 mb-1">Recommendations</h4>
                        <ul className="text-sm text-blue-700 list-disc list-inside space-y-1">
                          {searchResult.searchMetadata.aiInsights.recommendations.map((rec: string, index: number) => (
                            <li key={index}>{rec}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {searchResult.searchMetadata.aiInsights.nextSteps && searchResult.searchMetadata.aiInsights.nextSteps.length > 0 && (
                      <div>
                        <h4 className="font-medium text-sm text-blue-900 mb-1">Next Steps</h4>
                        <ul className="text-sm text-blue-700 list-disc list-inside space-y-1">
                          {searchResult.searchMetadata.aiInsights.nextSteps.map((step: string, index: number) => (
                            <li key={index}>{step}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Warnings */}
              {searchResult.searchMetadata.warnings && searchResult.searchMetadata.warnings.length > 0 && (
                <Card className="border-yellow-200 bg-yellow-50">
                  <CardContent className="pt-4">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                      <div>
                        <p className="font-medium text-yellow-800">Search Warnings</p>
                        <ul className="mt-1 text-sm text-yellow-700 list-disc list-inside">
                          {searchResult.searchMetadata.warnings.map((warning: string, index: number) => (
                            <li key={index}>{warning}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}