# Dasara Mitra

<div align="center">

<img src="https://res.cloudinary.com/ddg0ystfb/image/upload/v1764665971/logo_txk1rx.png" alt="Dasara Mitra Logo" width="120" height="auto">

![React](https://img.shields.io/badge/React-19.2-blue?logo=react)
![Vite](https://img.shields.io/badge/Vite-7-yellow?logo=vite)
![Tailwind](https://img.shields.io/badge/Tailwind_CSS-3.4-teal?logo=tailwindcss)
![Groq](https://img.shields.io/badge/AI-Groq%20Llama-orange)
![MapLibre](https://img.shields.io/badge/MapLibre_GL-4.1-green)

**The Ultimate Bilingual Companion for Mysuru Dasara 2025**

[View Live Demo](https://dasaramitra.vercel.app) · [Report Bug](#) · [Request Feature](#)

</div>

---

## About The Project

**Dasara Mitra** is a modern, responsive web application designed to help residents and visitors navigate the grandeur of the Mysuru Dasara festival. Whether you are looking for the next big event, trying to find the best route through traffic, or simply want to learn about the history of the palace, Dasara Mitra is your pocket assistant.

It bridges the gap between tradition and technology by offering a fully bilingual interface (English & Kannada) and an AI-powered assistant.

## Key Features

| Feature                     | Description                                                                                                                          |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| **Interactive Event Map**   | Pinpoint major venues, calculate distances from your live location, and get instant navigation cues using MapLibre GL                |
| **Smart Transport Planner** | Compare travel options (Bus, Taxi, Auto) between venues with estimated fares and travel times                                        |
| **Immersive Gallery**       | A dynamic, lightbox-enabled photo gallery powered by Cloudinary                                                                      |
| **AI Chatbot Assistant**    | A context-aware assistant (powered by Groq API) that answers queries about history, schedules, and travel tips in English or Kannada |
| **Voice Assistant**         | Voice-enabled interaction for hands-free navigation and queries                                                                      |
| **Bilingual Support**       | Seamless language toggling with context-based translations for a localized experience                                                |
| **Find My Way**             | Real-time routing and directions to festival venues                                                                                  |

## Tech Stack

| Category       | Technologies                              |
| -------------- | ----------------------------------------- |
| **Core**       | React 19.2, Vite 7, React Router DOM 7    |
| **Styling**    | Tailwind CSS 3.4, Lucide Icons            |
| **Maps**       | MapLibre GL 4.1                           |
| **AI**         | Groq API (llama-3.1-8b-instant model)     |
| **Media**      | Cloudinary (Image optimization & hosting) |
| **Email**      | EmailJS (Contact form relay)              |
| **Deployment** | Vercel (Serverless functions)             |

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/yourusername/dasara-mitra.git
   cd dasara-mitra
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Configure Environment Variables**

   Create a `.env` file in the root directory:

   | Variable                       | Description                                                 |
   | ------------------------------ | ----------------------------------------------------------- |
   | `GEMINI_API_KEY`               | Your Gemini API Key for the chatbot                         |
   | `VITE_CLOUDINARY_CLOUD_NAME`   | Your Cloudinary Cloud Name                                  |
   | `VITE_CLOUDINARY_GALLERY_TAGS` | Comma-separated Cloudinary tags (e.g., `mysuru_palace,...`) |
   | `VITE_EVENT_CLOUDINARY_TAGS`   | JSON map of event IDs to Cloudinary tags                    |
   | `VITE_EMAILJS_SERVICE_ID`      | EmailJS Service ID                                          |
   | `VITE_EMAILJS_TEMPLATE_ID`     | EmailJS Template ID                                         |
   | `VITE_EMAILJS_PUBLIC_KEY`      | EmailJS Public Key                                          |
   | `VITE_ASSISTANT_API_BASE_URL`  | URL of the backend proxy (default `http://localhost:4000`)  |

4. **Run the development servers**
   ```bash
   npm run server     # Backend proxy (Express in /server)
   npm run dev        # Frontend (Vite)
   ```

> **Deploying on Vercel?** The repo includes `api/assistant.js`, a serverless Gemini proxy. Add the same environment variables in the Vercel dashboard and the frontend will call `/api/assistant` automatically.

## Project Structure

```
Dasara-Mitra/
├── api/                     # Vercel serverless functions
│   ├── assistant.js         # Gemini AI proxy endpoint
│   └── osrm-route.js        # Routing API proxy
├── Components/              # Reusable UI + feature components
│   ├── Chatbot.jsx          # AI chatbot interface
│   ├── ContactForm.jsx      # EmailJS contact form
│   ├── DasaraContext.jsx    # Global state management
│   ├── EventsMap.jsx        # Interactive map component
│   ├── FindMyWay.jsx        # Navigation component
│   ├── Gallery.jsx          # Cloudinary gallery
│   ├── Header.jsx           # Navigation header
│   ├── Layout.jsx           # Main layout wrapper
│   ├── TransportPlanner.jsx # Transport comparison tool
│   ├── VoiceAssistant.jsx   # Voice interaction component
│   └── ui.jsx               # Shared UI components
├── Pages/                   # Route-level views
│   ├── Home.jsx             # Landing page
│   ├── Events.jsx           # Events listing
│   ├── Gallery.jsx          # Gallery page
│   ├── FindMyWay.jsx        # Navigation page
│   └── Transport.jsx        # Transport planner page
├── public/                  # Static assets
│   ├── db/                  # JSON data files
│   └── images/              # Local images
├── server/                  # Express backend (local dev)
│   ├── index.js             # Proxy server entry
│   └── package.json         # Backend dependencies
├── src/
│   ├── main.jsx             # React entry point
│   └── index.css            # Global Tailwind styles
├── package.json             # Frontend dependencies
├── tailwind.config.js       # Tailwind configuration
├── vite.config.js           # Vite configuration
└── vercel.json              # Vercel deployment config
```

## Integrations Guide

### Cloudinary Gallery

1. Upload your images to your [Cloudinary Dashboard](https://cloudinary.com/)
2. Add a specific tag to the images you want to display
3. Ensure your `.env` file matches the tag in Cloudinary

The app will automatically fetch and render all images with this tag.

### EmailJS Contact Form

The contact form is wired to send emails directly to your inbox. Configure your EmailJS template to accept these variables:

| Variable    | Description                                      |
| ----------- | ------------------------------------------------ |
| `from_name` | The sender's name                                |
| `email`     | The sender's email address (Set as **Reply-To**) |
| `message`   | The body of the inquiry                          |

### Secure Gemini Proxy (Express or Serverless)

#### Option 1 — Express backend (`/server` folder)

1. `cd server && cp .env.example .env`
2. Fill in `GEMINI_API_KEY`, and adjust `PORT`, `ALLOWED_ORIGINS`, or `GEMINI_MODEL` as needed
3. Run `npm install` inside `server/` once
4. Start the proxy locally with `npm run dev` (or from the project root via `npm run server`)
5. Set `VITE_ASSISTANT_API_BASE_URL` in the root `.env` to `http://localhost:4000`

#### Option 2 — Vercel Serverless function (`/api/assistant.js`)

1. Deploy the repo to Vercel; the `api/assistant.js` file becomes a serverless endpoint automatically
2. Configure the same environment variables (`GEMINI_API_KEY`, optional `ALLOWED_ORIGINS`, etc.) in the Vercel Project Settings
3. The frontend simply calls `/api/assistant`, so the Groq key remains on the serverless backend

> Use both setups: Express for local development/testing and the Vercel function for production.

---

## Important Notes

### Mock Data

- **Transport & Geolocation:** The specific fares (bus/auto/taxi) and some geolocation cues are mock implementations designed to demonstrate the UI flow. Real-time API integration (like Uber/Google Maps API) would be required for live routing.

### AI Security

- **Gemini Proxy:** The `server/` folder includes a lightweight Express proxy that keeps `GEMINI_API_KEY` on the server.
- **Production Advice:** Always route Gemini calls through this proxy (or your own secure backend) before deploying.

---

## Contributing

Contributions are what make the open-source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## License

This project is licensed under the ISC License.

---

## Authors

<table>
  <tr>
    <td align="center"><strong>Samudyatha K Bhat</strong></td>
    <td align="center"><strong>Deeksha R</strong></td>
    <td align="center"><strong>Nicole Tabby</strong></td>
    <td align="center"><strong>Spoorthi S</strong></td>
  </tr>
</table>

---

<div align="center">

**Made with love for Mysuru Dasara 2025**

</div>
