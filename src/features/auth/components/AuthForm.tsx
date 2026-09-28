import { useState } from "react";
import { LogIn } from "lucide-react";
import { toast } from "sonner";
import { session } from "../services/session";
import { useSession } from "../hooks/useSession";
export function AuthForm({ admin = false }: { admin?: boolean }) {
  const [register, setRegister] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [email, setEmail] = useState("");
  const auth = useSession();
  return (
    <form
      className="grid gap-[17px]"
      onSubmit={async (event) => {
        event.preventDefault();
        if (busy) return;
        const data = new FormData(event.currentTarget);
        setBusy(true);
        setError("");
        try {
          if (register) {
            await session.register(
              String(data.get("username")).trim(),
              email.trim(),
              String(data.get("password")),
            );
            setRegister(false);
            toast.success("Account created. Sign in to continue.");
          } else {
            await session.login(email.trim(), String(data.get("password")));
            toast.success("Signed in");
          }
        } catch (err) {
          setError((err as Error).message);
        } finally {
          setBusy(false);
        }
      }}
    >
      <p>
        {register
          ? "Create an account on your Aviator backend."
          : admin
            ? "Sign in with an active administrator account. Player accounts cannot access administration."
            : "Sign in to use your backend wallet and place bets."}
      </p>
      {register && (
        <label className="grid gap-[7px] text-xs text-[#bfaec9]">
          Username
          <input
            className="w-full rounded-[7px] border border-[#44354c] bg-[#121117] p-3 text-[#f1ebf4]"
            name="username"
            autoComplete="username"
            maxLength={50}
            required
            disabled={busy}
          />
        </label>
      )}
      <label className="grid gap-[7px] text-xs text-[#bfaec9]">
        Email
        <input
          className="w-full rounded-[7px] border border-[#44354c] bg-[#121117] p-3 text-[#f1ebf4]"
          name="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={busy}
        />
      </label>
      <label className="grid gap-[7px] text-xs text-[#bfaec9]">
        Password
        <input
          className="w-full rounded-[7px] border border-[#44354c] bg-[#121117] p-3 text-[#f1ebf4]"
          name="password"
          type="password"
          autoComplete={register ? "new-password" : "current-password"}
          minLength={register ? 8 : 1}
          required
          disabled={busy}
        />
      </label>
      {(error || (admin && auth.error)) && (
        <p className="text-[#ff8a9f]! wrap-anywhere" role="alert">
          {error || auth.error}
        </p>
      )}
      <button
        type="submit"
        className="flex w-full items-center justify-center gap-2 rounded-[7px] bg-brand-btn p-3.5 font-semibold"
        disabled={busy}
      >
        <LogIn size={16} />
        {busy ? "Please wait…" : register ? "Create account" : "Sign in"}
      </button>
      {!admin && (
        <button
          type="button"
          className="mt-[13px] flex w-full items-center justify-center gap-2 rounded-[7px] border border-[#4c3a53] bg-[#28202f] p-3 text-xs"
          disabled={busy}
          onClick={() => {
            setRegister(!register);
            setError("");
          }}
        >
          {register
            ? "Already registered? Sign in"
            : "New here? Create an account"}
        </button>
      )}
    </form>
  );
}
