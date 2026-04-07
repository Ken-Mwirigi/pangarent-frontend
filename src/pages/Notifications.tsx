import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Bell, Receipt, ShieldCheck, CreditCard, CalendarClock, CheckCircle2, Loader2, Check } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/api/axiosConfig';

interface AppNotification {
  id: number;
  purpose: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

const Notifications = () => {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Added a 'background' flag so the loading spinner doesn't flash every 10 seconds
  const fetchNotifications = async (isBackground = false) => {
    try {
      const response = await api.get('notifications/');
      setNotifications(response.data.notifications);
    } catch (error) {
      if (!isBackground) toast.error('Failed to load notifications');
    } finally {
      if (!isBackground) setIsLoading(false);
    }
  };

  useEffect(() => {
    // 1. Fetch immediately on load
    fetchNotifications();

    // 2. Set up the Auto-Refresh Polling (Every 10 seconds)
    const interval = setInterval(() => {
      fetchNotifications(true); // true = background fetch, no spinner
    }, 10000);

    // 3. Clean up the interval when the user leaves the page
    return () => clearInterval(interval);
  }, []);

  const markAsRead = async (id: number, e?: React.MouseEvent) => {
    if (e) e.stopPropagation(); // Prevents the row click from firing twice if they click the button

    try {
      // Optimistically update the UI instantly
      setNotifications(notifications.map(n => 
        n.id === id ? { ...n, is_read: true } : n
      ));
      
      await api.post(`notifications/${id}/mark-read/`);
    } catch (error) {
      fetchNotifications(true); // Revert if fails
    }
  };

  const markAllAsRead = async () => {
    try {
      setNotifications(notifications.map(n => ({ ...n, is_read: true })));
      await api.post('notifications/mark-read/');
      toast.success('All notifications marked as read');
    } catch (error) {
      fetchNotifications(true);
    }
  };

  const getIcon = (purpose: string) => {
    switch (purpose.toLowerCase()) {
      case 'billing': return <Receipt className="h-5 w-5 text-blue-500" />;
      case 'payment': return <CreditCard className="h-5 w-5 text-green-500" />;
      case 'verification': return <ShieldCheck className="h-5 w-5 text-purple-500" />;
      case 'reminder': return <CalendarClock className="h-5 w-5 text-orange-500" />;
      default: return <Bell className="h-5 w-5 text-muted-foreground" />;
    }
  };

  if (isLoading) {
    return <div className="flex justify-center items-center min-h-[50vh]"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-fade-in">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl md:text-3xl font-display font-bold">Notifications</h1>
          <p className="text-muted-foreground">Stay updated on your account activity</p>
        </div>
        
        {unreadCount > 0 && (
          <Button variant="outline" size="sm" onClick={markAllAsRead} className="hidden sm:flex">
            <CheckCircle2 className="h-4 w-4 mr-2" />
            Mark all as read
          </Button>
        )}
      </div>

      <Card className="shadow-sm">
        <CardContent className="p-0">
          {notifications.length > 0 ? (
            <div className="divide-y divide-border">
              {notifications.map((notif) => (
                <div 
                  key={notif.id} 
                  className={`p-4 md:p-6 flex gap-4 transition-colors ${notif.is_read ? 'bg-background' : 'bg-muted/30 cursor-pointer hover:bg-muted/50'}`}
                  onClick={() => !notif.is_read && markAsRead(notif.id)}
                >
                  <div className={`mt-1 h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0 ${notif.is_read ? 'bg-muted' : 'bg-background shadow-sm border border-border'}`}>
                    {getIcon(notif.purpose)}
                  </div>
                  
                  <div className="flex-1 space-y-1">
                    <div className="flex justify-between items-start gap-2">
                      <p className={`text-sm md:text-base ${notif.is_read ? 'text-foreground font-medium' : 'text-foreground font-bold'}`}>
                        {notif.purpose.charAt(0).toUpperCase() + notif.purpose.slice(1)} Update
                      </p>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {notif.created_at}
                      </span>
                    </div>
                    <p className={`text-sm ${notif.is_read ? 'text-muted-foreground' : 'text-foreground'}`}>
                      {notif.message}
                    </p>
                  </div>
                  
                  {/* Explicit Mark as Read Button for Unread Notifications */}
                  {!notif.is_read && (
                    <div className="flex items-center justify-center flex-shrink-0 ml-2">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-muted-foreground hover:text-success hover:bg-success/10"
                        onClick={(e) => markAsRead(notif.id, e)}
                        title="Mark as read"
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="p-12 text-center flex flex-col items-center justify-center">
              <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-4">
                <Bell className="h-6 w-6 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium">No notifications yet</h3>
              <p className="text-sm text-muted-foreground max-w-sm mt-1">
                When you receive invoices, payments, or important updates, they will appear here.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Notifications;