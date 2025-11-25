'use client';

import { useState, useEffect } from 'react';
import styles from './NotificationsPage.module.css';
import { useTranslation } from 'react-i18next';

interface Notification {
    id: number;
    message: string;
    image_url: string | null;
    is_read: boolean;
    created_at: string;
    user_id: number | null;
}

const NotificationsPage = () => {
    const { t, i18n } = useTranslation();

    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    const API_URL = process.env.NEXT_PUBLIC_API_URL;

    const fetchNotifications = async () => {
        try {
            const userId = localStorage.getItem('a'); // Assuming you store user ID in localStorage
            if (!userId) {
                throw new Error('User not authenticated');
            }

            const response = await fetch(`${API_URL}/api/notifications/user/${userId}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('a')}`,
                },
            });

            if (!response.ok) {
                throw new Error('Failed to fetch notifications');
            }

            const data = await response.json();
            setNotifications(data);
        } catch (err: any) {
            setError(err.message || 'Error fetching notifications');
            console.error('Error fetching notifications:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const markAsRead = async (notificationId: number) => {
        try {
            const response = await fetch(`${API_URL}/api/notifications/${notificationId}/read`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('a')}`,
                },
            });

            if (!response.ok) {
                throw new Error('Failed to mark notification as read');
            }

            // Update the local state to mark the notification as read
            setNotifications(notifications.map(notification => 
                notification.id === notificationId 
                    ? { ...notification, is_read: true }
                    : notification
            ));
        } catch (err) {
            console.error('Error marking notification as read:', err);
        }
    };

    useEffect(() => {
        fetchNotifications();
    }, []);

    if (isLoading) {
        return <div className={styles.loading}>Loading notifications...</div>;
    }

    if (error) {
        return <div className={styles.error}>{error}</div>;
    }

    // Get only the 10 most recent notifications
    const recentNotifications = [...notifications].sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    ).slice(0, 10);

    return (
        <div className={styles.container}>
            <h1 className='text-2xl font-bold mb-3 text-white'>{t('settings.notifications')}</h1>
            
            {recentNotifications.length === 0 ? (
                <div className={styles.noNotifications}>
                    {t('settings.Nonotification') || 'No notifications found'}
                </div>
            ) : (
                <div className={styles.notificationsList}>
                    {recentNotifications.map((notification) => (
                        <div 
                            key={notification.id} 
                            className={`${styles.notification} ${!notification.is_read ? styles.unread : ''}` }
                        >
                           <div className=''>
                           <p className={styles.message}> {i18n.language === 'ar' ? notification.message_ar : notification.message_en}</p>
                            
                            {notification.image_url && (
                                <img
                                    src={`${API_URL}${notification.image_url}`}
                                    alt="Notification image"
                                    className="w-30"
                                />
                            )}
                           </div>
                            
                            <div className={styles.meta}>
                                <span className={styles.date}>
                                    {new Date(notification.created_at).toLocaleString()}
                                </span>
                                
                                {!notification.is_read && (
                                    <button
                                        onClick={() => markAsRead(notification.id)}
                                        className={styles.markAsRead}
                                    >
                                        Mark as read
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
export default NotificationsPage;