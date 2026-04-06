export default function EmailItem({ email }) {
  return (
    <div className="border-l-2 border-cedar-light pl-2 py-1">
      <p className="text-[10px] tracking-wider uppercase text-cedar font-medium truncate">{email.from}</p>
      <p className="text-xs text-stone-700 leading-snug truncate">{email.subject}</p>
    </div>
  );
}
