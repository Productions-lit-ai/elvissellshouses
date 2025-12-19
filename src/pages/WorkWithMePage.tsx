import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { z } from 'zod';
import { Users, CheckCircle, Briefcase, TrendingUp, Home } from 'lucide-react';

const workFormSchema = z.object({
  fullName: z.string().trim().min(1, 'Full name is required').max(100),
  email: z.string().trim().email('Invalid email address').max(255),
  location: z.string().trim().min(1, 'Location is required').max(200),
  age: z.string().trim().min(1, 'Age is required').max(10),
  skill: z.string().trim().min(1, 'Skill is required').max(200),
  skillLevel: z.enum(['Beginner', 'Intermediate', 'Advanced'], { required_error: 'Skill level is required' }),
});

const WorkWithMePage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    location: '',
    age: '',
    skill: '',
    skillLevel: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const handleSelectChange = (value: string) => {
    setFormData((prev) => ({ ...prev, skillLevel: value }));
    if (errors.skillLevel) setErrors((prev) => ({ ...prev, skillLevel: '' }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrors({});

    try {
      const validated = workFormSchema.parse(formData);

      const { error } = await supabase.from('work_with_me_requests').insert({
        user_id: user?.id || null,
        full_name: validated.fullName,
        email: validated.email,
        location: validated.location,
        age: validated.age,
        skill: validated.skill,
        skill_level: validated.skillLevel,
      });

      if (error) throw error;

      toast({ title: 'Application submitted!', description: 'Elvis will review your application soon.' });
      setIsSubmitted(true);
    } catch (err) {
      if (err instanceof z.ZodError) {
        const fieldErrors: Record<string, string> = {};
        err.errors.forEach((e) => {
          if (e.path[0]) fieldErrors[e.path[0] as string] = e.message;
        });
        setErrors(fieldErrors);
      } else {
        toast({ title: 'Error', description: 'Failed to submit application.', variant: 'destructive' });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <CheckCircle className="w-16 h-16 text-accent mx-auto mb-6" />
          <h1 className="font-serif text-3xl font-bold text-foreground mb-4">Application Received!</h1>
          <p className="text-muted-foreground mb-8">
            Thank you for your interest in working with Elvis. We'll review your application and get back to you soon.
          </p>
          <Button variant="accent" onClick={() => navigate('/')}>
            <Home size={16} /> Back to Home
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative pt-20 md:pt-8 pb-16 bg-gradient-to-br from-primary via-primary to-primary/90">
        <div className="container max-w-4xl text-center text-primary-foreground">
          <div className="flex justify-center mb-6">
            <div className="p-4 bg-accent/20 rounded-full">
              <Users className="w-12 h-12 text-accent" />
            </div>
          </div>
          <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
            Work With Elvis
          </h1>
          <p className="text-xl md:text-2xl text-primary-foreground/90 max-w-2xl mx-auto mb-8">
            Join a winning team in real estate. Whether you're looking to buy, sell, or build a career — Elvis is ready to work with you.
          </p>
          <div className="flex flex-wrap justify-center gap-4 text-sm">
            <div className="flex items-center gap-2 bg-primary-foreground/10 px-4 py-2 rounded-full">
              <Briefcase size={18} />
              <span>Career Opportunities</span>
            </div>
            <div className="flex items-center gap-2 bg-primary-foreground/10 px-4 py-2 rounded-full">
              <TrendingUp size={18} />
              <span>Grow Your Skills</span>
            </div>
            <div className="flex items-center gap-2 bg-primary-foreground/10 px-4 py-2 rounded-full">
              <Home size={18} />
              <span>Real Estate Excellence</span>
            </div>
          </div>
        </div>
      </section>

      {/* Why Work With Elvis */}
      <section className="py-16 bg-muted/30">
        <div className="container max-w-4xl">
          <h2 className="font-serif text-3xl font-bold text-center text-foreground mb-12">
            Why Work With Elvis?
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Briefcase className="w-8 h-8 text-accent" />
              </div>
              <h3 className="font-serif text-xl font-semibold mb-2">Proven Track Record</h3>
              <p className="text-muted-foreground">Join a team with years of experience and countless successful transactions.</p>
            </div>
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="w-8 h-8 text-accent" />
              </div>
              <h3 className="font-serif text-xl font-semibold mb-2">Growth Opportunities</h3>
              <p className="text-muted-foreground">Learn from the best and accelerate your career in real estate.</p>
            </div>
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-accent" />
              </div>
              <h3 className="font-serif text-xl font-semibold mb-2">Supportive Team</h3>
              <p className="text-muted-foreground">Work alongside professionals who are committed to your success.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Application Form */}
      <section className="py-16">
        <div className="container max-w-xl">
          <div className="bg-card rounded-2xl shadow-lg p-8">
            <h2 className="font-serif text-2xl font-bold text-center text-foreground mb-2">
              Apply to Work With Elvis
            </h2>
            <p className="text-muted-foreground text-center mb-8">
              Tell us about yourself and how you'd like to contribute.
            </p>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name *</Label>
                <Input
                  id="fullName"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  placeholder="John Doe"
                  className={errors.fullName ? 'border-destructive' : ''}
                />
                {errors.fullName && <p className="text-destructive text-sm">{errors.fullName}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email Address *</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="john@example.com"
                  className={errors.email ? 'border-destructive' : ''}
                />
                {errors.email && <p className="text-destructive text-sm">{errors.email}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="location">Location *</Label>
                  <Input
                    id="location"
                    name="location"
                    value={formData.location}
                    onChange={handleChange}
                    placeholder="City, State"
                    className={errors.location ? 'border-destructive' : ''}
                  />
                  {errors.location && <p className="text-destructive text-sm">{errors.location}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="age">Age *</Label>
                  <Input
                    id="age"
                    name="age"
                    value={formData.age}
                    onChange={handleChange}
                    placeholder="25"
                    className={errors.age ? 'border-destructive' : ''}
                  />
                  {errors.age && <p className="text-destructive text-sm">{errors.age}</p>}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="skill">Your Skill / Expertise *</Label>
                <Input
                  id="skill"
                  name="skill"
                  value={formData.skill}
                  onChange={handleChange}
                  placeholder="e.g., Sales, Marketing, Photography"
                  className={errors.skill ? 'border-destructive' : ''}
                />
                {errors.skill && <p className="text-destructive text-sm">{errors.skill}</p>}
              </div>

              <div className="space-y-2">
                <Label>Skill Level *</Label>
                <Select onValueChange={handleSelectChange} value={formData.skillLevel}>
                  <SelectTrigger className={errors.skillLevel ? 'border-destructive' : ''}>
                    <SelectValue placeholder="Select your skill level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Beginner">Beginner</SelectItem>
                    <SelectItem value="Intermediate">Intermediate</SelectItem>
                    <SelectItem value="Advanced">Advanced</SelectItem>
                  </SelectContent>
                </Select>
                {errors.skillLevel && <p className="text-destructive text-sm">{errors.skillLevel}</p>}
              </div>

              <Button type="submit" variant="accent" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? 'Submitting...' : 'Submit Application'}
              </Button>
            </form>
          </div>
        </div>
      </section>
    </div>
  );
};

export default WorkWithMePage;
