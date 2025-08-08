import { Copy, Facebook, Twitter, Instagram, MessageCircle } from 'lucide-react';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from './ui/drawer';
import { Button } from './ui/button';
import { toast } from '../hooks/use-toast';
import PropTypes from 'prop-types';

export default function ShareModal({ isOpen, onClose, product }) {
  if (!product) return null;

  const shareUrl = `${window.location.origin}/product/${product.id}`;
  const shareText = `Check out this ${product.title} for ₦${product.price.toLocaleString()} by ${product.seller}!`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast({
        title: "Link copied!",
        description: "Product link has been copied to clipboard"
      });
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleShare = (platform) => {
    let url = '';
    
    switch (platform) {
      case 'facebook':
        url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
        break;
      case 'twitter':
        url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
        break;
      case 'whatsapp':
        url = `https://wa.me/?text=${encodeURIComponent(shareText + ' ' + shareUrl)}`;
        break;
      case 'instagram':
        // Instagram doesn't support direct sharing URLs, so we'll copy the link
        handleCopyLink();
        toast({
          title: "Link copied for Instagram",
          description: "Paste this link in your Instagram story or post"
        });
        return;
    }
    
    if (url) {
      window.open(url, '_blank', 'width=600,height=400');
    }
  };

  return (
    <Drawer open={isOpen} onOpenChange={onClose}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle className="text-center">Share Product</DrawerTitle>
        </DrawerHeader>
        
        <div className="p-4 pb-8">
          {/* Product Preview */}
          <div className="flex gap-3 p-3 bg-secondary/30 rounded-lg mb-6">
            <img 
              src={product.image} 
              alt={product.title}
              className="w-12 h-12 object-cover rounded"
            />
            <div>
              <h3 className="font-semibold text-sm">{product.title}</h3>
              <p className="text-primary font-bold">₦{product.price.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">{product.seller}</p>
            </div>
          </div>

          {/* Share Options */}
          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="outline"
              onClick={() => handleShare('whatsapp')}
              className="h-auto p-4 flex flex-col gap-2"
            >
              <MessageCircle className="w-6 h-6 text-green-500" />
              <span className="text-sm">WhatsApp</span>
            </Button>

            <Button
              variant="outline"
              onClick={() => handleShare('facebook')}
              className="h-auto p-4 flex flex-col gap-2"
            >
              <Facebook className="w-6 h-6 text-blue-600" />
              <span className="text-sm">Facebook</span>
            </Button>

            <Button
              variant="outline"
              onClick={() => handleShare('twitter')}
              className="h-auto p-4 flex flex-col gap-2"
            >
              <Twitter className="w-6 h-6 text-blue-400" />
              <span className="text-sm">Twitter</span>
            </Button>

            <Button
              variant="outline"
              onClick={() => handleShare('instagram')}
              className="h-auto p-4 flex flex-col gap-2"
            >
              <Instagram className="w-6 h-6 text-pink-500" />
              <span className="text-sm">Instagram</span>
            </Button>
          </div>

          {/* Copy Link */}
          <Button
            variant="outline"
            onClick={handleCopyLink}
            className="w-full mt-4 h-auto p-4 flex gap-3"
          >
            <Copy className="w-5 h-5" />
            <div className="text-left">
              <p className="font-semibold">Copy Link</p>
              <p className="text-xs text-muted-foreground truncate">
                {shareUrl}
              </p>
            </div>
          </Button>
        </div>
      </DrawerContent>
    </Drawer>
  );
}

ShareModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  product: PropTypes.shape({
    id: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    price: PropTypes.number.isRequired,
    seller: PropTypes.string.isRequired,
    image: PropTypes.string.isRequired,
  }),
};