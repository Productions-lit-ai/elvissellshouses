import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sparkles, TrendingUp, Target, Lightbulb, RefreshCw, AlertCircle, User } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Application } from './CRMApplicationTable';
import { cn } from '@/lib/utils';

interface LeadAnalysis {
  summary: string;
  highPriorityLeads: Array<{
    id: string;
    name: string;
    reason: string;
    suggestedAction: string;
    score: number;
  }>;
  trends: {
    mostActiveType: string;
    peakDay: string;
    conversionInsight: string;
  };
  recommendations: string[];
}

interface CRMLeadAnalysisProps {
  applications: Application[];
}

const typeLabels: Record<string, string> = {
  buy: 'Buying',
  sell: 'Selling',
  work: 'Work With Me',
};

const CRMLeadAnalysis: React.FC<CRMLeadAnalysisProps> = ({ applications }) => {
  const [analysis, setAnalysis] = useState<LeadAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runAnalysis = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const { data, error: fnError } = await supabase.functions.invoke('analyze-leads', {
        body: { applications },
      });

      if (fnError) {
        throw fnError;
      }

      if (data.error) {
        throw new Error(data.error);
      }

      setAnalysis(data);
      toast.success('AI analysis complete!');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to analyze leads';
      setError(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300';
    if (score >= 60) return 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300';
    return 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300';
  };

  return (
    <Card className="p-6 bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-lg text-foreground">AI Lead Analysis</h3>
            <p className="text-sm text-muted-foreground">Powered by Lovable AI</p>
          </div>
        </div>
        <Button 
          onClick={runAnalysis} 
          disabled={isLoading || applications.length === 0}
          className="gap-2"
        >
          {isLoading ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              Analyze Leads
            </>
          )}
        </Button>
      </div>

      {applications.length === 0 && !analysis && (
        <div className="text-center py-8 text-muted-foreground">
          <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p>No applications to analyze yet.</p>
        </div>
      )}

      {error && (
        <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4 mb-4">
          <p className="text-destructive text-sm">{error}</p>
        </div>
      )}

      {analysis && (
        <div className="space-y-6 animate-fade-in">
          {/* Executive Summary */}
          <div className="bg-background/80 rounded-lg p-4 border border-border/50">
            <h4 className="font-medium text-foreground mb-2 flex items-center gap-2">
              <Target className="w-4 h-4 text-primary" />
              Executive Summary
            </h4>
            <p className="text-muted-foreground">{analysis.summary}</p>
          </div>

          {/* High Priority Leads */}
          {analysis.highPriorityLeads.length > 0 && (
            <div>
              <h4 className="font-medium text-foreground mb-3 flex items-center gap-2">
                <User className="w-4 h-4 text-primary" />
                High Priority Leads
              </h4>
              <div className="space-y-3">
                {analysis.highPriorityLeads.map((lead, index) => (
                  <div 
                    key={lead.id || index}
                    className="bg-background/80 rounded-lg p-4 border border-border/50 flex items-start gap-4"
                  >
                    <div className="flex-shrink-0">
                      <Badge className={cn(getScoreColor(lead.score), "font-bold text-sm px-3 py-1")}>
                        {lead.score}
                      </Badge>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground">{lead.name}</p>
                      <p className="text-sm text-muted-foreground mt-1">{lead.reason}</p>
                      <div className="mt-2 flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {lead.suggestedAction}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Trends */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-background/80 rounded-lg p-4 border border-border/50">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-emerald-500" />
                <span className="text-xs font-medium text-muted-foreground uppercase">Most Active</span>
              </div>
              <p className="font-semibold text-foreground">
                {typeLabels[analysis.trends.mostActiveType] || analysis.trends.mostActiveType}
              </p>
            </div>
            <div className="bg-background/80 rounded-lg p-4 border border-border/50">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-blue-500" />
                <span className="text-xs font-medium text-muted-foreground uppercase">Peak Activity</span>
              </div>
              <p className="font-semibold text-foreground">{analysis.trends.peakDay}</p>
            </div>
            <div className="bg-background/80 rounded-lg p-4 border border-border/50 md:col-span-1">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-purple-500" />
                <span className="text-xs font-medium text-muted-foreground uppercase">Conversion Insight</span>
              </div>
              <p className="text-sm text-foreground">{analysis.trends.conversionInsight}</p>
            </div>
          </div>

          {/* Recommendations */}
          {analysis.recommendations.length > 0 && (
            <div>
              <h4 className="font-medium text-foreground mb-3 flex items-center gap-2">
                <Lightbulb className="w-4 h-4 text-amber-500" />
                AI Recommendations
              </h4>
              <ul className="space-y-2">
                {analysis.recommendations.map((rec, index) => (
                  <li 
                    key={index}
                    className="flex items-start gap-3 bg-background/80 rounded-lg p-3 border border-border/50"
                  >
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/20 text-primary text-xs font-bold flex items-center justify-center">
                      {index + 1}
                    </span>
                    <span className="text-sm text-foreground">{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </Card>
  );
};

export default CRMLeadAnalysis;
