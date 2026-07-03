import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../components/ui/dialog';
import { Skeleton } from '../components/ui/skeleton';
import {
  Search,
  Filter,
  ArrowUpDown,
  History,
  XCircle,
  Edit2,
  Calendar,
  AlertTriangle,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { toast } from 'sonner';

const editFormSchema = z.object({
  leaveType: z.enum(['ANNUAL', 'SICK', 'CASUAL', 'MATERNITY', 'PATERNITY', 'UNPAID']),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().min(1, 'End date is required'),
  reason: z.string().min(5, 'Reason must be at least 5 characters').max(200),
});

type EditFormValues = z.infer<typeof editFormSchema>;

export default function LeaveHistory() {
  const { user, updateUserBalance } = useAuth();
  const queryClient = useQueryClient();

  // Search, Filter & Pagination states
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [page, setPage] = useState(1);
  const limit = 5;

  // Dialog States
  const [cancelId, setCancelId] = useState<string | null>(null);
  const [editLeave, setEditLeave] = useState<any | null>(null);

  // Fetch Leaves History (React Query)
  const { data: responseData, isLoading } = useQuery({
    queryKey: ['leavesHistory', statusFilter, typeFilter, page],
    queryFn: async () => {
      const response = await api.get('/leaves', {
        params: {
          status: statusFilter || undefined,
          leaveType: typeFilter || undefined,
          page,
          limit,
        },
      });
      return response.data.data;
    },
  });

  const leaves = responseData?.leaves || [];
  const pagination = responseData?.pagination || { total: 0, totalPages: 1 };

  // Cancel Request Mutation
  const cancelMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await api.put(`/leaves/${id}/cancel`);
      return response.data.data;
    },
    onSuccess: (data) => {
      toast.success('Leave cancelled successfully');
      if (data.status === 'CANCELLED' && data.leaveType !== 'UNPAID') {
        updateUserBalance((user?.leaveBalance || 30) + data.totalDays);
      }
      queryClient.invalidateQueries({ queryKey: ['leavesHistory'] });
      setCancelId(null);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to cancel leave');
      setCancelId(null);
    },
  });

  // Edit Request Form Setup
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<EditFormValues>({
    resolver: zodResolver(editFormSchema),
  });

  const watchStartDate = watch('startDate');
  const watchEndDate = watch('endDate');
  const [calculatedDays, setCalculatedDays] = useState<number>(0);

  // Live workday calculator for Edit Dialog
  React.useEffect(() => {
    if (watchStartDate && watchEndDate) {
      const start = new Date(watchStartDate);
      const end = new Date(watchEndDate);
      if (start <= end && !isNaN(start.getTime()) && !isNaN(end.getTime())) {
        let count = 0;
        const curDate = new Date(start.getTime());
        curDate.setHours(0,0,0,0);
        const endCompare = new Date(end.getTime());
        endCompare.setHours(0,0,0,0);
        while (curDate <= endCompare) {
          const dayOfWeek = curDate.getDay();
          if (dayOfWeek !== 0 && dayOfWeek !== 6) count++;
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

  const handleEditClick = (leave: any) => {
    setEditLeave(leave);
    setValue('leaveType', leave.leaveType);
    setValue('startDate', new Date(leave.startDate).toISOString().split('T')[0]);
    setValue('endDate', new Date(leave.endDate).toISOString().split('T')[0]);
    setValue('reason', leave.reason);
  };

  // Edit Request Mutation
  const editMutation = useMutation({
    mutationFn: async (data: EditFormValues) => {
      const response = await api.put(`/leaves/${editLeave.id}`, data);
      return response.data.data;
    },
    onSuccess: () => {
      toast.success('Leave request updated successfully');
      queryClient.invalidateQueries({ queryKey: ['leavesHistory'] });
      setEditLeave(null);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to update leave');
    },
  });

  const onSubmitEdit = (data: EditFormValues) => {
    if (calculatedDays <= 0) {
      toast.error('Leave period must include at least one working day (Monday - Friday)');
      return;
    }
    if (data.leaveType !== 'UNPAID' && calculatedDays > (user?.leaveBalance || 30)) {
      toast.error('Insufficient leave balance');
      return;
    }
    editMutation.mutate(data);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'APPROVED': return <Badge variant="success">Approved</Badge>;
      case 'PENDING': return <Badge variant="warning">Pending</Badge>;
      case 'REJECTED': return <Badge variant="destructive">Rejected</Badge>;
      default: return <Badge variant="outline">Cancelled</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Search and Filters panel */}
      <Card className="shadow-sm border border-slate-200/60 dark:border-slate-800/80">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5 text-primary" />
            My Leave Request Logs
          </CardTitle>
          <CardDescription>Search, filter, and modify your past or active leave requests.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 items-center">
            {/* Status Filter */}
            <div className="flex flex-col space-y-1 w-full sm:w-44">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Status</label>
              <select
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1.5 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring dark:bg-slate-900"
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              >
                <option value="">All Statuses</option>
                <option value="PENDING">Pending</option>
                <option value="APPROVED">Approved</option>
                <option value="REJECTED">Rejected</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>

            {/* Leave Type Filter */}
            <div className="flex flex-col space-y-1 w-full sm:w-44">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Leave Type</label>
              <select
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1.5 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring dark:bg-slate-900"
                value={typeFilter}
                onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
              >
                <option value="">All Types</option>
                <option value="ANNUAL">Annual Leave</option>
                <option value="SICK">Sick Leave</option>
                <option value="CASUAL">Casual Leave</option>
                <option value="MATERNITY">Maternity Leave</option>
                <option value="PATERNITY">Paternity Leave</option>
                <option value="UNPAID">Unpaid Leave</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Leave Table List */}
      <Card className="shadow-sm border border-slate-200/60 dark:border-slate-800/80">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-4">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : leaves.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 text-center text-muted-foreground">
              <AlertTriangle className="h-10 w-10 text-muted/65 mb-3" />
              <p className="font-semibold text-slate-800 dark:text-slate-200 text-sm">No leave requests match your search criteria</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="bg-slate-50/50 dark:bg-slate-900/30 border-b border-slate-100 dark:border-slate-850 text-slate-400 dark:text-slate-550 text-xs font-semibold uppercase tracking-wider">
                      <th className="px-6 py-4">Leave Type</th>
                      <th className="px-6 py-4">Dates</th>
                      <th className="px-6 py-4">Duration</th>
                      <th className="px-6 py-4">Reason</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4">Manager Comment</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-850">
                    {leaves.map((leave: any) => (
                      <tr key={leave.id} className="hover:bg-slate-50/30 dark:hover:bg-slate-900/20">
                        <td className="px-6 py-4.5 font-medium">{leave.leaveType}</td>
                        <td className="px-6 py-4.5 text-xs text-muted-foreground">
                          {new Date(leave.startDate).toLocaleDateString()} - {new Date(leave.endDate).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4.5 font-bold text-slate-800 dark:text-slate-250">{leave.totalDays} Workdays</td>
                        <td className="px-6 py-4.5 max-w-xs truncate text-muted-foreground">{leave.reason}</td>
                        <td className="px-6 py-4.5">{getStatusBadge(leave.status)}</td>
                        <td className="px-6 py-4.5 text-xs italic text-muted-foreground">{leave.managerComment || '—'}</td>
                        <td className="px-6 py-4.5 text-right whitespace-nowrap space-x-1.5">
                          {leave.status === 'PENDING' && (
                            <>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="p-1 h-auto text-primary hover:bg-primary/10"
                                onClick={() => handleEditClick(leave)}
                              >
                                <Edit2 className="h-3.5 w-3.5" />
                              </Button>
                            </>
                          )}
                          {['PENDING', 'APPROVED'].includes(leave.status) && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-xs text-red-650 hover:bg-red-500/10 hover:text-red-750 p-1.5 h-auto font-medium"
                              onClick={() => setCancelId(leave.id)}
                            >
                              Cancel
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination controls */}
              <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 dark:border-slate-850">
                <span className="text-xs text-muted-foreground">
                  Showing page {page} of {pagination.totalPages} ({pagination.total} records total)
                </span>
                <div className="flex items-center space-x-2">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={page === 1}
                    onClick={() => setPage((p) => Math.max(p - 1, 1))}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={page === pagination.totalPages}
                    onClick={() => setPage((p) => Math.min(p + 1, pagination.totalPages))}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Edit Pending Leave Dialog */}
      <Dialog open={editLeave !== null} onOpenChange={(open) => !open && setEditLeave(null)}>
        <DialogHeader>
          <DialogTitle>Edit Pending Leave Request</DialogTitle>
          <DialogDescription>Change leave properties before review decisions.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmitEdit)} className="space-y-4 my-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase text-slate-500">Leave Type</label>
            <select
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1.5 text-sm dark:bg-slate-900"
              {...register('leaveType')}
            >
              <option value="ANNUAL">Annual Leave</option>
              <option value="SICK">Sick Leave</option>
              <option value="CASUAL">Casual Leave</option>
              <option value="MATERNITY">Maternity Leave</option>
              <option value="PATERNITY">Paternity Leave</option>
              <option value="UNPAID">Unpaid Leave</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase text-slate-500">Start Date</label>
              <Input type="date" {...register('startDate')} />
              {errors.startDate && <p className="text-xs text-red-500">{errors.startDate.message}</p>}
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase text-slate-500">End Date</label>
              <Input type="date" {...register('endDate')} />
              {errors.endDate && <p className="text-xs text-red-500">{errors.endDate.message}</p>}
            </div>
          </div>

          {calculatedDays > 0 && (
            <div className="p-2.5 bg-slate-100/50 dark:bg-slate-900/30 rounded text-xs font-medium flex justify-between items-center">
              <span>Recalculated Duration:</span>
              <span className="font-bold text-primary">{calculatedDays} Working Days</span>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase text-slate-500">Reason</label>
            <textarea
              className="flex min-h-[70px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm"
              {...register('reason')}
            />
            {errors.reason && <p className="text-xs text-red-500">{errors.reason.message}</p>}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setEditLeave(null)}>Back</Button>
            <Button type="submit" loading={editMutation.isPending}>Save Changes</Button>
          </DialogFooter>
        </form>
      </Dialog>

      {/* Cancel Dialog */}
      <Dialog open={cancelId !== null} onOpenChange={(open) => !open && setCancelId(null)}>
        <DialogHeader>
          <DialogTitle>Cancel Leave Request</DialogTitle>
          <DialogDescription>Are you sure you want to cancel this leave? Refund balances will be applied where applicable.</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setCancelId(null)}>Back</Button>
          <Button variant="destructive" onClick={() => cancelId && cancelMutation.mutate(cancelId)} loading={cancelMutation.isPending}>
            Yes, Cancel
          </Button>
        </DialogFooter>
      </Dialog>
    </div>
  );
}
