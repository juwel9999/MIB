
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

export default function Home() {
  const [manga, setManga] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [genre, setGenre] = useState("All");
  const [status, setStatus] = useState("All");
  const [theme, setTheme] = useState("dark");

  useEffect(() => {
    supabase
      .from("manga")
      .select("*, chapters(id, title, created_at)")
      .order("updated_at", { ascending: false })
      .then(({ data }) => setManga(data || []));

    const saved = localStorage.getItem("mangashelf-theme");
    if (saved) {
      setTheme(saved);
      document.body.className = saved === "light" ? "light" : "";
    }
  }, []);

  function toggleTheme() {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    localStorage.setItem("mangashelf-theme", next);
    document.body.className = next === "light" ? "light" : "";
  }

  const genres = [
    "All", "Action", "Adventure", "Comedy",
    "Drama", "Fantasy", "Romance", "Horror",
    "School Life", "Slice of Life"
  ];

  const filtered = manga.filter((m) => {
    const matchesName = m.title.toLowerCase().includes(search.toLowerCase());
    const matchesGenre = genre === "All" || (m.genres || []).includes(genre);
    const matchesStatus = status === "All" || m.status === status;
    return matchesName && matchesGenre && matchesStatus;
  });

  return (
    <>
      <nav className="navbar">
        <Link className="logo" href="/">MangaShelf</Link>
        <div className="row">
          <button className="button secondary" onClick={toggleTheme}>
            {theme === "dark" ? "☀️" : "🌙"}
          </button>
          <Link className="button secondary" href="/login">Account</Link>
        </div>
      </nav>

      <main className="container">
        <section className="hero">
          <h1>Discover your next manga.</h1>
          <p className="muted">Read. Explore. Enjoy.</p>

          <input
            className="search"
            placeholder="Search manga..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <div className="row">
            <select className="field" value={genre}
              onChange={(e) => setGenre(e.target.value)}>
              {genres.map(g => <option key={g}>{g}</option>)}
            </select>

            <select className="field" value={status}
              onChange={(e) => setStatus(e.target.value)}>
              {["All", "Ongoing", "Completed", "Hiatus"].map(s =>
                <option key={s}>{s}</option>
              )}
            </select>
          </div>
        </section>

        <h2>Latest manga updates</h2>

        {filtered.length === 0 ? (
          <div className="panel">No manga found.</div>
        ) : (
          <div className="grid">
            {filtered.map(m => (
              <Link href={`/manga/${m.id}`} className="manga-card" key={m.id}>
                <img
                  src={m.cover_url || "https://placehold.co/400x600"}
                  alt={m.title}
                />
                <h3>{m.title}</h3>
                <p>{m.status}</p>
                <p>{m.chapters?.length || 0} chapters</p>
              </Link>
            ))}
          </div>
        )}
      </main>
    </>
  );
}

