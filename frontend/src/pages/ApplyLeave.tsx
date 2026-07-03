import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { toast } from 'sonner';
import { CalendarRange, Info } from 'lucide-react';

const leaveFormSchema = z.object({
  leaveType: z.enum(['ANNUAL', 'SICK', 'CASUAL', 'MATERNITY', 'PATERNITY', 'UNPAID']),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().min(1, 'End date is required'),
  reason: z.string().min(5, 'Reason must be at least 5 characters').max(200, 'Reason must not exceed 200 characters'),
});

type LeaveFormValues = z.infer<typeof leaveFormSchema>;

export default function ApplyLeave() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [calculatedDays, setCalculatedDays] = useState<number>(0);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<LeaveFormValues>({
    resolver: zodResolver(leaveFormSchema),
    defaultValues: {
      leaveType: 'ANNUAL',
      startDate: '',
      endDate: '',
      reason: '',
    },
  });

  const watchStartDate = watch('startDate');
  const watchEndDate = watch('endDate');
  const watchLeaveType = watch('leaveType');

  // Live workday duration calculation
  useEffect(() => {
    if (watchStartDate && watchEndDate) {
      const start = new Date(watchStartDate);
      const end = new Date(watchEndDate);
      if (start <= end && !isNaN(start.getTime()) && !isNaN(end.getTime())) {
        // Calculate business days
        let count = 0;
        const curDate = new Date(start.getTime());
        curDate.setHours(0, 0, 0, 0);
        const endCompare = new Date(end.getTime());
        endCompare.setHours(0, 0, 0, 0);

        while (curDate <= endCompare) {
          const dayOfWeek = curDate.getDay();
          if (dayOfWeek !== 0 && dayOfWeek !== 6) {
            count++;
          }
          curDate.setDate(curDate.getDate() + 1);
        }
        setCalculatedDays(count);
      } else {
        setCalculatedDays(0);
      }
    } else {
      setCalculatedDays(0);
    }
  }, [watchStartDate, watchEndDate]);

  // Apply Leave Mutation
  const applyMutation = useMutation({
    mutationFn: async (data: LeaveFormValues) => {
      const response = await api.post('/leaves', data);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Leave application submitted successfully!');
      queryClient.invalidateQueries({ queryKey: ['myLeaves'] });
      navigate('/dashboard');
    },
    onError: (err: any) => {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to submit leave request');
    },
  });

  const onSubmit = (data: LeaveFormValues) => {
    if (calculatedDays <= 0) {
      toast.error('Leave period must include at least one working day (Monday - Friday)');
      return;
    }

    if (watchLeaveType !== 'UNPAID' && calculatedDays > (user?.leaveBalance || 0)) {
      toast.error(`Insufficient leave balance. You have ${user?.leaveBalance} days remaining.`);
      return;
    }

    applyMutation.mutate(data);
  };

  return (
    <div className="max-w-xl mx-auto py-4 animate-fadeIn">
      <Card className="shadow-lg border border-slate-200/60 dark:border-slate-800/80 glass">
        <div className="h-1 bg-gradient-to-r from-primary to-purple-500"></div>
        <CardHeader className="space-y-1">
          <CardTitle className="text-xl font-bold flex items-center gap-2">
            <CalendarRange className="h-5 w-5 text-primary" />
            Apply for Leave
          </CardTitle>
          <CardDescription>
            Submit a new leave request. Weekends are automatically excluded from the duration.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Quick Balance Info */}
          <div className="flex items-start p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-lg text-indigo-700 dark:text-indigo-400 gap-2.5 text-xs">
            <Info className="h-4.5 w-4.5 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-semibold">Your Leave Balance: {user?.leaveBalance} Days</p>
              <p className="mt-0.5">Unpaid leaves do not consume your balance. All approved paid leaves are deducted immediately upon manager approval.</p>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase text-slate-500">Leave Type</label>
              <select
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1.5 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring dark:bg-slate-900"
                disabled={applyMutation.isPending}
                {...register('leaveType')}
              >
                <option value="ANNUAL">Annual Leave (Paid)</option>
                <option value="SICK">Sick Leave (Paid)</option>
                <option value="CASUAL">Casual Leave (Paid)</option>
                <option value="MATERNITY">Maternity Leave (Paid)</option>
                <option value="PATERNITY">Paternity Leave (Paid)</option>
                <option value="UNPAID">Unpaid Leave</option>
              </select>
              {errors.leaveType && (
                <p className="text-xs text-red-500 font-medium">{errors.leaveType.message}</p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase text-slate-500">Start Date</label>
                <Input
                  type="date"
                  className={errors.startDate ? 'border-red-500' : 'border-slate-200 dark:border-slate-800'}
                  disabled={applyMutation.isPending}
                  {...register('startDate')}
                />
                {errors.startDate && (
                  <p className="text-xs text-red-500 font-medium">{errors.startDate.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase text-slate-500">End Date</label>
                <Input
                  type="date"
                  className={errors.endDate ? 'border-red-500' : 'border-slate-200 dark:border-slate-800'}
                  disabled={applyMutation.isPending}
                  {...register('endDate')}
                />
                {errors.endDate && (
                  <p className="text-xs text-red-500 font-medium">{errors.endDate.message}</p>
                )}
              </div>
            </div>

            {/* Calculated workdays display */}
            {calculatedDays > 0 && (
              <div className="p-3 bg-slate-100/50 dark:bg-slate-900/30 rounded-lg text-slate-800 dark:text-slate-350 text-xs font-medium flex justify-between items-center">
                <span>Calculated Leave Duration:</span>
                <span className="text-sm font-bold text-primary">{calculatedDays} Working Days</span>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase text-slate-500">Reason / Description</label>
              <textarea
                placeholder="Brief description of why you are requesting leave..."
                className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                disabled={applyMutation.isPending}
                {...register('reason')}
              />
              {errors.reason && (
                <p className="text-xs text-red-500 font-medium">{errors.reason.message}</p>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate(-1)}
                disabled={applyMutation.isPending}
              >
                Cancel
              </Button>
              <Button type="submit" loading={applyMutation.isPending}>
                Submit Request
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
