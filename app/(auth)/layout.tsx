export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50 bg-[url('/grid.svg')]">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-[var(--waypoint-teal)] to-[var(--waypoint-navy)] flex items-center justify-center shadow-lg shadow-[var(--waypoint-teal)]/20 mb-4">
            <span className="text-white text-2xl font-bold">W</span>
          </div>
          <h1 className="text-2xl font-bold font-dm-sans tracking-tight">Waypoint</h1>
        </div>
        {children}
      </div>
    </div>
  );
}
