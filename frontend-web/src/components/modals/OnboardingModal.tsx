import { useState } from 'react';
import { X, User, Calendar, CreditCard, Check, Loader2, ChevronRight, ChevronLeft, QrCode, Smartphone, Banknote } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { useHostel } from '@/context/HostelContext';
import { OnboardingFormData, Resident } from '@/types/hostel';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
  prefilledData: {
    propertyId: string;
    floorId: string;
    roomId: string;
    bedId: string;
    roomNumber: string;
    floorNumber: number;
    bedNumber: number;
  };
}

const steps = [
  { id: 1, title: 'Guest Details', icon: User },
  { id: 2, title: 'Duration & Billing', icon: Calendar },
  { id: 3, title: 'Payment', icon: CreditCard },
];

export function OnboardingModal({ isOpen, onClose, onComplete, prefilledData }: OnboardingModalProps) {
  const { addResident } = useHostel();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'upi' | 'qr' | 'cash'>('upi');
  const [upiId, setUpiId] = useState('');
  const [paymentVerified, setPaymentVerified] = useState(false);
  const [upiRequestSent, setUpiRequestSent] = useState(false);

  const [formData, setFormData] = useState<Partial<OnboardingFormData>>({
    propertyId: prefilledData.propertyId,
    floorId: prefilledData.floorId,
    roomId: prefilledData.roomId,
    bedId: prefilledData.bedId,
    name: '',
    age: 18,
    contactNumber: '',
    email: '',
    emergencyContactName: '',
    emergencyContact: '',
    billingFrequency: 'monthly',
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    monthlyRent: 8000,
  });

  const updateField = (field: keyof OnboardingFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const calculateTotalAmount = () => {
    const rent = formData.monthlyRent || 0;
    switch (formData.billingFrequency) {
      case 'yearly':
        return rent * 12;
      case 'monthly':
        return rent;
      case 'custom':
        return Math.ceil((formData.customDays || 30) / 30) * rent;
      default:
        return rent;
    }
  };

  const handleNext = () => {
    if (currentStep === 1) {
      if (!formData.name || !formData.contactNumber || !formData.email) {
        toast({
          title: 'Missing Information',
          description: 'Please fill in all required fields.',
          variant: 'destructive'
        });
        return;
      }
    }
    if (currentStep === 2) {
      if (!formData.startDate || !formData.endDate) {
        toast({
          title: 'Missing Dates',
          description: 'Please select start and end dates.',
          variant: 'destructive'
        });
        return;
      }
    }
    setCurrentStep(prev => Math.min(prev + 1, 3));
  };

  const handleBack = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleUpiRequest = () => {
    if (!upiId) {
      toast({
        title: 'UPI ID Required',
        description: 'Please enter the student\'s UPI ID.',
        variant: 'destructive'
      });
      return;
    }
    setIsProcessing(true);
    // Simulate sending UPI request
    setTimeout(() => {
      setIsProcessing(false);
      setUpiRequestSent(true);
      toast({
        title: 'UPI Request Sent',
        description: `Payment request sent to ${upiId}`,
      });
    }, 1500);
  };

  const handleMarkPaid = () => {
    setPaymentVerified(true);
    toast({
      title: 'Payment Verified',
      description: 'Payment has been marked as received.',
    });
  };

  const handleComplete = () => {
    const newResident: Resident = {
      id: `resident-${Date.now()}`,
      name: formData.name!,
      age: formData.age!,
      contactNumber: formData.contactNumber!,
      email: formData.email!,
      emergencyContact: formData.emergencyContact!,
      emergencyContactName: formData.emergencyContactName!,
      bedId: formData.bedId!,
      roomId: formData.roomId!,
      floorId: formData.floorId!,
      propertyId: formData.propertyId!,
      startDate: formData.startDate!,
      endDate: formData.endDate!,
      billingFrequency: formData.billingFrequency!,
      customDays: formData.customDays,
      monthlyRent: formData.monthlyRent!,
      paymentStatus: 'paid',
      lastPaymentDate: new Date().toISOString().split('T')[0]
    };

    addResident(newResident);
    
    toast({
      title: 'Guest Onboarded Successfully',
      description: `${formData.name} has been assigned to Room ${prefilledData.roomNumber}, Bed ${prefilledData.bedNumber}`,
    });

    onComplete();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay animate-fade-in" onClick={onClose}>
      <div 
        className="modal-content w-full max-w-2xl animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-border">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-heading text-xl font-semibold text-foreground">New Guest Onboarding</h2>
            <button 
              onClick={onClose}
              className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors"
            >
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>

          {/* Location Badge */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>Floor {prefilledData.floorNumber}</span>
            <ChevronRight className="w-4 h-4" />
            <span>Room {prefilledData.roomNumber}</span>
            <ChevronRight className="w-4 h-4" />
            <span>Bed {prefilledData.bedNumber}</span>
          </div>
        </div>

        {/* Step Indicator */}
        <div className="px-6 py-4 border-b border-border">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    'w-10 h-10 rounded-full flex items-center justify-center transition-all',
                    currentStep >= step.id 
                      ? 'bg-primary text-primary-foreground' 
                      : 'bg-muted text-muted-foreground'
                  )}>
                    {currentStep > step.id ? (
                      <Check className="w-5 h-5" />
                    ) : (
                      <step.icon className="w-5 h-5" />
                    )}
                  </div>
                  <span className={cn(
                    'text-sm font-medium hidden sm:block',
                    currentStep >= step.id ? 'text-foreground' : 'text-muted-foreground'
                  )}>
                    {step.title}
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <div className={cn(
                    'w-12 sm:w-24 h-0.5 mx-4',
                    currentStep > step.id ? 'bg-primary' : 'bg-muted'
                  )} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Form Content */}
        <div className="p-6">
          {/* Step 1: Guest Details */}
          {currentStep === 1 && (
            <div className="space-y-4 animate-fade-in">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 sm:col-span-1">
                  <label className="form-label">Full Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => updateField('name', e.target.value)}
                    placeholder="Enter student's full name"
                    className="form-input"
                  />
                </div>
                <div>
                  <label className="form-label">Age *</label>
                  <input
                    type="number"
                    value={formData.age}
                    onChange={(e) => updateField('age', parseInt(e.target.value))}
                    min={16}
                    max={50}
                    className="form-input"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Contact Number *</label>
                  <input
                    type="tel"
                    value={formData.contactNumber}
                    onChange={(e) => updateField('contactNumber', e.target.value)}
                    placeholder="+91 98765 43210"
                    className="form-input"
                  />
                </div>
                <div>
                  <label className="form-label">Email *</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => updateField('email', e.target.value)}
                    placeholder="student@email.com"
                    className="form-input"
                  />
                </div>
              </div>

              <div className="pt-2">
                <h4 className="text-sm font-medium text-foreground mb-3">Emergency Contact</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="form-label">Name & Relation</label>
                    <input
                      type="text"
                      value={formData.emergencyContactName}
                      onChange={(e) => updateField('emergencyContactName', e.target.value)}
                      placeholder="Mr. Sharma (Father)"
                      className="form-input"
                    />
                  </div>
                  <div>
                    <label className="form-label">Phone Number</label>
                    <input
                      type="tel"
                      value={formData.emergencyContact}
                      onChange={(e) => updateField('emergencyContact', e.target.value)}
                      placeholder="+91 98765 00000"
                      className="form-input"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Duration & Billing */}
          {currentStep === 2 && (
            <div className="space-y-4 animate-fade-in">
              <div>
                <label className="form-label">Billing Frequency *</label>
                <select
                  value={formData.billingFrequency}
                  onChange={(e) => updateField('billingFrequency', e.target.value)}
                  className="form-input"
                >
                  <option value="monthly">Monthly</option>
                  <option value="yearly">Yearly</option>
                  <option value="custom">Custom (Exception Days)</option>
                </select>
              </div>

              {formData.billingFrequency === 'custom' && (
                <div>
                  <label className="form-label">Number of Days</label>
                  <input
                    type="number"
                    value={formData.customDays || 30}
                    onChange={(e) => updateField('customDays', parseInt(e.target.value))}
                    min={1}
                    className="form-input"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Start Date *</label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => updateField('startDate', e.target.value)}
                    className="form-input"
                  />
                </div>
                <div>
                  <label className="form-label">End Date *</label>
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => updateField('endDate', e.target.value)}
                    className="form-input"
                  />
                </div>
              </div>

              <div>
                <label className="form-label">Monthly Rent (₹) *</label>
                <input
                  type="number"
                  value={formData.monthlyRent}
                  onChange={(e) => updateField('monthlyRent', parseInt(e.target.value))}
                  min={0}
                  className="form-input"
                />
              </div>

              <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Total Amount Due</span>
                  <span className="font-heading text-2xl font-bold text-primary">
                    ₹{calculateTotalAmount().toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Payment */}
          {currentStep === 3 && (
            <div className="space-y-6 animate-fade-in">
              <div className="p-4 bg-muted/30 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Amount to Collect</span>
                  <span className="font-heading text-2xl font-bold text-foreground">
                    ₹{calculateTotalAmount().toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Payment Method Tabs */}
              <div className="flex gap-2">
                <button
                  onClick={() => { setPaymentMethod('upi'); setPaymentVerified(false); setUpiRequestSent(false); }}
                  className={cn('payment-tab', paymentMethod === 'upi' ? 'payment-tab-active' : 'payment-tab-inactive')}
                >
                  <Smartphone className="w-4 h-4 inline mr-2" />
                  UPI Request
                </button>
                <button
                  onClick={() => { setPaymentMethod('qr'); setPaymentVerified(false); }}
                  className={cn('payment-tab', paymentMethod === 'qr' ? 'payment-tab-active' : 'payment-tab-inactive')}
                >
                  <QrCode className="w-4 h-4 inline mr-2" />
                  Scan QR
                </button>
                <button
                  onClick={() => { setPaymentMethod('cash'); setPaymentVerified(false); }}
                  className={cn('payment-tab', paymentMethod === 'cash' ? 'payment-tab-active' : 'payment-tab-inactive')}
                >
                  <Banknote className="w-4 h-4 inline mr-2" />
                  Cash
                </button>
              </div>

              {/* UPI Request */}
              {paymentMethod === 'upi' && (
                <div className="space-y-4">
                  <div>
                    <label className="form-label">Student's UPI ID</label>
                    <input
                      type="text"
                      value={upiId}
                      onChange={(e) => setUpiId(e.target.value)}
                      placeholder="example@upi"
                      className="form-input"
                      disabled={upiRequestSent}
                    />
                  </div>
                  {!upiRequestSent ? (
                    <Button
                      onClick={handleUpiRequest}
                      disabled={isProcessing}
                      className="w-full"
                    >
                      {isProcessing ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Sending Request...
                        </>
                      ) : (
                        'Send Payment Request'
                      )}
                    </Button>
                  ) : (
                    <div className="space-y-3">
                      <div className="p-4 bg-success/10 border border-success/20 rounded-lg text-center">
                        <Check className="w-8 h-8 text-success mx-auto mb-2" />
                        <p className="text-success font-medium">Request sent to {upiId}</p>
                        <p className="text-sm text-muted-foreground mt-1">Waiting for payment confirmation...</p>
                      </div>
                      <Button onClick={handleMarkPaid} variant="outline" className="w-full">
                        Manually Verify Payment
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {/* QR Code */}
              {paymentMethod === 'qr' && (
                <div className="space-y-4">
                  <div className="flex flex-col items-center p-6 bg-card rounded-xl border border-border">
                    <QRCodeSVG
                      value={`upi://pay?pa=hostel@upi&pn=HostelHub&am=${calculateTotalAmount()}&cu=INR&tn=Hostel%20Rent`}
                      size={200}
                      level="H"
                      includeMargin
                      className="rounded-lg"
                    />
                    <p className="text-sm text-muted-foreground mt-4">Ask student to scan this QR code</p>
                    <p className="font-heading text-lg font-bold text-foreground">₹{calculateTotalAmount().toLocaleString()}</p>
                  </div>
                  <Button onClick={handleMarkPaid} variant="outline" className="w-full">
                    Confirm Payment Received
                  </Button>
                </div>
              )}

              {/* Cash Payment */}
              {paymentMethod === 'cash' && (
                <div className="space-y-4">
                  <div className="p-6 bg-muted/30 rounded-xl border border-border text-center">
                    <Banknote className="w-12 h-12 text-primary mx-auto mb-3" />
                    <p className="text-lg font-medium text-foreground">Cash Payment</p>
                    <p className="text-muted-foreground mt-1">Collect ₹{calculateTotalAmount().toLocaleString()} in cash</p>
                  </div>
                  <Button onClick={handleMarkPaid} className="w-full">
                    Mark as Paid
                  </Button>
                </div>
              )}

              {/* Payment Verified */}
              {paymentVerified && (
                <div className="p-4 bg-success/10 border border-success/20 rounded-lg flex items-center gap-3">
                  <div className="w-10 h-10 bg-success rounded-full flex items-center justify-center">
                    <Check className="w-5 h-5 text-success-foreground" />
                  </div>
                  <div>
                    <p className="font-medium text-success">Payment Verified</p>
                    <p className="text-sm text-muted-foreground">Ready to complete onboarding</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-border flex items-center justify-between">
          <Button
            variant="outline"
            onClick={currentStep === 1 ? onClose : handleBack}
          >
            {currentStep === 1 ? 'Cancel' : (
              <>
                <ChevronLeft className="w-4 h-4 mr-1" />
                Back
              </>
            )}
          </Button>
          
          {currentStep < 3 ? (
            <Button onClick={handleNext}>
              Next
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          ) : (
            <Button
              onClick={handleComplete}
              disabled={!paymentVerified}
              className="bg-success hover:bg-success/90"
            >
              <Check className="w-4 h-4 mr-2" />
              Complete Onboarding
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
