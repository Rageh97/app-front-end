'use client';

import { useState, useEffect, FormEvent, ChangeEvent } from 'react';
import Link from 'next/link';
import styles from './NotificationPage.module.css';
import { usePathname } from 'next/navigation';
import { useTranslation } from 'react-i18next';

interface Notification {
  id: number;
  message_en: string;
  message_ar: string;
  image_url: string | null;
  created_at: string;
  user_id: number | null;
  is_read: boolean;
}

const NotificationsPage = () => {
  const { t, i18n } = useTranslation();
  const pathname = usePathname();
  const [formData, setFormData] = useState({
    message_en: '',
    message_ar: ''
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

 
  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const response = await fetch(`${API_URL}/api/notifications/admin/all`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('a')}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setNotifications(data);
      }
    } catch (err) {
      console.error('Error fetching notifications:', err);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    setError('');
    setSuccessMessage('');
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    } else {
      setSelectedFile(null);
      setPreviewUrl(null);
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!formData.message_en.trim() || !formData.message_ar.trim()) {
      setError(t('notifications.messageRequired'));
      return;
    }

    setIsLoading(true);
    setError('');
    setSuccessMessage('');

    const formDataToSend = new FormData();
    
    // Add both language messages as separate fields
    formDataToSend.append('message_en', formData.message_en.trim());
    formDataToSend.append('message_ar', formData.message_ar.trim());
    
    // Add the file if it exists
    if (selectedFile) {
      formDataToSend.append('notificationImage', selectedFile);
    }
    
    console.log('Sending notification data:', {
      message_en: formData.message_en.trim(),
      message_ar: formData.message_ar.trim(),
      hasFile: !!selectedFile
    });

    try {
      const response = await fetch(`${API_URL}/api/notifications`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('a')}`,
        },
        body: formDataToSend,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || t('notifications.failedToSend'));
      }

      setSuccessMessage(t('notifications.notificationSent'));
      setFormData({
        message_en: '',
        message_ar: ''
      });
      setSelectedFile(null);
      setPreviewUrl(null);
      fetchNotifications();
    } catch (err: any) {
      setError(err.message || t('notifications.errorSending'));
      console.error('Send notification error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm(t('notifications.confirmDelete'))) {
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/notifications/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('a')}`,
        },
      });

      if (response.ok) {
        setNotifications(notifications.filter(notif => notif.id !== id));
        setSuccessMessage(t('notifications.notificationDeleted'));
      } else {
        throw new Error(t('notifications.failedToDelete'));
      }
    } catch (error) {
      setError(t('notifications.errorDeleting'));
      console.error('Delete error:', error);
    }
  };

  return (
    <>
      <div className="flex items-center justify-center flex-wrap md:gap-5 gap-2 p-5">
        <Link className={`text-white inner-shadow text-xs md:text-lg px-2 md:px-5 py-2 rounded-md ${pathname === '/admin/setting/logo' ? 'bg-[#ff7720] inner-shadow-admin text-[#000000]' : 'bg-[#35214f]'}`} href="/admin/setting/logo">
          {t('settings.logo')}
        </Link>
        <Link className={`text-white inner-shadow text-xs md:text-lg px-2 md:px-5 py-2 rounded-md ${pathname === '/admin/setting/notifications' ? 'bg-[#ff7720] inner-shadow-admin text-[#000000]' : 'bg-[#35214f]'}`} href="/admin/setting/notifications">
          {t('settings.notifications')}
        </Link>
        <Link className={`text-white inner-shadow md:px-5 px-2 text-xs md:text-lg py-2 rounded-md ${pathname === '/admin/setting/socialLinks' ? 'bg-[#ff7720] inner-shadow-admin text-[#000000]' : 'bg-[#35214f]'}`} href="/admin/setting/socialLinks">
          {t('settings.socialLinks')}
        </Link>
        <Link className={`text-white inner-shadow md:px-5 px-2 text-xs md:text-lg py-2 rounded-md ${pathname === '/admin/setting/banners' ? 'bg-[#ff7720] inner-shadow-admin text-[#000000]' : 'bg-[#35214f]'}`} href="/admin/setting/banners">
          {t('settings.banners')}
        </Link>
        <Link className={`text-white inner-shadow md:px-5 px-2 text-xs md:text-lg py-2 rounded-md ${pathname === '/admin/setting/policy' ? 'bg-[#ff7720] inner-shadow-admin text-[#000000]' : 'bg-[#35214f]'}`} href="/admin/setting/policy">
        {t('footer.returnPolicy')}
        </Link>
        <Link className={`text-white inner-shadow md:px-5 px-2 text-xs md:text-lg py-2 rounded-md ${pathname === '/admin/setting/condition' ? 'bg-[#ff7720] inner-shadow-admin text-[#000000]' : 'bg-[#35214f]'}`} href="/admin/setting/condition">
        {t('footer.returnCondition')}
        </Link>
      </div>

      <div className='flex w-full flex-col items-center justify-center p-5'>
        <div className='flex flex-col items-center p-4 justify-center bg-[linear-gradient(135deg,_#4f008c,_#190237,_#190237)] w-[100%] md:w-[60%] rounded-lg'>
          <h1 className="text-2xl font-bold text-white text-center">{t('notifications.sendNotification')}</h1>

          {error && <p className="text-red">{error}</p>}
          {successMessage && <p className="text-[#00c48c]">{successMessage}</p>}

          <form className='flex flex-col items-center justify-center gap-3' onSubmit={handleSubmit}>
            <div className='w-full'>
              <label className="text-[#00c48c]" htmlFor="message_ar">{t('notifications.message')} (العربية):</label>
              <textarea
                id="message_ar"
                name="message_ar"
                value={formData.message_ar}
                onChange={handleChange}
                required
                placeholder='أدخل الاشعار باللغة العربية'
                className='w-full bg-white p-2 rounded-md'
              />
            </div>
            <div className='w-full'>
              <label className="text-[#00c48c]" htmlFor="message_en">{t('notifications.message')} (English):</label>
              <textarea
                id="message_en"
                name="message_en"
                value={formData.message_en}
                onChange={handleChange}
                required
                placeholder='Enter the notification message in English'
                className='w-full bg-white p-2 rounded-md'
              />
            </div>

            <div className='w-full'>
              <label className="text-[#00c48c]" htmlFor="image">{t('notifications.image')}:</label>
              <input
                type="file"
                id="image"
                accept="image/*"
                onChange={handleFileChange}
                className='w-full bg-white p-2 rounded-md'
              />
            </div>

            {previewUrl && (
              <div className='w-full'>
                <h3 className="text-[#00c48c]">{t('notifications.imagePreview')}:</h3>
                <img src={previewUrl} alt="Preview" className='w-40' />
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading || !formData.message_en.trim() || !formData.message_ar.trim()}
              className="text-white w-full mt-3 mb-3 bg-[#00c48c] px-5 py-2 rounded-md items-center justify-center"
            >
              {isLoading ? t('notifications.sending') : t('notifications.send')}
            </button>
          </form>
        </div>

        <h2 className="text-white text-xl font-bold mb-2 mt-5">{t('notifications.recentNotifications')}</h2>
        <div className="flex items-center flex-wrap gap-5">
          {notifications.map((notification) => (
            <div className='bg-[linear-gradient(135deg,_#4f008c,_#190237,_#190237)] gradient-border-review px-6 py-2 rounded-md flex flex-col items-center gap-2' key={notification.id}>
              <p className="text-white">
                {i18n.language === 'ar' ? notification.message_ar : notification.message_en}
                {notification.image_url && (
                  <img 
                    src={`${API_URL}${notification.image_url}`} 
                    alt="Notification" 
                    className="mt-2 w-20 rounded"
                  />
                )}
              </p>
              <div className='flex flex-col items-center gap-2'>
                <span className="text-[#00c48c] font-bold">
                  {t('notifications.sent')}: <span className="text-white">{new Date(notification.created_at).toLocaleString()}</span>
                </span>
                <button
                  onClick={() => handleDelete(notification.id)}
                  className="text-white mt-3 mb-3 bg-red px-3 py-1 rounded-md items-center justify-center"
                >
                  {t('notifications.delete')}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
};

export default NotificationsPage;
