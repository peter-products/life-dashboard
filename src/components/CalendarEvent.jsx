export default function CalendarEvent({ event }) {
  const time = event.allDay
    ? 'All day'
    : new Date(event.start).toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        timeZone: 'America/Los_Angeles',
      });

  return (
    <div className="border-l-2 border-ocean-mid pl-2 py-0.5">
      <p className="text-[10px] tracking-wider uppercase text-ocean-mid font-medium">{time}</p>
      <p className="text-xs text-text leading-snug truncate">{event.summary}</p>
      {event.location && (
        <p className="text-[10px] text-text-muted truncate">{event.location}</p>
      )}
    </div>
  );
}
