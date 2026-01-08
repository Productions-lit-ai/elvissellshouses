import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Home, ShoppingCart, ArrowRight, CheckCircle } from 'lucide-react';
import { z } from 'zod';
import { notifyFormSubmission } from '@/lib/notifications';

const buyFormSchema = z.object({
  fullName: z.string().min(2, 'Name must be at least 2 characters').max(100),
  phoneNumber: z.string().min(10, 'Please enter a valid phone number').max(20),
  email: z.string().email('Please enter a valid email address').max(255),
  buyingBudget: z.string().min(1, 'Please enter your budget'),
  preferredArea: z.string().min(2, 'Please enter your preferred area').max(200),
});

const BuyPage: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    phoneNumber: '',
    email: '',
    buyingBudget: '',
    preferredArea: '',
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
      const validatedData = buyFormSchema.parse(formData);
      setIsSubmitting(true);

      // Insert into legacy table
      const { error } = await supabase.from('buy_requests').insert({
        user_id: user.id,
        full_name: validatedData.fullName,
        phone_number: validatedData.phoneNumber,
        email: validatedData.email,
        buying_budget: validatedData.buyingBudget,
        preferred_area: validatedData.preferredArea,
      });

      if (error) throw error;

      // Also insert into unified CRM table
      await supabase.from('applications_crm').insert({
        user_id: user.id,
        application_type: 'buy',
        full_name: validatedData.fullName,
        phone_number: validatedData.phoneNumber,
        email_address: validatedData.email,
        location: validatedData.preferredArea,
        form_source: 'website',
        additional_data: {
          buying_budget: validatedData.buyingBudget,
          preferred_area: validatedData.preferredArea,
        },
      });

      // Send notification email to admin
      notifyFormSubmission({
        fullName: validatedData.fullName,
        email: validatedData.email,
        formType: 'Buy Request',
        formFields: {
          'Full Name': validatedData.fullName,
          'Phone Number': validatedData.phoneNumber,
          'Email': validatedData.email,
          'Buying Budget': validatedData.buyingBudget,
          'Preferred Area': validatedData.preferredArea,
        },
      });

      setIsSubmitted(true);
      toast({
        title: 'Request submitted!',
        description: 'We will contact you shortly about your home search.',
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
            Thank you for your interest in buying a home. We've received your information and will contact you shortly to discuss your home search.
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
              <ShoppingCart className="w-8 h-8 text-accent" />
            </div>
            <h1 className="font-serif text-4xl sm:text-5xl font-bold text-primary-foreground mb-4">
              Buy a Home
            </h1>
            <p className="text-primary-foreground/80 text-lg">
              Ready to find your dream home? Fill out the form below and I'll help you discover the perfect property that fits your needs and budget.
            </p>
          </div>
        </div>
      </section>

      {/* Form Section */}
      <section className="py-16">
        <div className="container max-w-xl">
          <div className="bg-card rounded-2xl p-8 shadow-lg">
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
                <Label htmlFor="buyingBudget">Buying Budget</Label>
                <Input
                  id="buyingBudget"
                  name="buyingBudget"
                  value={formData.buyingBudget}
                  onChange={handleChange}
                  placeholder="$250,000 - $350,000"
                  className="mt-2"
                />
                {errors.buyingBudget && (
                  <p className="text-destructive text-sm mt-1">{errors.buyingBudget}</p>
                )}
              </div>

              <div>
                <Label htmlFor="preferredArea">Preferred Living Area</Label>
                <Input
                  id="preferredArea"
                  name="preferredArea"
                  value={formData.preferredArea}
                  onChange={handleChange}
                  placeholder="Downtown, Suburbs, etc."
                  className="mt-2"
                />
                {errors.preferredArea && (
                  <p className="text-destructive text-sm mt-1">{errors.preferredArea}</p>
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

export default BuyPage;
