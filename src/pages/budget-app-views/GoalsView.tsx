"use client";

import React, { memo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Target, Plus, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Goal } from '@/hooks/use-finance-data';
import { formatDate } from '@/lib/utils';
import { useTranslation } from 'react-i18next'; // Import useTranslation

interface GoalsViewProps {
  goals: Goal[];
  handleAddGoal: () => void;
  handleEditGoal: (goal: Goal) => void;
  handleDeleteGoal: (id: string) => void;
  handleOpenAddFunds: (goal: Goal) => void;
  formatCurrency: (value: number, options?: Intl.NumberFormatOptions) => string;
}

const GoalsView: React.FC<GoalsViewProps> = memo(({
  goals,
  handleAddGoal,
  handleEditGoal,
  handleDeleteGoal,
  handleOpenAddFunds,
  formatCurrency,
}) => {
  const { t } = useTranslation(); // Initialize useTranslation hook
  return (
    <div className="space-y-4 sm:space-y-6 pb-24 sm:pb-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <h2 className="text-xl sm:text-2xl font-bold text-foreground">{t("goals.title")}</h2>
        <Button onClick={handleAddGoal} className="flex items-center space-x-1 sm:space-x-2 px-3 sm:px-4 py-2 bg-primary dark:bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 dark:hover:bg-primary/90 transition-colors text-sm active:bg-primary/80">
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">{t("goals.newGoal")}</span>
          <span className="sm:hidden">{t("common.new")}</span>
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {goals.length > 0 ? (
          goals.map((goal) => {
            const percentage = (goal.current / goal.target) * 100;

            return (
              <div key={goal.id} className="bg-card rounded-xl sm:rounded-2xl p-5 sm:p-6 card-shadow animate-in fade-in slide-in-from-bottom-2 duration-300 border border-border/50 backdrop-blur-lg">
                <div className="flex items-center justify-between mb-4">
                  <Target className="w-7 h-7 sm:w-8 sm:h-8" style={{ color: goal.color }} />
                  <span className="text-sm font-medium text-muted-foreground">{Math.round(percentage)}%</span>
                </div>
                <h3 className="text-base sm:text-lg font-semibold text-foreground mb-3">{goal.name}</h3>
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">{t("goals.current")}</span>
                    <span className="font-semibold text-foreground">{formatCurrency(goal.current)}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">{t("goals.target")}</span>
                    <span className="font-semibold text-foreground">{formatCurrency(goal.target)}</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-3 overflow-hidden mt-3">
                    <div
                      className="h-full transition-all duration-500 rounded-full"
                      style={{
                        width: `${Math.min(percentage, 100)}%`,
                        backgroundColor: goal.color
                      }}
                    />
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    {formatCurrency(goal.target - goal.current)} {t("goals.toGo")} • {t("goals.due")} {formatDate(goal.targetDate, 'MMM dd, yyyy')}
                  </p>
                </div>
                <div className="flex gap-2 mt-4">
                  <Button onClick={() => handleOpenAddFunds(goal)} className="flex-1 bg-muted/50 hover:bg-muted text-foreground transition-transform hover:scale-[1.02] active:scale-98">
                    {t("goals.addFunds")}
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleEditGoal(goal)} className="h-10 w-10 text-muted-foreground hover:bg-muted/50">
                    <Edit className="h-4 w-4" />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-10 w-10 text-destructive hover:bg-destructive/10">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="bg-card text-foreground card-shadow border border-border/50">
                      <AlertDialogHeader>
                        <AlertDialogTitle>{t("common.areYouSure")}</AlertDialogTitle>
                        <AlertDialogDescription>
                          {t("goals.goalDeleteConfirmation", { goalName: goal.name })}
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel className="bg-muted/50 border-none hover:bg-muted">{t("common.cancel")}</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDeleteGoal(goal.id)} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">{t("common.delete")}</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            );
          })
        ) : (
          <div className="col-span-full bg-card rounded-xl sm:rounded-2xl p-6 text-center card-shadow border border-border/50 backdrop-blur-lg">
            <Target className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-lg font-semibold text-foreground">{t("goals.noGoalsSetup")}</p>
            <p className="text-sm mt-2 text-muted-foreground">{t("goals.createFirstGoalDescription")}</p>
            <Button onClick={handleAddGoal} className="mt-4 bg-primary dark:bg-primary hover:bg-primary/90 dark:hover:bg-primary/90 text-primary-foreground">
              {t("goals.createFirstGoal")}
            </Button>
          </div>
        )}
      </div>

      <div className="bg-card rounded-xl sm:rounded-2xl p-4 sm:p-6 card-shadow animate-in fade-in slide-in-from-bottom-2 duration-300 border border-border/50 backdrop-blur-lg">
        <h3 className="text-base sm:text-lg font-semibold text-foreground mb-4">{t("goals.goalProgressOverTime")}</h3>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={[
            { month: 'Apr', emergency: 5200, vacation: 800, laptop: 1100 },
            { month: 'May', emergency: 5600, vacation: 900, laptop: 1300 },
            { month: 'Jun', emergency: 5900, vacation: 950, laptop: 1450 },
            { month: 'Jul', emergency: 6100, vacation: 1000, laptop: 1500 },
            { month: 'Aug', emergency: 6250, vacation: 1050, laptop: 1550 },
            { month: 'Sep', emergency: 6400, vacation: 1150, laptop: 1600 },
            { month: 'Oct', emergency: 6500, vacation: 1200, laptop: 1650 },
          ]}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" style={{ fontSize: '12px' }} />
            <YAxis stroke="hsl(var(--muted-foreground))" style={{ fontSize: '12px' }} tickFormatter={(value) => formatCurrency(Number(value))} />
            <Tooltip
              contentStyle={{ backgroundColor: 'hsl(var(--tooltip-bg))', border: '1px solid hsl(var(--tooltip-border-color))', borderRadius: '8px', fontSize: '12px', color: 'hsl(var(--tooltip-text-color))' }}
              formatter={(value) => formatCurrency(Number(value))}
            />
            <Legend wrapperStyle={{ fontSize: '12px' }} />
            <Line type="monotone" dataKey="emergency" stroke="hsl(var(--emerald))" strokeWidth={2} name={t("goals.emergency")} dot={false} />
            <Line type="monotone" dataKey="vacation" stroke="hsl(var(--blue))" strokeWidth={2} name={t("goals.vacation")} dot={false} />
            <Line type="monotone" dataKey="laptop" stroke="hsl(var(--lilac))" strokeWidth={2} name={t("goals.laptop")} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
});

export default GoalsView;