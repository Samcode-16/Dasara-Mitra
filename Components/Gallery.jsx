import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useLanguage } from './DasaraContext';
import { X, ZoomIn } from 'lucide-react';

const FALLBACK_BLUEPRINT = [
  {
    url: '/images/gallery/palace-illumination.svg',
    translations: {
      en: { alt: 'Mysore Palace Illumination', caption: 'The majestic Mysore Palace illuminated during Dasara nights.' },
      kn: { alt: 'ಮೈಸೂರು ಅರಮನೆ ದೀಪಾಲಂಕಾರ', caption: 'ದಸರಾ ರಾತ್ರಿ ಹೊಳೆಯುವ ಅರಮನೆಯ ನೋಟ.' },
      hi: { alt: 'मैसूरु महल रोशनी', caption: 'दशहरा रातों में जगमगाता महल।' }
    }
  },
  {
    url: '/images/gallery/jumboo-savari.svg',
    translations: {
      en: { alt: 'Jumboo Savari Procession', caption: 'Decorated elephants leading the iconic Jumboo Savari.' },
      kn: { alt: 'ಜಂಬೂ ಸವಾರಿ ಮೆರವಣಿಗೆ', caption: 'ಅಲಂಕರಿಸಿದ ಆನೆಗಳು ಮೆರವಣಿಗೆಯನ್ನು ಮುನ್ನಡೆಸುವ ಕ್ಷಣ.' },
      hi: { alt: 'जम्बू सवारी जुलूस', caption: 'सजे हुए हाथी शोभायात्रा का नेतृत्व करते हुए।' }
    }
  },
  {
    url: '/images/gallery/torchlight-parade.svg',
    translations: {
      en: { alt: 'Torchlight Parade', caption: 'Torchbearers preparing for the Bannimantap parade.' },
      kn: { alt: 'ಟಾರ್ಚ್‌ಲೈಟ್ ಕವಾಯತು', caption: 'ಬನ್ನಿಮಂಟಪದಲ್ಲಿ ದೀಪಗಳನ್ನು ಹಿಡಿದ ದಳದ ಸಿದ್ಧತೆ.' },
      hi: { alt: 'टॉर्चलाइट परेड', caption: 'बन्नीमंतप मैदान में मशालधारी दल तैयार होता हुआ।' }
    }
  },
  {
    url: '/images/gallery/cultural-dance.svg',
    translations: {
      en: { alt: 'Cultural Dance', caption: 'Folk dancers showcasing vibrant traditions.' },
      kn: { alt: 'ಸಾಂಸ್ಕೃತಿಕ ನೃತ್ಯ', caption: 'ಜನಪದ ಕಲಾವಿದರು ಬಣ್ಣದ ಸಂಪ್ರದಾಯಗಳನ್ನು ತೋರಿಸುತ್ತಿರುವರು.' },
      hi: { alt: 'सांस्कृतिक नृत्य', caption: 'लोक कलाकार रंगीन परंपराएं प्रस्तुत करते हुए।' }
    }
  },
  {
    url: '/images/gallery/festival-crowd.svg',
    translations: {
      en: { alt: 'Festival Crowd', caption: 'Devotees and visitors soaking in the festive spirit.' },
      kn: { alt: 'ಹಬ್ಬದ ಜನಸ್ತೋಮ', caption: 'ಭಕ್ತರು ಮತ್ತು ಪ್ರವಾಸಿಗರು ದಸರಾ ಸಂಭ್ರಮದಲ್ಲಿ ಮುಳುಗಿರುವರು.' },
      hi: { alt: 'दशहरा भीड़', caption: 'श्रद्धालु और पर्यटक उत्सव का आनंद लेते हुए।' }
    }
  },
  {
    url: '/images/gallery/chamundi-hill.svg',
    translations: {
      en: { alt: 'Chamundi Hill View', caption: 'Panoramic view of Mysuru from Chamundi Hill.' },
      kn: { alt: 'ಚಾಮುಂಡಿ ಪರ್ವತ ದೃಶ್ಯ', caption: 'ಚಾಮುಂಡಿ ಬೆಟ್ಟದಿಂದ ಮೈಸೂರಿನ ಸಮಗ್ರ ನೋಟ.' },
      hi: { alt: 'चामुंडी पहाड़ी दृश्य', caption: 'चामुंडी पहाड़ी से मैसूरु का विहंगम दृश्य।' }
    }
  }
];

