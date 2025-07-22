import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ShoppingCart, Plus, Trash2, Users, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ShoppingItem {
  id: string;
  name: string;
  quantity: string;
  completed: boolean;
  added_by: string;
}

interface ShoppingListProps {
  familyId: string;
  listId?: string;
}

const SharedShoppingList = ({ familyId, listId }: ShoppingListProps) => {
  const [items, setItems] = useState<ShoppingItem[]>([]);
  const [newItemName, setNewItemName] = useState("");
  const [newItemQuantity, setNewItemQuantity] = useState("");
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadShoppingList();
  }, [listId]);

  const loadShoppingList = async () => {
    if (!listId) return;

    try {
      const { data, error } = await supabase
        .from('shopping_lists')
        .select('items')
        .eq('id', listId)
        .single();

      if (error) throw error;

      if (data?.items && Array.isArray(data.items)) {
        setItems(data.items as unknown as ShoppingItem[]);
      }
    } catch (error) {
      console.error('Error loading shopping list:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateShoppingList = async (newItems: ShoppingItem[]) => {
    if (!listId) return;

    try {
      const { error } = await supabase
        .from('shopping_lists')
        .update({ items: newItems as any })
        .eq('id', listId);

      if (error) throw error;

      setItems(newItems);
    } catch (error) {
      console.error('Error updating shopping list:', error);
      toast({
        title: "Error",
        description: "Failed to update shopping list",
        variant: "destructive",
      });
    }
  };

  const addItem = async () => {
    if (!newItemName.trim()) return;

    const newItem: ShoppingItem = {
      id: crypto.randomUUID(),
      name: newItemName,
      quantity: newItemQuantity || "1",
      completed: false,
      added_by: "current_user", // Replace with actual user ID
    };

    const updatedItems = [...items, newItem];
    await updateShoppingList(updatedItems);

    setNewItemName("");
    setNewItemQuantity("");

    toast({
      title: "Item Added",
      description: `${newItem.name} added to shopping list`,
    });
  };

  const toggleItem = async (itemId: string) => {
    const updatedItems = items.map(item =>
      item.id === itemId ? { ...item, completed: !item.completed } : item
    );
    await updateShoppingList(updatedItems);
  };

  const removeItem = async (itemId: string) => {
    const updatedItems = items.filter(item => item.id !== itemId);
    await updateShoppingList(updatedItems);

    toast({
      title: "Item Removed",
      description: "Item removed from shopping list",
    });
  };

  const completedCount = items.filter(item => item.completed).length;
  const totalCount = items.length;

  if (loading) {
    return <div>Loading shopping list...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center">
            <ShoppingCart className="h-5 w-5 mr-2" />
            Family Shopping List
          </span>
          <Badge variant="secondary">
            {completedCount}/{totalCount} completed
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Add New Item */}
        <div className="space-y-3">
          <div className="flex space-x-2">
            <Input
              placeholder="Item name"
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addItem()}
              className="flex-1"
            />
            <Input
              placeholder="Qty"
              value={newItemQuantity}
              onChange={(e) => setNewItemQuantity(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addItem()}
              className="w-20"
            />
            <Button onClick={addItem} size="icon">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <Separator />

        {/* Shopping Items */}
        <div className="space-y-2">
          {items.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">
              No items in the shopping list yet. Add some above!
            </p>
          ) : (
            <>
              {/* Incomplete Items */}
              <div className="space-y-2">
                {items
                  .filter(item => !item.completed)
                  .map((item) => (
                    <div key={item.id} className="flex items-center space-x-3 p-2 hover:bg-muted rounded-lg transition-colors">
                      <Checkbox
                        checked={item.completed}
                        onCheckedChange={() => toggleItem(item.id)}
                      />
                      <div className="flex-1">
                        <span className="font-medium">{item.name}</span>
                        <span className="text-muted-foreground ml-2">({item.quantity})</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeItem(item.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
              </div>

              {/* Completed Items */}
              {items.some(item => item.completed) && (
                <>
                  <Separator className="my-4" />
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-muted-foreground flex items-center">
                      <Check className="h-4 w-4 mr-1" />
                      Completed ({completedCount})
                    </h4>
                    {items
                      .filter(item => item.completed)
                      .map((item) => (
                        <div key={item.id} className="flex items-center space-x-3 p-2 opacity-60">
                          <Checkbox
                            checked={item.completed}
                            onCheckedChange={() => toggleItem(item.id)}
                          />
                          <div className="flex-1">
                            <span className="line-through">{item.name}</span>
                            <span className="text-muted-foreground ml-2">({item.quantity})</span>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeItem(item.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                  </div>
                </>
              )}
            </>
          )}
        </div>

        <Separator />

        {/* Quick Actions */}
        <div className="flex justify-between items-center text-sm text-muted-foreground">
          <span>Shared with family members</span>
          <Badge variant="outline" className="flex items-center">
            <Users className="h-3 w-3 mr-1" />
            Family List
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
};

export default SharedShoppingList;