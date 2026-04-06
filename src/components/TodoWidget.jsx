import { api } from '../lib/api.js';

export default function TodoWidget({ data, onRefresh }) {
  const todos = data?.data || [];
  const active = todos.filter(t => !t.completed);
  const completed = todos.filter(t => t.completed);

  async function toggleTodo(id, currentState) {
    await api.completeTodo(id, !currentState);
    onRefresh();
  }

  return (
    <div>
      <h2 className="text-[11px] tracking-[0.2em] uppercase text-copper-dark font-semibold mb-3">Action Items</h2>

      {active.length === 0 && completed.length === 0 && (
        <p className="text-sm text-text-faint">No action items.</p>
      )}

      <ul className="space-y-2">
        {active.map(todo => (
          <li key={todo.id} className="flex items-start gap-2 group">
            <button
              onClick={() => toggleTodo(todo.id, todo.completed)}
              className="mt-0.5 w-3.5 h-3.5 border-2 border-copper/60 hover:border-copper flex-shrink-0 transition-colors flex items-center justify-center"
            />
            <div className="min-w-0">
              <p className="text-sm text-text leading-snug">{todo.subject}</p>
              {todo.snippet && (
                <p className="text-[10px] text-text-muted tracking-wide">{todo.snippet}</p>
              )}
            </div>
          </li>
        ))}
      </ul>

      {completed.length > 0 && (
        <details className="mt-3 pt-2 border-t border-copper/20">
          <summary className="text-[10px] tracking-[0.15em] uppercase text-text-faint cursor-pointer hover:text-text-muted transition-colors">
            {completed.length} completed
          </summary>
          <ul className="space-y-1.5 mt-2">
            {completed.map(todo => (
              <li key={todo.id} className="flex items-start gap-2">
                <button
                  onClick={() => toggleTodo(todo.id, todo.completed)}
                  className="mt-0.5 w-3.5 h-3.5 border border-text-faint/40 bg-sand flex-shrink-0 flex items-center justify-center"
                >
                  <span className="text-text-faint text-[10px]">✓</span>
                </button>
                <p className="text-sm text-text-faint line-through">{todo.subject}</p>
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}