const CLOUDINARY_SECTIONS = [
  { tag: 'mysuru_palace', titleKey: 'gallerySectionPalaceTitle', blurbKey: 'gallerySectionPalaceBlurb' },
  { tag: 'mysuru_flower_show', titleKey: 'gallerySectionFlowerTitle', blurbKey: 'gallerySectionFlowerBlurb' },
  { tag: 'mysuru_procession', titleKey: 'gallerySectionProcessionTitle', blurbKey: 'gallerySectionProcessionBlurb' },
  { tag: 'mysuru_lightings', titleKey: 'gallerySectionLightingsTitle', blurbKey: 'gallerySectionLightingsBlurb' },
  { tag: 'mysuru_cultural_activities', titleKey: 'gallerySectionCulturalTitle', blurbKey: 'gallerySectionCulturalBlurb' },
  { tag: 'mysuru_yuva_dasara', titleKey: 'gallerySectionYuvaTitle', blurbKey: 'gallerySectionYuvaBlurb' },
  { tag: 'mysuru_chamundi_temple', titleKey: 'gallerySectionChamundiTitle', blurbKey: 'gallerySectionChamundiBlurb' },
  { tag: 'mysuru_exhibition', titleKey: 'gallerySectionExhibitionTitle', blurbKey: 'gallerySectionExhibitionBlurb' },
  { tag: 'mysuru_dasara_tableau', titleKey: 'gallerySectionTableauTitle', blurbKey: 'gallerySectionTableauBlurb' },
  { tag: 'mysuru_wrestling_tournament', titleKey: 'gallerySectionWrestlingTitle', blurbKey: 'gallerySectionWrestlingBlurb' },
  { tag: 'mysuru_drone_show', titleKey: 'gallerySectionDroneTitle', blurbKey: 'gallerySectionDroneBlurb' }
];

const getLocalizedFallback = (language) =>
  FALLBACK_BLUEPRINT.map((item) => {
    const localized = item.translations[language] || item.translations.en;
    return {
      url: item.url,
      alt: localized.alt,
      caption: localized.caption
    };
  });

const formatTemplate = (template = '', replacements) =>
  Object.entries(replacements).reduce(
    (acc, [key, value]) => acc.replace(new RegExp(`{{${key}}}`, 'g'), value),
    template
  );

