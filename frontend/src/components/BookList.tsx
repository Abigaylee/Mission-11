import { useEffect, useMemo, useState } from "react";
import type { Book } from "../types";

type BooksPage = {
  items: Book[];
  selectedCategory: string;
  totalCount: number;
  pageSize: number;
  pageNumber: number;
  totalPages: number;
};

type BrowseState = {
  pageNumber: number;
  pageSize: number;
  sortDirection: "asc" | "desc";
  selectedCategory: string;
};

const DEFAULT_PAGE_SIZE = 5;
const BROWSE_KEY = "mission12-browse";

type BookListProps = {
  cartItemCount: number;
  cartSubtotal: number;
  onAddToCart: (book: Book) => void;
  onGoToCart: () => void;
};

function buildPageNumbers(currentPage: number, totalPages: number): number[] {
  if (totalPages <= 0) return [];
  if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);

  const pages = new Set<number>();
  pages.add(1);
  pages.add(totalPages);

  for (let p = currentPage - 1; p <= currentPage + 1; p++) {
    if (p >= 2 && p <= totalPages - 1) pages.add(p);
  }

  if (currentPage <= 3) {
    [2, 3, 4].forEach((p) => pages.add(p));
  } else if (currentPage >= totalPages - 2) {
    [totalPages - 3, totalPages - 2, totalPages - 1].forEach((p) => pages.add(p));
  }

  return Array.from(pages).sort((a, b) => a - b);
}

