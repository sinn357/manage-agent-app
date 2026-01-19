'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Clock, Settings, Calendar, Sunrise, Moon } from 'lucide-react';
import { formatLifeTimeRemaining, formatSimpleDate } from '@/lib/lifeCalculations';
import type { LifeStats } from '@/lib/lifeCalculations';

interface LifeTimelineDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  lifeStats: LifeStats | null;
  onSettingsClick: () => void;
}

export default function LifeTimelineDetailModal({
  isOpen,
  onClose,
  lifeStats,
  onSettingsClick,
}: LifeTimelineDetailModalProps) {
  if (!lifeStats) return null;

  const progressPercent = Math.min(100, Math.max(0, lifeStats.percentage));

  // 추가 통계 계산
  const weeksLeft = Math.floor(lifeStats.daysLeft / 7);
  const monthsLeft = Math.floor(lifeStats.daysLeft / 30);
  const yearsLeft = Math.floor(lifeStats.daysLeft / 365);
  const weekendsLeft = Math.floor(weeksLeft); // 주말 수
  const newYearsLeft = yearsLeft; // 남은 새해

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary" />
            Life Timeline
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* 메인 게이지 */}
          <div>
            <div className="flex justify-between items-baseline mb-3">
              <div className="text-3xl font-bold bg-gradient-to-r from-primary to-violet bg-clip-text text-transparent">
                {lifeStats.currentAge}세 / {lifeStats.targetAge}세
              </div>
              <div className="text-lg font-semibold text-primary">
                {progressPercent.toFixed(1)}%
              </div>
            </div>

            {/* 진행률 바 */}
            <div className="relative w-full h-4 bg-surface rounded-full overflow-hidden mb-2">
              <div
                className="h-full bg-gradient-to-r from-primary via-violet to-violet-light transition-all duration-500 rounded-full"
                style={{ width: `${progressPercent}%` }}
              />
              {/* 현재 위치 마커 */}
              <div
                className="absolute top-0 w-0.5 h-full bg-foreground"
                style={{ left: `${progressPercent}%` }}
              />
            </div>

            {/* 날짜 표시 */}
            {lifeStats.birthDate && lifeStats.targetDeathDate && (
              <div className="flex justify-between items-center text-xs text-foreground-tertiary">
                <span className="flex items-center gap-1">
                  <Sunrise className="w-3 h-3" />
                  {formatSimpleDate(lifeStats.birthDate)}
                </span>
                <span className="flex items-center gap-1 font-semibold text-primary">
                  <Calendar className="w-3 h-3" />
                  현재
                </span>
                <span className="flex items-center gap-1">
                  <Moon className="w-3 h-3" />
                  {formatSimpleDate(lifeStats.targetDeathDate)}
                </span>
              </div>
            )}
          </div>

          {/* 남은 시간 */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-primary/10 rounded-xl p-4 text-center">
              <div className="text-foreground-secondary text-xs mb-1">남은 시간</div>
              <div className="text-primary font-bold text-xl">
                {formatLifeTimeRemaining(lifeStats)}
              </div>
            </div>
            <div className="bg-violet/10 rounded-xl p-4 text-center">
              <div className="text-foreground-secondary text-xs mb-1">남은 일수</div>
              <div className="text-violet font-bold text-xl">
                {lifeStats.daysLeft.toLocaleString()}일
              </div>
            </div>
          </div>

          {/* 인생 통계 */}
          <div className="bg-surface/50 rounded-xl p-4">
            <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <span>📊</span> 인생 통계
            </h4>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="flex justify-between">
                <span className="text-foreground-secondary">살아온 날</span>
                <span className="font-medium text-foreground">
                  {(lifeStats.targetAge * 365 - lifeStats.daysLeft).toLocaleString()}일
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-foreground-secondary">남은 주말</span>
                <span className="font-medium text-foreground">
                  {weekendsLeft.toLocaleString()}회
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-foreground-secondary">남은 새해</span>
                <span className="font-medium text-foreground">
                  {newYearsLeft}번
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-foreground-secondary">남은 달</span>
                <span className="font-medium text-foreground">
                  {monthsLeft.toLocaleString()}개월
                </span>
              </div>
            </div>
          </div>

          {/* 설정 버튼 */}
          <Button
            variant="outline"
            onClick={onSettingsClick}
            className="w-full gap-2"
          >
            <Settings className="w-4 h-4" />
            프로필 설정
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
