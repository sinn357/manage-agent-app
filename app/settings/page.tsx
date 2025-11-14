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
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-600">로딩 중...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* 헤더 */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">설정</h1>
            <p className="text-gray-600 mt-1">알림, 루틴 및 환경 설정을 관리하세요</p>
          </div>
          <button
            onClick={() => router.push('/dashboard')}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            대시보드
          </button>
        </div>

        {/* Tabs */}
        <div className="mb-6 border-b border-gray-200">
          <div className="flex gap-4">
            <button
              onClick={() => setActiveTab('notifications')}
              className={`pb-4 px-2 border-b-2 font-medium transition-colors ${
                activeTab === 'notifications'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-800'
              }`}
            >
              🔔 알림 설정
            </button>
            <button
              onClick={() => setActiveTab('routines')}
              className={`pb-4 px-2 border-b-2 font-medium transition-colors ${
                activeTab === 'routines'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-800'
              }`}
            >
              🔁 루틴 관리
            </button>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'notifications' && (
          <div>
            {/* 알림 권한 */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">알림 권한</h2>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-700 mb-1">브라우저 알림 상태</p>
              <p className="text-sm text-gray-500">
                {permission === 'granted' && '✅ 허용됨'}
                {permission === 'denied' && '❌ 거부됨'}
                {permission === 'default' && '⏳ 대기 중'}
              </p>
            </div>
            {permission !== 'granted' && (
              <button
                onClick={handleRequestPermission}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                권한 요청
              </button>
            )}
            {permission === 'granted' && (
              <button
                onClick={handleTestNotification}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                테스트 알림
              </button>
            )}
          </div>

          {permission === 'denied' && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700">
                알림 권한이 거부되었습니다. 브라우저 설정에서 변경할 수 있습니다.
              </p>
            </div>
          )}
        </div>

        {/* 알림 설정 */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">알림 설정</h2>

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
              <button
                onClick={handleSave}
                disabled={saving}
                className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 font-medium"
              >
                {saving ? '저장 중...' : '설정 저장'}
              </button>
            </div>
          </div>
        )}

        {activeTab === 'routines' && (
          <div>
            <RoutineList />
          </div>
        )}
      </div>
    </div>
  );
}
