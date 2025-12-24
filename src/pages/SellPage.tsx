import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Home, Building2, ArrowRight, CheckCircle } from 'lucide-react';
import { z } from 'zod';
import { notifyFormSubmission } from '@/lib/notifications';

const sellFormSchema = z.object({
  fullName: z.string().min(2, 'Name must be at least 2 characters').max(100),
  phoneNumber: z.string().min(10, 'Please enter a valid phone number').max(20),
  email: z.string().email('Please enter a valid email address').max(255),
  homeAddress: z.string().min(5, 'Please enter your full address').max(300),
});

const SellPage: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    phoneNumber: '',
    email: '',
    homeAddress: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast({
        title: 'Please sign in',
        description: 'You need to be signed in to submit a request.',
        variant: 'destructive',
      });
      navigate('/signin');
      return;
    }

    try {
      const validatedData = sellFormSchema.parse(formData);
      setIsSubmitting(true);

      const { error } = await supabase.from('sell_requests').insert({
        user_id: user.id,
        full_name: validatedData.fullName,
        phone_number: validatedData.phoneNumber,
        email: validatedData.email,
        home_address: validatedData.homeAddress,
      });

      if (error) throw error;

      // Send notification email to admin
      notifyFormSubmission({
        fullName: validatedData.fullName,
        email: validatedData.email,
        formType: 'Sell Request',
        formFields: {
          'Full Name': validatedData.fullName,
          'Phone Number': validatedData.phoneNumber,
          'Email': validatedData.email,
          'Home Address': validatedData.homeAddress,
        },
      });

      setIsSubmitted(true);
      toast({
        title: 'Request submitted!',
        description: 'We will contact you shortly about selling your home.',
      });
    } catch (error: unknown) {
      if (error instanceof z.ZodError) {
        const fieldErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            fieldErrors[err.path[0] as string] = err.message;
          }
        });
        setErrors(fieldErrors);
      } else {
        toast({
          title: 'Error',
          description: 'Failed to submit your request. Please try again.',
          variant: 'destructive',
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center max-w-md animate-fade-in">
          <div className="w-20 h-20 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-accent" />
          </div>
          <h1 className="font-serif text-3xl font-bold text-foreground mb-4">
            Request Received!
          </h1>
          <p className="text-muted-foreground mb-8">
            Thank you for considering us to sell your home. We've received your information and will contact you shortly to discuss your property listing.
          </p>
          <Button variant="accent" onClick={() => navigate('/')}>
            <Home size={18} />
            Back to Home
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <section className="hero-gradient py-20 pt-24 md:pt-20">
        <div className="container">
          <div className="text-center max-w-2xl mx-auto">
            <div className="w-16 h-16 bg-accent/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Building2 className="w-8 h-8 text-accent" />
            </div>
            <h1 className="font-serif text-4xl sm:text-5xl font-bold text-primary-foreground mb-4">
              Sell Your House
            </h1>
            <p className="text-primary-foreground/80 text-lg">
              "Your home is not just a building – it's the story of your life. Let me help you share that story with the right buyer."
            </p>
          </div>
        </div>
      </section>

      {/* Form Section */}
      <section className="py-16">
        <div className="container max-w-xl">
          <div className="bg-card rounded-2xl p-8 shadow-lg">
            <div className="mb-8 text-center">
              <h2 className="font-serif text-2xl font-semibold text-card-foreground mb-2">
                Get a Free Consultation
              </h2>
              <p className="text-muted-foreground">
                Fill out the form below and I'll reach out to discuss how we can get your property sold quickly and for top dollar.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  placeholder="John Doe"
                  className="mt-2"
                />
                {errors.fullName && (
                  <p className="text-destructive text-sm mt-1">{errors.fullName}</p>
                )}
              </div>

              <div>
                <Label htmlFor="phoneNumber">Phone Number</Label>
                <Input
                  id="phoneNumber"
                  name="phoneNumber"
                  type="tel"
                  value={formData.phoneNumber}
                  onChange={handleChange}
                  placeholder="(123) 456-7890"
                  className="mt-2"
                />
                {errors.phoneNumber && (
                  <p className="text-destructive text-sm mt-1">{errors.phoneNumber}</p>
                )}
              </div>

              <div>
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="john@example.com"
                  className="mt-2"
                />
                {errors.email && (
                  <p className="text-destructive text-sm mt-1">{errors.email}</p>
                )}
              </div>

              <div>
                <Label htmlFor="homeAddress">Home Address</Label>
                <Input
                  id="homeAddress"
                  name="homeAddress"
                  value={formData.homeAddress}
                  onChange={handleChange}
                  placeholder="123 Main St, City, State, ZIP"
                  className="mt-2"
                />
                {errors.homeAddress && (
                  <p className="text-destructive text-sm mt-1">{errors.homeAddress}</p>
                )}
              </div>

              <Button
                type="submit"
                variant="accent"
                size="lg"
                className="w-full"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Submitting...' : 'Submit Request'}
                <ArrowRight size={18} />
              </Button>
            </form>

            {!user && (
              <p className="text-center text-muted-foreground text-sm mt-6">
                You'll need to{' '}
                <a href="/signin" className="text-accent hover:underline">
                  sign in
                </a>{' '}
                to submit your request.
              </p>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

export default SellPage;
