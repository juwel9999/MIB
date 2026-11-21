"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

export default function MangaDetails() {
  const { id } = useParams<{ id: string }>();

  const [manga, setManga] = useState<any>(null);
  const [chapters, setChapters] = useState<any[]>([]);
  const [comments, setComments] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const [comment, setComment] = useState("");
  const [rating, setRating] = useState(10);
  const [average, setAverage] = useState("N/A");
  const [saved, setSaved] = useState(false);

  async function load() {
    const { data: m } = await supabase
      .from("manga").select("*").eq("id", id).single();

    const { data: c } = await supabase
      .from("chapters").select("*")
      .eq("manga_id", id)
      .order("chapter_number", { ascending: false });

    const { data: r } = await supabase
      .from("ratings").select("rating").eq("manga_id", id);

    const { data: cm } = await supabase
      .from("comments").select("*")
      .eq("manga_id", id)
      .order("created_at", { ascending: false });

    setManga(m);
    setChapters(c || []);
    setComments(cm || []);

    if (r?.length) {
      const avg = r.reduce((sum, item) => sum + item.rating, 0) / r.length;
      setAverage(avg.toFixed(1));
    }

    const { data: auth } = await supabase.auth.getUser();
    setUser(auth.user);

    if (auth.user) {
      const { data: bookmark } = await supabase
        .from("bookmarks").select("id")
        .eq("user_id", auth.user.id)
        .eq("manga_id", id)
        .maybeSingle();

      setSaved(!!bookmark);
    }
  }

  useEffect(() => {
    load();
  }, [id]);

  async function bookmark() {
    if (!user) return alert("Please login first.");

    if (saved) {
      await supabase.from("bookmarks")
        .delete().eq("user_id", user.id).eq("manga_id", id);
    } else {
      await supabase.from("bookmarks")
        .insert({ user_id: user.id, manga_id: id });
    }

    setSaved(!saved);
  }

  async function rate() {
    if (!user) return alert("Please login first.");

    const { error } = await supabase.from("ratings").upsert({
      user_id: user.id,
      manga_id: id,
      rating
    }, { onConflict: "user_id,manga_id" });

    if (error) alert(error.message);
    else {
      alert("Rating saved!");
      load();
    }
  }

  async function sendComment() {
    if (!user) return alert("Please login first.");
    if (!comment.trim()) return;

    const { error } = await supabase.from("comments").insert({
      user_id: user.id,
      manga_id: id,
      content: comment.trim()
    });

    if (error) alert(error.message);
    else {
      setComment("");
      load();
    }
  }

  if (!manga) return <main className="container">Loading manga...</main>;

  return (
    <>
      <nav className="navbar">
        <Link className="logo" href="/">MangaShelf</Link>
        <Link href="/">Home</Link>
      </nav>

      <main className="container">
        <section className="detail">
          <img
            src={manga.cover_url || "https://placehold.co/400x600"}
            alt={manga.title}
          />

          <div>
            <h1>{manga.title}</h1>
            <p className="muted">{manga.status}</p>

            {(manga.genres || []).map((g: string) =>
              <span className="pill" key={g}>{g}</span>
            )}

            <p>{manga.description}</p>

            <h3>Rating: {average}/10</h3>

            <div className="row">
              <select
                className="field"
                value={rating}
                onChange={e => setRating(Number(e.target.value))}
              >
                {[10,9,8,7,6,5,4,3,2,1].map(n =>
                  <option key={n} value={n}>{n}/10</option>
                )}
              </select>

              <button className="button" onClick={rate}>Rate</button>
              <button className="button secondary" onClick={bookmark}>
                {saved ? "♥ Saved" : "♡ Bookmark"}
              </button>
            </div>
          </div>
        </section>

        <h2>Chapters</h2>

        {chapters.map(ch => (
          <Link
            className="chapter"
            href={`/read/${ch.id}`}
            key={ch.id}
          >
            <span>{ch.title}</span>
            <span>Read →</span>
          </Link>
        ))}

        <section className="panel">
          <h2>Comments</h2>

          <textarea
            className="field"
            placeholder="Write a comment..."
            value={comment}
            onChange={e => setComment(e.target.value)}
          />

          <button className="button" onClick={sendComment}>
            Post comment
          </button>

          {comments.map(c => (
            <div className="comment" key={c.id}>
              <p>{c.content}</p>
              <small className="muted">
                {new Date(c.created_at).toLocaleString()}
              </small>
            </div>
          ))}
        </section>
      </main>
    </>
  );
}
