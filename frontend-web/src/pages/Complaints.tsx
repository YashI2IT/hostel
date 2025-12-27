import { useState } from 'react';
import { Plus, AlertCircle, Clock, CheckCircle2, X } from 'lucide-react';
import { useHostel } from '@/context/HostelContext';
import { MainLayout } from '@/components/layout/MainLayout';
import { Complaint } from '@/types/hostel';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const categories = [
  { value: 'plumbing', label: 'Plumbing' },
  { value: 'electrical', label: 'Electrical' },
  { value: 'furniture', label: 'Furniture' },
  { value: 'cleaning', label: 'Cleaning' },
  { value: 'other', label: 'Other' },
];

export default function Complaints() {
  const { complaints, properties, addComplaint, updateComplaintStatus } = useHostel();
  const { toast } = useToast();
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<Complaint['category']>('plumbing');
  const [description, setDescription] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | Complaint['status']>('all');

  const property = properties[0];

  const allRooms = property?.floors.flatMap(f => 
    f.rooms.map(r => ({ 
      id: r.id, 
      number: r.number, 
      floor: f.number 
    }))
  ) || [];

  const filteredComplaints = complaints.filter(c => 
    filterStatus === 'all' || c.status === filterStatus
  );

  const handleAddComplaint = () => {
    if (!selectedRoom || !description) {
      toast({
        title: 'Missing Information',
        description: 'Please select a room and enter a description.',
        variant: 'destructive'
      });
      return;
    }

    const room = allRooms.find(r => r.id === selectedRoom);
    
    addComplaint({
      roomId: selectedRoom,
      roomNumber: room?.number || '',
      category: selectedCategory,
      description,
      status: 'open'
    });

    toast({
      title: 'Complaint Registered',
      description: `Complaint for Room ${room?.number} has been recorded.`,
    });

    setShowAddModal(false);
    setSelectedRoom('');
    setDescription('');
    setSelectedCategory('plumbing');
  };

  const handleStatusChange = (complaintId: string, newStatus: Complaint['status']) => {
    updateComplaintStatus(complaintId, newStatus);
    
    toast({
      title: 'Status Updated',
      description: `Complaint marked as ${newStatus}.`,
    });
  };

  const getStatusIcon = (status: Complaint['status']) => {
    switch (status) {
      case 'open':
        return <AlertCircle className="w-5 h-5 text-destructive" />;
      case 'in-progress':
        return <Clock className="w-5 h-5 text-warning" />;
      case 'resolved':
        return <CheckCircle2 className="w-5 h-5 text-success" />;
    }
  };

  const getStatusBadge = (status: Complaint['status']) => {
    switch (status) {
      case 'open':
        return <span className="badge badge-destructive">Open</span>;
      case 'in-progress':
        return <span className="badge badge-warning">In Progress</span>;
      case 'resolved':
        return <span className="badge badge-success">Resolved</span>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="font-heading text-3xl font-bold text-foreground">Complaints</h1>
            <p className="text-muted-foreground mt-1">Manage maintenance issues and requests</p>
          </div>

          <Button onClick={() => setShowAddModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Complaint
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="stat-card flex items-center gap-4">
            <div className="w-12 h-12 bg-destructive/10 rounded-xl flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-destructive" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">
                {complaints.filter(c => c.status === 'open').length}
              </p>
              <p className="text-sm text-muted-foreground">Open Issues</p>
            </div>
          </div>
          <div className="stat-card flex items-center gap-4">
            <div className="w-12 h-12 bg-warning/10 rounded-xl flex items-center justify-center">
              <Clock className="w-6 h-6 text-warning" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">
                {complaints.filter(c => c.status === 'in-progress').length}
              </p>
              <p className="text-sm text-muted-foreground">In Progress</p>
            </div>
          </div>
          <div className="stat-card flex items-center gap-4">
            <div className="w-12 h-12 bg-success/10 rounded-xl flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6 text-success" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">
                {complaints.filter(c => c.status === 'resolved').length}
              </p>
              <p className="text-sm text-muted-foreground">Resolved</p>
            </div>
          </div>
        </div>

        {/* Filter */}
        <div className="stat-card">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-sm font-medium text-foreground">Filter by status:</span>
            {(['all', 'open', 'in-progress', 'resolved'] as const).map((status) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={cn(
                  'px-4 py-2 rounded-lg text-sm font-medium transition-all',
                  filterStatus === status
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                )}
              >
                {status === 'all' ? 'All' : status.charAt(0).toUpperCase() + status.slice(1).replace('-', ' ')}
              </button>
            ))}
          </div>
        </div>

        {/* Complaints List */}
        <div className="space-y-4">
          {filteredComplaints.length === 0 ? (
            <div className="stat-card text-center py-12">
              <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-lg font-medium text-foreground">No complaints found</p>
              <p className="text-muted-foreground">
                {filterStatus === 'all' 
                  ? 'All issues have been resolved!' 
                  : `No ${filterStatus.replace('-', ' ')} complaints`}
              </p>
            </div>
          ) : (
            filteredComplaints.map((complaint) => (
              <div key={complaint.id} className="stat-card animate-fade-in">
                <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                  <div className="flex items-start gap-4 flex-1">
                    <div className={cn(
                      'w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0',
                      complaint.status === 'open' ? 'bg-destructive/10' :
                      complaint.status === 'in-progress' ? 'bg-warning/10' : 'bg-success/10'
                    )}>
                      {getStatusIcon(complaint.status)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 flex-wrap">
                        <h3 className="font-semibold text-foreground">Room {complaint.roomNumber}</h3>
                        {getStatusBadge(complaint.status)}
                        <span className="badge bg-muted text-muted-foreground capitalize">
                          {complaint.category}
                        </span>
                      </div>
                      <p className="text-muted-foreground mt-2">{complaint.description}</p>
                      <p className="text-xs text-muted-foreground mt-2">
                        Created: {formatDate(complaint.createdAt)}
                        {complaint.resolvedAt && ` • Resolved: ${formatDate(complaint.resolvedAt)}`}
                      </p>
                    </div>
                  </div>

                  {complaint.status !== 'resolved' && (
                    <div className="flex gap-2 lg:flex-shrink-0">
                      {complaint.status === 'open' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleStatusChange(complaint.id, 'in-progress')}
                        >
                          <Clock className="w-4 h-4 mr-1" />
                          Start Work
                        </Button>
                      )}
                      <Button
                        size="sm"
                        onClick={() => handleStatusChange(complaint.id, 'resolved')}
                        className="bg-success hover:bg-success/90"
                      >
                        <CheckCircle2 className="w-4 h-4 mr-1" />
                        Mark Resolved
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Add Complaint Modal */}
      {showAddModal && (
        <div className="modal-overlay animate-fade-in" onClick={() => setShowAddModal(false)}>
          <div 
            className="modal-content w-full max-w-md animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-border flex items-center justify-between">
              <h2 className="font-heading text-xl font-semibold text-foreground">Add Complaint</h2>
              <button 
                onClick={() => setShowAddModal(false)}
                className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors"
              >
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="form-label">Select Room</label>
                <select
                  value={selectedRoom}
                  onChange={(e) => setSelectedRoom(e.target.value)}
                  className="form-input"
                >
                  <option value="">Choose a room</option>
                  {allRooms.map((room) => (
                    <option key={room.id} value={room.id}>
                      Floor {room.floor} - Room {room.number}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="form-label">Category</label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value as Complaint['category'])}
                  className="form-input"
                >
                  {categories.map((cat) => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="form-label">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe the issue in detail..."
                  rows={4}
                  className="form-input resize-none"
                />
              </div>
            </div>

            <div className="p-6 border-t border-border flex gap-3">
              <Button variant="outline" onClick={() => setShowAddModal(false)} className="flex-1">
                Cancel
              </Button>
              <Button onClick={handleAddComplaint} className="flex-1">
                <Plus className="w-4 h-4 mr-2" />
                Submit Complaint
              </Button>
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  );
}
