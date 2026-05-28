// /contact — server page so we can export metadata. The interactive form
// lives in ./ContactForm (client island).

import Header from "../components/Header";
import Footer from "../components/Footer";
import PageHero from "../components/PageHero";
import ContactForm from "./ContactForm";

export const metadata = {
  title: "Contact — PixelScript",
  description: "Questions, partnerships, press, or feedback — we read every message.",
};

export default function ContactPage() {
  return (
    <>
      <Header />
      <main>
        <PageHero
          label="Contact us"
          title={
            <>
              Let's{" "}
              <em style={{ fontStyle: "italic", color: "var(--cobalt-2)", fontWeight: 400 }}>
                talk.
              </em>
            </>
          }
          sub="Questions, partnerships, press, or feedback — we read every message."
        />

        <section
          style={{
            padding: "20px 0 100px",
            position: "relative",
            zIndex: 2,
            background: "var(--bg)",
          }}
        >
          <div style={containerStyle}>
            <div className="ps-contact-grid" style={contactGridStyle}>
              <ContactForm />

              <aside
                style={{
                  background: "var(--surface)",
                  border: "1px solid var(--line)",
                  borderRadius: 18,
                  padding: "30px 26px",
                }}
              >
                <h3
                  style={{
                    fontFamily: "var(--serif)",
                    fontSize: "1.3rem",
                    fontWeight: 500,
                    marginBottom: 18,
                  }}
                >
                  Other ways to reach us
                </h3>
                <InfoRow
                  k="Email"
                  v={
                    <a href="mailto:hello@pixelscript.app" style={{ color: "var(--cobalt-2)" }}>
                      hello@pixelscript.app
                    </a>
                  }
                />
                <InfoRow
                  k="Support"
                  v={
                    <a href="mailto:support@pixelscript.app" style={{ color: "var(--cobalt-2)" }}>
                      support@pixelscript.app
                    </a>
                  }
                />
                <InfoRow k="Response" v="Usually within 1 business day" />
                <InfoRow k="Social" v="@pixelscript" last />
              </aside>
            </div>
          </div>
        </section>
      </main>
      <Footer />
      <style
        dangerouslySetInnerHTML={{
          __html: `
            @media (max-width: 980px) {
              .ps-contact-grid { grid-template-columns: 1fr !important; gap: 32px !important; }
            }
            .ps-field input:focus, .ps-field textarea:focus {
              border-color: var(--cobalt) !important;
              box-shadow: 0 0 0 3px rgba(74,108,255,0.15) !important;
            }
          `,
        }}
      />
    </>
  );
}

function InfoRow({ k, v, last }: { k: string; v: React.ReactNode; last?: boolean }) {
  return (
    <div
      style={{
        display: "flex",
        gap: 12,
        padding: "12px 0",
        borderBottom: last ? "none" : "1px solid var(--line)",
      }}
    >
      <div
        style={{
          fontFamily: "var(--mono)",
          fontSize: "0.72rem",
          textTransform: "uppercase",
          letterSpacing: "0.12em",
          color: "var(--text-faint)",
          width: 90,
          flexShrink: 0,
          paddingTop: 2,
        }}
      >
        {k}
      </div>
      <div style={{ color: "var(--text-dim)", fontSize: "0.95rem" }}>{v}</div>
    </div>
  );
}

const containerStyle: React.CSSProperties = {
  maxWidth: 1180,
  margin: "0 auto",
  padding: "0 40px",
};
const contactGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1.2fr 0.9fr",
  gap: 50,
  alignItems: "start",
};
