import { useEffect, useRef, useState } from "react";
import { ArrowUpRight, Play, Zap, Palette, BarChart3, Shield, X, FileText, Cpu, AlertTriangle, CheckCircle } from "lucide-react";
import { motion, AnimatePresence } from 'framer-motion';



/* ── BlurText Component ── */
function BlurText({ text, className = "", delayMs = 100, splitBy = "words" }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVisible(true); }, { threshold: 0.1 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const parts = splitBy === "words" ? text.split(" ") : text.split("");

  return (
    <span ref={ref} className={className} style={{ display: "inline" }}>
      {parts.map((part, i) => (
        <span
          key={i}
          style={{
            display: "inline-block",
            filter: visible ? "blur(0px)" : "blur(10px)",
            opacity: visible ? 1 : 0,
            transform: visible ? "translateY(0)" : "translateY(50px)",
            transition: `filter 0.35s ease ${i * delayMs}ms, opacity 0.35s ease ${i * delayMs}ms, transform 0.35s ease ${i * delayMs}ms`,
          }}
        >
          {part}{splitBy === "words" ? "\u00A0" : ""}
        </span>
      ))}
    </span>
  );
}

/* ── HLS Video Component ── */
function HlsVideo({ src, style = {}, className = "" }) {
  const ref = useRef(null);

  useEffect(() => {
    const video = ref.current;
    if (!video) return;

    if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = src;
    } else {
      const script = document.createElement("script");
      script.src = "https://cdn.jsdelivr.net/npm/hls.js@1.6.15/dist/hls.min.js";
      script.onload = () => {
        if (window.Hls && window.Hls.isSupported()) {
          const hls = new window.Hls();
          hls.loadSource(src);
          hls.attachMedia(video);
        }
      };
      if (!document.querySelector('script[src*="hls.js"]')) {
        document.head.appendChild(script);
      } else if (window.Hls && window.Hls.isSupported()) {
        const hls = new window.Hls();
        hls.loadSource(src);
        hls.attachMedia(video);
      }
    }
  }, [src]);

  return (
    <video
      ref={ref}
      autoPlay
      loop
      muted
      playsInline
      style={style}
      className={className}
    />
  );
}

/* ── AnimatedSection wrapper ── */
function FadeSection({ children, style = {}, className = "" }) {
  const ref = useRef(null);
  const [vis, setVis] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVis(true); }, { threshold: 0.05 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return (
    <div ref={ref} className={className} style={{
      opacity: vis ? 1 : 0,
      transform: vis ? "translateY(0)" : "translateY(30px)",
      transition: "opacity 0.7s ease, transform 0.7s ease",
      ...style
    }}>
      {children}
    </div>
  );
}

/* ══════════════════════════════════════════════
   NAVBAR
══════════════════════════════════════════════ */
function Navbar({ onGetStarted }) {
  return (
    <nav style={{
      position: "fixed", top: 16, left: 0, right: 0, zIndex: 50,
      paddingLeft: 64, paddingRight: 64, display: "flex",
      alignItems: "center", justifyContent: "space-between",
    }}>
      {/* Logo */}
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{
          width: 36, height: 36, borderRadius: "50%",
          background: "rgba(255,255,255,0.15)",
          backdropFilter: "blur(10px)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontFamily: "'Instrument Serif', serif", fontStyle: "italic",
          fontSize: 16, color: "#fff", fontWeight: 400,
        }}>L</div>
        <span style={{ fontFamily: "'Instrument Serif', serif", fontStyle: "italic", fontSize: 18, color: "#fff" }}>LexAgent.</span>
      </div>

      {/* Nav Links pill */}
      <div className="liquid-glass" style={{
        borderRadius: 9999, padding: "4px 6px",
        display: "flex", alignItems: "center", gap: 4,
      }}>
        {[
          { name: "Home", href: "#home" },
          { name: "Features", href: "#features" },
          { name: "Security", href: "#security" },
          { name: "About", href: "#about" }
        ].map((item) => (
            <a key={item.name} href={item.href} style={{
              padding: "8px 12px", fontSize: 13, fontWeight: 500,
              color: "rgba(255,255,255,0.9)", fontFamily: "'Barlow', sans-serif",
              textDecoration: "none", borderRadius: 9999,
            }}>{item.name}</a>
          )
        )}
        <button 
          onClick={onGetStarted}
          style={{
            padding: "6px 14px", fontSize: 13, fontWeight: 600,
            background: "#fff", color: "#000", borderRadius: 9999,
            textDecoration: "none", display: "flex", alignItems: "center", gap: 4,
            fontFamily: "'Barlow', sans-serif", border: "none", cursor: "pointer"
          }}>
          Get Started <ArrowUpRight size={13} />
        </button>
      </div>

      <div style={{ width: 120 }} />
    </nav>
  );
}

