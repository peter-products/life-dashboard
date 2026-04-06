export default function HomeworkWidget({ data }) {
  if (!data?.data) {
    return (
      <div>
        <h2 className="text-[11px] tracking-[0.2em] uppercase text-ocean font-semibold">Homework</h2>
        <p className="text-sm text-text-faint mt-2">No data yet.</p>
      </div>
    );
  }

  const { html, fetchedAt } = data.data;

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-[11px] tracking-[0.2em] uppercase text-ocean font-semibold">Homework</h2>
        {fetchedAt && (
          <span className="text-[10px] tracking-wide text-text-faint">
            {new Date(fetchedAt).toLocaleDateString()}
          </span>
        )}
      </div>
      <div
        className="max-w-none text-sm text-text
          [&_h2]:text-[11px] [&_h2]:tracking-[0.15em] [&_h2]:uppercase [&_h2]:text-ocean-mid [&_h2]:font-medium [&_h2]:mb-2 [&_h2]:mt-2
          [&_table]:w-full [&_table]:border-collapse
          [&_td]:border [&_td]:border-ocean-mid/30 [&_td]:p-1.5 [&_td]:text-xs [&_td]:leading-snug [&_td]:text-text [&_td]:align-top
          [&_td:first-child]:font-medium [&_td:first-child]:text-ocean [&_td:first-child]:w-16 [&_td:first-child]:tracking-wide
          [&_th]:border [&_th]:border-ocean-mid/30 [&_th]:p-1.5 [&_th]:bg-ocean/10 [&_th]:text-xs [&_th]:tracking-wider [&_th]:uppercase [&_th]:text-ocean-mid
          [&_img]:max-w-full [&_img]:mt-1
          [&_a]:text-ocean-mid [&_a]:no-underline [&_a]:hover:text-ocean
          [&_iframe]:w-full [&_iframe]:h-[300px] [&_iframe]:mt-2 [&_iframe]:border [&_iframe]:border-ocean-mid/30
          [&_strong]:text-text [&_strong]:font-medium"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  );
}
