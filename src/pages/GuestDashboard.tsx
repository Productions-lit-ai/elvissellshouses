import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { FileText, Home, Briefcase } from 'lucide-react';

const GuestDashboard: React.FC = () => {
  const { user, isAdmin, isLoading } = useAuth();
  const navigate = useNavigate();
  const [submissions, setSubmissions] = useState({ buy: 0, sell: 0, work: 0 });

  useEffect(() => {
    if (!isLoading && !user) {
      navigate('/signin');
    } else if (!isLoading && isAdmin) {
      navigate('/admin');
    }
  }, [user, isAdmin, isLoading, navigate]);

  // Fetch submissions
  useEffect(() => {
    if (!user) return;

    const fetchSubmissions = async () => {
      const [buyRes, sellRes, workRes] = await Promise.all([
        supabase.from('buy_requests').select('id').eq('user_id', user.id),
        supabase.from('sell_requests').select('id').eq('user_id', user.id),
        supabase.from('work_with_me_requests').select('id').eq('user_id', user.id),
      ]);
      setSubmissions({
        buy: buyRes.data?.length || 0,
        sell: sellRes.data?.length || 0,
        work: workRes.data?.length || 0,
      });
    };

    fetchSubmissions();
  }, [user]);

  if (isLoading) return <div className="min-h-screen flex items-center justify-center bg-background">Loading...</div>;

  return (
    <div className="min-h-screen bg-background pt-20 md:pt-8 pb-16">
      <div className="container max-w-3xl px-4">
        <div className="mb-8">
          <h1 className="font-serif text-3xl font-bold text-foreground">My Dashboard</h1>
          <p className="text-muted-foreground mt-1">Welcome back! Here's your activity summary.</p>
        </div>
        
        {/* Submission Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-card rounded-xl p-6 shadow-sm border border-border">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg flex items-center justify-center">
                <Home className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{submissions.buy}</p>
                <p className="text-muted-foreground text-sm">Buy Requests</p>
              </div>
            </div>
          </div>
          <div className="bg-card rounded-xl p-6 shadow-sm border border-border">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                <FileText className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{submissions.sell}</p>
                <p className="text-muted-foreground text-sm">Sell Requests</p>
              </div>
            </div>
          </div>
          <div className="bg-card rounded-xl p-6 shadow-sm border border-border">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                <Briefcase className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{submissions.work}</p>
                <p className="text-muted-foreground text-sm">Work Apps</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GuestDashboard;
