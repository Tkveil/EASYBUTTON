"use client";

import { useState, useRef, useEffect } from "react";

const BUTTONS = [
  {
    id: "meeting-recap",
    label: "Meeting Recap",
    emoji: "📋",
    placeholder: "Paste your messy notes, bullet points, or Slack thread from the meeting...",
    systemPrompt: `You are an expert executive assistant. Turn raw meeting notes into a clean, professional meeting recap. Format it with:
- **Meeting Summary** (2-3 sentences max)
- **Key Decisions Made**
- **Action Items** (with owner if mentioned, and deadline if mentioned)
- **Next Steps**

Be concise. Use bullet points. Sound like a sharp Chief of Staff wrote it. No fluff.`,
    color: "#FF3B30",
    output: "Your recap, ready to paste.",
  },
  {
    id: "status-update",
    label: "Status Update",
    emoji: "📊",
    placeholder: "Dump your week here. What shipped, what's stuck, what's coming. Bullet points fine...",
    systemPrompt: `You are an expert executive assistant. Turn raw weekly notes into a polished upward-facing status update. Format it with:
- **This Week** (what got done)
- **Blockers / Risks** (if any)
- **Next Week** (what's coming)

Keep it tight. Confident tone. Senior leadership will read this. Make the manager look sharp.`,
    color: "#FF9500",
    output: "Your status update, ready to send.",
  },
  {
    id: "performance-review",
    label: "Performance Review",
    emoji: "⭐",
    placeholder: "Tell me about this person. What they did well, where they struggled, examples you remember...",
    systemPrompt: `You are an expert HR and leadership coach. Turn raw notes about an employee into a professional, fair, and specific performance review. Include:
- **Overall Summary** (2-3 sentences)
- **Strengths** (specific, with examples if provided)
- **Areas for Development** (constructive, not harsh)
- **Goals for Next Period** (2-3 actionable goals)

Sound human. Sound fair. Avoid corporate jargon. This should feel like it was written by someone who actually knows the person.`,
    color: "#34C759",
    output: "Your review, ready to submit.",
  },
  {
    id: "linkedin-post",
    label: "LinkedIn Post",
    emoji: "💼",
    placeholder: "What's the thing you want to say? A win, a lesson, a team moment, a thought...",
    systemPrompt: `You are a ghostwriter for senior professionals on LinkedIn. Turn raw thoughts into a LinkedIn post that sounds real, not corporate. Rules:
- Hook first line (no "I'm excited to announce")
- Short paragraphs, no walls of text
- One clear insight or story
- End with a question or punchy closer
- No hashtag spam (max 2 if relevant)
- Sound like a real person, not a press release

Make it engaging. Make it human. Make it something people actually share.`,
    color: "#0077B5",
    output: "Your post, ready to publish.",
  },
  {
    id: "slack-to-decision",
    label: "Slack → Decision",
    emoji: "💬",
    placeholder: "Paste the Slack thread chaos here. All of it. The whole messy conversation...",
    systemPrompt: `You are a sharp Chief of Staff. Take a messy Slack thread and extract a clean decision summary for leadership. Format:
- **The Question / Issue**
- **What Was Decided** (or current status if unresolved)
- **Who's Accountable**
- **What Happens Next**

One page. No drama. Just the signal, not the noise.`,
    color: "#4A154B",
    output: "Your decision summary, ready to escalate.",
  },
  {
    id: "1on1-prep",
    label: "1:1 Prep",
    emoji: "🤝",
    placeholder: "Tell me about your direct report. Their role, recent wins/struggles, what's been on your mind about them...",
    systemPrompt: `You are an expert leadership coach. Help a manager prepare for a 1:1 with a direct report. Generate:
- **Check-In Questions** (3-4, not generic)
- **Topics to Cover** (based on context provided)
- **Feedback to Deliver** (if applicable — direct but kind)
- **Growth Conversation Starter** (one question that opens a real conversation)

Make it feel like prep from a thoughtful manager, not a checklist from HR.`,
    color: "#AF52DE",
    output: "Your 1:1 prep, ready to walk in.",
  },
  {
    id: "spreadsheet",
    label: "Build My Spreadsheet",
    emoji: "📈",
    placeholder: "Describe the spreadsheet you need. Example: 'A budget tracker for my team with monthly columns, categories for salaries, software, and travel'...",
    systemPrompt: `You are an expert spreadsheet builder. The user needs a spreadsheet. Respond ONLY with a valid JSON object and absolutely nothing else — no explanation, no preamble, no markdown, no backticks.

The JSON must follow this exact structure:
{
  "title": "Spreadsheet name",
  "sheets": [
    {
      "name": "Sheet tab name",
      "rows": [
        ["Header1", "Header2", "Header3"],
        ["row1val1", "row1val2", "row1val3"]
      ]
    }
  ]
}

Rules:
- First row of every sheet is always headers
- Include 6-10 rows of realistic sample data
- Numbers are actual numbers not strings
- Dates are strings in MM/DD/YYYY format
- Empty cells are empty strings
- Add a TOTAL row at the bottom of financial sheets
- Use multiple sheets if the request calls for it
- Keep column headers short and clear

Return ONLY the raw JSON object. Nothing else.`,
    color: "#30D158",
    output: "Your spreadsheet, ready to download.",
    isSpreadsheet: true,
  },
];

