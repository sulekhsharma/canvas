# GMB QR Code Design Generator (Dynamic Design Builder)

A professional web-based application that allows users to design and generate high-quality QR codes for Google My Business (GMB) profiles. Transform your GMB review links into print-ready marketing materials like business cards, posters, and flyers.

## 🚀 Overview

This project automates the creation of professional GMB review QR code designs. Users can input their business details, select from predefined templates, and generate customized, scannable QR codes with their branding. It eliminates the need for manual design work in tools like Canva.

## ✨ Features

- **Dynamic QR Generation**: Automatic generation of GMB review QR codes from links.
- **Custom Branding**: Upload logos and place them dynamically (even inside the QR code).
- **Template System**: JSON-driven design templates for portrait and square layouts.
- **Live Preview**: Real-time visualization of the design as you fill in the details.
- **Flexible Inputs**: Optional fields (Business Name, Phone, Website, etc.) that only appear if provided.
- **High-Quality Export**: Download designs in PNG (300 DPI), JPG, or Print-ready PDF.
- **Multiple Presets**: Support for A4 Posters and Square social media formats.

## 🛠️ Tech Stack

- **Frontend**: React (Vite), Canvas/SVG-based rendering.
- **Backend**: Node.js, Express.
- **Key Libraries**:
  - `qrcode` for dynamic generation.
  - `canvas` / `fabric.js` for image composition.
  - `pdf-lib` / `puppeteer` for PDF export.
  - `multer` for file handling.

## 🏁 Getting Started

### Prerequisites

- Node.js (v18+)
- npm / yarn / pnpm

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/sulekhsharma/online-gmb-qr.git
   cd online-gmb-qr
   ```

2. **Setup Workspace**
   This project is structured as a monorepo.
   ```bash
   # Install dependencies for both frontend and backend
   npm install
   ```

3. **Run the development server**
   ```bash
   npm run dev
   ```

## 📖 Usage

[Explain how to use the application with examples or screenshots.]

## 🛠️ Development

### Scripts

- `npm run dev`: Starts the development server.
- `npm run build`: Builds the application for production.
- `npm run start`: Starts the production server.
- `npm run lint`: Runs the linter.
- `npm test`: Runs the test suite.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

---

Built with ❤️ by [Your Name/Organization]
