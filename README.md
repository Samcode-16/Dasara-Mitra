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

##  Integrations Guide

###  Cloudinary Gallery
To populate the gallery dynamically:
1.  Upload your images to your [Cloudinary Dashboard](https://cloudinary.com/).
2.  Add a specific tag to the images you want to display (e.g., `mysore_dasara`).
3.  Ensure your `.env` file matches the tag in the cloudinary.
The app will automatically fetch and render all images with this tag.

###  EmailJS Contact Form
The contact form is wired to send emails directly to your inbox. Ensure your EmailJS template in the dashboard is configured to accept these specific variable names:

* `from_name` : The sender's name.
* `email` : The sender's email address (Set this as the **Reply-To**).
* `message` : The body of the inquiry.

---

##  Important Notes

###  Mock Data
* **Transport & Geolocation:** The specific fares (bus/auto/taxi) and some geolocation cues are mock implementations designed to demonstrate the UI flow. Real-time API integration (like Uber/Google Maps API) would be required for live routing.

###  AI Security
* **Gemini API Key:** Currently, the `VITE_GEMINI_API_KEY` is exposed on the client side to keep the project serverless for the demo.
* **Production Advice:** For a live production deployment, **do not** expose this key. You should proxy these requests through a secure backend server (Node.js/Express) to protect your quota.

---

##  Contributing

Contributions are what make the open-source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

1.  Fork the Project
2.  Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3.  Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4.  Push to the Branch (`git push origin feature/AmazingFeature`)
5.  Open a Pull Request


##  Author

**Samudyatha K Bhat**

---

**Deeksha R**

---

**Nicole Tabby**

---

**Spoorthi S**