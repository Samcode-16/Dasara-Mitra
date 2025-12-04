#  Dasara Mitra


<div align="center">

<img src="https://res.cloudinary.com/ddg0ystfb/image/upload/v1764665971/logo_txk1rx.png" alt="Dasara Mitra Logo" width="120" height="auto">

![React](https://img.shields.io/badge/React-19-blue?logo=react)
![Vite](https://img.shields.io/badge/Vite-Fast-yellow?logo=vite)
![Tailwind](https://img.shields.io/badge/Tailwind-CSS-teal?logo=tailwindcss)
![Gemini](https://img.shields.io/badge/AI-Gemini%20Flash-orange?logo=google)

**The Ultimate Bilingual Companion for Mysuru Dasara 2025**

[View Live Demo](#) · [Report Bug](#) · [Request Feature](#)

</div>

---

##  About The Project

**Dasara Mitra** is a modern, responsive web application designed to help residents and visitors navigate the grandeur of the Mysuru Dasara festival. Whether you are looking for the next big event, trying to find the best route through traffic, or simply want to learn about the history of the palace, Dasara Mitra is your pocket assistant.

It bridges the gap between tradition and technology by offering a fully bilingual interface (English & Kannada) and an AI-powered assistant.

##  Key Features

* **Interactive Event Map:** Pinpoint major venues, calculate distances from your live location, and get instant navigation cues using Leaflet.
* **Smart Transport Planner:** Compare travel options (Bus, Taxi, Auto) between venues with estimated fares and travel times.
* **Immersive Gallery:** A dynamic, lightbox-enabled photo gallery powered by Cloudinary.
* **AI Chatbot Assistant:** A context-aware assistant (powered by Google Gemini) that answers queries about history, schedules, and travel tips in English or Kannada.
* **Bilingual Support:** Seamless language toggling with context-based translations for a localized experience.

##  Tech Stack

* **Core:** React 19, Vite
* **Styling:** Tailwind CSS, Lucide Icons
* **Maps:** Leaflet, React Leaflet
* **Integrations:**
    * **AI:** Google Gemini API (Flash model)
    * **Media:** Cloudinary (Image optimization & hosting)
    * **Email:** EmailJS (Contact form relay)

##  Getting Started

### Prerequisites
* Node.js (v18 or higher)
* npm

### Installation

1.  **Clone the repository**
    ```bash
    git clone [https://github.com/yourusername/dasara-mitra.git](https://github.com/yourusername/dasara-mitra.git)
    cd dasara-mitra
    ```

2.  **Install dependencies**
    ```bash
    npm install
    ```

    > Deploying on Vercel? The repo includes `api/assistant.js`, a serverless Gemini proxy. Add the same environment variables in the Vercel dashboard and the frontend will call `/api/assistant` automatically.

3.  **Configure Environment Variables**
    | :---------------------------- | :---------------------------------------------------- |
    | `VITE_GEMINI_API_KEY`         | Your Google AI Studio API Key for the chatbot.        |
    | `VITE_CLOUDINARY_CLOUD_NAME`  | Your Cloudinary Cloud Name.                           |
    | `VITE_CLOUDINARY_GALLERY_TAGS` | Comma-separated Cloudinary tags (e.g., `mysuru_palace,...`). |
    | `VITE_EVENT_CLOUDINARY_TAGS` | JSON map of event IDs to Cloudinary tags/public IDs (e.g., `{ "1": "dasara_jamboo_savari" }`). |
    | `VITE_EMAILJS_SERVICE_ID`     | EmailJS Service ID.                                   |
    | `VITE_EMAILJS_TEMPLATE_ID`    | EmailJS Template ID.                                  |
    | `VITE_EMAILJS_PUBLIC_KEY`     | EmailJS Public Key.                                   |
    | `VITE_ASSISTANT_API_BASE_URL` | URL of the backend proxy (default `http://localhost:4000`). |

4.  **Run the development servers**
    ```bash
    npm run server     # Backend proxy (Express in /server)
    npm run dev        # Frontend (Vite)
    ```

##  Project Structure

```text
Dasara-Mitra/
├── Components/              # Reusable UI + feature blocks (Chatbot, Gallery, VoiceAssistant, etc.)
├── Pages/                   # Route-level views (Home, Events, Gallery, Transport)
├── public/                  # Static assets (logos, fallback gallery, bus route JSON)
├── src/
│   ├── main.jsx             # React entry point
│   └── index.css            # Global Tailwind styles
├── server/                  # Secure Gemini proxy (Express)
│   ├── index.js             # Proxy + Email relay endpoints
│   └── package.json         # Backend dependencies & scripts
├── package.json             # Frontend deps & scripts
├── tailwind.config.js
├── postcss.config.js
├── vite.config.js
└── README.md
```

##  Integrations Guide

###  Cloudinary Gallery
To populate the gallery dynamically:
1.  Upload your images to your [Cloudinary Dashboard](https://cloudinary.com/).
2.  Add a specific tag to the images you want to display.
3.  Ensure your `.env` file matches the tag in the cloudinary.
The app will automatically fetch and render all images with this tag.

###  EmailJS Contact Form
The contact form is wired to send emails directly to your inbox. Ensure your EmailJS template in the dashboard is configured to accept these specific variable names:

* `from_name` : The sender's name.
* `email` : The sender's email address (Set this as the **Reply-To**).
* `message` : The body of the inquiry.

###  Secure Gemini Proxy (Express or Serverless)

#### Option 1 — Express backend (`/server` folder)
1.  `cd server && cp .env.example .env`
2.  Fill in `GEMINI_API_KEY`, and adjust `PORT`, `ALLOWED_ORIGINS`, or `GEMINI_MODEL` as needed.
3.  Run `npm install` inside `server/` once.
4.  Start the proxy locally with `npm run dev` (or from the project root via `npm run server`).
5.  Set `VITE_ASSISTANT_API_BASE_URL` in the root `.env` to `http://localhost:4000` (or wherever the proxy is hosted).

#### Option 2 — Vercel Serverless function (`/api/assistant.js`)
1.  Deploy the repo to Vercel; the `api/assistant.js` file becomes a serverless endpoint automatically.
2.  Configure the same environment variables (`GEMINI_API_KEY`, optional `ALLOWED_ORIGINS`, etc.) in the Vercel Project Settings.
3.  The frontend simply calls `/api/assistant`, so the Gemini key remains on the serverless backend without exposing it to the client bundle.

Feel free to use both setups: Express for local development/testing and the Vercel function for production.

---

##  Important Notes

###  Mock Data
* **Transport & Geolocation:** The specific fares (bus/auto/taxi) and some geolocation cues are mock implementations designed to demonstrate the UI flow. Real-time API integration (like Uber/Google Maps API) would be required for live routing.

###  AI Security
* **Gemini Proxy:** The `server/` folder  includes a lightweight Express proxy that keeps `GEMINI_API_KEY` on the server.
* **Production Advice:** Always route Gemini calls through this proxy (or your own secure backend) before deploying. 

---

##  Contributing

Contributions are what make the open-source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

1.  Fork the Project
2.  Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3.  Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4.  Push to the Branch (`git push origin feature/AmazingFeature`)
5.  Open a Pull Request


##  Authors

**Samudyatha K Bhat**  |  **Deeksha R**  |  **Nicole Tabby**  |  **Spoorthi S**