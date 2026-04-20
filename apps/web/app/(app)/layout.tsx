import { Header } from "./header";

export default function AppLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="min-h-screen bg-ink">
            <Header />
            {children}
        </div>
    );
}
