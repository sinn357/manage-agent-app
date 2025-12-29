'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import {
  getNotificationPermission,
  requestNotificationPermission,
  getNotificationSettings,
  saveNotificationSettings,
  showNotification,
  type NotificationSettings,
} from '@/lib/notifications';
import toast from 'react-hot-toast';
import RoutineList from '@/components/routines/RoutineList';
import { Button } from '@/components/ui/button';
import { Settings as SettingsIcon, Home, Bell, RefreshCw, Save } from 'lucide-react';

export default function SettingsPage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<'notifications' | 'routines'>('notifications');
  const [permission, setPermission] = useState<'granted' | 'denied' | 'default'>('default');
  const [settings, setSettings] = useState<NotificationSettings>(getNotificationSettings());
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    setPermission(getNotificationPermission());
  }, []);

  const handleRequestPermission = async () => {
    const result = await requestNotificationPermission();
    setPermission(result);

    if (result === 'granted') {
      toast.success('알림 권한이 허용되었습니다.');
      showNotification('✅ 알림 테스트', {
        body: '알림이 정상적으로 작동합니다!',
      });
    } else if (result === 'denied') {
      toast.error('알림 권한이 거부되었습니다. 브라우저 설정에서 변경할 수 있습니다.');
    }
  };

  const handleSettingChange = (key: keyof NotificationSettings, value: boolean | number) => {
    setSettings(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleSave = () => {
    setSaving(true);
    saveNotificationSettings(settings);
    toast.success('설정이 저장되었습니다.');
    setTimeout(() => setSaving(false), 500);
  };

  const handleTestNotification = () => {
    if (permission !== 'granted') {
      toast.error('알림 권한을 먼저 허용해주세요.');
      return;
    }

    showNotification('🔔 테스트 알림', {
      body: '알림이 정상적으로 작동합니다!',
    });
  };

  if (isLoading || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-foreground-secondary">로딩 중...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-surface to-background">
      {/* Header */}
      <header className="glass-card border-b border-border/50 sticky top-0 z-10 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
          <div
            onClick={() => router.push('/dashboard')}
            className="cursor-pointer hover:opacity-80 transition-opacity"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-gradient-to-r from-primary to-violet">
                <SettingsIcon className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold gradient-text">설정</h1>
                <p className="text-sm text-foreground-secondary">알림, 루틴 및 환경 설정을 관리하세요</p>
              </div>
            </div>
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => router.push('/dashboard')}
            className="gap-2"
          >
            <Home className="w-4 h-4" />
            대시보드
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* Tabs */}
        <div className="mb-8 glass-card inline-flex rounded-xl p-1.5 border border-border shadow-sm">
          <button
            onClick={() => setActiveTab('notifications')}
            className={`px-6 py-2.5 rounded-lg text-sm font-semibold transition-all duration-300 flex items-center gap-2 ${
              activeTab === 'notifications'
                ? 'bg-gradient-to-r from-primary to-violet text-white shadow-md'
                : 'text-foreground-secondary hover:text-foreground hover:bg-surface'
            }`}
          >
            <Bell className="w-4 h-4" />
            알림 설정
          </button>
          <button
            onClick={() => setActiveTab('routines')}
            className={`px-6 py-2.5 rounded-lg text-sm font-semibold transition-all duration-300 flex items-center gap-2 ${
              activeTab === 'routines'
                ? 'bg-gradient-to-r from-primary to-violet text-white shadow-md'
                : 'text-foreground-secondary hover:text-foreground hover:bg-surface'
            }`}
          >
            <RefreshCw className="w-4 h-4" />
            루틴 관리
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'notifications' && (
          <div className="space-y-6">
            {/* 알림 권한 */}
            <div className="glass-card rounded-xl shadow-lg border border-border p-6 floating-card">
          <h2 className="text-lg font-bold gradient-text mb-6">알림 권한</h2>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-foreground font-medium mb-1">브라우저 알림 상태</p>
              <p className="text-sm text-foreground-secondary">
                {permission === 'granted' && '✅ 허용됨'}
                {permission === 'denied' && '❌ 거부됨'}
                {permission === 'default' && '⏳ 대기 중'}
              </p>
            </div>
            {permission !== 'granted' && (
              <Button onClick={handleRequestPermission}>
                권한 요청
              </Button>
            )}
            {permission === 'granted' && (
              <Button variant="success" onClick={handleTestNotification}>
                테스트 알림
              </Button>
            )}
          </div>

          {permission === 'denied' && (
            <div className="mt-4 p-4 bg-danger/10 border border-danger/30 rounded-xl">
              <p className="text-sm text-danger font-medium">
                알림 권한이 거부되었습니다. 브라우저 설정에서 변경할 수 있습니다.
              </p>
            </div>
          )}
        </div>

        {/* 알림 설정 */}
        <div className="glass-card rounded-xl shadow-lg border border-border p-6 floating-card">
          <h2 className="text-lg font-bold gradient-text mb-6">알림 설정</h2>

          {/* 전체 알림 활성화 */}
          <div className="mb-6 pb-6 border-b">
            <label className="flex items-center justify-between cursor-pointer">
              <div>
                <p className="text-gray-700 font-medium">알림 활성화</p>
                <p className="text-sm text-gray-500">모든 알림을 켜거나 끕니다</p>
              </div>
              <input
                type="checkbox"
                checked={settings.enabled}
                onChange={(e) => handleSettingChange('enabled', e.target.checked)}
                className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
              />
            </label>
          </div>

          {/* 개별 알림 설정 */}
          <div className="space-y-4 mb-6">
            <label className="flex items-center justify-between cursor-pointer">
              <div>
                <p className="text-gray-700">포커스 세션 완료</p>
                <p className="text-sm text-gray-500">세션이 끝나면 알림을 받습니다</p>
              </div>
              <input
                type="checkbox"
                checked={settings.focusComplete}
                onChange={(e) => handleSettingChange('focusComplete', e.target.checked)}
                disabled={!settings.enabled}
                className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              />
            </label>

            <label className="flex items-center justify-between cursor-pointer">
              <div>
                <p className="text-gray-700">포커스 세션 곧 종료</p>
                <p className="text-sm text-gray-500">5분 전에 미리 알림을 받습니다</p>
              </div>
              <input
                type="checkbox"
                checked={settings.focusReminder}
                onChange={(e) => handleSettingChange('focusReminder', e.target.checked)}
                disabled={!settings.enabled}
                className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              />
            </label>

            <label className="flex items-center justify-between cursor-pointer">
              <div>
                <p className="text-gray-700">작업 마감일 알림</p>
                <p className="text-sm text-gray-500">마감일이 임박하면 알림을 받습니다</p>
              </div>
              <input
                type="checkbox"
                checked={settings.taskDue}
                onChange={(e) => handleSettingChange('taskDue', e.target.checked)}
                disabled={!settings.enabled}
                className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              />
            </label>

            <label className="flex items-center justify-between cursor-pointer">
              <div>
                <p className="text-gray-700">목표 마감일 알림</p>
                <p className="text-sm text-gray-500">목표 마감일이 임박하면 알림을 받습니다</p>
              </div>
              <input
                type="checkbox"
                checked={settings.goalDue}
                onChange={(e) => handleSettingChange('goalDue', e.target.checked)}
                disabled={!settings.enabled}
                className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              />
            </label>
          </div>

          {/* 마감일 알림 일수 */}
          <div className="mb-6">
            <label className="block mb-2">
              <p className="text-gray-700 font-medium mb-1">마감일 알림 일수</p>
              <p className="text-sm text-gray-500 mb-3">마감일 며칠 전에 알림을 받을지 설정합니다</p>
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min="1"
                  max="7"
                  value={settings.reminderDays}
                  onChange={(e) => handleSettingChange('reminderDays', parseInt(e.target.value))}
                  disabled={!settings.enabled || (!settings.taskDue && !settings.goalDue)}
                  className="flex-1"
                />
                <span className="text-gray-700 font-medium w-16 text-center">
                  {settings.reminderDays}일 전
                </span>
              </div>
            </label>
          </div>

              {/* 저장 버튼 */}
              <Button
                onClick={handleSave}
                disabled={saving}
                className="w-full gap-2"
              >
                <Save className="w-4 h-4" />
                {saving ? '저장 중...' : '설정 저장'}
              </Button>
            </div>
          </div>
        )}

        {activeTab === 'routines' && (
          <div>
            <RoutineList />
          </div>
        )}
      </main>
    </div>
  );
}
