import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../components/ui/dialog';
import { Skeleton } from '../components/ui/skeleton';
import {
  Calendar,
  CheckCircle,
  Clock,
  XCircle,
  CalendarRange,
  Plus,
  ArrowRight,
  ShieldAlert,
  FileSpreadsheet
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { toast } from 'sonner';

export default function EmployeeDashboard() {
  const { user, updateUserBalance } = useAuth();
  const queryClient = useQueryClient();
  const [cancelTargetId, setCancelTargetId] = useState<string | null>(null);

  // Fetch My Leaves
  const { data: leavesResponse, isLoading: leavesLoading } = useQuery({
    queryKey: ['myLeaves'],
    queryFn: async () => {
      const response = await api.get('/leaves');
      return response.data.data;
    },
  });

  const leaves = leavesResponse?.leaves || [];

  // Calculate statistics
  const totalRequests = leaves.length;
  const approvedCount = leaves.filter((l: any) => l.status === 'APPROVED').length;
  const pendingCount = leaves.filter((l: any) => l.status === 'PENDING').length;
  const rejectedCount = leaves.filter((l: any) => l.status === 'REJECTED').length;

  // Chart data: Leave types distribution
  const leaveTypesMap = leaves
    .filter((l: any) => l.status === 'APPROVED')
    .reduce((acc: Record<string, number>, curr: any) => {
      acc[curr.leaveType] = (acc[curr.leaveType] || 0) + curr.totalDays;
      return acc;
    }, {});

  const chartData = Object.entries(leaveTypesMap).map(([name, value]) => ({
    name,
    value,
  }));

  const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#3b82f6', '#6b7280'];

  // Cancel Leave Mutation
  const cancelMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await api.put(`/leaves/${id}/cancel`);
      return response.data.data;
    },
    onSuccess: (data) => {
      toast.success('Leave request cancelled successfully');
      // If it was approved, refund leave balance in UI
      if (data.status === 'CANCELLED' && data.leaveType !== 'UNPAID') {
        const currentBalance = user?.leaveBalance || 30;
        updateUserBalance(currentBalance + data.totalDays);
      }
      queryClient.invalidateQueries({ queryKey: ['myLeaves'] });
      setCancelTargetId(null);
    },
    onError: (err: any) => {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to cancel leave request');
      setCancelTargetId(null);
    },
  });

  const handleCancelClick = (id: string) => {
    setCancelTargetId(id);
  };

  const confirmCancel = () => {
    if (cancelTargetId) {
      cancelMutation.mutate(cancelTargetId);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return <Badge variant="success">Approved</Badge>;
      case 'PENDING':
        return <Badge variant="warning">Pending</Badge>;
      case 'REJECTED':
        return <Badge variant="destructive">Rejected</Badge>;
      case 'CANCELLED':
      default:
        return <Badge variant="outline">Cancelled</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Profile Greeting */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white shadow-lg animate-fadeIn">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Hello, {user?.name}!</h2>
          <p className="text-indigo-100 text-sm mt-1">
            Department: {user?.department} | Role: Employee
          </p>
        </div>
        <div className="flex items-center space-x-3 bg-white/10 backdrop-blur-md px-4 py-2.5 rounded-xl border border-white/20">
          <Calendar className="h-5 w-5 text-indigo-200" />
          <div>
            <p className="text-[10px] text-indigo-200 font-semibold uppercase tracking-wider">Leave Balance</p>
            <p className="text-xl font-extrabold">{user?.leaveBalance} Days Left</p>
          </div>
        </div>
      </div>

      {/* Statistics Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-fadeIn animate-delay-100">
        <Card className="glass">
          <CardContent className="p-6 flex items-center space-x-4">
            <div className="p-3 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-xl">
              <CalendarRange className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium">Total Requests</p>
              <h3 className="text-2xl font-bold">{leavesLoading ? <Skeleton className="h-6 w-10 mt-1" /> : totalRequests}</h3>
            </div>
          </CardContent>
        </Card>

        <Card className="glass">
          <CardContent className="p-6 flex items-center space-x-4">
            <div className="p-3 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl">
              <CheckCircle className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium">Approved</p>
              <h3 className="text-2xl font-bold">{leavesLoading ? <Skeleton className="h-6 w-10 mt-1" /> : approvedCount}</h3>
            </div>
          </CardContent>
        </Card>

        <Card className="glass">
          <CardContent className="p-6 flex items-center space-x-4">
            <div className="p-3 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-xl">
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium">Pending</p>
              <h3 className="text-2xl font-bold">{leavesLoading ? <Skeleton className="h-6 w-10 mt-1" /> : pendingCount}</h3>
            </div>
          </CardContent>
        </Card>

        <Card className="glass">
          <CardContent className="p-6 flex items-center space-x-4">
            <div className="p-3 bg-red-500/10 text-red-650 dark:text-red-400 rounded-xl">
              <XCircle className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium">Rejected</p>
              <h3 className="text-2xl font-bold">{leavesLoading ? <Skeleton className="h-6 w-10 mt-1" /> : rejectedCount}</h3>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fadeIn animate-delay-200">
        
        {/* Recent Activity Card */}
        <Card className="lg:col-span-2 shadow-sm border border-slate-200/60 dark:border-slate-800/80">
          <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-850">
            <div>
              <CardTitle>Recent Leave Requests</CardTitle>
              <CardDescription>View status of your recent leave applications.</CardDescription>
            </div>
            <Link to="/apply">
              <Button size="sm" className="shadow-xs">
                <Plus className="h-4 w-4 mr-1.5" />
                New Application
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            {leavesLoading ? (
              <div className="p-6 space-y-4">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : leaves.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-12 text-center text-muted-foreground">
                <FileSpreadsheet className="h-10 w-10 text-muted/60 mb-3" />
                <p className="font-semibold text-slate-800 dark:text-slate-200 text-sm">No leave requests found</p>
                <p className="text-xs mt-1 max-w-[280px]">You have not applied for any leave yet. Click the button above to apply.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="bg-slate-50/50 dark:bg-slate-900/30 border-b border-slate-100 dark:border-slate-850 text-slate-400 dark:text-slate-550 text-xs font-semibold uppercase tracking-wider">
                      <th className="px-6 py-4">Leave Type</th>
                      <th className="px-6 py-4">Dates</th>
                      <th className="px-6 py-4">Duration</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-850">
                    {leaves.slice(0, 5).map((leave: any) => (
                      <tr key={leave.id} className="hover:bg-slate-50/30 dark:hover:bg-slate-900/20 transition-all duration-100">
                        <td className="px-6 py-4.5 font-medium">
                          {leave.leaveType}
                        </td>
                        <td className="px-6 py-4.5 text-xs text-muted-foreground">
                          {new Date(leave.startDate).toLocaleDateString()} - {new Date(leave.endDate).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4.5 font-semibold text-slate-800 dark:text-slate-250">
                          {leave.totalDays} Workdays
                        </td>
                        <td className="px-6 py-4.5">
                          {getStatusBadge(leave.status)}
                        </td>
                        <td className="px-6 py-4.5 text-right space-x-2">
                          <Link
                            to={`/details/${leave.id}`}
                            className="inline-flex items-center text-xs text-primary hover:underline font-semibold"
                          >
                            Details
                            <ArrowRight className="h-3.5 w-3.5 ml-0.5" />
                          </Link>
                          {['PENDING', 'APPROVED'].includes(leave.status) && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-xs text-red-650 hover:bg-red-500/10 hover:text-red-750 p-1.5 h-auto"
                              onClick={() => handleCancelClick(leave.id)}
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
            )}
          </CardContent>
        </Card>

        {/* Analytics Breakdown Card */}
        <Card className="shadow-sm border border-slate-200/60 dark:border-slate-800/80">
          <CardHeader>
            <CardTitle>Leave Breakdown</CardTitle>
            <CardDescription>Distribution of approved leave days by type.</CardDescription>
          </CardHeader>
          <CardContent className="h-64 flex flex-col justify-center items-center">
            {leavesLoading ? (
              <Skeleton className="h-40 w-40 rounded-full" />
            ) : chartData.length === 0 ? (
              <div className="flex flex-col items-center justify-center text-center text-muted-foreground p-6">
                <ShieldAlert className="h-8 w-8 text-muted/65 mb-2" />
                <p className="text-xs font-medium">No approved leaves to analyze</p>
                <p className="text-[10px] mt-1 max-w-[180px]">Once your manager approves a request, the analysis chart will display here.</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`${value} days`, 'Duration']} />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Confirmation Cancel Dialog */}
      <Dialog open={cancelTargetId !== null} onOpenChange={(open) => !open && setCancelTargetId(null)}>
        <DialogHeader>
          <DialogTitle>Confirm Cancellation</DialogTitle>
          <DialogDescription>
            Are you sure you want to cancel this leave request? If the leave is already approved, your leave balance will be refunded.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setCancelTargetId(null)}>
            Back
          </Button>
          <Button variant="destructive" onClick={confirmCancel} loading={cancelMutation.isPending}>
            Yes, Cancel Leave
          </Button>
        </DialogFooter>
      </Dialog>
    </div>
  );
}
