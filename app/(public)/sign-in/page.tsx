import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { Card, CardHeader, CardContent } from "@/components/ui";
import { SignInForm } from "./sign-in-form";

export default async function SignInPage() {
  const session = await auth();
  if (session) redirect("/watch");

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <p className="text-xs uppercase tracking-[0.3em] text-gold mb-2">Welcome back</p>
          <h1 className="font-display text-display leading-none tracking-tight text-ink">
            Tiqyaz
          </h1>
        </div>

        <Card>
          <CardHeader>
            <p className="font-display text-title text-ink">Sign in</p>
          </CardHeader>
          <CardContent>
            <SignInForm />
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
