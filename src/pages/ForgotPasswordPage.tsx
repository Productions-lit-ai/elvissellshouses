import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { KeyRound, ArrowRight, Home, ArrowLeft, CheckCircle } from 'lucide-react';
import { z } from 'zod';

const emailSchema = z.object({
  email: z.string().email('Please enter a valid email address').max(255),
});

const ForgotPasswordPage: React.FC = () => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      emailSchema.parse({ email });
      setIsSubmitting(true);

      const redirectUrl = `${window.location.origin}/reset-password`;

      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectUrl,
      });

      if (resetError) {
        toast({
          title: 'Error',
          description: resetError.message,
          variant: 'destructive',
        });
        return;
      }

      setEmailSent(true);
      toast({
        title: 'Check your email',
        description: 'We sent you a password reset link.',
      });
    } catch (err: unknown) {
      if (err instanceof z.ZodError) {
        setError(err.errors[0]?.message || 'Invalid email');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (emailSent) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-md text-center">
          <div className="w-16 h-16 bg-accent/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-8 h-8 text-accent" />
          </div>
          <h2 className="font-serif text-2xl font-bold text-foreground mb-4">
            Check Your Email
          </h2>
          <p className="text-muted-foreground mb-8">
            We've sent a password reset link to <strong>{email}</strong>. 
            Click the link in the email to reset your password.
          </p>
          <Link to="/signin">
            <Button variant="outline" size="lg">
              <ArrowLeft size={18} />
              Back to Sign In
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-block mb-6">
            <h1 className="font-serif text-3xl font-bold text-foreground">
              ELVIS<span className="text-accent"> SELLS</span> HOUSES
            </h1>
          </Link>
          <div className="w-16 h-16 bg-accent/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <KeyRound className="w-8 h-8 text-accent" />
          </div>
          <h2 className="font-serif text-2xl font-bold text-foreground mb-2">
            Forgot Password?
          </h2>
          <p className="text-muted-foreground">
            Enter your email address and we'll send you a link to reset your password.
          </p>
        </div>

        <div className="bg-card rounded-2xl p-8 shadow-lg">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError('');
                }}
                placeholder="john@example.com"
                className="mt-2"
              />
              {error && (
                <p className="text-destructive text-sm mt-1">{error}</p>
              )}
            </div>

            <Button
              type="submit"
              variant="accent"
              size="lg"
              className="w-full"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Sending...' : 'Send Reset Link'}
              <ArrowRight size={18} />
            </Button>
          </form>

          <div className="mt-6 text-center">
            <Link to="/signin" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors text-sm">
              <ArrowLeft size={16} />
              Back to Sign In
            </Link>
          </div>
        </div>

        <div className="mt-6 text-center">
          <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <Home size={16} />
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
