import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Property, Floor, Unit } from '@/types';
import { Plus, Building2, ChevronDown, ChevronRight, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import api from '@/api/axiosConfig';

const Properties = () => {
  const [properties, setProperties] = useState<Property[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [showAddProperty, setShowAddProperty] = useState(false);
  const [expandedProperty, setExpandedProperty] = useState<number | string | null>(null);
  const [expandedFloor, setExpandedFloor] = useState<number | string | null>(null);
  const [showAddFloor, setShowAddFloor] = useState<number | string | null>(null);
  const [showAddUnit, setShowAddUnit] = useState<number | string | null>(null);

  const [propertyForm, setPropertyForm] = useState({ name: '', address: '', city: '' });
  const [floorForm, setFloorForm] = useState({ name: '', number: 0 });
  const [unitForm, setUnitForm] = useState({ name: '', rentAmount: 0, garbageFee: 0, waterPerUnit: 0 });

  // 1. FETCH PROPERTIES ON LOAD
  const fetchProperties = async () => {
    try {
      const response = await api.get('properties/');
      setProperties(response.data);
    } catch (error) {
      toast.error('Failed to load properties');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProperties();
  }, []);

  // 2. CREATE PROPERTY
  const handleAddProperty = async () => {
    if (!propertyForm.name || !propertyForm.address || !propertyForm.city) {
      toast.error('Please fill all fields');
      return;
    }
    
    setIsSubmitting(true);
    try {
      const response = await api.post('properties/', propertyForm);
      setProperties([...properties, response.data]); 
      setPropertyForm({ name: '', address: '', city: '' });
      setShowAddProperty(false);
      toast.success('Property added successfully');
    } catch (error: any) {
      console.error("Django Error Payload:", error.response?.data);
      const errorMessage = 
        error.response?.data?.error || 
        error.response?.data?.detail ||
        (error.response?.data && Object.values(error.response.data)[0]) ||
        'Failed to create property';
      toast.error(String(errorMessage));
    } finally {
      setIsSubmitting(false);
    }
  };

  // 3. CREATE FLOOR
  const handleAddFloor = async (propertyId: number | string) => {
    if (!floorForm.name) { toast.error('Floor name required'); return; }
    
    setIsSubmitting(true);
    try {
      await api.post('floors/', {
        name: floorForm.name,
        number: floorForm.number,
        propertyId: propertyId 
      });
      
      await fetchProperties(); 
      setFloorForm({ name: '', number: 0 });
      setShowAddFloor(null);
      toast.success('Floor added');
    } catch (error: any) {
      console.error("Django Error Payload:", error.response?.data);
      const errorMessage = 
        error.response?.data?.error || 
        error.response?.data?.detail ||
        (error.response?.data && Object.values(error.response.data)[0]) ||
        'Failed to add floor';
      toast.error(String(errorMessage));
    } finally {
      setIsSubmitting(false);
    }
  };

  // 4. CREATE UNIT
  const handleAddUnit = async (floorId: number | string) => {
    if (!unitForm.name || !unitForm.rentAmount) { toast.error('Unit name and rent required'); return; }
    
    setIsSubmitting(true);
    try {
      await api.post('units/', {
        name: unitForm.name,
        rentAmount: unitForm.rentAmount,
        garbageFee: unitForm.garbageFee,
        waterPerUnit: unitForm.waterPerUnit,
        floorId: floorId 
      });

      await fetchProperties();
      setUnitForm({ name: '', rentAmount: 0, garbageFee: 0, waterPerUnit: 0 });
      setShowAddUnit(null);
      toast.success('Unit added');
    } catch (error: any) {
      console.error("Django Error Payload:", error.response?.data);
      const errorMessage = 
        error.response?.data?.error || 
        error.response?.data?.detail ||
        (error.response?.data && Object.values(error.response.data)[0]) ||
        'Failed to add unit';
      toast.error(String(errorMessage));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <div className="flex justify-center items-center min-h-[50vh]"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-display font-bold">Properties</h1>
          <p className="text-muted-foreground">Manage your properties, floors and units</p>
        </div>
        <Button onClick={() => setShowAddProperty(true)} className="bg-accent text-accent-foreground hover:bg-accent/90">
          <Plus className="h-4 w-4 mr-2" /> Add Property
        </Button>
      </div>

      {/* Add Property Dialog */}
      <Dialog open={showAddProperty} onOpenChange={setShowAddProperty}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-display">Add New Property</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Property Name</Label>
              <Input placeholder="e.g. Sunrise Apartments" value={propertyForm.name} onChange={e => setPropertyForm({ ...propertyForm, name: e.target.value })} disabled={isSubmitting} />
            </div>
            <div className="space-y-2">
              <Label>Address</Label>
              <Input placeholder="123 Moi Avenue" value={propertyForm.address} onChange={e => setPropertyForm({ ...propertyForm, address: e.target.value })} disabled={isSubmitting} />
            </div>
            <div className="space-y-2">
              <Label>City</Label>
              <Input placeholder="Nairobi" value={propertyForm.city} onChange={e => setPropertyForm({ ...propertyForm, city: e.target.value })} disabled={isSubmitting} />
            </div>
            <Button onClick={handleAddProperty} disabled={isSubmitting} className="w-full bg-accent text-accent-foreground hover:bg-accent/90">
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Create Property
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Property List */}
      {properties.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-display text-lg font-semibold mb-2">No properties yet</h3>
            <p className="text-muted-foreground mb-4">Add your first property to get started</p>
            <Button onClick={() => setShowAddProperty(true)} className="bg-accent text-accent-foreground hover:bg-accent/90">
              <Plus className="h-4 w-4 mr-2" /> Add Property
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {properties.map(property => (
            <Card key={property.id}>
              <CardHeader className="cursor-pointer" onClick={() => setExpandedProperty(expandedProperty === property.id ? null : property.id)}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {expandedProperty === property.id ? <ChevronDown className="h-5 w-5 text-muted-foreground" /> : <ChevronRight className="h-5 w-5 text-muted-foreground" />}
                    <div>
                      <CardTitle className="font-display text-lg">{property.name}</CardTitle>
                      <p className="text-sm text-muted-foreground">{property.address}, {property.city}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{property.floors?.length || 0} floors</Badge>
                    <Badge variant="secondary">
                      {property.floors?.reduce((total, floor) => total + (floor.units?.length || 0), 0) || 0} units
                    </Badge>
                  </div>
                </div>
              </CardHeader>

              {expandedProperty === property.id && (
                <CardContent className="pt-0 space-y-4">
                  <Button size="sm" variant="outline" onClick={() => setShowAddFloor(property.id)}>
                    <Plus className="h-3 w-3 mr-1" /> Add Floor
                  </Button>

                  {/* Add Floor Dialog */}
                  <Dialog open={showAddFloor === property.id} onOpenChange={() => setShowAddFloor(null)}>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle className="font-display">Add Floor to {property.name}</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label>Floor Name</Label>
                          <Input placeholder="e.g. Ground Floor" value={floorForm.name} onChange={e => setFloorForm({ ...floorForm, name: e.target.value })} disabled={isSubmitting} />
                        </div>
                        <div className="space-y-2">
                          <Label>Floor Number</Label>
                          <Input type="number" value={floorForm.number} onChange={e => setFloorForm({ ...floorForm, number: parseInt(String(e.target.value)) || 0 })} disabled={isSubmitting} />
                        </div>
                        <Button onClick={() => handleAddFloor(property.id)} disabled={isSubmitting} className="w-full bg-accent text-accent-foreground hover:bg-accent/90">
                          {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                          Add Floor
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>

                  {/* Floors */}
                  {property.floors?.map(floor => (
                    <div key={floor.id} className="border border-border rounded-lg">
                      <div
                        className="flex items-center justify-between p-3 cursor-pointer hover:bg-muted/50"
                        onClick={() => setExpandedFloor(expandedFloor === floor.id ? null : floor.id)}
                      >
                        <div className="flex items-center gap-2">
                          {expandedFloor === floor.id ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                          <span className="font-medium">{floor.name}</span>
                          <Badge variant="secondary" className="text-xs">{floor.units?.length || 0} units</Badge>
                        </div>
                        <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); setShowAddUnit(floor.id); }}>
                          <Plus className="h-3 w-3 mr-1" /> Unit
                        </Button>
                      </div>

                      {/* Add Unit Dialog */}
                      <Dialog open={showAddUnit === floor.id} onOpenChange={() => setShowAddUnit(null)}>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle className="font-display">Add Unit to {floor.name}</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div className="space-y-2">
                              <Label>Unit Name</Label>
                              <Input placeholder="e.g. A01" value={unitForm.name} onChange={e => setUnitForm({ ...unitForm, name: e.target.value })} disabled={isSubmitting} />
                            </div>
                            <div className="space-y-2">
                              <Label>Rent Amount (KES)</Label>
                              <Input type="number" value={unitForm.rentAmount || ''} onChange={e => setUnitForm({ ...unitForm, rentAmount: parseInt(String(e.target.value)) || 0 })} disabled={isSubmitting} />
                            </div>
                            <div className="space-y-2">
                              <Label>Garbage Fee (KES)</Label>
                              <Input type="number" value={unitForm.garbageFee || ''} onChange={e => setUnitForm({ ...unitForm, garbageFee: parseInt(String(e.target.value)) || 0 })} disabled={isSubmitting} />
                            </div>
                            <div className="space-y-2">
                              <Label>Water Per Unit (KES)</Label>
                              <Input type="number" value={unitForm.waterPerUnit || ''} onChange={e => setUnitForm({ ...unitForm, waterPerUnit: parseInt(String(e.target.value)) || 0 })} disabled={isSubmitting} />
                            </div>
                            <Button onClick={() => handleAddUnit(floor.id)} disabled={isSubmitting} className="w-full bg-accent text-accent-foreground hover:bg-accent/90">
                              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                              Add Unit
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>

                      {expandedFloor === floor.id && floor.units && floor.units.length > 0 && (
                        <div className="border-t border-border">
                          <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                              <thead>
                                <tr className="bg-muted/30">
                                  <th className="text-left p-3 font-medium text-muted-foreground">Unit</th>
                                  <th className="text-left p-3 font-medium text-muted-foreground">Rent</th>
                                  <th className="text-left p-3 font-medium text-muted-foreground">Garbage</th>
                                  <th className="text-left p-3 font-medium text-muted-foreground">Water/Unit</th>
                                  <th className="text-left p-3 font-medium text-muted-foreground">Status</th>
                                </tr>
                              </thead>
                              <tbody>
                                {floor.units.map(unit => (
                                  <tr key={unit.id} className="border-t border-border">
                                    <td className="p-3 font-medium">{unit.name}</td>
                                    <td className="p-3">KES {Number(unit.rentAmount).toLocaleString()}</td>
                                    <td className="p-3">KES {Number(unit.garbageFee).toLocaleString()}</td>
                                    <td className="p-3">KES {Number(unit.waterPerUnit).toLocaleString()}</td>
                                    <td className="p-3">
                                      <Badge className={unit.isOccupied ? 'bg-success text-success-foreground' : 'bg-muted text-muted-foreground'}>
                                        {unit.isOccupied ? 'Occupied' : 'Vacant'}
                                      </Badge>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default Properties;