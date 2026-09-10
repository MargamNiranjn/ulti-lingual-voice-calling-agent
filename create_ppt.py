from pptx import Presentation
from pptx.util import Inches, Pt, Emu
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN
from pptx.util import Inches, Pt

# ── Colour palette ──────────────────────────────────────────────────────────
BG       = RGBColor(0x06, 0x08, 0x13)   # near-black background
PURPLE   = RGBColor(0x7C, 0x3A, 0xED)   # accent purple
INDIGO   = RGBColor(0x4F, 0x46, 0xE5)   # accent indigo
EMERALD  = RGBColor(0x10, 0xB9, 0x81)   # green for positives
AMBER    = RGBColor(0xF5, 0x9E, 0x0B)   # orange highlight
WHITE    = RGBColor(0xFF, 0xFF, 0xFF)
LGRAY    = RGBColor(0x94, 0xA3, 0xB8)   # slate-400
DGRAY    = RGBColor(0x1E, 0x29, 0x3B)   # card background

prs = Presentation()
prs.slide_width  = Inches(13.33)
prs.slide_height = Inches(7.5)

BLANK = prs.slide_layouts[6]   # completely blank layout

# ── Helper utilities ─────────────────────────────────────────────────────────

def add_slide():
    slide = prs.slides.add_slide(BLANK)
    bg = slide.background
    fill = bg.fill
    fill.solid()
    fill.fore_color.rgb = BG
    return slide

def box(slide, x, y, w, h, fill_color=None, border_color=None, radius=False):
    shape = slide.shapes.add_shape(
        1,  # MSO_SHAPE_TYPE.RECTANGLE
        Inches(x), Inches(y), Inches(w), Inches(h)
    )
    shape.line.width = Pt(0)
    if fill_color:
        shape.fill.solid()
        shape.fill.fore_color.rgb = fill_color
    else:
        shape.fill.background()
    if border_color:
        shape.line.color.rgb = border_color
        shape.line.width = Pt(1)
    return shape

def txt(slide, text, x, y, w, h,
        size=18, bold=False, color=WHITE, align=PP_ALIGN.LEFT, italic=False):
    tb = slide.shapes.add_textbox(Inches(x), Inches(y), Inches(w), Inches(h))
    tf = tb.text_frame
    tf.word_wrap = True
    p = tf.paragraphs[0]
    p.alignment = align
    run = p.add_run()
    run.text = text
    run.font.size  = Pt(size)
    run.font.bold  = bold
    run.font.color.rgb = color
    run.font.italic = italic
    return tb

def gradient_rect(slide, x, y, w, h, c1=PURPLE, c2=INDIGO):
    """Fake gradient using two overlapping semi-transparent shapes."""
    s1 = box(slide, x, y, w/2, h, c1)
    s2 = box(slide, x + w/2, y, w/2, h, c2)
    return s1, s2

def pill(slide, label, x, y, w=1.6, h=0.32, bg=PURPLE):
    b = box(slide, x, y, w, h, bg)
    txt(slide, label, x, y+0.02, w, h, size=9, bold=True,
        color=WHITE, align=PP_ALIGN.CENTER)

def divider(slide, y, color=PURPLE):
    box(slide, 0.5, y, 12.33, 0.03, color)

# ═══════════════════════════════════════════════════════════════════════════
# SLIDE 1 — TITLE SLIDE
# ═══════════════════════════════════════════════════════════════════════════
s1 = add_slide()

# Background gradient bar top
gradient_rect(s1, 0, 0, 13.33, 0.08, PURPLE, INDIGO)
# Bottom bar
gradient_rect(s1, 0, 7.42, 13.33, 0.08, INDIGO, PURPLE)

# Glow circle decoration
box(s1, 8.5, 1.0, 4.0, 4.0, RGBColor(0x7C,0x3A,0xED))  # placeholder glow

# Main title
txt(s1, "Multi-Lingual Generative", 0.7, 1.5, 8.0, 1.0,
    size=36, bold=True, color=WHITE)
txt(s1, "AI Voice Calling Agent", 0.7, 2.4, 8.0, 1.0,
    size=36, bold=True, color=PURPLE)

