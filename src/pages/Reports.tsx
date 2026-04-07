import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/api/axiosConfig';

// Green (Cleared), Red (Arrears), Yellow (Overpaid)
const COLORS = ['hsl(152, 60%, 40%)', 'hsl(0, 72%, 51%)', 'hsl(38, 92%, 50%)'];

const Reports = () => {
  const [analytics, setAnalytics] = useState<any>(null);
  const [currentBilling, setCurrentBilling] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchReportsData = async () => {
      try {
        // Fetch the new Analytics API and the Current Billing Records
        const [analyticsRes, recordsRes] = await Promise.all([
          api.get('billing/reports/analytics/'),
          api.get('billing/records/')
        ]);
        setAnalytics(analyticsRes.data);
        setCurrentBilling(recordsRes.data);
      } catch (error) {
        console.error(error);
        toast.error('Failed to load report analytics.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchReportsData();
  }, []);

  if (isLoading || !analytics) {
    return <div className="flex justify-center items-center min-h-[50vh]"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  // ==========================================
  // DYNAMIC CALCULATIONS
  // ==========================================

  // 1. Tenant Payment Status (Pie Chart)
  const statusData = [
    { name: 'Cleared', value: analytics.status_counts.cleared },
    { name: 'In Arrears', value: analytics.status_counts.in_arrears },
    { name: 'Overpaid', value: analytics.status_counts.overpaid },
  ];
  
  // Only show the pie chart if there is at least one active tenant
  const totalActiveTenants = analytics.status_counts.cleared + analytics.status_counts.in_arrears + analytics.status_counts.overpaid;

  // 2. Expected Revenue by Utility (Bar Chart)
  const utilityBreakdown = currentBilling.reduce(
    (acc: any, record: any) => ({
      rent: acc.rent + Number(record.rent || 0),
      water: acc.water + Number(record.waterCost || 0),
      garbage: acc.garbage + Number(record.garbageFee || 0),
    }),
    { rent: 0, water: 0, garbage: 0 }
  );

  const utilityData = [
    { name: 'Rent', amount: utilityBreakdown.rent },
    { name: 'Water', amount: utilityBreakdown.water },
    { name: 'Garbage', amount: utilityBreakdown.garbage },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl md:text-3xl font-display font-bold">Reports</h1>
        <p className="text-muted-foreground">Payment analytics and expected revenue</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="font-display text-lg">Tenant Payment Status</CardTitle>
          </CardHeader>
          <CardContent>
            {totalActiveTenants > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie 
                    data={statusData} 
                    cx="50%" cy="50%" 
                    innerRadius={60} 
                    outerRadius={110} 
                    dataKey="value" 
                    label={({ name, value }) => value > 0 ? `${name}: ${value}` : ''}
                  >
                    {statusData.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
               <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                No active tenants to report.
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-display text-lg">Expected Revenue by Utility</CardTitle>
          </CardHeader>
          <CardContent>
            {totalActiveTenants > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={utilityData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 15%, 90%)" />
                  <XAxis dataKey="name" />
                  <YAxis width={80} />
                  <Tooltip formatter={(value: number) => `KES ${value.toLocaleString()}`} />
                  <Bar dataKey="amount" fill="hsl(38, 92%, 50%)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
               <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                No utility data available.
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* REAL OVERPAID TENANTS LIST */}
      <Card>
        <CardHeader>
          <CardTitle className="font-display text-lg">Overpaid Tenants</CardTitle>
        </CardHeader>
        <CardContent>
          {analytics.overpaid_tenants.length === 0 ? (
            <p className="text-muted-foreground text-sm">No overpayments recorded.</p>
          ) : (
            <div className="space-y-3">
              {analytics.overpaid_tenants.map((t: any) => (
                <div key={t.id} className="flex items-center justify-between p-3 bg-success/5 rounded-lg border border-success/20 transition-colors hover:bg-success/10">
                  <span className="font-medium text-foreground">{t.name}</span>
                  <span className="text-success font-bold font-mono">+KES {Number(t.overpayment).toLocaleString()}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Reports;