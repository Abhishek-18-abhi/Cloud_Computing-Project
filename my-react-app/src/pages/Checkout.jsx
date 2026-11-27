import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import logo from "../assets/logo.jpg";
import Navbar from "../components/Navbar";
import { useCart } from "../context/useCart";
import { useAuth } from "../context/useAuth";
import { formatPrice } from "../data/products";
import api from "../lib/api";

const WHATSAPP_NUMBER = "";


function calculateOrder(cart, subtotal) {
  const delivery = subtotal === 0 || subtotal >= 10000 ? 0 : 299;
  const platformFee = subtotal === 0 ? 0 : 49;

  return {
    delivery,
    platformFee,
    grandTotal: subtotal + delivery + platformFee,
  };
}

function Checkout() {
  const { user } = useAuth();
  const { cart, subtotal, clearCart } = useCart();
  const [customer, setCustomer] = useState(() => ({
    name: user?.user_metadata?.full_name || "",
    phone: user?.user_metadata?.phone || "",
    email: user?.email || "",
    address: "",
  }));
  const [paymentMethod, setPaymentMethod] = useState("UPI");
  const [paymentReference, setPaymentReference] = useState("");
  const [bill, setBill] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const order = useMemo(
    () => calculateOrder(cart, subtotal),
    [cart, subtotal]
  );

  function updateCustomer(field, value) {
    setCustomer((current) => ({ ...current, [field]: value }));
  }
  function printBill() {
    window.print();
  }

  function openWhatsAppOrder() {
    const lines = cart.map((item, index) => (
      `${index + 1}. ${item.name}\n` +
      `Brand: ${item.brand}\n` +
      `Price: ${formatPrice(item.price)}\n` +
      `Quantity: ${item.quantity}\n` +
      `Total: ${formatPrice(item.price * item.quantity)}`
    ));

    const message = [
      "I Want To Order",
      "",
      customer.name ? `Customer: ${customer.name}` : "",
      customer.phone ? `Phone: ${customer.phone}` : "",
      customer.address ? `Address: ${customer.address}` : "",
      "",
      "Products:",
      lines.join("\n\n"),
      "",
      `Subtotal: ${formatPrice(subtotal)}`,
      `Delivery: ${order.delivery === 0 ? "Free" : formatPrice(order.delivery)}`,
      `Platform Fee: ${formatPrice(order.platformFee)}`,
      `Grand Total: ${formatPrice(order.grandTotal)}`,
    ].filter(Boolean).join("\n");

    const baseUrl = WHATSAPP_NUMBER
      ? `https://wa.me/${WHATSAPP_NUMBER}`
      : "https://wa.me/8655414524";

    window.open(`${baseUrl}?text=${encodeURIComponent(message)}`, "_blank", "noopener,noreferrer");
  }

  async function generateBill(event) {
    event.preventDefault();
    setSubmitting(true);

    try {
      const response = await api.post("/orders", {
        customerName: customer.name,
        phone: customer.phone,
        email: customer.email,
        address: customer.address,
        paymentMethod,
        transactionId: paymentReference,
        items: cart.map((item) => ({
          productId: Number(item.id),
          quantity: Number(item.quantity),
        })),
      });

      const savedOrder = response.data.order;

      setBill({
        id: `EH-${savedOrder.order_id}`,
        date: new Date(savedOrder.created_at).toLocaleString("en-IN"),
        customer,
        paymentMethod,
        paymentReference: paymentReference || "Paid online",
        items: cart,
        subtotal,
        ...order,
      });
    } catch (error) {
      console.error("Order error:", error);
      const serverMessage = error.response?.data?.message;
      if (error.response?.status === 401) {
        alert("Your session has expired or you are not signed in. Please log in again.");
      } else if (serverMessage) {
        alert(serverMessage);
      } else {
        alert("Could not save the order. Please check your connection and try again.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (cart.length === 0 && !bill) {
    return (
      <>
        <Navbar />
        <main className="empty-cart">
          <h1>No products for checkout</h1>
          <p>Add products to cart before generating a bill.</p>
          <Link to="/products" className="shop-btn">Browse Products</Link>
        </main>
      </>
    );
  }

  return (
    <>
      <Navbar />

      <main className="checkout-page">
        <section className="checkout-title">
          <div>
            <span className="section-label">Checkout</span>
            <h1>Choose how to place the order</h1>
            <p>Send order details on WhatsApp or complete payment details and generate a bill.</p>
          </div>
        </section>

        {!bill ? (
          <section className="checkout-layout">
            <div className="checkout-options">
              <article className="checkout-option-card">
                <span className="option-number">Option 1</span>
                <h2>Order on WhatsApp</h2>
                <p>
                  Opens WhatsApp with product image links, names, prices,
                  quantities, customer details, and total amount.
                </p>

                <div className="checkout-preview-list">
                  {cart.map((item) => (
                    <div className="checkout-preview-item" key={item.id}>
                      <img src={item.img} alt={item.name} />
                      <div>
                        <strong>{item.name}</strong>
                        <span>{formatPrice(item.price)} x {item.quantity}</span>
                      </div>
                    </div>
                  ))}
                </div>

                <button className="whatsapp-btn" type="button" onClick={openWhatsAppOrder}>
                  Order on WhatsApp
                </button>
              </article>

              <article className="checkout-option-card">
                <span className="option-number">Option 2</span>
                <h2>Billing after payment</h2>
                <p>Enter customer and payment details, then generate a printable bill.</p>

                <form className="billing-form" onSubmit={generateBill}>
                  <label>
                    Customer name
                    <input
                      value={customer.name}
                      onChange={(event) => updateCustomer("name", event.target.value)}
                      required
                    />
                  </label>

                  <label>
                    Phone number
                    <input
                      value={customer.phone}
                      onChange={(event) => updateCustomer("phone", event.target.value)}
                      required
                    />
                  </label>

                  <label>
                    Email
                    <input
                      type="email"
                      value={customer.email}
                      onChange={(event) => updateCustomer("email", event.target.value)}
                    />
                  </label>

                  <label>
                    Payment method
                    <select
                      value={paymentMethod}
                      onChange={(event) => setPaymentMethod(event.target.value)}
                    >
                      <option>UPI</option>
                      <option>Card</option>
                      <option>Net Banking</option>
                      <option>Cash on Delivery</option>
                    </select>
                  </label>

                  <label className="wide-field">
                    Delivery address
                    <textarea
                      value={customer.address}
                      onChange={(event) => updateCustomer("address", event.target.value)}
                      required
                    />
                  </label>

                  <label className="wide-field">
                    Payment reference / transaction id
                    <input
                      value={paymentReference}
                      onChange={(event) => setPaymentReference(event.target.value)}
                      placeholder="Example: UPI123456789"
                    />
                  </label>

                  <button className="checkout-btn wide-field" type="submit">
                    {submitting ? "Saving Order..." : "Payment Done - Generate Bill"}
                  </button>
                </form>
              </article>
            </div>

            <aside className="checkout-box">
              <h2>Order Summary</h2>
              <div>
                <span>Subtotal</span>
                <strong>{formatPrice(subtotal)}</strong>
              </div>
              <div>
                <span>Delivery</span>
                <strong>{order.delivery === 0 ? "Free" : formatPrice(order.delivery)}</strong>
              </div>
              <div>
                <span>Platform fee</span>
                <strong>{formatPrice(order.platformFee)}</strong>
              </div>
              <div className="summary-total">
                <span>Total</span>
                <strong>{formatPrice(order.grandTotal)}</strong>
              </div>
            </aside>
          </section>
        ) : (
          <section className="bill-page">
            <div className="bill-actions">
              <button className="outline-btn print-action-btn" type="button" onClick={printBill}>
                🖨️ Print Official Bill / Invoice
              </button>
              <button className="remove-btn" type="button" onClick={clearCart}>
                Clear Cart
              </button>
            </div>

            <article className="bill-card official-tax-invoice">
              {/* Invoice Top Header */}
              <div className="invoice-header">
                <div className="invoice-brand">
                  <div className="invoice-brand-title">
                    <img src={logo} alt="ElectroHub Logo" className="invoice-logo" />
                    <div>
                      <h2>ELECTROHUB TECHNOLOGIES PVT. LTD.</h2>
                      <p className="invoice-subtitle">Authorized Electronics & Computer Systems Retailer</p>
                    </div>
                  </div>
                  <div className="invoice-company-details">
                    <p>Shop 104, City Tech Hub, Senapati Bapat Marg, Mumbai, MH - 400013</p>
                    <p><strong>GSTIN:</strong> 27AABCE1234F1Z8 | <strong>CIN:</strong> U72900MH2026PTC123456</p>
                    <p><strong>Support Phone:</strong> +91 86554 14524 | <strong>Email:</strong> support@electrohub.com</p>
                  </div>
                </div>

                <div className="invoice-meta-box">
                  <span className="tax-invoice-badge">TAX INVOICE / CASH BILL</span>
                  <div className="invoice-meta-item">
                    <span>Invoice No:</span>
                    <strong>{bill.id}</strong>
                  </div>
                  <div className="invoice-meta-item">
                    <span>Invoice Date:</span>
                    <strong>{bill.date}</strong>
                  </div>
                  <div className="invoice-meta-item">
                    <span>Payment Mode:</span>
                    <strong>{bill.paymentMethod}</strong>
                  </div>
                  <div className="invoice-status-stamp">
                    ✓ PAID &amp; VERIFIED
                  </div>
                </div>
              </div>

              {/* Customer & Shipping Details Grid */}
              <div className="invoice-party-grid">
                <div className="party-box billed-to">
                  <h3>BILLED TO (BUYER DETAILS)</h3>
                  <p><strong>Customer Name:</strong> {bill.customer.name}</p>
                  <p><strong>Contact Phone:</strong> {bill.customer.phone}</p>
                  {bill.customer.email && <p><strong>Email Address:</strong> {bill.customer.email}</p>}
                  <p><strong>Transaction Ref:</strong> {bill.paymentReference || "Paid Online (UPI/Card)"}</p>
                </div>

                <div className="party-box shipped-to">
                  <h3>SHIPPED &amp; DELIVERED TO</h3>
                  <p className="delivery-address-text">{bill.customer.address}</p>
                  <p><strong>Shipping Method:</strong> Express Doorstep Delivery</p>
                  <p><strong>Place of Supply:</strong> Maharashtra (27)</p>
                </div>
              </div>

              {/* Itemized Table */}
              <div className="invoice-items-table">
                <div className="inv-table-head">
                  <span className="col-sno">#</span>
                  <span className="col-desc">Product Description</span>
                  <span className="col-price">Unit Price</span>
                  <span className="col-qty">Qty</span>
                  <span className="col-total">Total (INR)</span>
                </div>

                <div className="inv-table-body">
                  {bill.items.map((item, index) => (
                    <div className="inv-table-row" key={item.id}>
                      <span className="col-sno">{index + 1}</span>
                      <span className="col-desc">
                        <strong>{item.name}</strong>
                        {item.brand && <small className="inv-item-brand">Brand: {item.brand}</small>}
                      </span>
                      <span className="col-price">{formatPrice(item.price)}</span>
                      <span className="col-qty">{item.quantity}</span>
                      <span className="col-total">{formatPrice(item.price * item.quantity)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Financial Summary Calculation */}
              <div className="invoice-financial-section">
                <div className="invoice-terms">
                  <h4>TERMS &amp; CONDITIONS OF SALE</h4>
                  <ol>
                    <li>All electronics products carry valid 1-year brand warranty from date of purchase.</li>
                    <li>7-day replacement guarantee against technical manufacturing defects.</li>
                    <li>Goods once sold can be returned/exchanged only with this original tax invoice.</li>
                    <li>This is a digitally generated tax invoice and requires no physical signature.</li>
                  </ol>
                </div>

                <div className="invoice-totals-table">
                  <div className="inv-total-row">
                    <span>Taxable Subtotal:</span>
                    <strong>{formatPrice(bill.subtotal)}</strong>
                  </div>
                  <div className="inv-total-row">
                    <span>Shipping / Delivery:</span>
                    <strong>{bill.delivery === 0 ? "FREE" : formatPrice(bill.delivery)}</strong>
                  </div>
                  <div className="inv-total-row">
                    <span>Platform &amp; Handling:</span>
                    <strong>{formatPrice(bill.platformFee)}</strong>
                  </div>
                  <div className="inv-total-row inv-grand-total">
                    <span>Grand Total:</span>
                    <strong>{formatPrice(bill.grandTotal)}</strong>
                  </div>
                  <p className="inv-inclusive-note">(All prices inclusive of applicable GST/taxes)</p>
                </div>
              </div>

              {/* Signatory Footer */}
              <div className="invoice-signatory-footer">
                <div className="invoice-greeting">
                  <p><strong>Thank you for choosing ElectroHub!</strong></p>
                  <p>For support or service requests, write to support@electrohub.com</p>
                </div>
                <div className="signatory-stamp-box">
                  <p className="signatory-company">For ELECTROHUB TECHNOLOGIES PVT. LTD.</p>
                  <div className="signatory-signature">Authorized Signatory</div>
                  <p className="signatory-note">[Digitally Verified Invoice]</p>
                </div>
              </div>
            </article>
          </section>
        )}
      </main>
    </>
  );
}

export default Checkout;
