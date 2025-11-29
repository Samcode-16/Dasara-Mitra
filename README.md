## Dasara Mitra

Dasara Mitra is a bilingual festival companion for Mysuru Dasara 2025. The app helps residents and visitors explore key events, plan travel between venues, browse a curated gallery, and chat with a friendly assistant for quick answers. Core features include:

- **Interactive Map** – Pinpoints major Dasara events, highlights distances from your location, and offers quick navigation cues.
- **Transport Planner** – Suggests mock bus, taxi, and auto options between venues with estimated time and fare details.
- **Immersive Gallery** – Showcases festival visuals with a lightbox experience; simply place your own images under `public/images/gallery`.
- **Chatbot Assistant** – Responds in English or Kannada, sharing context-aware tips about events, travel, and festival history.
- **Language Toggle** – Switch between English and Kannada via the header control, powered by a context-based translation system.

### Tech Stack

- **React 19 + Vite** for the SPA shell and dev tooling
- **Tailwind CSS** for utility-first styling
- **Leaflet + React Leaflet** for the interactive map
- **Lucide Icons** for crisp, lightweight iconography

### Local Development

```bash
npm install
npm run dev
```

Vite runs on `http://localhost:5173/` by default. Hot Module Replacement (HMR) is enabled for fast iteration.

### Production Build

```bash
npm run build
```

Outputs are written to the `dist/` directory. Serve them via any static host.

### Customizing Content

- **Translations** – Update strings in `Components/DasaraContext.jsx`.
- **Event Data** – Edit the `EVENTS_DATA` array in `Components/DasaraContext.jsx`.
- **Gallery Images** – Configure Cloudinary by copying `.env.example` to `.env`, then set `VITE_CLOUDINARY_CLOUD_NAME` and `VITE_CLOUDINARY_GALLERY_TAG`. Upload photos to Cloudinary with the chosen tag (or keep the defaults to fall back on local SVG placeholders).
- **Branding** – Swap `public/images/branding/logo.png` and tweak header colors/styles inside `Components/Header.jsx`.

### Folder Highlights

- `Components/` – UI building blocks including Header, EventsMap, TransportPlanner, Gallery, and Chatbot.
- `Pages/Home.jsx` – Home view composing the main sections.
- `Layout.jsx` – Language provider wrapper and layout shell.
- `api/base44Client.js` – Mocked LLM client stub for the chatbot.

### Notes

- Geolocation, chatbot responses, and transport results are mock implementations suited for demos.
- Replace placeholder SVG gallery images with real photos once available.
