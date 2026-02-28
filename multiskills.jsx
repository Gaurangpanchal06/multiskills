import { useState, useEffect, useRef } from "react";

const CATEGORIES = {
  Money: {
    icon: "◈",
    color: "#C8A96E",
    bg: "rgba(200,169,110,0.08)",
    border: "rgba(200,169,110,0.25)",
    desc: "Skills with income potential",
  },
  Soul: {
    icon: "◎",
    color: "#7EB8A4",
    bg: "rgba(126,184,164,0.08)",
    border: "rgba(126,184,164,0.25)",
    desc: "Skills that bring peace & fulfillment",
  },
  Curiosity: {
    icon: "◇",
    color: "#A89BC8",
    bg: "rgba(168,155,200,0.08)",
    border: "rgba(168,155,200,0.25)",
    desc: "Skills you want to explore",
  },
};

const DEMO_SKILLS = [
  { id: 1, skill_name: "Video Editing", final_category: "Money", ai_reason: "High-demand skill used in content creation and marketing.", created_at: new Date().toISOString() },
  { id: 2, skill_name: "Meditation", final_category: "Soul", ai_reason: "Practice that cultivates inner peace and mindfulness.", created_at: new Date().toISOString() },
  { id: 3, skill_name: "Quantum Physics", final_category: "Curiosity", ai_reason: "Fascinating area of exploration and intellectual discovery.", created_at: new Date().toISOString() },
];

