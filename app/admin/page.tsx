"use client";

import Link from "next/link";
import { useState } from "react";

import { clearBoards, unlockStaff } from "@/app/actions";

export default function AdminPage() {
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [clearing, setClearing] = useState(false);

  return (
    <main className="center-wrap">
      <section className="panel name-card">
        <h1 className="name-title">ADMIN</h1>
        <p className="name-sub">Clear every Response from both leaderboards.</p>
        <form
          onSubmit={async (event) => {
            event.preventDefault();
            setMessage("");
            setClearing(true);
            try {
              if (!(await unlockStaff(password))) {
                setMessage("Incorrect staff password.");
                return;
              }
              if (!window.confirm("Permanently delete every Response and clear both boards?"))
                return;
              await clearBoards(password);
              setPassword("");
              setMessage("Both leaderboards were cleared.");
            } catch {
              setMessage("Could not clear the leaderboards. Check the server logs.");
            } finally {
              setClearing(false);
            }
          }}
        >
          <input
            className="name-input"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Staff password"
            autoComplete="current-password"
            required
            aria-label="Staff password"
          />
          <p className="name-count" role="status">
            {message || "This cannot be undone."}
          </p>
          <button className="btn staff-clear" type="submit" disabled={clearing}>
            {clearing ? "Clearing…" : "Clear Boards"}
          </button>{" "}
          <Link className="btn btn-ghost" href="/">
            Back
          </Link>
        </form>
      </section>
    </main>
  );
}
