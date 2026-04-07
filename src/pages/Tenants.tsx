import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tenant, Property } from '@/types';
import { Plus, Search, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { toast } from 'sonner';
import api from '@/api/axiosConfig';

const Tenants = () => {
  const [tenants, setTenants] = useState<Tenant[]>([]); 
  const [properties, setProperties] = useState<Property[]>([]);
  
  const [showAddTenant, setShowAddTenant] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [form, setForm] = useState({
    name: '', email: '', phone: '', idNumber: '',
    unitId: '', propertyId: '', emergencyContact: '', emergencyPhone: '',
  });

  const fetchProperties = async () => {
    try {
      const response = await api.get('properties/');
      setProperties(response.data);
    } catch (error) {
      toast.error('Failed to load properties for unit assignment');
    }
  };

  const fetchTenants = async () => {
    try {
      const response = await api.get('tenants/');
      setTenants(response.data);
    } catch (error) {
      toast.error('Failed to load tenants');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProperties();
    fetchTenants();
  }, []);

  const allUnits = properties.flatMap(p => p.floors?.flatMap(f => f.units || []) || []);
  
  const selectedProperty = properties.find(p => p.id.toString() === form.propertyId);
  const availableUnitsForProperty = selectedProperty 
    ? selectedProperty.floors?.flatMap(f => f.units || []).filter(u => !u.isOccupied) || []
    : [];

  const handleAdd = async () => {
    if (!form.name || !form.email || !form.phone || !form.idNumber) {
      toast.error('Please fill required fields');
      return;
    }

    setIsSubmitting(true);
    try {
      await api.post('tenants/register/', {
        name: form.name,
        email: form.email,
        phone: form.phone,
        idNumber: form.idNumber,
        unitId: form.unitId ? parseInt(form.unitId) : null,
        emergencyContact: form.emergencyContact,
        emergencyPhone: form.emergencyPhone
      });

      setForm({ name: '', email: '', phone: '', idNumber: '', unitId: '', propertyId: '', emergencyContact: '', emergencyPhone: '' });
      setShowAddTenant(false);
      
      toast.success(`Tenant registered! Invite sent to ${form.email}`);
      
      fetchProperties(); 
      fetchTenants(); 
    } catch (error: any) {
      console.error("Django Error Payload:", error.response?.data);
      const errorMessage = 
        error.response?.data?.error || 
        error.response?.data?.detail ||
        (error.response?.data && Object.values(error.response.data)[0]) ||
        'Failed to register tenant';
      toast.error(String(errorMessage));
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- Smart Location Finder ---
  const getLocationDetails = (unitId?: string | number) => {
    if (!unitId) return { property: '—', floor: '—', unit: '—' };
    
    for (const p of properties) {
      for (const f of p.floors || []) {
        const unit = (f.units || []).find(u => u.id.toString() === unitId.toString());
        if (unit) {
          return { property: p.name, floor: f.name, unit: unit.name };
        }
      }
    }
    return { property: '—', floor: '—', unit: '—' };
  };

  const filtered = tenants.filter(t =>
    t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.phone.includes(searchQuery)
  );

  if (isLoading) {
    return <div className="flex justify-center items-center min-h-[50vh]"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-display font-bold">Tenants</h1>
          <p className="text-muted-foreground">Manage tenants and assignments</p>
        </div>
        <Button onClick={() => setShowAddTenant(true)} className="bg-accent text-accent-foreground hover:bg-accent/90">
          <Plus className="h-4 w-4 mr-2" /> Add Tenant
        </Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search tenants..." className="pl-9" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
      </div>

      <Dialog open={showAddTenant} onOpenChange={setShowAddTenant}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display">Add New Tenant</DialogTitle>
            <DialogDescription className="sr-only">Fill out this form to invite a new tenant to your property.</DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Full Name *</Label>
                <Input placeholder="John Doe" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} disabled={isSubmitting} />
              </div>
              <div className="space-y-2">
                <Label>ID Number *</Label>
                <Input placeholder="12345678" value={form.idNumber} onChange={e => setForm({ ...form, idNumber: e.target.value })} disabled={isSubmitting} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Email *</Label>
                <Input type="email" placeholder="john@email.com" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} disabled={isSubmitting} />
              </div>
              <div className="space-y-2">
                <Label>Phone *</Label>
                <Input placeholder="+254712345678" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} disabled={isSubmitting} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Emergency Contact</Label>
                <Input placeholder="Jane Doe" value={form.emergencyContact} onChange={e => setForm({ ...form, emergencyContact: e.target.value })} disabled={isSubmitting} />
              </div>
              <div className="space-y-2">
                <Label>Emergency Phone</Label>
                <Input placeholder="+254700000000" value={form.emergencyPhone} onChange={e => setForm({ ...form, emergencyPhone: e.target.value })} disabled={isSubmitting} />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Assign to Property</Label>
              <Select value={form.propertyId} onValueChange={v => setForm({ ...form, propertyId: v })} disabled={isSubmitting}>
                <SelectTrigger><SelectValue placeholder="Select property" /></SelectTrigger>
                <SelectContent>
                  {properties.map(p => (
                    <SelectItem key={p.id} value={p.id.toString()}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

           <div className="space-y-2">
              <Label>Assign to Unit</Label>
              <Select value={form.unitId} onValueChange={v => setForm({ ...form, unitId: v })} disabled={isSubmitting || !form.propertyId}>
                <SelectTrigger><SelectValue placeholder={form.propertyId ? "Select unit (vacant only)" : "Select a property first"} /></SelectTrigger>
                <SelectContent>
                  {availableUnitsForProperty.length > 0 ? (
                    availableUnitsForProperty.map(u => (
                      <SelectItem key={u.id} value={u.id.toString()}>{u.name} — KES {Number(u.rentAmount).toLocaleString()}</SelectItem>
                    ))
                  ) : (
                    <SelectItem value="none" disabled>No vacant units available</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="bg-muted/50 p-3 rounded-md text-sm text-muted-foreground">
              An email with a secure setup link will be sent to the tenant upon registration.
            </div>

            <Button onClick={handleAdd} disabled={isSubmitting} className="w-full bg-accent text-accent-foreground hover:bg-accent/90">
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Register Tenant
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left p-4 font-medium text-muted-foreground">Name</th>
                  <th className="text-left p-4 font-medium text-muted-foreground hidden md:table-cell">Phone</th>
                  <th className="text-left p-4 font-medium text-muted-foreground hidden lg:table-cell">Email</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Property & Floor</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Unit</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Balance</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Status</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Account Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length > 0 ? filtered.map(t => {
                  const loc = getLocationDetails(t.unitId);

                  return (
                    <tr key={t.id} className="border-b border-border last:border-0 hover:bg-muted/20">
                      <td className="p-4 font-medium">{t.name}</td>
                      <td className="p-4 hidden md:table-cell text-muted-foreground">{t.phone}</td>
                      <td className="p-4 hidden lg:table-cell text-muted-foreground">{t.email}</td>
                      
                      <td className="p-4">
                        <div className="flex flex-col">
                          <span className="font-medium text-foreground">{loc.property}</span>
                          <span className="text-xs text-muted-foreground">{loc.floor}</span>
                        </div>
                      </td>
                      
                      <td className="p-4 font-bold">{loc.unit}</td>
                      
                      <td className="p-4">
                        <span className="text-success">Cleared</span>
                      </td>
                      <td className="p-4">
                        <Badge className="bg-success text-success-foreground">Paid</Badge>
                      </td>
                      <td className="p-4">
                        <Badge className={
                          t.accountStatus === 'Active' 
                            ? 'bg-success text-success-foreground' 
                            : 'bg-warning text-warning-foreground'
                        }>
                          {t.accountStatus || 'Pending Setup'}
                        </Badge>
                      </td>
                    </tr>
                  );
                }) : (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-muted-foreground">
                      No tenants found. Click "Add Tenant" to invite someone.
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

export default Tenants;