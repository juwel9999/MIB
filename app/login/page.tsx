"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [register, setRegister] = useState(false);
  const [message, setMessage] = useState("");
  const router = useRouter();

  async function submit() {
    setMessage("Please wait...");

    const result = register
      ? await supabase.auth.signUp({ email, password })
      : await supabase.auth.signInWithPassword({ email, password });

    if (result.error) {
      setMessage(result.error.message);
      return;
    }

    if (register && !result.data.session) {
      setMessage("Check your email to confirm your account.");
      return;
    }

    router.push("/");
    router.refresh();
  }

  return (
    <>
      <nav className="navbar">
        <Link className="logo" href="/">MangaShelf</Link>
        <Link href="/">Home</Link>
      </nav>

      <main className="container">
        <div className="panel" style={{ maxWidth: 430, margin: "50px auto" }}>
          <h1>{register ? "Create account" : "Welcome back"}</h1>

          <label>Email</label>
          <input
            className="field"
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
          />

          <label>Password</label>
          <input
            className="field"
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
          />

          <button className="button" onClick={submit}>
            {register ? "Register" : "Login"}
          </button>

          <p>{message}</p>

          <button
            className="button secondary"
            onClick={() => setRegister(!register)}
          >
            {register ? "Already have an account? Login" : "Create account"}
          </button>
        </div>
      </main>
    </>
  );
}
