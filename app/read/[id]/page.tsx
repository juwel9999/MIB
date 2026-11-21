"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

export default function Reader() {
  const { id } = useParams<{ id: string }>();

  const [pages, setPages] = useState<any[]>([]);
  const [chapter, setChapter] = useState<any>(null);
  const [index, setIndex] = useState(0);
  const [mode, setMode] = useState("vertical");
  const [manga, setManga] = useState<any>(null);

  useEffect(() => {
    async function load() {
      const { data: ch } = await supabase
        .from("chapters").select("*").eq("id", id).single();

      if (!ch) return;

      setChapter(ch);

      const { data: p } = await supabase
        .from("pages").select("*")
        .eq("chapter_id", id)
        .order("page_number");

      setPages(p || []);

      const { data: m } = await supabase
        .from("manga").select("*")
        .eq("id", ch.manga_id).single();

      setManga(m);

      const { data: auth } = await supabase.auth.getUser();

      if (auth.user) {
        await supabase.from("reading_history").upsert({
          user_id: auth.user.id,
          manga_id: ch.manga_id,
          chapter_id: id,
          last_page: 1,
          updated_at: new Date().toISOString()
        }, { onConflict: "user_id,chapter_id" });
      }
    }

    load();
  }, [id]);

  async function saveProgress(page: number) {
    setIndex(page);

    const { data: auth } = await supabase.auth.getUser();

    if (auth.user && chapter) {
      await supabase.from("reading_history").upsert({
        user_id: auth.user.id,
        manga_id: chapter.manga_id,
        chapter_id: id,
        last_page: page + 1,
        updated_at: new Date().toISOString()
      }, { onConflict: "user_id,chapter_id" });
    }
  }

  if (!chapter) return <main className="container">Loading chapter...</main>;

  return (
    <>
      <nav className="navbar">
        <Link className="logo" href="/">MangaShelf</Link>
        <Link href={`/manga/${chapter.manga_id}`}>Menu ←</Link>
      </nav>

      <div className="reader-controls">
        <span>{manga?.title} · {chapter.title}</span>

        <button
          className="button secondary"
          onClick={() => setMode(
            mode === "vertical" ? "single" : "vertical"
          )}
        >
          {mode === "vertical" ? "Single page" : "Vertical"}
        </button>
      </div>

      <main className="reader">
        {mode === "vertical" ? (
          pages.map((p, i) => (
            <img
              key={p.id}
              src={p.image_url}
              alt={`Page ${i + 1}`}
              loading={i > 2 ? "lazy" : "eager"}
              onLoad={() => {
                if (i === 0) saveProgress(0);
              }}
            />
          ))
        ) : (
          <>
            {pages[index] && (
              <img
                src={pages[index].image_url}
                alt={`Page ${index + 1}`}
              />
            )}

            <div className="reader-controls">
              <button
                className="button secondary"
                disabled={index === 0}
                onClick={() => saveProgress(index - 1)}
              >
                Previous
              </button>

              <span>{index + 1} / {pages.length}</span>

              <button
                className="button"
                disabled={index >= pages.length - 1}
                onClick={() => saveProgress(index + 1)}
              >
                Next
              </button>
            </div>
          </>
        )}
      </main>
    </>
  );
                         }