/* ══════════════════════════════════════════════
   HERO
══════════════════════════════════════════════ */
function Hero({ onGetStarted, onShowDiagram }) {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setLoaded(true), 100);
    return () => clearTimeout(t);
  }, []);

  return (
    <section style={{ position: "relative", height: 1000, overflow: "visible" }}>
      {/* BG Video */}
      <video
        autoPlay loop muted playsInline
        onCanPlay={() => setLoaded(true)}
        style={{
          position: "absolute", left: 0, width: "100%", height: "auto",
          objectFit: "contain", zIndex: 0, top: "10%", opacity: 0.6
        }}
      >
        <source src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260307_083826_e938b29f-a43a-41ec-a153-3d4730578ab8.mp4" type="video/mp4" />
      </video>

      {/* Overlays */}
      <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 1 }} />
      <div style={{
        position: "absolute", bottom: 0, left: 0, right: 0, height: 300, zIndex: 2,
        background: "linear-gradient(to bottom, transparent, black)",
        pointerEvents: "none",
      }} />

      {/* Content */}
      <div style={{
        position: "relative", zIndex: 10, textAlign: "center",
        paddingTop: 150, paddingLeft: 24, paddingRight: 24,
        display: "flex", flexDirection: "column", alignItems: "center",
      }}>
        {/* Badge */}
        <div className="liquid-glass" style={{
          borderRadius: 9999, padding: "4px 4px",
          display: "inline-flex", alignItems: "center", gap: 8, marginBottom: 32,
          opacity: loaded ? 1 : 0, transition: "opacity 0.5s ease",
        }}>
          <span style={{
            background: "#fff", color: "#000", borderRadius: 9999,
            padding: "4px 12px", fontSize: 11, fontWeight: 700,
            fontFamily: "'Barlow', sans-serif",
          }}>New</span>
          <span style={{ fontSize: 12, color: "rgba(255,255,255,0.85)", paddingRight: 8, fontFamily: "'Barlow', sans-serif", fontWeight: 400 }}>
            Introducing Agentic Legal Review.
          </span>
        </div>

        {/* Heading */}
        <h1 style={{
          fontFamily: "'Instrument Serif', serif", fontStyle: "italic",
          fontSize: "clamp(3.5rem, 8vw, 5.5rem)", fontWeight: 400,
          color: "#fff", lineHeight: 0.85, maxWidth: 800,
          letterSpacing: "-3px", marginBottom: 28, textAlign: "center",
        }}>
          <BlurText text="Legal Automation Your Company Deserves" delayMs={100} />
        </h1>

        {/* Subtext */}
        <p style={{
          fontFamily: "'Barlow', sans-serif", fontWeight: 300,
          fontSize: 16, color: "#fff", lineHeight: 1.55, maxWidth: 520,
          marginBottom: 36, textAlign: "center",
          opacity: loaded ? 1 : 0,
          filter: loaded ? "blur(0px)" : "blur(10px)",
          transform: loaded ? "translateY(0)" : "translateY(20px)",
          transition: "opacity 0.6s ease 0.8s, filter 0.6s ease 0.8s, transform 0.6s ease 0.8s",
        }}>
          Automated analysis. Multi-Agent reasoning. Built by AI, trusted by counsel.<br />
          This is legal tech, wildly reimagined.
        </p>

        {/* CTA Buttons */}
        <div style={{
          display: "flex", alignItems: "center", gap: 16,
          opacity: loaded ? 1 : 0,
          filter: loaded ? "blur(0px)" : "blur(10px)",
          transform: loaded ? "translateY(0)" : "translateY(20px)",
          transition: "opacity 0.6s ease 1.1s, filter 0.6s ease 1.1s, transform 0.6s ease 1.1s",
        }}>
          <button 
            onClick={onGetStarted}
            className="liquid-glass-strong" style={{
              borderRadius: 9999, padding: "10px 24px", cursor: "pointer",
              display: "flex", alignItems: "center", gap: 8,
              fontSize: 15, fontWeight: 500, color: "#fff",
              fontFamily: "'Barlow', sans-serif", border: "none",
            }}>
            Get Started <ArrowUpRight size={17} />
          </button>
          <button 
            onClick={onShowDiagram}
            style={{
            background: "transparent", border: "none", cursor: "pointer",
            display: "flex", alignItems: "center", gap: 8,
            fontSize: 14, fontWeight: 400, color: "#fff",
            fontFamily: "'Barlow', sans-serif",
          }}>
            <Play size={14} fill="#fff" /> How it Works
          </button>
        </div>

        {/* Partners Bar */}
        <div style={{
          marginTop: 80, paddingBottom: 32,
          display: "flex", flexDirection: "column", alignItems: "center", gap: 20,
          opacity: loaded ? 1 : 0, transition: "opacity 0.6s ease 1.4s",
        }}>
          <div className="liquid-glass" style={{
            borderRadius: 9999, padding: "6px 16px",
            fontSize: 11, fontWeight: 400, color: "rgba(255,255,255,0.6)",
            fontFamily: "'Barlow', sans-serif",
          }}>
            Empowering modern legal teams
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 48, filter: "opacity(0.8)" }}>
            {["Stripe", "Linear", "Brex", "Vercel", "Ramp"].map(name => (
              <span key={name} style={{
                fontFamily: "'Instrument Serif', serif", fontStyle: "italic", fontWeight: 600,
                fontSize: "clamp(1.6rem, 3.5vw, 2.2rem)", color: "#fff",
                letterSpacing: "1px",
              }}>{name}</span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════════
   START SECTION
══════════════════════════════════════════════ */
function StartSection({ onGetStarted }) {
  return (
    <section style={{ position: "relative", minHeight: 600, overflow: "hidden" }}>
      <HlsVideo
        src="https://stream.mux.com/9JXDljEVWYwWu01PUkAemafDugK89o01BR6zqJ3aS9u00A.m3u8"
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity: 0.8 }}
      />
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 200, background: "linear-gradient(to bottom, black, transparent)", pointerEvents: "none", zIndex: 2 }} />
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 200, background: "linear-gradient(to top, black, transparent)", pointerEvents: "none", zIndex: 2 }} />

      <div style={{
        position: "relative", zIndex: 10, minHeight: 600,
        display: "flex", flexDirection: "column", alignItems: "center",
        justifyContent: "center", textAlign: "center", padding: "80px 24px",
        gap: 24,
      }}>
        <FadeSection>
          <div className="liquid-glass" style={{ borderRadius: 9999, padding: "6px 14px", display: "inline-block", fontSize: 12, fontWeight: 500, color: "#fff", fontFamily: "'Barlow', sans-serif", marginBottom: 16 }}>
            The Workflow
          </div>
          <h2 style={{ fontFamily: "'Instrument Serif', serif", fontStyle: "italic", fontSize: "clamp(2.5rem, 6vw, 4rem)", fontWeight: 400, color: "#fff", lineHeight: 0.9, letterSpacing: "-2px", marginBottom: 20 }}>
            Upload once.<br />Analyze forever.
          </h2>
          <p style={{ fontFamily: "'Barlow', sans-serif", fontWeight: 300, fontSize: 15, color: "rgba(255,255,255,0.6)", maxWidth: 420, lineHeight: 1.6, marginBottom: 32 }}>
            Our agents extract, summarize, and flag risks in real-time. Your contract lifecycle, optimized.
          </p>
          <button 
            onClick={onGetStarted}
            className="liquid-glass-strong" style={{
              borderRadius: 9999, padding: "12px 24px", cursor: "pointer",
              fontSize: 14, fontWeight: 500, color: "#fff",
              fontFamily: "'Barlow', sans-serif", border: "none",
              display: "inline-flex", alignItems: "center", gap: 8,
            }}>
            Launch Terminal <ArrowUpRight size={15} />
          </button>
        </FadeSection>
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════════
   FEATURES CHESS
