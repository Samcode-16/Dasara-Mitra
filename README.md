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

* **🗺️ Interactive Event Map:** Pinpoint major venues, calculate distances from your live location, and get instant navigation cues using Leaflet.
* **🚕 Smart Transport Planner:** Compare travel options (Bus, Taxi, Auto) between venues with estimated fares and travel times.
* **🖼️ Immersive Gallery:** A dynamic, lightbox-enabled photo gallery powered by Cloudinary.
* **🤖 AI Chatbot Assistant:** A context-aware assistant (powered by Google Gemini) that answers queries about history, schedules, and travel tips in English or Kannada.
* **🗣️ Bilingual Support:** Seamless language toggling with context-based translations for a localized experience.

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

3.  **Configure Environment Variables**
    Create a `.env` file in the root directory and add the following keys:

    | Variable                      | Description                                           |
    | :---------------------------- | :---------------------------------------------------- |
    | `VITE_GEMINI_API_KEY`         | Your Google AI Studio API Key for the chatbot.        |
    | `VITE_CLOUDINARY_CLOUD_NAME`  | Your Cloudinary Cloud Name.                           |
    | `VITE_CLOUDINARY_GALLERY_TAG` | The tag used to fetch images (e.g., `mysore_dasara`). |
    | `VITE_EMAILJS_SERVICE_ID`     | EmailJS Service ID.                                   |
    | `VITE_EMAILJS_TEMPLATE_ID`    | EmailJS Template ID.                                  |
    | `VITE_EMAILJS_PUBLIC_KEY`     | EmailJS Public Key.                                   |

4.  **Run the development server**
    ```bash
    npm run dev
    ```

##  Project Structure

```text
src/
├── components/          # UI Building Blocks
│   ├── Chatbot/         # AI Assistant logic
│   ├── EventsMap/       # Leaflet map configuration
│   ├── Gallery/         # Cloudinary integration
│   ├── Transport/       # Route planning logic
│   └── Header.jsx       # Navigation & Language toggle
├── context/
│   └── DasaraContext.jsx # Global state (Lang, Events Data)
├── pages/
│   └── Home.jsx         # Main landing page
└── App.jsx              # App entry point
```

🔌 Integrations Guide
Cloudinary Gallery
To populate the gallery, upload images to your Cloudinary dashboard and tag them with the value set in VITE_CLOUDINARY_GALLERY_TAG. The app automatically fetches and displays them.

EmailJS Contact Form
The contact form is wired to send emails directly to you. Ensure your EmailJS template expects these variables:

from_name (Sender's Name)

email (Sender's Email - Reply-To)

message (The body text)

⚠️ Note on Mock Data
Transport & Geolocation: Transport fares and specific geolocation cues are mock implementations designed for demonstration purposes.

AI Security: The Gemini API key is exposed client-side. For a production deployment, it is recommended to proxy these requests through a backend server.

🤝 Contributing
Contributions are welcome! Please feel free to submit a Pull Request.

## ✍️ Author

**Samudyatha K Bhat** 
**Deeksha R** 
**Nicole Tabby**
**Spoorthi S**