export default function MultiSkills() {
  const [screen, setScreen] = useState("welcome"); // welcome | home | detail
  const [skills, setSkills] = useState(DEMO_SKILLS);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [suggestion, setSuggestion] = useState(null); // { category, reason }
  const [pendingSkill, setPendingSkill] = useState("");
  const [showOverride, setShowOverride] = useState(false);
  const [activeCategory, setActiveCategory] = useState(null);
  const [selectedSkill, setSelectedSkill] = useState(null);
  const [mounted, setMounted] = useState(false);
  const inputRef = useRef();

  useEffect(() => {
    setTimeout(() => setMounted(true), 100);
  }, []);

  async function analyzeSkill() {
    if (!input.trim()) return;
    setLoading(true);
    setPendingSkill(input.trim());
    setSuggestion(null);

    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 200,
          system: `Classify the skill into ONE category: Money (income potential), Soul (fulfillment/creativity/peace), or Curiosity (exploration/learning interest). Respond ONLY with valid JSON: {"category":"Money|Soul|Curiosity","reason":"one short sentence"}`,
          messages: [{ role: "user", content: `Skill: ${input.trim()}` }],
        }),
      });
      const data = await res.json();
      const text = data.content?.map(b => b.text || "").join("") || "";
      const clean = text.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(clean);
      setSuggestion(parsed);
    } catch (e) {
      // Fallback demo
      const cats = ["Money", "Soul", "Curiosity"];
      setSuggestion({ category: cats[Math.floor(Math.random() * 3)], reason: "This skill fits naturally into this category based on its primary use and context." });
    }
    setLoading(false);
    setInput("");
  }

  function confirmSkill(category) {
    const newSkill = {
      id: Date.now(),
      skill_name: pendingSkill,
      final_category: category,
      ai_reason: suggestion?.reason || "",
      created_at: new Date().toISOString(),
    };
    setSkills(prev => [newSkill, ...prev]);
    setSuggestion(null);
    setPendingSkill("");
    setShowOverride(false);
  }

  function deleteSkill(id) {
    setSkills(prev => prev.filter(s => s.id !== id));
    setSelectedSkill(null);
  }

  const byCategory = (cat) => skills.filter(s => s.final_category === cat);

  const styles = {
    app: {
      minHeight: "100vh",
      background: "#0E0E0F",
      color: "#E8E4DC",
      fontFamily: "'Georgia', 'Times New Roman', serif",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "24px",
      position: "relative",
      overflow: "hidden",
    },
    noise: {
      position: "fixed", inset: 0, zIndex: 0,
      backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E")`,
      opacity: 0.4, pointerEvents: "none",
    },
    glow: {
      position: "fixed", width: 600, height: 600, borderRadius: "50%",
      background: "radial-gradient(circle, rgba(168,155,200,0.06) 0%, transparent 70%)",
      top: "-200px", right: "-200px", pointerEvents: "none", zIndex: 0,
    },
    container: {
      position: "relative", zIndex: 1, width: "100%", maxWidth: 520,
      opacity: mounted ? 1 : 0, transform: mounted ? "translateY(0)" : "translateY(20px)",
      transition: "all 0.7s cubic-bezier(0.22,1,0.36,1)",
    },
  };

  // WELCOME SCREEN
  if (screen === "welcome") return (
    <div style={styles.app}>
      <div style={styles.noise} />
      <div style={styles.glow} />
      <div style={{ ...styles.container, textAlign: "center" }}>
        <div style={{ fontSize: 11, letterSpacing: 6, color: "#5a5652", marginBottom: 48, textTransform: "uppercase" }}>MultiSkills</div>
        <h1 style={{ fontSize: "clamp(28px,5vw,48px)", fontWeight: 400, lineHeight: 1.2, color: "#E8E4DC", marginBottom: 16, letterSpacing: "-0.5px" }}>
          What skills are<br />shaping your life?
        </h1>
        <p style={{ color: "#5a5652", fontSize: 14, marginBottom: 56, letterSpacing: 0.3 }}>Understand yourself through your abilities.</p>
        <button onClick={() => setScreen("home")} style={{
          background: "transparent", border: "1px solid rgba(232,228,220,0.2)", color: "#E8E4DC",
          padding: "14px 40px", fontSize: 13, letterSpacing: 3, textTransform: "uppercase",
          cursor: "pointer", transition: "all 0.3s",
          fontFamily: "inherit",
        }}
          onMouseEnter={e => { e.target.style.background = "rgba(232,228,220,0.05)"; e.target.style.borderColor = "rgba(232,228,220,0.4)"; }}
          onMouseLeave={e => { e.target.style.background = "transparent"; e.target.style.borderColor = "rgba(232,228,220,0.2)"; }}
        >Begin</button>
        <div style={{ marginTop: 80, display: "flex", justifyContent: "center", gap: 32 }}>
          {Object.entries(CATEGORIES).map(([cat, c]) => (
            <div key={cat} style={{ textAlign: "center", opacity: 0.4 }}>
              <div style={{ fontSize: 20, color: c.color, marginBottom: 4 }}>{c.icon}</div>
              <div style={{ fontSize: 10, letterSpacing: 2, textTransform: "uppercase", color: "#5a5652" }}>{cat}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // SKILL DETAIL
  if (selectedSkill) {
    const cat = CATEGORIES[selectedSkill.final_category];
    return (
      <div style={styles.app}>
        <div style={styles.noise} />
        <div style={{ ...styles.container }}>
          <button onClick={() => setSelectedSkill(null)} style={{ background: "none", border: "none", color: "#5a5652", fontSize: 12, letterSpacing: 2, textTransform: "uppercase", cursor: "pointer", marginBottom: 40, padding: 0, fontFamily: "inherit" }}>← Back</button>
          <div style={{ borderLeft: `2px solid ${cat.color}`, paddingLeft: 24 }}>
            <div style={{ fontSize: 11, letterSpacing: 3, textTransform: "uppercase", color: cat.color, marginBottom: 12 }}>{cat.icon} {selectedSkill.final_category}</div>
            <h2 style={{ fontSize: 36, fontWeight: 400, marginBottom: 24, color: "#E8E4DC" }}>{selectedSkill.skill_name}</h2>
            <p style={{ color: "#7a7672", fontSize: 14, lineHeight: 1.7, fontStyle: "italic", marginBottom: 32 }}>"{selectedSkill.ai_reason}"</p>
            <div style={{ fontSize: 11, color: "#3a3632", letterSpacing: 1 }}>{new Date(selectedSkill.created_at).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</div>
          </div>
          <div style={{ marginTop: 48, display: "flex", gap: 16 }}>
            <button onClick={() => deleteSkill(selectedSkill.id)} style={{ background: "none", border: "1px solid rgba(200,80,80,0.2)", color: "rgba(200,80,80,0.6)", padding: "10px 20px", fontSize: 11, letterSpacing: 2, textTransform: "uppercase", cursor: "pointer", fontFamily: "inherit", transition: "all 0.2s" }}
              onMouseEnter={e => { e.target.style.borderColor = "rgba(200,80,80,0.5)"; e.target.style.color = "rgba(200,80,80,0.9)"; }}
              onMouseLeave={e => { e.target.style.borderColor = "rgba(200,80,80,0.2)"; e.target.style.color = "rgba(200,80,80,0.6)"; }}>
              Delete
            </button>
          </div>
        </div>
      </div>
    );
  }

  // CATEGORY LIST
  if (activeCategory) {
    const cat = CATEGORIES[activeCategory];
    const catSkills = byCategory(activeCategory);
    return (
      <div style={styles.app}>
        <div style={styles.noise} />
        <div style={{ ...styles.container }}>
          <button onClick={() => setActiveCategory(null)} style={{ background: "none", border: "none", color: "#5a5652", fontSize: 12, letterSpacing: 2, textTransform: "uppercase", cursor: "pointer", marginBottom: 40, padding: 0, fontFamily: "inherit" }}>← Back</button>
          <div style={{ marginBottom: 40 }}>
            <div style={{ fontSize: 28, color: cat.color, marginBottom: 8 }}>{cat.icon}</div>
            <h2 style={{ fontSize: 32, fontWeight: 400, color: "#E8E4DC", margin: "0 0 6px" }}>{activeCategory}</h2>
            <p style={{ color: "#5a5652", fontSize: 13 }}>{cat.desc}</p>
          </div>
          {catSkills.length === 0 ? (
            <p style={{ color: "#3a3632", fontStyle: "italic", fontSize: 14 }}>No skills here yet. Add your first one.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {catSkills.map(s => (
                <div key={s.id} onClick={() => setSelectedSkill(s)} style={{
                  padding: "16px 20px", borderLeft: `1px solid ${cat.border}`,
                  cursor: "pointer", transition: "all 0.2s",
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                }}
                  onMouseEnter={e => { e.currentTarget.style.background = cat.bg; e.currentTarget.style.borderLeftColor = cat.color; }}
                  onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.borderLeftColor = cat.border; }}>
                  <span style={{ fontSize: 16, color: "#E8E4DC" }}>{s.skill_name}</span>
                  <span style={{ fontSize: 18, color: "#3a3632" }}>›</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // HOME
  return (
    <div style={styles.app}>
      <div style={styles.noise} />
      <div style={styles.glow} />
      <div style={styles.container}>
        {/* Header */}
        <div style={{ marginBottom: 48 }}>
          <div style={{ fontSize: 11, letterSpacing: 6, color: "#5a5652", textTransform: "uppercase", marginBottom: 8 }}>MultiSkills</div>
          <div style={{ width: 32, height: 1, background: "rgba(232,228,220,0.1)" }} />
        </div>

        {/* Input */}
        <div style={{ marginBottom: 48 }}>
          <div style={{ display: "flex", gap: 0, borderBottom: "1px solid rgba(232,228,220,0.15)" }}>
            <input
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && !loading && analyzeSkill()}
              placeholder="What skill is on your mind?"
              style={{
                flex: 1, background: "none", border: "none", outline: "none",
                color: "#E8E4DC", fontSize: 16, padding: "14px 0",
                fontFamily: "inherit", caretColor: "#A89BC8",
              }}
            />
            <button onClick={analyzeSkill} disabled={loading || !input.trim()} style={{
              background: "none", border: "none", cursor: loading || !input.trim() ? "not-allowed" : "pointer",
              color: loading || !input.trim() ? "#3a3632" : "#E8E4DC",
              fontSize: 11, letterSpacing: 3, textTransform: "uppercase",
              padding: "14px 0 14px 20px", fontFamily: "inherit", transition: "color 0.2s",
            }}>
              {loading ? "···" : "Analyze"}
            </button>
          </div>
        </div>

        {/* Suggestion Card */}
        {suggestion && pendingSkill && (
          <div style={{
            marginBottom: 40, padding: 28,
            border: `1px solid ${CATEGORIES[suggestion.category]?.border || "rgba(232,228,220,0.1)"}`,
            background: CATEGORIES[suggestion.category]?.bg || "transparent",
            animation: "fadeIn 0.4s ease",
          }}>
            <div style={{ fontSize: 11, letterSpacing: 3, textTransform: "uppercase", color: "#5a5652", marginBottom: 16 }}>AI Suggestion</div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
              <div>
                <div style={{ fontSize: 22, color: "#E8E4DC", marginBottom: 6 }}>{pendingSkill}</div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 16, color: CATEGORIES[suggestion.category]?.color }}>{CATEGORIES[suggestion.category]?.icon}</span>
                  <span style={{ fontSize: 13, color: CATEGORIES[suggestion.category]?.color, letterSpacing: 1 }}>{suggestion.category}</span>
                </div>
              </div>
            </div>
            <p style={{ fontSize: 13, color: "#7a7672", fontStyle: "italic", lineHeight: 1.6, marginBottom: 24 }}>"{suggestion.reason}"</p>
            <div style={{ display: "flex", gap: 12 }}>
              <button onClick={() => confirmSkill(suggestion.category)} style={{
                background: CATEGORIES[suggestion.category]?.color, border: "none", color: "#0E0E0F",
                padding: "10px 24px", fontSize: 11, letterSpacing: 2, textTransform: "uppercase",
                cursor: "pointer", fontFamily: "inherit",
              }}>Confirm</button>
              <button onClick={() => setShowOverride(true)} style={{
                background: "none", border: "1px solid rgba(232,228,220,0.15)", color: "#7a7672",
                padding: "10px 24px", fontSize: 11, letterSpacing: 2, textTransform: "uppercase",
                cursor: "pointer", fontFamily: "inherit", transition: "all 0.2s",
              }}
                onMouseEnter={e => { e.target.style.borderColor = "rgba(232,228,220,0.3)"; e.target.style.color = "#E8E4DC"; }}
                onMouseLeave={e => { e.target.style.borderColor = "rgba(232,228,220,0.15)"; e.target.style.color = "#7a7672"; }}>
                Change
              </button>
              <button onClick={() => { setSuggestion(null); setPendingSkill(""); }} style={{
                background: "none", border: "none", color: "#3a3632", padding: "10px 0",
                fontSize: 11, letterSpacing: 2, textTransform: "uppercase", cursor: "pointer", fontFamily: "inherit",
              }}>Dismiss</button>
            </div>
          </div>
        )}

        {/* Override Modal */}
        {showOverride && (
          <div style={{
            position: "fixed", inset: 0, background: "rgba(14,14,15,0.9)", display: "flex",
            alignItems: "center", justifyContent: "center", zIndex: 100, padding: 24,
          }}>
            <div style={{ background: "#141415", border: "1px solid rgba(232,228,220,0.1)", padding: 40, maxWidth: 380, width: "100%" }}>
              <div style={{ fontSize: 11, letterSpacing: 3, textTransform: "uppercase", color: "#5a5652", marginBottom: 24 }}>Choose Category</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 32 }}>
                {Object.entries(CATEGORIES).map(([cat, c]) => (
                  <button key={cat} onClick={() => { confirmSkill(cat); setShowOverride(false); }} style={{
                    background: "none", border: `1px solid ${c.border}`, color: "#E8E4DC",
                    padding: "16px 20px", textAlign: "left", cursor: "pointer", fontFamily: "inherit",
                    display: "flex", alignItems: "center", gap: 12, transition: "all 0.2s",
                  }}
                    onMouseEnter={e => { e.currentTarget.style.background = c.bg; }}
                    onMouseLeave={e => { e.currentTarget.style.background = "none"; }}>
                    <span style={{ fontSize: 18, color: c.color }}>{c.icon}</span>
                    <div>
                      <div style={{ fontSize: 14, marginBottom: 2 }}>{cat}</div>
                      <div style={{ fontSize: 11, color: "#5a5652" }}>{c.desc}</div>
                    </div>
                  </button>
                ))}
              </div>
              <button onClick={() => setShowOverride(false)} style={{ background: "none", border: "none", color: "#5a5652", fontSize: 11, letterSpacing: 2, textTransform: "uppercase", cursor: "pointer", fontFamily: "inherit" }}>Cancel</button>
            </div>
          </div>
        )}

        {/* Categories */}
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {Object.entries(CATEGORIES).map(([cat, c]) => {
            const count = byCategory(cat).length;
            return (
              <div key={cat} onClick={() => count > 0 && setActiveCategory(cat)} style={{
                padding: "20px 0", borderBottom: "1px solid rgba(232,228,220,0.05)",
                display: "flex", alignItems: "center", justifyContent: "space-between",
                cursor: count > 0 ? "pointer" : "default", transition: "all 0.2s",
              }}
                onMouseEnter={e => count > 0 && (e.currentTarget.style.paddingLeft = "8px")}
                onMouseLeave={e => (e.currentTarget.style.paddingLeft = "0")}>
                <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                  <span style={{ fontSize: 18, color: c.color, transition: "all 0.2s" }}>{c.icon}</span>
                  <div>
                    <div style={{ fontSize: 15, color: "#E8E4DC", letterSpacing: 0.3 }}>{cat}</div>
                    <div style={{ fontSize: 11, color: "#3a3632", marginTop: 2 }}>{c.desc}</div>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <span style={{ fontSize: 22, fontWeight: 300, color: count > 0 ? c.color : "#3a3632", transition: "color 0.3s" }}>{count}</span>
                  {count > 0 && <span style={{ fontSize: 16, color: "#3a3632" }}>›</span>}
                </div>
              </div>
            );
          })}
        </div>

        <div style={{ marginTop: 48, fontSize: 10, color: "#2a2622", letterSpacing: 2, textAlign: "center", textTransform: "uppercase" }}>
          {skills.length} skill{skills.length !== 1 ? "s" : ""} mapped
        </div>
      </div>
      <style>{`
        @keyframes fadeIn { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        input::placeholder { color: #3a3632; }
      `}</style>
    </div>
  );
}
