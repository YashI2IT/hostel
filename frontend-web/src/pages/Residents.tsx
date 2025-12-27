import { Users } from 'lucide-react';
import { useHostel } from '@/context/HostelContext';
import { MainLayout } from '@/components/layout/MainLayout';

export default function Residents() {
  const { residents } = useHostel();

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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="font-heading text-3xl font-bold text-foreground">Residents</h1>
            <p className="text-muted-foreground mt-1">Complete list of all current residents</p>
          </div>

          <div className="flex items-center gap-2 text-muted-foreground">
            <Users className="w-5 h-5" />
            <span>{residents.length} total residents</span>
          </div>
        </div>

        {/* Residents Table */}
        <div className="stat-card overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Resident</th>
                <th>Room / Bed</th>
                <th>Contact</th>
                <th>Lease Period</th>
                <th>Monthly Rent</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {residents.map((resident) => (
                <tr key={resident.id} className="hover:bg-muted/50 transition-colors">
                  <td>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-primary">
                          {resident.name.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{resident.name}</p>
                        <p className="text-xs text-muted-foreground">Age: {resident.age}</p>
                      </div>
                    </div>
                  </td>
                  <td>
                    <p className="font-medium text-foreground">
                      Room {resident.roomId.split('-').pop()}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Bed {resident.bedId.split('-').pop()}
                    </p>
                  </td>
                  <td>
                    <p className="text-foreground">{resident.contactNumber}</p>
                    <p className="text-xs text-muted-foreground">{resident.email}</p>
                  </td>
                  <td>
                    <p className="text-foreground">{formatDate(resident.startDate)}</p>
                    <p className="text-xs text-muted-foreground">to {formatDate(resident.endDate)}</p>
                  </td>
                  <td>
                    <p className="font-medium text-foreground">₹{resident.monthlyRent.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground capitalize">{resident.billingFrequency}</p>
                  </td>
                  <td>{getPaymentStatusBadge(resident.paymentStatus)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {residents.length === 0 && (
            <div className="text-center py-12">
              <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-lg font-medium text-foreground">No residents yet</p>
              <p className="text-muted-foreground">Add residents from the Floor Map</p>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