══════════════════════════════════════════════ */
function FeaturesChess({ onGetStarted }) {
  const rows = [
    {
      title: "Designed for speed. Built for precision.",
      body: "Every risk flagged is rooted in legal logic. Our AI studies thousands of playbooks to ensure yours is always respected.",
      cta: "Explore Tech",
      gif: "https://motionsites.ai/assets/hero-finlytic-preview-CV9g0FHP.gif",
      reverse: false,
    },
    {
      title: "Agentic Reasoning. Human Control.",
      body: "Multi-agent workflows mean the Summarizer, the Risk Analyzer, and the Action Agent collaborate. You just give the final approval.",
      cta: "See Pipeline",
      gif: "https://motionsites.ai/assets/hero-wealth-preview-B70idl_u.gif",
      reverse: true,
    },
  ];

  return (
    <section style={{ padding: "120px 64px", maxWidth: 1200, margin: "0 auto" }}>
      <FadeSection style={{ textAlign: "center", marginBottom: 80 }}>
        <div className="liquid-glass" style={{ borderRadius: 9999, padding: "6px 14px", display: "inline-block", fontSize: 12, fontWeight: 500, color: "#fff", fontFamily: "'Barlow', sans-serif", marginBottom: 16 }}>
          Capabilities
        </div>
        <h2 style={{ fontFamily: "'Instrument Serif', serif", fontStyle: "italic", fontSize: "clamp(2.5rem, 5vw, 3.5rem)", fontWeight: 400, color: "#fff", lineHeight: 0.9, letterSpacing: "-2px" }}>
          Next-gen legal intelligence.
        </h2>
      </FadeSection>

      {rows.map((row, i) => (
        <FadeSection key={i} style={{
          display: "flex", flexDirection: row.reverse ? "row-reverse" : "row",
          alignItems: "center", gap: 64, marginBottom: 100,
        }}>
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 24 }}>
            <h3 style={{ fontFamily: "'Instrument Serif', serif", fontStyle: "italic", fontSize: "clamp(1.8rem, 3.5vw, 2.6rem)", fontWeight: 400, color: "#fff", lineHeight: 1.05, letterSpacing: "-1px" }}>
              {row.title}
            </h3>
            <p style={{ fontFamily: "'Barlow', sans-serif", fontWeight: 300, fontSize: 15, color: "rgba(255,255,255,0.6)", lineHeight: 1.7 }}>
              {row.body}
            </p>
            <div>
              <button 
                onClick={onGetStarted}
                className="liquid-glass-strong" style={{
                  borderRadius: 9999, padding: "10px 20px", cursor: "pointer",
                  fontSize: 13, fontWeight: 500, color: "#fff",
                  fontFamily: "'Barlow', sans-serif", border: "none",
                  display: "inline-flex", alignItems: "center", gap: 8,
                }}>
                {row.cta} <ArrowUpRight size={13} />
              </button>
            </div>
          </div>
          <div style={{ flex: 1 }}>
            <div className="liquid-glass" style={{ borderRadius: 16, overflow: "hidden", border: "1px solid rgba(255,255,255,0.1)" }}>
              <img
                src={row.gif}
                alt="Feature preview"
                style={{ width: "100%", height: "auto", display: "block", opacity: 0.9 }}
              />
            </div>
          </div>
        </FadeSection>
      ))}
    </section>
  );
}

