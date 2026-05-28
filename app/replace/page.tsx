"use client";
import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";

const FONTS = [
  { id: "dancing-script", name: "Dancing Script", css: "Dancing Script", category: "Script" },
  { id: "pacifico", name: "Pacifico", css: "Pacifico", category: "Script" },
  { id: "lobster", name: "Lobster", css: "Lobster", category: "Script" },
  { id: "caveat", name: "Caveat", css: "Caveat", category: "Script" },
  { id: "satisfy", name: "Satisfy", css: "Satisfy", category: "Script" },
  { id: "kalam", name: "Kalam", css: "Kalam", category: "Script" },
  { id: "patrick-hand", name: "Patrick Hand", css: "Patrick Hand", category: "Script" },
  { id: "indie-flower", name: "Indie Flower", css: "Indie Flower", category: "Script" },
  { id: "shadows-into-light", name: "Shadows Into Light", css: "Shadows Into Light", category: "Script" },
  { id: "sacramento", name: "Sacramento", css: "Sacramento", category: "Script" },
  { id: "great-vibes", name: "Great Vibes", css: "Great Vibes", category: "Script" },
  { id: "pinyon-script", name: "Pinyon Script", css: "Pinyon Script", category: "Script" },
  { id: "rock-salt", name: "Rock Salt", css: "Rock Salt", category: "Script" },
  { id: "permanent-marker", name: "Permanent Marker", css: "Permanent Marker", category: "Script" },
  { id: "playfair-display", name: "Playfair Display", css: "Playfair Display", category: "Serif" },
  { id: "lora", name: "Lora", css: "Lora", category: "Serif" },
  { id: "josefin-sans", name: "Josefin Sans", css: "Josefin Sans", category: "Serif" },
  { id: "nunito", name: "Nunito", css: "Nunito", category: "Serif" },
  { id: "philosopher", name: "Philosopher", css: "Philosopher", category: "Serif" },
  { id: "cormorant-garamond", name: "Cormorant Garamond", css: "Cormorant Garamond", category: "Serif" },
  { id: "libre-baskerville", name: "Libre Baskerville", css: "Libre Baskerville", category: "Serif" },
  { id: "crimson-text", name: "Crimson Text", css: "Crimson Text", category: "Serif" },
  { id: "abril-fatface", name: "Abril Fatface", css: "Abril Fatface", category: "Display" },
  { id: "bebas-neue", name: "Bebas Neue", css: "Bebas Neue", category: "Display" },
  { id: "oswald", name: "Oswald", css: "Oswald", category: "Display" },
  { id: "righteous", name: "Righteous", css: "Righteous", category: "Display" },
  { id: "alfa-slab-one", name: "Alfa Slab One", css: "Alfa Slab One", category: "Display" },
  { id: "fjalla-one", name: "Fjalla One", css: "Fjalla One", category: "Display" },
  { id: "yanone-kaffeesatz", name: "Yanone Kaffeesatz", css: "Yanone Kaffeesatz", category: "Display" },
  { id: "special-elite", name: "Special Elite", css: "Special Elite", category: "Display" },
  { id: "courier-prime", name: "Courier Prime", css: "Courier Prime", category: "Display" },
  { id: "raleway", name: "Raleway", css: "Raleway", category: "Sans" },
  { id: "quicksand", name: "Quicksand", css: "Quicksand", category: "Sans" },
  { id: "comfortaa", name: "Comfortaa", css: "Comfortaa", category: "Sans" },
];

const CATEGORIES = ["All", "Script", "Serif", "Display", "Sans"];
type Stage = "upload" | "processing" | "ready" | "replacing" | "done";

