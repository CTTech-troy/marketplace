import { useState } from 'react';
import { Heart, MessageCircle, Share, ShoppingBag } from 'lucide-react';
import { Button } from './ui/button';
import iphoneHero from '../assets/iphone-hero.jpg';
import sneakerHero from '../assets/sneaker-hero.jpg';
import handbagHero from '../assets/handbag-hero.jpg';
import CommentsModal from './CommentsModal';
import BuyNowModal from './BuyNowModal';
import ShareModal from './ShareModal';

const mockProducts = [
  {
    id: '1',
    title: 'iPhone 14 Pro Max',
    price: 450000,
    seller: '@techstore_ng',
    image: iphoneHero,
    likes: 1234,
    comments: 89
  },
  {
    id: '2',
    title: 'Nike Air Force 1',
    price: 35000,
    seller: '@sneaker_hub',
    image: sneakerHero,
    likes: 2156,
    comments: 156
  },
  {
    id: '3',
    title: 'Designer Handbag',
    price: 25000,
    seller: '@luxury_bags',
    image: handbagHero,
    likes: 3421,
    comments: 234
  }
];

export default function VideoFeed() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [likedProducts, setLikedProducts] = useState(new Set());
  const [commentsModalOpen, setCommentsModalOpen] = useState(false);
  const [buyNowModalOpen, setBuyNowModalOpen] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  const handleLike = (productId) => {
    setLikedProducts(prev => {
      const newSet = new Set(prev);
      if (newSet.has(productId)) {
        newSet.delete(productId);
      } else {
        newSet.add(productId);
      }
      return newSet;
    });
  };

  const handleBuyNow = (product) => {
    setSelectedProduct(product);
    setBuyNowModalOpen(true);
  };

  const handleComments = (product) => {
    setSelectedProduct(product);
    setCommentsModalOpen(true);
  };

  const handleShare = (product) => {
    setSelectedProduct(product);
    setShareModalOpen(true);
  };

  return (
    <div className="relative h-screen overflow-hidden">
      {mockProducts.map((product, index) => (
        <div
          key={product.id}
          className={`video-card absolute inset-0 transition-transform duration-500 ${
            index === currentIndex ? 'translate-y-0' : 
            index < currentIndex ? '-translate-y-full' : 'translate-y-full'
          }`}
          style={{
            backgroundImage: `url(${product.image})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
        >
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          {/* Product info */}
          <div className="absolute bottom-20 left-4 right-20 text-white">
            <h3 className="text-xl font-bold mb-2">{product.title}</h3>
            <p className="text-sm text-gray-300 mb-2">{product.seller}</p>
            <p className="text-2xl font-bold gradient-text mb-4">₦{product.price.toLocaleString()}</p>
            <Button 
              className="buy-button"
              onClick={() => handleBuyNow(product)}
            >
              <ShoppingBag className="w-4 h-4 mr-2" />
              Buy Now
            </Button>
          </div>
          {/* Interaction buttons */}
          <div className="absolute right-4 bottom-32 flex flex-col gap-4">
            <button
              className={`interaction-button ${likedProducts.has(product.id) ? 'text-like' : 'text-white'}`}
              onClick={() => handleLike(product.id)}
            >
              <Heart className={`w-6 h-6 ${likedProducts.has(product.id) ? 'fill-current' : ''}`} />
              <span className="text-xs mt-1 block">{product.likes}</span>
            </button>
            <button 
              className="interaction-button text-white"
              onClick={() => handleComments(product)}
            >
              <MessageCircle className="w-6 h-6" />
              <span className="text-xs mt-1 block">{product.comments}</span>
            </button>
            <button 
              className="interaction-button text-white"
              onClick={() => handleShare(product)}
            >
              <Share className="w-6 h-6" />
            </button>
          </div>
        </div>
      ))}
      {/* Navigation dots */}
      <div className="absolute right-4 top-1/2 transform -translate-y-1/2 flex flex-col gap-2">
        {mockProducts.map((_, index) => (
          <button
            key={index}
            className={`w-2 h-8 rounded-full transition-all duration-300 ${
              index === currentIndex ? 'bg-white' : 'bg-white/30'
            }`}
            onClick={() => setCurrentIndex(index)}
          />
        ))}
      </div>
      {/* Modals */}
      <CommentsModal
        isOpen={commentsModalOpen}
        onClose={() => setCommentsModalOpen(false)}
        productId={selectedProduct?.id || ''}
      />
      <BuyNowModal
        isOpen={buyNowModalOpen}
        onClose={() => setBuyNowModalOpen(false)}
        product={selectedProduct}
      />
      <ShareModal
        isOpen={shareModalOpen}
        onClose={() => setShareModalOpen(false)}
        product={selectedProduct}
      />
    </div>
  );
}