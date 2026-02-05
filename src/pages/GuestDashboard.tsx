import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { FileText, Home, Briefcase, TableIcon } from 'lucide-react';
import CRMPivotTable from '@/components/crm/CRMPivotTable';
import CRMApplicationTable, { Application, ApplicationStatus } from '@/components/crm/CRMApplicationTable';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';

const GuestDashboard: React.FC = () => {
  const { user, isAdmin, isLoading } = useAuth();
  const navigate = useNavigate();
  const [submissions, setSubmissions] = useState({ buy: 0, sell: 0, work: 0 });
  const [applications, setApplications] = useState<Application[]>([]);

  useEffect(() => {
    if (!isLoading && !user) {
      navigate('/signin');
    }
  }, [user, isLoading, navigate]);

  // Fetch user's own submissions
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

  // Fetch all applications for admin
  const fetchApplications = async () => {
    const { data, error } = await supabase
      .from('applications_crm')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (!error && data) {
      setApplications(data as Application[]);
    }
  };

  useEffect(() => {
    if (!isAdmin) return;

    fetchApplications();

    // Real-time subscription for admins
    const channel = supabase
      .channel('dashboard_applications')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'applications_crm',
        },
        (payload) => {
          fetchApplications();
          if (payload.eventType === 'INSERT') {
            toast.success('New form submission received!', {
              description: 'A new lead has been added to your dashboard.',
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isAdmin]);

  const handleStatusChange = (id: string, status: ApplicationStatus) => {
    setApplications(prev =>
      prev.map(app => (app.id === id ? { ...app, status } : app))
    );
  };

  const handleOpenChat = (app: Application) => {
    // Navigate to admin dashboard messaging section if needed
    navigate('/admin');
  };

  if (isLoading) return <div className="min-h-screen flex items-center justify-center bg-background">Loading...</div>;

  return (
    <div className="min-h-screen bg-background pt-20 md:pt-8 pb-16">
      <div className="container max-w-7xl px-4">
        <div className="mb-8">
          <h1 className="font-serif text-3xl font-bold text-foreground">My Dashboard</h1>
          <p className="text-muted-foreground mt-1">Welcome back! Here's your activity summary.</p>
        </div>
        
        {/* Submission Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
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

        {/* Admin-only Form Submissions Table */}
        {isAdmin && (
          <div className="space-y-4">
            <div>
              <h2 className="font-serif text-2xl font-bold text-foreground">Form Submissions</h2>
              <p className="text-muted-foreground text-sm">All form submissions across your website (Admin View Only)</p>
            </div>
            
            <Tabs defaultValue="table" className="w-full">
              <TabsList className="mb-4">
                <TabsTrigger value="table" className="flex items-center gap-2">
                  <TableIcon className="w-4 h-4" />
                  Detailed Table
                </TabsTrigger>
                <TabsTrigger value="summary" className="flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Summary View
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="table" className="mt-0">
                <CRMApplicationTable
                  applications={applications}
                  onStatusChange={handleStatusChange}
                  onOpenChat={handleOpenChat}
                  onRefresh={fetchApplications}
                />
              </TabsContent>
              
              <TabsContent value="summary" className="mt-0">
                <CRMPivotTable applications={applications} />
              </TabsContent>
            </Tabs>
          </div>
        )}
      </div>
    </div>
  );
};

export default GuestDashboard;
