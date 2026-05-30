import Link from 'next/link';

export default function CheckoutCancelPage() {
  return (
    <div style={{
      maxWidth: 600,
      margin: '80px auto',
      padding: '40px 24px',
      textAlign: 'center',
      fontFamily: 'inherit',
    }}>
      <h1 style={{
        fontFamily: 'Playfair Display, serif',
        fontSize: 32,
        marginBottom: 16,
        color: 'var(--text)',
      }}>
        Checkout cancelled
      </h1>
      <p style={{
        color: 'var(--text-dim)',
        fontSize: 16,
        lineHeight: 1.6,
        marginBottom: 32,
      }}>
        No charges were made. You can pick a plan whenever you're ready.
      </p>
      <Link
        href="/pricing"
        style={{
          display: 'inline-block',
          padding: '12px 32px',
          border: '1px solid var(--cobalt)',
          color: 'var(--cobalt)',
          borderRadius: 6,
          textDecoration: 'none',
          fontSize: 15,
        }}
      >
        ← Back to pricing
      </Link>
    </div>
  );
}
