import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Ghost } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-4 animate-fadeIn">
      <div className="p-4 bg-primary/10 text-primary rounded-full mb-4">
        <Ghost className="h-12 w-12" />
      </div>
      <h2 className="text-2xl font-bold tracking-tight">404 - Page Not Found</h2>
      <p className="text-sm text-muted-foreground mt-2 max-w-sm">
        The link you are trying to visit does not exist or has been relocated to another workspace path.
      </p>
      <div className="mt-6">
        <Link to="/dashboard">
          <Button>Return to Dashboard</Button>
        </Link>
      </div>
    </div>
  );
}
