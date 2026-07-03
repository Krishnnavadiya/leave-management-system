import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../components/ui/dialog';
import { Skeleton } from '../components/ui/skeleton';
import {
  CheckSquare,
  ThumbsUp,
  ThumbsDown,
  Users,
  Search,
  CheckCircle,
  XCircle,
  FileText,
  CalendarRange,
  MessageSquare
} from 'lucide-react';
import { toast } from 'sonner';

export default function ManagerDashboard() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [reviewId, setReviewId] = useState<string | null>(null);
  const [reviewAction, setReviewAction] = useState<'approve' | 'reject' | null>(null);
  const [comment, setComment] = useState('');

  // 1. Fetch Leaves Statistics (all leaves in DB)
  const { data: allLeavesResponse, isLoading: statsLoading } = useQuery({
    queryKey: ['managerAllLeaves'],
    queryFn: async () => {
      const response = await api.get('/manager/leaves');
      return response.data.data;
    },
  });

  const allLeaves = allLeavesResponse?.leaves || [];
  const totalApproved = allLeaves.filter((l: any) => l.status === 'APPROVED').length;
  const totalRejected = allLeaves.filter((l: any) => l.status === 'REJECTED').length;

  // 2. Fetch Employee Count
  const { data: employeesResponse } = useQuery({
    queryKey: ['managerEmployeesList'],
    queryFn: async () => {
      const response = await api.get('/employees');
      return response.data.data;
    },
  });
  const employeeCount = employeesResponse?.employees?.length || 5;

  // 3. Fetch Pending Approvals (with filters)
  const { data: pendingResponse, isLoading: pendingLoading } = useQuery({
    queryKey: ['pendingLeaves', searchTerm],
    queryFn: async () => {
      const response = await api.get('/manager/pending-leaves', {
        params: { search: searchTerm || undefined },
      });
      return response.data.data;
    },
  });

  const pendingLeaves = pendingResponse?.leaves || [];

  // Mutations
  const approveMutation = useMutation({
    mutationFn: async ({ id, comment }: { id: string; comment?: string }) => {
      const response = await api.put(`/manager/leaves/${id}/approve`, { comment });
      return response.data.data;
    },
    onSuccess: () => {
      toast.success('Leave request approved successfully');
      queryClient.invalidateQueries({ queryKey: ['pendingLeaves'] });
      queryClient.invalidateQueries({ queryKey: ['managerAllLeaves'] });
      closeReviewModal();
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to approve leave request');
      closeReviewModal();
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async ({ id, comment }: { id: string; comment?: string }) => {
      const response = await api.put(`/manager/leaves/${id}/reject`, { comment });
      return response.data.data;
    },
    onSuccess: () => {
      toast.success('Leave request rejected successfully');
      queryClient.invalidateQueries({ queryKey: ['pendingLeaves'] });
      queryClient.invalidateQueries({ queryKey: ['managerAllLeaves'] });
      closeReviewModal();
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to reject leave request');
      closeReviewModal();
    },
  });

  const handleReviewClick = (id: string, action: 'approve' | 'reject') => {
    setReviewId(id);
    setReviewAction(action);
    setComment('');
  };

  const closeReviewModal = () => {
    setReviewId(null);
    setReviewAction(null);
    setComment('');
  };

  const submitReview = () => {
    if (!reviewId || !reviewAction) return;

    if (reviewAction === 'approve') {
      approveMutation.mutate({ id: reviewId, comment: comment || undefined });
    } else {
      rejectMutation.mutate({ id: reviewId, comment: comment || undefined });
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 to-indigo-950 text-white shadow-lg animate-fadeIn">
        <h2 className="text-2xl font-bold tracking-tight">Manager Administration</h2>
        <p className="text-slate-300 text-sm mt-1">
          Review leave applications, manage employee balances, and view compliance reports.
        </p>
      </div>

      {/* Cards stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-fadeIn animate-delay-100">
        <Card className="glass">
          <CardContent className="p-6 flex items-center space-x-4">
            <div className="p-3 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-xl">
              <CheckSquare className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium">Pending Reviews</p>
              <h3 className="text-2xl font-bold">{pendingLoading ? <Skeleton className="h-6 w-10 mt-1" /> : pendingLeaves.length}</h3>
            </div>
          </CardContent>
        </Card>

        <Card className="glass">
          <CardContent className="p-6 flex items-center space-x-4">
            <div className="p-3 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl">
              <ThumbsUp className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium">Approved Leaves</p>
              <h3 className="text-2xl font-bold">{statsLoading ? <Skeleton className="h-6 w-10 mt-1" /> : totalApproved}</h3>
            </div>
          </CardContent>
        </Card>

        <Card className="glass">
          <CardContent className="p-6 flex items-center space-x-4">
            <div className="p-3 bg-red-500/10 text-red-650 dark:text-red-400 rounded-xl">
              <ThumbsDown className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium">Rejected Leaves</p>
              <h3 className="text-2xl font-bold">{statsLoading ? <Skeleton className="h-6 w-10 mt-1" /> : totalRejected}</h3>
            </div>
          </CardContent>
        </Card>

        <Card className="glass">
          <CardContent className="p-6 flex items-center space-x-4">
            <div className="p-3 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-xl">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium">Active Employees</p>
              <h3 className="text-2xl font-bold">{employeeCount}</h3>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pending Applications Section */}
      <Card className="shadow-sm border border-slate-200/60 dark:border-slate-800/80 animate-fadeIn animate-delay-200">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-3 border-b border-slate-100 dark:border-slate-850">
          <div>
            <CardTitle>Pending Approvals Grid</CardTitle>
            <CardDescription>Decide on leaves submitted by your team members.</CardDescription>
          </div>
          {/* Search bar */}
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search employee..."
              className="pl-9 bg-slate-50/50 dark:bg-slate-900/30"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {pendingLoading ? (
            <div className="p-6 space-y-4">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : pendingLeaves.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 text-center text-muted-foreground">
              <CheckCircle className="h-10 w-10 text-emerald-500 mb-3" />
              <p className="font-semibold text-slate-800 dark:text-slate-200 text-sm">All caught up!</p>
              <p className="text-xs mt-1 max-w-[280px]">There are no pending leave applications awaiting your review.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="bg-slate-50/50 dark:bg-slate-900/30 border-b border-slate-100 dark:border-slate-850 text-slate-400 dark:text-slate-550 text-xs font-semibold uppercase tracking-wider">
                    <th className="px-6 py-4">Employee</th>
                    <th className="px-6 py-4">Leave Details</th>
                    <th className="px-6 py-4">Reason</th>
                    <th className="px-6 py-4">Balance</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-850">
                  {pendingLeaves.map((leave: any) => (
                    <tr key={leave.id} className="hover:bg-slate-50/30 dark:hover:bg-slate-900/20 transition-all duration-100">
                      <td className="px-6 py-4.5">
                        <div className="font-semibold text-slate-900 dark:text-white">{leave.employee?.name}</div>
                        <div className="text-xs text-muted-foreground">{leave.employee?.department}</div>
                      </td>
                      <td className="px-6 py-4.5">
                        <div className="flex items-center gap-1.5 font-medium">
                          <span>{leave.leaveType}</span>
                          <span className="text-slate-400">•</span>
                          <span className="text-xs text-primary font-semibold">{leave.totalDays} Days</span>
                        </div>
                        <div className="text-xs text-muted-foreground mt-0.5">
                          {new Date(leave.startDate).toLocaleDateString()} - {new Date(leave.endDate).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4.5 max-w-xs truncate text-muted-foreground" title={leave.reason}>
                        {leave.reason}
                      </td>
                      <td className="px-6 py-4.5 font-bold text-slate-800 dark:text-slate-350">
                        {leave.employee?.leaveBalance} Days left
                      </td>
                      <td className="px-6 py-4.5 text-right space-x-2 whitespace-nowrap">
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-emerald-500/30 text-emerald-600 hover:bg-emerald-500/10 hover:text-emerald-700"
                          onClick={() => handleReviewClick(leave.id, 'approve')}
                        >
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-red-500/30 text-red-650 hover:bg-red-500/10 hover:text-red-750"
                          onClick={() => handleReviewClick(leave.id, 'reject')}
                        >
                          Reject
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Review Modal with Comment Field */}
      <Dialog open={reviewId !== null} onOpenChange={(open) => !open && closeReviewModal()}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-primary" />
            Confirm Leave {reviewAction === 'approve' ? 'Approval' : 'Rejection'}
          </DialogTitle>
          <DialogDescription>
            Provide an optional feedback comment for the employee regarding this request.
          </DialogDescription>
        </DialogHeader>
        <div className="my-4">
          <label className="text-xs font-semibold uppercase text-slate-500 mb-1.5 block">
            Manager Comment
          </label>
          <Input
            placeholder={reviewAction === 'approve' ? 'Enjoy your leave!' : 'Please state reason...'}
            className="w-full"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={closeReviewModal}>
            Back
          </Button>
          <Button
            variant={reviewAction === 'approve' ? 'default' : 'destructive'}
            onClick={submitReview}
            loading={approveMutation.isPending || rejectMutation.isPending}
          >
            Confirm {reviewAction === 'approve' ? 'Approval' : 'Rejection'}
          </Button>
        </DialogFooter>
      </Dialog>
    </div>
  );
}
