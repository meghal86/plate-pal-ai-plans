import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { 
  Scale, 
  Droplets, 
  Footprints, 
  Plus, 
  TrendingUp, 
  TrendingDown,
  Minus
} from "lucide-react";

const HealthMetrics = () => {
  const [metrics, setMetrics] = useState({
    weight: '',
    water: '',
    steps: ''
  });

  // Mock data for charts
  const weeklyData = [
    { day: 'Mon', weight: 152.5, water: 8, steps: 8500 },
    { day: 'Tue', weight: 152.3, water: 7, steps: 9200 },
    { day: 'Wed', weight: 152.1, water: 9, steps: 7800 },
    { day: 'Thu', weight: 151.8, water: 8, steps: 10500 },
    { day: 'Fri', weight: 151.6, water: 6, steps: 9800 },
    { day: 'Sat', weight: 151.9, water: 10, steps: 12000 },
    { day: 'Sun', weight: 151.4, water: 8, steps: 8900 }
  ];

  const lastWeekAvg = { weight: 153.2, water: 7.5, steps: 8900 };
  const thisWeekAvg = { weight: 152.0, water: 8.0, steps: 9400 };

  const getChangeIndicator = (current: number, previous: number, isWeight = false) => {
    const change = current - previous;
    const isPositive = isWeight ? change < 0 : change > 0;
    
    return (
      <div className={`flex items-center gap-1 ${isPositive ? 'text-success' : 'text-destructive'}`}>
        {isPositive ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
        <span className="text-sm font-medium">
          {Math.abs(change).toFixed(1)}{isWeight ? ' lbs' : change > 1000 ? ' steps' : ' cups'}
        </span>
      </div>
    );
  };

  const handleInputChange = (field: string, value: string) => {
    setMetrics(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (type: string) => {
    // Handle submission logic here
    console.log(`Submitting ${type}:`, metrics[type as keyof typeof metrics]);
    setMetrics(prev => ({ ...prev, [type]: '' }));
  };

  return (
    <div className="space-y-6">
      {/* Input Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-card border-border/50 shadow-card">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center text-sm">
              <Scale className="h-4 w-4 mr-2 text-primary" />
              Weight (lbs)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input
              type="number"
              placeholder="152.5"
              value={metrics.weight}
              onChange={(e) => handleInputChange('weight', e.target.value)}
            />
            <Button 
              size="sm" 
              variant="health"
              className="w-full"
              onClick={() => handleSubmit('weight')}
            >
              <Plus className="h-4 w-4 mr-2" />
              Log Weight
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-card border-border/50 shadow-card">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center text-sm">
              <Droplets className="h-4 w-4 mr-2 text-accent" />
              Water (cups)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input
              type="number"
              placeholder="8"
              value={metrics.water}
              onChange={(e) => handleInputChange('water', e.target.value)}
            />
            <Button 
              size="sm" 
              variant="outline"
              className="w-full"
              onClick={() => handleSubmit('water')}
            >
              <Plus className="h-4 w-4 mr-2" />
              Log Water
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-card border-border/50 shadow-card">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center text-sm">
              <Footprints className="h-4 w-4 mr-2 text-success" />
              Steps
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input
              type="number"
              placeholder="10000"
              value={metrics.steps}
              onChange={(e) => handleInputChange('steps', e.target.value)}
            />
            <Button 
              size="sm" 
              variant="outline"
              className="w-full"
              onClick={() => handleSubmit('steps')}
            >
              <Plus className="h-4 w-4 mr-2" />
              Log Steps
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Weekly Summary */}
      <Card className="bg-gradient-card border-border/50 shadow-card">
        <CardHeader>
          <CardTitle>Weekly Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="mb-2">
                <Scale className="h-6 w-6 mx-auto text-primary" />
              </div>
              <p className="text-2xl font-bold text-foreground">{thisWeekAvg.weight} lbs</p>
              <p className="text-sm text-muted-foreground mb-2">Avg Weight</p>
              {getChangeIndicator(thisWeekAvg.weight, lastWeekAvg.weight, true)}
            </div>
            
            <div className="text-center">
              <div className="mb-2">
                <Droplets className="h-6 w-6 mx-auto text-accent" />
              </div>
              <p className="text-2xl font-bold text-foreground">{thisWeekAvg.water} cups</p>
              <p className="text-sm text-muted-foreground mb-2">Avg Water</p>
              {getChangeIndicator(thisWeekAvg.water, lastWeekAvg.water)}
            </div>
            
            <div className="text-center">
              <div className="mb-2">
                <Footprints className="h-6 w-6 mx-auto text-success" />
              </div>
              <p className="text-2xl font-bold text-foreground">{thisWeekAvg.steps.toLocaleString()}</p>
              <p className="text-sm text-muted-foreground mb-2">Avg Steps</p>
              {getChangeIndicator(thisWeekAvg.steps, lastWeekAvg.steps)}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-card border-border/50 shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Scale className="h-5 w-5 mr-2 text-primary" />
              Weight Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
                <XAxis dataKey="day" className="fill-muted-foreground" />
                <YAxis domain={['dataMin - 1', 'dataMax + 1']} className="fill-muted-foreground" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }} 
                />
                <Line 
                  type="monotone" 
                  dataKey="weight" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={3}
                  dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2, r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="bg-card border-border/50 shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Footprints className="h-5 w-5 mr-2 text-success" />
              Daily Steps
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
                <XAxis dataKey="day" className="fill-muted-foreground" />
                <YAxis className="fill-muted-foreground" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }} 
                />
                <Bar 
                  dataKey="steps" 
                  fill="hsl(var(--success))"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Water Intake Chart */}
      <Card className="bg-card border-border/50 shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Droplets className="h-5 w-5 mr-2 text-accent" />
            Water Intake
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={weeklyData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
              <XAxis dataKey="day" className="fill-muted-foreground" />
              <YAxis className="fill-muted-foreground" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--card))', 
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px'
                }} 
              />
              <Bar 
                dataKey="water" 
                fill="hsl(var(--accent))"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};

export default HealthMetrics;