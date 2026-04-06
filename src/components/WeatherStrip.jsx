import { useMemo } from 'react';
import { addDays, isToday } from 'date-fns';

const ICON_URL = 'https://openweathermap.org/img/wn/';

export default function WeatherStrip({ data }) {
  const days = useMemo(() => {
    const yesterday = addDays(new Date(), -1);
    return Array.from({ length: 7 }, (_, i) => {
      const d = addDays(yesterday, i);
      d.setHours(0, 0, 0, 0);
      return d;
    });
  }, []);

  if (!data?.data) {
    return (
      <div className="grid grid-cols-7 gap-1">
        {days.map((_, i) => (
          <div key={i} className="bg-forest-mid/30 h-[80px]" />
        ))}
      </div>
    );
  }

  const { current, forecast } = data.data;

  const forecastByDate = {};
  if (forecast) {
    forecast.forEach(f => {
      forecastByDate[f.date] = f;
    });
  }

  return (
    <div className="grid grid-cols-7 gap-1">
      {days.map((day, i) => {
        const today = isToday(day);
        const dateStr = day.toISOString().split('T')[0];
        const fc = forecastByDate[dateStr];

        if (today && current) {
          return (
            <div key={i} className="bg-sand flex items-center justify-center gap-2 py-2">
              <img
                src={`${ICON_URL}${current.icon}@2x.png`}
                alt="weather"
                width="64"
                height="64"
              />
              <div className="text-center">
                <p className="text-[26px] font-light text-text leading-none">{current.temp}°</p>
                <p className="text-[11px] text-text-muted capitalize leading-tight mt-0.5">{current.description}</p>
              </div>
            </div>
          );
        }

        if (fc) {
          return (
            <div key={i} className="bg-sand flex flex-col items-center justify-center py-2">
              <img
                src={`${ICON_URL}${fc.icon}@2x.png`}
                alt="weather"
                width="56"
                height="56"
              />
              <p className="text-[14px] text-text leading-none mt-0.5">
                <span className="font-medium">{fc.high}°</span>
                <span className="text-text-muted ml-1">{fc.low}°</span>
              </p>
            </div>
          );
        }

        return (
          <div key={i} className="bg-sand/50 flex items-center justify-center py-2">
            <span className="text-text-faint text-sm">—</span>
          </div>
        );
      })}
    </div>
  );
}