# Subtitle
txt(s1, "Smart Lead Qualification & Customer Engagement",
    0.7, 3.45, 8.5, 0.6, size=16, color=LGRAY, italic=True)

divider(s1, 4.3)

# Team & course info
txt(s1, "Final Year Project Presentation  |  2025",
    0.7, 4.5, 8.0, 0.4, size=13, color=LGRAY)
txt(s1, "Team Members:  Member 1   •   Member 2   •   Member 3",
    0.7, 4.95, 9.0, 0.4, size=13, color=LGRAY)

# Tech pills at bottom-left
for i, (label, col) in enumerate([
    ("FastAPI", PURPLE), ("Next.js", INDIGO),
    ("Groq AI", EMERALD), ("Twilio", AMBER)
]):
    pill(s1, label, 0.7 + i * 1.75, 6.5, 1.5, 0.34, col)

# ═══════════════════════════════════════════════════════════════════════════
# SLIDE 2 — PROBLEM STATEMENT
# ═══════════════════════════════════════════════════════════════════════════
s2 = add_slide()
gradient_rect(s2, 0, 0, 13.33, 0.08, PURPLE, INDIGO)

txt(s2, "The Problem", 0.6, 0.25, 6.0, 0.7, size=30, bold=True, color=WHITE)
divider(s2, 1.05)

problems = [
    ("⏱  Wasted Time",
     "Sales agents manually call hundreds of people.\nMost are not interested — hours of effort wasted."),
    ("🌐  Language Barrier",
     "India has 22+ languages. Customers reject\ncalls in a language they don't understand."),
    ("📉  No Consistency",
     "Different agents give different pitches.\nQuality and outcome vary widely."),
]

for i, (title, body) in enumerate(problems):
    bx = 0.55 + i * 4.22
    by = 1.35
    box(s2, bx, by, 3.9, 3.6, DGRAY, PURPLE)
    txt(s2, title, bx+0.2, by+0.25, 3.5, 0.55,
        size=15, bold=True, color=PURPLE)
    txt(s2, body,  bx+0.2, by+0.85, 3.5, 2.5,
        size=12, color=LGRAY)

# Big stat
box(s2, 0.55, 5.3, 12.2, 1.4, RGBColor(0x0F,0x17,0x2A), PURPLE)
txt(s2,
    "Companies spend 70 % of calling time on customers who will NEVER buy.",
    1.0, 5.55, 11.3, 0.9, size=17, bold=True, color=AMBER, align=PP_ALIGN.CENTER)

# ═══════════════════════════════════════════════════════════════════════════
# SLIDE 3 — OUR SOLUTION
# ═══════════════════════════════════════════════════════════════════════════
s3 = add_slide()
gradient_rect(s3, 0, 0, 13.33, 0.08, EMERALD, PURPLE)

txt(s3, "Our Solution", 0.6, 0.25, 6.0, 0.7, size=30, bold=True, color=WHITE)
divider(s3, 1.05)

txt(s3,
    "An AI Agent that automatically calls customers, speaks in their language,\n"
    "qualifies their interest — and only forwards HOT LEADS to the sales team.",
    0.6, 1.2, 12.1, 1.1, size=15, color=LGRAY)

# Flow steps
steps = [
    ("1", "Upload\nLead List", PURPLE),
    ("2", "AI Calls\nEveryone", INDIGO),
    ("3", "Speaks Their\nLanguage", PURPLE),
    ("4", "Qualifies\nInterest", INDIGO),
    ("5", "Saves\nHot Leads", EMERALD),
    ("6", "Sales Team\nFollows Up", AMBER),
]

for i, (num, label, col) in enumerate(steps):
    bx = 0.55 + i * 2.05
    box(s3, bx, 2.6, 1.75, 1.75, col)
    txt(s3, num,   bx+0.1, 2.7,  1.6, 0.5, size=22, bold=True,
        color=WHITE, align=PP_ALIGN.CENTER)
    txt(s3, label, bx+0.05, 3.2, 1.65, 0.9, size=11, bold=True,
        color=WHITE, align=PP_ALIGN.CENTER)
    # Arrow (except last)
    if i < len(steps)-1:
        txt(s3, "→", bx+1.82, 3.2, 0.3, 0.5, size=20,
            color=PURPLE, align=PP_ALIGN.CENTER)

