import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, FileText, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import api from '@/api/axiosConfig';

interface InvoiceRecord {
  id: string;
  tenantName: string;
  propertyName?: string; // <-- NEW
  floorName?: string;    // <-- NEW
  unitName: string;
  month: string;
  consumption: number;
  totalAmount: number;
  status: string;
  created_at: string;
  receipt_number?: string;
}

const Invoices = () => {
  const [invoices, setInvoices] = useState<InvoiceRecord[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const response = await api.get('billing/history/');
        setInvoices(response.data);
      } catch (error) {
        toast.error('Failed to load invoice history');
      } finally {
        setIsLoading(false);
      }
    };
    fetchHistory();
  }, []);

  const filteredInvoices = invoices.filter(inv => {
    const term = searchTerm.toLowerCase();
    return (
      inv.tenantName?.toLowerCase().includes(term) ||
      inv.propertyName?.toLowerCase().includes(term) || // <-- Search by property!
      inv.unitName?.toLowerCase().includes(term) ||
      inv.month?.toLowerCase().includes(term) ||
      (inv.receipt_number && inv.receipt_number.toLowerCase().includes(term))
    );
  });

  if (isLoading) {
    return <div className="flex justify-center items-center min-h-[50vh]"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-display font-bold">Invoices Ledger</h1>
          <p className="text-muted-foreground">Historical view of all generated invoices and receipts</p>
        </div>
        <div className="relative w-full md:w-80">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search tenant, property, or ref..." 
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left p-4 font-medium text-muted-foreground">Date Generated</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Billing Month</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Tenant</th>
                  {/* <-- NEW: Property & Floor Header --> */}
                  <th className="text-left p-4 font-medium text-muted-foreground">Property & Floor</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Unit</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Total</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Status</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Reference</th>
                </tr>
              </thead>
              <tbody>
                {filteredInvoices.length > 0 ? filteredInvoices.map(inv => (
                  <tr key={inv.id} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                    <td className="p-4 text-muted-foreground">{inv.created_at}</td>
                    <td className="p-4 font-medium">{inv.month}</td>
                    <td className="p-4">{inv.tenantName}</td>
                    
                    {/* <-- NEW: Stacked Property and Floor --> */}
                    <td className="p-4">
                      <div className="flex flex-col">
                        <span className="font-medium text-foreground">{inv.propertyName || '—'}</span>
                        <span className="text-xs text-muted-foreground">{inv.floorName || '—'}</span>
                      </div>
                    </td>

                    <td className="p-4 font-bold">{inv.unitName}</td>
                    <td className="p-4 font-bold">KES {Number(inv.totalAmount).toLocaleString()}</td>
                    <td className="p-4">
                      <Badge className={
                        inv.status.toLowerCase() === 'paid' ? 'bg-success text-success-foreground'
                          : inv.status.toLowerCase() === 'unpaid' ? 'bg-warning text-warning-foreground'
                          : 'bg-muted text-muted-foreground'
                      }>
                        {inv.status.toUpperCase()}
                      </Badge>
                    </td>
                    
                    <td className="p-4 text-muted-foreground font-mono text-xs">
                      {inv.receipt_number ? (
                         <span className="bg-muted px-2 py-1 rounded select-all">
                           {inv.receipt_number}
                         </span>
                      ) : (
                        <span>—</span>
                      )}
                    </td>

                  </tr>
                )) : (
                  <tr>
                    {/* Updated colSpan from 8 to 9 */}
                    <td colSpan={9} className="p-12 text-center text-muted-foreground">
                      <div className="flex flex-col items-center justify-center">
                        <FileText className="h-8 w-8 mb-2 opacity-20" />
                        <p>{searchTerm ? "No invoices matched your search." : "No invoices found in the ledger."}</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Invoices;