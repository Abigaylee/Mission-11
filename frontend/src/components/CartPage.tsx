import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import type { CartItem } from "../types";

type CartPageProps = {
  cart: CartItem[];
  onUpdateQuantity: (bookId: number, quantity: number) => void;
  onRemoveFromCart: (bookId: number) => void;
};

export default function CartPage({
  cart,
  onUpdateQuantity,
  onRemoveFromCart,
}: CartPageProps) {
  const navigate = useNavigate();

  const summary = useMemo(() => {
    const totalQuantity = cart.reduce((sum, item) => sum + item.quantity, 0);
    const subtotal = cart.reduce(
      (sum, item) => sum + Number(item.book.price) * item.quantity,
      0
    );
    return {
      totalQuantity,
      subtotal,
      total: subtotal,
    };
  }, [cart]);

  return (
    <div className="container py-3">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h1 className="h3 mb-0">Your Cart</h1>
        <button
          className="btn btn-outline-secondary btn-sm"
          type="button"
          onClick={() => navigate("/")}
        >
          Continue Shopping
        </button>
      </div>

      {cart.length === 0 ? (
        <div className="alert alert-info">Your cart is empty.</div>
      ) : (
        <>
          <div className="table-responsive">
            <table className="table table-striped table-hover align-middle">
              <thead>
                <tr>
                  <th>Book</th>
                  <th className="text-end">Price</th>
                  <th style={{ width: "150px" }}>Quantity</th>
                  <th className="text-end">Subtotal</th>
                  <th className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {cart.map((item) => (
                  <tr key={item.book.bookId}>
                    <td>
                      <div className="fw-semibold">{item.book.title}</div>
                      <small className="text-muted">{item.book.author}</small>
                    </td>
                    <td className="text-end">${item.book.price.toFixed(2)}</td>
                    <td>
                      <input
                        type="number"
                        min={1}
                        className="form-control form-control-sm"
                        value={item.quantity}
                        onChange={(e) =>
                          onUpdateQuantity(item.book.bookId, Number(e.target.value))
                        }
                      />
                    </td>
                    <td className="text-end">
                      ${(item.book.price * item.quantity).toFixed(2)}
                    </td>
                    <td className="text-end">
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-danger"
                        onClick={() => onRemoveFromCart(item.book.bookId)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="d-flex justify-content-end">
            <div className="card p-3 bg-light">
              <div>
                <strong>Total Items:</strong> {summary.totalQuantity}
              </div>
              <div>
                <strong>Subtotal:</strong> ${summary.subtotal.toFixed(2)}
              </div>
              <div>
                <strong>Total:</strong> ${summary.total.toFixed(2)}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