# Result banner
box(s3, 0.55, 5.05, 12.2, 1.55, RGBColor(0x06,0x2A,0x1A), EMERALD)
txt(s3, "✅  Result",
    1.0, 5.15, 3.0, 0.45, size=14, bold=True, color=EMERALD)
txt(s3,
    "Sales team only calls people who are genuinely interested.\n"
    "Time saved: ~80 %   •   Language coverage: 10 Indian languages   •   Runs 24 / 7",
    1.0, 5.6, 11.0, 0.85, size=12, color=WHITE)

# ═══════════════════════════════════════════════════════════════════════════
# SLIDE 4 — TECH STACK
# ═══════════════════════════════════════════════════════════════════════════
s4 = add_slide()
gradient_rect(s4, 0, 0, 13.33, 0.08, PURPLE, INDIGO)

txt(s4, "Technology Stack", 0.6, 0.25, 7.0, 0.7, size=30, bold=True, color=WHITE)
divider(s4, 1.05)

techs = [
    ("Frontend",      "Next.js 14 + Tailwind CSS",
     "React dashboard — campaigns, leads,\ncall history, live analytics"),
    ("Backend",       "FastAPI (Python)",
     "REST API, WebSocket, background\ndialer engine, JWT auth"),
    ("AI / LLM",      "Groq — Llama 3.3-70B",
     "Drives every conversation turn.\nNot a script — real NLP understanding"),
    ("Telephony",     "Twilio",
     "Real outbound phone calls.\nGoogle Neural TTS voices in 10 languages"),
    ("Database",      "SQLite → PostgreSQL",
     "Stores leads, calls, transcripts,\nAI summaries, settings"),
    ("Email Alerts",  "SMTP (Gmail / Outlook)",
     "Instant email to sales manager\nwhen a hot lead is detected"),
]

