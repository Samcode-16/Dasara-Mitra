import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from '../Layout.jsx';
import Home from '../Pages/Home.jsx';
import Events from '../Pages/Events.jsx';
import Transport from '../Pages/Transport.jsx';
import GalleryPage from '../Pages/Gallery.jsx';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/events" element={<Events />} />
          <Route path="/transport" element={<Transport />} />
          <Route path="/gallery" element={<GalleryPage />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  </React.StrictMode>
);
