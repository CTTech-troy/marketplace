import { useState } from 'react';
import { Search, Filter, Heart, ShoppingBag } from 'lucide-react';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Badge } from './ui/badge';

const mockProducts = [
	{
		id: '1',
		title: 'iPhone 14 Pro Max',
		price: 450000,
		originalPrice: 500000,
		seller: 'TechWorld',
		image: '/api/placeholder/300/300',
		rating: 4.8,
		reviews: 234,
		category: 'Electronics',
	},
	{
		id: '2',
		title: 'Nike Air Force 1',
		price: 35000,
		seller: 'SneakerHub',
		image: '/api/placeholder/300/300',
		rating: 4.6,
		reviews: 156,
		category: 'Fashion',
	},
	{
		id: '3',
		title: 'MacBook Pro M2',
		price: 650000,
		seller: 'AppleStore NG',
		image: '/api/placeholder/300/300',
		rating: 4.9,
		reviews: 89,
		category: 'Electronics',
	},
	{
		id: '4',
		title: 'Designer Handbag',
		price: 25000,
		seller: 'LuxuryBags',
		image: '/api/placeholder/300/300',
		rating: 4.5,
		reviews: 67,
		category: 'Fashion',
	},
];

const categories = ['All', 'Electronics', 'Fashion', 'Home', 'Beauty', 'Sports'];

export default function ShopPage() {
	const [searchQuery, setSearchQuery] = useState('');
	const [selectedCategory, setSelectedCategory] = useState('All');
	const [likedProducts, setLikedProducts] = useState(new Set());

	const handleLike = (productId) => {
		setLikedProducts((prev) => {
			const newSet = new Set(prev);
			if (newSet.has(productId)) {
				newSet.delete(productId);
			} else {
				newSet.add(productId);
			}
			return newSet;
		});
	};

	const filteredProducts = mockProducts.filter((product) => {
		const matchesSearch = product.title.toLowerCase().includes(searchQuery.toLowerCase());
		const matchesCategory = selectedCategory === 'All' || product.category === selectedCategory;
		return matchesSearch && matchesCategory;
	});

	return (
		<div className="min-h-screen bg-background pb-20">
			{/* Header */}
			<div className="sticky top-0 bg-background/80 backdrop-blur-lg border-b border-border z-10 p-4">
				<h1 className="text-2xl font-bold gradient-text mb-4">Shop</h1>

				{/* Search Bar */}
				<div className="relative mb-4">
					<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
					<Input
						placeholder="Search products..."
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
						className="pl-10 pr-12 bg-secondary/50"
					/>
					<Button
						variant="ghost"
						size="icon"
						className="absolute right-1 top-1/2 transform -translate-y-1/2"
					>
						<Filter className="w-4 h-4" />
					</Button>
				</div>

				{/* Categories */}
				<div className="flex gap-2 overflow-x-auto pb-2">
					{categories.map((category) => (
						<Badge
							key={category}
							variant={selectedCategory === category ? 'default' : 'outline'}
							className={`cursor-pointer whitespace-nowrap ${
								selectedCategory === category
									? 'bg-gradient-primary hover:opacity-90'
									: 'hover:bg-secondary'
							}`}
							onClick={() => setSelectedCategory(category)}
						>
							{category}
						</Badge>
					))}
				</div>
			</div>

			{/* Products Grid */}
			<div className="p-4">
				<div className="product-grid">
					{filteredProducts.map((product) => (
						<div
							key={product.id}
							className="bg-card rounded-lg overflow-hidden shadow-card hover:shadow-glow transition-all duration-300 group"
						>
							<div className="relative aspect-square">
								<img
									src={product.image}
									alt={product.title}
									className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
								/>
								<button
									className={`absolute top-2 right-2 p-2 rounded-full backdrop-blur-sm transition-all duration-300 ${
										likedProducts.has(product.id)
											? 'bg-like/20 text-like'
											: 'bg-black/20 text-white hover:bg-black/40'
									}`}
									onClick={() => handleLike(product.id)}
								>
									<Heart className={`w-4 h-4 ${likedProducts.has(product.id) ? 'fill-current' : ''}`} />
								</button>

								{product.originalPrice && (
									<div className="absolute top-2 left-2">
										<Badge variant="destructive" className="text-xs">
											-{Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}%
										</Badge>
									</div>
								)}
							</div>

							<div className="p-3">
								<h3 className="font-semibold text-sm mb-1 line-clamp-2">{product.title}</h3>
								<p className="text-xs text-muted-foreground mb-2">{product.seller}</p>

								<div className="flex items-center gap-1 mb-2">
									<span className="text-xs text-warning">★</span>
									<span className="text-xs text-muted-foreground">
										{product.rating} ({product.reviews})
									</span>
								</div>

								<div className="flex items-center justify-between">
									<div>
										<span className="font-bold text-primary">₦{product.price.toLocaleString()}</span>
										{product.originalPrice && (
											<span className="text-xs text-muted-foreground line-through ml-1">
												₦{product.originalPrice.toLocaleString()}
											</span>
										)}
									</div>

									<Button size="sm" className="buy-button h-8 px-3">
										<ShoppingBag className="w-3 h-3" />
									</Button>
								</div>
							</div>
						</div>
					))}
				</div>
			</div>
		</div>
	);
}