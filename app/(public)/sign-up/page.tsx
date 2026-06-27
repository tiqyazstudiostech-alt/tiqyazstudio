import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { Card, CardHeader, CardContent } from "@/components/ui";
import { SignUpForm } from "./sign-up-form";

export default async function SignUpPage() {
  const session = await auth();
  if (session) redirect("/home");

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <p className="text-xs uppercase tracking-[0.3em] text-gold mb-2">Get started</p>
          <h1 className="font-display text-display leading-none tracking-tight text-ink">
            Tiqyaz
          </h1>
        </div>

        <Card>
          <CardHeader>
            <p className="font-display text-title text-ink">Create account</p>
          </CardHeader>
          <CardContent>
            <SignUpForm />
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
