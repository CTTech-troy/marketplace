import { useState } from 'react';
import { ArrowLeft, Edit3, User, Bell, Shield, HelpCircle, LogOut } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { Switch } from './ui/switch';
import EditProfileModal from './EditProfileModal';

export default function SettingsPage() {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [notifications, setNotifications] = useState(true);

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="sticky top-0 bg-background/80 backdrop-blur-lg border-b border-border z-10 p-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-bold">Settings</h1>
        </div>
      </div>

      {/* Profile Section */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-4 mb-4">
          <Avatar className="w-16 h-16">
            <AvatarImage src="/api/placeholder/64/64" />
            <AvatarFallback>JD</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <h2 className="text-lg font-semibold">John Doe</h2>
            <p className="text-sm text-muted-foreground">@johndoe_shop</p>
          </div>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setIsEditModalOpen(true)}
          >
            <Edit3 className="w-4 h-4 mr-2" />
            Edit
          </Button>
        </div>
      </div>

      {/* Settings Options */}
      <div className="p-4 space-y-6">
        {/* Account Settings */}
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground mb-3">ACCOUNT</h3>
          <div className="space-y-1">
            <button className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-secondary/50 transition-colors">
              <div className="flex items-center gap-3">
                <User className="w-5 h-5 text-muted-foreground" />
                <span>Personal Information</span>
              </div>
            </button>
            <button className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-secondary/50 transition-colors">
              <div className="flex items-center gap-3">
                <Shield className="w-5 h-5 text-muted-foreground" />
                <span>Privacy & Security</span>
              </div>
            </button>
          </div>
        </div>

        {/* Preferences */}
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground mb-3">PREFERENCES</h3>
          <div className="space-y-1">
            <div className="flex items-center justify-between p-3 rounded-lg">
              <div className="flex items-center gap-3">
                <Bell className="w-5 h-5 text-muted-foreground" />
                <span>Push Notifications</span>
              </div>
              <Switch 
                checked={notifications} 
                onCheckedChange={setNotifications}
              />
            </div>
          </div>
        </div>

        {/* Support */}
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground mb-3">SUPPORT</h3>
          <div className="space-y-1">
            <button className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-secondary/50 transition-colors">
              <div className="flex items-center gap-3">
                <HelpCircle className="w-5 h-5 text-muted-foreground" />
                <span>Help & Support</span>
              </div>
            </button>
          </div>
        </div>

        {/* Logout */}
        <div className="pt-4">
          <Button 
            variant="destructive" 
            className="w-full"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
      </div>

      <EditProfileModal 
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
      />
    </div>
  );
}