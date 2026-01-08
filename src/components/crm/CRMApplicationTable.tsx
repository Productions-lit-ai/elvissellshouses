import React, { useState, useEffect } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { 
  Search, ArrowUpDown, Eye, MessageSquare, ChevronLeft, ChevronRight, 
  CalendarIcon, StickyNote, Send, Trash2, Download, Layers, ChevronDown, ChevronRight as ChevronRightIcon
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

export type ApplicationStatus = 'new' | 'in_review' | 'contacted' | 'approved' | 'rejected';

export interface Application {
  id: string;
  user_id: string | null;
  application_type: 'buy' | 'sell' | 'work';
  full_name: string;
  phone_number: string | null;
  email_address: string;
  location: string | null;
  form_source: string | null;
  status: ApplicationStatus;
  additional_data: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

interface LeadNote {
  id: string;
  lead_id: string;
  lead_type: string;
  note: string;
  created_by: string;
  created_at: string;
}

interface CRMApplicationTableProps {
  applications: Application[];
  onStatusChange: (id: string, status: ApplicationStatus) => void;
  onOpenChat: (app: Application) => void;
  onRefresh: () => void;
}

type SortField = 'full_name' | 'email_address' | 'created_at' | 'location' | 'status' | 'application_type';
type SortOrder = 'asc' | 'desc';
type GroupBy = 'none' | 'application_type' | 'status';

const statusColors: Record<ApplicationStatus, string> = {
  new: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300 border-emerald-200',
  in_review: 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300 border-amber-200',
  contacted: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300 border-blue-200',
  approved: 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300 border-purple-200',
  rejected: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300 border-red-200',
};

const statusLabels: Record<ApplicationStatus, string> = {
  new: 'New',
  in_review: 'In Review',
  contacted: 'Contacted',
  approved: 'Approved',
  rejected: 'Rejected',
};

const typeColors: Record<string, string> = {
  buy: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300',
  sell: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300',
  work: 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300',
};

const typeLabels: Record<string, string> = {
  buy: 'Buying a House',
  sell: 'Selling a House',
  work: 'Work With Me',
};

const CRMApplicationTable: React.FC<CRMApplicationTableProps> = ({ 
  applications, 
  onStatusChange, 
  onOpenChat,
  onRefresh 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortField, setSortField] = useState<SortField>('created_at');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [page, setPage] = useState(1);
  const [dateFrom, setDateFrom] = useState<Date | undefined>(undefined);
  const [dateTo, setDateTo] = useState<Date | undefined>(undefined);
  const [notes, setNotes] = useState<LeadNote[]>([]);
  const [newNote, setNewNote] = useState('');
  const [isLoadingNotes, setIsLoadingNotes] = useState(false);
  const [groupBy, setGroupBy] = useState<GroupBy>('none');
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const pageSize = 15;

  // Initialize all groups as expanded
  useEffect(() => {
    if (groupBy !== 'none') {
      const groups = new Set(
        applications.map(app => groupBy === 'application_type' ? app.application_type : app.status)
      );
      setExpandedGroups(groups);
    }
  }, [groupBy, applications]);

  // Fetch notes when an application is selected
  useEffect(() => {
    if (selectedApp) {
      fetchNotes(selectedApp.id, selectedApp.application_type);
    }
  }, [selectedApp]);

  const fetchNotes = async (leadId: string, leadType: string) => {
    setIsLoadingNotes(true);
    const { data, error } = await supabase
      .from('lead_notes')
      .select('*')
      .eq('lead_id', leadId)
      .eq('lead_type', leadType)
      .order('created_at', { ascending: false });
    
    if (!error && data) {
      setNotes(data);
    }
    setIsLoadingNotes(false);
  };

  const handleAddNote = async () => {
    if (!selectedApp || !newNote.trim()) return;

    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return;

    const { error } = await supabase.from('lead_notes').insert({
      lead_id: selectedApp.id,
      lead_type: selectedApp.application_type,
      note: newNote.trim(),
      created_by: userData.user.id,
    });

    if (error) {
      toast.error('Failed to add note');
    } else {
      toast.success('Note added');
      setNewNote('');
      fetchNotes(selectedApp.id, selectedApp.application_type);
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    const { error } = await supabase.from('lead_notes').delete().eq('id', noteId);
    if (error) {
      toast.error('Failed to delete note');
    } else {
      setNotes(notes.filter(n => n.id !== noteId));
      toast.success('Note deleted');
    }
  };

  const filteredApps = applications
    .filter((app) => {
      const matchesSearch =
        app.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.email_address.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (app.phone_number && app.phone_number.includes(searchTerm));
      const matchesType = typeFilter === 'all' || app.application_type === typeFilter;
      const matchesStatus = statusFilter === 'all' || app.status === statusFilter;
      
      const appDate = new Date(app.created_at);
      const matchesDateFrom = !dateFrom || appDate >= dateFrom;
      const matchesDateTo = !dateTo || appDate <= new Date(dateTo.setHours(23, 59, 59, 999));
      
      return matchesSearch && matchesType && matchesStatus && matchesDateFrom && matchesDateTo;
    })
    .sort((a, b) => {
      let comparison = 0;
      if (sortField === 'full_name') comparison = a.full_name.localeCompare(b.full_name);
      else if (sortField === 'email_address') comparison = a.email_address.localeCompare(b.email_address);
      else if (sortField === 'location') comparison = (a.location || '').localeCompare(b.location || '');
      else if (sortField === 'status') comparison = a.status.localeCompare(b.status);
      else if (sortField === 'application_type') comparison = a.application_type.localeCompare(b.application_type);
      else comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      return sortOrder === 'desc' ? -comparison : comparison;
    });

  // Group applications if grouping is enabled
  const groupedApps = React.useMemo(() => {
    if (groupBy === 'none') return null;
    
    const groups: Record<string, Application[]> = {};
    filteredApps.forEach(app => {
      const key = groupBy === 'application_type' ? app.application_type : app.status;
      if (!groups[key]) groups[key] = [];
      groups[key].push(app);
    });
    return groups;
  }, [filteredApps, groupBy]);

  const toggleGroup = (group: string) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(group)) {
      newExpanded.delete(group);
    } else {
      newExpanded.add(group);
    }
    setExpandedGroups(newExpanded);
  };

  const totalPages = Math.ceil(filteredApps.length / pageSize);
  const paginatedApps = groupBy === 'none' 
    ? filteredApps.slice((page - 1) * pageSize, page * pageSize)
    : filteredApps;

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const handleStatusUpdate = async (app: Application, newStatus: ApplicationStatus) => {
    const { error } = await supabase
      .from('applications_crm')
      .update({ status: newStatus })
      .eq('id', app.id);
    
    if (error) {
      toast.error('Failed to update status');
    } else {
      toast.success('Status updated');
      onStatusChange(app.id, newStatus);
    }
  };

  const clearDateFilters = () => {
    setDateFrom(undefined);
    setDateTo(undefined);
  };

  // Export to CSV
  const exportToCSV = () => {
    const headers = ['Full Name', 'Email', 'Phone', 'Location', 'Application Type', 'Status', 'Submission Date', 'Additional Data'];
    const rows = filteredApps.map(app => [
      app.full_name,
      app.email_address,
      app.phone_number || '',
      app.location || '',
      typeLabels[app.application_type],
      statusLabels[app.status],
      new Date(app.created_at).toLocaleDateString(),
      JSON.stringify(app.additional_data)
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `applications_export_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
    toast.success('Exported to CSV');
  };

  const renderTableRow = (app: Application) => (
    <TableRow 
      key={app.id} 
      className="hover:bg-muted/20 cursor-pointer transition-colors"
      onClick={() => setSelectedApp(app)}
    >
      <TableCell className="font-medium text-foreground">{app.full_name}</TableCell>
      <TableCell className="text-muted-foreground">{app.email_address}</TableCell>
      <TableCell className="text-muted-foreground">{app.phone_number || '-'}</TableCell>
      <TableCell className="max-w-[180px] truncate text-muted-foreground">{app.location || '-'}</TableCell>
      <TableCell>
        <Badge className={cn(typeColors[app.application_type], "font-medium")} variant="secondary">
          {typeLabels[app.application_type]}
        </Badge>
      </TableCell>
      <TableCell className="text-muted-foreground">
        {new Date(app.created_at).toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric', 
          year: 'numeric' 
        })}
      </TableCell>
      <TableCell onClick={(e) => e.stopPropagation()}>
        <Select
          value={app.status}
          onValueChange={(value) => handleStatusUpdate(app, value as ApplicationStatus)}
        >
          <SelectTrigger className={cn("w-[130px] h-8 text-xs border", statusColors[app.status])}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="new">New</SelectItem>
            <SelectItem value="in_review">In Review</SelectItem>
            <SelectItem value="contacted">Contacted</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
      </TableCell>
      <TableCell onClick={(e) => e.stopPropagation()}>
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 hover:bg-primary/10 hover:text-primary"
            onClick={() => setSelectedApp(app)}
          >
            <Eye className="w-4 h-4" />
          </Button>
          {app.user_id && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 hover:bg-primary/10 hover:text-primary"
              onClick={() => onOpenChat(app)}
            >
              <MessageSquare className="w-4 h-4" />
            </Button>
          )}
        </div>
      </TableCell>
    </TableRow>
  );

  return (
    <div className="space-y-4">
      {/* Filters - Zoho-style filter bar */}
      <div className="bg-card rounded-xl p-4 shadow-sm border border-border/50">
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, email, or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-10 bg-background"
            />
          </div>
          
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[180px] h-10 bg-background">
              <SelectValue placeholder="Application Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="buy">Buying a House</SelectItem>
              <SelectItem value="sell">Selling a House</SelectItem>
              <SelectItem value="work">Work With Me</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[160px] h-10 bg-background">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="new">New</SelectItem>
              <SelectItem value="in_review">In Review</SelectItem>
              <SelectItem value="contacted">Contacted</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>

          {/* Date Range Filters */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className={cn("w-[140px] h-10 justify-start text-left font-normal", !dateFrom && "text-muted-foreground")}>
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateFrom ? format(dateFrom, "MMM d, yyyy") : "From Date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar mode="single" selected={dateFrom} onSelect={setDateFrom} initialFocus className="pointer-events-auto" />
            </PopoverContent>
          </Popover>

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className={cn("w-[140px] h-10 justify-start text-left font-normal", !dateTo && "text-muted-foreground")}>
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateTo ? format(dateTo, "MMM d, yyyy") : "To Date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar mode="single" selected={dateTo} onSelect={setDateTo} initialFocus className="pointer-events-auto" />
            </PopoverContent>
          </Popover>

          {(dateFrom || dateTo) && (
            <Button variant="ghost" size="sm" onClick={clearDateFilters} className="h-10 text-muted-foreground hover:text-foreground">
              Clear Dates
            </Button>
          )}
        </div>

        {/* Grouping & Export Controls */}
        <div className="flex flex-wrap gap-3 items-center mt-3 pt-3 border-t border-border/50">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Group by:</span>
            <Select value={groupBy} onValueChange={(v) => setGroupBy(v as GroupBy)}>
              <SelectTrigger className="w-[160px] h-9 bg-background">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No Grouping</SelectItem>
                <SelectItem value="application_type">Application Type</SelectItem>
                <SelectItem value="status">Status</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex-1" />

          <Button variant="outline" size="sm" onClick={exportToCSV} className="h-9">
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>

          <div className="text-sm text-muted-foreground">
            {filteredApps.length} application{filteredApps.length !== 1 ? 's' : ''}
          </div>
        </div>
      </div>

      {/* Table - Enhanced Zoho-style */}
      <div className="bg-card rounded-xl shadow-sm overflow-hidden border border-border/50">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30 hover:bg-muted/30">
                <TableHead className="cursor-pointer font-semibold" onClick={() => handleSort('full_name')}>
                  <div className="flex items-center gap-2">
                    Full Name <ArrowUpDown className="w-3.5 h-3.5 text-muted-foreground" />
                  </div>
                </TableHead>
                <TableHead className="cursor-pointer font-semibold" onClick={() => handleSort('email_address')}>
                  <div className="flex items-center gap-2">
                    Email <ArrowUpDown className="w-3.5 h-3.5 text-muted-foreground" />
                  </div>
                </TableHead>
                <TableHead className="font-semibold">Phone</TableHead>
                <TableHead className="cursor-pointer font-semibold" onClick={() => handleSort('location')}>
                  <div className="flex items-center gap-2">
                    Location <ArrowUpDown className="w-3.5 h-3.5 text-muted-foreground" />
                  </div>
                </TableHead>
                <TableHead className="cursor-pointer font-semibold" onClick={() => handleSort('application_type')}>
                  <div className="flex items-center gap-2">
                    Type <ArrowUpDown className="w-3.5 h-3.5 text-muted-foreground" />
                  </div>
                </TableHead>
                <TableHead className="cursor-pointer font-semibold" onClick={() => handleSort('created_at')}>
                  <div className="flex items-center gap-2">
                    Submitted <ArrowUpDown className="w-3.5 h-3.5 text-muted-foreground" />
                  </div>
                </TableHead>
                <TableHead className="cursor-pointer font-semibold" onClick={() => handleSort('status')}>
                  <div className="flex items-center gap-2">
                    Status <ArrowUpDown className="w-3.5 h-3.5 text-muted-foreground" />
                  </div>
                </TableHead>
                <TableHead className="font-semibold">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {groupBy !== 'none' && groupedApps ? (
                Object.entries(groupedApps).map(([group, apps]) => (
                  <React.Fragment key={group}>
                    {/* Group Header Row */}
                    <TableRow 
                      className="bg-muted/50 hover:bg-muted/60 cursor-pointer"
                      onClick={() => toggleGroup(group)}
                    >
                      <TableCell colSpan={8} className="py-3">
                        <div className="flex items-center gap-3">
                          {expandedGroups.has(group) ? (
                            <ChevronDown className="w-4 h-4 text-muted-foreground" />
                          ) : (
                            <ChevronRightIcon className="w-4 h-4 text-muted-foreground" />
                          )}
                          <Badge className={cn(
                            groupBy === 'application_type' ? typeColors[group] : statusColors[group as ApplicationStatus],
                            "font-medium"
                          )}>
                            {groupBy === 'application_type' ? typeLabels[group] : statusLabels[group as ApplicationStatus]}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            ({apps.length} application{apps.length !== 1 ? 's' : ''})
                          </span>
                        </div>
                      </TableCell>
                    </TableRow>
                    {/* Group Items */}
                    {expandedGroups.has(group) && apps.map(renderTableRow)}
                  </React.Fragment>
                ))
              ) : (
                paginatedApps.map(renderTableRow)
              )}
              {filteredApps.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground py-12">
                    <div className="flex flex-col items-center gap-2">
                      <Search className="w-8 h-8 text-muted-foreground/50" />
                      <p>No applications found matching your criteria.</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination - Only show when not grouping */}
        {groupBy === 'none' && totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-muted/20">
            <p className="text-sm text-muted-foreground">
              Showing <span className="font-medium text-foreground">{(page - 1) * pageSize + 1}</span> to{' '}
              <span className="font-medium text-foreground">{Math.min(page * pageSize, filteredApps.length)}</span> of{' '}
              <span className="font-medium text-foreground">{filteredApps.length}</span> applications
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="h-8"
              >
                <ChevronLeft className="w-4 h-4 mr-1" /> Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="h-8"
              >
                Next <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Application Detail Dialog */}
      <Dialog open={!!selectedApp} onOpenChange={() => { setSelectedApp(null); setNotes([]); setNewNote(''); }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-lg font-bold text-primary">
                  {selectedApp?.full_name?.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <span className="text-xl">{selectedApp?.full_name}</span>
                <Badge className={cn(typeColors[selectedApp?.application_type || 'buy'], "ml-3 text-xs")}>
                  {selectedApp && typeLabels[selectedApp.application_type]}
                </Badge>
              </div>
            </DialogTitle>
          </DialogHeader>
          
          {selectedApp && (
            <div className="space-y-6 mt-4">
              {/* Contact Info Card */}
              <div className="bg-muted/30 rounded-lg p-4 space-y-3">
                <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Contact Information</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Email</p>
                    <p className="font-medium">{selectedApp.email_address}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Phone</p>
                    <p className="font-medium">{selectedApp.phone_number || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Location</p>
                    <p className="font-medium">{selectedApp.location || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Source</p>
                    <p className="font-medium">{selectedApp.form_source || 'Website'}</p>
                  </div>
                </div>
              </div>

              {/* Application Details Card */}
              <div className="bg-muted/30 rounded-lg p-4 space-y-3">
                <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Application Details</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Status</p>
                    <Select
                      value={selectedApp.status}
                      onValueChange={(value) => {
                        handleStatusUpdate(selectedApp, value as ApplicationStatus);
                        setSelectedApp({ ...selectedApp, status: value as ApplicationStatus });
                      }}
                    >
                      <SelectTrigger className={cn("w-[140px] h-8 mt-1 text-xs border", statusColors[selectedApp.status])}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="new">New</SelectItem>
                        <SelectItem value="in_review">In Review</SelectItem>
                        <SelectItem value="contacted">Contacted</SelectItem>
                        <SelectItem value="approved">Approved</SelectItem>
                        <SelectItem value="rejected">Rejected</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Submitted</p>
                    <p className="font-medium">{new Date(selectedApp.created_at).toLocaleString()}</p>
                  </div>
                </div>
                {Object.keys(selectedApp.additional_data).length > 0 && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-2">Additional Details</p>
                    <div className="grid grid-cols-2 gap-2">
                      {Object.entries(selectedApp.additional_data).map(([key, value]) => (
                        <div key={key} className="bg-background rounded p-2">
                          <p className="text-xs text-muted-foreground capitalize">{key.replace(/_/g, ' ')}</p>
                          <p className="font-medium text-sm">{String(value)}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Internal Notes Section */}
              <div className="bg-amber-50/50 dark:bg-amber-900/10 rounded-lg p-4 space-y-3 border border-amber-200/50 dark:border-amber-800/30">
                <div className="flex items-center gap-2">
                  <StickyNote className="w-4 h-4 text-amber-600" />
                  <h4 className="font-semibold text-sm text-amber-800 dark:text-amber-400 uppercase tracking-wide">
                    Internal Notes
                  </h4>
                </div>

                <div className="flex gap-2">
                  <Textarea
                    placeholder="Add an internal note..."
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    className="min-h-[60px] bg-background resize-none"
                  />
                  <Button onClick={handleAddNote} disabled={!newNote.trim()} size="icon" className="h-[60px] w-12">
                    <Send className="w-4 h-4" />
                  </Button>
                </div>

                {isLoadingNotes ? (
                  <p className="text-sm text-muted-foreground">Loading notes...</p>
                ) : notes.length === 0 ? (
                  <p className="text-sm text-muted-foreground italic">No notes yet. Add one above.</p>
                ) : (
                  <div className="space-y-2 max-h-[200px] overflow-y-auto">
                    {notes.map((note) => (
                      <div key={note.id} className="bg-background rounded-md p-3 flex justify-between items-start group">
                        <div className="flex-1">
                          <p className="text-sm">{note.note}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(note.created_at).toLocaleString()}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive"
                          onClick={() => handleDeleteNote(note.id)}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Action Button */}
              {selectedApp.user_id && (
                <Button 
                  onClick={() => { setSelectedApp(null); onOpenChat(selectedApp); }} 
                  className="w-full"
                  size="lg"
                >
                  <MessageSquare className="w-4 h-4 mr-2" /> Open Chat with {selectedApp.full_name}
                </Button>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CRMApplicationTable;
