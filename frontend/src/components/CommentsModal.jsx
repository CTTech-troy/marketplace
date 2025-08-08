import { useState } from 'react';
import { X, Send } from 'lucide-react';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from './ui/drawer';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';

const mockComments = [
	{
		id: '1',
		user: '@sarah_tech',
		avatar: '/api/placeholder/40/40',
		text: 'This looks amazing! Is it still available?',
		timestamp: '2h',
		likes: 12,
	},
	{
		id: '2',
		user: '@mike_buyer',
		avatar: '/api/placeholder/40/40',
		text: 'Great price! Can you ship to Lagos?',
		timestamp: '5h',
		likes: 8,
	},
	{
		id: '3',
		user: '@fashion_lover',
		avatar: '/api/placeholder/40/40',
		text: 'Do you have other colors available?',
		timestamp: '1d',
		likes: 15,
	},
];

export default function CommentsModal({ isOpen, onClose }) {
	const [newComment, setNewComment] = useState('');
	const [comments, setComments] = useState(mockComments);

	const handleSendComment = () => {
		if (newComment.trim()) {
			const comment = {
				id: Date.now().toString(),
				user: '@johndoe_shop',
				avatar: '/api/placeholder/40/40',
				text: newComment,
				timestamp: 'now',
				likes: 0,
			};
			setComments((prev) => [comment, ...prev]);
			setNewComment('');
		}
	};

	return (
		<Drawer open={isOpen} onOpenChange={onClose}>
			<DrawerContent className="h-[80vh]">
				<DrawerHeader className="pb-4">
					<DrawerTitle className="text-center">Comments</DrawerTitle>
				</DrawerHeader>
				<div className="flex-1 overflow-y-auto px-4 pb-4">
					<div className="space-y-4">
						{comments.map((comment) => (
							<div key={comment.id} className="flex gap-3">
								<Avatar className="w-8 h-8">
									<AvatarImage src={comment.avatar} />
									<AvatarFallback>U</AvatarFallback>
								</Avatar>
								<div className="flex-1">
									<div className="bg-secondary/50 rounded-lg p-3">
										<div className="flex items-center gap-2 mb-1">
											<span className="font-semibold text-sm">
												{comment.user}
											</span>
											<span className="text-xs text-muted-foreground">
												{comment.timestamp}
											</span>
										</div>
										<p className="text-sm">{comment.text}</p>
									</div>

									<div className="flex items-center gap-4 mt-1 ml-3">
										<button className="text-xs text-muted-foreground hover:text-foreground">
											Reply
										</button>
										<button className="text-xs text-muted-foreground hover:text-like">
											♥ {comment.likes}
										</button>
									</div>
								</div>
							</div>
						))}
					</div>
				</div>
				{/* Comment Input */}
				<div className="p-4 border-t border-border">
					<div className="flex gap-2">
						<Avatar className="w-8 h-8">
							<AvatarImage src="/api/placeholder/40/40" />
							<AvatarFallback>JD</AvatarFallback>
						</Avatar>
						<div className="flex-1 flex gap-2">
							<Input
								placeholder="Add a comment..."
								value={newComment}
								onChange={(e) => setNewComment(e.target.value)}
								onKeyPress={(e) => e.key === 'Enter' && handleSendComment()}
								className="flex-1"
							/>
							<Button size="sm" onClick={handleSendComment}>
								<Send className="w-4 h-4" />
							</Button>
						</div>
					</div>
				</div>
			</DrawerContent>
		</Drawer>
	);
}