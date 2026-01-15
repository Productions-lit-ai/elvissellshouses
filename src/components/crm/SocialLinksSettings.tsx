import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Instagram, Facebook, Twitter, Linkedin, Youtube, Save, Loader2 } from 'lucide-react';

interface SocialLink {
  id: string;
  url: string;
  enabled: boolean;
}

const socialIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  instagram: Instagram,
  facebook: Facebook,
  twitter: Twitter,
  linkedin: Linkedin,
  youtube: Youtube,
};

const socialLabels: Record<string, string> = {
  instagram: 'Instagram',
  facebook: 'Facebook',
  twitter: 'Twitter / X',
  linkedin: 'LinkedIn',
  youtube: 'YouTube',
};

const socialPlaceholders: Record<string, string> = {
  instagram: 'https://instagram.com/yourusername',
  facebook: 'https://facebook.com/yourpage',
  twitter: 'https://twitter.com/yourusername',
  linkedin: 'https://linkedin.com/in/yourprofile',
  youtube: 'https://youtube.com/@yourchannel',
};

const SocialLinksSettings: React.FC = () => {
  const [links, setLinks] = useState<SocialLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchLinks();
  }, []);

  const fetchLinks = async () => {
    const { data, error } = await supabase
      .from('social_links')
      .select('*')
      .order('id');

    if (error) {
      toast.error('Failed to load social links');
    } else {
      setLinks(data || []);
    }
    setLoading(false);
  };

  const handleUrlChange = (id: string, url: string) => {
    setLinks(prev => prev.map(link => 
      link.id === id ? { ...link, url } : link
    ));
  };

  const handleEnabledChange = (id: string, enabled: boolean) => {
    setLinks(prev => prev.map(link => 
      link.id === id ? { ...link, enabled } : link
    ));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      for (const link of links) {
        const { error } = await supabase
          .from('social_links')
          .update({ url: link.url, enabled: link.enabled, updated_at: new Date().toISOString() })
          .eq('id', link.id);
        
        if (error) throw error;
      }
      toast.success('Social links saved successfully!');
    } catch (error) {
      toast.error('Failed to save social links');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="bg-card rounded-xl p-6 shadow-sm border border-border/50">
      <div className="mb-6">
        <h3 className="font-semibold text-foreground text-lg">Social Media Links</h3>
        <p className="text-sm text-muted-foreground">Configure the social media links shown in the website footer.</p>
      </div>

      <div className="space-y-6">
        {links.map((link) => {
          const Icon = socialIcons[link.id];
          return (
            <div key={link.id} className="flex items-start gap-4 p-4 bg-muted/30 rounded-lg">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                {Icon && <Icon className="w-5 h-5 text-primary" />}
              </div>
              <div className="flex-1 space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="font-medium">{socialLabels[link.id] || link.id}</Label>
                  <div className="flex items-center gap-2">
                    <Label htmlFor={`${link.id}-enabled`} className="text-sm text-muted-foreground">
                      {link.enabled ? 'Visible' : 'Hidden'}
                    </Label>
                    <Switch
                      id={`${link.id}-enabled`}
                      checked={link.enabled}
                      onCheckedChange={(checked) => handleEnabledChange(link.id, checked)}
                    />
                  </div>
                </div>
                <Input
                  value={link.url}
                  onChange={(e) => handleUrlChange(link.id, e.target.value)}
                  placeholder={socialPlaceholders[link.id]}
                  className="bg-background"
                />
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-6 flex justify-end">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Save className="w-4 h-4 mr-2" />
          )}
          Save Changes
        </Button>
      </div>
    </div>
  );
};

export default SocialLinksSettings;
