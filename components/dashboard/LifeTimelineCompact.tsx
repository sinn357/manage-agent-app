'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Clock, ArrowRight, Settings } from 'lucide-react';
import { formatLifeTimeRemaining } from '@/lib/lifeCalculations';
import type { LifeStats } from '@/lib/lifeCalculations';
import LifeTimelineDetailModal from './LifeTimelineDetailModal';

interface LifeTimelineCompactProps {
  onSettingsClick: () => void;
}

export default function LifeTimelineCompact({ onSettingsClick }: LifeTimelineCompactProps) {
  const [lifeStats, setLifeStats] = useState<LifeStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  useEffect(() => {
    fetchLifeStats();
  }, []);

  const fetchLifeStats = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/user/profile');
      const data = await response.json();

      if (data.success) {
        setLifeStats(data.lifeStats);
      } else {
        setError(data.error || 'Failed to fetch life stats');
      }
    } catch (err) {
      console.error('Fetch life stats error:', err);
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="glass-card rounded-xl p-4 border border-border">
        <div className="animate-pulse">
          <div className="flex items-center justify-between mb-3">
            <div className="h-5 bg-surface rounded w-32"></div>
            <div className="h-6 w-6 bg-surface rounded"></div>
          </div>
          <div className="h-4 bg-surface rounded w-24 mb-2"></div>
          <div className="h-2 bg-surface rounded-full w-full"></div>
        </div>
      </div>
    );
  }

  if (error || !lifeStats) {
    return (
      <div className="glass-card rounded-xl p-4 border border-border">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-primary" />
            <span className="font-semibold text-foreground text-sm">Life Timeline</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onSettingsClick}
            className="h-7 w-7 p-0"
          >
            <Settings className="w-4 h-4" />
          </Button>
        </div>
        <p className="text-xs text-foreground-secondary">
          {error || '설정이 필요합니다'}
        </p>
        <Button onClick={onSettingsClick} size="sm" variant="outline" className="mt-2 w-full text-xs h-8">
          설정하기
        </Button>
      </div>
    );
  }

  const progressPercent = Math.min(100, Math.max(0, lifeStats.percentage));

  return (
    <>
      <div className="glass-card rounded-xl p-4 border border-border hover:border-primary/30 transition-colors">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-primary" />
            <span className="font-semibold text-foreground text-sm">Life Timeline</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsDetailOpen(true)}
            className="h-7 w-7 p-0 hover:bg-primary/10"
          >
            <ArrowRight className="w-4 h-4 text-primary" />
          </Button>
        </div>

        <div className="mb-2">
          <span className="text-lg font-bold text-foreground">
            {formatLifeTimeRemaining(lifeStats)}
          </span>
          <span className="text-xs text-foreground-secondary ml-2">남음</span>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex-1 h-2 bg-surface rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-primary to-violet transition-all duration-500 rounded-full"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <span className="text-xs font-semibold text-primary min-w-[36px] text-right">
            {progressPercent.toFixed(0)}%
          </span>
        </div>
      </div>

      <LifeTimelineDetailModal
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        lifeStats={lifeStats}
        onSettingsClick={() => {
          setIsDetailOpen(false);
          onSettingsClick();
        }}
      />
    </>
  );
}
