import { redirect } from "next/navigation";
import { auth } from "@/server/auth";
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";

export default async function Home() {
  const session = await auth();
  if (session) {
    redirect("/presentation");
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted">
      <header className="border-b border-border/60">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
          <span className="text-lg font-semibold tracking-tight text-foreground">
            My Slides AI
          </span>
          <GoogleSignInButton />
        </div>
      </header>

      <main className="mx-auto flex max-w-4xl flex-col gap-6 px-6 py-24 sm:py-32">
        <h1 className="text-4xl font-semibold leading-tight tracking-tight text-foreground sm:text-6xl text-center">
          Automate TikToks that drive
          <br className="hidden sm:block" />
          traffic to your website
        </h1>
      </main>
    </div>
  );
}
