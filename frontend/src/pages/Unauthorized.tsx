import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { ShieldAlert } from 'lucide-react';

export default function Unauthorized() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-4 animate-fadeIn">
      <div className="p-4 bg-red-500/10 text-red-650 dark:text-red-400 rounded-full mb-4">
        <ShieldAlert className="h-12 w-12 animate-bounce" />
      </div>
      <h2 className="text-2xl font-bold tracking-tight">Access Forbidden</h2>
      <p className="text-sm text-muted-foreground mt-2 max-w-sm">
        You do not have administrative permissions to view this resource. Please contact system support if you believe this is in error.
      </p>
      <div className="mt-6">
        <Link to="/dashboard">
          <Button>Return to Dashboard</Button>
        </Link>
      </div>
    </div>
  );
}
