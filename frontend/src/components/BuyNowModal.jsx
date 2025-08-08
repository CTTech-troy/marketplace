import { useState } from 'react';
import { Package, Truck } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Button } from '../components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import DeliveryConfirmModal from './DeliveryConfirmModal';
import MonnifyPaymentModal from './MonnifyPaymentModal';

/**
 * @typedef {Object} Product
 * @property {string} id
 * @property {string} title
 * @property {number} price
 * @property {string} seller
 * @property {string} image
 */

/**
 * @typedef {Object} BuyNowModalProps
 * @property {boolean} isOpen
 * @property {() => void} onClose
 * @property {Product|null} product
 */

export default function BuyNowModal({ isOpen, onClose, product }) {
  const [showDeliveryModal, setShowDeliveryModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [finalPrice, setFinalPrice] = useState(0);

  if (!product) return null;

  const handlePayNow = () => {
    setShowDeliveryModal(true);
  };

  const handleDeliveryChoice = (includeDelivery) => {
    const price = includeDelivery ? product.price + 500 : product.price;
    setFinalPrice(price);
    setShowDeliveryModal(false);
    setShowPaymentModal(true);
  };

  const handlePaymentComplete = () => {
    setShowPaymentModal(false);
    onClose();
    // Show success message
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Contact Seller</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Seller Info */}
            <div className="flex items-center gap-3 p-3 bg-secondary/30 rounded-lg">
              <Avatar className="w-10 h-10">
                <AvatarImage src="/api/placeholder/40/40" />
                <AvatarFallback>S</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold">{product.seller}</p>
                <p className="text-sm text-muted-foreground">Seller</p>
              </div>
            </div>

            {/* Product Info */}
            <div className="flex gap-3 p-3 border border-border rounded-lg">
              <img 
                src={product.image} 
                alt={product.title}
                className="w-16 h-16 object-cover rounded-lg"
              />
              <div className="flex-1">
                <h3 className="font-semibold">{product.title}</h3>
                <p className="text-lg font-bold text-primary">₦{product.price.toLocaleString()}</p>
              </div>
            </div>

            {/* Pre-filled Message */}
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground mb-2">Pre-filled message:</p>
              <div className="p-2 bg-background rounded border">
                <p className="text-sm">Hi! I'm interested in your {product.title} for ₦{product.price.toLocaleString()}. Is it still available?</p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 pt-2">
              <Button variant="outline" onClick={onClose} className="flex-1">
                Send Message
              </Button>
              <Button 
                onClick={handlePayNow}
                className="flex-1 bg-gradient-primary hover:opacity-90"
              >
                <Package className="w-4 h-4 mr-2" />
                Pay Now
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <DeliveryConfirmModal
        isOpen={showDeliveryModal}
        onClose={() => setShowDeliveryModal(false)}
        onConfirm={handleDeliveryChoice}
        product={product}
      />

      <MonnifyPaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        onPaymentComplete={handlePaymentComplete}
        amount={finalPrice}
        product={product}
      />
    </>
  );
}