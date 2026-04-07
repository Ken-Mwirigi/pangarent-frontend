import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { mockPayments } from '@/data/mockData';
import { CreditCard, Loader2, X } from 'lucide-react';
import { toast } from 'sonner';

const TenantPayments = () => {
  const [isPaying, setIsPaying] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');

  const tenantPayments = mockPayments.filter(p => p.tenantId === 't1');

  // IMPORTANT: For testing, set this to an actual Invoice ID from your Django database
  const TEST_INVOICE_ID = 1; 

  const handleMpesaPayment = async (e) => {
    e.preventDefault();
    if (!phoneNumber) return;

    setIsPaying(true);
    try {
      // Fire the POST request to your Django backend
      const response = await fetch('http://127.0.0.1:8000/api/billing/mpesa/pay/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // 'Authorization': `Bearer ${localStorage.getItem('token')}` // Uncomment if needed
        },
        body: JSON.stringify({
          invoice_id: TEST_INVOICE_ID,
          phone_number: phoneNumber
        })
      });

      const data = await response.json();

      if (response.ok) {
        setShowModal(false); // Close the modal
        setPhoneNumber('');  // Reset the input field
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

  return (
    <div className="space-y-6 relative">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-display font-bold">Payments</h1>
          <p className="text-muted-foreground">Your payment history and actions</p>
        </div>
        <Button 
          onClick={() => setShowModal(true)} 
          className="bg-success text-success-foreground hover:bg-success/90"
        >
          <CreditCard className="h-4 w-4 mr-2" /> Pay via M-Pesa
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left p-4 font-medium text-muted-foreground">Date</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Total</th>
                  <th className="text-left p-4 font-medium text-muted-foreground hidden sm:table-cell">Rent</th>
                  <th className="text-left p-4 font-medium text-muted-foreground hidden sm:table-cell">Water</th>
                  <th className="text-left p-4 font-medium text-muted-foreground hidden sm:table-cell">Garbage</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Method</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Status</th>
                </tr>
              </thead>
              <tbody>
                {tenantPayments.map(p => (
                  <tr key={p.id} className="border-b border-border last:border-0">
                    <td className="p-4">{p.date}</td>
                    <td className="p-4 font-bold">KES {p.amount.toLocaleString()}</td>
                    <td className="p-4 hidden sm:table-cell">KES {p.breakdown.rent.toLocaleString()}</td>
                    <td className="p-4 hidden sm:table-cell">KES {p.breakdown.water.toLocaleString()}</td>
                    <td className="p-4 hidden sm:table-cell">KES {p.breakdown.garbage.toLocaleString()}</td>
                    <td className="p-4"><Badge variant="secondary">{p.method}</Badge></td>
                    <td className="p-4">
                      <Badge className={p.status === 'paid' ? 'bg-success text-success-foreground' : p.status === 'pending' ? 'bg-accent text-accent-foreground' : 'bg-destructive text-destructive-foreground'}>
                        {p.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* --- M-PESA PAYMENT MODAL --- */}
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
              Enter the Safaricom phone number you wish to pay with. You will receive a prompt to enter your PIN.
            </p>

            <form onSubmit={handleMpesaPayment} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Phone Number</label>
                <input 
                  type="text" 
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="e.g., 254712345678 or 0712345678"
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
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    Sending Prompt...
                  </>
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

export default TenantPayments;