import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import CRMKPICards from '@/components/crm/CRMKPICards';
import CRMCharts from '@/components/crm/CRMCharts';
import CRMLeadTable, { Lead } from '@/components/crm/CRMLeadTable';
import CRMMessaging from '@/components/crm/CRMMessaging';
import CRMSidebar from '@/components/crm/CRMSidebar';
import { LayoutDashboard, Users, BarChart3, MessageSquare, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

type CRMView = 'dashboard' | 'leads' | 'analytics' | 'messages';

interface BuyRequest { id: string; full_name: string; email: string; phone_number: string; buying_budget: string; preferred_area: string; created_at: string; user_id: string; lead_status: string; }
interface SellRequest { id: string; full_name: string; email: string; phone_number: string; home_address: string; created_at: string; user_id: string; lead_status: string; }
interface WorkRequest { id: string; full_name: string; email: string; location: string; age: string; skill: string; skill_level: string; created_at: string; user_id: string | null; lead_status: string; phone_number?: string; }

const AdminDashboard: React.FC = () => {
  const { user, isAdmin, isLoading } = useAuth();
  const navigate = useNavigate();
  
  const [buyRequests, setBuyRequests] = useState<BuyRequest[]>([]);
  const [sellRequests, setSellRequests] = useState<SellRequest[]>([]);
  const [workRequests, setWorkRequests] = useState<WorkRequest[]>([]);
  const [activeView, setActiveView] = useState<CRMView>('dashboard');
  const [chatUserId, setChatUserId] = useState<string | null>(null);
  const [chatUserName, setChatUserName] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && (!user || !isAdmin)) navigate('/signin');
  }, [user, isAdmin, isLoading, navigate]);

  useEffect(() => {
    if (isAdmin) {
      supabase.from('buy_requests').select('*').order('created_at', { ascending: false }).then(({ data }) => setBuyRequests(data || []));
      supabase.from('sell_requests').select('*').order('created_at', { ascending: false }).then(({ data }) => setSellRequests(data || []));
      supabase.from('work_with_me_requests').select('*').order('created_at', { ascending: false }).then(({ data }) => setWorkRequests(data || []));
    }
  }, [isAdmin]);

  // Combine all leads
  const allLeads: Lead[] = useMemo(() => {
    const leads: Lead[] = [];

    buyRequests.forEach(r => leads.push({
      id: r.id,
      type: 'buy',
      full_name: r.full_name,
      email: r.email,
      phone_number: r.phone_number,
      location: r.preferred_area,
      details: `Budget: ${r.buying_budget}`,
      created_at: r.created_at,
      lead_status: r.lead_status || 'new',
      user_id: r.user_id,
    }));

    sellRequests.forEach(r => leads.push({
      id: r.id,
      type: 'sell',
      full_name: r.full_name,
      email: r.email,
      phone_number: r.phone_number,
      location: r.home_address,
      details: `Address: ${r.home_address}`,
      created_at: r.created_at,
      lead_status: r.lead_status || 'new',
      user_id: r.user_id,
    }));

    workRequests.forEach(r => leads.push({
      id: r.id,
      type: 'work',
      full_name: r.full_name,
      email: r.email,
      phone_number: r.phone_number || '',
      location: r.location,
      age: r.age,
      details: `${r.skill} (${r.skill_level})`,
      created_at: r.created_at,
      lead_status: r.lead_status || 'new',
      user_id: r.user_id,
    }));

    return leads.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [buyRequests, sellRequests, workRequests]);

  // KPI data
  const kpiData = useMemo(() => ({
    totalLeads: allLeads.length,
    newLeads: allLeads.filter(l => l.lead_status === 'new').length,
    contactedLeads: allLeads.filter(l => l.lead_status === 'contacted').length,
    closedLeads: allLeads.filter(l => l.lead_status === 'closed').length,
    buyLeads: allLeads.filter(l => l.type === 'buy').length,
    sellLeads: allLeads.filter(l => l.type === 'sell').length,
    workLeads: allLeads.filter(l => l.type === 'work').length,
  }), [allLeads]);

  // Chart data
  const chartData = useMemo(() => {
    // Leads by type
    const leadsByType = [
      { name: 'Buyers', value: kpiData.buyLeads, color: '#10b981' },
      { name: 'Sellers', value: kpiData.sellLeads, color: '#3b82f6' },
      { name: 'Work', value: kpiData.workLeads, color: '#8b5cf6' },
    ].filter(d => d.value > 0);

    // Leads by status
    const leadsByStatus = [
      { name: 'New', value: kpiData.newLeads, color: '#10b981' },
      { name: 'Contacted', value: kpiData.contactedLeads, color: '#3b82f6' },
      { name: 'In Progress', value: allLeads.filter(l => l.lead_status === 'in progress').length, color: '#f59e0b' },
      { name: 'Closed', value: kpiData.closedLeads, color: '#8b5cf6' },
    ].filter(d => d.value > 0);

    // Leads by location
    const locationMap = new Map<string, number>();
    allLeads.forEach(l => {
      if (l.location) {
        const loc = l.location.split(',')[0].trim().substring(0, 20);
        locationMap.set(loc, (locationMap.get(loc) || 0) + 1);
      }
    });
    const leadsByLocation = Array.from(locationMap.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    // Leads over time (last 7 days)
    const dateMap = new Map<string, number>();
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      dateMap.set(d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), 0);
    }
    allLeads.forEach(l => {
      const d = new Date(l.created_at);
      const key = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      if (dateMap.has(key)) {
        dateMap.set(key, (dateMap.get(key) || 0) + 1);
      }
    });
    const leadsByDate = Array.from(dateMap.entries()).map(([date, count]) => ({ date, count }));

    return { leadsByType, leadsByStatus, leadsByLocation, leadsByDate };
  }, [allLeads, kpiData]);

  const handleStatusChange = (id: string, type: string, status: string) => {
    if (type === 'buy') {
      setBuyRequests(prev => prev.map(r => r.id === id ? { ...r, lead_status: status } : r));
    } else if (type === 'sell') {
      setSellRequests(prev => prev.map(r => r.id === id ? { ...r, lead_status: status } : r));
    } else {
      setWorkRequests(prev => prev.map(r => r.id === id ? { ...r, lead_status: status } : r));
    }
  };

  const handleOpenChat = (lead: Lead) => {
    if (lead.user_id) {
      setChatUserId(lead.user_id);
      setChatUserName(lead.full_name);
      setActiveView('messages');
    }
  };

  const MobileNav = () => (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon" className="lg:hidden">
          <Menu className="w-5 h-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-64 p-0 bg-sidebar">
        <div className="p-6">
          <h2 className="text-xl font-serif font-bold text-sidebar-foreground">Admin CRM</h2>
        </div>
        <nav className="px-3">
          {[
            { id: 'dashboard' as CRMView, label: 'Dashboard', icon: LayoutDashboard },
            { id: 'leads' as CRMView, label: 'Leads', icon: Users },
            { id: 'analytics' as CRMView, label: 'Analytics', icon: BarChart3 },
            { id: 'messages' as CRMView, label: 'Messages', icon: MessageSquare },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveView(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors mb-1 ${
                activeView === item.id
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                  : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50'
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

  if (isLoading) return <div className="min-h-screen flex items-center justify-center bg-background">Loading...</div>;

  return (
    <div className="min-h-screen bg-background flex">
      {/* Desktop Sidebar */}
      <CRMSidebar activeView={activeView} onViewChange={setActiveView} />

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-6 lg:p-8 pt-20 lg:pt-8 overflow-auto">
        {/* Mobile Header */}
        <div className="flex items-center gap-4 mb-6 lg:hidden">
          <MobileNav />
          <h1 className="font-serif text-2xl font-bold text-foreground">Admin CRM</h1>
        </div>

        {/* Dashboard View */}
        {activeView === 'dashboard' && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="font-serif text-2xl font-bold text-foreground hidden lg:block">Dashboard Overview</h1>
                <p className="text-muted-foreground mt-1">Welcome back! Here's your lead summary.</p>
              </div>
            </div>

            <CRMKPICards data={kpiData} />
            <CRMCharts data={chartData} />

            {/* Recent Leads Preview */}
            <div className="bg-card rounded-xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-foreground">Recent Leads</h3>
                <Button variant="ghost" size="sm" onClick={() => setActiveView('leads')}>
                  View All
                </Button>
              </div>
              <CRMLeadTable 
                leads={allLeads.slice(0, 5)} 
                onStatusChange={handleStatusChange}
                onOpenChat={handleOpenChat}
              />
            </div>
          </div>
        )}

        {/* Leads View */}
        {activeView === 'leads' && (
          <div className="space-y-6 animate-fade-in">
            <div>
              <h1 className="font-serif text-2xl font-bold text-foreground hidden lg:block">Lead Management</h1>
              <p className="text-muted-foreground mt-1">Manage and track all your leads.</p>
            </div>
            <CRMLeadTable 
              leads={allLeads} 
              onStatusChange={handleStatusChange}
              onOpenChat={handleOpenChat}
            />
          </div>
        )}

        {/* Analytics View */}
        {activeView === 'analytics' && (
          <div className="space-y-6 animate-fade-in">
            <div>
              <h1 className="font-serif text-2xl font-bold text-foreground hidden lg:block">Analytics</h1>
              <p className="text-muted-foreground mt-1">Visualize your lead data and trends.</p>
            </div>
            <CRMKPICards data={kpiData} />
            <CRMCharts data={chartData} />
          </div>
        )}

        {/* Messages View */}
        {activeView === 'messages' && (
          <div className="space-y-6 animate-fade-in">
            <div>
              <h1 className="font-serif text-2xl font-bold text-foreground hidden lg:block">Messages</h1>
              <p className="text-muted-foreground mt-1">Private conversations with your leads.</p>
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
      </main>
    </div>
  );
};

export default AdminDashboard;
