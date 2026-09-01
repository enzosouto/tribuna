import Link from "next/link";

export function SectionHeader({ title, href, hrefLabel }: { title: string; href?: string; hrefLabel?: string }) {
  return (
    <div className="mb-4 flex items-center justify-between">
      <h2 className="font-display text-2xl tracking-wide">{title}</h2>
      {href && (
        <Link href={href} className="text-sm font-medium text-primary hover:underline">
          {hrefLabel ?? "Ver tudo"}
        </Link>
      )}
    </div>
  );
}
