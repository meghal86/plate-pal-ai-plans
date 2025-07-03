import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Upload, 
  FileText, 
  Sparkles, 
  Search, 
  Clock, 
  Users,
  Star,
  Download
} from "lucide-react";
import { useState } from "react";

const DietPlans = () => {
  const [searchTerm, setSearchTerm] = useState("");

  // Mock diet plans data
  const myPlans = [
    {
      id: 1,
      name: "Mediterranean Keto Plan",
      description: "Low-carb Mediterranean diet with healthy fats",
      duration: "4 weeks",
      calories: "1800-2000",
      type: "Uploaded",
      status: "Active",
      progress: 75
    },
    {
      id: 2,
      name: "Plant-Based Protein Focus",
      description: "High-protein vegan meal plan for muscle building",
      duration: "6 weeks",
      calories: "2200-2400",
      type: "AI Generated",
      status: "Completed",
      progress: 100
    }
  ];

  const aiSuggestions = [
    {
      id: 3,
      name: "Weight Loss Accelerator",
      description: "Balanced macros optimized for sustainable weight loss",
      calories: "1600-1800",
      rating: 4.8,
      users: 1247
    },
    {
      id: 4,
      name: "Athletic Performance Plan",
      description: "High-energy meals for endurance athletes",
      calories: "2800-3200",
      rating: 4.9,
      users: 892
    },
    {
      id: 5,
      name: "Anti-Inflammatory Diet",
      description: "Foods that reduce inflammation and boost immunity",
      calories: "2000-2200",
      rating: 4.7,
      users: 634
    }
  ];

  return (
    <div className="space-y-6 pb-20 md:pb-6">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Diet Plans</h1>
          <p className="text-muted-foreground mt-1">
            Manage your nutrition plans and discover AI-powered recommendations
          </p>
        </div>
        <div className="flex space-x-3">
          <Button variant="outline">
            <Upload className="h-4 w-4 mr-2" />
            Upload Plan
          </Button>
          <Button variant="health">
            <Sparkles className="h-4 w-4 mr-2" />
            Generate AI Plan
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <Card className="bg-card border-border/50 shadow-card">
        <CardContent className="p-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search diet plans, cuisines, or dietary restrictions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-background border-border/50"
            />
          </div>
        </CardContent>
      </Card>

      {/* My Plans Section */}
      <div>
        <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center">
          <FileText className="h-5 w-5 mr-2 text-primary" />
          My Diet Plans
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {myPlans.map((plan) => (
            <Card key={plan.id} className="bg-gradient-card border-border/50 shadow-card hover:shadow-soft transition-all duration-300">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg text-foreground">{plan.name}</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">{plan.description}</p>
                  </div>
                  <div className="flex space-x-2">
                    <Badge variant={plan.type === "AI Generated" ? "default" : "secondary"}>
                      {plan.type}
                    </Badge>
                    <Badge variant={plan.status === "Active" ? "default" : "secondary"}>
                      {plan.status}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Duration:</span>
                    <span className="text-foreground">{plan.duration}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Daily Calories:</span>
                    <span className="text-foreground">{plan.calories}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Progress:</span>
                    <span className="text-foreground">{plan.progress}%</span>
                  </div>
                  <div className="flex space-x-2">
                    <Button variant="default" className="flex-1">
                      View Details
                    </Button>
                    <Button variant="outline" size="icon">
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* AI Suggestions Section */}
      <div>
        <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center">
          <Sparkles className="h-5 w-5 mr-2 text-accent" />
          AI-Powered Suggestions
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {aiSuggestions.map((plan) => (
            <Card key={plan.id} className="bg-card border-border/50 shadow-card hover:shadow-soft transition-all duration-300 cursor-pointer group">
              <CardHeader>
                <CardTitle className="text-lg text-foreground group-hover:text-primary transition-colors">
                  {plan.name}
                </CardTitle>
                <p className="text-sm text-muted-foreground">{plan.description}</p>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Daily Calories:</span>
                    <span className="text-foreground">{plan.calories}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-1">
                      <Star className="h-4 w-4 fill-accent text-accent" />
                      <span className="text-sm font-medium text-foreground">{plan.rating}</span>
                    </div>
                    <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                      <Users className="h-4 w-4" />
                      <span>{plan.users.toLocaleString()}</span>
                    </div>
                  </div>
                  <Button variant="outline" className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                    <Sparkles className="h-4 w-4 mr-2" />
                    Try This Plan
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <Card className="bg-gradient-subtle border-border/50 shadow-card">
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button variant="outline" className="h-auto p-4 flex-col space-y-2">
              <Upload className="h-6 w-6 text-primary" />
              <span>Upload PDF Plan</span>
              <span className="text-xs text-muted-foreground">Import your existing diet plan</span>
            </Button>
            <Button variant="outline" className="h-auto p-4 flex-col space-y-2">
              <Sparkles className="h-6 w-6 text-accent" />
              <span>AI Plan Generator</span>
              <span className="text-xs text-muted-foreground">Create personalized plan</span>
            </Button>
            <Button variant="outline" className="h-auto p-4 flex-col space-y-2">
              <Clock className="h-6 w-6 text-success" />
              <span>Quick Templates</span>
              <span className="text-xs text-muted-foreground">Start with proven plans</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DietPlans;