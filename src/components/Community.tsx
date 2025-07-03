import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { 
  Heart, 
  MessageCircle, 
  Share, 
  Trophy, 
  Users, 
  Star,
  Calendar,
  Target
} from "lucide-react";

const Community = () => {
  // Mock community data
  const posts = [
    {
      id: 1,
      user: { name: "Emma Johnson", avatar: "", initials: "EJ" },
      timeAgo: "2 hours ago",
      content: "Just completed my first week on the Mediterranean diet! Down 3 pounds and feeling amazing. The salmon and quinoa bowls are incredible! 🐟✨",
      likes: 24,
      comments: 8,
      shares: 3,
      tags: ["mediterranean", "weightloss", "healthy"]
    },
    {
      id: 2,
      user: { name: "Marcus Chen", avatar: "", initials: "MC" },
      timeAgo: "4 hours ago",
      content: "Meal prep Sunday done! 🥗 Prepared 20 balanced meals for the week. The key is batch cooking proteins and rotating vegetables to keep it interesting.",
      likes: 42,
      comments: 15,
      shares: 12,
      tags: ["mealprep", "planning", "efficiency"]
    },
    {
      id: 3,
      user: { name: "Sarah Williams", avatar: "", initials: "SW" },
      timeAgo: "1 day ago",
      content: "AI-generated meal plan suggestion was spot on! The app recommended perfect portions for my training schedule. Hit all my macro targets today 💪",
      likes: 67,
      comments: 23,
      shares: 8,
      tags: ["ai", "macros", "training"]
    }
  ];

  const challenges = [
    {
      id: 1,
      name: "30-Day Hydration Challenge",
      participants: 2847,
      daysLeft: 12,
      description: "Drink 8 glasses of water daily",
      reward: "Hydration Master Badge"
    },
    {
      id: 2,
      name: "Plant-Based Week",
      participants: 1203,
      daysLeft: 3,
      description: "7 days of plant-based meals",
      reward: "Green Warrior Badge"
    },
    {
      id: 3,
      name: "Macro Tracking Streak",
      participants: 892,
      daysLeft: 25,
      description: "Track macros for 30 consecutive days",
      reward: "Data Master Badge"
    }
  ];

  const leaderboard = [
    { rank: 1, name: "Alex Rivera", points: 2847, badge: "🏆" },
    { rank: 2, name: "Jamie Park", points: 2673, badge: "🥈" },
    { rank: 3, name: "Taylor Swift", points: 2521, badge: "🥉" },
    { rank: 4, name: "You", points: 2089, badge: "⭐" },
    { rank: 5, name: "Morgan Lee", points: 1956, badge: "💪" }
  ];

  return (
    <div className="space-y-6 pb-20 md:pb-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Community</h1>
          <p className="text-muted-foreground mt-1">
            Connect with fellow nutrition enthusiasts and share your journey
          </p>
        </div>
        <Button variant="health">
          <Share className="h-4 w-4 mr-2" />
          Share Progress
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Community Feed */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="bg-card border-border/50 shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="h-5 w-5 mr-2 text-primary" />
                Community Feed
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {posts.map((post) => (
                <div key={post.id} className="border-b border-border/50 last:border-b-0 pb-6 last:pb-0">
                  <div className="flex items-start space-x-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={post.user.avatar} />
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {post.user.initials}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-foreground">{post.user.name}</p>
                          <p className="text-sm text-muted-foreground">{post.timeAgo}</p>
                        </div>
                      </div>
                      
                      <p className="text-foreground leading-relaxed">{post.content}</p>
                      
                      <div className="flex flex-wrap gap-2">
                        {post.tags.map((tag) => (
                          <Badge key={tag} variant="secondary" className="text-xs">
                            #{tag}
                          </Badge>
                        ))}
                      </div>
                      
                      <div className="flex items-center space-x-6 pt-2">
                        <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-primary">
                          <Heart className="h-4 w-4 mr-1" />
                          {post.likes}
                        </Button>
                        <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-primary">
                          <MessageCircle className="h-4 w-4 mr-1" />
                          {post.comments}
                        </Button>
                        <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-primary">
                          <Share className="h-4 w-4 mr-1" />
                          {post.shares}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Active Challenges */}
          <Card className="bg-card border-border/50 shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Trophy className="h-5 w-5 mr-2 text-accent" />
                Active Challenges
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {challenges.map((challenge) => (
                <div key={challenge.id} className="bg-secondary/50 rounded-lg p-4 hover:bg-secondary transition-colors">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-medium text-foreground">{challenge.name}</h4>
                    <Badge variant="outline" className="text-xs">
                      {challenge.daysLeft} days left
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">{challenge.description}</p>
                  <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
                    <span className="flex items-center">
                      <Users className="h-3 w-3 mr-1" />
                      {challenge.participants.toLocaleString()} participants
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-accent">🏆 {challenge.reward}</span>
                    <Button size="sm" variant="outline">
                      Join
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Leaderboard */}
          <Card className="bg-gradient-health border-0 text-primary-foreground">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Star className="h-5 w-5 mr-2" />
                Weekly Leaderboard
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {leaderboard.map((user) => (
                <div key={user.rank} className={`flex items-center justify-between p-3 rounded-lg ${
                  user.name === "You" 
                    ? "bg-white/20 border border-white/30" 
                    : "bg-white/10"
                }`}>
                  <div className="flex items-center space-x-3">
                    <span className="text-lg">{user.badge}</span>
                    <div>
                      <p className="font-medium">{user.name}</p>
                      <p className="text-sm text-primary-foreground/80">Rank #{user.rank}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">{user.points.toLocaleString()}</p>
                    <p className="text-xs text-primary-foreground/80">points</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card className="bg-card border-border/50 shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Target className="h-5 w-5 mr-2 text-primary" />
                Your Stats
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Posts Shared</span>
                <span className="font-semibold text-foreground">23</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Likes Received</span>
                <span className="font-semibold text-foreground">156</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Following</span>
                <span className="font-semibold text-foreground">89</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Followers</span>
                <span className="font-semibold text-foreground">142</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Challenges Completed</span>
                <span className="font-semibold text-foreground">7</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Community;