export default function Gallery() {
  const { t, language } = useLanguage();
  const buildFallbackSection = useCallback(() => ({
    tag: 'fallback',
    titleKey: 'galleryFallbackTitle',
    blurbKey: 'galleryFallbackBlurb',
    images: getLocalizedFallback(language)
  }), [language]);

  const [selectedImage, setSelectedImage] = useState(null);
  const [sectionImages, setSectionImages] = useState(() => [buildFallbackSection()]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
  const galleryTagsRaw = import.meta.env.VITE_CLOUDINARY_GALLERY_TAGS;

  const activeSections = useMemo(() => {
    if (!galleryTagsRaw) {
      return [];
    }
    const configuredTags = galleryTagsRaw
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean);

    if (!configuredTags.length) {
      return [];
    }

    return CLOUDINARY_SECTIONS.filter((section) => configuredTags.includes(section.tag));
  }, [galleryTagsRaw]);

  useEffect(() => {
    if (!cloudName || !activeSections.length) {
      setSectionImages([buildFallbackSection()]);
      return;
    }

    const controller = new AbortController();
    let encounteredError = false;

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

    const fetchByTag = async (section) => {
      const manifestUrl = `https://res.cloudinary.com/${cloudName}/image/list/${section.tag}.json`;
      try {
        const response = await fetch(manifestUrl, { signal: controller.signal });
        if (!response.ok) {
          return { ...section, images: [] };
        }
        const data = await response.json();
        if (!Array.isArray(data.resources) || !data.resources.length) {
          return { ...section, images: [] };
        }

        const images = data.resources.map((resource) => ({
          id: resource.asset_id || resource.public_id,
          url: buildImageUrl(resource.public_id, resource.format),
          alt: resource.public_id ? prettify(resource.public_id) : section.title,
          caption:
            resource.context?.custom?.caption ||
            resource.context?.custom?.alt ||
            prettify(resource.public_id),
        }));

        return { ...section, images };
      } catch (err) {
        if (err.name !== 'AbortError') {
          encounteredError = true;
        }
        return { ...section, images: [] };
      }
    };

    const fetchCloudinaryImages = async () => {
      setLoading(true);
      setError(null);

      const results = await Promise.all(activeSections.map(fetchByTag));
      const hasImages = results.some((section) => section.images.length);

      if (!hasImages) {
        setSectionImages([buildFallbackSection()]);
        setError(encounteredError ? t('galleryCloudinaryError') : t('galleryCloudinaryEmpty'));
      } else {
        setSectionImages(results);
        setError(encounteredError ? t('galleryCloudinaryError') : null);
      }
      setLoading(false);
    };

    fetchCloudinaryImages();

    return () => controller.abort();
  }, [cloudName, activeSections, buildFallbackSection, t]);

  useEffect(() => {
    setSectionImages((current) => {
      if (current.length === 1 && current[0].tag === 'fallback') {
        return [buildFallbackSection()];
      }
      return current;
    });
  }, [buildFallbackSection]);

  const getSectionTitle = (section) => (section.titleKey ? t(section.titleKey) : section.title || '');
  const getSectionBlurb = (section) => (section.blurbKey ? t(section.blurbKey) : section.blurb || '');

  return (
    <section id="gallery" className="py-12 md:py-20 bg-white">
      <div className="container mx-auto px-4">
        {error ? (
          <div className="mb-6 text-center text-sm">
            <p className="text-red-600">{error}</p>
          </div>
        ) : null}

        {sectionImages.length > 0 ? (
          <nav className="mb-4" aria-label="Gallery sections">
            <div className="flex flex-wrap justify-center gap-3">
              {sectionImages.map((section) => (
                <button
                  key={`pill-${section.tag}`}
                  onClick={() => {
                    const target = document.getElementById(`gallery-${section.tag}`);
                    if (target) {
                      const offset = -80;
                      const y = target.getBoundingClientRect().top + window.pageYOffset + offset;
                      window.scrollTo({ top: y, behavior: 'smooth' });
                    }
                  }}
                  className="px-4 py-2 rounded-full border border-[#DAA520]/60 text-sm font-medium text-[#B45309] bg-white hover:bg-[#FFF7E6] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#DAA520]"
                  >
                  {getSectionTitle(section)}
                </button>
              ))}
            </div>
          </nav>
        ) : null}

        <div className="space-y-12">
          {sectionImages.map((section) => (
            <div key={section.tag} id={`gallery-${section.tag}`}>
              {(() => {
                const title = getSectionTitle(section);
                const blurb = getSectionBlurb(section);
                return (
              <div className="flex flex-col gap-2 mb-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-[#DAA520]/15 flex items-center justify-center text-[#B45309] font-semibold">
                        {title.charAt(0)}
                  </div>
                  <div>
                      <h3 className="text-xl font-semibold text-gray-900">{title}</h3>
                      {blurb && (
                        <p className="text-sm text-gray-600">{blurb}</p>
                      )}
                  </div>
                </div>
                <div className="h-1 w-16 bg-gradient-to-r from-[#DAA520] via-[#FDE68A] to-transparent rounded-full"></div>
                </div>
                );
              })()}

              {section.images && section.images.length ? (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {section.images.map((img) => (
                    <button
                      key={img.id || img.url}
                      className="text-left relative group rounded-xl overflow-hidden shadow-md hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#DAA520]"
                      onClick={() => setSelectedImage(img)}
                    >
                      <img
                        src={img.url}
                        alt={img.alt}
                        className="w-full h-64 object-cover transform group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
                        <div className="absolute top-4 right-4 bg-white/20 backdrop-blur-sm p-2 rounded-full">
                          <ZoomIn className="w-4 h-4 text-white" />
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-gray-200 p-6 text-center text-sm text-gray-500">
                  {formatTemplate(t('galleryNoImages'), { section: getSectionTitle(section) })}
                </div>
              )}
            </div>
          ))}
        </div>

        {loading && (
          <div className="mt-8 text-center text-sm text-gray-500 flex justify-center gap-2 items-center">
            <div className="w-4 h-4 border-2 border-[#DAA520] border-t-transparent rounded-full animate-spin"></div>
            {t('galleryLoadingMessage')}
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
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}