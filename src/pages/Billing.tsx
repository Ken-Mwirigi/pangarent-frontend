import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Send, Edit, Calculator, Loader2, CheckSquare, Trash2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';
import api from '@/api/axiosConfig';

const Billing = () => {
  const [records, setRecords] = useState<any[]>([]);
  const [editingRecord, setEditingRecord] = useState<any | null>(null);
  
  // State for readings
  const [previousReading, setPreviousReading] = useState(0); 
  const [currentReading, setCurrentReading] = useState(0);
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0]);
  
  const [selectedDrafts, setSelectedDrafts] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchRecords = async () => {
    try {
      const response = await api.get('billing/records/');
      setRecords(response.data);
      setSelectedDrafts([]); 
    } catch (error) {
      toast.error('Failed to load billing records');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, []);

  // Watch the Calendar!
  useEffect(() => {
    const fetchHistoricalReading = async () => {
      if (editingRecord && invoiceDate) {
        try {
          const res = await api.get(`billing/previous-reading/?unit_id=${editingRecord.unitId}&date=${invoiceDate}`);
          setPreviousReading(res.data.previous_reading);
        } catch (error) {
          console.error("Failed to fetch historical reading");
        }
      }
    };
    
    fetchHistoricalReading();
  }, [invoiceDate, editingRecord?.unitId]); 

  const openEdit = (record: any) => {
    setEditingRecord(record);
    setPreviousReading(record.previousWaterReading || 0);
    setCurrentReading(record.currentWaterReading || record.previousWaterReading || 0);
    setInvoiceDate(new Date().toISOString().split('T')[0]); 
  };

  const toggleSelectDraft = (id: string) => {
    if (selectedDrafts.includes(id)) {
      setSelectedDrafts(selectedDrafts.filter(draftId => draftId !== id));
    } else {
      setSelectedDrafts([...selectedDrafts, id]);
    }
  };

  const handleUpdateBilling = async (resendNow: boolean = false) => {
    if (!editingRecord) return;
    
    const consumption = currentReading - previousReading;
    
    if (consumption < 0) {
      toast.error('Current reading cannot be less than previous reading');
      return;
    }

    const waterCost = consumption * editingRecord.waterPerUnit;
    const totalAmount = Number(editingRecord.rent) + waterCost + Number(editingRecord.garbageFee);

    // THE FIX: If resendNow is false (Save as Draft), it is ALWAYS a draft.
    const isDraft = !resendNow;

    setIsSubmitting(true);
    try {
      await api.post('billing/invoice/', {
        invoice_id: editingRecord.id.toString().startsWith('draft-') ? null : editingRecord.id,
        unit_id: parseInt(editingRecord.unitId),
        tenant_id: parseInt(editingRecord.tenantId),
        prev_reading: previousReading, 
        current_reading: currentReading,
        reading_date: invoiceDate, 
        water_cost: waterCost,
        rent_amount: editingRecord.rent,
        garbage_fee: editingRecord.garbageFee,
        total_amount: totalAmount,
        is_draft: isDraft 
      });

      toast.success(resendNow ? 'Invoice Sent!' : 'Draft saved successfully!');
      setEditingRecord(null);
      await fetchRecords(); 
    } catch (error) {
      toast.error('Failed to update billing');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteInvoice = async (invoiceId: string) => {
    if (invoiceId.startsWith('draft-')) return; 
    if (!window.confirm('Are you sure you want to delete this invoice?')) return;

    try {
      await api.delete(`billing/invoice/${invoiceId}/`);
      toast.success('Invoice deleted successfully');
      fetchRecords();
    } catch (error) {
      toast.error('Failed to delete invoice');
    }
  };

  const handleBulkSend = async () => {
    if (selectedDrafts.length === 0) return;
    setIsSubmitting(true);
    const draftsToSend = records.filter(r => selectedDrafts.includes(r.id));
    
    try {
      await Promise.all(draftsToSend.map(record => 
        api.post('billing/invoice/', {
          invoice_id: record.id.toString().startsWith('draft-') ? null : record.id,
          unit_id: parseInt(record.unitId),
          tenant_id: parseInt(record.tenantId),
          prev_reading: record.previousWaterReading,
          current_reading: record.currentWaterReading,
          reading_date: new Date().toISOString().split('T')[0],
          water_cost: record.waterCost,
          rent_amount: record.rent,
          garbage_fee: record.garbageFee,
          total_amount: record.totalAmount,
          is_draft: false
        })
      ));
      
      toast.success(`${selectedDrafts.length} Invoices sent successfully!`);
      await fetchRecords();
    } catch (error) {
      toast.error('Some invoices failed to send.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <div className="flex justify-center items-center min-h-[50vh]"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl md:text-3xl font-display font-bold">Billing Engine</h1>
          <p className="text-muted-foreground">Manage and dispatch current invoices</p>
        </div>
        
        {/* BULK SEND BUTTON (Only appears when Drafts are selected) */}
        {selectedDrafts.length > 0 && (
          <Button onClick={handleBulkSend} disabled={isSubmitting} className="bg-accent text-accent-foreground hover:bg-accent/90 animate-fade-in">
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
            Bulk Send ({selectedDrafts.length})
          </Button>
        )}
      </div>

      <Dialog open={!!editingRecord} onOpenChange={() => setEditingRecord(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-display">
              {editingRecord?.status === 'unpaid' ? 'Edit Sent Invoice' : 'Prepare Billing'} — {editingRecord?.tenantName}
            </DialogTitle>
          </DialogHeader>
          {editingRecord && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-muted-foreground text-xs">Unit</Label>
                  <p className="font-medium">{editingRecord.unitName}</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-muted-foreground text-xs">Invoice Date</Label>
                  <Input 
                    type="date" 
                    value={invoiceDate} 
                    onChange={e => setInvoiceDate(e.target.value)} 
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              <div className="bg-muted/50 p-4 rounded-lg space-y-4">
                <div className="flex justify-between text-sm items-center mb-2">
                  <span className="text-muted-foreground">Previous Reading</span>
                  <span className="font-medium">{previousReading}</span>
                </div>
                
                <div className="space-y-2">
                  <Label>Current Water Reading</Label>
                  <Input 
                    type="number" 
                    value={currentReading === 0 ? '' : currentReading} 
                    onChange={e => setCurrentReading(parseFloat(e.target.value) || 0)} 
                    disabled={isSubmitting}
                  />
                </div>

                <div className="flex justify-between items-center pt-2 border-t border-border">
                  <span className="text-muted-foreground font-medium">Consumption</span>
                  <span className="font-bold text-sm">{Math.max(0, currentReading - previousReading)} units</span>
                </div>
              </div>

              {/* CLEARER BUTTONS */}
              <DialogFooter className="flex gap-2 sm:justify-end">
                <Button variant="outline" onClick={() => handleUpdateBilling(false)} disabled={isSubmitting}>
                  <Calculator className="h-4 w-4 mr-2" /> 
                  Save as Draft
                </Button>
                
                <Button onClick={() => handleUpdateBilling(true)} disabled={isSubmitting} className="bg-accent text-accent-foreground hover:bg-accent/90">
                  {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
                  {editingRecord.status === 'unpaid' ? 'Update & Send' : 'Save & Send Invoice'}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="p-4 w-12"><CheckSquare className="h-4 w-4 text-muted-foreground" /></th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Tenant</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Unit</th>
                  <th className="text-left p-4 font-medium text-muted-foreground hidden md:table-cell">Water</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Total</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Status</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {records.length > 0 ? records.map(r => (
                  <tr key={r.id} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                    <td className="p-4">
                      {/* CHECKBOX: Only shows up if status is 'draft'. Does NOT show for 'pending_input' */}
                      {r.status === 'draft' && (
                        <input 
                          type="checkbox" 
                          className="h-4 w-4 rounded border-gray-300 cursor-pointer accent-accent"
                          checked={selectedDrafts.includes(r.id)}
                          onChange={() => toggleSelectDraft(r.id)}
                        />
                      )}
                    </td>
                    <td className="p-4 font-medium">{r.tenantName}</td>
                    <td className="p-4">{r.unitName}</td>
                    <td className="p-4 hidden md:table-cell">KES {Number(r.waterCost).toLocaleString()}</td>
                    <td className="p-4 font-bold">KES {Number(r.totalAmount).toLocaleString()}</td>
                    <td className="p-4">
                      <Badge className={
                        r.status === 'paid' ? 'bg-success text-success-foreground'
                          : r.status === 'unpaid' ? 'bg-warning text-warning-foreground'
                          : r.status === 'draft' ? 'bg-muted text-muted-foreground'
                          : 'bg-accent text-accent-foreground'
                      }>
                        {r.status.replace('_', ' ').toUpperCase()}
                      </Badge>
                    </td>
                    <td className="p-4">
                      <div className="flex gap-1">
                        {(r.status === 'pending_input' || r.status === 'draft' || r.status === 'unpaid') && (
                          <Button size="icon" variant="ghost" onClick={() => openEdit(r)}>
                            <Edit className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                          </Button>
                        )}
                        
                        {r.status === 'draft' && (
                          <Button size="icon" variant="ghost" onClick={() => {
                             setSelectedDrafts([r.id]); 
                             setTimeout(handleBulkSend, 100); 
                          }} className="text-accent hover:text-accent/80 hover:bg-accent/10">
                            <Send className="h-4 w-4" />
                          </Button>
                        )}

                        {(r.status === 'draft' || r.status === 'unpaid') && !r.id.toString().startsWith('draft-') && (
                          <Button size="icon" variant="ghost" onClick={() => handleDeleteInvoice(r.id)} className="text-destructive hover:bg-destructive/10">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-muted-foreground">
                      No active leases found requiring billing.
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

export default Billing;