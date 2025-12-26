import React from 'react';
import { Users, UserPlus, Phone, CheckCircle, TrendingUp, DollarSign, Briefcase, Clock } from 'lucide-react';
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
  const inProgressLeads = data.totalLeads - data.newLeads - data.contactedLeads - data.closedLeads;

  const cards = [
    {
      title: 'Total Applications',
      value: data.totalLeads,
      icon: Users,
      gradient: 'from-primary/20 to-primary/5',
      iconBg: 'bg-primary',
      iconColor: 'text-primary-foreground',
      trend: '+12%',
      trendUp: true,
    },
    {
      title: 'New',
      value: data.newLeads,
      icon: UserPlus,
      gradient: 'from-emerald-100 to-emerald-50 dark:from-emerald-900/30 dark:to-emerald-900/10',
      iconBg: 'bg-emerald-500',
      iconColor: 'text-white',
    },
    {
      title: 'In-Review',
      value: data.contactedLeads,
      icon: Phone,
      gradient: 'from-blue-100 to-blue-50 dark:from-blue-900/30 dark:to-blue-900/10',
      iconBg: 'bg-blue-500',
      iconColor: 'text-white',
    },
    {
      title: 'In Progress',
      value: inProgressLeads > 0 ? inProgressLeads : 0,
      icon: Clock,
      gradient: 'from-amber-100 to-amber-50 dark:from-amber-900/30 dark:to-amber-900/10',
      iconBg: 'bg-amber-500',
      iconColor: 'text-white',
    },
    {
      title: 'Completed',
      value: data.closedLeads,
      icon: CheckCircle,
      gradient: 'from-purple-100 to-purple-50 dark:from-purple-900/30 dark:to-purple-900/10',
      iconBg: 'bg-purple-500',
      iconColor: 'text-white',
    },
  ];

  const typeCards = [
    {
      title: 'Buying a House',
      value: data.buyLeads,
      icon: DollarSign,
      color: 'text-emerald-600 dark:text-emerald-400',
      bgColor: 'bg-emerald-100 dark:bg-emerald-900/30',
    },
    {
      title: 'Selling a House',
      value: data.sellLeads,
      icon: TrendingUp,
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-100 dark:bg-blue-900/30',
    },
    {
      title: 'Work With Me',
      value: data.workLeads,
      icon: Briefcase,
      color: 'text-purple-600 dark:text-purple-400',
      bgColor: 'bg-purple-100 dark:bg-purple-900/30',
    },
  ];

  return (
    <div className="space-y-4">
      {/* Main KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {cards.map((card) => (
          <Card 
            key={card.title} 
            className={`border-0 shadow-sm hover:shadow-md transition-all duration-300 bg-gradient-to-br ${card.gradient} overflow-hidden`}
          >
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
                    {card.title}
                  </p>
                  <p className="text-3xl font-bold text-foreground">{card.value}</p>
                </div>
                <div className={`p-2.5 rounded-xl ${card.iconBg} shadow-lg`}>
                  <card.icon className={`w-5 h-5 ${card.iconColor}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Form Type Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {typeCards.map((card) => (
          <Card 
            key={card.title} 
            className="border-0 shadow-sm hover:shadow-md transition-all duration-300"
          >
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-xl ${card.bgColor}`}>
                  <card.icon className={`w-6 h-6 ${card.color}`} />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-muted-foreground">{card.title}</p>
                  <div className="flex items-end gap-2">
                    <p className="text-2xl font-bold text-foreground">{card.value}</p>
                    <p className="text-xs text-muted-foreground mb-1">applications</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default CRMKPICards;