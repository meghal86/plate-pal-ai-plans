import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChefHat, Clock, Users, Calendar } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Meal {
  id: string;
  name: string;
  meal_type: string;
  scheduled_date: string;
  scheduled_time: string;
  assigned_cook?: string;
  ingredients: string[];
  notes?: string;
}

interface FamilyMember {
  id: string;
  user_id: string;
  profiles?: {
    full_name: string;
  };
}

interface CookAssignmentProps {
  familyId: string;
  familyMembers: FamilyMember[];
}

const CookAssignment = ({ familyId, familyMembers }: CookAssignmentProps) => {
  const [meals, setMeals] = useState<Meal[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadMeals();
  }, [familyId]);

  const loadMeals = async () => {
    try {
      // For now, we'll create mock data since the meals table needs proper integration
      const mockMeals: Meal[] = [
        {
          id: "1",
          name: "Lemon-Dill Salmon",
          meal_type: "dinner",
          scheduled_date: new Date().toISOString().split('T')[0],
          scheduled_time: "18:00",
          assigned_cook: undefined,
          ingredients: ["salmon", "lemon", "dill", "olive oil"],
          notes: "Cook for 20 minutes at 375°F"
        },
        {
          id: "2",
          name: "Mediterranean Breakfast Bowl",
          meal_type: "breakfast",
          scheduled_date: new Date(Date.now() + 86400000).toISOString().split('T')[0], // tomorrow
          scheduled_time: "08:00",
          assigned_cook: undefined,
          ingredients: ["eggs", "tomatoes", "feta cheese", "olives"],
          notes: "Serve with toast"
        },
        {
          id: "3",
          name: "Quinoa Power Lunch",
          meal_type: "lunch",
          scheduled_date: new Date().toISOString().split('T')[0],
          scheduled_time: "12:00",
          assigned_cook: undefined,
          ingredients: ["quinoa", "chickpeas", "spinach", "avocado"],
          notes: "Add lemon dressing"
        }
      ];

      setMeals(mockMeals);
    } catch (error) {
      console.error('Error loading meals:', error);
    } finally {
      setLoading(false);
    }
  };

  const assignCook = async (mealId: string, cookId: string) => {
    try {
      // Update the meal with assigned cook
      const updatedMeals = meals.map(meal => 
        meal.id === mealId ? { ...meal, assigned_cook: cookId } : meal
      );
      setMeals(updatedMeals);

      const assignedMember = familyMembers.find(member => member.user_id === cookId);
      const meal = meals.find(m => m.id === mealId);

      toast({
        title: "Cook Assigned",
        description: `${assignedMember?.profiles?.full_name || 'Member'} is now assigned to cook ${meal?.name}`,
      });

      // Here you would typically update the database
      // await supabase.from('meals').update({ assigned_cook: cookId }).eq('id', mealId);

    } catch (error) {
      console.error('Error assigning cook:', error);
      toast({
        title: "Error",
        description: "Failed to assign cook",
        variant: "destructive",
      });
    }
  };

  const getMealTypeColor = (mealType: string) => {
    switch (mealType.toLowerCase()) {
      case 'breakfast':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'lunch':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'dinner':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return 'Tomorrow';
    } else {
      return date.toLocaleDateString();
    }
  };

  if (loading) {
    return <div>Loading meals...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <ChefHat className="h-5 w-5 mr-2" />
          Cook Assignments
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {meals.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">
              No upcoming meals to assign. Add some meals to your plan!
            </p>
          ) : (
            meals.map((meal) => {
              const assignedMember = meal.assigned_cook 
                ? familyMembers.find(member => member.user_id === meal.assigned_cook)
                : null;

              return (
                <div key={meal.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">{meal.name}</h3>
                      <div className="flex items-center space-x-4 mt-2">
                        <Badge className={getMealTypeColor(meal.meal_type)}>
                          {meal.meal_type}
                        </Badge>
                        <div className="flex items-center text-sm text-muted-foreground">
                          <Calendar className="h-4 w-4 mr-1" />
                          {formatDate(meal.scheduled_date)}
                        </div>
                        <div className="flex items-center text-sm text-muted-foreground">
                          <Clock className="h-4 w-4 mr-1" />
                          {meal.scheduled_time}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      {assignedMember ? (
                        <div className="flex items-center">
                          <ChefHat className="h-4 w-4 mr-2 text-green-600" />
                          <span className="font-medium text-green-600">
                            {assignedMember.profiles?.full_name || 'Unknown'}
                          </span>
                          <Badge variant="outline" className="ml-2">Assigned</Badge>
                        </div>
                      ) : (
                        <div className="flex items-center">
                          <Users className="h-4 w-4 mr-2 text-muted-foreground" />
                          <span className="text-muted-foreground">No cook assigned</span>
                        </div>
                      )}
                    </div>

                    <Select onValueChange={(cookId) => assignCook(meal.id, cookId)}>
                      <SelectTrigger className="w-48">
                        <SelectValue placeholder="Assign cook" />
                      </SelectTrigger>
                      <SelectContent>
                        {familyMembers.map((member) => (
                          <SelectItem key={member.user_id} value={member.user_id}>
                            {member.profiles?.full_name || 'Unknown Member'}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {meal.ingredients && meal.ingredients.length > 0 && (
                    <div className="text-sm">
                      <span className="font-medium">Ingredients: </span>
                      <span className="text-muted-foreground">
                        {meal.ingredients.join(', ')}
                      </span>
                    </div>
                  )}

                  {meal.notes && (
                    <div className="text-sm">
                      <span className="font-medium">Notes: </span>
                      <span className="text-muted-foreground">{meal.notes}</span>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default CookAssignment;