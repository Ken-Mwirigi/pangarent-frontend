import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { Building2, Users, DollarSign, AlertTriangle, Plus, Loader2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import api from '@/api/axiosConfig';

const CHART_COLORS = ['hsl(152, 60%, 40%)', 'hsl(0, 72%, 51%)', 'hsl(38, 92%, 50%)'];

const Dashboard = () => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [properties, setProperties] = useState([]);
  const [tenants, setTenants] = useState([]);
  const [invoices, setInvoices] = useState([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Fetch all required data simultaneously!
        const [propRes, tenRes, invRes] = await Promise.all([
          api.get('properties/'),
          api.get('tenants/'),
          api.get('billing/history/') // This gives us all invoices/payments
        ]);
        
        setProperties(propRes.data);
        setTenants(tenRes.data);
        setInvoices(invRes.data);
      } catch (error) {
        console.error(error);
        toast.error('Failed to load dashboard statistics.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // ==========================================
  // DYNAMIC CALCULATIONS
  // ==========================================
  
  // 1. Property & Unit Stats
  const totalProperties = properties.length;
  const allUnits = properties.flatMap(p => p.floors?.flatMap(f => f.units || []) || []);
  const totalUnits = allUnits.length;
  const occupiedUnits = allUnits.filter(u => u.isOccupied).length;

  // 2. Tenant Payment Stats
  // Find unique tenants who have at least one 'unpaid' invoice
  const tenantsWithUnpaid = new Set(
    invoices.filter(inv => inv.status.toLowerCase() === 'unpaid').map(inv => inv.tenantName)
  );
  const unpaidTenants = tenantsWithUnpaid.size;
  const paidTenants = Math.max(0, tenants.length - unpaidTenants);

  const paymentStatusData = [
    { name: 'Paid Up', value: paidTenants },
    { name: 'Owes Money', value: unpaidTenants },
  ];

  // 3. Monthly Chart Data (Aggregating Invoice Data)
  const monthlyStats = {};
  invoices.forEach(inv => {
    if (!monthlyStats[inv.month]) {
      monthlyStats[inv.month] = { month: inv.month, collected: 0, pending: 0 };
    }
    const amount = Number(inv.totalAmount) || 0;
    
    if (inv.status.toLowerCase() === 'paid') {
      monthlyStats[inv.month].collected += amount;
    } else if (inv.status.toLowerCase() === 'unpaid') {
      monthlyStats[inv.month].pending += amount;
    }
  });
  
  // Convert object to array, take the most recent 5 months, and reverse so oldest is left to right
  const monthlyData = Object.values(monthlyStats).slice(0, 5).reverse();

  // 4. Recent Payments Table
  // Filter for 'paid' invoices and grab the 5 most recent
  const recentPayments = invoices.filter(inv => inv.status.toLowerCase() === 'paid').slice(0, 5);


  if (isLoading) {
    return <div className="flex justify-center items-center min-h-[50vh]"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  // ==========================================
  // EMPTY STATE (For brand new users)
  // ==========================================
  if (totalProperties === 0) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div>
           <h1 className="text-2xl md:text-3xl font-display font-bold text-foreground">
            Welcome back, {user?.name?.split(' ')[0] || "Landlord"}
       </h1>
          <p className="text-muted-foreground mt-1">Let's get your real estate empire set up.</p>
        </div>

        <Card className="border-dashed border-2 bg-muted/30">
          <CardContent className="flex flex-col items-center justify-center py-20 text-center">
            <div className="h-24 w-24 rounded-full bg-primary/10 flex items-center justify-center mb-6">
              <Building2 className="h-12 w-12 text-primary" />
            </div>
            <h2 className="text-2xl font-display font-bold mb-2">No Properties Yet</h2>
            <p className="text-muted-foreground max-w-md mb-8">
              Start managing your portfolio by adding your first building, setting up floors, and registering units.
            </p>
            <Button asChild size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90">
              <Link to="/properties">
                <Plus className="mr-2 h-5 w-5" /> Add Your First Property
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ==========================================
  // POPULATED STATE (Existing users)
  // ==========================================
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
       <h1 className="text-2xl md:text-3xl font-display font-bold text-foreground">
            Welcome back, {user?.name?.split(' ')[0] || "Landlord"}
       </h1>


        <p className="text-muted-foreground mt-1">Here's your portfolio overview</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 md:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Properties</p>
                <p className="text-2xl font-display font-bold">{totalProperties}</p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-accent/10 flex items-center justify-center">
                <Building2 className="h-5 w-5 text-accent" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 md:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Units</p>
                <p className="text-2xl font-display font-bold">{occupiedUnits}/{totalUnits}</p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Building2 className="h-5 w-5 text-primary" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">occupied</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 md:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Cleared Tenants</p>
                <p className="text-2xl font-display font-bold text-success">{paidTenants}</p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-success/10 flex items-center justify-center">
                <DollarSign className="h-5 w-5 text-success" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 md:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">In Arreas</p>
                <p className="text-2xl font-display font-bold text-destructive">{unpaidTenants}</p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-destructive/10 flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-destructive" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="font-display text-lg">Rent Collection</CardTitle>
          </CardHeader>
          <CardContent>
            {monthlyData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 15%, 90%)" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} width={80} />
                  <Tooltip formatter={(value) => `KES ${Number(value).toLocaleString()}`} />
                  <Bar dataKey="collected" fill="hsl(152, 60%, 40%)" radius={[4, 4, 0, 0]} name="Collected" />
                  <Bar dataKey="pending" fill="hsl(38, 92%, 50%)" radius={[4, 4, 0, 0]} name="Pending" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                No billing data available yet.
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-display text-lg">Payment Status</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-center">
            {tenants.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie data={paymentStatusData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                    {paymentStatusData.map((_, i) => (
                      <Cell key={i} fill={CHART_COLORS[i]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                No tenants registered yet.
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Payments Table */}
      <Card>
        <CardHeader>
          <CardTitle className="font-display text-lg">Recent Collections</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left py-3 px-4 text-muted-foreground font-medium">Tenant</th>
                  <th className="text-left py-3 px-4 text-muted-foreground font-medium">Amount</th>
                  <th className="text-left py-3 px-4 text-muted-foreground font-medium">Date</th>
                  <th className="text-left py-3 px-4 text-muted-foreground font-medium">Method</th>
                  <th className="text-left py-3 px-4 text-muted-foreground font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {recentPayments.length > 0 ? recentPayments.map((p) => (
                  <tr key={p.id} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                    <td className="py-3 px-4 font-medium">{p.tenantName}</td>
                    <td className="py-3 px-4 font-bold">KES {Number(p.totalAmount).toLocaleString()}</td>
                    <td className="py-3 px-4 text-muted-foreground">{p.created_at}</td>
                    <td className="py-3 px-4">
                      {/* Assuming all successful payments through the system are M-Pesa right now */}
                      <Badge variant="secondary" className="font-mono text-xs">M-Pesa</Badge>
                    </td>
                    <td className="py-3 px-4">
                      <Badge className="bg-success text-success-foreground">
                        {p.status.toUpperCase()}
                      </Badge>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-muted-foreground">
                      No recent payments found.
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

export default Dashboard;