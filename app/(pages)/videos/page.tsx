"use client"
import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { useTranslation } from 'react-i18next'
import { X } from 'lucide-react'

interface Video {
  id: number
  title: {
    en: string
    ar: string
  } | string
  description?: {
    en?: string
    ar?: string
  } | string
  videoUrl: string
  createdAt: string
}

// Helper function to extract YouTube ID from URL
function extractYoutubeId(url: string): string {
  // Use a more robust regex that covers various YouTube URL formats
  const regExp = /(?:youtube\.com\/(?:[^\/]+\/.+\/|\(k=)?(?:v=)?|youtu\.be\/)([^"&?\/\s]{11})/;
  const match = url.match(regExp);
  return (match && match[1].length === 11) ? match[1] : '';
}

const VideosPage = () => {
  const { t, i18n } = useTranslation();
  const [videos, setVideos] = useState<Video[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const openModal = (video: Video) => {
    setSelectedVideo(video);
    setIsModalOpen(true);
    document.body.style.overflow = 'hidden'; // Prevent scrolling when modal is open
  };

  // Close modal when clicking outside content
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      closeModal();
    }
  };

  // Close modal with Escape key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeModal();
      }
    };

    if (isModalOpen) {
      document.addEventListener('keydown', handleEsc);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = 'auto';
    };
  }, [isModalOpen]);

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedVideo(null);
  };

  useEffect(() => {
    const fetchVideos = async () => {
      try {
        const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/videos`)
        setVideos(response.data.videos)
        setLoading(false)
      } catch (err: any) {
      
        setError(err.response?.data?.message || err.message || 'Failed to fetch videos')
        setLoading(false)
      }
    }

    fetchVideos()
  }, [])

  if (loading) return <div className="text-white text-center py-8">Loading videos...</div>
  if (error) return <div className="text-red-500 text-center py-8">Error: {error}</div>

  return (
    <>
      <div className="px-4 py-8 w-full max-w-7xl mx-auto">
        <h1 className="text-3xl text-white text-center font-bold mb-10">{t('dashboard.Videos')}</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 px-4 items-start"> {/* Add items-start here */}
          {videos.map((video) => (
            <div
              key={video.id}
              className="flex flex-col bg-[linear-gradient(135deg,_#4f008c,_#190237,_#190237)] p-4 rounded-xl shadow-lg hover:shadow-xl transition-shadow"
            >
              <div className="w-full aspect-video rounded-lg overflow-hidden">
                <iframe
                  className="w-full h-full"
                  src={`https://www.youtube.com/embed/${extractYoutubeId(video.videoUrl)}`}
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  title={typeof video.title === 'object' ? (video.title.en || video.title.ar) : video.title}
                />
              </div>
              <h2 className="text-lg text-white text-center font-semibold my-1 line-clamp-2">
                {(() => {
                  const title = typeof video.title === 'string'
                    ? { en: video.title, ar: video.title }
                    : video.title || { en: '', ar: '' };
                  
                  const currentLang = i18n.language;
                  const displayText = currentLang === 'ar' 
                    ? (title.ar || title.en || '-')
                    : (title.en || title.ar || '-');
                  
                  return displayText;
                })()}
              </h2>
              {/* {video.description && typeof video.description === 'object' && (
                <p className="text-sm text-gray-300 text-center line-clamp-2 mt-1">
                  {i18n.language === 'ar' 
                    ? (video.description.ar || video.description.en || '')
                    : (video.description.en || video.description.ar || '')}
                </p>
              )} */}
              <div className="flex justify-center mt-2">
                <button
                  onClick={() => openModal(video)}
                  className="px-4 py-2 w-50 bg-[linear-gradient(135deg,_#35214f,_#35214f,_#4f008c)] text-white rounded-lg hover:opacity-90 transition-all duration-300 text-sm font-medium"
                >
                  {i18n.language === 'ar' ? 'تفاصيل أكثر' : 'More Details'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
      {/* Video Details Modal */}
      {isModalOpen && selectedVideo && (
        <div 
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          onClick={handleBackdropClick}
        >
          <div className="relative w-full max-w-4xl bg-[#190237] rounded-xl overflow-hidden border-2 border-orange shadow-2xl">
            <button
              onClick={closeModal}
              className="absolute -top-10 right-0 text-white hover:text-orange transition-colors z-10 p-1"
              aria-label="Close modal"
            >
              <X size={32} />
            </button>
            
            <div className="w-full aspect-video">
              <iframe
                className="w-full h-full"
                src={`https://www.youtube.com/embed/${extractYoutubeId(selectedVideo.videoUrl)}`}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                title={typeof selectedVideo.title === 'object' ? (selectedVideo.title.en || selectedVideo.title.ar) : selectedVideo.title}
              />
            </div>
            
            <div className="p-6">
              <h2 className="text-xl text-white font-bold mb-4 text-center">
                {(() => {
                  const title = typeof selectedVideo.title === 'string'
                    ? { en: selectedVideo.title, ar: selectedVideo.title }
                    : selectedVideo.title || { en: '', ar: '' };

                  const currentLang = i18n.language;
                  const displayText = currentLang === 'ar'
                    ? (title.ar || title.en || '-')
                    : (title.en || title.ar || '-');

                  return displayText;
                })()}
              </h2>
              
              {selectedVideo.description && (() => {
                // Get the description string for the current language
                const desc = typeof selectedVideo.description === 'object'
                  ? (i18n.language === 'ar'
                      ? selectedVideo.description.ar || selectedVideo.description.en || ''
                      : selectedVideo.description.en || selectedVideo.description.ar || '')
                  : selectedVideo.description || '';
                // Split by newlines and filter out empty lines
                const steps = desc.split(/\r?\n/).map(s => s.trim()).filter(Boolean);
                return (
                  <div className="mt-4 p-4 bg-[#1a0a2e] rounded-lg max-h-60 overflow-y-auto">
                    {steps.length > 1 ? (
                      <ul className="list-decimal pl-6 text-white">
                        {steps.map((step, idx) => (
                          <li key={idx} className="mb-2 text-justify leading-relaxed">{step}</li>
                        ))}
                      </ul>
                    ) : (
                      <p
                        dir={i18n.language === 'ar' ? 'rtl' : 'ltr'}
                        className={`text-white break-words text-justify leading-relaxed ${i18n.language === 'ar' ? 'text-right' : 'text-left'}`}
                        style={{ unicodeBidi: 'plaintext' }}
                      >
                        {desc}
                      </p>
                    )}
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default VideosPage