import { Card, CardHeader, CardContent } from "@/components/ui";
import { ResetPasswordForm } from "./reset-password-form";

export default function ResetPasswordPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <p className="text-xs uppercase tracking-[0.3em] text-gold mb-2">Account recovery</p>
          <h1 className="font-display text-display leading-none tracking-tight text-ink">
            Tiqyaz
          </h1>
        </div>

        <Card>
          <CardHeader>
            <p className="font-display text-title text-ink">Reset password</p>
          </CardHeader>
          <CardContent>
            <ResetPasswordForm />
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
