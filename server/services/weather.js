import axios from 'axios';
import { setCache } from '../db.js';

const ZIP = '98115';
const COUNTRY = 'US';

export async function refreshWeather() {
  const key = process.env.OPENWEATHERMAP_API_KEY;
  if (!key) { console.log('[weather] No API key, skipping'); return; }

  const [currentRes, forecastRes] = await Promise.all([
    axios.get('https://api.openweathermap.org/data/2.5/weather', {
      params: { zip: `${ZIP},${COUNTRY}`, appid: key, units: 'imperial' },
    }),
    axios.get('https://api.openweathermap.org/data/2.5/forecast', {
      params: { zip: `${ZIP},${COUNTRY}`, appid: key, units: 'imperial' },
    }),
  ]);

  const current = {
    temp: Math.round(currentRes.data.main.temp),
    feels_like: Math.round(currentRes.data.main.feels_like),
    humidity: currentRes.data.main.humidity,
    description: currentRes.data.weather[0].description,
    icon: currentRes.data.weather[0].icon,
    wind: Math.round(currentRes.data.wind.speed),
  };

  // Group 3-hour forecasts into daily summaries
  const dailyMap = {};
  for (const entry of forecastRes.data.list) {
    const date = entry.dt_txt.split(' ')[0];
    if (!dailyMap[date]) {
      dailyMap[date] = { date, temps: [], icons: [], descriptions: [] };
    }
    dailyMap[date].temps.push(entry.main.temp);
    dailyMap[date].icons.push(entry.weather[0].icon);
    dailyMap[date].descriptions.push(entry.weather[0].description);
  }

  const forecast = Object.values(dailyMap).map(day => ({
    date: day.date,
    high: Math.round(Math.max(...day.temps)),
    low: Math.round(Math.min(...day.temps)),
    icon: day.icons[Math.floor(day.icons.length / 2)],
    description: day.descriptions[Math.floor(day.descriptions.length / 2)],
  }));

  setCache('weather', { current, forecast });
  console.log('[weather] Cache updated');
}
