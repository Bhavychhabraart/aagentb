import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, ShoppingCart, IndianRupee } from 'lucide-react';
import { format } from 'date-fns';

interface OrderItem {
  id: string;
  item_name: string;
  item_price: number;
  item_image_url: string | null;
  order_id: string;
  created_at: string;
  order?: {
    id: string;
    client_name: string;
    client_email: string | null;
    status: string;
    created_at: string;
  };
}

export function VendorOrdersTable() {
  const { user } = useAuth();
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchOrders();
    }
  }, [user]);

  const fetchOrders = async () => {
    if (!user) return;
    setLoading(true);

    // Fetch order items for this vendor with order details
    const { data, error } = await supabase
      .from('order_items')
      .select(`
        id,
        item_name,
        item_price,
        item_image_url,
        order_id,
        created_at,
        orders!inner (
          id,
          client_name,
          client_email,
          status,
          created_at
        )
      `)
      .eq('vendor_id', user.id)
      .order('created_at', { ascending: false });

    if (!error && data) {
      // Transform the data to flatten the orders relationship
      const transformed = data.map(item => ({
        ...item,
        order: Array.isArray(item.orders) ? item.orders[0] : item.orders,
      }));
      setOrderItems(transformed as unknown as OrderItem[]);
    }
    setLoading(false);
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'bg-green-500';
      case 'pending':
        return 'bg-yellow-500';
      case 'cancelled':
        return 'bg-red-500';
      default:
        return 'bg-muted';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-12 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (orderItems.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <ShoppingCart className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">No orders yet</h3>
          <p className="text-muted-foreground">
            Orders containing your products will appear here.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShoppingCart className="h-5 w-5" />
          Orders ({orderItems.length} items)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product</TableHead>
              <TableHead>Client</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orderItems.map(item => (
              <TableRow key={item.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    {item.item_image_url && (
                      <img
                        src={item.item_image_url}
                        alt={item.item_name}
                        className="w-10 h-10 rounded object-cover"
                      />
                    )}
                    <span className="font-medium">{item.item_name}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div>
                    <p className="font-medium">{item.order?.client_name || '-'}</p>
                    {item.order?.client_email && (
                      <p className="text-xs text-muted-foreground">{item.order.client_email}</p>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center">
                    <IndianRupee className="h-4 w-4" />
                    {item.item_price.toLocaleString('en-IN')}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge className={getStatusColor(item.order?.status || 'pending')}>
                    {item.order?.status || 'Pending'}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {item.order?.created_at
                    ? format(new Date(item.order.created_at), 'MMM d, yyyy')
                    : '-'}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
