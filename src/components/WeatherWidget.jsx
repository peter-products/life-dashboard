const ICON_URL = 'https://openweathermap.org/img/wn/';

function WeatherIcon({ code, size = 'small' }) {
  const px = size === 'large' ? '44' : '26';
  return (
    <img
      src={`${ICON_URL}${code}@2x.png`}
      alt="weather"
      width={px}
      height={px}
      className="inline-block opacity-80"
    />
  );
}

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function WeatherWidget({ data }) {
  if (!data?.data) {
    return (
      <div>
        <h2 className="text-[11px] tracking-[0.2em] uppercase text-cedar-dark font-medium">Weather</h2>
        <p className="text-sm text-stone-400 mt-2">No data yet.</p>
      </div>
    );
  }

  const { current, forecast } = data.data;

  return (
    <div>
      <h2 className="text-[11px] tracking-[0.2em] uppercase text-cedar-dark font-medium mb-3">Seattle</h2>

      {current && (
        <div className="flex items-center gap-3 mb-3 pb-3 border-b border-cedar-light/40">
          <WeatherIcon code={current.icon} size="large" />
          <div>
            <p className="text-3xl font-light text-stone-800">{current.temp}°</p>
            <p className="text-xs text-stone-600 capitalize">{current.description}</p>
            <p className="text-[10px] text-stone-400 tracking-wide">
              Feels {current.feels_like}° · Wind {current.wind} mph
            </p>
          </div>
        </div>
      )}

      {forecast && (
        <div className="flex justify-between">
          {forecast.map(day => {
            const d = new Date(day.date + 'T12:00:00');
            return (
              <div key={day.date} className="flex flex-col items-center">
                <p className="text-[10px] tracking-wider uppercase text-stone-500 font-medium">
                  {DAY_NAMES[d.getDay()]}
                </p>
                <WeatherIcon code={day.icon} />
                <p className="text-[11px] text-stone-700">
                  <span className="font-medium">{day.high}°</span>
                  <span className="text-stone-400 ml-0.5">{day.low}°</span>
                </p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