/* ══════════════════════════════════════════════
   FEATURES GRID
══════════════════════════════════════════════ */
function FeaturesGrid() {
  const cards = [
    { Icon: Zap, title: "Instant Extraction", body: "Turn dense PDFs into actionable structured data in seconds. No manual typing required." },
    { Icon: Palette, title: "Premium Experience", body: "A dashboard designed for focus. High levels of craft in every interaction and view." },
    { Icon: BarChart3, title: "Risk Scoring", body: "AI models trained specifically on contract law to identify uncapped liabilities and anomalies." },
    { Icon: Shield, title: "Strict Compliance", body: "Enterprise isolation, zero data training on your docs, and world-class security standards." },
  ];

  return (
    <section style={{ padding: "80px 64px 120px", maxWidth: 1200, margin: "0 auto" }}>
      <FadeSection style={{ textAlign: "center", marginBottom: 60 }}>
        <div className="liquid-glass" style={{ borderRadius: 9999, padding: "6px 14px", display: "inline-block", fontSize: 12, fontWeight: 500, color: "#fff", fontFamily: "'Barlow', sans-serif", marginBottom: 16 }}>
          Platform
        </div>
        <h2 style={{ fontFamily: "'Instrument Serif', serif", fontStyle: "italic", fontSize: "clamp(2.5rem, 5vw, 3.5rem)", fontWeight: 400, color: "#fff", lineHeight: 0.9, letterSpacing: "-2px" }}>
          Everything legal teams need.
        </h2>
      </FadeSection>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 24 }}>
        {cards.map(({ Icon, title, body }, i) => (
          <FadeSection key={i} style={{ transitionDelay: `${i * 80}ms` }}>
            <div className="liquid-glass" style={{ borderRadius: 16, padding: 24 }}>
              <div className="liquid-glass-strong" style={{
                borderRadius: 9999, width: 40, height: 40,
                display: "flex", alignItems: "center", justifyContent: "center",
                marginBottom: 16,
              }}>
                <Icon size={16} color="#fff" />
              </div>
              <h4 style={{ fontFamily: "'Barlow', sans-serif", fontWeight: 600, fontSize: 15, color: "#fff", marginBottom: 10 }}>
                {title}
              </h4>
              <p style={{ fontFamily: "'Barlow', sans-serif", fontWeight: 300, fontSize: 13, color: "rgba(255,255,255,0.6)", lineHeight: 1.65 }}>
                {body}
              </p>
            </div>
          </FadeSection>
        ))}
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════════
   STATS
