import React from 'react';
import ReactDOM from 'react-dom/client';
import Layout from '../Layout.jsx';
import Home from '../Pages/Home.jsx';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Layout>
      <Home />
    </Layout>
  </React.StrictMode>
);
