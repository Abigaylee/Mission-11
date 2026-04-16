import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import type { Book } from "../types";

type BookInput = Omit<Book, "bookId">;

const emptyForm: BookInput = {
  title: "",
  author: "",
  publisher: "",
  isbn: "",
  classification: "",
  category: "",
  pageCount: 1,
  price: 0,
};

export default function AdminBooks() {
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL as string | undefined;
  const base = apiBaseUrl ?? "http://localhost:5109";

  const [books, setBooks] = useState<Book[]>([]);
  const [form, setForm] = useState<BookInput>(emptyForm);
  const [editingBookId, setEditingBookId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function loadBooks() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${base}/api/books?pageNumber=1&pageSize=200`);
      if (!res.ok) throw new Error(`Failed to load books (${res.status})`);
      const data = (await res.json()) as { items: Book[] };
      setBooks(data.items);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to load books.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadBooks();
  }, []);

  function clearForm() {
    setForm(emptyForm);
    setEditingBookId(null);
  }

  function editBook(book: Book) {
    setEditingBookId(book.bookId);
    setForm({
      title: book.title,
      author: book.author,
      publisher: book.publisher,
      isbn: book.isbn,
      classification: book.classification,
      category: book.category,
      pageCount: book.pageCount,
      price: book.price,
    });
    setMessage(null);
    setError(null);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setMessage(null);
    setError(null);

    const payload = {
      ...form,
      pageCount: Number(form.pageCount),
      price: Number(form.price),
    };

    try {
      const isEditing = editingBookId !== null;
      const url = isEditing ? `${base}/api/books/${editingBookId}` : `${base}/api/books`;
      const method = isEditing ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as { message?: string } | null;
        throw new Error(body?.message ?? `Request failed (${res.status})`);
      }

      setMessage(isEditing ? "Book updated." : "Book added.");
      clearForm();
      await loadBooks();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save book.");
    }
  }

  async function deleteBook(bookId: number) {
    setMessage(null);
    setError(null);

    try {
      const res = await fetch(`${base}/api/books/${bookId}`, { method: "DELETE" });
      if (!res.ok) throw new Error(`Delete failed (${res.status})`);

      if (editingBookId === bookId) clearForm();
      setMessage("Book deleted.");
      await loadBooks();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to delete book.");
    }
  }

  return (
    <div className="container py-3">
      <h1 className="h3 mb-3">Admin - Manage Books</h1>

      {message && <div className="alert alert-success">{message}</div>}
      {error && <div className="alert alert-danger">{error}</div>}

      <form className="card p-3 mb-4" onSubmit={handleSubmit}>
        <h2 className="h5 mb-3">{editingBookId ? "Edit Book" : "Add New Book"}</h2>
        <div className="row g-3">
          <div className="col-md-6">
            <label className="form-label">Title</label>
            <input className="form-control" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </div>
          <div className="col-md-6">
            <label className="form-label">Author</label>
            <input className="form-control" required value={form.author} onChange={(e) => setForm({ ...form, author: e.target.value })} />
          </div>
          <div className="col-md-6">
            <label className="form-label">Publisher</label>
            <input className="form-control" required value={form.publisher} onChange={(e) => setForm({ ...form, publisher: e.target.value })} />
          </div>
          <div className="col-md-6">
            <label className="form-label">ISBN</label>
            <input className="form-control" required value={form.isbn} onChange={(e) => setForm({ ...form, isbn: e.target.value })} />
          </div>
          <div className="col-md-4">
            <label className="form-label">Classification</label>
            <input className="form-control" required value={form.classification} onChange={(e) => setForm({ ...form, classification: e.target.value })} />
          </div>
          <div className="col-md-4">
            <label className="form-label">Category</label>
            <input className="form-control" required value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
          </div>
          <div className="col-md-2">
            <label className="form-label">Page Count</label>
            <input
              className="form-control"
              type="number"
              min={1}
              required
              value={form.pageCount}
              onChange={(e) => setForm({ ...form, pageCount: Number(e.target.value) })}
            />
          </div>
          <div className="col-md-2">
            <label className="form-label">Price</label>
            <input
              className="form-control"
              type="number"
              min={0}
              step="0.01"
              required
              value={form.price}
              onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
            />
          </div>
        </div>

        <div className="d-flex gap-2 mt-3">
          <button type="submit" className="btn btn-primary">
            {editingBookId ? "Update Book" : "Add Book"}
          </button>
          {editingBookId && (
            <button type="button" className="btn btn-outline-secondary" onClick={clearForm}>
              Cancel Edit
            </button>
          )}
        </div>
      </form>

      {loading ? (
        <div>Loading books...</div>
      ) : (
        <div className="table-responsive">
          <table className="table table-striped align-middle">
            <thead>
              <tr>
                <th>Title</th>
                <th>Author</th>
                <th>Category</th>
                <th>Price</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {books.map((book) => (
                <tr key={book.bookId}>
                  <td>{book.title}</td>
                  <td>{book.author}</td>
                  <td>{book.category}</td>
                  <td>${book.price.toFixed(2)}</td>
                  <td className="text-end">
                    <button className="btn btn-sm btn-outline-primary me-2" onClick={() => editBook(book)}>
                      Edit
                    </button>
                    <button className="btn btn-sm btn-outline-danger" onClick={() => deleteBook(book.bookId)}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
