import { Truck, Package } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import PropTypes from 'prop-types';

export default function DeliveryConfirmModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  product 
}) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Delivery Option</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="text-center">
            <p className="text-lg mb-2">Do you want it delivered?</p>
            <p className="text-sm text-muted-foreground">
              We can deliver your order for an additional ₦500
            </p>
          </div>
          {/* Price Breakdown */}
          <div className="bg-secondary/30 rounded-lg p-4 space-y-2">
            <div className="flex justify-between">
              <span>Product Price:</span>
              <span>₦{product.price.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Delivery Fee:</span>
              <span>₦500</span>
            </div>
            <hr className="border-border" />
            <div className="flex justify-between font-semibold">
              <span>Total with Delivery:</span>
              <span className="text-primary">₦{(product.price + 500).toLocaleString()}</span>
            </div>
          </div>
          {/* Delivery Options */}
          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="outline"
              onClick={() => onConfirm(false)}
              className="h-auto p-4 flex flex-col gap-2"
            >
              <Package className="w-6 h-6" />
              <div className="text-center">
                <p className="font-semibold">No Delivery</p>
                <p className="text-xs text-muted-foreground">₦{product.price.toLocaleString()}</p>
              </div>
            </Button>
            <Button
              onClick={() => onConfirm(true)}
              className="h-auto p-4 flex flex-col gap-2 bg-gradient-primary hover:opacity-90"
            >
              <Truck className="w-6 h-6" />
              <div className="text-center">
                <p className="font-semibold">With Delivery</p>
                <p className="text-xs opacity-90">₦{(product.price + 500).toLocaleString()}</p>
              </div>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

DeliveryConfirmModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onConfirm: PropTypes.func.isRequired,
  product: PropTypes.shape({
    id: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    price: PropTypes.number.isRequired,
    seller: PropTypes.string.isRequired,
    image: PropTypes.string.isRequired,
  }).isRequired,
};