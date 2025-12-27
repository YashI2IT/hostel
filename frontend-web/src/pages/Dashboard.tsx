import { Building2, Users, BedDouble, CheckCircle2, AlertCircle, Clock } from 'lucide-react';
import { useHostel } from '@/context/HostelContext';
import { MainLayout } from '@/components/layout/MainLayout';
import { cn } from '@/lib/utils';

export default function Dashboard() {
  const { getOccupancyStats, residents, complaints } = useHostel();
  const stats = getOccupancyStats();
  const occupancyRate = Math.round((stats.occupied / stats.total) * 100);

  const statCards = [
    { 
      icon: BedDouble, 
      label: 'Total Beds', 
      value: stats.total, 
      color: 'bg-primary/10 text-primary',
      iconColor: 'text-primary'
    },
    { 
      icon: Users, 
      label: 'Occupied Beds', 
      value: stats.occupied, 
      color: 'bg-destructive/10 text-destructive',
      iconColor: 'text-destructive'
    },
    { 
      icon: CheckCircle2, 
      label: 'Available Beds', 
      value: stats.available, 
      color: 'bg-success/10 text-success',
      iconColor: 'text-success'
    },
    { 
      icon: Building2, 
      label: 'Occupancy Rate', 
      value: `${occupancyRate}%`, 
      color: 'bg-accent/10 text-accent',
      iconColor: 'text-accent'
    },
  ];

  const getPaymentStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <span className="badge badge-success">Paid</span>;
      case 'pending':
        return <span className="badge badge-warning">Pending</span>;
      case 'overdue':
        return <span className="badge badge-destructive">Overdue</span>;
      default:
        return null;
    }
  };

  return (
    <MainLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="font-heading text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Overview of your hostel operations</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {statCards.map((stat, index) => (
            <div 
              key={stat.label} 
              className="stat-card animate-fade-in"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <p className="font-heading text-3xl font-bold text-foreground mt-1">
                    {stat.value}
                  </p>
                </div>
                <div className={cn('w-14 h-14 rounded-xl flex items-center justify-center', stat.color)}>
                  <stat.icon className={cn('w-7 h-7', stat.iconColor)} />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Resident List */}
        <div className="stat-card">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="font-heading text-xl font-semibold text-foreground">Current Residents</h2>
              <p className="text-sm text-muted-foreground">All accommodated guests</p>
            </div>
            <span className="badge bg-primary/10 text-primary">{residents.length} residents</span>
          </div>

          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Room</th>
                  <th>Bed</th>
                  <th>Contact</th>
                  <th>Payment Status</th>
                </tr>
              </thead>
              <tbody>
                {residents.map((resident) => (
                  <tr key={resident.id} className="hover:bg-muted/50 transition-colors">
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-primary/10 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium text-primary">
                            {resident.name.charAt(0)}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{resident.name}</p>
                          <p className="text-xs text-muted-foreground">{resident.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="font-medium">Room {resident.roomId.split('-').pop()?.replace('room-', '')}</td>
                    <td>Bed {resident.bedId.split('-').pop()}</td>
                    <td className="text-muted-foreground">{resident.contactNumber}</td>
                    <td>{getPaymentStatusBadge(resident.paymentStatus)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Complaints */}
        <div className="stat-card">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="font-heading text-xl font-semibold text-foreground">Recent Complaints</h2>
              <p className="text-sm text-muted-foreground">Issues requiring attention</p>
            </div>
          </div>

          <div className="space-y-4">
            {complaints.slice(0, 3).map((complaint) => (
              <div key={complaint.id} className="flex items-start gap-4 p-4 bg-muted/30 rounded-lg">
                <div className={cn(
                  'w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0',
                  complaint.status === 'open' ? 'bg-destructive/10' : 
                  complaint.status === 'in-progress' ? 'bg-warning/10' : 'bg-success/10'
                )}>
                  {complaint.status === 'open' ? (
                    <AlertCircle className="w-5 h-5 text-destructive" />
                  ) : complaint.status === 'in-progress' ? (
                    <Clock className="w-5 h-5 text-warning" />
                  ) : (
                    <CheckCircle2 className="w-5 h-5 text-success" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-foreground">Room {complaint.roomNumber}</p>
                    <span className={cn(
                      'badge',
                      complaint.status === 'open' ? 'badge-destructive' :
                      complaint.status === 'in-progress' ? 'badge-warning' : 'badge-success'
                    )}>
                      {complaint.status}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-1">{complaint.description}</p>
                  <p className="text-xs text-muted-foreground mt-2">
                    Category: <span className="capitalize">{complaint.category}</span>
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
