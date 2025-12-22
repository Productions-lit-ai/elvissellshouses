import React from 'react';
import { Users, UserPlus, Phone, CheckCircle, TrendingUp, DollarSign } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface KPIData {
  totalLeads: number;
  newLeads: number;
  contactedLeads: number;
  closedLeads: number;
  buyLeads: number;
  sellLeads: number;
  workLeads: number;
}

interface CRMKPICardsProps {
  data: KPIData;
}

const CRMKPICards: React.FC<CRMKPICardsProps> = ({ data }) => {
  const cards = [
    {
      title: 'Total Leads',
      value: data.totalLeads,
      icon: Users,
      color: 'bg-primary/10 text-primary',
      iconColor: 'text-primary',
    },
    {
      title: 'New Leads',
      value: data.newLeads,
      icon: UserPlus,
      color: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400',
      iconColor: 'text-emerald-600 dark:text-emerald-400',
    },
    {
      title: 'Contacted',
      value: data.contactedLeads,
      icon: Phone,
      color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400',
      iconColor: 'text-blue-600 dark:text-blue-400',
    },
    {
      title: 'Closed',
      value: data.closedLeads,
      icon: CheckCircle,
      color: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400',
      iconColor: 'text-purple-600 dark:text-purple-400',
    },
    {
      title: 'Buyers',
      value: data.buyLeads,
      icon: DollarSign,
      color: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400',
      iconColor: 'text-amber-600 dark:text-amber-400',
    },
    {
      title: 'Sellers',
      value: data.sellLeads,
      icon: TrendingUp,
      color: 'bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400',
      iconColor: 'text-rose-600 dark:text-rose-400',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {cards.map((card) => (
        <Card key={card.title} className="border-0 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  {card.title}
                </p>
                <p className="text-2xl font-bold text-foreground mt-1">{card.value}</p>
              </div>
              <div className={`p-2 rounded-lg ${card.color}`}>
                <card.icon className={`w-5 h-5 ${card.iconColor}`} />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default CRMKPICards;
