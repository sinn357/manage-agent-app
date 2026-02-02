'use client';

import { useState, useEffect } from 'react';
import RoutineModal from './RoutineModal';
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
  createdAt: string;
}

export default function RoutineList() {
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRoutine, setSelectedRoutine] = useState<Routine | null>(null);

  useEffect(() => {
    fetchRoutines();
  }, []);

  const fetchRoutines = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/routines');
      const data = await response.json();
      if (data.success) {
        setRoutines(data.routines);
      }
    } catch (error) {
      console.error('Failed to fetch routines:', error);
      toast.error('루틴을 불러오는데 실패했습니다');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAdd = () => {
    setSelectedRoutine(null);
    setIsModalOpen(true);
  };

  const handleEdit = (routine: Routine) => {
    setSelectedRoutine(routine);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('이 루틴을 삭제하시겠습니까?')) return;

    try {
      const response = await fetch(`/api/routines?id=${id}`, {
        method: 'DELETE',
      });

      const data = await response.json();
      if (data.success) {
        toast.success('루틴이 삭제되었습니다');
        fetchRoutines();
      } else {
        toast.error(data.error || '삭제 실패');
      }
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('삭제에 실패했습니다');
    }
  };

  const handleToggleActive = async (routine: Routine) => {
    try {
      const response = await fetch('/api/routines', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: routine.id,
          active: !routine.active,
        }),
      });

      const data = await response.json();
      if (data.success) {
        toast.success(routine.active ? '루틴이 비활성화되었습니다' : '루틴이 활성화되었습니다');
        fetchRoutines();
      } else {
        toast.error(data.error || '변경 실패');
      }
    } catch (error) {
      console.error('Toggle error:', error);
      toast.error('변경에 실패했습니다');
    }
  };

  const getRecurrenceText = (routine: Routine) => {
    if (routine.recurrenceType === 'daily') return '매일';
    if (routine.recurrenceType === 'monthly') return '매월';
    if (routine.recurrenceType === 'weekly' && routine.recurrenceDays) {
      try {
        const days = JSON.parse(routine.recurrenceDays);
        const dayNames = ['일', '월', '화', '수', '목', '금', '토'];
        return days.map((d: number) => dayNames[d]).join(', ');
      } catch {
        return '매주';
      }
    }
    return '반복';
  };

  const getPriorityColor = (priority: string) => {
    if (priority === 'high') return 'text-red-600 bg-red-50';
    if (priority === 'mid') return 'text-blue-500 bg-blue-50';
    return 'text-gray-600 bg-gray-50';
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-900">루틴 관리</h2>
        <button
          onClick={handleAdd}
          className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
        >
          + 루틴 추가
        </button>
      </div>

      {routines.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <p className="text-gray-500 mb-4">등록된 루틴이 없습니다</p>
          <button
            onClick={handleAdd}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
          >
            첫 루틴 만들기
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {routines.map((routine) => (
            <div
              key={routine.id}
              className={`bg-white rounded-lg shadow p-5 border-2 ${
                routine.active ? 'border-blue-200' : 'border-gray-200'
              }`}
            >
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                  <h3 className={`text-lg font-semibold ${routine.active ? 'text-gray-900' : 'text-gray-400'}`}>
                    {routine.title}
                  </h3>
                  {routine.description && (
                    <p className="text-sm text-gray-600 mt-1">{routine.description}</p>
                  )}
                </div>
                <button
                  onClick={() => handleToggleActive(routine)}
                  className={`px-3 py-1 text-xs rounded-full font-medium ${
                    routine.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {routine.active ? '활성' : '비활성'}
                </button>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <span>🔁</span>
                  <span>{getRecurrenceText(routine)}</span>
                </div>
                {routine.timeOfDay && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <span>⏰</span>
                    <span>{routine.timeOfDay}</span>
                  </div>
                )}
                {routine.duration && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <span>⏱️</span>
                    <span>{routine.duration}분</span>
                  </div>
                )}
                <div>
                  <span
                    className={`inline-block px-2 py-1 text-xs rounded ${getPriorityColor(routine.priority)}`}
                  >
                    {routine.priority === 'high' ? '높음' : routine.priority === 'mid' ? '보통' : '낮음'}
                  </span>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => handleEdit(routine)}
                  className="flex-1 px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
                >
                  수정
                </button>
                <button
                  onClick={() => handleDelete(routine.id)}
                  className="flex-1 px-3 py-2 text-sm bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors"
                >
                  삭제
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <RoutineModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedRoutine(null);
        }}
        onSuccess={() => {
          fetchRoutines();
          setIsModalOpen(false);
          setSelectedRoutine(null);
        }}
        routine={selectedRoutine}
      />
    </div>
  );
}
