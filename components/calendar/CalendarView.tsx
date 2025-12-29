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
  scheduledEndTime?: string | null;
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

        // 시간 정보 처리
        if (task.scheduledTime && task.scheduledEndTime) {
          // 시작 시간과 종료 시간이 모두 있는 경우
          const [startHours, startMinutes] = task.scheduledTime.split(':').map(Number);
          const [endHours, endMinutes] = task.scheduledEndTime.split(':').map(Number);
          start.setHours(startHours, startMinutes, 0, 0);
          end.setHours(endHours, endMinutes, 0, 0);
        } else if (task.scheduledTime) {
          // 시작 시간만 있는 경우 (1시간 duration)
          const [hours, minutes] = task.scheduledTime.split(':').map(Number);
          start.setHours(hours, minutes, 0, 0);
          end.setHours(hours + 1, minutes, 0, 0);
        } else {
          // 시간 정보가 없으면 디폴트 9:00-11:59
          start.setHours(9, 0, 0, 0);
          end.setHours(11, 59, 59, 999);
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
    <div className="glass-card rounded-xl shadow-lg border border-border p-6 floating-card calendar-modern">
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
      <div className="mt-6 flex gap-6 justify-center text-sm font-medium">
        <div className="flex items-center gap-2 px-4 py-2 bg-danger/10 rounded-lg border border-danger/20">
          <div className="w-4 h-4 bg-danger rounded-md shadow-sm"></div>
          <span className="text-foreground-secondary">높은 우선순위</span>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-warning/10 rounded-lg border border-warning/20">
          <div className="w-4 h-4 bg-warning rounded-md shadow-sm"></div>
          <span className="text-foreground-secondary">중간 우선순위</span>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-info/10 rounded-lg border border-info/20">
          <div className="w-4 h-4 bg-info opacity-50 rounded-md shadow-sm"></div>
          <span className="text-foreground-secondary">완료된 작업</span>
        </div>
      </div>

      <style jsx global>{`
        .calendar-modern .rbc-calendar {
          font-family: inherit;
        }
        .calendar-modern .rbc-header {
          padding: 12px 8px;
          font-weight: 600;
          color: hsl(var(--foreground-secondary));
          border-bottom: 1px solid hsl(var(--border));
        }
        .calendar-modern .rbc-today {
          background-color: hsl(var(--primary) / 0.1);
        }
        .calendar-modern .rbc-off-range-bg {
          background-color: hsl(var(--surface));
        }
        .calendar-modern .rbc-month-view {
          border: 1px solid hsl(var(--border));
          border-radius: 12px;
          overflow: hidden;
        }
        .calendar-modern .rbc-day-bg {
          border-left: 1px solid hsl(var(--border));
        }
        .calendar-modern .rbc-month-row {
          border-top: 1px solid hsl(var(--border));
        }
        .calendar-modern .rbc-toolbar button {
          color: hsl(var(--foreground));
          border: 1px solid hsl(var(--border));
          background-color: hsl(var(--surface));
          padding: 8px 16px;
          border-radius: 8px;
          font-weight: 500;
          transition: all 0.2s;
        }
        .calendar-modern .rbc-toolbar button:hover {
          background-color: hsl(var(--primary) / 0.1);
          border-color: hsl(var(--primary));
        }
        .calendar-modern .rbc-toolbar button:active,
        .calendar-modern .rbc-toolbar button.rbc-active {
          background: linear-gradient(to right, hsl(var(--primary)), hsl(var(--violet)));
          color: white;
          border-color: hsl(var(--primary));
          box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
        }
        .calendar-modern .rbc-event {
          border-radius: 6px;
          padding: 4px 8px;
          font-weight: 500;
        }
        .calendar-modern .rbc-event:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.2);
        }
      `}</style>
    </div>
  );
}
