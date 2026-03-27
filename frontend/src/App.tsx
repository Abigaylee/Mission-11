import { useEffect, useMemo, useState } from "react";
import { Navigate, Route, Routes, useNavigate } from "react-router-dom";
import BookList from "./components/BookList";
import CartPage from "./components/CartPage";
import type { Book, CartItem } from "./types";
import "./App.css";

const CART_KEY = "mission12-cart";

export default function App() {
  const navigate = useNavigate();
  const [cart, setCart] = useState<CartItem[]>([]);

  useEffect(() => {
    try {
      const storedCart = sessionStorage.getItem(CART_KEY);
      if (storedCart) setCart(JSON.parse(storedCart) as CartItem[]);
    } catch {
      // Ignore malformed session data.
    }
  }, []);

  useEffect(() => {
    sessionStorage.setItem(CART_KEY, JSON.stringify(cart));
  }, [cart]);

  const cartItemCount = useMemo(
    () => cart.reduce((sum, item) => sum + item.quantity, 0),
    [cart]
  );
  const cartSubtotal = useMemo(
    () => cart.reduce((sum, item) => sum + item.book.price * item.quantity, 0),
    [cart]
  );

  function addToCart(book: Book) {
    setCart((prev) => {
      const existing = prev.find((item) => item.book.bookId === book.bookId);
      if (existing) {
        return prev.map((item) =>
          item.book.bookId === book.bookId
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { book, quantity: 1 }];
    });
  }

  function updateQuantity(bookId: number, quantity: number) {
    if (quantity <= 0) {
      setCart((prev) => prev.filter((item) => item.book.bookId !== bookId));
      return;
    }
    setCart((prev) =>
      prev.map((item) =>
        item.book.bookId === bookId ? { ...item, quantity } : item
      )
    );
  }

  function removeFromCart(bookId: number) {
    setCart((prev) => prev.filter((item) => item.book.bookId !== bookId));
  }

  return (
    <Routes>
      <Route
        path="/"
        element={
          <BookList
            cartItemCount={cartItemCount}
            cartSubtotal={cartSubtotal}
            onAddToCart={addToCart}
            onGoToCart={() => navigate("/cart")}
          />
        }
      />
      <Route
        path="/cart"
        element={
          <CartPage
            cart={cart}
            onUpdateQuantity={updateQuantity}
            onRemoveFromCart={removeFromCart}
          />
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
