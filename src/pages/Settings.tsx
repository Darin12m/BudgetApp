"use client";

import React, { useState, useEffect } from 'react';
import { Sun, Moon, DollarSign, Key, User, LogOut, ChevronRight, Palette, Zap } from 'lucide-react'; // Added Zap icon
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { toast } from 'sonner';
import BottomNavBar from '@/components/BottomNavBar';
import { useFinanceData } from '@/hooks/use-finance-data';
import { auth } from '@/lib/firebase';
import { signOut } from 'firebase/auth';

interface SettingsPageProps {
  userUid: string | null;
}

const SettingsPage: React.FC<SettingsPageProps> = ({ userUid }) => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [monthlyBudgetInput, setMonthlyBudgetInput] = useState<string>('');
  const [microInvestingEnabled, setMicroInvestingEnabled] = useState<boolean>(true);
  const [microInvestingPercentage, setMicroInvestingPercentage] = useState<string>('30');

  const { budgetSettings, updateDocument, loading: financeLoading } = useFinanceData(userUid);

  useEffect(() => {
    // Initialize dark mode state from localStorage or system preference
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      setIsDarkMode(true);
      document.documentElement.classList.add('dark');
    } else if (savedTheme === 'light') {
      setIsDarkMode(false);
      document.documentElement.classList.remove('dark');
    } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setIsDarkMode(true);
      document.documentElement.classList.add('dark');
    }
  }, []);

  useEffect(() => {
    if (budgetSettings && budgetSettings.id) {
      setMonthlyBudgetInput(budgetSettings.totalBudgeted?.toString() || '');
      setMicroInvestingEnabled(budgetSettings.microInvestingEnabled ?? true); // Default to true
      setMicroInvestingPercentage(budgetSettings.microInvestingPercentage?.toString() || '30');
    }
  }, [budgetSettings]);

  const toggleTheme = () => {
    setIsDarkMode(prev => {
      const newMode = !prev;
      if (newMode) {
        document.documentElement.classList.add('dark');
        localStorage.setItem('theme', 'dark');
      } else {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('theme', 'light');
      }
      return newMode;
    });
  };

  const handleSaveMonthlyBudget = async () => {
    if (!userUid || !budgetSettings?.id) {
      toast.error("User not authenticated or budget settings not loaded.");
      return;
    }
    const newBudget = parseFloat(monthlyBudgetInput);
    if (isNaN(newBudget) || newBudget <= 0) {
      toast.error("Please enter a valid positive number for the monthly budget.");
      return;
    }
    try {
      await updateDocument('budgetSettings', budgetSettings.id, { totalBudgeted: newBudget });
      toast.success("Monthly budget updated successfully!");
    } catch (error) {
      console.error("Error updating monthly budget:", error);
      toast.error("Failed to update monthly budget.");
    }
  };

  const handleSaveMicroInvestingSettings = async () => {
    if (!userUid || !budgetSettings?.id) {
      toast.error("User not authenticated or budget settings not loaded.");
      return;
    }
    const newPercentage = parseFloat(microInvestingPercentage);
    if (isNaN(newPercentage) || newPercentage < 0 || newPercentage > 100) {
      toast.error("Please enter a valid percentage between 0 and 100.");
      return;
    }
    try {
      await updateDocument('budgetSettings', budgetSettings.id, {
        microInvestingEnabled: microInvestingEnabled,
        microInvestingPercentage: newPercentage,
      });
      toast.success("Micro-investing settings updated successfully!");
    } catch (error) {
      console.error("Error updating micro-investing settings:", error);
      toast.error("Failed to update micro-investing settings.");
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      toast.success("Signed out successfully!");
      // Optionally redirect to a login page or home
      window.location.href = '/'; // Reloads the app, triggering anonymous sign-in
    } catch (error) {
      console.error("Error signing out:", error);
      toast.error("Failed to sign out.");
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground pb-20 sm:pb-0 animate-in fade-in duration-500">
      <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6 sm:space-y-8">
        <h1 className="text-2xl sm:text-3xl font-bold">Settings</h1>

        {/* Theme Settings */}
        <Card className="card-shadow border-none bg-card border border-border/50">
          <CardHeader>
            <CardTitle className="text-lg font-semibold flex items-center">
              <Palette className="w-5 h-5 mr-2 text-muted-foreground" /> Theme
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="dark-mode-toggle" className="flex items-center text-base">
                {isDarkMode ? <Moon className="w-4 h-4 mr-2" /> : <Sun className="w-4 h-4 mr-2" />}
                Dark Mode
              </Label>
              <Switch
                id="dark-mode-toggle"
                checked={isDarkMode}
                onCheckedChange={toggleTheme}
              />
            </div>
          </CardContent>
        </Card>

        {/* Budget Settings */}
        <Card className="card-shadow border-none bg-card border border-border/50">
          <CardHeader>
            <CardTitle className="text-lg font-semibold flex items-center">
              <DollarSign className="w-5 h-5 mr-2 text-muted-foreground" /> Budget
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="monthly-budget" className="text-base">Monthly Budget</Label>
              <Input
                id="monthly-budget"
                type="number"
                step="0.01"
                value={monthlyBudgetInput}
                onChange={(e) => setMonthlyBudgetInput(e.target.value)}
                placeholder="e.g., 3000.00"
                className="bg-muted/50 border-none focus-visible:ring-primary focus-visible:ring-offset-0"
              />
              <Button onClick={handleSaveMonthlyBudget} className="w-full bg-primary hover:bg-primary/90 dark:bg-primary dark:hover:bg-primary/90 text-primary-foreground">
                Save Monthly Budget
              </Button>
            </div>
            {/* Add other budget settings here, e.g., rollover toggle */}
          </CardContent>
        </Card>

        {/* Micro-Investing Settings */}
        <Card className="card-shadow border-none bg-card border border-border/50">
          <CardHeader>
            <CardTitle className="text-lg font-semibold flex items-center">
              <Zap className="w-5 h-5 mr-2 text-muted-foreground" /> Micro-Investing
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="micro-investing-toggle" className="flex items-center text-base">
                Enable Suggestions
              </Label>
              <Switch
                id="micro-investing-toggle"
                checked={microInvestingEnabled}
                onCheckedChange={setMicroInvestingEnabled}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="micro-investing-percentage" className="text-base">
                Suggestion Percentage (%)
              </Label>
              <Input
                id="micro-investing-percentage"
                type="number"
                step="1"
                min="0"
                max="100"
                value={microInvestingPercentage}
                onChange={(e) => setMicroInvestingPercentage(e.target.value)}
                placeholder="e.g., 30"
                className="bg-muted/50 border-none focus-visible:ring-primary focus-visible:ring-offset-0"
              />
              <Button onClick={handleSaveMicroInvestingSettings} className="w-full bg-primary hover:bg-primary/90 dark:bg-primary dark:hover:bg-primary/90 text-primary-foreground">
                Save Micro-Investing Settings
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Account Settings */}
        <Card className="card-shadow border-none bg-card border border-border/50">
          <CardHeader>
            <CardTitle className="text-lg font-semibold flex items-center">
              <User className="w-5 h-5 mr-2 text-muted-foreground" /> Account
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button variant="ghost" className="w-full justify-between text-base px-4 py-6 hover:bg-muted/50">
              Manage Profile <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </Button>
            <Separator />
            <Button variant="ghost" className="w-full justify-between text-base px-4 py-6 hover:bg-muted/50">
              Connected Accounts <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </Button>
            <Separator />
            <Button onClick={handleSignOut} variant="ghost" className="w-full justify-between text-base px-4 py-6 text-destructive hover:bg-destructive/10">
              <LogOut className="w-5 h-5 mr-2" /> Sign Out
            </Button>
          </CardContent>
        </Card>

        {/* API Integrations (Placeholder) */}
        <Card className="card-shadow border-none bg-card border border-border/50">
          <CardHeader>
            <CardTitle className="text-lg font-semibold flex items-center">
              <Key className="w-5 h-5 mr-2 text-muted-foreground" /> API Integrations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm">
              Manage connections to external services like banks, crypto exchanges, or other financial tools.
            </p>
            <Button variant="outline" className="mt-4 w-full bg-muted/50 hover:bg-muted">
              View Integrations
            </Button>
          </CardContent>
        </Card>
      </div>
      <BottomNavBar />
    </div>
  );
};

export default SettingsPage;