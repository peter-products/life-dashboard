export default function EmailWidget({ data }) {
  const emails = data?.data || [];

  return (
    <div>
      <h2 className="text-[11px] tracking-[0.2em] uppercase text-copper-dark font-semibold mb-3">
        Recent Emails
      </h2>

      {emails.length === 0 && (
        <p className="text-sm text-text-faint">No emails to show.</p>
      )}

      <ul className="space-y-2">
        {emails.slice(0, 12).map(email => (
          <li key={email.id} className="border-l-2 border-copper-light pl-2 py-0.5">
            <div className="flex items-baseline justify-between gap-2">
              <p className="text-[10px] tracking-wider uppercase text-copper font-medium truncate">
                {email.from}
              </p>
              <p className="text-[10px] text-text-faint flex-shrink-0">
                {new Date(email.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
              </p>
            </div>
            <p className="text-xs text-text leading-snug truncate">{email.subject}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
