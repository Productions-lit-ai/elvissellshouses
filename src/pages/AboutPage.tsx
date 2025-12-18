import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Info, Save, Edit2 } from 'lucide-react';
import elvis1 from '@/assets/elvis-1.jpg';

const AboutPage: React.FC = () => {
  const { isAdmin } = useAuth();
  const { toast } = useToast();
  const [content, setContent] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchContent = async () => {
      const { data, error } = await supabase
        .from('about_content')
        .select('content')
        .limit(1)
        .single();

      if (!error && data) {
        setContent(data.content);
      }
    };

    fetchContent();
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const { data: existing } = await supabase
        .from('about_content')
        .select('id')
        .limit(1)
        .single();

      if (existing) {
        const { error } = await supabase
          .from('about_content')
          .update({ content })
          .eq('id', existing.id);

        if (error) throw error;
      }

      toast({
        title: 'Content saved!',
        description: 'Your About page has been updated.',
      });
      setIsEditing(false);
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to save content. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <section className="hero-gradient py-20 pt-24 md:pt-20">
        <div className="container">
          <div className="text-center max-w-2xl mx-auto">
            <div className="w-16 h-16 bg-accent/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Info className="w-8 h-8 text-accent" />
            </div>
            <h1 className="font-serif text-4xl sm:text-5xl font-bold text-primary-foreground mb-4">
              About Elvis
            </h1>
            <p className="text-primary-foreground/80 text-lg">
              Learn more about my journey and passion for real estate.
            </p>
          </div>
        </div>
      </section>

      {/* Content Section */}
      <section className="py-16">
        <div className="container max-w-4xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
            {/* Image */}
            <div className="relative">
              <div className="absolute -inset-4 bg-accent/10 rounded-3xl blur-xl" />
              <img
                src={elvis1}
                alt="Elvis - Real Estate Agent"
                className="relative rounded-2xl shadow-xl w-full object-cover aspect-[3/4]"
              />
            </div>

            {/* Content */}
            <div>
              {isAdmin && (
                <div className="flex justify-end mb-4">
                  {isEditing ? (
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsEditing(false)}
                      >
                        Cancel
                      </Button>
                      <Button
                        variant="accent"
                        size="sm"
                        onClick={handleSave}
                        disabled={isSaving}
                      >
                        <Save size={16} />
                        {isSaving ? 'Saving...' : 'Save'}
                      </Button>
                    </div>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsEditing(true)}
                    >
                      <Edit2 size={16} />
                      Edit Content
                    </Button>
                  )}
                </div>
              )}

              {isEditing ? (
                <Textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="min-h-[400px] text-base leading-relaxed"
                  placeholder="Write about yourself, your journey, and your passion for real estate..."
                />
              ) : (
                <div className="prose prose-lg dark:prose-invert max-w-none">
                  <h2 className="font-serif text-2xl font-bold text-foreground mb-6">
                    My Story
                  </h2>
                  {content.split('\n\n').map((paragraph, index) => (
                    <p key={index} className="text-muted-foreground mb-4 leading-relaxed">
                      {paragraph}
                    </p>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default AboutPage;
