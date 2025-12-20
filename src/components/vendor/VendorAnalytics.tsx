import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { IndianRupee, Package, ShoppingCart, TrendingUp } from 'lucide-react';

interface VendorAnalyticsProps {
  stats: {
    totalProducts: number;
    activeProducts: number;
    totalOrders: number;
    totalRevenue: number;
  };
}

export function VendorAnalytics({ stats }: VendorAnalyticsProps) {
  const averageOrderValue = stats.totalOrders > 0
    ? Math.round(stats.totalRevenue / stats.totalOrders)
    : 0;

  const activeRate = stats.totalProducts > 0
    ? Math.round((stats.activeProducts / stats.totalProducts) * 100)
    : 0;

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <IndianRupee className="h-4 w-4" />
              Total Revenue
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold flex items-center">
              <IndianRupee className="h-6 w-6" />
              {stats.totalRevenue.toLocaleString('en-IN')}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              From {stats.totalOrders} orders
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Average Order Value
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold flex items-center">
              <IndianRupee className="h-6 w-6" />
              {averageOrderValue.toLocaleString('en-IN')}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Per order
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              Product Catalog
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {stats.totalProducts}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.activeProducts} active ({activeRate}%)
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <ShoppingCart className="h-4 w-4" />
              Total Orders
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {stats.totalOrders}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Orders with your products
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Performance Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Performance Summary</CardTitle>
          <CardDescription>Overview of your vendor performance</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
              <div>
                <p className="font-medium">Catalog Health</p>
                <p className="text-sm text-muted-foreground">
                  {stats.activeProducts} of {stats.totalProducts} products are active
                </p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-primary">{activeRate}%</p>
                <p className="text-xs text-muted-foreground">Active rate</p>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
              <div>
                <p className="font-medium">Revenue Per Product</p>
                <p className="text-sm text-muted-foreground">
                  Average revenue generated per product
                </p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold flex items-center justify-end">
                  <IndianRupee className="h-5 w-5" />
                  {stats.totalProducts > 0
                    ? Math.round(stats.totalRevenue / stats.totalProducts).toLocaleString('en-IN')
                    : 0}
                </p>
                <p className="text-xs text-muted-foreground">Per product</p>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
              <div>
                <p className="font-medium">Conversion</p>
                <p className="text-sm text-muted-foreground">
                  Products that have been ordered
                </p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-primary">
                  {stats.totalOrders}
                </p>
                <p className="text-xs text-muted-foreground">Total orders</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
