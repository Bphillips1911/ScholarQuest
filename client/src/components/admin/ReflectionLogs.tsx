import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { RefreshCw, Calendar, User, MessageSquare, CheckCircle, Clock } from 'lucide-react';
import { format } from 'date-fns';

interface Reflection {
  id: string;
  studentName: string;
  prompt: string;
  response: string;
  status: string;
  assignedAt: string;
  submittedAt?: string;
  approvedAt?: string;
  teacherFeedback?: string;
  dueDate?: string;
}

export function ReflectionLogs() {
  const [refreshKey, setRefreshKey] = useState(0);

  const { data: reflections = [], isLoading, error, refetch } = useQuery({
    queryKey: ['/api/admin/reflections', refreshKey],
    queryFn: async () => {
      const response = await fetch('/api/admin/reflections', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch reflections');
      }
      
      return response.json();
    }
  });

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
    refetch();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge variant="default" className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" />Approved</Badge>;
      case 'submitted':
        return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />Submitted</Badge>;
      case 'assigned':
        return <Badge variant="outline"><Calendar className="w-3 h-3 mr-1" />Assigned</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            System-Wide Reflection Logs
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="w-6 h-6 animate-spin" />
            <span className="ml-2">Loading reflections...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            System-Wide Reflection Logs
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-red-500 mb-4">Error loading reflections: {error.message}</p>
            <Button onClick={handleRefresh} variant="outline">
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            System-Wide Reflection Logs
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-sm">
              {reflections.length} Total Reflections
            </Badge>
            <Button
              onClick={handleRefresh}
              variant="outline"
              size="sm"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {reflections.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium mb-2">No Approved Reflections</p>
            <p>When teachers approve student reflections, they will appear here.</p>
          </div>
        ) : (
          <ScrollArea className="h-[600px]">
            <div className="space-y-4">
              {reflections.map((reflection: Reflection) => (
                <div key={reflection.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-muted-foreground" />
                      <span className="font-medium">{reflection.studentName}</span>
                      {getStatusBadge(reflection.status)}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {reflection.approvedAt && (
                        <span>Approved: {format(new Date(reflection.approvedAt), 'MMM d, yyyy h:mm a')}</span>
                      )}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground mb-1">Reflection Prompt:</h4>
                      <p className="text-sm bg-muted p-2 rounded italic">"{reflection.prompt}"</p>
                    </div>
                    
                    {reflection.response && (
                      <div>
                        <h4 className="text-sm font-medium text-muted-foreground mb-1">Student Response:</h4>
                        <p className="text-sm bg-blue-50 dark:bg-blue-950/20 p-2 rounded">
                          {reflection.response}
                        </p>
                      </div>
                    )}
                    
                    {reflection.teacherFeedback && (
                      <div>
                        <h4 className="text-sm font-medium text-muted-foreground mb-1">Teacher Feedback:</h4>
                        <p className="text-sm bg-green-50 dark:bg-green-950/20 p-2 rounded">
                          {reflection.teacherFeedback}
                        </p>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-4 text-xs text-muted-foreground pt-2 border-t">
                    <span>Assigned: {format(new Date(reflection.assignedAt), 'MMM d, yyyy')}</span>
                    {reflection.submittedAt && (
                      <span>Submitted: {format(new Date(reflection.submittedAt), 'MMM d, yyyy')}</span>
                    )}
                    {reflection.dueDate && (
                      <span>Due: {format(new Date(reflection.dueDate), 'MMM d, yyyy')}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}