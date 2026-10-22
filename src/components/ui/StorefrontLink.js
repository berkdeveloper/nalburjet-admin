import { ExternalLink } from "lucide-react";

export default function StorefrontLink({ href, children }) {
    if (!href) return <>{children}</>;

    return (
        <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            title="Canlı sitede yeni sekmede aç"
            className="group rounded-sm decoration-primary/40 underline-offset-4 transition-colors hover:text-primary hover:underline hover:decoration-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
            {children}
            <ExternalLink aria-hidden="true" className="ml-1 inline-block h-3 w-3 align-baseline opacity-40 transition-opacity group-hover:opacity-100" />
        </a>
    );
}
