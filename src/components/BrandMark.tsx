import Link from 'next/link';

type BrandMarkProps = {
    compact?: boolean;
    href?: string;
    className?: string;
};

export function BrandMark({ compact = false, href = '/', className = '' }: BrandMarkProps) {
    const content = (
        <span className={`inline-flex items-center gap-2 ${className}`}>
            <span className="inline-flex h-9 w-9 items-center justify-center overflow-hidden rounded-xl border border-[hsl(var(--surface-sunk))] bg-[hsl(var(--surface))] shadow-lg shadow-[hsl(var(--text)/0.2)]">
                <img src="/logo.png" alt="Velix logo" className="h-full w-full object-cover" />
            </span>
            {!compact && <span className="font-bold text-foreground text-lg tracking-tight">Velix</span>}
        </span>
    );

    if (!href) return content;

    return (
        <Link href={href} className="inline-flex items-center hover:opacity-90 transition-opacity">
            {content}
        </Link>
    );
}
