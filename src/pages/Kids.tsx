import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import KidsSchoolMealPlanner from '@/components/KidsSchoolMealPlanner';
import PlanCalendar from '@/components/PlanCalendar';
import Layout from '@/components/Layout';
import { useUser } from '@/contexts/UserContext';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';
import { useNavigate } from 'react-router-dom';
import { 
  ChefHat,
  Calendar,
  Plus,
  RefreshCw,
  Loader2,
  Settings,
  Crown,
  Sparkles,
  Users
} from 'lucide-react';

type KidsProfile = Database['public']['Tables']['kids_profiles']['Row'];

const Kids: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useUser();
  
  const [activeView, setActiveView] = useState<'meal-planner' | 'calendar'>('meal-planner');
  const [kidsProfiles, setKidsProfiles] = useState<KidsProfile[]>([]);
  const [selectedKid, setSelectedKid] = useState<KidsProfile | null>(null);
  const [loading, setLoading] = useState(true);

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
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        {/* Streamlined Header */}
        <div className="bg-gradient-to-r from-orange-50 to-yellow-50 border-orange-200 border rounded-xl p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl">
                <ChefHat className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-orange-800">Kids Zone - School Meal Plans</h1>
                <p className="text-orange-700">AI-powered meal planning for school days</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Badge className="bg-orange-200 text-orange-800">
                <Crown className="h-3 w-3 mr-1" />
                Premium Feature
              </Badge>
              <Button 
                onClick={handleAddKid} 
                size="sm"
                className="bg-orange-500 hover:bg-orange-600 text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Kid
              </Button>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
              <p className="text-slate-600 font-medium">Loading kids profiles...</p>
            </div>
          </div>
        ) : kidsProfiles.length === 0 ? (
          /* No Kids State */
          <Card className="border-0 shadow-lg bg-gradient-to-br from-orange-50 to-yellow-50">
            <CardContent className="text-center py-16">
              <div className="p-4 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl w-20 h-20 mx-auto mb-6 flex items-center justify-center shadow-lg">
                <ChefHat className="h-10 w-10 text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-3 text-slate-900">Start Your Kids' Meal Planning Journey!</h3>
              <p className="text-slate-600 mb-8 text-base max-w-md mx-auto">
                Add your kids to create personalized, school-friendly meal plans with USDA compliance and smart notifications.
              </p>
              <Button 
                onClick={handleAddKid}
                className="bg-gradient-to-r from-orange-500 to-red-500 text-white hover:from-orange-600 hover:to-red-600 px-8 py-3 shadow-lg"
                size="lg"
              >
                <Plus className="h-5 w-5 mr-2" />
                Add Your First Kid
              </Button>
            </CardContent>
          </Card>
        ) : (
          /* Main Content */
          <div className="space-y-6">
            {/* Kid Selection & View Toggle */}
            <div className="flex items-center justify-between gap-4 bg-white rounded-lg border p-4 shadow-sm">
              <div className="flex items-center gap-4">
                {kidsProfiles.length > 1 && (
                  <div className="flex items-center gap-3">
                    <label className="text-sm font-medium text-slate-700">Select Kid:</label>
                    <Select
                      value={selectedKid?.id || ''}
                      onValueChange={(value) => {
                        const selected = kidsProfiles.find(kid => kid.id === value);
                        if (selected) setSelectedKid(selected);
                      }}
                    >
                      <SelectTrigger className="w-48">
                        <SelectValue placeholder="Choose a kid" />
                      </SelectTrigger>
                      <SelectContent>
                        {kidsProfiles.map((kid) => (
                          <SelectItem key={kid.id} value={kid.id}>
                            {kid.name} (Age {getKidAge(kid.birth_date || '')})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                {selectedKid && (
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                      <Sparkles className="h-3 w-3 mr-1" />
                      {selectedKid.name}
                    </Badge>
                    <Badge variant="outline" className="text-slate-600">
                      Age {getKidAge(selectedKid.birth_date || '')}
                    </Badge>
                  </div>
                )}
              </div>
              
              {selectedKid && (
                <div className="flex items-center gap-2">
                  <Button
                    variant={activeView === 'meal-planner' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setActiveView('meal-planner')}
                    className={activeView === 'meal-planner' ? 'bg-orange-500 hover:bg-orange-600' : ''}
                  >
                    <ChefHat className="h-4 w-4 mr-2" />
                    Meal Planner
                  </Button>
                  <Button
                    variant={activeView === 'calendar' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setActiveView('calendar')}
                    className={activeView === 'calendar' ? 'bg-orange-500 hover:bg-orange-600' : ''}
                  >
                    <Calendar className="h-4 w-4 mr-2" />
                    Calendar
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate('/profile')}
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Settings
                  </Button>
                </div>
              )}
            </div>

            {/* Main Content Area */}
            {selectedKid && (
              <>
                {activeView === 'meal-planner' && (
                  <KidsSchoolMealPlanner 
                    kidId={selectedKid.id}
                    kidName={selectedKid.name}
                    kidAge={getKidAge(selectedKid.birth_date || '')}
                    kidGender={selectedKid.gender || ''}
                  />
                )}

                {activeView === 'calendar' && (
                  <Card className="border-0 shadow-lg">
                    <CardHeader className="bg-gradient-to-r from-slate-50 to-slate-100">
                      <CardTitle className="flex items-center gap-2 text-slate-900">
                        <Calendar className="h-5 w-5 text-slate-700" />
                        Meal Calendar for {selectedKid.name}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                      <PlanCalendar selectedChild={selectedKid} />
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Kids;