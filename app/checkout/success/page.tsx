import Link from 'next/link';

export default function CheckoutSuccessPage() {
  return (
    <div style={{
      maxWidth: 600,
      margin: '80px auto',
      padding: '40px 24px',
      textAlign: 'center',
      fontFamily: 'inherit',
    }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>✓</div>
      <h1 style={{
        fontFamily: 'Playfair Display, serif',
        fontSize: 36,
        marginBottom: 16,
        color: 'var(--text)',
      }}>
        Welcome to Metanoia
      </h1>
      <p style={{
        color: 'var(--text-dim)',
        fontSize: 16,
        lineHeight: 1.6,
        marginBottom: 32,
      }}>
        Your subscription is being activated. It usually takes a few seconds.
        If your plan tier doesn't update immediately when you start designing,
        give it a minute and refresh.
      </p>
      <Link
        href="/chat"
        style={{
          display: 'inline-block',
          padding: '12px 32px',
          background: 'var(--cobalt)',
          color: 'white',
          borderRadius: 6,
          textDecoration: 'none',
          fontSize: 15,
        }}
      >
        Start designing →
      </Link>
    </div>
  );
}
