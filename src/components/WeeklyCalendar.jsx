import { useMemo } from 'react';
import { format, addDays, isSameDay, isToday, isYesterday } from 'date-fns';
import CalendarEvent from './CalendarEvent.jsx';

export default function WeeklyCalendar({ events }) {
  const days = useMemo(() => {
    const yesterday = addDays(new Date(), -1);
    return Array.from({ length: 7 }, (_, i) => {
      const d = addDays(yesterday, i);
      d.setHours(0, 0, 0, 0);
      return d;
    });
  }, []);

  const eventsByDay = useMemo(() => {
    return days.map(day => {
      const dayEvents = (events || []).filter(e => {
        const start = new Date(e.start);
        return isSameDay(start, day);
      });
      const allDay = dayEvents.filter(e => e.allDay);
      const timed = dayEvents.filter(e => !e.allDay).sort(
        (a, b) => new Date(a.start) - new Date(b.start)
      );
      return { allDay, timed };
    });
  }, [events, days]);

  function dayLabel(day) {
    if (isToday(day)) return 'Today';
    if (isYesterday(day)) return 'Yesterday';
    return format(day, 'EEE');
  }

  return (
    <div className="grid grid-cols-7 gap-1">
      {days.map((day, i) => {
        const today = isToday(day);
        const yesterday = isYesterday(day);

        return (
          <div
            key={i}
            className={`p-1.5 ${
              today
                ? 'bg-[#e4f0dc] border-2 border-copper'
                : yesterday
                  ? 'bg-[#c0ceba] border border-forest-mid'
                  : 'bg-forest-light border border-forest-mid/40'
            }`}
          >
            <div className={`text-center mb-1 pb-1 border-b ${
              today ? 'border-copper/30' : 'border-forest-mid/20'
            }`}>
              <span className={`text-[13px] tracking-[0.15em] uppercase font-medium ${
                today ? 'text-copper' : 'text-forest-mid'
              }`}>
                {dayLabel(day)}
              </span>
              <span className={`text-[22px] font-light ml-2 ${
                today ? 'text-copper-dark' : 'text-text'
              }`}>
                {format(day, 'd')}
              </span>
            </div>

            <div className="space-y-0.5">
              {eventsByDay[i].allDay.map(e => (
                <CalendarEvent key={e.id} event={e} />
              ))}
              {eventsByDay[i].timed.map(e => (
                <CalendarEvent key={e.id} event={e} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
