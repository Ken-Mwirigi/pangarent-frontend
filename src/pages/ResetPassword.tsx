import { useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, Loader2 } from 'lucide-react';
import api from '@/api/axiosConfig';

const ResetPassword = () => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const navigate = useNavigate();
  // Grab the secure tokens from the URL exactly as Django sent them
  const { uid, token } = useParams();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      // Send the new password alongside the tokens to prove identity
      await api.post('auth/password-reset-confirm/', {
        new_password: newPassword,
        confirm_password: confirmPassword,
        uidb64: uid,
        token: token,
      });
      
      setSuccess('Password has been reset successfully!');
      setTimeout(() => navigate('/login'), 3000); // Redirect to login after 3 seconds
    } catch (err: any) {
      setError(
        err.response?.data?.token?.[0] || 
        err.response?.data?.password?.[0] || 
        'Invalid or expired reset link. Please request a new one.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md animate-fade-in">
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="h-12 w-12 rounded-xl bg-primary flex items-center justify-center">
            <Building2 className="h-7 w-7 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-display font-bold text-foreground">PangaRent</h1>
        </div>

        <Card className="shadow-lg border-border">
          <CardHeader className="text-center">
            <CardTitle className="font-display text-2xl">Create New Password</CardTitle>
            <CardDescription>Enter your new secure password below</CardDescription>
          </CardHeader>
          <CardContent>
            {success ? (
              <div className="text-center space-y-4">
                <div className="p-3 rounded-md bg-green-100 text-green-800 text-sm">
                  {success}
                </div>
                <p className="text-sm text-muted-foreground">Redirecting to login...</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm">
                    {error}
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    placeholder="••••••••"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </div>
                <Button type="submit" className="w-full bg-accent text-accent-foreground hover:bg-accent/90" disabled={loading}>
                  {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Reset Password
                </Button>
              </form>
            )}
            {!success && (
              <div className="mt-6 text-center text-sm">
                <Link to="/login" className="text-muted-foreground hover:text-accent hover:underline">
                  Return to login
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ResetPassword;