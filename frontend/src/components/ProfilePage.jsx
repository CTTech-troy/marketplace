import { useState } from 'react';
import { Settings, Plus, Grid3X3, PlaySquare } from 'lucide-react';
import { Button } from './ui/button';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState('posts');
  const userStats = {
    followers: 12500,
    following: 890,
    totalSales: 2500000
  };
  const mockPosts = Array.from({ length: 12 }, (_, i) => ({
    id: i + 1,
    image: `/api/placeholder/300/300`,
    type: i % 3 === 0 ? 'video' : 'image'
  }));
  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold">Profile</h1>
          <Button variant="ghost" size="icon">
            <Settings className="w-5 h-5" />
          </Button>
        </div>
        {/* Profile Info */}
        <div className="flex items-center gap-4 mb-6">
          <Avatar className="w-20 h-20">
            <AvatarImage src="/api/placeholder/80/80" />
            <AvatarFallback>JD</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <h2 className="text-lg font-semibold">John Doe</h2>
            <p className="text-sm text-muted-foreground">@johndoe_shop</p>
            <p className="text-sm mt-1">Selling quality tech products 📱</p>
          </div>
        </div>
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="profile-stat">
            <div className="text-xl font-bold gradient-text">
              {userStats.followers.toLocaleString()}
            </div>
            <div className="text-sm text-muted-foreground">Followers</div>
          </div>
          <div className="profile-stat">
            <div className="text-xl font-bold gradient-text">
              {userStats.following.toLocaleString()}
            </div>
            <div className="text-sm text-muted-foreground">Following</div>
          </div>
          <div className="profile-stat">
            <div className="text-xl font-bold gradient-text">
              ₦{(userStats.totalSales / 1000000).toFixed(1)}M
            </div>
            <div className="text-sm text-muted-foreground">Sales</div>
          </div>
        </div>
        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button className="flex-1 bg-gradient-primary hover:opacity-90">
            Edit Profile
          </Button>
          <Button variant="outline" size="icon">
            <Plus className="w-4 h-4" />
          </Button>
        </div>
      </div>
      {/* Content Tabs */}
      <div className="p-4">
        <div className="flex border-b border-border mb-4">
          <button
            className={`flex-1 py-2 flex items-center justify-center gap-2 ${
              activeTab === 'posts' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground'
            }`}
            onClick={() => setActiveTab('posts')}
          >
            <Grid3X3 className="w-4 h-4" />
            Posts
          </button>
          <button
            className={`flex-1 py-2 flex items-center justify-center gap-2 ${
              activeTab === 'videos' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground'
            }`}
            onClick={() => setActiveTab('videos')}
          >
            <PlaySquare className="w-4 h-4" />
            Videos
          </button>
        </div>
        {/* Posts Grid */}
        <div className="product-grid">
          {mockPosts.map((post) => (
            <div
              key={post.id}
              className="aspect-square bg-muted rounded-lg overflow-hidden relative group cursor-pointer"
            >
              <img
                src={post.image}
                alt={`Post ${post.id}`}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
              />
              {post.type === 'video' && (
                <div className="absolute top-2 right-2">
                  <PlaySquare className="w-5 h-5 text-white" />
                </div>
              )}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}