import { useState } from 'react';
import { Send, Image as ImageIcon, Plus, MoreVertical } from 'lucide-react';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Badge } from './ui/badge';

const mockStories = [
	{ id: '1', user: 'Your Story', avatar: '/api/placeholder/60/60', viewed: false },
	{ id: '2', user: 'TechStore', avatar: '/api/placeholder/60/60', viewed: true },
	{ id: '3', user: 'FashionHub', avatar: '/api/placeholder/60/60', viewed: false },
	{ id: '4', user: 'GadgetWorld', avatar: '/api/placeholder/60/60', viewed: true }
];

const mockChats = [
	{
		id: '1',
		user: 'TechStore NG',
		avatar: '/api/placeholder/40/40',
		lastMessage: 'iPhone 14 Pro - ₦450,000',
		timestamp: '2m',
		unread: 2,
		online: true
	},
	{
		id: '2',
		user: 'Fashion Queen',
		avatar: '/api/placeholder/40/40',
		lastMessage: 'Thank you for your purchase!',
		timestamp: '1h',
		unread: 0,
		online: false
	},
	{
		id: '3',
		user: 'Gadget World',
		avatar: '/api/placeholder/40/40',
		lastMessage: 'Smart Watch available',
		timestamp: '3h',
		unread: 1,
		online: true
	}
];

const mockMessages = [
	{
		id: '1',
		text: "Hi! I'm interested in this iPhone",
		sender: 'user',
		timestamp: '10:30 AM'
	},
	{
		id: '2',
		text: "Hello! Yes, it's available. Here are the details:",
		sender: 'other',
		timestamp: '10:32 AM'
	},
	{
		id: '3',
		text: '',
		sender: 'other',
		timestamp: '10:32 AM',
		productImage: '/api/placeholder/200/200',
		productPrice: 450000
	},
	{
		id: '4',
		text: "Would you like delivery? It's an additional ₦500",
		sender: 'other',
		timestamp: '10:33 AM'
	}
];

export default function MessagesPage() {
	const [activeChat, setActiveChat] = useState('1');
	const [newMessage, setNewMessage] = useState('');

	const handleSendMessage = () => {
		if (newMessage.trim()) {
			console.log('Sending message:', newMessage);
			setNewMessage('');
		}
	};

	return (
		<div className="flex h-screen bg-background">
			{/* Chat List */}
			<div className={`${activeChat ? 'hidden md:flex' : 'flex'} w-full md:w-80 flex-col border-r border-border`}>
				{/* Header */}
				<div className="p-4 border-b border-border">
					<h1 className="text-xl font-bold mb-4">Messages</h1>

					{/* Stories */}
					<div className="flex gap-3 overflow-x-auto pb-2">
						{mockStories.map((story) => (
							<div key={story.id} className="flex flex-col items-center min-w-0">
								<div className={`p-0.5 rounded-full ${story.viewed ? 'bg-muted' : 'bg-gradient-primary'}`}>
									<Avatar className="w-12 h-12 border-2 border-background">
										<AvatarImage src={story.avatar} />
										<AvatarFallback>{story.user[0]}</AvatarFallback>
									</Avatar>
								</div>
								{story.id === '1' && (
									<button className="absolute bg-primary rounded-full p-1 mt-7 ml-8">
										<Plus className="w-3 h-3 text-primary-foreground" />
									</button>
								)}
								<span className="text-xs mt-1 text-center truncate w-16">{story.user}</span>
							</div>
						))}
					</div>
				</div>

				{/* Chat List */}
				<div className="flex-1 overflow-y-auto">
					{mockChats.map((chat) => (
						<div
							key={chat.id}
							className={`p-4 cursor-pointer hover:bg-secondary/50 transition-colors ${
								activeChat === chat.id ? 'bg-secondary' : ''
							}`}
							onClick={() => setActiveChat(chat.id)}
						>
							<div className="flex items-center gap-3">
								<div className="relative">
									<Avatar>
										<AvatarImage src={chat.avatar} />
										<AvatarFallback>{chat.user[0]}</AvatarFallback>
									</Avatar>
									{chat.online && (
										<div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-success rounded-full border-2 border-background" />
									)}
								</div>

								<div className="flex-1 min-w-0">
									<div className="flex items-center justify-between">
										<h3 className="font-semibold truncate">{chat.user}</h3>
										<span className="text-xs text-muted-foreground">{chat.timestamp}</span>
									</div>
									<p className="text-sm text-muted-foreground truncate">{chat.lastMessage}</p>
								</div>

								{chat.unread > 0 && (
									<Badge className="bg-primary text-primary-foreground text-xs min-w-5 h-5 flex items-center justify-center">
										{chat.unread}
									</Badge>
								)}
							</div>
						</div>
					))}
				</div>
			</div>

			{/* Chat Window */}
			{activeChat && (
				<div className="flex-1 flex flex-col">
					{/* Chat Header */}
					<div className="p-4 border-b border-border flex items-center justify-between">
						<div className="flex items-center gap-3">
							<button className="md:hidden" onClick={() => setActiveChat(null)}>
								←
							</button>
							<Avatar>
								<AvatarImage src="/api/placeholder/40/40" />
								<AvatarFallback>T</AvatarFallback>
							</Avatar>
							<div>
								<h2 className="font-semibold">TechStore NG</h2>
								<p className="text-xs text-success">Online</p>
							</div>
						</div>
						<Button variant="ghost" size="icon">
							<MoreVertical className="w-4 h-4" />
						</Button>
					</div>

					{/* Messages */}
					<div className="flex-1 overflow-y-auto p-4 space-y-4">
						{mockMessages.map((message) => (
							<div
								key={message.id}
								className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
							>
								<div
									className={`message-bubble ${
										message.sender === 'user'
											? 'bg-gradient-primary text-white'
											: 'bg-secondary text-foreground'
									}`}
								>
									{message.productImage && (
										<div className="mb-2">
											<img
												src={message.productImage}
												alt="Product"
												className="rounded-lg w-full max-w-48"
											/>
											<div className="mt-2 p-2 bg-background/10 rounded">
												<p className="font-semibold">iPhone 14 Pro Max</p>
												<p className="text-sm">₦{message.productPrice?.toLocaleString()}</p>
												<div className="flex gap-2 mt-2">
													<Button size="sm" variant="outline" className="text-xs">
														No Delivery
													</Button>
													<Button size="sm" className="text-xs bg-gradient-primary">
														+ ₦500 Delivery
													</Button>
												</div>
											</div>
										</div>
									)}
									{message.text && <p>{message.text}</p>}
									<span className="text-xs opacity-70 mt-1 block">{message.timestamp}</span>
								</div>
							</div>
						))}
					</div>

					{/* Message Input */}
					<div className="p-4 border-t border-border">
						<div className="flex items-center gap-2">
							<Button variant="ghost" size="icon">
								<ImageIcon className="w-4 h-4" />
							</Button>
							<Input
								placeholder="Type a message..."
								value={newMessage}
								onChange={(e) => setNewMessage(e.target.value)}
								onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
								className="flex-1"
							/>
							<Button onClick={handleSendMessage} disabled={!newMessage.trim()}>
								<Send className="w-4 h-4" />
							</Button>
						</div>
					</div>
				</div>
			)}

			{!activeChat && (
				<div className="hidden md:flex flex-1 items-center justify-center text-muted-foreground">
					Select a chat to start messaging
				</div>
			)}
		</div>
	);
}