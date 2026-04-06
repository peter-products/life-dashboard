import { useState, useCallback } from 'react';
import { api } from './lib/api.js';
import { useFetch } from './hooks/usePolling.js';
import WeeklyCalendar from './components/WeeklyCalendar.jsx';
import WeatherStrip from './components/WeatherStrip.jsx';
import HomeworkWidget from './components/HomeworkWidget.jsx';
import TodoWidget from './components/TodoWidget.jsx';
import EmailWidget from './components/EmailWidget.jsx';

export default function App() {
  const [refreshing, setRefreshing] = useState(false);

  const auth = useFetch(() => api.getAuthStatus(), []);
  const weather = useFetch(() => api.getWeather(), []);
  const calendar = useFetch(() => api.getCalendar(), []);
  const emails = useFetch(() => api.getEmails(), []);
  const todos = useFetch(() => api.getTodos(), []);
  const homework = useFetch(() => api.getHomework(), []);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await api.refreshAll();
      await Promise.all([
        weather.refetch(),
        calendar.refetch(),
        emails.refetch(),
        todos.refetch(),
        homework.refetch(),
        auth.refetch(),
      ]);
    } catch (e) {
      console.error('Refresh failed:', e);
    } finally {
      setRefreshing(false);
    }
  }, [weather, calendar, emails, todos, homework, auth]);

  const authenticated = auth.data?.authenticated ?? false;

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-night">
      {/* Header */}
      <div className="px-5 py-1.5 flex items-center justify-between flex-shrink-0 bg-night">
        <h1 className="text-sm tracking-[0.25em] font-light uppercase text-forest-light">Dashboard</h1>
        <div className="flex items-center gap-4">
          {!authenticated && (
            <a
              href="/auth/google"
              className="text-[11px] tracking-[0.15em] uppercase px-3 py-1 bg-copper text-white hover:bg-copper-dark transition-colors"
            >
              Connect Google
            </a>
          )}
          {auth.data?.email && (
            <span className="text-[11px] tracking-wider text-text-faint">
              {auth.data.email}
            </span>
          )}
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="text-[11px] tracking-[0.15em] uppercase px-3 py-1 border border-forest-mid text-forest-light hover:bg-night-light disabled:opacity-40 transition-colors"
          >
            {refreshing ? '...' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* Accent line */}
      <div className="h-0.5 bg-gradient-to-r from-forest-mid via-copper to-ocean-mid flex-shrink-0" />

      {/* Calendar */}
      <div className="bg-forest px-2 pt-1.5 flex-shrink-0">
        <WeeklyCalendar events={calendar.data?.data} />
      </div>

      {/* Weather strip */}
      <div className="bg-forest px-2 pb-1.5 flex-shrink-0">
        <WeatherStrip data={weather.data} />
      </div>

      {/* Bottom widgets — 3 columns */}
      <div className="flex-1 min-h-0 grid grid-cols-3 gap-2 p-2">
        <div className="bg-cream border-2 border-copper p-3 overflow-y-auto">
          <TodoWidget data={todos.data} onRefresh={todos.refetch} />
        </div>
        <div className="bg-cream border-2 border-copper p-3 overflow-y-auto">
          <EmailWidget data={emails.data} />
        </div>
        <div className="bg-ocean-light border-2 border-ocean-mid p-3 overflow-y-auto">
          <HomeworkWidget data={homework.data} />
        </div>
      </div>
    </div>
  );
}
