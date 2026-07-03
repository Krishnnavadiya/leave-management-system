import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { User, Mail, Shield, Building, Award, CalendarDays, History } from 'lucide-react';

export default function EmployeeProfile() {
  const { user } = useAuth();

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fadeIn">
      {/* Visual Header card */}
      <Card className="shadow-lg border border-slate-200/60 dark:border-slate-800/80 overflow-hidden glass">
        <div className="h-28 bg-gradient-to-r from-primary via-indigo-500 to-purple-600"></div>
        <CardContent className="relative pt-0 px-6 pb-6 border-b">
          {/* Avatar Icon */}
          <div className="absolute -top-10 left-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-background border-4 border-background shadow-md text-primary font-bold text-3xl">
            {user?.name.charAt(0).toUpperCase()}
          </div>
          
          <div className="pt-12 pl-2">
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">{user?.name}</h2>
            <p className="text-sm text-muted-foreground">{user?.email}</p>
            <div className="flex flex-wrap gap-2 mt-3">
              <Badge variant="secondary" className="flex items-center gap-1">
                <Shield className="h-3 w-3" />
                {user?.role}
              </Badge>
              <Badge variant="outline" className="flex items-center gap-1">
                <Building className="h-3 w-3" />
                {user?.department}
              </Badge>
            </div>
          </div>
        </CardContent>

        {/* Details Grid */}
        <CardContent className="p-6 space-y-6">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Employment Credentials</h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex items-center space-x-3 p-3.5 bg-slate-50/50 dark:bg-slate-900/30 rounded-xl border border-slate-100 dark:border-slate-850">
              <Building className="h-5 w-5 text-indigo-500 flex-shrink-0" />
              <div>
                <p className="text-[10px] text-muted-foreground uppercase font-bold">Department</p>
                <p className="text-sm font-semibold text-slate-850 dark:text-slate-200">{user?.department}</p>
              </div>
            </div>

            <div className="flex items-center space-x-3 p-3.5 bg-slate-50/50 dark:bg-slate-900/30 rounded-xl border border-slate-100 dark:border-slate-850">
              <Award className="h-5 w-5 text-purple-500 flex-shrink-0" />
              <div>
                <p className="text-[10px] text-muted-foreground uppercase font-bold">Authorized Role</p>
                <p className="text-sm font-semibold text-slate-850 dark:text-slate-200">{user?.role}</p>
              </div>
            </div>

            <div className="flex items-center space-x-3 p-3.5 bg-slate-50/50 dark:bg-slate-900/30 rounded-xl border border-slate-100 dark:border-slate-850">
              <Mail className="h-5 w-5 text-emerald-500 flex-shrink-0" />
              <div>
                <p className="text-[10px] text-muted-foreground uppercase font-bold">Email Address</p>
                <p className="text-sm font-semibold text-slate-850 dark:text-slate-200 truncate">{user?.email}</p>
              </div>
            </div>

            <div className="flex items-center space-x-3 p-3.5 bg-slate-50/50 dark:bg-slate-900/30 rounded-xl border border-slate-100 dark:border-slate-850">
              <CalendarDays className="h-5 w-5 text-pink-500 flex-shrink-0" />
              <div>
                <p className="text-[10px] text-muted-foreground uppercase font-bold">Remaining Balance</p>
                <p className="text-sm font-semibold text-slate-850 dark:text-slate-200">{user?.leaveBalance} Workdays</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
