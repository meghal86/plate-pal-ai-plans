
import { useState, useEffect } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CalendarDays, Utensils, Clock, Brain } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface PlanEvent {
  id: string;
  date: Date;
  meal: string;
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  description: string;
  calories?: number;
}

const PlanCalendar = () => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [planEvents, setPlanEvents] = useState<PlanEvent[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [parsing, setParsing] = useState(false);
  const { toast } = useToast();

  // Load uploaded files
  useEffect(() => {
    loadUploadedFiles();
  }, []);

  const loadUploadedFiles = async () => {
    try {
      const { data, error } = await supabase
        .from('uploaded_files')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUploadedFiles(data || []);
    } catch (error) {
      console.error('Error loading files:', error);
    }
  };

  const parseFileWithAI = async (fileUrl: string, fileName: string) => {
    setParsing(true);
    try {
      console.log('Parsing file with AI:', fileName);
      
      // Call edge function to parse the file
      const { data, error } = await supabase.functions.invoke('parse-nutrition-plan', {
        body: { fileUrl, fileName }
      });

      if (error) throw error;

      const parsedEvents = data.events || [];
      setPlanEvents(prev => [...prev, ...parsedEvents]);
      
      toast({
        title: "Plan parsed successfully",
        description: `Added ${parsedEvents.length} meal events to your calendar`,
      });
    } catch (error) {
      console.error('Error parsing file:', error);
      toast({
        title: "Parsing failed",
        description: "Could not parse the nutrition plan. Please try again.",
        variant: "destructive"
      });
    } finally {
      setParsing(false);
    }
  };

  // Get events for selected date
  const getEventsForDate = (date: Date) => {
    return planEvents.filter(event => 
      event.date.toDateString() === date.toDateString()
    );
  };

  // Get dates that have events
  const getDatesWithEvents = () => {
    return planEvents.map(event => event.date);
  };

  const getMealTypeColor = (mealType: string) => {
    switch (mealType) {
      case 'breakfast': return 'bg-yellow-100 text-yellow-800';
      case 'lunch': return 'bg-green-100 text-green-800';
      case 'dinner': return 'bg-blue-100 text-blue-800';
      case 'snack': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const selectedDateEvents = selectedDate ? getEventsForDate(selectedDate) : [];

  return (
    <div className="space-y-6">
      <Card className="bg-card border-border/50 shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center">
            <CalendarDays className="h-5 w-5 mr-2 text-primary" />
            Nutrition Plan Calendar
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Calendar */}
            <div>
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                className="rounded-md border"
                modifiers={{
                  hasEvents: getDatesWithEvents()
                }}
                modifiersStyles={{
                  hasEvents: { 
                    backgroundColor: 'var(--primary)', 
                    color: 'white',
                    fontWeight: 'bold'
                  }
                }}
              />
            </div>

            {/* Selected Date Events */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">
                {selectedDate ? selectedDate.toLocaleDateString() : 'Select a date'}
              </h3>
              
              {selectedDateEvents.length > 0 ? (
                <div className="space-y-3">
                  {selectedDateEvents.map(event => (
                    <div key={event.id} className="p-3 bg-secondary rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <Badge className={getMealTypeColor(event.mealType)}>
                          {event.mealType}
                        </Badge>
                        {event.calories && (
                          <span className="text-sm text-muted-foreground">
                            {event.calories} cal
                          </span>
                        )}
                      </div>
                      <h4 className="font-medium">{event.meal}</h4>
                      <p className="text-sm text-muted-foreground">{event.description}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Utensils className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No meals planned for this date</p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Uploaded Files & Parsing */}
      {uploadedFiles.length > 0 && (
        <Card className="bg-card border-border/50 shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Brain className="h-5 w-5 mr-2 text-primary" />
              Parse Uploaded Plans
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {uploadedFiles.map(file => (
                <div key={file.id} className="flex items-center justify-between p-3 bg-secondary rounded-lg">
                  <div>
                    <p className="font-medium">{file.filename}</p>
                    <p className="text-sm text-muted-foreground">
                      Uploaded {new Date(file.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <Button
                    onClick={() => parseFileWithAI(file.file_url, file.filename)}
                    disabled={parsing}
                    size="sm"
                  >
                    {parsing ? (
                      <>
                        <Clock className="h-4 w-4 mr-2 animate-spin" />
                        Parsing...
                      </>
                    ) : (
                      <>
                        <Brain className="h-4 w-4 mr-2" />
                        Parse with AI
                      </>
                    )}
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default PlanCalendar;
