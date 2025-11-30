import React, { useEffect, useState } from 'react';
import { useLanguage } from './DasaraContext';
import { X, ZoomIn } from 'lucide-react';

const FALLBACK_GALLERY = [
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
  const [images, setImages] = useState(FALLBACK_GALLERY);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
  const galleryTag = import.meta.env.VITE_CLOUDINARY_GALLERY_TAG;

  useEffect(() => {
    if (!cloudName || !galleryTag) {
      return;
    }

    const controller = new AbortController();
    const manifestUrl = `https://res.cloudinary.com/${cloudName}/image/list/${galleryTag}.json`;

    const buildImageUrl = (publicId, format) => {
      const extension = format ? `.${format}` : '';
      return `https://res.cloudinary.com/${cloudName}/image/upload/f_auto,q_auto/${publicId}${extension}`;
    };

    const prettify = (text) =>
      text
        .split('/')
        .pop()
        .replace(/[-_]+/g, ' ')
        .replace(/\b\w/g, (char) => char.toUpperCase());

    const fetchCloudinaryImages = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch(manifestUrl, { signal: controller.signal });

        if (!response.ok) {
          throw new Error('Failed to load Cloudinary manifest');
        }

        const data = await response.json();

        if (!Array.isArray(data.resources) || data.resources.length === 0) {
          throw new Error('No resources found for the configured Cloudinary tag');
        }

        const mapped = data.resources.map((resource) => ({
          id: resource.asset_id || resource.public_id,
          url: buildImageUrl(resource.public_id, resource.format),
          alt: resource.public_id ? prettify(resource.public_id) : 'Dasara Moment',
          caption:
            resource.context?.custom?.caption ||
            resource.context?.custom?.alt ||
            prettify(resource.public_id),
        }));

        setImages(mapped);
      } catch (err) {
        if (err.name === 'AbortError') return;
        console.error('Cloudinary gallery error:', err);
        setImages(FALLBACK_GALLERY);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchCloudinaryImages();

    return () => controller.abort();
  }, [cloudName, galleryTag]);

  return (
    <section id="gallery" className="py-12 md:py-20 bg-white">
      <div className="container mx-auto px-4">
        {(cloudName && galleryTag) || error ? (
          <div className="mb-6 text-center text-sm">
            {cloudName && galleryTag && (
              <p className="text-gray-500">
                Cloudinary tag: <span className="font-semibold">{galleryTag}</span>
              </p>
            )}
            {error && (
              <p className="mt-2 text-red-600">
                {error} — falling back to default gallery assets.
              </p>
            )}
          </div>
        ) : null}

        <div className="columns-1 md:columns-2 lg:columns-3 gap-4 space-y-4">
          {images.map((img, idx) => (
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

        {loading && (
          <div className="mt-8 text-center text-sm text-gray-500 flex justify-center gap-2 items-center">
            <div className="w-4 h-4 border-2 border-[#DAA520] border-t-transparent rounded-full animate-spin"></div>
            Loading festival memories from Cloudinary...
          </div>
        )}

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