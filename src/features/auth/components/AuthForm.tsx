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
      className="account-form"
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
        <label>
          Username
          <input
            name="username"
            autoComplete="username"
            maxLength={50}
            required
            disabled={busy}
          />
        </label>
      )}
      <label>
        Email
        <input
          name="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={busy}
        />
      </label>
      <label>
        Password
        <input
          name="password"
          type="password"
          autoComplete={register ? "new-password" : "current-password"}
          minLength={register ? 8 : 1}
          required
          disabled={busy}
        />
      </label>
      {(error || (admin && auth.error)) && (
        <p className="form-error" role="alert">
          {error || auth.error}
        </p>
      )}
      <button type="submit" className="primary-button" disabled={busy}>
        <LogIn size={16} />
        {busy ? "Please wait…" : register ? "Create account" : "Sign in"}
      </button>
      {!admin && (
        <button
          type="button"
          className="secondary-button"
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
