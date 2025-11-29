import React, { useState } from 'react';
import { useLanguage } from './DasaraContext';
import { X, ZoomIn } from 'lucide-react';

const GALLERY_IMAGES = [
  { url: "/images/gallery/palace-illumination.svg", alt: "Mysore Palace Illumination", caption: "The majestic Mysore Palace illuminated during Dasara nights." },
  { url: "/images/gallery/jumboo-savari.svg", alt: "Jumboo Savari Procession", caption: "Decorated elephants leading the iconic Jumboo Savari." },
  { url: "/images/gallery/torchlight-parade.svg", alt: "Torchlight Parade", caption: "Torchbearers preparing for the Bannimantap parade." },
  { url: "/images/gallery/cultural-dance.svg", alt: "Cultural Dance", caption: "Folk dancers showcasing vibrant traditions." },
  { url: "/images/gallery/festival-crowd.svg", alt: "Festival Crowd", caption: "Devotees and visitors soaking in the festive spirit." },
  { url: "/images/gallery/chamundi-hill.svg", alt: "Chamundi Hill View", caption: "Panoramic view of Mysuru from Chamundi Hill." },
];

export default function Gallery() {
  const { t } = useLanguage();
  const [selectedImage, setSelectedImage] = useState(null);

  return (
    <section id="gallery" className="py-12 md:py-20 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4" style={{ color: '#800000' }}>
            {t('galleryTitle')}
          </h2>
          <div className="w-24 h-1 bg-[#DAA520] mx-auto rounded-full"></div>
        </div>

        <div className="columns-1 md:columns-2 lg:columns-3 gap-4 space-y-4">
          {GALLERY_IMAGES.map((img, idx) => (
            <div 
              key={idx} 
              className="break-inside-avoid relative group rounded-xl overflow-hidden cursor-pointer shadow-md hover:shadow-xl transition-all duration-300"
              onClick={() => setSelectedImage(img)}
            >
              <img 
                src={img.url} 
                alt={img.alt} 
                className="w-full h-auto object-cover transform group-hover:scale-105 transition-transform duration-500"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
                <p className="text-white font-medium translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                  {img.caption}
                </p>
                <div className="absolute top-4 right-4 bg-white/20 backdrop-blur-sm p-2 rounded-full">
                  <ZoomIn className="w-4 h-4 text-white" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {selectedImage && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4">
            <div className="relative max-w-4xl w-full max-h-[90vh] bg-black/95 rounded-2xl overflow-hidden">
              <button
                onClick={() => setSelectedImage(null)}
                className="absolute top-4 right-4 z-10 p-2 bg-white/10 rounded-full hover:bg-white/20"
                aria-label="Close image preview"
              >
                <X className="w-6 h-6 text-white" />
              </button>
              <div className="flex h-full items-center justify-center p-4">
                <img
                  src={selectedImage.url}
                  alt={selectedImage.alt}
                  className="max-h-[75vh] w-full object-contain"
                />
              </div>
              <div className="p-4 bg-gradient-to-t from-black/90 to-transparent text-center">
                <p className="text-lg font-medium text-[#DAA520]">{selectedImage.caption}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}