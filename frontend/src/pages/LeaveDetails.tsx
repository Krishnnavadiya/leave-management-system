import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../services/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Skeleton } from '../components/ui/skeleton';
import { Calendar, User, FileText, ArrowLeft, Clock, CheckCircle2, XCircle } from 'lucide-react';

export default function LeaveDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data: leave, isLoading, error } = useQuery({
    queryKey: ['leaveDetails', id],
    queryFn: async () => {
      const response = await api.get(`/leaves/${id}`);
      return response.data.data;
    },
    enabled: !!id,
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'APPROVED': return <Badge variant="success">Approved</Badge>;
      case 'PENDING': return <Badge variant="warning">Pending Approval</Badge>;
      case 'REJECTED': return <Badge variant="destructive">Rejected</Badge>;
      default: return <Badge variant="outline">Cancelled</Badge>;
    }
  };

  const getTimelineIcon = (status: string) => {
    switch (status) {
      case 'APPROVED': return <CheckCircle2 className="h-5 w-5 text-emerald-500" />;
      case 'REJECTED': return <XCircle className="h-5 w-5 text-red-500" />;
      case 'PENDING': return <Clock className="h-5 w-5 text-amber-500" />;
      default: return <XCircle className="h-5 w-5 text-slate-400" />;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4 max-w-2xl mx-auto">
        <Skeleton className="h-8 w-24" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error || !leave) {
    return (
      <div className="max-w-md mx-auto text-center py-12">
        <h2 className="text-lg font-bold text-red-650">Error Loading Details</h2>
        <p className="text-sm text-muted-foreground mt-2">The request does not exist or you lack authorized access permissions.</p>
        <Button className="mt-4" onClick={() => navigate(-1)}>Back</Button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fadeIn">
      {/* Back button */}
      <div>
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="text-xs">
          <ArrowLeft className="h-4 w-4 mr-1.5" />
          Back
        </Button>
      </div>

      {/* Main Request card */}
      <Card className="shadow-lg border border-slate-200/60 dark:border-slate-800/80 glass">
        <CardHeader className="flex flex-row items-start justify-between border-b pb-4 border-slate-100 dark:border-slate-850">
          <div>
            <div className="flex items-center gap-2">
              <CardTitle className="text-xl font-bold">{leave.leaveType} Request</CardTitle>
              {getStatusBadge(leave.status)}
            </div>
            <CardDescription className="mt-1">Submitted on {new Date(leave.createdAt).toLocaleDateString()}</CardDescription>
          </div>
          <div className="text-right">
            <span className="text-2xl font-extrabold text-primary">{leave.totalDays}</span>
            <span className="text-xs text-muted-foreground block font-semibold uppercase">Working Days</span>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6 pt-6">
          {/* Employee summary */}
          <div className="grid grid-cols-2 gap-4 bg-slate-50/50 dark:bg-slate-900/30 p-4 rounded-xl border border-slate-100 dark:border-slate-850">
            <div className="flex items-start space-x-2.5">
              <User className="h-4.5 w-4.5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-[10px] uppercase font-bold text-slate-400">Applicant</p>
                <p className="text-sm font-semibold">{leave.employee?.name}</p>
                <p className="text-xs text-muted-foreground">{leave.employee?.email}</p>
              </div>
            </div>
            <div className="flex items-start space-x-2.5">
              <Calendar className="h-4.5 w-4.5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-[10px] uppercase font-bold text-slate-400">Leave Period</p>
                <p className="text-sm font-semibold">
                  {new Date(leave.startDate).toLocaleDateString()} - {new Date(leave.endDate).toLocaleDateString()}
                </p>
                <p className="text-xs text-muted-foreground">Excludes weekends</p>
              </div>
            </div>
          </div>

          {/* Reason */}
          <div className="space-y-1.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <FileText className="h-4 w-4" />
              Reason for Request
            </h4>
            <p className="text-sm text-slate-800 dark:text-slate-300 leading-relaxed bg-slate-50/20 p-3 rounded-lg border border-slate-100 dark:border-slate-850">
              {leave.reason}
            </p>
          </div>

          {/* Feedback comment if reviewed */}
          {leave.managerComment && (
            <div className="p-4 rounded-xl bg-slate-100/50 dark:bg-slate-900/35 border border-slate-200/40">
              <p className="text-xs font-bold uppercase text-slate-500">Manager Response / Feedback</p>
              <p className="text-sm italic text-slate-800 dark:text-slate-350 mt-1">{leave.managerComment}</p>
            </div>
          )}

          {/* Timeline Audit Logs */}
          <div className="border-t border-slate-100 dark:border-slate-850 pt-6">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-4">Request Workflow History</h4>
            <div className="relative border-l border-slate-200 dark:border-slate-800 ml-3.5 space-y-6">
              
              {/* Event 1: Creation */}
              <div className="relative pl-6">
                <span className="absolute -left-3 top-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-900 border">
                  <User className="h-3.5 w-3.5 text-slate-550" />
                </span>
                <div>
                  <h5 className="text-sm font-semibold text-slate-900 dark:text-white">Leave request submitted</h5>
                  <p className="text-xs text-muted-foreground mt-0.5">By {leave.employee?.name} on {new Date(leave.createdAt).toLocaleString()}</p>
                </div>
              </div>

              {/* Event 2: Review (or pending) */}
              <div className="relative pl-6">
                <span className="absolute -left-3 top-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-900 border">
                  {getTimelineIcon(leave.status)}
                </span>
                <div>
                  <h5 className="text-sm font-semibold text-slate-900 dark:text-white">
                    {leave.status === 'PENDING'
                      ? 'Awaiting review decision'
                      : leave.status === 'APPROVED'
                      ? 'Request approved by Manager'
                      : leave.status === 'REJECTED'
                      ? 'Request rejected by Manager'
                      : 'Request cancelled'}
                  </h5>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {leave.status !== 'PENDING'
                      ? `Processed on ${new Date(leave.updatedAt).toLocaleString()}`
                      : 'Assigned to Human Resources Manager'}
                  </p>
                </div>
              </div>

            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
