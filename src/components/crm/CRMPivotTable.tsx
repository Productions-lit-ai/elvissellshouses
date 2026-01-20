import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export interface Application {
  id: string;
  user_id: string | null;
  application_type: 'buy' | 'sell' | 'work';
  full_name: string;
  phone_number: string | null;
  email_address: string;
  location: string | null;
  form_source: string | null;
  status: 'new' | 'in_review' | 'contacted' | 'approved' | 'rejected';
  additional_data: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

interface CRMPivotTableProps {
  applications: Application[];
}

const statusLabels = {
  new: 'New',
  in_review: 'In Review',
  contacted: 'Contacted',
  approved: 'Approved',
  rejected: 'Rejected',
};

const typeLabels = {
  buy: 'Buy Requests',
  sell: 'Sell Requests',
  work: 'Work With Me',
};

const statusColors = {
  new: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300',
  in_review: 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300',
  contacted: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300',
  approved: 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300',
  rejected: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300',
};

const typeColors = {
  buy: 'bg-emerald-500',
  sell: 'bg-blue-500',
  work: 'bg-purple-500',
};

const CRMPivotTable: React.FC<CRMPivotTableProps> = ({ applications }) => {
  // Calculate pivot data: count by type and status
  const pivotData = React.useMemo(() => {
    const types = ['buy', 'sell', 'work'] as const;
    const statuses = ['new', 'in_review', 'contacted', 'approved', 'rejected'] as const;
    
    const matrix: Record<string, Record<string, number>> = {};
    const typeTotals: Record<string, number> = {};
    const statusTotals: Record<string, number> = {};
    
    // Initialize
    types.forEach(type => {
      matrix[type] = {};
      typeTotals[type] = 0;
      statuses.forEach(status => {
        matrix[type][status] = 0;
        if (!statusTotals[status]) statusTotals[status] = 0;
      });
    });
    
    // Count applications
    applications.forEach(app => {
      if (matrix[app.application_type] && matrix[app.application_type][app.status] !== undefined) {
        matrix[app.application_type][app.status]++;
        typeTotals[app.application_type]++;
        statusTotals[app.status]++;
      }
    });
    
    return { matrix, typeTotals, statusTotals, types, statuses };
  }, [applications]);

  const grandTotal = applications.length;

  return (
    <Card className="bg-card border-border/50 shadow-sm">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-semibold text-foreground">Application Summary Pivot</CardTitle>
        <CardDescription className="text-muted-foreground">
          Overview of all form submissions by type and status
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30 hover:bg-muted/30">
                <TableHead className="font-semibold text-foreground">Application Type</TableHead>
                {pivotData.statuses.map(status => (
                  <TableHead key={status} className="text-center">
                    <Badge className={cn(statusColors[status], "font-medium")} variant="secondary">
                      {statusLabels[status]}
                    </Badge>
                  </TableHead>
                ))}
                <TableHead className="text-center font-semibold text-foreground bg-muted/50">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pivotData.types.map(type => (
                <TableRow key={type} className="hover:bg-muted/20">
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <div className={cn("w-3 h-3 rounded-full", typeColors[type])} />
                      <span className="text-foreground">{typeLabels[type]}</span>
                    </div>
                  </TableCell>
                  {pivotData.statuses.map(status => (
                    <TableCell key={status} className="text-center">
                      <span className={cn(
                        "inline-flex items-center justify-center w-8 h-8 rounded-lg font-medium text-sm",
                        pivotData.matrix[type][status] > 0 
                          ? "bg-primary/10 text-primary" 
                          : "text-muted-foreground"
                      )}>
                        {pivotData.matrix[type][status]}
                      </span>
                    </TableCell>
                  ))}
                  <TableCell className="text-center font-semibold bg-muted/30">
                    <span className="inline-flex items-center justify-center w-10 h-8 rounded-lg bg-primary/20 text-primary font-bold">
                      {pivotData.typeTotals[type]}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
              {/* Status Totals Row */}
              <TableRow className="bg-muted/50 hover:bg-muted/50 border-t-2">
                <TableCell className="font-semibold text-foreground">Total</TableCell>
                {pivotData.statuses.map(status => (
                  <TableCell key={status} className="text-center">
                    <span className="inline-flex items-center justify-center w-10 h-8 rounded-lg bg-primary/20 text-primary font-bold">
                      {pivotData.statusTotals[status]}
                    </span>
                  </TableCell>
                ))}
                <TableCell className="text-center">
                  <span className="inline-flex items-center justify-center w-12 h-10 rounded-lg bg-primary text-primary-foreground font-bold text-lg">
                    {grandTotal}
                  </span>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default CRMPivotTable;
