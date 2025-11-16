'use client';

import { Calendar, dateFnsLocalizer, View } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { ko } from 'date-fns/locale';
import { useState, useCallback, useMemo } from 'react';
import 'react-big-calendar/lib/css/react-big-calendar.css';

const locales = {
  'ko': ko,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

interface Task {
  id: string;
  title: string;
  description?: string | null;
  scheduledDate?: string | null;
  scheduledTime?: string | null;
  priority: string;
  status: string;
  goalId?: string | null;
  Goal?: {
    title: string;
    color: string;
  };
}

interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  resource: Task;
}

interface CalendarViewProps {
  tasks: Task[];
  onSelectEvent: (task: Task) => void;
  onSelectSlot: (slotInfo: { start: Date; end: Date }) => void;
}

export default function CalendarView({ tasks, onSelectEvent, onSelectSlot }: CalendarViewProps) {
  const [view, setView] = useState<View>('month');
  const [date, setDate] = useState(new Date());

  // 이벤트 변환
  const events: CalendarEvent[] = useMemo(() => {
    return tasks
      .filter(task => task.scheduledDate)
      .map(task => {
        const start = new Date(task.scheduledDate!);
        const end = new Date(task.scheduledDate!);

        // scheduledTime이 있으면 시간 설정
        if (task.scheduledTime) {
          const [hours, minutes] = task.scheduledTime.split(':').map(Number);
          start.setHours(hours, minutes, 0, 0);
          // 기본 1시간 duration
          end.setHours(hours + 1, minutes, 0, 0);
        } else {
          // 시간 정보가 없으면 하루 종일 이벤트로 표시
          start.setHours(0, 0, 0, 0);
          end.setHours(23, 59, 59, 999);
        }

        return {
          id: task.id,
          title: task.title,
          start,
          end,
          resource: task,
        };
      });
  }, [tasks]);

  // 이벤트 스타일
  const eventStyleGetter = useCallback((event: CalendarEvent) => {
    const task = event.resource;
    let backgroundColor = '#3B82F6'; // 기본 파란색

    // 목표 색상 사용
    if (task.Goal?.color) {
      backgroundColor = task.Goal.color;
    }

    // 상태에 따라 투명도 조정
    let opacity = 1;
    if (task.status === 'completed') {
      opacity = 0.5;
    }

    // 우선순위에 따라 테두리 스타일
    let borderLeft = '4px solid transparent';
    if (task.priority === 'high') {
      borderLeft = '4px solid #EF4444';
    } else if (task.priority === 'mid') {
      borderLeft = '4px solid #F59E0B';
    }

    return {
      style: {
        backgroundColor,
        opacity,
        borderLeft,
        borderRadius: '4px',
        fontSize: '0.875rem',
        padding: '2px 5px',
      },
    };
  }, []);

  const handleSelectEvent = useCallback((event: CalendarEvent) => {
    onSelectEvent(event.resource);
  }, [onSelectEvent]);

  const handleSelectSlot = useCallback((slotInfo: { start: Date; end: Date; action: string }) => {
    if (slotInfo.action === 'select' || slotInfo.action === 'click') {
      onSelectSlot({ start: slotInfo.start, end: slotInfo.end });
    }
  }, [onSelectSlot]);

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="h-[700px]">
        <Calendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          view={view}
          onView={setView}
          date={date}
          onNavigate={setDate}
          onSelectEvent={handleSelectEvent}
          onSelectSlot={handleSelectSlot}
          selectable
          eventPropGetter={eventStyleGetter}
          messages={{
            next: "다음",
            previous: "이전",
            today: "오늘",
            month: "월",
            week: "주",
            day: "일",
            agenda: "일정",
            date: "날짜",
            time: "시간",
            event: "이벤트",
            noEventsInRange: "이 기간에 일정이 없습니다.",
            showMore: (total) => `+${total} 더보기`,
          }}
          formats={{
            monthHeaderFormat: (date) => format(date, 'yyyy년 M월', { locale: ko }),
            dayHeaderFormat: (date) => format(date, 'M월 d일 (eee)', { locale: ko }),
            dayRangeHeaderFormat: ({ start, end }) =>
              `${format(start, 'M월 d일', { locale: ko })} - ${format(end, 'M월 d일', { locale: ko })}`,
            agendaHeaderFormat: ({ start, end }) =>
              `${format(start, 'yyyy년 M월 d일', { locale: ko })} - ${format(end, 'M월 d일', { locale: ko })}`,
          }}
        />
      </div>

      {/* 범례 */}
      <div className="mt-4 flex gap-4 text-sm text-gray-600">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-red-500 rounded"></div>
          <span>높은 우선순위</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-amber-500 rounded"></div>
          <span>중간 우선순위</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-blue-500 opacity-50 rounded"></div>
          <span>완료된 작업</span>
        </div>
      </div>
    </div>
  );
}
