"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

export default function Admin() {
  const [allowed, setAllowed] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [genres, setGenres] = useState("");
  const [status, setStatus] = useState("Ongoing");
  const [cover, setCover] = useState<File | null>(null);
  const [mangas, setMangas] = useState<any[]>([]);
  const [mangaId, setMangaId] = useState("");
  const [chapterNumber, setChapterNumber] = useState("1");
  const [chapterTitle, setChapterTitle] = useState("");
  const [pages, setPages] = useState<FileList | null>(null);
  const [message, setMessage] = useState("");

  async function checkAdmin() {
    const { data } = await supabase.auth.getUser();
    const isAdmin = data.user?.app_metadata?.role === "admin";

    setAllowed(!!isAdmin);

    if (isAdmin) {
      const { data: list } = await supabase
        .from("manga").select("*").order("created_at", {
          ascending: false
        });

      setMangas(list || []);
    }
  }

  useEffect(() => {
    checkAdmin();
  }, []);

  async function uploadManga(e: React.FormEvent) {
    e.preventDefault();

    if (!cover) return;

    setMessage("Uploading cover...");

    const path = `covers/${crypto.randomUUID()}-${cover.name}`;

    const { error: uploadError } = await supabase.storage
      .from("manga").upload(path, cover);

    if (uploadError) {
      setMessage(uploadError.message);
      return;
    }

    const { data: image } = supabase.storage
      .from("manga").getPublicUrl(path);

    const { error } = await supabase.from("manga").insert({
      title,
      description,
      genres: genres.split(",").map(g => g.trim()).filter(Boolean),
      status,
      cover_url: image.publicUrl
    });

    setMessage(error?.message || "Manga added successfully!");

    if (!error) {
      setTitle("");
      setDescription("");
      setGenres("");
      setCover(null);
      checkAdmin();
    }
  }

  async function uploadChapter(e: React.FormEvent) {
    e.preventDefault();

    if (!pages || !mangaId) return;

    setMessage("Creating chapter...");

    const number = Number(chapterNumber);

    const { data: chapter, error } = await supabase
      .from("chapters")
      .insert({
        manga_id: mangaId,
        chapter_number: number,
        title: chapterTitle || `Chapter ${number}`
      })
      .select()
      .single();

    if (error || !chapter) {
      setMessage(error?.message || "Chapter creation failed.");
      return;
    }

    for (let i = 0; i < pages.length; i++) {
      const file = pages[i];

      const path = `pages/${chapter.id}/${i + 1}-${file.name}`;

      const { error: uploadError } = await supabase.storage
        .from("manga").upload(path, file);

      if (uploadError) {
        setMessage(uploadError.message);
        return;
      }

      const { data: image } = supabase.storage
        .from("manga").getPublicUrl(path);

      const { error: pageError } = await supabase
        .from("pages").insert({
          chapter_id: chapter.id,
          page_number: i + 1,
          image_url: image.publicUrl
        });

      if (pageError) {
        setMessage(pageError.message);
        return;
      }
    }

    await supabase.from("manga")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", mangaId);

    setMessage(`${pages.length} pages uploaded successfully!`);
    setChapterTitle("");
    setPages(null);
    setChapterNumber(String(number + 1));
  }

  async function logout() {
    await supabase.auth.signOut();
    setAllowed(false);
  }

  if (!allowed) {
    return (
      <main className="container">
        <h1>Admin access required</h1>
        <p>Sign in with your administrator account.</p>
        <Link className="button" href="/login">Login</Link>
      </main>
    );
  }

  return (
    <>
      <nav className="navbar">
        <Link className="logo" href="/">MangaShelf</Link>
        <button className="button secondary" onClick={logout}>
          Logout
        </button>
      </nav>

      <main className="container">
        <h1>Admin Dashboard</h1>
        <p className="muted">Manage your manga library.</p>

        <form className="panel" onSubmit={uploadManga}>
          <h2>Add New Manga</h2>

          <input className="field"
            placeholder="Manga title"
            value={title}
            onChange={e => setTitle(e.target.value)}
            required
          />

          <textarea className="field"
            placeholder="Description"
            value={description}
            onChange={e => setDescription(e.target.value)}
          />

          <input className="field"
            placeholder="Genres: Action, Romance, Drama"
            value={genres}
            onChange={e => setGenres(e.target.value)}
          />

          <select className="field"
            value={status}
            onChange={e => setStatus(e.target.value)}
          >
            <option>Ongoing</option>
            <option>Completed</option>
            <option>Hiatus</option>
          </select>

          <label>Cover image</label>
          <input className="field"
            type="file"
            accept="image/*"
            onChange={e => setCover(e.target.files?.[0] || null)}
            required
          />

          <button className="button">Add Manga</button>
        </form>

        <form className="panel" onSubmit={uploadChapter}>
          <h2>Upload Chapter</h2>

          <select className="field"
            value={mangaId}
            onChange={e => setMangaId(e.target.value)}
            required
          >
            <option value="">Choose manga</option>
            {mangas.map(m =>
              <option value={m.id} key={m.id}>{m.title}</option>
            )}
          </select>

          <input className="field"
            type="number"
            step="0.1"
            placeholder="Chapter number"
            value={chapterNumber}
            onChange={e => setChapterNumber(e.target.value)}
            required
          />

          <input className="field"
            placeholder="Chapter title (optional)"
            value={chapterTitle}
            onChange={e => setChapterTitle(e.target.value)}
          />

          <label>Chapter pages</label>
          <input className="field"
            type="file"
            accept="image/*"
            multiple
            onChange={e => setPages(e.target.files)}
            required
          />

          <p className="muted">
            Select images in reading order.
          </p>

          <button className="button">Upload Chapter</button>
        </form>

        <div className="panel">
          <h2>Your Manga</h2>
          {mangas.map(m =>
            <p key={m.id}>{m.title}</p>
          )}
        </div>

        <p>{message}</p>
      </main>
    </>
  );
            }
