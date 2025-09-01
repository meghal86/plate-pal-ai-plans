import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import KidsSchoolMealPlanner from '@/components/KidsSchoolMealPlanner';
import PlanCalendar from '@/components/PlanCalendar';
import Layout from '@/components/Layout';
import { useUser } from '@/contexts/UserContext';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';
import { useNavigate } from 'react-router-dom';
import { 
  Baby, 
  ChefHat, 
  Heart, 
  Calendar, 
  Trophy, 
  CheckCircle, 
  Clock, 
  Star,
  Plus,
  RefreshCw,
  Loader2
} from 'lucide-react';

type KidsProfile = Database['public']['Tables']['kids_profiles']['Row'];

const Kids: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useUser();
  const { toast } = useToast();
  
  const [activeTab, setActiveTab] = useState('overview');
  const [kidsProfiles, setKidsProfiles] = useState<KidsProfile[]>([]);
  const [selectedKid, setSelectedKid] = useState<KidsProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [userFamilyId, setUserFamilyId] = useState<string | null>(null);

  const loadKidsProfiles = async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      let foundKids: KidsProfile[] = [];

      // Method 1: Direct lookup
      const { data: directKids, error: directError } = await supabase
        .from('kids_profiles')
        .select('*')
        .eq('created_by', user.id)
        .order('created_at', { ascending: true });

      if (!directError && directKids && directKids.length > 0) {
        foundKids = directKids;
      } else {
        // Method 2: Family-based lookup
        const { data: userProfile, error: profileError } = await supabase
          .from('user_profiles')
          .select('family_id')
          .eq('user_id', user.id)
          .single();

        if (!profileError && userProfile?.family_id) {
          setUserFamilyId(userProfile.family_id);
          
          const { data: familyKids, error: familyError } = await supabase
            .from('kids_profiles')
            .select('*')
            .eq('family_id', userProfile.family_id)
            .order('created_at', { ascending: true });

          if (!familyError && familyKids && familyKids.length > 0) {
            foundKids = familyKids;
          }
        }
      }

      setKidsProfiles(foundKids);
      
      if (foundKids.length > 0 && !selectedKid) {
        setSelectedKid(foundKids[0]);
      }

    } catch (error) {
      console.error('Error loading kids profiles:', error);
      setKidsProfiles([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.id) {
      loadKidsProfiles();
    }
  }, [user?.id]);

  const getKidAge = (birthDate: string) => {
    if (!birthDate) return 0;
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  const getKidInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const handleAddKid = () => {
    navigate('/profile');
  };

  return (
    <Layout>
      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 max-w-4xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-primary/10 rounded-xl">
              <Baby className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Kids Zone</h1>
              <p className="text-sm text-muted-foreground">Healthy nutrition made simple</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button 
              onClick={loadKidsProfiles}
              variant="outline"
              size="sm"
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
            <Button onClick={handleAddKid} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Child
            </Button>
          </div>
        </div>

        {/* Kids Selection */}
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Loading...</p>
            </div>
          </div>
        ) : kidsProfiles.length === 0 ? (
          <Card className="mb-6">
            <CardContent className="text-center py-8">
              <div className="p-4 bg-muted rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Baby className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No Children Added</h3>
              <p className="text-muted-foreground mb-4 text-sm">
                Add your children to create personalized nutrition plans.
              </p>
              <Button onClick={handleAddKid}>
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Child
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            {kidsProfiles.length > 1 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
                {kidsProfiles.map((kid) => (
                  <Card 
                    key={kid.id}
                    className={`cursor-pointer transition-all duration-200 ${
                      selectedKid?.id === kid.id 
                        ? 'ring-2 ring-primary bg-primary/5' 
                        : 'hover:bg-muted/30'
                    }`}
                    onClick={() => setSelectedKid(kid)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback className={`font-medium text-sm ${selectedKid?.id === kid.id ? 'bg-primary/20 text-primary' : 'bg-muted'}`}>
                            {getKidInitials(kid.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-foreground truncate">{kid.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            Age {getKidAge(kid.birth_date || '')}
                          </p>
                        </div>
                        {selectedKid?.id === kid.id && (
                          <CheckCircle className="h-5 w-5 text-primary shrink-0" />
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}

        {/* Main Content */}
        {selectedKid && (
          <div className="space-y-4">
            {/* Profile Summary */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback className="font-medium bg-primary/10 text-primary">
                      {getKidInitials(selectedKid.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground">{selectedKid.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      Age {getKidAge(selectedKid.birth_date || '')} • {selectedKid.gender || 'No gender set'}
                    </p>
                  </div>
                  <div className="text-right text-sm">
                    <p className="font-medium text-primary">85% Health Score</p>
                    <p className="text-muted-foreground">7/10 Goals</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <div className="grid grid-cols-2 gap-3">
              <Button 
                onClick={() => setActiveTab('meal-planner')}
                className="h-auto p-4 flex flex-col items-center gap-2"
                variant="outline"
              >
                <ChefHat className="h-6 w-6" />
                <span className="text-sm font-medium">Meal Plans</span>
              </Button>
              
              <Button 
                onClick={() => setActiveTab('calendar')}
                className="h-auto p-4 flex flex-col items-center gap-2"
                variant="outline"
              >
                <Calendar className="h-6 w-6" />
                <span className="text-sm font-medium">Calendar</span>
              </Button>
            </div>

            {/* Content Based on Active Tab */}
            {activeTab === 'meal-planner' && (
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">Meal Plans</CardTitle>
                    <Button size="sm" variant="ghost" onClick={() => setActiveTab('overview')}>
                      ← Back
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <KidsSchoolMealPlanner 
                    kidId={selectedKid.id}
                    kidName={selectedKid.name}
                    kidAge={getKidAge(selectedKid.birth_date || '')}
                    kidGender={selectedKid.gender || ''}
                  />
                </CardContent>
              </Card>
            )}

            {activeTab === 'calendar' && (
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">Calendar</CardTitle>
                    <Button size="sm" variant="ghost" onClick={() => setActiveTab('overview')}>
                      ← Back
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <PlanCalendar 
                    selectedChild={selectedKid}
                  />
                </CardContent>
              </Card>
            )}

            {activeTab === 'overview' && (
              <>
                {/* Today's Meals */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <ChefHat className="h-5 w-5 text-primary" />
                      Today's Meals
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 bg-primary/5 rounded-lg">
                        <div>
                          <p className="font-medium text-sm">Breakfast</p>
                          <p className="text-xs text-muted-foreground">Oatmeal with berries</p>
                        </div>
                        <CheckCircle className="h-5 w-5 text-primary" />
                      </div>
                      
                      <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                        <div>
                          <p className="font-medium text-sm">Lunch</p>
                          <p className="text-xs text-muted-foreground">Turkey sandwich</p>
                        </div>
                        <Clock className="h-5 w-5 text-muted-foreground" />
                      </div>
                      
                      <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                        <div>
                          <p className="font-medium text-sm">Dinner</p>
                          <p className="text-xs text-muted-foreground">Grilled chicken & veggies</p>
                        </div>
                        <Clock className="h-5 w-5 text-muted-foreground" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Quick Stats */}
                <div className="grid grid-cols-3 gap-3">
                  <Card>
                    <CardContent className="p-3 text-center">
                      <Trophy className="h-5 w-5 text-primary mx-auto mb-1" />
                      <p className="text-xs text-muted-foreground">Streak</p>
                      <p className="font-bold">5 days</p>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="p-3 text-center">
                      <Star className="h-5 w-5 text-primary mx-auto mb-1" />
                      <p className="text-xs text-muted-foreground">Points</p>
                      <p className="font-bold">240</p>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="p-3 text-center">
                      <Heart className="h-5 w-5 text-primary mx-auto mb-1" />
                      <p className="text-xs text-muted-foreground">Health</p>
                      <p className="font-bold">85%</p>
                    </CardContent>
                  </Card>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Kids;