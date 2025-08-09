import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import KidsRecipes from '@/components/KidsRecipes';
import PlanCalendar from '@/components/PlanCalendar';
import Layout from '@/components/Layout';
import { useUser } from '@/contexts/UserContext';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';
import { useNavigate } from 'react-router-dom';
import { useNutritionFacts } from '@/hooks/useNutritionFacts';
import KidsSchoolMealPlanner from '@/components/KidsSchoolMealPlanner';
import { 
  Baby, 
  ChefHat, 
  BookOpen, 
  Heart, 
  Users, 
  Calendar, 
  Trophy, 
  CheckCircle, 
  Clock, 
  Target, 
  Lightbulb, 
  User, 
  Play, 
  RefreshCw, 
  Search, 
  Plus,
  Activity,
  BarChart3,
  Settings,
  Eye,
  Download,
  Share2,
  Trash2,
  Star,
  Crown,
  Zap,
  TrendingUp,
  Award,
  AlertCircle,
  Loader2,
  Filter,
  Shield,
  Rocket,
  Sparkles,
  Bell
} from 'lucide-react';

type KidsProfile = Database['public']['Tables']['kids_profiles']['Row'];
type Family = Database['public']['Tables']['families']['Row'];

// Interactive Learning Components
const ColorHuntGame: React.FC<{ kidName: string }> = ({ kidName }) => {
  const [collectedColors, setCollectedColors] = useState<string[]>([]);
  const [currentStreak, setCurrentStreak] = useState(0);
  
  const colors = [
    { name: 'Red', color: 'bg-red-500', foods: ['Apples', 'Strawberries', 'Tomatoes', 'Red Peppers'], emoji: '🍎' },
    { name: 'Orange', color: 'bg-orange-500', foods: ['Oranges', 'Carrots', 'Sweet Potatoes', 'Pumpkin'], emoji: '🥕' },
    { name: 'Yellow', color: 'bg-yellow-500', foods: ['Bananas', 'Corn', 'Yellow Peppers', 'Lemons'], emoji: '🍌' },
    { name: 'Green', color: 'bg-green-500', foods: ['Broccoli', 'Spinach', 'Green Apples', 'Peas'], emoji: '🥦' },
    { name: 'Blue', color: 'bg-blue-500', foods: ['Blueberries', 'Blue Corn', 'Blue Potatoes'], emoji: '🫐' },
    { name: 'Purple', color: 'bg-purple-500', foods: ['Grapes', 'Eggplant', 'Purple Cabbage', 'Plums'], emoji: '🍇' }
  ];

  const toggleColor = (colorName: string) => {
    if (collectedColors.includes(colorName)) {
      setCollectedColors(collectedColors.filter(c => c !== colorName));
      setCurrentStreak(Math.max(0, currentStreak - 1));
    } else {
      setCollectedColors([...collectedColors, colorName]);
      setCurrentStreak(currentStreak + 1);
    }
  };

  const resetGame = () => {
    setCollectedColors([]);
    setCurrentStreak(0);
  };

  const isComplete = collectedColors.length === colors.length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-pink-800">Progress:</span>
          <Badge variant="outline" className="bg-pink-100 text-pink-700">
            {collectedColors.length}/{colors.length} colors
          </Badge>
        </div>
        <Button size="sm" variant="outline" onClick={resetGame} className="text-pink-700 border-pink-300">
          <RefreshCw className="h-3 w-3 mr-1" />
          Reset
        </Button>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {colors.map((color) => {
          const isCollected = collectedColors.includes(color.name);
          return (
            <div
              key={color.name}
              onClick={() => toggleColor(color.name)}
              className={`p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                isCollected 
                  ? 'border-pink-400 bg-pink-50 shadow-md transform scale-105' 
                  : 'border-gray-200 hover:border-pink-300 hover:bg-pink-25'
              }`}
            >
              <div className="text-center">
                <div className={`w-8 h-8 ${color.color} rounded-full mx-auto mb-2 flex items-center justify-center`}>
                  {isCollected && <CheckCircle className="h-4 w-4 text-white" />}
                </div>
                <div className="text-2xl mb-1">{color.emoji}</div>
                <div className="font-medium text-sm text-gray-800">{color.name}</div>
                <div className="text-xs text-gray-600 mt-1">
                  {color.foods.slice(0, 2).join(', ')}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {isComplete && (
        <div className="text-center p-4 bg-gradient-to-r from-pink-100 to-rose-100 rounded-lg border border-pink-200">
          <div className="text-4xl mb-2">🌈</div>
          <h3 className="font-bold text-pink-800 mb-1">Congratulations {kidName}!</h3>
          <p className="text-sm text-pink-700">You've collected all the rainbow colors! You're a nutrition superstar!</p>
        </div>
      )}
    </div>
  );
};

const JuniorChefActivity: React.FC<{ kidName: string; kidAge: number }> = ({ kidName, kidAge }) => {
  const [selectedRecipe, setSelectedRecipe] = useState<any>(null);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);

  const recipes = [
    {
      id: 1,
      name: 'Rainbow Fruit Kabobs',
      difficulty: 'Easy',
      time: '10 min',
      ageAppropriate: kidAge >= 3,
      ingredients: ['Strawberries', 'Orange slices', 'Pineapple', 'Grapes', 'Blueberries'],
      steps: [
        'Wash all fruits carefully',
        'Ask an adult to cut larger fruits',
        'Thread fruits onto skewers in rainbow order',
        'Arrange on a plate and enjoy!'
      ],
      emoji: '🌈',
      color: 'from-red-100 to-purple-100'
    },
    {
      id: 2,
      name: 'Veggie Face Sandwiches',
      difficulty: 'Easy',
      time: '15 min',
      ageAppropriate: kidAge >= 4,
      ingredients: ['Whole grain bread', 'Cream cheese', 'Cherry tomatoes', 'Cucumber', 'Carrots'],
      steps: [
        'Spread cream cheese on bread',
        'Use cherry tomatoes for eyes',
        'Make a cucumber smile',
        'Add carrot pieces for hair',
        'Create your funny face!'
      ],
      emoji: '😊',
      color: 'from-green-100 to-yellow-100'
    },
    {
      id: 3,
      name: 'Banana Smoothie Bowl',
      difficulty: 'Medium',
      time: '20 min',
      ageAppropriate: kidAge >= 5,
      ingredients: ['Frozen banana', 'Greek yogurt', 'Berries', 'Granola', 'Honey'],
      steps: [
        'Blend frozen banana with yogurt',
        'Pour into a bowl',
        'Add berries in patterns',
        'Sprinkle granola on top',
        'Drizzle with honey'
      ],
      emoji: '🍌',
      color: 'from-yellow-100 to-pink-100'
    }
  ];

  const toggleStep = (stepIndex: number) => {
    if (completedSteps.includes(stepIndex)) {
      setCompletedSteps(completedSteps.filter(s => s !== stepIndex));
    } else {
      setCompletedSteps([...completedSteps, stepIndex]);
    }
  };

  const resetRecipe = () => {
    setCompletedSteps([]);
  };

  if (selectedRecipe) {
    const isComplete = completedSteps.length === selectedRecipe.steps.length;
    
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Button 
            size="sm" 
            variant="outline" 
            onClick={() => setSelectedRecipe(null)}
            className="text-blue-700 border-blue-300"
          >
            ← Back to Recipes
          </Button>
          <Button 
            size="sm" 
            variant="outline" 
            onClick={resetRecipe}
            className="text-blue-700 border-blue-300"
          >
            <RefreshCw className="h-3 w-3 mr-1" />
            Reset
          </Button>
        </div>

        <div className={`p-4 bg-gradient-to-r ${selectedRecipe.color} rounded-lg border`}>
          <div className="flex items-center gap-3 mb-3">
            <div className="text-3xl">{selectedRecipe.emoji}</div>
            <div>
              <h3 className="font-bold text-lg">{selectedRecipe.name}</h3>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Clock className="h-3 w-3" />
                <span>{selectedRecipe.time}</span>
                <Badge variant="outline" className="text-xs">{selectedRecipe.difficulty}</Badge>
              </div>
            </div>
          </div>

          <div className="mb-4">
            <h4 className="font-semibold mb-2">Ingredients:</h4>
            <div className="flex flex-wrap gap-2">
              {selectedRecipe.ingredients.map((ingredient: string, index: number) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {ingredient}
                </Badge>
              ))}
            </div>
          </div>

          <div>
            <h4 className="font-semibold mb-2">Steps for {kidName}:</h4>
            <div className="space-y-2">
              {selectedRecipe.steps.map((step: string, index: number) => {
                const isCompleted = completedSteps.includes(index);
                return (
                  <div
                    key={index}
                    onClick={() => toggleStep(index)}
                    className={`p-3 rounded-lg border cursor-pointer transition-all duration-200 ${
                      isCompleted 
                        ? 'bg-green-50 border-green-300 text-green-800' 
                        : 'bg-white border-gray-200 hover:border-blue-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                        isCompleted ? 'bg-green-500 border-green-500' : 'border-gray-300'
                      }`}>
                        {isCompleted ? (
                          <CheckCircle className="h-4 w-4 text-white" />
                        ) : (
                          <span className="text-xs font-medium text-gray-500">{index + 1}</span>
                        )}
                      </div>
                      <span className={isCompleted ? 'line-through' : ''}>{step}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {isComplete && (
            <div className="mt-4 text-center p-4 bg-gradient-to-r from-green-100 to-emerald-100 rounded-lg border border-green-200">
              <div className="text-4xl mb-2">👨‍🍳</div>
              <h3 className="font-bold text-green-800 mb-1">Great job, Chef {kidName}!</h3>
              <p className="text-sm text-green-700">You've completed the recipe! Time to enjoy your healthy creation!</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {recipes.filter(recipe => recipe.ageAppropriate).map((recipe) => (
        <div
          key={recipe.id}
          onClick={() => setSelectedRecipe(recipe)}
          className={`p-4 bg-gradient-to-r ${recipe.color} rounded-lg border cursor-pointer hover:shadow-md transition-all duration-200 hover:scale-105`}
        >
          <div className="text-center">
            <div className="text-4xl mb-2">{recipe.emoji}</div>
            <h3 className="font-bold text-gray-800 mb-1">{recipe.name}</h3>
            <div className="flex items-center justify-center gap-2 text-sm text-gray-600 mb-2">
              <Clock className="h-3 w-3" />
              <span>{recipe.time}</span>
            </div>
            <Badge variant="outline" className="text-xs">{recipe.difficulty}</Badge>
          </div>
        </div>
      ))}
    </div>
  );
};

const FoodMemoryGame: React.FC<{ kidName: string }> = ({ kidName }) => {
  const [cards, setCards] = useState<any[]>([]);
  const [flippedCards, setFlippedCards] = useState<number[]>([]);
  const [matchedCards, setMatchedCards] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);

  const foodPairs = [
    { name: 'Apple', emoji: '🍎', color: 'bg-red-100' },
    { name: 'Banana', emoji: '🍌', color: 'bg-yellow-100' },
    { name: 'Carrot', emoji: '🥕', color: 'bg-orange-100' },
    { name: 'Broccoli', emoji: '🥦', color: 'bg-green-100' },
    { name: 'Grapes', emoji: '🍇', color: 'bg-purple-100' },
    { name: 'Orange', emoji: '🍊', color: 'bg-orange-100' }
  ];

  const initializeGame = () => {
    const shuffledCards = [...foodPairs, ...foodPairs]
      .map((card, index) => ({ ...card, id: index }))
      .sort(() => Math.random() - 0.5);
    
    setCards(shuffledCards);
    setFlippedCards([]);
    setMatchedCards([]);
    setMoves(0);
    setGameStarted(true);
  };

  const handleCardClick = (cardId: number) => {
    if (flippedCards.length === 2 || flippedCards.includes(cardId) || matchedCards.includes(cardId)) {
      return;
    }

    const newFlippedCards = [...flippedCards, cardId];
    setFlippedCards(newFlippedCards);

    if (newFlippedCards.length === 2) {
      setMoves(moves + 1);
      const [firstCard, secondCard] = newFlippedCards.map(id => cards.find(card => card.id === id));
      
      if (firstCard.name === secondCard.name) {
        setMatchedCards([...matchedCards, ...newFlippedCards]);
        setFlippedCards([]);
      } else {
        setTimeout(() => {
          setFlippedCards([]);
        }, 1000);
      }
    }
  };

  const isGameComplete = matchedCards.length === cards.length;

  if (!gameStarted) {
    return (
      <div className="text-center py-8">
        <div className="text-6xl mb-4">🧠</div>
        <h3 className="text-lg font-bold text-green-800 mb-2">Memory Challenge for {kidName}!</h3>
        <p className="text-green-700 mb-4">Match the healthy food pairs to win!</p>
        <Button onClick={initializeGame} className="bg-green-500 hover:bg-green-600 text-white">
          <Play className="h-4 w-4 mr-2" />
          Start Game
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Badge variant="outline" className="bg-green-100 text-green-700">
            Moves: {moves}
          </Badge>
          <Badge variant="outline" className="bg-blue-100 text-blue-700">
            Matches: {matchedCards.length / 2}/{foodPairs.length}
          </Badge>
        </div>
        <Button size="sm" variant="outline" onClick={initializeGame} className="text-green-700 border-green-300">
          <RefreshCw className="h-3 w-3 mr-1" />
          New Game
        </Button>
      </div>

      <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
        {cards.map((card) => {
          const isFlipped = flippedCards.includes(card.id) || matchedCards.includes(card.id);
          const isMatched = matchedCards.includes(card.id);
          
          return (
            <div
              key={card.id}
              onClick={() => handleCardClick(card.id)}
              className={`aspect-square p-4 rounded-lg border-2 cursor-pointer transition-all duration-300 ${
                isFlipped 
                  ? isMatched 
                    ? 'bg-green-100 border-green-400 shadow-md' 
                    : `${card.color} border-gray-400 shadow-md`
                  : 'bg-gray-100 border-gray-300 hover:border-green-300 hover:shadow-sm'
              }`}
            >
              <div className="h-full flex items-center justify-center">
                {isFlipped ? (
                  <div className="text-center">
                    <div className="text-3xl mb-1">{card.emoji}</div>
                    <div className="text-xs font-medium text-gray-700">{card.name}</div>
                  </div>
                ) : (
                  <div className="text-4xl">❓</div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {isGameComplete && (
        <div className="text-center p-4 bg-gradient-to-r from-green-100 to-emerald-100 rounded-lg border border-green-200">
          <div className="text-4xl mb-2">🎉</div>
          <h3 className="font-bold text-green-800 mb-1">Fantastic, {kidName}!</h3>
          <p className="text-sm text-green-700">You matched all the healthy foods in {moves} moves! Your memory is amazing!</p>
        </div>
      )}
    </div>
  );
};

const NutritionQuiz: React.FC<{ kidName: string; kidAge: number }> = ({ kidName, kidAge }) => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [quizCompleted, setQuizCompleted] = useState(false);

  const questions = [
    {
      question: "Which food helps you see better in the dark?",
      options: ["Carrots", "Cookies", "Candy", "Chips"],
      correct: "Carrots",
      explanation: "Carrots have vitamin A which helps your eyes work better!",
      emoji: "🥕"
    },
    {
      question: "What makes your bones and teeth strong?",
      options: ["Soda", "Milk", "Juice", "Water"],
      correct: "Milk",
      explanation: "Milk has calcium that builds strong bones and teeth!",
      emoji: "🥛"
    },
    {
      question: "Which food gives you energy to play?",
      options: ["Banana", "Ice cream", "Candy", "Chips"],
      correct: "Banana",
      explanation: "Bananas have natural sugars and nutrients for healthy energy!",
      emoji: "🍌"
    },
    {
      question: "What food helps your brain think better?",
      options: ["Blueberries", "Donuts", "Cookies", "Cake"],
      correct: "Blueberries",
      explanation: "Blueberries are brain food - they help you think and remember!",
      emoji: "🫐"
    },
    {
      question: "Which vegetable makes you strong like Popeye?",
      options: ["Spinach", "French fries", "Onions", "Lettuce"],
      correct: "Spinach",
      explanation: "Spinach has iron that helps make your muscles strong!",
      emoji: "🥬"
    }
  ].filter((_, index) => kidAge >= 4 || index < 3); // Simpler questions for younger kids

  const handleAnswer = (answer: string) => {
    setSelectedAnswer(answer);
    setShowResult(true);
    
    if (answer === questions[currentQuestion].correct) {
      setScore(score + 1);
    }
  };

  const nextQuestion = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
      setSelectedAnswer(null);
      setShowResult(false);
    } else {
      setQuizCompleted(true);
    }
  };

  const resetQuiz = () => {
    setCurrentQuestion(0);
    setScore(0);
    setSelectedAnswer(null);
    setShowResult(false);
    setQuizCompleted(false);
  };

  if (quizCompleted) {
    const percentage = Math.round((score / questions.length) * 100);
    return (
      <div className="text-center py-8">
        <div className="text-6xl mb-4">
          {percentage >= 80 ? '🏆' : percentage >= 60 ? '⭐' : '👍'}
        </div>
        <h3 className="text-xl font-bold text-purple-800 mb-2">
          Great job, {kidName}!
        </h3>
        <p className="text-purple-700 mb-4">
          You got {score} out of {questions.length} questions correct! ({percentage}%)
        </p>
        <div className="mb-4">
          {percentage >= 80 && (
            <p className="text-green-700 font-medium">You're a nutrition expert! 🌟</p>
          )}
          {percentage >= 60 && percentage < 80 && (
            <p className="text-blue-700 font-medium">Great knowledge about healthy foods! 👏</p>
          )}
          {percentage < 60 && (
            <p className="text-orange-700 font-medium">Keep learning about healthy foods! 📚</p>
          )}
        </div>
        <Button onClick={resetQuiz} className="bg-purple-500 hover:bg-purple-600 text-white">
          <RefreshCw className="h-4 w-4 mr-2" />
          Try Again
        </Button>
      </div>
    );
  }

  const question = questions[currentQuestion];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Badge variant="outline" className="bg-purple-100 text-purple-700">
          Question {currentQuestion + 1} of {questions.length}
        </Badge>
        <Badge variant="outline" className="bg-green-100 text-green-700">
          Score: {score}
        </Badge>
      </div>

      <div className="text-center p-6 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-200">
        <div className="text-6xl mb-4">{question.emoji}</div>
        <h3 className="text-lg font-bold text-purple-800 mb-4">{question.question}</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {question.options.map((option) => (
            <Button
              key={option}
              onClick={() => handleAnswer(option)}
              disabled={showResult}
              variant={
                showResult 
                  ? option === question.correct 
                    ? "default" 
                    : option === selectedAnswer 
                      ? "destructive" 
                      : "outline"
                  : "outline"
              }
              className={`p-4 h-auto ${
                showResult && option === question.correct 
                  ? "bg-green-500 hover:bg-green-600 text-white" 
                  : ""
              }`}
            >
              {option}
            </Button>
          ))}
        </div>

        {showResult && (
          <div className="mt-4 p-4 bg-white rounded-lg border">
            <div className="flex items-center justify-center gap-2 mb-2">
              {selectedAnswer === question.correct ? (
                <>
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span className="font-medium text-green-700">Correct!</span>
                </>
              ) : (
                <>
                  <AlertCircle className="h-5 w-5 text-red-500" />
                  <span className="font-medium text-red-700">Not quite right!</span>
                </>
              )}
            </div>
            <p className="text-sm text-gray-700 mb-3">{question.explanation}</p>
            <Button onClick={nextQuestion} className="bg-purple-500 hover:bg-purple-600 text-white">
              {currentQuestion < questions.length - 1 ? 'Next Question' : 'See Results'}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

// Auto-Updating Nutrition Facts Component
const AutoUpdatingNutritionFacts: React.FC<{ kidName: string; kidAge: number }> = ({ kidName, kidAge }) => {
  const { facts, loading, error, lastUpdated, refreshFacts } = useNutritionFacts(kidAge);

  const getCategoryColor = (category: string) => {
    const colors = {
      fruits: 'from-red-50 to-pink-50 border-red-200',
      vegetables: 'from-green-50 to-emerald-50 border-green-200',
      proteins: 'from-blue-50 to-indigo-50 border-blue-200',
      grains: 'from-yellow-50 to-orange-50 border-yellow-200',
      dairy: 'from-purple-50 to-pink-50 border-purple-200',
      general: 'from-gray-50 to-slate-50 border-gray-200'
    };
    return colors[category as keyof typeof colors] || colors.general;
  };

  const getCategoryTextColor = (category: string) => {
    const colors = {
      fruits: 'text-red-800',
      vegetables: 'text-green-800',
      proteins: 'text-blue-800',
      grains: 'text-yellow-800',
      dairy: 'text-purple-800',
      general: 'text-gray-800'
    };
    return colors[category as keyof typeof colors] || colors.general;
  };

  const formatLastUpdated = (date: Date | null) => {
    if (!date) return 'Never';
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    } else if (minutes > 0) {
      return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    } else {
      return 'Just now';
    }
  };

  return (
    <Card className="mt-6">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-lg">
              <Star className="h-4 w-4 text-white" />
            </div>
            <div>
              <CardTitle className="flex items-center gap-2">
                AI-Powered Fun Nutrition Facts
                <Badge variant="secondary" className="bg-gradient-to-r from-yellow-100 to-orange-100 text-yellow-800 border-yellow-200">
                  <Sparkles className="h-3 w-3 mr-1" />
                  Auto-Updates
                </Badge>
              </CardTitle>
              <CardDescription>
                Fresh, personalized nutrition facts for {kidName} • Updates every hour
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-right">
              <div className="text-xs text-gray-500">Last updated</div>
              <div className="text-xs font-medium text-gray-700">{formatLastUpdated(lastUpdated)}</div>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={refreshFacts}
              disabled={loading}
              className="text-yellow-700 border-yellow-300 hover:bg-yellow-50"
            >
              {loading ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <RefreshCw className="h-3 w-3" />
              )}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading && facts.length === 0 ? (
          <div className="flex items-center justify-center py-8">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-yellow-500" />
              <p className="text-gray-600">Loading fresh nutrition facts...</p>
            </div>
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <div className="text-4xl mb-2">⚠️</div>
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={refreshFacts} variant="outline" className="text-red-700 border-red-300">
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Auto-update indicator */}
            <div className="flex items-center justify-center gap-2 p-2 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg border border-yellow-200">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-xs font-medium text-yellow-800">
                  AI-generated facts • Next update in {60 - new Date().getMinutes()} minutes
                </span>
              </div>
            </div>

            {/* Facts Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {facts.map((fact, index) => (
                <div
                  key={fact.id}
                  className={`p-4 bg-gradient-to-r ${getCategoryColor(fact.category)} rounded-lg border-2 transition-all duration-200 hover:shadow-md hover:scale-105`}
                >
                  <div className="flex items-start gap-3">
                    <div className="text-2xl flex-shrink-0">{fact.emoji}</div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline" className="text-xs capitalize">
                          {fact.category}
                        </Badge>
                        <Badge variant="outline" className="text-xs bg-white/50">
                          Age {kidAge}
                        </Badge>
                      </div>
                      <p className={`text-sm font-medium ${getCategoryTextColor(fact.category)}`}>
                        <strong>Did you know?</strong> {fact.fact}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Loading indicator for refresh */}
            {loading && facts.length > 0 && (
              <div className="text-center py-2">
                <div className="flex items-center justify-center gap-2 text-yellow-600">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm">Updating facts...</span>
                </div>
              </div>
            )}

            {/* Fun interaction prompt */}
            <div className="text-center p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
              <div className="text-2xl mb-2">💡</div>
              <p className="text-sm text-blue-800">
                <strong>Hey {kidName}!</strong> Share these fun facts with your friends and family! 
                New facts will appear automatically every hour.
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

const Kids: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useUser();
  const { toast } = useToast();
  
  // State management
  const [activeTab, setActiveTab] = useState('overview');
  const [kidsProfiles, setKidsProfiles] = useState<KidsProfile[]>([]);
  const [selectedKid, setSelectedKid] = useState<KidsProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [userFamilyId, setUserFamilyId] = useState<string | null>(null);
  const [showAddKidDialog, setShowAddKidDialog] = useState(false);

  // Separate function to get user's family_id without affecting main profile
  const getUserFamilyId = async (userId: string): Promise<string | null> => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('family_id')
        .eq('user_id', userId)
        .single();
      
      if (error) {
        console.error('Error getting user family_id:', error);
        return null;
      }
      
      return data?.family_id || null;
    } catch (error) {
      console.error('Error getting user family_id:', error);
      return null;
    }
  };

  // Dedicated function to load kids profiles without affecting main profile
  const loadKidsProfilesDedicated = async () => {
    if (!user?.id) return;
    
    try {
      setLoading(true);
      
      // First, get the user's family_id separately
      const familyId = await getUserFamilyId(user.id);
      setUserFamilyId(familyId);
      
      if (!familyId) {
        setLoading(false);
        return;
      }
      
      // Then load kids profiles using the family_id
      const { data: kids, error } = await supabase
        .from('kids_profiles')
        .select('*')
        .eq('family_id', familyId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error loading kids profiles:', error);
      } else {
        setKidsProfiles(kids || []);
        // Auto-select first kid if available
        if (kids && kids.length > 0 && !selectedKid) {
          setSelectedKid(kids[0]);
        }
      }
    } catch (error) {
      console.error('Error loading kids profiles:', error);
    } finally {
      setLoading(false);
    }
  };

  // Load kids profiles on component mount
  useEffect(() => {
    if (user?.id) {
      loadKidsProfilesDedicated();
    }
  }, [user?.id]);

  // Helper to get kid's age
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

  // Helper to get kid's initials
  const getKidInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  // Navigate to profile page to add kid
  const handleAddKid = () => {
    navigate('/profile');
  };

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-yellow-50 to-red-50">
        <div className="container mx-auto px-4 py-8 space-y-8">
          {/* Professional Header */}
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="p-3 bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl shadow-lg">
                <Baby className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                  Kids Nutrition Zone
                </h1>
                <div className="flex items-center justify-center gap-2 mt-1">
                  <Badge variant="secondary" className="bg-orange-100 text-orange-700 border-orange-200">
                    <Crown className="h-3 w-3 mr-1" />
                    Premium Feature
                  </Badge>
                  <Badge variant="outline" className="border-green-200 text-green-700">
                    <Shield className="h-3 w-3 mr-1" />
                    Child-Safe
                  </Badge>
                </div>
              </div>
            </div>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Create personalized nutrition plans, track growth milestones, and discover age-appropriate recipes 
              designed specifically for your children's healthy development.
            </p>
          </div>

          {/* Kids Selection Section */}
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg">
                    <Users className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-xl text-gray-900">Your Children</CardTitle>
                    <CardDescription className="text-gray-600">
                      Select a child to view their personalized nutrition dashboard
                    </CardDescription>
                  </div>
                </div>
                <Button 
                  onClick={handleAddKid}
                  className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Child
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="flex flex-col items-center gap-3">
                    <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
                    <p className="text-gray-600">Loading children profiles...</p>
                  </div>
                </div>
              ) : kidsProfiles.length === 0 ? (
                <div className="text-center py-12">
                  <div className="p-4 bg-gradient-to-br from-orange-100 to-yellow-100 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                    <Baby className="h-10 w-10 text-orange-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">No Children Added Yet</h3>
                  <p className="text-gray-600 mb-6 max-w-md mx-auto">
                    Start by adding your children to create personalized nutrition plans and track their healthy growth journey.
                  </p>
                  <Button 
                    onClick={handleAddKid}
                    size="lg"
                    className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white shadow-lg hover:shadow-xl transition-all duration-200"
                  >
                    <Plus className="h-5 w-5 mr-2" />
                    Add Your First Child
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {kidsProfiles.map((kid) => (
                    <Card 
                      key={kid.id}
                      className={`cursor-pointer transition-all duration-300 hover:shadow-lg hover:-translate-y-1 ${
                        selectedKid?.id === kid.id 
                          ? 'ring-2 ring-orange-400 bg-gradient-to-br from-orange-50 to-yellow-50 shadow-lg border-orange-200' 
                          : 'hover:bg-gray-50 border-gray-200 bg-white'
                      }`}
                      onClick={() => setSelectedKid(kid)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <Avatar className={`h-12 w-12 ${selectedKid?.id === kid.id ? 'ring-2 ring-orange-300' : ''}`}>
                            <AvatarFallback className={`font-bold text-sm ${selectedKid?.id === kid.id ? 'bg-orange-200 text-orange-700' : 'bg-gradient-to-br from-blue-100 to-purple-100 text-blue-700'}`}>
                              {getKidInitials(kid.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <h3 className={`font-semibold truncate ${selectedKid?.id === kid.id ? 'text-orange-800' : 'text-gray-900'}`}>
                              {kid.name}
                            </h3>
                            <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                              <Badge variant="outline" className="text-xs">
                                {getKidAge(kid.birth_date)} years old
                              </Badge>
                              <Badge variant="outline" className="text-xs capitalize">
                                {kid.gender}
                              </Badge>
                            </div>
                          </div>
                          {selectedKid?.id === kid.id && (
                            <div className="flex items-center gap-1">
                              <CheckCircle className="h-5 w-5 text-orange-500" />
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Main Content - Only show if a kid is selected */}
          {selectedKid ? (
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
              {/* Professional Tab Navigation */}
              <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
                <CardContent className="p-6">
                  {/* Mobile/Tablet: Horizontal Scrollable Tabs */}
                  <div className="block xl:hidden">
                    <div className="overflow-x-auto scrollbar-hide">
                      <TabsList className="inline-flex h-16 items-center space-x-2 p-2 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl min-w-max shadow-inner">
                        <TabsTrigger 
                          value="overview" 
                          className="flex flex-col items-center gap-1 px-4 py-2 text-xs font-medium rounded-lg transition-all duration-300 hover:bg-white hover:shadow-md data-[state=active]:bg-gradient-to-br data-[state=active]:from-orange-500 data-[state=active]:to-red-500 data-[state=active]:text-white data-[state=active]:shadow-lg min-w-[80px] min-h-[52px]"
                        >
                          <BarChart3 className="h-4 w-4" />
                          <span>Overview</span>
                        </TabsTrigger>
                        <TabsTrigger 
                          value="meals" 
                          className="flex flex-col items-center gap-1 px-4 py-2 text-xs font-medium rounded-lg transition-all duration-300 hover:bg-white hover:shadow-md data-[state=active]:bg-gradient-to-br data-[state=active]:from-orange-500 data-[state=active]:to-red-500 data-[state=active]:text-white data-[state=active]:shadow-lg min-w-[80px] min-h-[52px]"
                        >
                          <ChefHat className="h-4 w-4" />
                          <span>Meals</span>
                        </TabsTrigger>
                        <TabsTrigger 
                          value="nutrition" 
                          className="flex flex-col items-center gap-1 px-4 py-2 text-xs font-medium rounded-lg transition-all duration-300 hover:bg-white hover:shadow-md data-[state=active]:bg-gradient-to-br data-[state=active]:from-green-500 data-[state=active]:to-emerald-500 data-[state=active]:text-white data-[state=active]:shadow-lg min-w-[80px] min-h-[52px]"
                        >
                          <Heart className="h-4 w-4" />
                          <span>Nutrition</span>
                        </TabsTrigger>
                        <TabsTrigger 
                          value="growth" 
                          className="flex flex-col items-center gap-1 px-4 py-2 text-xs font-medium rounded-lg transition-all duration-300 hover:bg-white hover:shadow-md data-[state=active]:bg-gradient-to-br data-[state=active]:from-blue-500 data-[state=active]:to-indigo-500 data-[state=active]:text-white data-[state=active]:shadow-lg min-w-[80px] min-h-[52px]"
                        >
                          <TrendingUp className="h-4 w-4" />
                          <span>Growth</span>
                        </TabsTrigger>
                        <TabsTrigger 
                          value="education" 
                          className="flex flex-col items-center gap-1 px-4 py-2 text-xs font-medium rounded-lg transition-all duration-300 hover:bg-white hover:shadow-md data-[state=active]:bg-gradient-to-br data-[state=active]:from-indigo-500 data-[state=active]:to-purple-500 data-[state=active]:text-white data-[state=active]:shadow-lg min-w-[80px] min-h-[52px]"
                        >
                          <BookOpen className="h-4 w-4" />
                          <span>Education</span>
                        </TabsTrigger>
                        <TabsTrigger 
                          value="calendar" 
                          className="flex flex-col items-center gap-1 px-4 py-2 text-xs font-medium rounded-lg transition-all duration-300 hover:bg-white hover:shadow-md data-[state=active]:bg-gradient-to-br data-[state=active]:from-purple-500 data-[state=active]:to-pink-500 data-[state=active]:text-white data-[state=active]:shadow-lg min-w-[80px] min-h-[52px]"
                        >
                          <Calendar className="h-4 w-4" />
                          <span>Calendar</span>
                        </TabsTrigger>
                      </TabsList>
                    </div>
                  </div>

                  {/* Desktop: Professional Grid Layout */}
                  <div className="hidden xl:block">
                    <TabsList className="grid w-full grid-cols-6 gap-2 p-2 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl shadow-inner">
                      <TabsTrigger 
                        value="overview" 
                        className="flex items-center gap-3 px-6 py-4 text-sm font-medium rounded-lg transition-all duration-300 hover:bg-white hover:shadow-md data-[state=active]:bg-gradient-to-br data-[state=active]:from-orange-500 data-[state=active]:to-red-500 data-[state=active]:text-white data-[state=active]:shadow-lg"
                      >
                        <BarChart3 className="h-5 w-5" />
                        <span>Overview</span>
                      </TabsTrigger>
                      <TabsTrigger 
                        value="meals" 
                        className="flex items-center gap-3 px-6 py-4 text-sm font-medium rounded-lg transition-all duration-300 hover:bg-white hover:shadow-md data-[state=active]:bg-gradient-to-br data-[state=active]:from-orange-500 data-[state=active]:to-red-500 data-[state=active]:text-white data-[state=active]:shadow-lg"
                      >
                        <ChefHat className="h-5 w-5" />
                        <span>Meals</span>
                      </TabsTrigger>
                      <TabsTrigger 
                        value="nutrition" 
                        className="flex items-center gap-3 px-6 py-4 text-sm font-medium rounded-lg transition-all duration-300 hover:bg-white hover:shadow-md data-[state=active]:bg-gradient-to-br data-[state=active]:from-green-500 data-[state=active]:to-emerald-500 data-[state=active]:text-white data-[state=active]:shadow-lg"
                      >
                        <Heart className="h-5 w-5" />
                        <span>Nutrition</span>
                      </TabsTrigger>
                      <TabsTrigger 
                        value="growth" 
                        className="flex items-center gap-3 px-6 py-4 text-sm font-medium rounded-lg transition-all duration-300 hover:bg-white hover:shadow-md data-[state=active]:bg-gradient-to-br data-[state=active]:from-blue-500 data-[state=active]:to-indigo-500 data-[state=active]:text-white data-[state=active]:shadow-lg"
                      >
                        <TrendingUp className="h-5 w-5" />
                        <span>Growth</span>
                      </TabsTrigger>
                      <TabsTrigger 
                        value="education" 
                        className="flex items-center gap-3 px-6 py-4 text-sm font-medium rounded-lg transition-all duration-300 hover:bg-white hover:shadow-md data-[state=active]:bg-gradient-to-br data-[state=active]:from-indigo-500 data-[state=active]:to-purple-500 data-[state=active]:text-white data-[state=active]:shadow-lg"
                      >
                        <BookOpen className="h-5 w-5" />
                        <span>Education</span>
                      </TabsTrigger>
                      <TabsTrigger 
                        value="calendar" 
                        className="flex items-center gap-3 px-6 py-4 text-sm font-medium rounded-lg transition-all duration-300 hover:bg-white hover:shadow-md data-[state=active]:bg-gradient-to-br data-[state=active]:from-purple-500 data-[state=active]:to-pink-500 data-[state=active]:text-white data-[state=active]:shadow-lg"
                      >
                        <Calendar className="h-5 w-5" />
                        <span>Calendar</span>
                      </TabsTrigger>
                    </TabsList>
                  </div>
                </CardContent>
              </Card>

              {/* Overview Tab */}
              <TabsContent value="overview" className="space-y-6">
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                  {/* Child Profile Card */}
                  <Card className="lg:col-span-1 bg-gradient-to-br from-orange-50 to-yellow-50 border-orange-200">
                    <CardHeader className="pb-4">
                      <div className="flex items-center gap-4">
                        <Avatar className="h-16 w-16 ring-4 ring-orange-200">
                          <AvatarFallback className="bg-gradient-to-br from-orange-200 to-yellow-200 text-orange-700 text-xl font-bold">
                            {getKidInitials(selectedKid.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <CardTitle className="text-xl text-orange-800">{selectedKid.name}</CardTitle>
                          <CardDescription className="text-orange-600">
                            {getKidAge(selectedKid.birth_date)} years old • {selectedKid.gender}
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="text-center p-3 bg-white/60 rounded-lg">
                          <div className="text-2xl font-bold text-orange-600">{selectedKid.height_cm || 42}"</div>
                          <div className="text-sm text-orange-700">Height</div>
                        </div>
                        <div className="text-center p-3 bg-white/60 rounded-lg">
                          <div className="text-2xl font-bold text-orange-600">{selectedKid.weight_kg || 35} lbs</div>
                          <div className="text-sm text-orange-700">Weight</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Trophy className="h-4 w-4 text-yellow-500" />
                        <span className="text-sm text-orange-700">Healthy Growth Range</span>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Quick Stats */}
                  <Card className="lg:col-span-2">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Activity className="h-5 w-5 text-blue-500" />
                        Nutrition Dashboard
                      </CardTitle>
                      <CardDescription>Today's nutrition progress and goals</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl">
                          <div className="text-2xl font-bold text-blue-600">85%</div>
                          <div className="text-sm text-blue-700">Daily Calories</div>
                          <Progress value={85} className="mt-2 h-2" />
                        </div>
                        <div className="text-center p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl">
                          <div className="text-2xl font-bold text-green-600">92%</div>
                          <div className="text-sm text-green-700">Protein Goal</div>
                          <Progress value={92} className="mt-2 h-2" />
                        </div>
                        <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl">
                          <div className="text-2xl font-bold text-purple-600">78%</div>
                          <div className="text-sm text-purple-700">Calcium</div>
                          <Progress value={78} className="mt-2 h-2" />
                        </div>
                        <div className="text-center p-4 bg-gradient-to-br from-yellow-50 to-orange-50 rounded-xl">
                          <div className="text-2xl font-bold text-yellow-600">5</div>
                          <div className="text-sm text-yellow-700">Servings Today</div>
                          <div className="text-xs text-yellow-600 mt-1">Fruits & Veggies</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Recent Activity */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Clock className="h-5 w-5 text-gray-500" />
                      Recent Activity
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                        <CheckCircle className="h-5 w-5 text-green-500" />
                        <div>
                          <div className="font-medium text-green-800">Completed breakfast goal</div>
                          <div className="text-sm text-green-600">Had a nutritious breakfast with whole grains</div>
                        </div>
                        <div className="text-xs text-green-500 ml-auto">2 hours ago</div>
                      </div>
                      <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                        <Star className="h-5 w-5 text-blue-500" />
                        <div>
                          <div className="font-medium text-blue-800">Tried new recipe</div>
                          <div className="text-sm text-blue-600">Enjoyed homemade veggie pasta</div>
                        </div>
                        <div className="text-xs text-blue-500 ml-auto">Yesterday</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Unified Meals & Recipes Tab */}
              <TabsContent value="meals" className="space-y-6">
                {/* AI Meal Planner Section */}
                <KidsSchoolMealPlanner 
                  kidId={selectedKid.id}
                  kidName={selectedKid.name}
                  kidAge={getKidAge(selectedKid.birth_date)}
                  kidGender={selectedKid.gender}
                />

                {/* Recipe Collection Section */}
                <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200 shadow-xl">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl shadow-lg">
                        <BookOpen className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-2xl text-green-800">
                          Recipe Collection & Ideas
                        </CardTitle>
                        <CardDescription className="text-green-700">
                          Browse age-appropriate recipes and get cooking inspiration for {selectedKid.name}
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mt-4">
                      <Badge className="bg-green-200 text-green-800">
                        <Target className="h-3 w-3 mr-1" />
                        Age {getKidAge(selectedKid.birth_date)}
                      </Badge>
                      <Badge variant="outline" className="border-blue-200 text-blue-700">
                        <Heart className="h-3 w-3 mr-1" />
                        Nutritious
                      </Badge>
                      <Badge variant="outline" className="border-purple-200 text-purple-700">
                        <Star className="h-3 w-3 mr-1" />
                        Kid-Friendly
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <KidsRecipes selectedChild={selectedKid} />
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Nutrition Tab */}
              <TabsContent value="nutrition" className="space-y-4">
                <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg">
                        <Heart className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-xl">Nutrition & Growth for {selectedKid.name}</CardTitle>
                        <CardDescription>
                          Track {selectedKid.name}'s growth and nutritional milestones
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pb-4">
                    {/* Growth Tracking Dashboard */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
                      {/* Growth Metrics */}
                      <Card className="lg:col-span-2">
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <Heart className="h-5 w-5 text-red-500" />
                            Growth Tracking Dashboard
                          </CardTitle>
                          <CardDescription>
                            Monitor {selectedKid.name}'s height, weight, and nutritional milestones
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="pb-4">
                          <div className="space-y-4">
                            {/* Current Stats */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                              <div className="text-center p-3 bg-blue-50 rounded-lg">
                                <div className="text-2xl font-bold text-blue-600">{selectedKid.height_cm || '42'}"</div>
                                <div className="text-sm text-blue-600">Height</div>
                                <div className="text-xs text-blue-500">+2" this month</div>
                              </div>
                              <div className="text-center p-3 bg-green-50 rounded-lg">
                                <div className="text-2xl font-bold text-green-600">{selectedKid.weight_kg || '35'} lbs</div>
                                <div className="text-sm text-green-600">Weight</div>
                                <div className="text-xs text-green-500">+1.5 lbs this month</div>
                              </div>
                              <div className="text-center p-3 bg-purple-50 rounded-lg">
                                <div className="text-2xl font-bold text-purple-600">85%</div>
                                <div className="text-sm text-purple-600">Growth Percentile</div>
                                <div className="text-xs text-purple-500">Above average</div>
                              </div>
                              <div className="text-center p-3 bg-orange-50 rounded-lg">
                                <div className="text-2xl font-bold text-orange-600">18.5</div>
                                <div className="text-sm text-orange-600">BMI</div>
                                <div className="text-xs text-orange-500">Healthy range</div>
                              </div>
                            </div>

                            {/* Growth Chart */}
                            <div className="space-y-3">
                              <h4 className="font-medium text-gray-900 text-sm">Growth Trend (Last 6 Months)</h4>
                              <div className="h-32 bg-gray-50 rounded-lg p-3">
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
                                          className="w-4 bg-blue-400 rounded-t"
                                          style={{ height: `${(data.height / 45) * 80}px` }}
                                        ></div>
                                        <div 
                                          className="w-4 bg-green-400 rounded-t"
                                          style={{ height: `${(data.weight / 40) * 80}px` }}
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
                        <CardContent className="pb-4">
                          <div className="space-y-3">
                            <div className="flex items-center space-x-3 p-2 bg-green-50 rounded-lg">
                              <CheckCircle className="h-5 w-5 text-green-500" />
                              <div>
                                <div className="font-semibold text-green-700">Height Milestone</div>
                                <div className="text-sm text-green-600">Reached 42 inches</div>
                              </div>
                            </div>
                            <div className="flex items-center space-x-3 p-2 bg-blue-50 rounded-lg">
                              <CheckCircle className="h-5 w-5 text-blue-500" />
                              <div>
                                <div className="font-semibold text-blue-700">Weight Milestone</div>
                                <div className="text-sm text-blue-600">Reached 35 pounds</div>
                              </div>
                            </div>
                            <div className="flex items-center space-x-3 p-2 bg-yellow-50 rounded-lg">
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
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
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
                        <CardContent className="pb-4">
                          <div className="space-y-3">
                            <div className="space-y-2">
                              <div className="flex justify-between items-center">
                                <span className="text-sm font-medium">Calories</span>
                                <span className="text-sm text-gray-600">1,200 / 1,400</span>
                              </div>
                              <Progress value={85} className="h-2" />
                            </div>
                            <div className="space-y-2">
                              <div className="flex justify-between items-center">
                                <span className="text-sm font-medium">Protein</span>
                                <span className="text-sm text-gray-600">45g / 50g</span>
                              </div>
                              <Progress value={90} className="h-2" />
                            </div>
                            <div className="space-y-2">
                              <div className="flex justify-between items-center">
                                <span className="text-sm font-medium">Calcium</span>
                                <span className="text-sm text-gray-600">800mg / 1,000mg</span>
                              </div>
                              <Progress value={80} className="h-2" />
                            </div>
                            <div className="space-y-2">
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
                        <CardContent className="pb-4">
                          <div className="space-y-3">
                            <div className="p-2 bg-amber-50 rounded-lg border-l-3 border-amber-400">
                              <h4 className="font-semibold text-amber-700">Increase Iron Intake</h4>
                              <p className="text-sm text-amber-600">Add more leafy greens and lean meats to support growth</p>
                            </div>
                            <div className="p-2 bg-blue-50 rounded-lg border-l-3 border-blue-400">
                              <h4 className="font-semibold text-blue-700">More Calcium-Rich Foods</h4>
                              <p className="text-sm text-blue-600">Include dairy products, fortified cereals, and green vegetables</p>
                            </div>
                            <div className="p-2 bg-green-50 rounded-lg border-l-3 border-green-400">
                              <h4 className="font-semibold text-green-700">Physical Activity</h4>
                              <p className="text-sm text-green-600">Encourage 60 minutes of active play daily</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Age-Based Nutrition Guide */}
                    <Card className="mt-6">
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
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg">
                            <h4 className="font-semibold text-blue-800 mb-2">Ages 2-3</h4>
                            <ul className="text-sm text-blue-700 space-y-1">
                              <li>• 1,000-1,400 calories/day</li>
                              <li>• 2 cups dairy</li>
                              <li>• 1 cup fruits</li>
                              <li>• 1 cup vegetables</li>
                            </ul>
                          </div>
                          <div className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg">
                            <h4 className="font-semibold text-green-800 mb-2">Ages 4-8</h4>
                            <ul className="text-sm text-green-700 space-y-1">
                              <li>• 1,400-2,000 calories/day</li>
                              <li>• 2.5 cups dairy</li>
                              <li>• 1.5 cups fruits</li>
                              <li>• 2 cups vegetables</li>
                            </ul>
                          </div>
                          <div className="p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg">
                            <h4 className="font-semibold text-purple-800 mb-2">Ages 9-13</h4>
                            <ul className="text-sm text-purple-700 space-y-1">
                              <li>• 1,800-2,600 calories/day</li>
                              <li>• 3 cups dairy</li>
                              <li>• 2 cups fruits</li>
                              <li>• 2.5 cups vegetables</li>
                            </ul>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Growth Tab */}
              <TabsContent value="growth" className="space-y-6">
                <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg">
                        <TrendingUp className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-xl">Growth Tracking for {selectedKid.name}</CardTitle>
                        <CardDescription>
                          Monitor growth milestones and developmental progress
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Growth Chart */}
                      <div className="space-y-4">
                        <h4 className="font-semibold text-gray-900">Growth Trend (Last 6 Months)</h4>
                        <div className="h-64 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6">
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
                                    className="w-8 bg-gradient-to-t from-blue-400 to-blue-500 rounded-t-lg shadow-sm"
                                    style={{ height: `${(data.height / 45) * 120}px` }}
                                  ></div>
                                  <div 
                                    className="w-8 bg-gradient-to-t from-green-400 to-green-500 rounded-t-lg shadow-sm"
                                    style={{ height: `${(data.weight / 40) * 120}px` }}
                                  ></div>
                                </div>
                                <span className="text-xs text-gray-600 font-medium">{data.month}</span>
                              </div>
                            ))}
                          </div>
                          <div className="flex justify-center space-x-6 mt-4">
                            <div className="flex items-center space-x-2">
                              <div className="w-4 h-4 bg-gradient-to-t from-blue-400 to-blue-500 rounded"></div>
                              <span className="text-sm text-gray-700 font-medium">Height</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <div className="w-4 h-4 bg-gradient-to-t from-green-400 to-green-500 rounded"></div>
                              <span className="text-sm text-gray-700 font-medium">Weight</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Growth Milestones */}
                      <div className="space-y-4">
                        <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                          <Trophy className="h-4 w-4 text-yellow-500" />
                          Growth Milestones
                        </h4>
                        <div className="space-y-3">
                          <div className="flex items-center space-x-3 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl">
                            <CheckCircle className="h-6 w-6 text-green-500" />
                            <div>
                              <div className="font-semibold text-green-800">Height Milestone</div>
                              <div className="text-sm text-green-600">Reached 42 inches</div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-3 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl">
                            <CheckCircle className="h-6 w-6 text-blue-500" />
                            <div>
                              <div className="font-semibold text-blue-800">Weight Milestone</div>
                              <div className="text-sm text-blue-600">Reached 35 pounds</div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-3 p-4 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl">
                            <Clock className="h-6 w-6 text-yellow-500" />
                            <div>
                              <div className="font-semibold text-yellow-800">Next Milestone</div>
                              <div className="text-sm text-yellow-600">44 inches (2 months)</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Education Tab */}
              <TabsContent value="education" className="space-y-6">
                <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-lg">
                        <BookOpen className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-xl">Nutrition Education for {selectedKid.name}</CardTitle>
                        <CardDescription>
                          Learn about healthy eating habits and nutrition tips for children
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Healthy Eating Tips */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <Lightbulb className="h-5 w-5 text-yellow-500" />
                            Healthy Eating Tips
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg">
                              <h4 className="font-semibold text-green-800 mb-2">Make it Fun!</h4>
                              <p className="text-sm text-green-700">Use colorful plates, fun shapes, and involve kids in cooking to make healthy eating enjoyable.</p>
                            </div>
                            <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg">
                              <h4 className="font-semibold text-blue-800 mb-2">Variety is Key</h4>
                              <p className="text-sm text-blue-700">Introduce new foods regularly and offer different colors and textures to expand their palate.</p>
                            </div>
                            <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg">
                              <h4 className="font-semibold text-purple-800 mb-2">Lead by Example</h4>
                              <p className="text-sm text-purple-700">Children learn by watching. Show them healthy eating habits through your own choices.</p>
                            </div>
                            <div className="p-4 bg-gradient-to-r from-orange-50 to-red-50 rounded-lg">
                              <h4 className="font-semibold text-orange-800 mb-2">Stay Hydrated</h4>
                              <p className="text-sm text-orange-700">Encourage water over sugary drinks. Make it fun with fruit-infused water or colorful cups.</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Food Groups Guide */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <Target className="h-5 w-5 text-green-500" />
                            Food Groups Guide
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            <div className="flex items-center gap-3 p-3 bg-red-50 rounded-lg">
                              <div className="w-8 h-8 bg-red-200 rounded-full flex items-center justify-center">
                                <span className="text-red-700 font-bold text-sm">F</span>
                              </div>
                              <div>
                                <h4 className="font-semibold text-red-800">Fruits</h4>
                                <p className="text-sm text-red-600">2-4 servings daily. Fresh, frozen, or dried.</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                              <div className="w-8 h-8 bg-green-200 rounded-full flex items-center justify-center">
                                <span className="text-green-700 font-bold text-sm">V</span>
                              </div>
                              <div>
                                <h4 className="font-semibold text-green-800">Vegetables</h4>
                                <p className="text-sm text-green-600">3-5 servings daily. All colors and types.</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3 p-3 bg-yellow-50 rounded-lg">
                              <div className="w-8 h-8 bg-yellow-200 rounded-full flex items-center justify-center">
                                <span className="text-yellow-700 font-bold text-sm">G</span>
                              </div>
                              <div>
                                <h4 className="font-semibold text-yellow-800">Grains</h4>
                                <p className="text-sm text-yellow-600">6-11 servings daily. Choose whole grains.</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                              <div className="w-8 h-8 bg-blue-200 rounded-full flex items-center justify-center">
                                <span className="text-blue-700 font-bold text-sm">P</span>
                              </div>
                              <div>
                                <h4 className="font-semibold text-blue-800">Protein</h4>
                                <p className="text-sm text-blue-600">2-3 servings daily. Meat, fish, beans, nuts.</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg">
                              <div className="w-8 h-8 bg-purple-200 rounded-full flex items-center justify-center">
                                <span className="text-purple-700 font-bold text-sm">D</span>
                              </div>
                              <div>
                                <h4 className="font-semibold text-purple-800">Dairy</h4>
                                <p className="text-sm text-purple-600">2-3 servings daily. Milk, cheese, yogurt.</p>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Interactive Learning Activities */}
                    <Card className="mt-6">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Play className="h-5 w-5 text-pink-500" />
                          Interactive Learning Activities
                        </CardTitle>
                        <CardDescription>
                          Fun, interactive games to teach kids about nutrition
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-6">
                          {/* Color Hunt Game */}
                          <Card className="bg-gradient-to-br from-pink-50 to-rose-50 border-pink-200">
                            <CardHeader className="pb-3">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <div className="p-2 bg-pink-500 rounded-lg">
                                    <Play className="h-4 w-4 text-white" />
                                  </div>
                                  <CardTitle className="text-lg text-pink-800">Rainbow Food Hunt</CardTitle>
                                </div>
                                <Badge className="bg-pink-200 text-pink-800">Interactive Game</Badge>
                              </div>
                              <CardDescription className="text-pink-700">
                                Help {selectedKid.name} collect all the colors of the rainbow by eating different colored foods!
                              </CardDescription>
                            </CardHeader>
                            <CardContent>
                              <ColorHuntGame kidName={selectedKid.name} />
                            </CardContent>
                          </Card>

                          {/* Junior Chef Activity */}
                          <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
                            <CardHeader className="pb-3">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <div className="p-2 bg-blue-500 rounded-lg">
                                    <ChefHat className="h-4 w-4 text-white" />
                                  </div>
                                  <CardTitle className="text-lg text-blue-800">Junior Chef Recipes</CardTitle>
                                </div>
                                <Badge className="bg-blue-200 text-blue-800">Cooking Activity</Badge>
                              </div>
                              <CardDescription className="text-blue-700">
                                Simple, kid-friendly recipes that {selectedKid.name} can help make!
                              </CardDescription>
                            </CardHeader>
                            <CardContent>
                              <JuniorChefActivity kidName={selectedKid.name} kidAge={getKidAge(selectedKid.birth_date)} />
                            </CardContent>
                          </Card>

                          {/* Food Memory Game */}
                          <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
                            <CardHeader className="pb-3">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <div className="p-2 bg-green-500 rounded-lg">
                                    <BookOpen className="h-4 w-4 text-white" />
                                  </div>
                                  <CardTitle className="text-lg text-green-800">Food Memory Match</CardTitle>
                                </div>
                                <Badge className="bg-green-200 text-green-800">Memory Game</Badge>
                              </div>
                              <CardDescription className="text-green-700">
                                Test {selectedKid.name}'s memory while learning about healthy foods!
                              </CardDescription>
                            </CardHeader>
                            <CardContent>
                              <FoodMemoryGame kidName={selectedKid.name} />
                            </CardContent>
                          </Card>

                          {/* Nutrition Quiz */}
                          <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
                            <CardHeader className="pb-3">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <div className="p-2 bg-purple-500 rounded-lg">
                                    <Lightbulb className="h-4 w-4 text-white" />
                                  </div>
                                  <CardTitle className="text-lg text-purple-800">Nutrition Quiz</CardTitle>
                                </div>
                                <Badge className="bg-purple-200 text-purple-800">Learning Quiz</Badge>
                              </div>
                              <CardDescription className="text-purple-700">
                                Fun questions to test {selectedKid.name}'s nutrition knowledge!
                              </CardDescription>
                            </CardHeader>
                            <CardContent>
                              <NutritionQuiz kidName={selectedKid.name} kidAge={getKidAge(selectedKid.birth_date)} />
                            </CardContent>
                          </Card>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Auto-Updating Nutrition Facts */}
                    <AutoUpdatingNutritionFacts kidName={selectedKid.name} kidAge={getKidAge(selectedKid.birth_date)} />
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Calendar Tab */}
              <TabsContent value="calendar" className="space-y-6">
                <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg">
                        <Calendar className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-xl">Meal Calendar for {selectedKid.name}</CardTitle>
                        <CardDescription>
                          Plan and schedule age-appropriate meals and snacks
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <PlanCalendar selectedChild={selectedKid} />
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          ) : (
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
              <CardContent className="text-center py-16">
                <div className="p-6 bg-gradient-to-br from-orange-100 to-yellow-100 rounded-full w-24 h-24 mx-auto mb-6 flex items-center justify-center">
                  <Baby className="h-12 w-12 text-orange-600" />
                </div>
                <h3 className="text-2xl font-semibold text-gray-900 mb-3">Select a Child</h3>
                <p className="text-gray-600 max-w-md mx-auto mb-6">
                  Choose a child from the list above to view their personalized nutrition dashboard, meal plans, and growth tracking.
                </p>
                <Button 
                  onClick={handleAddKid}
                  className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Your First Child
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Kids;