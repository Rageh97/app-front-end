'use client';

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import toast, { Toaster } from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

interface Video {
  id: number;
  title: {
    en: string;
    ar: string;
  } | string;
  description: {
    en: string;
    ar: string;
  } | string; // Support both old string format and new object format
  videoUrl: string;
  createdAt: string;
}

const AdminVideosPage = () => {
  const { t, i18n } = useTranslation();
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorVideo, setErrorVideo] = useState<string | null>(null);
  
  // Form states
  const [titleEn, setTitleEn] = useState('');
  const [titleAr, setTitleAr] = useState('');
  const [descriptionEn, setDescriptionEn] = useState('');
  const [descriptionAr, setDescriptionAr] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState<number | null>(null);

  useEffect(() => {
    const fetchVideos = async () => {
      try {
        const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/videos`);
        setVideos(response.data.videos);
      } catch (err: any) {
        const errorMsg = err.response?.data?.message || t('videos.failedToLoad');
        setErrorVideo(errorMsg);
        toast.error(errorMsg);
      } finally {
        setLoading(false);
      }
    };

    fetchVideos();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!titleEn.trim() || !titleAr.trim()) {
      setFormError(t('videos.titleRequired'));
      return;
    }

    if (!videoUrl.trim()) {
      setFormError(t('videos.urlRequired'));
      return;
    }

    try {
      const titleObj = {
        en: titleEn.trim(),
        ar: titleAr.trim(),
      };
      const descriptionObj = {
        en: descriptionEn.trim(),
        ar: descriptionAr.trim()
      };

      const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/videos/add`, {
        title: titleObj,
        description: descriptionObj,
        videoUrl: videoUrl.trim()
      });

      // Add the new video to the list and reset form
      setVideos(prev => [...prev, response.data.video]);
      toast.success(t('videos.videoAdded'));
      setTitleEn('');
      setTitleAr('');
      setDescriptionEn('');
      setDescriptionAr('');
      setVideoUrl('');
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || t('videos.failedToAdd');
      setFormError(errorMsg);
      toast.error(errorMsg);
    }
  };

  const handleDelete = async (videoId: number) => {
    if (isDeleting === videoId) return;
    setIsDeleting(videoId);
    
    try {
      await axios.delete(`${process.env.NEXT_PUBLIC_API_URL}/api/videos/${videoId}`);
      setVideos(prev => prev.filter(video => video.id !== videoId));
      toast.success(t('videos.videoDeleted'));
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || t('videos.failedToDelete');
      toast.error(errorMsg);
    } finally {
      setIsDeleting(null);
    }
  };

  if (loading) return <div className="text-white text-center p-5">{t('videos.loading')}</div>;
  if (errorVideo) return <div className="text-red-500 text-center p-5">{errorVideo}</div>;

  return (
    <>
      <Toaster position="top-right" reverseOrder={false} />
      
      <div className="bg-transparent p-6">
        <div className="w-[100%] md:w-[60%] mx-auto bg-[linear-gradient(135deg,_#4f008c,_#190237,_#190237)]  rounded-lg p-8">
          <h1 className="text-2xl font-bold mb-6 text-center text-white">{t('videos.addVideo')}</h1>
          
          {formError && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
              {formError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="titleEn" className="block text-sm font-medium text-white">{t('videos.videoTitle')} (English)</label>
              <input
                type="text"
                id="titleEn"
                value={titleEn}
                onChange={(e) => setTitleEn(e.target.value)}
                className="px-2 py-3 mt-1 block w-full rounded-md  shadow-sm focus:border-[#00c48c] focus:ring focus:ring-[#00c48c] focus:ring-opacity-50"
                placeholder="Enter title in English"
                required
              />
            </div>
            <div>
              <label htmlFor="titleAr" className="block text-sm font-medium text-white">{t('videos.videoTitle')} (العربية)</label>
              <input
                type="text"
                id="titleAr"
                value={titleAr}
                onChange={(e) => setTitleAr(e.target.value)}
                className="px-2 py-3 mt-1 block w-full rounded-md  shadow-sm focus:border-[#00c48c] focus:ring focus:ring-[#00c48c] focus:ring-opacity-50"
                placeholder="أدخل العنوان باللغة العربية"
                required
              />
            </div>

            <div>
              <label htmlFor="descriptionEn" className="block text-sm font-medium text-white">{t('videos.description')} (English)</label>
              <textarea
                id="descriptionEn"
                value={descriptionEn}
                onChange={(e) => setDescriptionEn(e.target.value)}
                className="px-2 py-3 mt-1 block w-full rounded-md shadow-sm focus:border-[#00c48c] focus:ring focus:ring-[#00c48c] focus:ring-opacity-50"
                placeholder="Enter description in English"
                rows={2}
              />
            </div>
            <div>
              <label htmlFor="descriptionAr" className="block text-sm font-medium text-white">{t('videos.description')} (العربية)</label>
              <textarea
                id="descriptionAr"
                value={descriptionAr}
                onChange={(e) => setDescriptionAr(e.target.value)}
                className="px-2 py-3 mt-1 block w-full rounded-md shadow-sm focus:border-[#00c48c] focus:ring focus:ring-[#00c48c] focus:ring-opacity-50"
                placeholder="أدخل الوصف باللغة العربية"
                rows={2}
              />
            </div>

            <div>
              <label htmlFor="videoUrl" className="block text-sm font-medium text-white">{t('videos.youtubeUrl')}</label>
              <input
                type="url"
                id="videoUrl"
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                className="px-2 py-3 mt-1 block w-full rounded-md  shadow-sm focus:border-[#00c48c] focus:ring focus:ring-[#00c48c] focus:ring-opacity-50"
                placeholder={t('videos.enterUrl')}
                required
              />
            </div>

            <div>
              <button
                type="submit"
                className="w-full bg-[#00c48c] text-white py-2 px-4 rounded-md hover:bg-[#ff8c00] focus:outline-none focus:ring-2 focus:ring-[#ff7702] focus:ring-opacity-50"
              >
                {t('videos.add')}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Videos List or No Videos Message */}
      {videos.length > 0 ? (
        <div className="mt-8 p-6">
          <h2 className="text-orange text-xl mb-3 font-bold">{t('videos.videos')}</h2>
          <div className="overflow-x-auto">
            <table className="w-full table-auto datatable-one">
              <thead>
                <tr className="bg-gray-800 shadow-xl text-orange bg-[linear-gradient(135deg,_#4f008c,_#190237,_#190237)]">
                  <th className="p-3 text-center font-bold text-xs md:text-lg inner-shadow">{t('videos.id')}</th>
                  <th className="p-3 text-center font-bold text-xs md:text-lg inner-shadow">{t('videos.video')}</th>
                  <th className="p-3 text-center font-bold text-xs md:text-lg inner-shadow">{t('videos.title')}</th>
                  <th className="p-3 text-center font-bold text-xs md:text-lg inner-shadow">{t('videos.videoDescription')}</th>
                  <th className="p-3 text-center font-bold text-xs md:text-lg inner-shadow">{t('videos.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {videos.map(video => (
                  <tr key={video.id} className="border-b-2 border-gray-500 bg-[linear-gradient(135deg,rgba(79,0,140,0.54),rgba(25,2,55,0.5),rgba(25,2,55,0.3))]">
                    <td className="p-3 text-white text-center text-xs md:text-sm">{video.id}</td>
                    <td className="p-3 text-white text-center text-xs md:text-sm">
                      <div className="w-full max-w-xs mx-auto">
                        <iframe
                          width="100%"
                          height="200"
                          src={`https://www.youtube.com/embed/${extractYoutubeId(video.videoUrl)}`}
                          frameBorder="0"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        />
                      </div>
                    </td>
                    <td className="p-3 text-white text-center text-xs md:text-sm">
                      {(() => {
                        // Handle both string (legacy) and object formats
                        const title = typeof video.title === 'string' 
                          ? { en: video.title, ar: video.title }
                          : video.title || { en: '', ar: '' };
                        
                        const currentLang = i18n.language;
                        const displayText = currentLang === 'ar' 
                          ? (title.ar || title.en || '-')
                          : (title.en || title.ar || '-');
                        
                        return (
                          <div 
                            className={currentLang === 'ar' ? 'text-right' : 'text-left'}
                            dir={currentLang === 'ar' ? 'rtl' : 'ltr'}
                          >
                            {displayText}
                          </div>
                        );
                      })()}
                    </td>
                    <td className="p-3 text-white text-center text-xs md:text-sm">
                      {(() => {
                        // Handle both string (legacy) and object formats
                        const description = typeof video.description === 'string' 
                          ? { en: video.description, ar: video.description }
                          : video.description || { en: '', ar: '' };
                        
                        const currentLang = i18n.language;
                        const displayText = currentLang === 'ar' 
                          ? (description.ar || description.en || '-')
                          : (description.en || description.ar || '-');
                        
                        return (
                          <div 
                            className={currentLang === 'ar' ? 'text-right' : 'text-left'}
                            dir={currentLang === 'ar' ? 'rtl' : 'ltr'}
                          >
                            {displayText}
                          </div>
                        );
                      })()}
                    </td>
                    <td className="p-3">
                      <div className="flex gap-2 justify-center">
                        <button 
                          className="text-xs md:text-sm bg-red px-3 py-1 rounded-lg text-white text-center hover:bg-red-600 transition disabled:opacity-50"
                          onClick={() => handleDelete(video.id)}
                          disabled={isDeleting === video.id}
                        >
                          {isDeleting === video.id ? t('videos.deleting') : t('videos.delete')}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="mt-8 p-6 text-center text-gray-500">
          <p className='text-white text-xl font-bold'>{t('videos.noVideos')}</p>
        </div>
      )}
    </>
  );
};

// Helper function to extract YouTube ID from URL
function extractYoutubeId(url: string): string {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : '';
}

export default AdminVideosPage;