import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import CRMKPICards from '@/components/crm/CRMKPICards';
import CRMCharts from '@/components/crm/CRMCharts';
import CRMApplicationTable, { Application, ApplicationStatus } from '@/components/crm/CRMApplicationTable';
import CRMMessaging from '@/components/crm/CRMMessaging';
import CRMSidebar from '@/components/crm/CRMSidebar';
import SocialLinksSettings from '@/components/crm/SocialLinksSettings';
import CRMPivotTable from '@/components/crm/CRMPivotTable';
import { LayoutDashboard, Users, BarChart3, MessageSquare, Menu, RefreshCw, Settings, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { toast } from 'sonner';

type CRMView = 'dashboard' | 'leads' | 'analytics' | 'messages' | 'settings';

const AdminDashboard: React.FC = () => {
  const { user, isAdmin, isLoading } = useAuth();
  const navigate = useNavigate();
  
  const [applications, setApplications] = useState<Application[]>([]);
  const [activeView, setActiveView] = useState<CRMView>('dashboard');
  const [chatUserId, setChatUserId] = useState<string | null>(null);
  const [chatUserName, setChatUserName] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSendingReport, setIsSendingReport] = useState(false);

  useEffect(() => {
    if (!isLoading && (!user || !isAdmin)) navigate('/signin');
  }, [user, isAdmin, isLoading, navigate]);

  const fetchData = async () => {
    setIsRefreshing(true);
    try {
      const { data, error } = await supabase
        .from('applications_crm')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setApplications((data || []) as Application[]);
    } catch (error) {
      toast.error('Failed to fetch applications');
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchData();
    }
  }, [isAdmin]);

  // KPI data
  const kpiData = useMemo(() => ({
    totalLeads: applications.length,
    newLeads: applications.filter(a => a.status === 'new').length,
    contactedLeads: applications.filter(a => a.status === 'contacted').length,
    closedLeads: applications.filter(a => a.status === 'approved').length,
    buyLeads: applications.filter(a => a.application_type === 'buy').length,
    sellLeads: applications.filter(a => a.application_type === 'sell').length,
    workLeads: applications.filter(a => a.application_type === 'work').length,
    inReviewLeads: applications.filter(a => a.status === 'in_review').length,
    rejectedLeads: applications.filter(a => a.status === 'rejected').length,
  }), [applications]);

  // Chart data
  const chartData = useMemo(() => {
    // Applications by type
    const leadsByType = [
      { name: 'Buying a House', value: kpiData.buyLeads, color: '#10b981' },
      { name: 'Selling a House', value: kpiData.sellLeads, color: '#3b82f6' },
      { name: 'Work With Me', value: kpiData.workLeads, color: '#8b5cf6' },
    ].filter(d => d.value > 0);

    // Applications by status
    const leadsByStatus = [
      { name: 'New', value: kpiData.newLeads, color: '#10b981' },
      { name: 'In Review', value: kpiData.inReviewLeads, color: '#f59e0b' },
      { name: 'Contacted', value: kpiData.contactedLeads, color: '#3b82f6' },
      { name: 'Approved', value: kpiData.closedLeads, color: '#8b5cf6' },
      { name: 'Rejected', value: kpiData.rejectedLeads, color: '#ef4444' },
    ].filter(d => d.value > 0);

    // Applications by location
    const locationMap = new Map<string, number>();
    applications.forEach(app => {
      if (app.location) {
        const loc = app.location.split(',')[0].trim().substring(0, 20);
        locationMap.set(loc, (locationMap.get(loc) || 0) + 1);
      }
    });
    const leadsByLocation = Array.from(locationMap.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    // Applications over time (last 7 days)
    const dateMap = new Map<string, number>();
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      dateMap.set(d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), 0);
    }
    applications.forEach(app => {
      const d = new Date(app.created_at);
      const key = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      if (dateMap.has(key)) {
        dateMap.set(key, (dateMap.get(key) || 0) + 1);
      }
    });
    const leadsByDate = Array.from(dateMap.entries()).map(([date, count]) => ({ date, count }));

    return { leadsByType, leadsByStatus, leadsByLocation, leadsByDate };
  }, [applications, kpiData]);

  const handleStatusChange = (id: string, status: ApplicationStatus) => {
    setApplications(prev => 
      prev.map(app => app.id === id ? { ...app, status } : app)
    );
  };

  const handleOpenChat = (app: Application) => {
    if (app.user_id) {
      setChatUserId(app.user_id);
      setChatUserName(app.full_name);
      setActiveView('messages');
    }
  };

  const handleSendReport = async () => {
    setIsSendingReport(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-notification', {
        body: {
          type: 'summary_report',
          data: {
            applications: applications.map(app => ({
              id: app.id,
              application_type: app.application_type,
              full_name: app.full_name,
              phone_number: app.phone_number,
              email_address: app.email_address,
              location: app.location,
              status: app.status,
              additional_data: app.additional_data,
              created_at: app.created_at,
            })),
          },
        },
      });
      
      if (error) throw error;
      toast.success('Summary report sent to admin emails');
    } catch (error) {
      console.error('Failed to send report:', error);
      toast.error('Failed to send summary report');
    } finally {
      setIsSendingReport(false);
    }
  };

  const MobileNav = () => (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon" className="lg:hidden">
          <Menu className="w-5 h-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-72 p-0 bg-sidebar">
        <div className="p-6 border-b border-sidebar-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sidebar-primary flex items-center justify-center">
              <span className="text-lg font-bold text-sidebar-primary-foreground">E</span>
            </div>
            <div>
              <h2 className="text-lg font-serif font-bold text-sidebar-foreground">Admin CRM</h2>
              <p className="text-xs text-sidebar-foreground/50">Elvis Sells Houses</p>
            </div>
          </div>
        </div>
        <nav className="px-3 py-4">
          <p className="px-4 text-xs font-semibold text-sidebar-foreground/50 uppercase tracking-wider mb-3">
            Main Menu
          </p>
          {[
            { id: 'dashboard' as CRMView, label: 'Dashboard', icon: LayoutDashboard },
            { id: 'leads' as CRMView, label: 'Applications', icon: Users },
            { id: 'analytics' as CRMView, label: 'Analytics', icon: BarChart3 },
            { id: 'messages' as CRMView, label: 'Messages', icon: MessageSquare },
            { id: 'settings' as CRMView, label: 'Settings', icon: Settings },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveView(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 mb-1 ${
                activeView === item.id
                  ? 'bg-sidebar-primary text-sidebar-primary-foreground shadow-lg'
                  : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground'
              }`}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </button>
          ))}
        </nav>
      </SheetContent>
    </Sheet>
  );

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <RefreshCw className="w-8 h-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* Desktop Sidebar */}
      <CRMSidebar activeView={activeView} onViewChange={setActiveView} />

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {/* Top Header Bar */}
        <header className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
          <div className="flex items-center justify-between px-4 md:px-6 lg:px-8 h-16">
            <div className="flex items-center gap-4">
              <MobileNav />
              <div className="hidden lg:block">
                <h1 className="font-serif text-xl font-bold text-foreground">
                {activeView === 'dashboard' && 'Dashboard Overview'}
                  {activeView === 'leads' && 'Application Management'}
                  {activeView === 'analytics' && 'Analytics & Insights'}
                  {activeView === 'messages' && 'Private Messages'}
                  {activeView === 'settings' && 'Settings'}
                </h1>
              </div>
              <div className="lg:hidden">
                <h1 className="font-serif text-lg font-bold text-foreground">Admin CRM</h1>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={fetchData}
                disabled={isRefreshing}
                className="hidden sm:flex"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button 
                variant="outline" 
                size="icon" 
                onClick={fetchData}
                disabled={isRefreshing}
                className="sm:hidden"
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              </Button>
              <Button 
                variant="default" 
                size="sm" 
                onClick={handleSendReport}
                disabled={isSendingReport || applications.length === 0}
                className="hidden sm:flex"
              >
                <Mail className={`w-4 h-4 mr-2 ${isSendingReport ? 'animate-pulse' : ''}`} />
                {isSendingReport ? 'Sending...' : 'Email Report'}
              </Button>
            </div>
          </div>
        </header>

        <div className="p-4 md:p-6 lg:p-8">
          {/* Dashboard View */}
          {activeView === 'dashboard' && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground">Welcome back! Here's your application summary for today.</p>
                </div>
              </div>

              <CRMKPICards data={kpiData} />
              <CRMPivotTable applications={applications} />
              <CRMCharts data={chartData} />

              {/* Recent Applications Preview */}
              <div className="bg-card rounded-xl p-6 shadow-sm border border-border/50">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-foreground text-lg">Recent Applications</h3>
                    <p className="text-sm text-muted-foreground">Latest 5 submissions</p>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => setActiveView('leads')}>
                    View All Applications
                  </Button>
                </div>
                <CRMApplicationTable 
                  applications={applications.slice(0, 5)} 
                  onStatusChange={handleStatusChange}
                  onOpenChat={handleOpenChat}
                  onRefresh={fetchData}
                />
              </div>
            </div>
          )}

          {/* Leads View */}
          {activeView === 'leads' && (
            <div className="space-y-6 animate-fade-in">
              <div>
                <p className="text-muted-foreground">Manage and track all your applications in one place.</p>
              </div>
              <CRMApplicationTable 
                applications={applications} 
                onStatusChange={handleStatusChange}
                onOpenChat={handleOpenChat}
                onRefresh={fetchData}
              />
            </div>
          )}

          {/* Analytics View */}
          {activeView === 'analytics' && (
            <div className="space-y-6 animate-fade-in">
              <div>
                <p className="text-muted-foreground">Visualize your application data and trends.</p>
              </div>
              <CRMKPICards data={kpiData} />
              <CRMCharts data={chartData} />
            </div>
          )}

          {/* Messages View */}
          {activeView === 'messages' && (
            <div className="space-y-6 animate-fade-in">
              <div>
                <p className="text-muted-foreground">Private conversations with your applicants.</p>
              </div>
              <CRMMessaging 
                selectedUserId={chatUserId}
                selectedUserName={chatUserName}
                onClose={() => {
                  setChatUserId(null);
                  setChatUserName(null);
                }}
              />
            </div>
          )}

          {/* Settings View */}
          {activeView === 'settings' && (
            <div className="space-y-6 animate-fade-in">
              <div>
                <p className="text-muted-foreground">Configure your website and social media settings.</p>
              </div>
              <SocialLinksSettings />
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;