for i, (layer, name, detail) in enumerate(techs):
    col  = 0.55 + (i % 3) * 4.15
    row  = 1.3  + (i // 3) * 2.55
    box(s4, col, row, 3.85, 2.25, DGRAY, PURPLE)
    txt(s4, layer, col+0.18, row+0.15, 3.5, 0.38,
        size=9, bold=True, color=PURPLE)
    txt(s4, name,  col+0.18, row+0.52, 3.5, 0.45,
        size=14, bold=True, color=WHITE)
    txt(s4, detail, col+0.18, row+1.0, 3.5, 1.0,
        size=10, color=LGRAY)

# ═══════════════════════════════════════════════════════════════════════════
# SLIDE 5 — SYSTEM ARCHITECTURE
# ═══════════════════════════════════════════════════════════════════════════
s5 = add_slide()
gradient_rect(s5, 0, 0, 13.33, 0.08, INDIGO, PURPLE)

txt(s5, "System Architecture", 0.6, 0.25, 7.0, 0.7, size=30, bold=True, color=WHITE)
divider(s5, 1.05)

# Left column — flow
flow = [
    (PURPLE,  "Sales Manager",     "Uploads CSV or adds leads\nvia dashboard"),
    (INDIGO,  "Campaign Engine",   "FastAPI background thread\ndials all numbers concurrently"),
    (PURPLE,  "Twilio Outbound",   "Real phone call placed to\ncustomer's mobile number"),
    (INDIGO,  "AI Conversation",   "Groq Llama 3.3-70B replies\nin customer's language"),
    (EMERALD, "Post-Call Analysis","AI scores interest 0-100,\nextracts callback time"),
    (AMBER,   "Hot Lead Alert",    "Email + SMS sent instantly\nto sales manager"),
]

for i, (col, title, body) in enumerate(flow):
    y = 1.3 + i * 0.98
    box(s5, 0.55, y, 0.45, 0.7, col)
    txt(s5, str(i+1), 0.55, y+0.1, 0.45, 0.55,
        size=14, bold=True, color=WHITE, align=PP_ALIGN.CENTER)
    txt(s5, title, 1.1, y+0.02, 3.0, 0.35,
        size=12, bold=True, color=col)
    txt(s5, body, 1.1, y+0.37, 3.0, 0.55,
        size=9,  color=LGRAY)
    if i < len(flow)-1:
        txt(s5, "↓", 0.6, y+0.72, 0.4, 0.28,
            size=11, color=col, align=PP_ALIGN.CENTER)

# Right side — key numbers
box(s5, 5.0, 1.3, 7.8, 5.9, DGRAY, INDIGO)
txt(s5, "Key Numbers", 5.3, 1.45, 7.2, 0.5,
    size=16, bold=True, color=WHITE)

stats = [
    ("10",    "Indian Languages Supported",     PURPLE),
    ("10x",   "Concurrent Calls Per Campaign",  INDIGO),
    ("0-100", "AI Lead Score Per Call",          EMERALD),
    ("~90s",  "Average Call Duration",           AMBER),
    ("80 %",  "Calling Time Saved",              EMERALD),
    ("100 %", "Leads Logged With Transcript",    PURPLE),
]

for i, (num, label, col) in enumerate(stats):
    r = 5.3  + (i % 2) * 3.7
    c = 2.05 + (i // 2) * 1.6
    box(s5, r, c, 3.4, 1.35, RGBColor(0x0F,0x17,0x2A), col)
    txt(s5, num,   r+0.15, c+0.1,  3.1, 0.6,
        size=26, bold=True, color=col,   align=PP_ALIGN.CENTER)
    txt(s5, label, r+0.1,  c+0.72, 3.2, 0.55,
        size=10, color=LGRAY, align=PP_ALIGN.CENTER)

# ═══════════════════════════════════════════════════════════════════════════
# SLIDE 6 — KEY FEATURES
# ═══════════════════════════════════════════════════════════════════════════
s6 = add_slide()
gradient_rect(s6, 0, 0, 13.33, 0.08, PURPLE, EMERALD)

txt(s6, "Key Features", 0.6, 0.25, 6.0, 0.7, size=30, bold=True, color=WHITE)
divider(s6, 1.05)

features = [
    ("🤖", "Real AI Conversation",
     "Groq Llama 3.3 understands context and\nreplies naturally — not a fixed script"),
    ("🌏", "10 Indian Languages",
     "English, Hindi, Telugu, Tamil, Kannada,\nMalayalam, Bengali, Marathi, Gujarati, Punjabi"),
    ("📞", "Real Outbound Calls",
     "Twilio makes actual phone calls.\nGoogle Neural TTS voices per language"),
    ("📊", "AI Lead Scoring",
     "Every call gets a 0-100 interest score,\nsentiment, summary, callback time"),
    ("🚨", "Instant Email Alerts",
     "Sales manager gets a rich HTML email\nthe moment a hot lead is detected"),
    ("⚡", "Quick Simulate",
     "Demo any call instantly with any\nnumber and language — no setup needed"),
    ("📋", "Campaign Engine",
     "Bulk dial 100s of customers with\nretry logic and live status tracking"),
    ("🔒", "TRAI Compliance",
     "Business hours enforcement, DND blocklist,\nAI disclosure at call start"),
]

for i, (icon, title, detail) in enumerate(features):
    col = 0.55 + (i % 4) * 3.2
    row = 1.3  + (i // 4) * 2.8
    box(s6, col, row, 2.95, 2.5, DGRAY, PURPLE)
    txt(s6, icon,   col+0.15, row+0.18, 0.6,  0.5, size=22, color=WHITE)
    txt(s6, title,  col+0.15, row+0.7,  2.65, 0.45,
        size=12, bold=True, color=WHITE)
    txt(s6, detail, col+0.15, row+1.18, 2.65, 1.1,
        size=10, color=LGRAY)

# ═══════════════════════════════════════════════════════════════════════════
# SLIDE 7 — LIVE DEMO WALKTHROUGH
# ═══════════════════════════════════════════════════════════════════════════
s7 = add_slide()
gradient_rect(s7, 0, 0, 13.33, 0.08, INDIGO, PURPLE)

txt(s7, "Live Demo Walkthrough", 0.6, 0.25, 9.0, 0.7, size=30, bold=True, color=WHITE)
divider(s7, 1.05)

steps = [
    (PURPLE,  "Step 1 — Login",
     "Open the dashboard at localhost:3000\nLogin with your credentials"),
    (INDIGO,  "Step 2 — Dashboard",
     "See KPI cards: Total Leads, Calls Made,\nInterested Leads, Conversion Rate"),
    (PURPLE,  "Step 3 — Add a Lead",
     "Go to Customers → Add Lead\nEnter name, mobile, pick language (e.g. Hindi)"),
    (EMERALD, "Step 4 — Quick Simulate",
     "Click the green 'Quick Simulate' button\nEnter any name, number, language → Start"),
    (INDIGO,  "Step 5 — Watch the Call",
     "AI greets in chosen language\nType or speak responses — see live score"),
    (AMBER,   "Step 6 — See Results",
     "Call ends → Lead score + summary shown\nCheck Call History for full transcript"),
]

for i, (col, title, body) in enumerate(steps):
    r = 0.55 + (i % 3) * 4.26
    c = 1.3  + (i // 3) * 2.85
    box(s7, r, c, 3.95, 2.55, DGRAY, col)
    box(s7, r, c, 0.5, 0.5, col)
    txt(s7, str(i+1), r, c+0.04, 0.5, 0.45,
        size=13, bold=True, color=WHITE, align=PP_ALIGN.CENTER)
    txt(s7, title, r+0.6, c+0.1,  3.2, 0.45,
        size=12, bold=True, color=col)
    txt(s7, body,  r+0.15, c+0.65, 3.65, 1.7,
        size=10, color=LGRAY)

# ═══════════════════════════════════════════════════════════════════════════
# SLIDE 8 — RESULTS & IMPACT
# ═══════════════════════════════════════════════════════════════════════════
s8 = add_slide()
gradient_rect(s8, 0, 0, 13.33, 0.08, EMERALD, PURPLE)

txt(s8, "Results & Impact", 0.6, 0.25, 7.0, 0.7, size=30, bold=True, color=WHITE)
divider(s8, 1.05)

# Big numbers row
big_stats = [
    ("80 %",  "Calling Time\nSaved",        EMERALD),
    ("10",    "Indian Languages\nSupported", PURPLE),
    ("~90s",  "Per Call\nQualification",     INDIGO),
    ("100 %", "Calls Logged\nWith AI Notes", AMBER),
]
for i, (val, label, col) in enumerate(big_stats):
    bx = 0.55 + i * 3.2
    box(s8, bx, 1.3, 2.95, 1.85, col)
    txt(s8, val,   bx+0.1, 1.4, 2.75, 0.85,
        size=34, bold=True, color=WHITE, align=PP_ALIGN.CENTER)
    txt(s8, label, bx+0.1, 2.22, 2.75, 0.75,
        size=11, color=WHITE, align=PP_ALIGN.CENTER)

# Before vs After comparison
box(s8, 0.55, 3.45, 5.95, 3.55, DGRAY, RGBColor(0xEF,0x44,0x44))
txt(s8, "❌  Before (Manual Calling)",
    0.8, 3.55, 5.5, 0.5, size=13, bold=True, color=RGBColor(0xEF,0x44,0x44))
befores = [
    "Agent manually dials each number",
    "English-only pitch fails many customers",
    "5–8 hours to call 100 people",
    "No record of what was said",
    "Sales team wastes time on cold leads",
]
for i, line in enumerate(befores):
    txt(s8, f"•  {line}", 0.85, 4.15 + i*0.5, 5.5, 0.45, size=11, color=LGRAY)

box(s8, 6.85, 3.45, 5.95, 3.55, DGRAY, EMERALD)
txt(s8, "✅  After (AI Calling Agent)",
    7.1, 3.55, 5.5, 0.5, size=13, bold=True, color=EMERALD)
afters = [
    "AI dials all customers automatically",
    "Speaks in customer's own language",
    "100 customers done in ~15 minutes",
    "Full transcript + AI notes saved",
    "Sales team only gets hot leads",
]
for i, line in enumerate(afters):
    txt(s8, f"•  {line}", 7.1, 4.15 + i*0.5, 5.5, 0.45, size=11, color=LGRAY)
