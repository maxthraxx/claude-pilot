import React from 'react';
import { Card, CardBody, CardTitle, Badge, Icon } from '../../components/ui';
import type { DashboardSession } from '../../hooks/useStats';

interface ActiveSessionsProps {
  sessions: DashboardSession[];
}

export function ActiveSessions({ sessions }: ActiveSessionsProps) {
  if (sessions.length === 0) {
    return (
      <Card>
        <CardBody>
          <div className="flex items-center justify-between mb-4">
            <CardTitle>Active Sessions</CardTitle>
            <Badge variant="ghost">0</Badge>
          </div>
          <div className="text-sm text-base-content/60">
            <p>No active sessions.</p>
          </div>
        </CardBody>
      </Card>
    );
  }

  return (
    <Card>
      <CardBody>
        <div className="flex items-center justify-between mb-4">
          <CardTitle>Active Sessions</CardTitle>
          <Badge variant="info">{sessions.length}</Badge>
        </div>
        <div className="space-y-3">
          {sessions.map((session) => (
            <div
              key={session.session_db_id}
              className="flex items-center justify-between p-2 rounded-lg bg-base-200/50"
            >
              <div className="flex items-center gap-2 min-w-0">
                <Icon
                  icon={session.plan_path ? 'lucide:file-text' : 'lucide:terminal'}
                  size={16}
                  className="text-base-content/50 shrink-0"
                />
                <div className="min-w-0">
                  <div className="text-sm font-medium truncate">
                    {session.project || 'unknown'}
                  </div>
                  {session.plan_path && (
                    <div className="text-xs text-base-content/50 truncate" title={session.plan_path}>
                      {formatPlanName(session.plan_path)}
                    </div>
                  )}
                </div>
              </div>
              <Badge
                variant={session.plan_path ? phaseVariant(session.plan_status) : 'ghost'}
                size="xs"
              >
                {session.plan_path ? (session.plan_status || 'Spec') : 'Quick'}
              </Badge>
            </div>
          ))}
        </div>
      </CardBody>
    </Card>
  );
}

function formatPlanName(planPath: string): string {
  const name = planPath.split('/').pop()?.replace('.md', '') || planPath;
  const match = name.match(/^\d{4}-\d{2}-\d{2}-(.+)$/);
  return match ? match[1] : name;
}

function phaseVariant(status: string | null): 'info' | 'warning' | 'accent' | 'success' {
  switch (status) {
    case 'PENDING': return 'warning';
    case 'COMPLETE': return 'accent';
    case 'VERIFIED': return 'success';
    default: return 'info';
  }
}
