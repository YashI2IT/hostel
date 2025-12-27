import { useState } from 'react';
import { X, User, Phone, Mail, Calendar, CreditCard, Clock } from 'lucide-react';
import { Resident } from '@/types/hostel';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ResidentInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  resident: Resident;
}

export function ResidentInfoModal({ isOpen, onClose, resident }: ResidentInfoModalProps) {
  if (!isOpen) return null;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

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
    <div className="modal-overlay animate-fade-in" onClick={onClose}>
      <div 
        className="modal-content w-full max-w-lg animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-border flex items-center justify-between">
          <h2 className="font-heading text-xl font-semibold text-foreground">Resident Details</h2>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors"
          >
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Profile Header */}
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
              <span className="text-2xl font-bold text-primary">
                {resident.name.charAt(0)}
              </span>
            </div>
            <div>
              <h3 className="font-heading text-lg font-semibold text-foreground">{resident.name}</h3>
              <p className="text-muted-foreground">Age: {resident.age} years</p>
            </div>
          </div>

          {/* Contact Info */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-foreground uppercase tracking-wide">Contact Information</h4>
            <div className="grid grid-cols-1 gap-3">
              <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                <Phone className="w-4 h-4 text-primary" />
                <span className="text-foreground">{resident.contactNumber}</span>
              </div>
              <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                <Mail className="w-4 h-4 text-primary" />
                <span className="text-foreground">{resident.email}</span>
              </div>
            </div>
          </div>

          {/* Emergency Contact */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-foreground uppercase tracking-wide">Emergency Contact</h4>
            <div className="p-3 bg-muted/30 rounded-lg">
              <p className="font-medium text-foreground">{resident.emergencyContactName}</p>
              <p className="text-muted-foreground">{resident.emergencyContact}</p>
            </div>
          </div>

          {/* Lease Details */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-foreground uppercase tracking-wide">Lease Details</h4>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-muted/30 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <Calendar className="w-4 h-4 text-primary" />
                  <span className="text-xs text-muted-foreground">Start Date</span>
                </div>
                <p className="font-medium text-foreground">{formatDate(resident.startDate)}</p>
              </div>
              <div className="p-3 bg-muted/30 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <Calendar className="w-4 h-4 text-primary" />
                  <span className="text-xs text-muted-foreground">End Date</span>
                </div>
                <p className="font-medium text-foreground">{formatDate(resident.endDate)}</p>
              </div>
            </div>
          </div>

          {/* Payment Info */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-foreground uppercase tracking-wide">Payment Information</h4>
            <div className="p-4 bg-muted/30 rounded-lg space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-primary" />
                  <span className="text-muted-foreground">Monthly Rent</span>
                </div>
                <span className="font-semibold text-foreground">₹{resident.monthlyRent.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-primary" />
                  <span className="text-muted-foreground">Billing Frequency</span>
                </div>
                <span className="font-medium text-foreground capitalize">{resident.billingFrequency}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Payment Status</span>
                {getPaymentStatusBadge(resident.paymentStatus)}
              </div>
              {resident.lastPaymentDate && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Last Payment</span>
                  <span className="text-foreground">{formatDate(resident.lastPaymentDate)}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-border">
          <Button onClick={onClose} variant="outline" className="w-full">
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}
