'use client';

import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

interface Routine {
  id: string;
  title: string;
  description: string | null;
  recurrenceType: string;
  recurrenceDays: string | null;
  timeOfDay: string | null;
  duration: number | null;
  priority: string;
  active: boolean;
}

interface RoutineModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  routine: Routine | null;
}

export default function RoutineModal({ isOpen, onClose, onSuccess, routine }: RoutineModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [recurrenceType, setRecurrenceType] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [selectedDays, setSelectedDays] = useState<number[]>([]);
  const [timeOfDay, setTimeOfDay] = useState('');
  const [duration, setDuration] = useState('');
  const [priority, setPriority] = useState<'high' | 'mid' | 'low'>('mid');
  const [active, setActive] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const dayNames = ['일', '월', '화', '수', '목', '금', '토'];

  useEffect(() => {
    if (routine) {
      setTitle(routine.title);
      setDescription(routine.description || '');
      setRecurrenceType(routine.recurrenceType as 'daily' | 'weekly' | 'monthly');
      if (routine.recurrenceDays) {
        try {
          setSelectedDays(JSON.parse(routine.recurrenceDays));
        } catch {
          setSelectedDays([]);
        }
      } else {
        setSelectedDays([]);
      }
      setTimeOfDay(routine.timeOfDay || '');
      setDuration(routine.duration ? routine.duration.toString() : '');
      setPriority(routine.priority as 'high' | 'mid' | 'low');
      setActive(routine.active);
    } else {
      // Reset form
      setTitle('');
      setDescription('');
      setRecurrenceType('daily');
      setSelectedDays([]);
      setTimeOfDay('');
      setDuration('');
      setPriority('mid');
      setActive(true);
    }
  }, [routine, isOpen]);

  const handleDayToggle = (day: number) => {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort()
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      toast.error('제목을 입력해주세요');
      return;
    }

    if (recurrenceType === 'weekly' && selectedDays.length === 0) {
      toast.error('주간 반복은 요일을 선택해야 합니다');
      return;
    }

    setIsSubmitting(true);

    try {
      const url = '/api/routines';
      const method = routine ? 'PATCH' : 'POST';

      const body: any = {
        title: title.trim(),
        description: description.trim() || null,
        recurrenceType,
        recurrenceDays: recurrenceType === 'weekly' ? selectedDays : null,
        timeOfDay: timeOfDay || null,
        duration: duration ? parseInt(duration) : null,
        priority,
        active,
      };

      if (routine) {
        body.id = routine.id;
      }

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (data.success) {
        toast.success(routine ? '루틴이 수정되었습니다' : '루틴이 생성되었습니다');
        onSuccess();
      } else {
        toast.error(data.error || '저장 실패');
      }
    } catch (error) {
      console.error('Submit error:', error);
      toast.error('저장에 실패했습니다');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            {routine ? '루틴 수정' : '새 루틴 만들기'}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                제목 *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="예: 아침 운동"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                설명
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
                placeholder="루틴에 대한 설명을 입력하세요"
              />
            </div>

            {/* Recurrence Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                반복 유형 *
              </label>
              <div className="flex gap-2">
                {(['daily', 'weekly', 'monthly'] as const).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setRecurrenceType(type)}
                    className={`flex-1 px-4 py-2 rounded-md border transition-colors ${
                      recurrenceType === type
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {type === 'daily' ? '매일' : type === 'weekly' ? '매주' : '매월'}
                  </button>
                ))}
              </div>
            </div>

            {/* Weekly Days Selection */}
            {recurrenceType === 'weekly' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  요일 선택 *
                </label>
                <div className="flex gap-2">
                  {dayNames.map((day, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => handleDayToggle(index)}
                      className={`flex-1 px-3 py-2 rounded-md border transition-colors ${
                        selectedDays.includes(index)
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {day}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Time & Duration */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  시간
                </label>
                <input
                  type="time"
                  value={timeOfDay}
                  onChange={(e) => setTimeOfDay(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  소요 시간 (분)
                </label>
                <input
                  type="number"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="30"
                  min="1"
                />
              </div>
            </div>

            {/* Priority */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                우선순위
              </label>
              <div className="flex gap-2">
                {(['low', 'mid', 'high'] as const).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPriority(p)}
                    className={`flex-1 px-4 py-2 rounded-md border transition-colors ${
                      priority === p
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {p === 'high' ? '높음' : p === 'mid' ? '보통' : '낮음'}
                  </button>
                ))}
              </div>
            </div>

            {/* Active Status */}
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="active"
                checked={active}
                onChange={(e) => setActive(e.target.checked)}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="active" className="text-sm font-medium text-gray-700">
                루틴 활성화
              </label>
            </div>

            {/* Buttons */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
                disabled={isSubmitting}
              >
                취소
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:bg-blue-300"
                disabled={isSubmitting}
              >
                {isSubmitting ? '저장 중...' : routine ? '수정' : '생성'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
