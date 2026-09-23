import { login } from "./actions";
import { Button } from "@/components/shop/Button";
import { PAGE_SHELL, HEADING } from "@/lib/design-tokens";

type LoginPageProps = {
  searchParams: Promise<{ error?: string; email?: string }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;

  return (
    <div className={PAGE_SHELL.form}>
      <h1 className={`mb-6 ${HEADING}`}>Log in</h1>

      <form action={login} className="flex flex-col gap-3">
        <div className="flex flex-col gap-1">
          <label
            htmlFor="email"
            className="text-xs font-medium text-zinc-500 dark:text-zinc-400"
          >
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            defaultValue={params.email ?? ""}
            className="rounded-md border border-zinc-300 bg-transparent px-3 py-1.5 text-sm text-zinc-900 dark:border-zinc-700 dark:text-zinc-50"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label
            htmlFor="password"
            className="text-xs font-medium text-zinc-500 dark:text-zinc-400"
          >
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            className="rounded-md border border-zinc-300 bg-transparent px-3 py-1.5 text-sm text-zinc-900 dark:border-zinc-700 dark:text-zinc-50"
          />
        </div>

        <Button variant="primary" type="submit" className="mt-2 w-full">
          Log in
        </Button>

        {params.error && (
          <p className="text-sm text-red-600 dark:text-red-400">
            {params.error}
          </p>
        )}
      </form>
    </div>
  );
}
