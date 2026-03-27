export function SectionEyebrow({
  label,
  heading,
}: {
  label: string;
  heading: string;
}) {
  return (
    <div className="mb-8">
      <p className="text-[11px] font-bold text-blue uppercase tracking-[0.12em] mb-2 leading-none">
        {label}
      </p>
      <h2 className="text-[28px] md:text-[36px] font-bold text-dark tracking-tight leading-tight">
        {heading}
      </h2>
    </div>
  );
}
