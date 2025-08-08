import { useState } from 'react';
import { CreditCard, Shield, X } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import PropTypes from 'prop-types';

export default function MonnifyPaymentModal({ 
  isOpen, 
  onClose, 
  onPaymentComplete, 
  amount, 
  product 
}) {
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [isProcessing, setIsProcessing] = useState(false);

  const handlePayment = async () => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      onPaymentComplete();
    }, 3000);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Monnify Payment
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {/* Order Summary */}
          <div className="bg-secondary/30 rounded-lg p-4">
            <h3 className="font-semibold mb-2">Order Summary</h3>
            <div className="flex gap-3">
              <img 
                src={product.image} 
                alt={product.title}
                className="w-12 h-12 object-cover rounded"
              />
              <div className="flex-1">
                <p className="font-medium text-sm">{product.title}</p>
                <p className="text-xs text-muted-foreground">{product.seller}</p>
              </div>
            </div>
            <hr className="my-3 border-border" />
            <div className="flex justify-between font-bold text-lg">
              <span>Total:</span>
              <span className="text-primary">₦{amount.toLocaleString()}</span>
            </div>
          </div>
          {/* Payment Methods */}
          <div>
            <Label className="text-sm font-semibold">Payment Method</Label>
            <div className="grid grid-cols-3 gap-2 mt-2">
              <Button
                variant={paymentMethod === 'card' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setPaymentMethod('card')}
              >
                Card
              </Button>
              <Button
                variant={paymentMethod === 'transfer' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setPaymentMethod('transfer')}
              >
                Transfer
              </Button>
              <Button
                variant={paymentMethod === 'ussd' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setPaymentMethod('ussd')}
              >
                USSD
              </Button>
            </div>
          </div>
          {/* Payment Form */}
          {paymentMethod === 'card' && (
            <div className="space-y-3">
              <div>
                <Label htmlFor="cardNumber">Card Number</Label>
                <Input
                  id="cardNumber"
                  placeholder="1234 5678 9012 3456"
                  maxLength={19}
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label htmlFor="expiry">Expiry</Label>
                  <Input
                    id="expiry"
                    placeholder="MM/YY"
                    maxLength={5}
                  />
                </div>
                <div>
                  <Label htmlFor="cvv">CVV</Label>
                  <Input
                    id="cvv"
                    placeholder="123"
                    maxLength={3}
                  />
                </div>
              </div>
            </div>
          )}
          {paymentMethod === 'transfer' && (
            <div className="text-center p-4 bg-secondary/30 rounded-lg">
              <p className="text-sm">Transfer ₦{amount.toLocaleString()} to:</p>
              <p className="font-mono font-bold mt-2">0123456789</p>
              <p className="text-xs text-muted-foreground">Monnify Bank</p>
            </div>
          )}
          {paymentMethod === 'ussd' && (
            <div className="text-center p-4 bg-secondary/30 rounded-lg">
              <p className="text-sm">Dial on your phone:</p>
              <p className="font-mono font-bold text-lg mt-2">*737*1234#</p>
              <p className="text-xs text-muted-foreground">Follow the prompts to complete payment</p>
            </div>
          )}
          {/* Security Badge */}
          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <Shield className="w-4 h-4" />
            <span>Secured by Monnify</span>
          </div>
          {/* Action Buttons */}
          <div className="flex gap-2 pt-2">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button 
              onClick={handlePayment}
              disabled={isProcessing}
              className="flex-1 bg-gradient-primary hover:opacity-90"
            >
              {isProcessing ? 'Processing...' : `Pay ₦${amount.toLocaleString()}`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

MonnifyPaymentModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onPaymentComplete: PropTypes.func.isRequired,
  amount: PropTypes.number.isRequired,
  product: PropTypes.shape({
    id: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    price: PropTypes.number.isRequired,
    seller: PropTypes.string.isRequired,
    image: PropTypes.string.isRequired,
  }).isRequired,
};