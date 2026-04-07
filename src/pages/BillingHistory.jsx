import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, FileText, Search, CreditCard, X } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/api/axiosConfig';

const BillingHistory = () => {
  const [invoices, setInvoices] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [isPaying, setIsPaying] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  const fetchHistory = async (isBackground = false) => {
    try {
      const response = await api.get('billing/history/');
      setInvoices(response.data);
    } catch (error) {
      if (!isBackground) toast.error('Failed to load billing history');
    } finally {
      if (!isBackground) setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();

    const interval = setInterval(() => {
      fetchHistory(true); 
    }, 10000);

    return () => clearInterval(interval); 
  }, []);

  const openPaymentModal = (invoice) => {
    setSelectedInvoice(invoice);
    setShowModal(true);
  };

  const handleMpesaPayment = async (e) => {
    e.preventDefault();
    if (!phoneNumber || !selectedInvoice) return;

    setIsPaying(true);
    const token = localStorage.getItem('access_token');

    try {
      const response = await fetch('http://127.0.0.1:8000/api/billing/mpesa/pay/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({
          invoice_id: selectedInvoice.id, 
          phone_number: phoneNumber
        })
      });

      const data = await response.json();

      if (response.ok) {
        setShowModal(false);
        setPhoneNumber('');
        toast.success(data.message || 'M-Pesa STK push initiated. Check your phone.');
      } else {
        toast.error(`Payment failed: ${data.error || "Unknown error"}`);
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("Network error. Make sure your Django server is running.");
    } finally {
      setIsPaying(false);
    }
  };

  const filteredInvoices = invoices.filter(inv => 
    inv.month.toLowerCase().includes(searchTerm.toLowerCase()) ||
    inv.status.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (inv.receipt_number && inv.receipt_number.toLowerCase().includes(searchTerm.toLowerCase())) // Now they can search by receipt!
  );

  if (isLoading) {
    return <div className="flex justify-center items-center min-h-[50vh]"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6 animate-fade-in relative">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-display font-bold">Billing History</h1>
          <p className="text-muted-foreground">Your invoices and payment records</p>
        </div>
        <div className="relative w-full md:w-64">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search month, status, or ref..." 
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
                  <th className="text-left p-4 font-medium text-muted-foreground">Month</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Date Issued</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Consumption</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Amount</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Status</th>
                  {/* --- NEW COLUMN HEADER --- */}
                  <th className="text-left p-4 font-medium text-muted-foreground">Reference</th>
                  <th className="text-right p-4 font-medium text-muted-foreground">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredInvoices.length > 0 ? filteredInvoices.map(inv => (
                  <tr key={inv.id} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                    <td className="p-4 font-medium">{inv.month}</td>
                    <td className="p-4 text-muted-foreground">{inv.created_at}</td>
                    <td className="p-4">{inv.consumption} units</td>
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
                    
                    {/* --- NEW COLUMN DATA --- */}
                    <td className="p-4 text-muted-foreground font-mono text-xs">
                      {inv.receipt_number || '-'}
                    </td>

                    <td className="p-4 text-right">
                      {inv.status.toLowerCase() === 'unpaid' ? (
                        <Button 
                          size="sm" 
                          onClick={() => openPaymentModal(inv)}
                          className="bg-success text-success-foreground hover:bg-success/90 h-8"
                        >
                          <CreditCard className="h-4 w-4 mr-1" /> Pay
                        </Button>
                      ) : (
                        <span className="text-muted-foreground text-xs font-medium">Settled</span>
                      )}
                    </td>
                  </tr>
                )) : (
                  <tr>
                    {/* Updated colSpan from 6 to 7 to match new column count */}
                    <td colSpan={7} className="p-12 text-center text-muted-foreground">
                      <div className="flex flex-col items-center justify-center">
                        <FileText className="h-8 w-8 mb-2 opacity-20" />
                        <p>No billing records found.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* --- M-PESA PAYMENT MODAL --- */}
      {showModal && selectedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-card w-full max-w-md p-6 rounded-lg shadow-lg border border-border relative mx-4">
            <button 
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
            
            <h2 className="text-xl font-bold mb-2">M-Pesa Payment</h2>
            <div className="bg-muted p-3 rounded-md mb-4 flex justify-between items-center">
              <span className="text-sm font-medium">Paying for {selectedInvoice.month}:</span>
              <span className="font-bold text-lg text-success">KES {Number(selectedInvoice.totalAmount).toLocaleString()}</span>
            </div>
            
            <p className="text-sm text-muted-foreground mb-4">
              Enter your Safaricom phone number below to receive the PIN prompt.
            </p>

            <form onSubmit={handleMpesaPayment} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Phone Number</label>
                <input 
                  type="text" 
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="e.g., 254712345678"
                  className="w-full p-2 border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-success transition-all"
                  required
                />
              </div>
              
              <Button 
                type="submit" 
                disabled={isPaying || !phoneNumber} 
                className="w-full bg-success text-success-foreground hover:bg-success/90 h-10"
              >
                {isPaying ? (
                  <><Loader2 className="h-5 w-5 mr-2 animate-spin" /> Sending Prompt...</>
                ) : (
                  "Initiate Payment"
                )}
              </Button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default BillingHistory;