export default function BookList({
  cartItemCount,
  cartSubtotal,
  onAddToCart,
  onGoToCart,
}: BookListProps) {
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL as string | undefined;

  const [booksPage, setBooksPage] = useState<BooksPage | null>(null);
  const [categories, setCategories] = useState<string[]>(["All"]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [selectedCategory, setSelectedCategory] = useState("All");

  const totalPages = booksPage?.totalPages ?? 0;
  const pageNumbers = useMemo(
    () => buildPageNumbers(pageNumber, totalPages),
    [pageNumber, totalPages]
  );

  useEffect(() => {
    try {
      const storedBrowse = sessionStorage.getItem(BROWSE_KEY);
      if (storedBrowse) {
        const parsed = JSON.parse(storedBrowse) as BrowseState;
        setPageNumber(parsed.pageNumber);
        setPageSize(parsed.pageSize);
        setSortDirection(parsed.sortDirection);
        setSelectedCategory(parsed.selectedCategory);
      }
    } catch {
      // Ignore malformed session data.
    }
  }, []);

  useEffect(() => {
    const browse: BrowseState = {
      pageNumber,
      pageSize,
      sortDirection,
      selectedCategory,
    };
    sessionStorage.setItem(BROWSE_KEY, JSON.stringify(browse));
  }, [pageNumber, pageSize, sortDirection, selectedCategory]);

  useEffect(() => {
    const controller = new AbortController();
    async function loadCategories() {
      try {
        const base = apiBaseUrl ?? "http://localhost:5109";
        const res = await fetch(`${base}/api/books/categories`, {
          signal: controller.signal,
        });
        if (!res.ok) return;
        const data = (await res.json()) as string[];
        if (data.length > 0) setCategories(data);
      } catch {
        // Keep fallback categories on errors.
      }
    }
    loadCategories();
    return () => controller.abort();
  }, [apiBaseUrl]);

  useEffect(() => {
    const controller = new AbortController();

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const base = apiBaseUrl ?? "http://localhost:5109";
        const params = new URLSearchParams({
          pageNumber: String(pageNumber),
          pageSize: String(pageSize),
          sortDirection,
          category: selectedCategory,
        });

        const res = await fetch(`${base}/api/books?${params.toString()}`, {
          signal: controller.signal,
        });

        if (!res.ok) {
          throw new Error(`Request failed with status ${res.status}`);
        }

        const data = (await res.json()) as BooksPage;
        setBooksPage(data);
      } catch (e) {
        if (controller.signal.aborted) return;
        const msg = e instanceof Error ? e.message : "Unknown error";
        setError(msg);
      } finally {
        setLoading(false);
      }
    }

    load();
    return () => controller.abort();
  }, [apiBaseUrl, pageNumber, pageSize, sortDirection, selectedCategory]);

  return (
    <div className="container py-3" data-bs-theme="light">
      <div className="row g-3">
        <section className="col-12">
          <div className="d-flex flex-column gap-2 flex-md-row align-items-md-center justify-content-md-between mb-3">
            <h1 className="h3 mb-0">Online Bookstore</h1>

            <div className="d-flex gap-2 align-items-center flex-wrap">
              <div>
                <label className="form-label mb-1" htmlFor="pageSizeSelect">
                  Results per page
                </label>
                <select
                  id="pageSizeSelect"
                  className="form-select form-select-sm"
                  value={pageSize}
                  onChange={(e) => {
                    setPageNumber(1);
                    setPageSize(Number(e.target.value));
                  }}
                >
                  {[5, 10, 15, 20].map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </div>

              <button
                className="btn btn-outline-primary btn-sm align-self-end mt-4 mt-md-0"
                type="button"
                onClick={() => setSortDirection((d) => (d === "asc" ? "desc" : "asc"))}
              >
                Sort by Title: {sortDirection === "asc" ? "A-Z" : "Z-A"}
              </button>

              <button
                className="btn btn-success btn-sm align-self-end mt-4 mt-md-0"
                type="button"
                onClick={onGoToCart}
              >
                Cart ({cartItemCount})
              </button>
            </div>
          </div>

          <div className="mb-3">
            <span className="me-2 fw-semibold">Filter by Category:</span>
            {categories.map((category) => (
              <button
                key={category}
                type="button"
                className={`btn btn-sm me-2 mb-2 ${
                  selectedCategory === category ? "btn-dark" : "btn-outline-dark"
                }`}
                onClick={() => {
                  setSelectedCategory(category);
                  setPageNumber(1);
                }}
              >
                {category}
              </button>
            ))}
          </div>

          <>
            {error && <div className="alert alert-danger">{error}</div>}

              {loading && (
                <div className="text-center my-4">
                  <div className="spinner-border" role="status" />
                  <div className="mt-2">Loading books...</div>
                </div>
              )}

              {!loading && booksPage && (
                <>
                  <div className="mb-2 text-muted">
                    Category: <strong>{booksPage.selectedCategory}</strong> | Page{" "}
                    <strong>{booksPage.pageNumber}</strong> of{" "}
                    <strong>{booksPage.totalPages}</strong> ({booksPage.totalCount} books)
                  </div>

                  <div className="row g-3">
                    {booksPage.items.map((b) => (
                      <div className="col-12" key={b.bookId}>
                        <div className="card h-100 shadow-sm">
                          <div className="card-body">
                            <div className="d-flex align-items-start justify-content-between gap-3">
                              <div>
                                <h5 className="card-title mb-1">{b.title}</h5>
                                <div className="text-muted">{b.author}</div>
                              </div>

                              <div className="text-end">
                                <div className="fw-semibold">${b.price.toFixed(2)}</div>
                                <div className="small text-muted">{b.pageCount} pages</div>
                              </div>
                            </div>

                            <hr />

                            <div className="row g-2">
                              <div className="col-12 col-md-6">
                                <strong>Publisher:</strong> {b.publisher}
                              </div>
                              <div className="col-12 col-md-6">
                                <strong>ISBN:</strong> {b.isbn}
                              </div>
                              <div className="col-12 col-md-6">
                                <strong>Classification:</strong> {b.classification}
                              </div>
                              <div className="col-12 col-md-6">
                                <strong>Category:</strong> {b.category}
                              </div>
                            </div>

                            <div className="mt-3 text-end">
                              <button
                                className="btn btn-success btn-sm"
                                type="button"
                                onClick={() => onAddToCart(b)}
                              >
                                Add to Cart
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {totalPages > 1 && (
                    <nav className="mt-4" aria-label="Book pagination">
                      <ul className="pagination justify-content-center">
                        <li className={`page-item ${pageNumber <= 1 ? "disabled" : ""}`}>
                          <a
                            className="page-link"
                            href={`?pageNumber=1&pageSize=${pageSize}&sortDirection=${sortDirection}&category=${selectedCategory}`}
                            onClick={(e) => {
                              e.preventDefault();
                              if (pageNumber <= 1) return;
                              setPageNumber(1);
                            }}
                          >
                            First
                          </a>
                        </li>
                        <li className={`page-item ${pageNumber <= 1 ? "disabled" : ""}`}>
                          <a
                            className="page-link"
                            href={`?pageNumber=${Math.max(1, pageNumber - 1)}&pageSize=${pageSize}&sortDirection=${sortDirection}&category=${selectedCategory}`}
                            onClick={(e) => {
                              e.preventDefault();
                              if (pageNumber <= 1) return;
                              setPageNumber((p) => Math.max(1, p - 1));
                            }}
                          >
                            Prev
                          </a>
                        </li>

                        {pageNumbers.map((p) => (
                          <li key={p} className={`page-item ${p === pageNumber ? "active" : ""}`}>
                            <a
                              className="page-link"
                              href={`?pageNumber=${p}&pageSize=${pageSize}&sortDirection=${sortDirection}&category=${selectedCategory}`}
                              onClick={(e) => {
                                e.preventDefault();
                                setPageNumber(p);
                              }}
                            >
                              {p}
                            </a>
                          </li>
                        ))}

                        <li className={`page-item ${pageNumber >= totalPages ? "disabled" : ""}`}>
                          <a
                            className="page-link"
                            href={`?pageNumber=${Math.min(totalPages, pageNumber + 1)}&pageSize=${pageSize}&sortDirection=${sortDirection}&category=${selectedCategory}`}
                            onClick={(e) => {
                              e.preventDefault();
                              if (pageNumber >= totalPages) return;
                              setPageNumber((p) => Math.min(totalPages, p + 1));
                            }}
                          >
                            Next
                          </a>
                        </li>
                        <li className={`page-item ${pageNumber >= totalPages ? "disabled" : ""}`}>
                          <a
                            className="page-link"
                            href={`?pageNumber=${totalPages}&pageSize=${pageSize}&sortDirection=${sortDirection}&category=${selectedCategory}`}
                            onClick={(e) => {
                              e.preventDefault();
                              if (pageNumber >= totalPages) return;
                              setPageNumber(totalPages);
                            }}
                          >
                            Last
                          </a>
                        </li>
                      </ul>
                    </nav>
                  )}
                </>
              )}
          </>

          <div className="mt-4 d-flex justify-content-end">
            <div className="card bg-light border-0 px-3 py-2">
              <small className="text-success d-block fw-bold">Cart Summary</small>
              <small>
                Qty: <strong>{cartItemCount}</strong> | Total:{" "}
                <strong>${cartSubtotal.toFixed(2)}</strong>
              </small>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