══════════════════════════════════════════════ */
function Stats() {
  const stats = [
    { value: "5,000+", label: "Contracts analyzed" },
    { value: "99.2%", label: "Extraction accuracy" },
    { value: "4.5x", label: "Faster review cycles" },
    { value: "100%", label: "Data privacy" },
  ];

  return (
    <section style={{ position: "relative", minHeight: 400, overflow: "hidden" }}>
      <HlsVideo
        src="https://stream.mux.com/NcU3HlHeF7CUL86azTTzpy3Tlb00d6iF3BmCdFslMJYM.m3u8"
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", filter: "saturate(0)", opacity: 0.5 }}
      />
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 200, background: "linear-gradient(to bottom, black, transparent)", pointerEvents: "none", zIndex: 2 }} />
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 200, background: "linear-gradient(to top, black, transparent)", pointerEvents: "none", zIndex: 2 }} />

      <div style={{ position: "relative", zIndex: 10, padding: "80px 64px", display: "flex", justifyContent: "center" }}>
        <FadeSection style={{ width: "100%", maxWidth: 900 }}>
          <div className="liquid-glass" style={{ borderRadius: 24, padding: "48px 64px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 40, textAlign: "center" }}>
              {stats.map(({ value, label }) => (
                <div key={label}>
                  <div style={{ fontFamily: "'Instrument Serif', serif", fontStyle: "italic", fontSize: "clamp(2.5rem, 5vw, 4rem)", fontWeight: 400, color: "#fff", lineHeight: 1 }}>
                    {value}
                  </div>
                  <div style={{ fontFamily: "'Barlow', sans-serif", fontWeight: 300, fontSize: 13, color: "rgba(255,255,255,0.6)", marginTop: 8 }}>
                    {label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </FadeSection>
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════════
   TESTIMONIALS
══════════════════════════════════════════════ */
function Testimonials() {
  const testimonials = [
    { quote: "LexAgent transformed our quarterly review process from weeks to days. The AI flags what we actually care about.", name: "David Thorne", role: "General Counsel, Linear" },
    { quote: "The most intuitive legal interface I've used. It feels like it was designed by people who actually understand contracts.", name: "Sarah Miller", role: "Legal Ops, Stripe" },
    { quote: "Accuracy is the only metric that matters in legal tech. LexAgent delivers it with a premium touch.", name: "James Wilson", role: "Partner, Wilson & Co" },
  ];

  return (
    <section style={{ padding: "120px 64px", maxWidth: 1200, margin: "0 auto" }}>
      <FadeSection style={{ textAlign: "center", marginBottom: 60 }}>
        <div className="liquid-glass" style={{ borderRadius: 9999, padding: "6px 14px", display: "inline-block", fontSize: 12, fontWeight: 500, color: "#fff", fontFamily: "'Barlow', sans-serif", marginBottom: 16 }}>
          Testimonials
        </div>
        <h2 style={{ fontFamily: "'Instrument Serif', serif", fontStyle: "italic", fontSize: "clamp(2.5rem, 5vw, 3.5rem)", fontWeight: 400, color: "#fff", lineHeight: 0.9, letterSpacing: "-2px" }}>
          Trusted by the best.
        </h2>
      </FadeSection>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 24 }}>
        {testimonials.map(({ quote, name, role }, i) => (
          <FadeSection key={i} style={{ transitionDelay: `${i * 100}ms` }}>
            <div className="liquid-glass" style={{ borderRadius: 16, padding: 32, display: "flex", flexDirection: "column", gap: 20, height: "100%" }}>
              <p style={{ fontFamily: "'Barlow', sans-serif", fontWeight: 300, fontSize: 14, color: "rgba(255,255,255,0.8)", fontStyle: "italic", lineHeight: 1.7, flex: 1 }}>
                "{quote}"
              </p>
              <div>
                <div style={{ fontFamily: "'Barlow', sans-serif", fontWeight: 500, fontSize: 13, color: "#fff" }}>{name}</div>
                <div style={{ fontFamily: "'Barlow', sans-serif", fontWeight: 300, fontSize: 12, color: "rgba(255,255,255,0.5)", marginTop: 2 }}>{role}</div>
              </div>
            </div>
          </FadeSection>
        ))}
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════════
   CTA + FOOTER
══════════════════════════════════════════════ */
function CtaFooter({ onGetStarted }) {
  return (
    <section style={{ position: "relative", overflow: "hidden", minHeight: 600 }}>
      <HlsVideo
        src="https://stream.mux.com/8wrHPCX2dC3msyYU9ObwqNdm00u3ViXvOSHUMRYSEe5Q.m3u8"
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity: 0.7 }}
      />
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 200, background: "linear-gradient(to bottom, black, transparent)", pointerEvents: "none", zIndex: 2 }} />
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 200, background: "linear-gradient(to top, black, transparent)", pointerEvents: "none", zIndex: 2 }} />

      <div style={{
        position: "relative", zIndex: 10,
        padding: "120px 64px 64px",
        display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center",
      }}>
        <FadeSection>
          <h2 style={{ fontFamily: "'Instrument Serif', serif", fontStyle: "italic", fontSize: "clamp(3rem, 7vw, 5.5rem)", fontWeight: 400, color: "#fff", lineHeight: 0.85, letterSpacing: "-3px", marginBottom: 28, maxWidth: 680 }}>
            Automate your legal workflow today.
          </h2>
          <p style={{ fontFamily: "'Barlow', sans-serif", fontWeight: 300, fontSize: 15, color: "rgba(255,255,255,0.65)", maxWidth: 460, lineHeight: 1.65, marginBottom: 40 }}>
            Join hundreds of forward-thinking companies using LexAgent to scale their legal operations safely.
          </p>

          <div style={{ display: "flex", alignItems: "center", gap: 16, justifyContent: "center" }}>
            <button 
              onClick={onGetStarted}
              className="liquid-glass-strong" style={{
                borderRadius: 9999, padding: "12px 24px", cursor: "pointer",
                fontSize: 14, fontWeight: 500, color: "#fff",
                fontFamily: "'Barlow', sans-serif", border: "none",
                display: "inline-flex", alignItems: "center", gap: 8,
              }}>
              Get Started Now <ArrowUpRight size={15} />
            </button>
            <button 
              onClick={onGetStarted}
              style={{
                borderRadius: 9999, padding: "12px 24px", cursor: "pointer",
                fontSize: 14, fontWeight: 500, color: "#000",
                fontFamily: "'Barlow', sans-serif", border: "none",
                background: "#fff",
              }}>
              Sign In
            </button>
          </div>
        </FadeSection>

        {/* Footer bar */}
        <div style={{
          marginTop: 128, paddingTop: 32,
          borderTop: "1px solid rgba(255,255,255,0.1)",
          width: "100%", maxWidth: 1200,
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <span style={{ fontFamily: "'Barlow', sans-serif", fontWeight: 300, fontSize: 12, color: "rgba(255,255,255,0.4)" }}>
            © 2024 LexAgent. Built for the future of law.
          </span>
          <div style={{ display: "flex", gap: 24 }}>
            {["Security", "Privacy", "API Docs"].map(link => (
              <a key={link} href="#" style={{
                fontFamily: "'Barlow', sans-serif", fontWeight: 300, fontSize: 12,
                color: "rgba(255,255,255,0.4)", textDecoration: "none",
              }}>{link}</a>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════════
   DIAGRAM MODAL
══════════════════════════════════════════════ */
function DiagramModal({ isOpen, onClose }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            onClick={(e) => e.stopPropagation()}
            className="liquid-glass border border-white/20 rounded-3xl w-full max-w-4xl p-8 relative overflow-hidden flex flex-col items-center"
          >
            <button 
              onClick={onClose}
              className="absolute top-6 right-6 text-slate-400 hover:text-white transition-colors bg-transparent border-none cursor-pointer"
            >
              <X size={24} />
            </button>
            
            <h2 className="font-heading text-4xl text-white italic mb-2">How LexAgent Works</h2>
            <p className="text-slate-400 font-sans mb-12">The autonomous legal reasoning pipeline.</p>

            {/* Diagram */}
            <div className="w-full flex flex-col md:flex-row items-center justify-between gap-6 md:gap-0 relative py-8">
              {/* Connecting Line (Desktop) */}
              <div className="hidden md:block absolute top-[50%] left-[10%] right-[10%] h-[2px] bg-gradient-to-r from-legal-blue via-legal-cyan to-legal-blue -z-10 opacity-50 translate-y-[-16px]" />
              
              {/* Node 1 */}
              <div className="flex flex-col items-center z-10 w-32">
                <div className="w-16 h-16 rounded-2xl bg-black border border-white/20 shadow-[0_0_20px_rgba(255,255,255,0.1)] flex items-center justify-center mb-4">
                  <FileText className="text-white" size={28} />
                </div>
                <div className="text-white font-semibold font-sans text-center">Document Upload</div>
                <div className="text-slate-400 text-xs text-center mt-2 leading-relaxed">Contracts ingested securely</div>
              </div>

              {/* Arrow */}
              <div className="text-legal-cyan md:-mt-10 rotate-90 md:rotate-0"><ArrowUpRight size={24} className="md:rotate-45" /></div>

              {/* Node 2 */}
              <div className="flex flex-col items-center z-10 w-32">
                <div className="w-16 h-16 rounded-2xl bg-legal-blue shadow-[0_0_30px_rgba(91,192,190,0.3)] border border-legal-cyan/30 flex items-center justify-center mb-4 relative">
                  <div className="absolute inset-0 rounded-2xl bg-legal-cyan/20 animate-ping opacity-20" />
                  <Cpu className="text-legal-cyan" size={28} />
                </div>
                <div className="text-white font-semibold font-sans text-center">Multi-Agent AI</div>
                <div className="text-slate-400 text-xs text-center mt-2 leading-relaxed">Specialized agents summarize & extract</div>
              </div>

              {/* Arrow */}
              <div className="text-legal-cyan md:-mt-10 rotate-90 md:rotate-0"><ArrowUpRight size={24} className="md:rotate-45" /></div>

              {/* Node 3 */}
              <div className="flex flex-col items-center z-10 w-32">
                <div className="w-16 h-16 rounded-2xl bg-black border border-yellow-500/30 flex items-center justify-center mb-4 shadow-[0_0_20px_rgba(234,179,8,0.1)]">
                  <AlertTriangle className="text-yellow-500" size={28} />
                </div>
                <div className="text-white font-semibold font-sans text-center">Risk Flagging</div>
                <div className="text-slate-400 text-xs text-center mt-2 leading-relaxed">Anomalies & liabilities found</div>
              </div>

              {/* Arrow */}
              <div className="text-legal-cyan md:-mt-10 rotate-90 md:rotate-0"><ArrowUpRight size={24} className="md:rotate-45" /></div>

              {/* Node 4 */}
              <div className="flex flex-col items-center z-10 w-32">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-legal-cyan to-legal-teal flex items-center justify-center mb-4 shadow-lg shadow-legal-cyan/20">
                  <CheckCircle className="text-black" size={28} />
                </div>
                <div className="text-white font-semibold font-sans text-center">Human Approval</div>
                <div className="text-slate-400 text-xs text-center mt-2 leading-relaxed">Final sign-off by counsel</div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ══════════════════════════════════════════════
   LANDING PAGE COMPONENT
══════════════════════════════════════════════ */
export default function LandingPage({ onGetStarted }) {
  const [isDiagramOpen, setIsDiagramOpen] = useState(false);

  return (
    <>
      <DiagramModal isOpen={isDiagramOpen} onClose={() => setIsDiagramOpen(false)} />
      <div style={{ background: "#000", minHeight: "100vh" }}>
        <div style={{ position: "relative", zIndex: 10 }}>
          <Navbar onGetStarted={onGetStarted} />
          <div id="home">
            <Hero onGetStarted={onGetStarted} onShowDiagram={() => setIsDiagramOpen(true)} />
          </div>
          <div style={{ background: "#000" }}>
            <StartSection onGetStarted={onGetStarted} />
            <div id="features">
              <FeaturesChess onGetStarted={onGetStarted} />
              <FeaturesGrid />
            </div>
            <div id="security">
              <Stats />
            </div>
            <div id="about">
              <Testimonials />
              <CtaFooter onGetStarted={onGetStarted} />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
