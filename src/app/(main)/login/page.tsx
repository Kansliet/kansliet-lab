import type { Metadata } from "next";
import { login } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const metadata: Metadata = {
  title: "KANSLIET (LOGIN)",
  robots: { index: false },
};

type LoginPageProps = {
  searchParams: Promise<{ error?: string; email?: string }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;

  return (
    <div className="min-h-screen bg-background">
      <section className="py-20">
        <div className="container-kansliet max-w-md">
          <h1 className="dossier-label mb-12">ADMIN LOGIN</h1>

          <form action={login} className="space-y-6">
            {params.error && (
              <div
                role="alert"
                className="border border-red-500 bg-red-500/5 p-4 text-red-600"
              >
                <p className="text-caps text-sm font-bold tracking-wide">
                  ERROR: {params.error}
                </p>
              </div>
            )}

            <div>
              <label htmlFor="email" className="dossier-label mb-2 block">
                EMAIL
              </label>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="username"
                required
                defaultValue={params.email ?? ""}
                className="text-normal-case border-signal"
              />
            </div>

            <div>
              <label htmlFor="password" className="dossier-label mb-2 block">
                PASSWORD
              </label>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="text-normal-case border-signal"
              />
            </div>

            <Button type="submit" className="w-full">
              LOG IN
            </Button>
          </form>
        </div>
      </section>
    </div>
  );
}
