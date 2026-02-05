📌 Project Name

GMB QR Code Design Generator (Dynamic Design Builder)

🎯 Project Objective

Build a web-based application that allows users to generate professional Google My Business (GMB) Review QR Code designs by:

- Entering required and optional business details
- Selecting from predefined design templates
- Automatically generating a GMB review QR code
- Dynamically placing business data and logo into the selected design
- Exporting the final design in high-quality JPG, PNG, or PDF

This system should fully automate what is currently done manually in Canva.

🧠 Core Concept

- GMB Review Link is mandatory
- All other inputs are optional
- Only provided fields appear in the final design
- QR code must be:
    - Generated from GMB link
    - Scannable even when logo is placed over it
- Designs must be print-ready and social-media ready

🧩 User Flow

1. User opens the app
2. User fills a simple form
3. User selects a design template
4. System previews the live design
5. User downloads the final file

🧾 User Input Fields

**Mandatory**
- Google My Business Review Link

**Optional**
- Business Name
- Logo (image upload)
- Phone Number
- Website URL
- Email Address
- Physical Address
- CTA text (e.g., “Scan & Rate Us”, “Give us a Review”)
- Star rating icons (on/off)
- Social icons (on/off)
- Color override (optional – template-safe)

*If a field is empty, it should not appear in the design.*

🎨 Design Templates

- Predefined poster/card layouts (portrait & square)
- Canva-style visual quality
- Variations include:
    - Logo placed inside QR
    - Logo above QR
    - Logo below QR
    - Vertical / horizontal layouts
- Each template defines:
    - Text positions
    - Font styles
    - Colors
    - Icon placements
    - QR size and safe margin

*Templates must be JSON-driven so new designs can be added without code changes.*

🔳 QR Code Rules

- Generated dynamically from GMB link
- High error correction level (for logo overlay)
- Logo placement options:
    - Center of QR
    - Top / bottom branding
- QR must remain scannable after export

📤 Output & Export

User can download final design as:
- PNG (300 DPI)
- JPG (300 DPI)
- PDF (Print-ready)

**Resolution presets:**
- A4 Poster
- Square (Instagram / WhatsApp)
- Custom size (future-ready)

🧱 Tech Stack

**Frontend (React)**
- React (Vite or Next.js)
- Canvas or SVG-based rendering
- Live preview with real-time updates
- Drag-safe layout (no free dragging for users)

**Backend (Node.js)**
- Node + Express
- QR generation service
- Image composition service
- PDF export service

**Key Libraries (suggested)**
- QR generation: `qrcode`
- Image composition: `canvas` / `fabric.js` / `svg`
- PDF export: `pdf-lib` or `puppeteer`
- File handling: `multer`

🧠 System Logic

- Design templates stored as layout JSON
- User input maps dynamically to template placeholders
- If data not provided → element hidden
- Logo auto-resized and centered safely
- QR regenerated on every GMB link change

🔐 Validation & UX

- GMB link validation required
- Logo file size & format validation
- Preview watermark (optional for free users)
- Download without watermark (future paid version)

🚀 Future Extensions (Do NOT build now)

- User accounts & saved designs
- Payment & credits
- Bulk QR generation
- White-label mode for agencies
- Analytics (scan tracking)

🧩 Final Instruction to Antigravity

- Build this as a modular, scalable design generator system
- Templates must be configurable without touching core logic
- Focus on accuracy, print quality, and QR scannability.