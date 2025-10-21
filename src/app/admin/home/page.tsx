export default function AdminHomePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-foreground">Admin Home</h1>
        <p className="text-muted-foreground">
          Welcome to the SlidesCockpit admin panel. Use the sidebar to navigate
          through administrative tools as they become available.
        </p>
      </div>

      <section className="rounded-lg border border-border bg-card p-6">
        <h2 className="text-lg font-medium text-foreground">Getting started</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          This space is ready for analytics, user management, and other admin
          features. Reach out if you need help deciding what to build first.
        </p>
      </section>
    </div>
  );
}