export default function Home() {
  const [stage, setStage] = useState<Stage>("upload");
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [outputImage, setOutputImage] = useState<string | null>(null);
  const [selectedFont, setSelectedFont] = useState(FONTS[0]);
  const [category, setCategory] = useState("All");
  const [regions, setRegions] = useState<any[]>([]);
  const [fileId, setFileId] = useState<string | null>(null);
  const [showOriginal, setShowOriginal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [humanizedImage, setHumanizedImage] = useState<string | null>(null)
  const [humanizing, setHumanizing] = useState(false)

  const onDrop = useCallback(async (files: File[]) => {
    const file = files[0];
    if (!file) return;
    setOriginalImage(URL.createObjectURL(file));
    setStage("processing");
    setError(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("http://localhost:8002/api/upload", { method: "POST", body: formData });
      const data = await res.json();
      setFileId(data.file_id);
      const processRes = await fetch("http://localhost:8002/api/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ file_id: data.file_id }),
      });
      const processData = await processRes.json();
      setRegions(processData.regions || []);
      setStage("ready");
    } catch (e) {
      setError("Upload failed. Make sure the backend is running.");
      setStage("upload");
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [".png", ".jpg", ".jpeg", ".webp"] },
    maxFiles: 1,
  });

  const applyFont = async () => {
    if (!fileId) return;
    setStage("replacing");
    setError(null);
    try {
      const res = await fetch("http://localhost:8002/api/replace-font", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ file_id: fileId, font_name: selectedFont.id }),
      });
      const data = await res.json();
      setOutputImage(`http://localhost:8002${data.output_url}?t=${Date.now()}`);
      setStage("done");
    } catch (e) {
      setError("Font replacement failed. Please try again.");
      setStage("ready");
    }
  };

  async function handleHumanize(style: string) {
    setHumanizing(true)
    const res = await fetch("http://localhost:8002/api/humanize", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ file_id: fileId, style })
    })
    const data = await res.json()
    setHumanizedImage("http://localhost:8002" + data.output_url + "?t=" + Date.now())
    setHumanizing(false)
  }

  const reset = () => {
    setStage("upload"); setOriginalImage(null); setOutputImage(null);
    setRegions([]); setFileId(null); setError(null); setShowOriginal(false);
  };

  const filteredFonts = category === "All" ? FONTS : FONTS.filter(f => f.category === category);

  return (
    <>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Dancing+Script&family=Pacifico&family=Lobster&family=Caveat&family=Satisfy&family=Kalam&family=Patrick+Hand&family=Indie+Flower&family=Shadows+Into+Light&family=Sacramento&family=Great+Vibes&family=Pinyon+Script&family=Rock+Salt&family=Permanent+Marker&family=Playfair+Display&family=Lora&family=Josefin+Sans&family=Nunito&family=Philosopher&family=Cormorant+Garamond&family=Libre+Baskerville&family=Crimson+Text&family=Abril+Fatface&family=Bebas+Neue&family=Oswald&family=Righteous&family=Alfa+Slab+One&family=Fjalla+One&family=Yanone+Kaffeesatz&family=Special+Elite&family=Courier+Prime&family=Raleway&family=Quicksand&family=Comfortaa&display=swap');
      `}</style>
      <div style={{ minHeight: "100vh", background: "#0f0f1a", color: "white", fontFamily: "system-ui, sans-serif" }}>
      <div style={{ borderBottom: "1px solid #1e1e3a", padding: "16px 32px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 32, height: 32, background: "linear-gradient(135deg, #1A56DB, #E74694)", borderRadius: 8 }} />
          <span style={{ fontSize: 20, fontWeight: 700, color: "#1A56DB" }}>PixelScript</span>
        </div>
        <span style={{ fontSize: 12, color: "#6B7280", background: "#1e1e3a", padding: "4px 10px", borderRadius: 20 }}>Beta</span>
      </div>

      {stage === "upload" && (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "80vh", padding: 32 }}>
          <h1 style={{ fontSize: 42, fontWeight: 800, textAlign: "center", marginBottom: 12, background: "linear-gradient(135deg, #ffffff, #1A56DB)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            Replace every font in your AI image
          </h1>
          <p style={{ color: "#9CA3AF", fontSize: 18, marginBottom: 48, textAlign: "center" }}>
            Upload any AI-generated image — one click changes all text to your chosen font
          </p>
          {error && <div style={{ color: "#E74694", marginBottom: 16 }}>{error}</div>}
          <div {...getRootProps()} style={{
            width: "100%", maxWidth: 560, border: `2px dashed ${isDragActive ? "#1A56DB" : "#2d2d4a"}`,
            borderRadius: 16, padding: "60px 40px", textAlign: "center", cursor: "pointer",
            background: isDragActive ? "#1a1a3a" : "#13131f", transition: "all 0.2s"
          }}>
            <input {...getInputProps()} />
            <div style={{ fontSize: 48, marginBottom: 16 }}>🖼️</div>
            <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>
              {isDragActive ? "Drop your image here" : "Drag & drop your AI image"}
            </div>
            <div style={{ color: "#6B7280", fontSize: 14, marginBottom: 24 }}>PNG, JPG, WebP supported</div>
            <div style={{ background: "#1A56DB", color: "white", padding: "12px 32px", borderRadius: 8, display: "inline-block", fontWeight: 600 }}>
              Choose Image
            </div>
          </div>
          <div style={{ display: "flex", gap: 32, marginTop: 48, color: "#6B7280", fontSize: 14 }}>
            <span>✓ ChatGPT images</span>
            <span>✓ Midjourney</span>
            <span>✓ Gemini</span>
          </div>
        </div>
      )}

      {stage === "processing" && (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "80vh" }}>
          <div style={{ fontSize: 48, marginBottom: 24 }}>🔍</div>
          <div style={{ fontSize: 22, fontWeight: 600, marginBottom: 8 }}>Scanning your image...</div>
          <div style={{ color: "#6B7280" }}>Finding all text regions</div>
        </div>
      )}

      {(stage === "ready" || stage === "replacing" || stage === "done") && (
        <div style={{ display: "grid", gridTemplateColumns: "260px 1fr", height: "calc(100vh - 65px)" }}>
          <div style={{ borderRight: "1px solid #1e1e3a", overflowY: "auto", padding: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: "#6B7280", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 12 }}>Font Library</div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 16 }}>
              {CATEGORIES.map(cat => (
                <button key={cat} onClick={() => setCategory(cat)} style={{
                  padding: "4px 10px", borderRadius: 20, border: "none", cursor: "pointer", fontSize: 12,
                  background: category === cat ? "#1A56DB" : "#1e1e3a",
                  color: category === cat ? "white" : "#9CA3AF"
                }}>{cat}</button>
              ))}
            </div>
            {filteredFonts.map(font => (
              <div key={font.id} onClick={() => setSelectedFont(font)} style={{
                padding: 12, borderRadius: 10, marginBottom: 8, cursor: "pointer",
                background: selectedFont.id === font.id ? "#1a2a4a" : "#13131f",
                border: `1px solid ${selectedFont.id === font.id ? "#1A56DB" : "#1e1e3a"}`,
              }}>
                <div style={{ fontSize: 15, fontWeight: 600, color: selectedFont.id === font.id ? "#60A5FA" : "white", fontFamily: `${font.css}, system-ui, sans-serif` }}>{font.name}</div>
                <div style={{ fontSize: 11, color: "#6B7280" }}>{font.category}</div>
              </div>
            ))}
          </div>

          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ padding: "12px 20px", borderBottom: "1px solid #1e1e3a", display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ fontSize: 13, color: "#9CA3AF" }}>{regions.length} text region{regions.length !== 1 ? "s" : ""} detected</span>
              {stage === "done" && (
                <button onClick={() => setShowOriginal(!showOriginal)} style={{
                  padding: "6px 14px", borderRadius: 6, border: "1px solid #2d2d4a",
                  background: "transparent", color: "#9CA3AF", cursor: "pointer", fontSize: 12
                }}>{showOriginal ? "Show Result" : "Show Original"}</button>
              )}
              <div style={{ marginLeft: "auto", display: "flex", gap: 10 }}>
                {stage === "done" && (
                  <a href={outputImage!} download="pixelscript-output.png" style={{
                    padding: "8px 20px", borderRadius: 8, background: "#057A55",
                    color: "white", textDecoration: "none", fontSize: 13, fontWeight: 600
                  }}>⬇ Download</a>
                )}
                <button onClick={reset} style={{
                  padding: "8px 16px", borderRadius: 8, border: "1px solid #2d2d4a",
                  background: "transparent", color: "#9CA3AF", cursor: "pointer", fontSize: 13
                }}>New Image</button>
              </div>
            </div>
            <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: 24, background: "#0a0a14" }}>
              {originalImage && (
                <img src={stage === "done" && !showOriginal ? outputImage! : originalImage}
                  alt="preview" style={{ maxWidth: "100%", maxHeight: "100%", borderRadius: 12, boxShadow: "0 20px 60px rgba(0,0,0,0.5)" }} />
              )}
            </div>
            {stage === "done" && (
              <div className="humanize-panel">
                <h3>Humanize Style</h3>
                <div className="style-buttons">
                  {["watercolor","sketch","oil_painting","flat_art","vintage"].map(style => (
                    <button key={style} onClick={() => handleHumanize(style)} disabled={humanizing}>
                      {style.replace("_"," ").replace(/\b\w/g, c => c.toUpperCase())}
                    </button>
                  ))}
                </div>
                {humanizing && <p>Applying style...</p>}
                {humanizedImage && <img src={humanizedImage} alt="Humanized output" />}
              </div>
            )}
            <div style={{ padding: "16px 20px", borderTop: "1px solid #1e1e3a", display: "flex", alignItems: "center", gap: 16 }}>
              {error && <span style={{ color: "#E74694", fontSize: 13 }}>{error}</span>}
              <div style={{ flex: 1 }}>
                <span style={{ fontSize: 13, color: "#9CA3AF" }}>Selected: </span>
                <span style={{ fontSize: 13, fontWeight: 600, color: "#60A5FA" }}>{selectedFont.name}</span>
              </div>
              <button onClick={applyFont} disabled={stage === "replacing"} style={{
                padding: "12px 32px", borderRadius: 10, border: "none", cursor: stage === "replacing" ? "wait" : "pointer",
                background: stage === "replacing" ? "#2d2d4a" : "linear-gradient(135deg, #1A56DB, #E74694)",
                color: "white", fontSize: 15, fontWeight: 700
              }}>
                {stage === "replacing" ? "Replacing fonts..." : stage === "done" ? "✓ Font Replaced" : "Replace All Fonts →"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    </>
  );
}
