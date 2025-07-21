import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Trophy, 
  Gift, 
  Star, 
  Target, 
  Zap,
  Clock,
  CheckCircle
} from "lucide-react";

const Rewards = () => {
  // Mock rewards data
  const earnedRewards = [
    {
      id: "1",
      name: "First Week Complete",
      description: "Completed your first week of tracking",
      points: 100,
      earnedDate: "2024-01-15",
      icon: Trophy,
      category: "milestone"
    },
    {
      id: "2", 
      name: "Hydration Hero",
      description: "Logged water intake for 7 consecutive days",
      points: 75,
      earnedDate: "2024-01-18",
      icon: Target,
      category: "consistency"
    },
    {
      id: "3",
      name: "Step Master",
      description: "Achieved 10,000 steps in a single day",
      points: 50,
      earnedDate: "2024-01-20",
      icon: Zap,
      category: "achievement"
    }
  ];

  const availableRewards = [
    {
      id: "1",
      name: "$5 Health Food Credit",
      description: "Redeem at partner health food stores",
      pointsCost: 200,
      currentPoints: 225,
      available: true,
      category: "credit",
      icon: Gift
    },
    {
      id: "2",
      name: "Premium Analytics",
      description: "Unlock detailed health insights for 1 month",
      pointsCost: 150,
      currentPoints: 225,
      available: true,
      category: "feature",
      icon: Star
    },
    {
      id: "3",
      name: "Personal Consultation",
      description: "30-minute session with a nutritionist",
      pointsCost: 500,
      currentPoints: 225,
      available: false,
      category: "service",
      icon: Target
    }
  ];

  const progressToNext = [
    {
      name: "Consistency Champion",
      description: "Log all metrics for 30 consecutive days",
      currentProgress: 7,
      targetProgress: 30,
      points: 200
    },
    {
      name: "Weight Goal Achiever", 
      description: "Reach your target weight",
      currentProgress: 1.4,
      targetProgress: 6.4,
      points: 300,
      unit: "lbs lost"
    }
  ];

  const totalPoints = 225;

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "milestone":
        return "bg-success/20 text-success border-success/30";
      case "consistency":
        return "bg-primary/20 text-primary border-primary/30";
      case "achievement":
        return "bg-warning/20 text-warning border-warning/30";
      case "credit":
        return "bg-accent/20 text-accent border-accent/30";
      case "feature":
        return "bg-primary/20 text-primary border-primary/30";
      case "service":
        return "bg-success/20 text-success border-success/30";
      default:
        return "bg-secondary/20 text-secondary-foreground border-secondary/30";
    }
  };

  return (
    <div className="space-y-6">
      {/* Points Overview */}
      <Card className="bg-gradient-card border-border/50 shadow-card">
        <CardContent className="p-6 text-center">
          <div className="mb-4">
            <Trophy className="h-12 w-12 mx-auto text-primary mb-2" />
            <h2 className="text-3xl font-bold text-foreground">{totalPoints}</h2>
            <p className="text-muted-foreground">Total Points Earned</p>
          </div>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <p className="font-semibold text-foreground">{earnedRewards.length}</p>
              <p className="text-muted-foreground">Rewards Earned</p>
            </div>
            <div>
              <p className="font-semibold text-foreground">{availableRewards.filter(r => r.available).length}</p>
              <p className="text-muted-foreground">Available to Redeem</p>
            </div>
            <div>
              <p className="font-semibold text-foreground">{progressToNext.length}</p>
              <p className="text-muted-foreground">In Progress</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Available Rewards */}
      <Card className="bg-card border-border/50 shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Gift className="h-5 w-5 mr-2 text-primary" />
            Available Rewards
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {availableRewards.map((reward) => {
            const Icon = reward.icon;
            const canRedeem = reward.currentPoints >= reward.pointsCost;
            
            return (
              <div 
                key={reward.id}
                className={`border rounded-lg p-4 transition-all ${canRedeem ? 'border-primary/50 bg-primary/5' : 'border-border/50'}`}
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg ${getCategoryColor(reward.category)}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-medium text-foreground">{reward.name}</h3>
                      <p className="text-sm text-muted-foreground mb-2">{reward.description}</p>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {reward.pointsCost} points
                        </Badge>
                        {canRedeem && (
                          <Badge className="bg-success/20 text-success border-success/30 text-xs">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Ready to redeem
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <Button 
                    variant={canRedeem ? "default" : "outline"}
                    size="sm"
                    disabled={!canRedeem}
                    className={canRedeem ? "bg-primary hover:bg-primary/90" : ""}
                  >
                    {canRedeem ? "Redeem" : `Need ${reward.pointsCost - reward.currentPoints} more`}
                  </Button>
                </div>
                
                {!canRedeem && (
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Progress</span>
                      <span className="text-foreground">
                        {reward.currentPoints}/{reward.pointsCost} points
                      </span>
                    </div>
                    <Progress value={(reward.currentPoints / reward.pointsCost) * 100} className="h-2" />
                  </div>
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Progress to Next Rewards */}
      <Card className="bg-card border-border/50 shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Target className="h-5 w-5 mr-2 text-primary" />
            Progress to Next Rewards
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {progressToNext.map((item, index) => (
            <div key={index} className="border border-border/50 rounded-lg p-4">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-medium text-foreground">{item.name}</h3>
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                </div>
                <Badge className="bg-warning/20 text-warning border-warning/30">
                  <Clock className="h-3 w-3 mr-1" />
                  {item.points} pts
                </Badge>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    {item.currentProgress} of {item.targetProgress} {item.unit || 'days'}
                  </span>
                  <span className="text-foreground font-medium">
                    {Math.round((item.currentProgress / item.targetProgress) * 100)}%
                  </span>
                </div>
                <Progress value={(item.currentProgress / item.targetProgress) * 100} className="h-2" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Earned Rewards */}
      <Card className="bg-card border-border/50 shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Trophy className="h-5 w-5 mr-2 text-primary" />
            Earned Rewards
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {earnedRewards.map((reward) => {
            const Icon = reward.icon;
            
            return (
              <div key={reward.id} className="border border-border/50 rounded-lg p-4 bg-secondary/20">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${getCategoryColor(reward.category)}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start mb-1">
                      <h3 className="font-medium text-foreground">{reward.name}</h3>
                      <Badge className="bg-success/20 text-success border-success/30">
                        +{reward.points} pts
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-1">{reward.description}</p>
                    <p className="text-xs text-muted-foreground">
                      Earned on {new Date(reward.earnedDate).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
};

export default Rewards;