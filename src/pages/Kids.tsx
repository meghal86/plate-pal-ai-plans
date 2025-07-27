import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Baby, ChefHat, BookOpen, Heart, Users, Calendar, Trophy, CheckCircle, Clock, Target, Lightbulb, User } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import KidsRecipes from '@/components/KidsRecipes';
import Layout from '@/components/Layout';

const Kids: React.FC = () => {
  return (
    <Layout>
      <div className="container mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center justify-center gap-3">
          <Baby className="h-8 w-8 text-orange-500" />
          Kids Zone
        </h1>
        <p className="text-gray-600 max-w-2xl mx-auto">
          A dedicated space for kid-friendly nutrition, recipes, and healthy eating habits
        </p>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="recipes" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 gap-1 p-1 bg-gray-100 rounded-lg">
          <TabsTrigger 
            value="recipes" 
            className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 px-3 py-3 sm:py-2 text-xs sm:text-sm font-medium rounded-md transition-all duration-200 hover:bg-white hover:shadow-sm data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-orange-600"
          >
            <ChefHat className="h-4 w-4 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Recipes</span>
            <span className="sm:hidden">Recipes</span>
          </TabsTrigger>
          <TabsTrigger 
            value="nutrition" 
            className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 px-3 py-3 sm:py-2 text-xs sm:text-sm font-medium rounded-md transition-all duration-200 hover:bg-white hover:shadow-sm data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-red-600"
          >
            <Heart className="h-4 w-4 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Nutrition</span>
            <span className="sm:hidden">Nutrition</span>
          </TabsTrigger>
          <TabsTrigger 
            value="education" 
            className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 px-3 py-3 sm:py-2 text-xs sm:text-sm font-medium rounded-md transition-all duration-200 hover:bg-white hover:shadow-sm data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-blue-600"
          >
            <BookOpen className="h-4 w-4 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Education</span>
            <span className="sm:hidden">Education</span>
          </TabsTrigger>
          <TabsTrigger 
            value="community" 
            className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 px-3 py-3 sm:py-2 text-xs sm:text-sm font-medium rounded-md transition-all duration-200 hover:bg-white hover:shadow-sm data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-green-600"
          >
            <Users className="h-4 w-4 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Community</span>
            <span className="sm:hidden">Community</span>
          </TabsTrigger>
        </TabsList>

        {/* Recipes Tab */}
        <TabsContent value="recipes" className="space-y-6">
          <KidsRecipes />
        </TabsContent>

        {/* Nutrition Tab */}
        <TabsContent value="nutrition" className="space-y-6">
          {/* Growth Tracking Dashboard */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Growth Metrics */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Heart className="h-5 w-5 text-red-500" />
                  Growth Tracking Dashboard
                </CardTitle>
                <CardDescription>
                  Monitor your child's height, weight, and nutritional milestones
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Current Stats */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">42"</div>
                      <div className="text-sm text-blue-600">Height</div>
                      <div className="text-xs text-blue-500">+2" this month</div>
                    </div>
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">35 lbs</div>
                      <div className="text-sm text-green-600">Weight</div>
                      <div className="text-xs text-green-500">+1.5 lbs this month</div>
                    </div>
                    <div className="text-center p-4 bg-purple-50 rounded-lg">
                      <div className="text-2xl font-bold text-purple-600">85%</div>
                      <div className="text-sm text-purple-600">Growth Percentile</div>
                      <div className="text-xs text-purple-500">Above average</div>
                    </div>
                    <div className="text-center p-4 bg-orange-50 rounded-lg">
                      <div className="text-2xl font-bold text-orange-600">18.5</div>
                      <div className="text-sm text-orange-600">BMI</div>
                      <div className="text-xs text-orange-500">Healthy range</div>
                    </div>
                  </div>

                  {/* Growth Chart */}
                  <div className="space-y-4">
                    <h4 className="font-semibold text-gray-900">Growth Trend (Last 6 Months)</h4>
                    <div className="h-48 bg-gray-50 rounded-lg p-4">
                      <div className="flex items-end justify-between h-full space-x-2">
                        {[
                          { month: 'Jan', height: 40, weight: 32 },
                          { month: 'Feb', height: 40.5, weight: 32.5 },
                          { month: 'Mar', height: 41, weight: 33 },
                          { month: 'Apr', height: 41.5, weight: 33.5 },
                          { month: 'May', height: 42, weight: 34 },
                          { month: 'Jun', height: 42, weight: 35 }
                        ].map((data, index) => (
                          <div key={data.month} className="flex flex-col items-center space-y-2">
                            <div className="flex flex-col items-center space-y-1">
                              <div 
                                className="w-6 bg-blue-400 rounded-t"
                                style={{ height: `${(data.height / 45) * 120}px` }}
                              ></div>
                              <div 
                                className="w-6 bg-green-400 rounded-t"
                                style={{ height: `${(data.weight / 40) * 120}px` }}
                              ></div>
                            </div>
                            <span className="text-xs text-gray-600">{data.month}</span>
                          </div>
                        ))}
                      </div>
                      <div className="flex justify-center space-x-4 mt-2">
                        <div className="flex items-center space-x-1">
                          <div className="w-3 h-3 bg-blue-400 rounded"></div>
                          <span className="text-xs text-gray-600">Height</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <div className="w-3 h-3 bg-green-400 rounded"></div>
                          <span className="text-xs text-gray-600">Weight</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Growth Milestones */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-yellow-500" />
                  Growth Milestones
                </CardTitle>
                <CardDescription>
                  Track developmental milestones
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <div>
                      <div className="font-semibold text-green-700">Height Milestone</div>
                      <div className="text-sm text-green-600">Reached 42 inches</div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
                    <CheckCircle className="h-5 w-5 text-blue-500" />
                    <div>
                      <div className="font-semibold text-blue-700">Weight Milestone</div>
                      <div className="text-sm text-blue-600">Reached 35 pounds</div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 p-3 bg-yellow-50 rounded-lg">
                    <Clock className="h-5 w-5 text-yellow-500" />
                    <div>
                      <div className="font-semibold text-yellow-700">Next Milestone</div>
                      <div className="text-sm text-yellow-600">44 inches (2 months)</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Nutrition Tracking */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Daily Nutrition Goals */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-indigo-500" />
                  Daily Nutrition Goals
                </CardTitle>
                <CardDescription>
                  Track daily nutritional intake
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Calories</span>
                      <span className="text-sm text-gray-600">1,200 / 1,400</span>
                    </div>
                    <Progress value={85} className="h-2" />
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Protein</span>
                      <span className="text-sm text-gray-600">45g / 50g</span>
                    </div>
                    <Progress value={90} className="h-2" />
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Calcium</span>
                      <span className="text-sm text-gray-600">800mg / 1,000mg</span>
                    </div>
                    <Progress value={80} className="h-2" />
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Iron</span>
                      <span className="text-sm text-gray-600">7mg / 10mg</span>
                    </div>
                    <Progress value={70} className="h-2" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Growth Recommendations */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lightbulb className="h-5 w-5 text-amber-500" />
                  Growth Recommendations
                </CardTitle>
                <CardDescription>
                  Personalized recommendations for optimal growth
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-3 bg-amber-50 rounded-lg border-l-4 border-amber-400">
                    <h4 className="font-semibold text-amber-700">Increase Iron Intake</h4>
                    <p className="text-sm text-amber-600">Add more leafy greens and lean meats to support growth</p>
                  </div>
                  <div className="p-3 bg-blue-50 rounded-lg border-l-4 border-blue-400">
                    <h4 className="font-semibold text-blue-700">More Calcium-Rich Foods</h4>
                    <p className="text-sm text-blue-600">Include dairy products, fortified cereals, and green vegetables</p>
                  </div>
                  <div className="p-3 bg-green-50 rounded-lg border-l-4 border-green-400">
                    <h4 className="font-semibold text-green-700">Physical Activity</h4>
                    <p className="text-sm text-green-600">Encourage 60 minutes of active play daily</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Age-Based Nutrition Guide */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Baby className="h-5 w-5 text-blue-500" />
                Age-Based Nutrition Guidelines
              </CardTitle>
              <CardDescription>
                Nutritional requirements for different age groups
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-semibold text-blue-700 flex items-center gap-2">
                    <Baby className="h-4 w-4" />
                    2-5 Years
                  </h4>
                  <div className="space-y-3">
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <div className="font-medium text-blue-700">Daily Calories</div>
                      <div className="text-sm text-blue-600">1,000-1,400 calories</div>
                    </div>
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <div className="font-medium text-blue-700">Protein</div>
                      <div className="text-sm text-blue-600">13-20 grams</div>
                    </div>
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <div className="font-medium text-blue-700">Calcium</div>
                      <div className="text-sm text-blue-600">700-1,000 mg</div>
                    </div>
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <div className="font-medium text-blue-700">Iron</div>
                      <div className="text-sm text-blue-600">7-10 mg</div>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <h4 className="font-semibold text-green-700 flex items-center gap-2">
                    <User className="h-4 w-4" />
                    6-12 Years
                  </h4>
                  <div className="space-y-3">
                    <div className="p-3 bg-green-50 rounded-lg">
                      <div className="font-medium text-green-700">Daily Calories</div>
                      <div className="text-sm text-green-600">1,400-2,200 calories</div>
                    </div>
                    <div className="p-3 bg-green-50 rounded-lg">
                      <div className="font-medium text-green-700">Protein</div>
                      <div className="text-sm text-green-600">19-34 grams</div>
                    </div>
                    <div className="p-3 bg-green-50 rounded-lg">
                      <div className="font-medium text-green-700">Calcium</div>
                      <div className="text-sm text-green-600">1,000-1,300 mg</div>
                    </div>
                    <div className="p-3 bg-green-50 rounded-lg">
                      <div className="font-medium text-green-700">Iron</div>
                      <div className="text-sm text-green-600">8-10 mg</div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Education Tab */}
        <TabsContent value="education" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Nutrition Games */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-green-500" />
                  Nutrition Games
                </CardTitle>
                <CardDescription>
                  Fun and educational games about healthy eating
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="text-center p-6 bg-gradient-to-r from-green-100 to-blue-100 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">Coming Soon</div>
                    <p className="text-sm text-green-600">Interactive games to learn about nutrition</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Learning Resources */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-indigo-500" />
                  Learning Resources
                </CardTitle>
                <CardDescription>
                  Educational content about healthy eating
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="text-center p-6 bg-gradient-to-r from-indigo-100 to-purple-100 rounded-lg">
                    <div className="text-2xl font-bold text-indigo-600">Coming Soon</div>
                    <p className="text-sm text-indigo-600">Videos, articles, and interactive content</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Community Tab */}
        <TabsContent value="community" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Parent Community */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-teal-500" />
                  Parent Community
                </CardTitle>
                <CardDescription>
                  Connect with other parents and share experiences
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="text-center p-6 bg-gradient-to-r from-teal-100 to-cyan-100 rounded-lg">
                    <div className="text-2xl font-bold text-teal-600">Coming Soon</div>
                    <p className="text-sm text-teal-600">Share recipes, tips, and experiences</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Expert Advice */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-orange-500" />
                  Expert Advice
                </CardTitle>
                <CardDescription>
                  Get advice from nutritionists and pediatricians
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="text-center p-6 bg-gradient-to-r from-orange-100 to-red-100 rounded-lg">
                    <div className="text-2xl font-bold text-orange-600">Coming Soon</div>
                    <p className="text-sm text-orange-600">Q&A sessions with nutrition experts</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
      </div>
    </Layout>
  );
};

export default Kids; 