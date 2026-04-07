import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { DollarSign, Bell, CreditCard, TrendingUp, Loader2, X } from 'lucide-react';
import { toast } from 'sonner';

const TenantDashboard = () => {
  const { user } = useAuth();
  
  // Dynamic Data States
  const [stats, setStats] = useState({
    balance: 0,
    overpayment: 0,
    unread_notifications: 0,
    invoice_id_to_pay: null
  });
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // M-Pesa UI States
  const [isPaying, setIsPaying] = useState(false); 
  const [showModal, setShowModal] = useState(false); 
  const [phoneNumber, setPhoneNumber] = useState(''); 

  const fetchDashboardData = async (isBackground = false) => {
    const token = localStorage.getItem('access_token');
    if (!token) return;

    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };

    try {
      // Fetch Top Stats
      const statsRes = await fetch('http://127.0.0.1:8000/api/billing/dashboard-stats/', { headers });
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }

      // Fetch Table History
      const historyRes = await fetch('http://127.0.0.1:8000/api/billing/history/', { headers });
      if (historyRes.ok) {
        const historyData = await historyRes.json();
        setPaymentHistory(historyData);
      }
    } catch (error) {
      console.error("Fetch error:", error);
      if (!isBackground) toast.error("Failed to load dashboard data from server.");
    } finally {
      if (!isBackground) setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData(); 

    const interval = setInterval(() => {
      fetchDashboardData(true); 
    }, 10000);

    return () => clearInterval(interval); 
  }, []);

  const handleMpesaPayment = async (e) => {
    e.preventDefault();
    if (!phoneNumber || !stats.invoice_id_to_pay) return;

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
          invoice_id: stats.invoice_id_to_pay,
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

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 relative">
      <div>
        <h1 className="text-2xl md:text-3xl font-display font-bold">
          Hello, {user?.name?.split(' ')[0] || "Tenant"}
        </h1>
        <p className="text-muted-foreground">Your rental overview</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Balance Card */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-accent/10 flex items-center justify-center">
                <DollarSign className="h-5 w-5 text-accent" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Balance</p>
                <p className="text-lg font-display font-bold">
                  {stats.balance > 0 ? `KES ${Number(stats.balance).toLocaleString()}` : 'Cleared'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Overpayment Card */}
        {stats.overpayment > 0 && (
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-success/10 flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-success" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Overpayment</p>
                  <p className="text-lg font-display font-bold text-success">
                    +KES {Number(stats.overpayment).toLocaleString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Notifications Card */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Bell className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Notifications</p>
                <p className="text-lg font-display font-bold">{stats.unread_notifications}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* M-Pesa Action Card */}
        <Card className="col-span-2 lg:col-span-1">
          <CardContent className="p-4 flex items-center justify-center h-full">
            <Button 
              onClick={() => setShowModal(true)} 
              disabled={stats.balance <= 0 || !stats.invoice_id_to_pay} 
              className="w-full bg-success text-success-foreground hover:bg-success/90 h-12 text-base font-semibold disabled:opacity-50"
            >
              <CreditCard className="h-5 w-5 mr-2" />
              Pay via M-Pesa
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Dynamic Payment History */}
      <Card>
        <CardHeader>
          <CardTitle className="font-display text-lg">Payment History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Month</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Amount</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground hidden sm:table-cell">Unit</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground hidden sm:table-cell">Water Used</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Status</th>
                  {/* --- NEW: Reference Column Header --- */}
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Reference</th>
                </tr>
              </thead>
              <tbody>
                {paymentHistory.length === 0 ? (
                  <tr>
                    {/* Span updated to 6 to account for the new column */}
                    <td colSpan="6" className="text-center py-8 text-muted-foreground">No invoices found.</td>
                  </tr>
                ) : (
                  paymentHistory.map(invoice => (
                    <tr key={invoice.id} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                      <td className="py-4 px-4 font-medium">{invoice.month}</td>
                      <td className="py-4 px-4 font-bold">KES {Number(invoice.totalAmount).toLocaleString()}</td>
                      <td className="py-4 px-4 hidden sm:table-cell">{invoice.unitName}</td>
                      <td className="py-4 px-4 hidden sm:table-cell">{invoice.consumption} units</td>
                      
                      <td className="py-4 px-4">
                        <Badge className={
                          invoice.status.toLowerCase() === 'paid' ? 'bg-success text-success-foreground' : 
                          invoice.status.toLowerCase() === 'pending' ? 'bg-accent text-accent-foreground' : 
                          'bg-warning text-warning-foreground' // Changed 'destructive' to 'warning' to match BillingHistory yellow
                        }>
                          {invoice.status.toUpperCase()}
                        </Badge>
                      </td>
                      
                      {/* --- NEW: Dedicated Reference Column Cell --- */}
                      <td className="py-4 px-4 text-muted-foreground font-mono text-xs">
                        {invoice.receipt_number || '-'}
                      </td>

                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* M-PESA PAYMENT MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-card w-full max-w-md p-6 rounded-lg shadow-lg border border-border relative mx-4">
            <button 
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
            
            <h2 className="text-xl font-bold mb-4">M-Pesa Payment</h2>
            <p className="text-sm text-muted-foreground mb-6">
              You are paying <strong>KES {Number(stats.balance).toLocaleString()}</strong>. Enter your Safaricom phone number to receive the PIN prompt.
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

export default TenantDashboard;