type Button = typeof BUTTONS[0] & { isSpreadsheet?: boolean };

export default function EasyButton() {
  const [activeButton, setActiveButton] = useState<Button | null>(null);
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const outputRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (output && outputRef.current) {
      outputRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [output]);

  const handleButtonClick = (btn: Button) => {
    setActiveButton(btn);
    setInput("");
    setOutput("");
    setCopied(false);
  };

  const handleGo = async () => {
    if (!input.trim() || loading || !activeButton) return;
    setLoading(true);
    setOutput("");
    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemPrompt: activeButton.systemPrompt,
          userInput: input,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Error");
      setOutput(data.text || "Something went wrong.");
    } catch (err) {
      setOutput("Error connecting. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    setActiveButton(null);
    setInput("");
    setOutput("");
    setCopied(false);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadCSV = () => {
    try {
      const clean = output.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(clean);
      const allSheets = parsed.sheets || [];
      let csvContent = "";
      allSheets.forEach((sheet: { name: string; rows: (string | number)[][] }, i: number) => {
        if (i > 0) csvContent += "\n\n";
        if (allSheets.length > 1) csvContent += `=== ${sheet.name} ===\n`;
        csvContent += sheet.rows.map(row =>
          row.map(cell => {
            const val = String(cell ?? "");
            return val.includes(",") || val.includes('"') || val.includes("\n")
              ? `"${val.replace(/"/g, '""')}"` : val;
          }).join(",")
        ).join("\n");
      });
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${parsed.title || "spreadsheet"}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      alert("Could not parse spreadsheet. Try again.");
    }
  };

  const getSpreadsheetPreview = () => {
    try {
      const clean = output.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(clean);
      return { title: parsed.title, sheets: parsed.sheets || [] };
    } catch { return null; }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0a", fontFamily: "'Georgia', serif", color: "#f0ede8", overflowX: "hidden" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Serif+Display:ital@0;1&family=DM+Mono:wght@400;500&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        .hero-title { font-family: 'Bebas Neue', sans-serif; font-size: clamp(72px, 15vw, 160px); line-height: 0.9; letter-spacing: -2px; color: #f0ede8; }
        .hero-title span { color: #FF3B30; }
        .tagline { font-family: 'DM Serif Display', serif; font-style: italic; font-size: clamp(16px, 2.5vw, 22px); color: #888; margin-top: 16px; }
        .btn-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 16px; margin-top: 48px; }
        .big-btn { background: #141414; border: 1px solid #222; border-radius: 4px; padding: 28px 20px; cursor: pointer; transition: all 0.15s ease; text-align: left; position: relative; overflow: hidden; }
        .big-btn::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 3px; background: var(--btn-color); transform: scaleX(0); transition: transform 0.2s ease; transform-origin: left; }
        .big-btn:hover { border-color: var(--btn-color); transform: translateY(-2px); box-shadow: 0 8px 32px rgba(0,0,0,0.4); }
        .big-btn:hover::before { transform: scaleX(1); }
        .btn-emoji { font-size: 28px; margin-bottom: 12px; display: block; }
        .btn-label { font-family: 'Bebas Neue', sans-serif; font-size: 22px; letter-spacing: 1px; color: #f0ede8; }
        .input-area { animation: slideUp 0.3s ease; }
        @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        .back-btn { background: none; border: none; color: #555; cursor: pointer; font-family: 'DM Mono', monospace; font-size: 13px; padding: 0; margin-bottom: 32px; display: flex; align-items: center; gap: 8px; transition: color 0.15s; }
        .back-btn:hover { color: #f0ede8; }
        .active-title { font-family: 'Bebas Neue', sans-serif; font-size: clamp(36px, 8vw, 64px); line-height: 1; margin-bottom: 8px; }
        .active-title span { color: var(--active-color); }
        textarea { width: 100%; min-height: 180px; background: #111; border: 1px solid #2a2a2a; border-radius: 4px; padding: 20px; color: #f0ede8; font-family: 'DM Mono', monospace; font-size: 14px; line-height: 1.7; resize: vertical; outline: none; transition: border-color 0.2s; margin-top: 24px; }
        textarea:focus { border-color: var(--active-color); }
        textarea::placeholder { color: #444; }
        .go-btn { margin-top: 16px; width: 100%; padding: 20px; background: var(--active-color); color: #fff; border: none; border-radius: 4px; font-family: 'Bebas Neue', sans-serif; font-size: 28px; letter-spacing: 3px; cursor: pointer; transition: all 0.15s ease; }
        .go-btn:hover:not(:disabled) { filter: brightness(1.1); transform: translateY(-1px); }
        .go-btn:disabled { opacity: 0.6; cursor: not-allowed; }
        .loading-dots { display: inline-flex; gap: 4px; align-items: center; }
        .loading-dots span { width: 6px; height: 6px; background: white; border-radius: 50%; animation: bounce 1.2s infinite; }
        .loading-dots span:nth-child(2) { animation-delay: 0.2s; }
        .loading-dots span:nth-child(3) { animation-delay: 0.4s; }
        @keyframes bounce { 0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; } 40% { transform: scale(1); opacity: 1; } }
        .output-box { margin-top: 32px; background: #111; border: 1px solid #2a2a2a; border-left: 3px solid var(--active-color); border-radius: 4px; padding: 28px; animation: slideUp 0.4s ease; }
        .output-label { font-family: 'DM Mono', monospace; font-size: 11px; color: var(--active-color); letter-spacing: 3px; text-transform: uppercase; margin-bottom: 16px; }
        .output-text { font-family: 'DM Mono', monospace; font-size: 14px; line-height: 1.8; color: #ddd; white-space: pre-wrap; }
        .action-btn { margin-top: 16px; margin-right: 12px; padding: 10px 24px; background: transparent; border: 1px solid var(--active-color); color: var(--active-color); border-radius: 4px; font-family: 'Bebas Neue', sans-serif; font-size: 16px; letter-spacing: 2px; cursor: pointer; transition: all 0.15s; }
        .action-btn:hover, .action-btn.filled { background: var(--active-color); color: #fff; }
        .sheet-preview { overflow-x: auto; margin-top: 8px; }
        .sheet-tab { font-family: 'DM Mono', monospace; font-size: 11px; color: var(--active-color); letter-spacing: 2px; text-transform: uppercase; margin: 20px 0 8px; }
        table { width: 100%; border-collapse: collapse; font-family: 'DM Mono', monospace; font-size: 12px; }
        th { background: #1a1a1a; color: var(--active-color); padding: 8px 12px; text-align: left; border: 1px solid #2a2a2a; white-space: nowrap; font-weight: 500; letter-spacing: 1px; font-size: 11px; text-transform: uppercase; }
        td { padding: 7px 12px; border: 1px solid #1e1e1e; color: #bbb; white-space: nowrap; }
        tr:last-child td { color: var(--active-color); font-weight: 500; border-top: 1px solid #333; }
        tr:nth-child(even) td { background: #0d0d0d; }
        .divider { height: 1px; background: linear-gradient(to right, #222, transparent); margin: 48px 0; }
        .footer-text { font-family: 'DM Mono', monospace; font-size: 11px; color: #333; text-align: center; padding-bottom: 40px; letter-spacing: 2px; }
      `}</style>

      <div style={{ maxWidth: 800, margin: "0 auto", padding: "60px 24px 40px" }}>
        {!activeButton ? (
          <>
            <div className="hero-title">EASY<br /><span>BUTTON</span></div>
            <div className="tagline">Stop doing the stuff you hate.</div>
            <div className="divider" />
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, color: "#444", letterSpacing: "3px", textTransform: "uppercase", marginBottom: 4 }}>
              Pick your button
            </div>
            <div className="btn-grid">
              {BUTTONS.map((btn) => (
                <button
                  key={btn.id}
                  className="big-btn"
                  style={{ "--btn-color": btn.color } as React.CSSProperties}
                  onClick={() => handleButtonClick(btn)}
                >
                  <span className="btn-emoji">{btn.emoji}</span>
                  <div className="btn-label">{btn.label}</div>
                </button>
              ))}
            </div>
            <div className="divider" />
            <div className="footer-text">EASYBUTTON · $67/YR · CHIEF OF STAFF IN A BOX</div>
          </>
        ) : (
          <div className="input-area" style={{ "--active-color": activeButton.color } as React.CSSProperties}>
            <button className="back-btn" onClick={handleBack}>← ALL BUTTONS</button>
            <div className="active-title">{activeButton.emoji} <span>{activeButton.label.toUpperCase()}</span></div>
            <div style={{ fontFamily: "'DM Serif Display', serif", fontStyle: "italic", fontSize: 16, color: "#555" }}>
              {activeButton.isSpreadsheet ? "Describe it. Hit the button. Download it." : "Dump it in. Hit the button."}
            </div>
            <textarea
              placeholder={activeButton.placeholder}
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />
            <button className="go-btn" onClick={handleGo} disabled={loading || !input.trim()}>
              {loading ? (
                <div className="loading-dots"><span /><span /><span /></div>
              ) : "HIT THE BUTTON"}
            </button>

            {output && (
              <div className="output-box" ref={outputRef}>
                <div className="output-label">✓ {activeButton.output}</div>
                {activeButton.isSpreadsheet ? (() => {
                  const preview = getSpreadsheetPreview();
                  if (!preview) return <div className="output-text">{output}</div>;
                  return (
                    <>
                      <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 22, color: "#f0ede8", marginBottom: 4 }}>{preview.title}</div>
                      {preview.sheets.map((sheet: { name: string; rows: (string | number)[][] }, si: number) => (
                        <div key={si}>
                          {preview.sheets.length > 1 && <div className="sheet-tab">📄 {sheet.name}</div>}
                          <div className="sheet-preview">
                            <table>
                              <thead><tr>{sheet.rows[0]?.map((h, i) => <th key={i}>{String(h)}</th>)}</tr></thead>
                              <tbody>{sheet.rows.slice(1).map((row, ri) => <tr key={ri}>{row.map((cell, ci) => <td key={ci}>{String(cell)}</td>)}</tr>)}</tbody>
                            </table>
                          </div>
                        </div>
                      ))}
                      <div style={{ marginTop: 20 }}>
                        <button className="action-btn filled" onClick={handleDownloadCSV}>⬇ DOWNLOAD CSV</button>
                      </div>
                      <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: "#444", marginTop: 10 }}>
                        Opens in Excel, Google Sheets, or Numbers.
                      </div>
                    </>
                  );
                })() : (
                  <>
                    <div className="output-text">{output}</div>
                    <button className="action-btn" onClick={handleCopy}>{copied ? "✓ COPIED" : "COPY"}</button>
                  </>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
