
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Heart, MessageCircle, Share, Twitter, ThumbsUp, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Post {
  id: string;
  author: string;
  content: string;
  timestamp: string;
  likes: number;
  comments: number;
  tags: string[];
}

const CommunitySharing = () => {
  const [newPost, setNewPost] = useState("");
  const [posts, setPosts] = useState<Post[]>([
    {
      id: "1",
      author: "Sarah M.",
      content: "Just completed my first week on the Mediterranean diet plan! Lost 2kg and feeling more energetic. The AI-generated meal suggestions were spot on! 🥗✨",
      timestamp: "2 hours ago",
      likes: 12,
      comments: 5,
      tags: ["Mediterranean", "WeightLoss", "Energy"]
    },
    {
      id: "2",
      author: "Mike T.",
      content: "Sharing my macro tracking progress - finally hit my protein goals consistently this week! The charts in the dashboard really help visualize the data. 💪",
      timestamp: "5 hours ago",
      likes: 8,
      comments: 3,
      tags: ["Macros", "Protein", "Progress"]
    }
  ]);
  const { toast } = useToast();

  const sharePost = () => {
    if (!newPost.trim()) return;

    const post: Post = {
      id: Date.now().toString(),
      author: "You",
      content: newPost,
      timestamp: "Just now",
      likes: 0,
      comments: 0,
      tags: ["Personal"]
    };

    setPosts(prev => [post, ...prev]);
    setNewPost("");
    
    toast({
      title: "Post shared!",
      description: "Your progress has been shared with the community",
    });
  };

  const shareToX = (post: Post) => {
    const text = encodeURIComponent(`${post.content} #NourishPlate #HealthyEating`);
    const url = `https://twitter.com/intent/tweet?text=${text}`;
    window.open(url, '_blank');
  };

  const likePost = (postId: string) => {
    setPosts(prev => prev.map(post => 
      post.id === postId 
        ? { ...post, likes: post.likes + 1 }
        : post
    ));
  };

  return (
    <div className="space-y-6">
      {/* Share New Post */}
      <Card className="bg-card border-border/50 shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Share className="h-5 w-5 mr-2 text-primary" />
            Share Your Progress
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            placeholder="Share your journey, achievements, or tips with the community..."
            value={newPost}
            onChange={(e) => setNewPost(e.target.value)}
            className="bg-background min-h-[100px]"
          />
          <div className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground">
              Share your progress and inspire others in the community
            </p>
            <Button onClick={sharePost} disabled={!newPost.trim()}>
              <Share className="h-4 w-4 mr-2" />
              Share Post
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Community Feed */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold text-foreground">Community Feed</h3>
        {posts.map((post) => (
          <Card key={post.id} className="bg-card border-border/50 shadow-card hover:shadow-soft transition-shadow">
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-medium text-foreground">{post.author}</h4>
                    <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      <span>{post.timestamp}</span>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => shareToX(post)}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <Twitter className="h-4 w-4" />
                  </Button>
                </div>

                <p className="text-foreground leading-relaxed">{post.content}</p>

                <div className="flex flex-wrap gap-2">
                  {post.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-xs">
                      #{tag}
                    </Badge>
                  ))}
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-border">
                  <div className="flex items-center space-x-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => likePost(post.id)}
                      className="text-muted-foreground hover:text-red-500 transition-colors"
                    >
                      <Heart className="h-4 w-4 mr-1" />
                      {post.likes}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-muted-foreground hover:text-blue-500 transition-colors"
                    >
                      <MessageCircle className="h-4 w-4 mr-1" />
                      {post.comments}
                    </Button>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => shareToX(post)}
                    className="text-muted-foreground hover:text-primary transition-colors"
                  >
                    <Twitter className="h-4 w-4 mr-1" />
                    Share to X
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default CommunitySharing;
