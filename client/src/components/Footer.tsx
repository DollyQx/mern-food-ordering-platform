import Link from "next/link";

export function Footer() {
    return (
        <footer className="border-t py-6 md:px-8 md:py-0 bg-muted/30">
            <div className="container flex flex-col items-center justify-between gap-4 md:h-24 md:flex-row mx-auto px-4">
                <p className="text-center text-sm leading-loose text-muted-foreground md:text-left">
                    © {new Date().getFullYear()} Zomoggy. All rights reserved.
                </p>
                <div className="flex gap-4 text-sm text-muted-foreground">
                    <Link href="/privacy-policy" className="hover:underline">Privacy Policy</Link>
                    <Link href="/return-policy" className="hover:underline">Return Policy</Link>
                    <Link href="/terms" className="hover:underline">Terms of Service</Link>
                </div>
            </div>
        </footer>
    );
}
