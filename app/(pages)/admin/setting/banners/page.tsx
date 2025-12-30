'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import React, { useState, useEffect, ChangeEvent, FormEvent } from 'react';
import { useTranslation } from 'react-i18next';

interface Banner {
  id: number;
  image_url: string;
  link_url?: string | null;
  title?: string | null;
  display_order: number;
  is_active: boolean;
  createdAt: string;
  updatedAt: string;
}

const BannersPage = () => {
  const { t } = useTranslation();
  const pathname = usePathname();
  const [banners, setBanners] = useState<Banner[]>([]);
  const [newBanner, setNewBanner] = useState({
    title: '',
    link_url: '',
    display_order: 0,
    is_active: true,
  });
  const [bannerImageFile, setBannerImageFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [adminToken, setAdminToken] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('a'); 
    if (token) {
      setAdminToken(token);
    } else {
      setError(t('banners.adminTokenMissing'));
    }
  }, [t]);

  const fetchBanners = async () => {
    if (!adminToken) return;
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(process.env.NEXT_PUBLIC_API_URL + '/api/admin/banners', {
        headers: {
          'Authorization': `${adminToken}`,
        },
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: response.statusText }));
        throw new Error(`${t('banners.failedToFetch')}: ${errorData.message || response.statusText}`);
      }
      const data: Banner[] = await response.json();
      setBanners(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (adminToken) {
      fetchBanners();
    }
  }, [adminToken]);

  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      setNewBanner(prev => ({ ...prev, [name]: (e.target as HTMLInputElement).checked }));
    } else if (type === 'number') {
      setNewBanner(prev => ({ ...prev, [name]: parseInt(value, 10) || 0 }));
    } else {
      setNewBanner(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setBannerImageFile(e.target.files[0]);
    }
  };

  const handleAddBanner = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!bannerImageFile) {
      setError(t('banners.bannerImageRequired'));
      return;
    }
    if (!adminToken) {
      setError(t('banners.adminTokenUnavailable'));
      return;
    }

    const formData = new FormData();
    formData.append('bannerImage', bannerImageFile);
    formData.append('title', newBanner.title);
    formData.append('link_url', newBanner.link_url);
    formData.append('display_order', String(newBanner.display_order));
    formData.append('is_active', String(newBanner.is_active));

    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(process.env.NEXT_PUBLIC_API_URL + '/api/admin/banners', {
        method: 'POST',
        headers: {
          'Authorization': `${adminToken}`,
        },
        body: formData,
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: response.statusText }));
        throw new Error(`${t('banners.failedToAdd')}: ${errorData.message || response.statusText}`);
      }
      setNewBanner({ title: '', link_url: '', display_order: 0, is_active: true });
      setBannerImageFile(null);
      const fileInput = document.getElementById('bannerImageFile') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
      fetchBanners();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteBanner = async (bannerId: number) => {
    if (!adminToken) {
      setError(t('banners.adminTokenUnavailable'));
      return;
    }
    if (!confirm(t('banners.confirmDelete'))) {
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(process.env.NEXT_PUBLIC_API_URL + `/api/admin/banners/${bannerId}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `${adminToken}`,
          },
        }
      );
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: response.statusText }));
        throw new Error(`${t('banners.failedToDelete')}: ${errorData.message || response.statusText}`);
      }
      fetchBanners();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="flex items-center justify-center flex-wrap md:gap-5 gap-2 p-5">
        <Link className={`text-white inner-shadow text-xs md:text-lg px-2 md:px-5 py-2 rounded-md ${pathname === '/admin/setting/logo' ? 'bg-[#ff7720] inner-shadow-admin text-[#000000]' : 'bg-[#35214f]'}`} href="/admin/setting/logo">{t('settings.logo')}</Link>
        <Link className={`text-white inner-shadow text-xs md:text-lg px-2 md:px-5 py-2 rounded-md ${pathname === '/admin/setting/notifications' ? 'bg-[#ff7720] inner-shadow-admin text-[#000000]' : 'bg-[#35214f]'}`} href="/admin/setting/notifications">{t('settings.notifications')}</Link>
        <Link className={`text-white inner-shadow text-xs md:text-lg px-2 md:px-5 py-2 rounded-md ${pathname === '/admin/setting/socialLinks' ? 'bg-[#ff7720] inner-shadow-admin text-[#000000]' : 'bg-[#35214f]'}`} href="/admin/setting/socialLinks">{t('settings.socialLinks')}</Link>
        <Link className={`text-white inner-shadow text-xs md:text-lg px-2 md:px-5 py-2 rounded-md ${pathname === '/admin/setting/banners' ? 'bg-[#ff7720] inner-shadow-admin text-[#000000]' : 'bg-[#35214f]'}`} href="/admin/setting/banners">{t('settings.banners')}</Link>
        <Link className={`text-white inner-shadow md:px-5 px-2 text-xs md:text-lg py-2 rounded-md ${pathname === '/admin/setting/policy' ? 'bg-[#ff7720] inner-shadow-admin text-[#000000]' : 'bg-[#35214f]'}`} href="/admin/setting/policy">
        {t('footer.returnPolicy')}
        </Link>
        <Link className={`text-white inner-shadow md:px-5 px-2 text-xs md:text-lg py-2 rounded-md ${pathname === '/admin/setting/condition' ? 'bg-[#ff7720] inner-shadow-admin text-[#000000]' : 'bg-[#35214f]'}`} href="/admin/setting/condition">
        {t('footer.returnCondition')}
        </Link>
      </div>
    
      <div className='flex w-full flex-col items-center justify-center p-5'>
        <div className='flex p-4 flex-col items-center justify-center bg-[linear-gradient(135deg,_#4f008c,_#190237,_#190237)] w-[100%] md:w-[60%] rounded-lg'>
          <h1 className="text-2xl font-bold text-white text-center">{t('banners.manageBanners')}</h1>

          {error && <p className='text-red'>{error}</p>}
          {isLoading && <p>{t('banners.adding')}</p>}

          {!adminToken && <p>{t('banners.adminTokenMissing')}</p>}

          {adminToken && (
            <>
              <form className='flex flex-col items-center justify-center gap-3' onSubmit={handleAddBanner}>
                <h2 className='text-[#00c48c]'>{t('banners.addNewBanner')}</h2>
                <div className='w-full'>
                  <label className='text-[#00c48c]' htmlFor="bannerImageFile">{t('banners.bannerImage')}</label>
                  <input type="file" id="bannerImageFile" name="bannerImageFile" onChange={handleFileChange} required className='w-full bg-white p-2 rounded-md'/>
                </div>
                <div className='w-full'>
                  <label className='text-[#00c48c]' htmlFor="title">{t('banners.title')}</label>
                  <input type="text" id="title" name="title" value={newBanner.title} onChange={handleInputChange} className='w-full bg-white p-2 rounded-md'/>
                </div>
                <div className='w-full'>
                  <label className='text-[#00c48c]' htmlFor="link_url">{t('banners.linkUrl')}</label>
                  <input type="url" id="link_url" name="link_url" value={newBanner.link_url} onChange={handleInputChange} placeholder="https://example.com" className='w-full bg-white p-2 rounded-md'/>
                </div>
                <div className='w-full'>
                  <label className='text-[#00c48c]' htmlFor="display_order">{t('banners.displayOrder')}</label>
                  <input type="number" id="display_order" name="display_order" value={newBanner.display_order} onChange={handleInputChange} className='w-full bg-white p-2 rounded-md'/>
                </div>
                <div className=''>
                  <label className='text-[#00c48c]' htmlFor="is_active">
                    <input type="checkbox" id="is_active" name="is_active" checked={newBanner.is_active} onChange={handleInputChange} />
                    {t('banners.active')}
                  </label>
                </div>
                <button className="text-white w-full mt-3 mb-3 bg-[#00c48c] px-5 py-2 rounded-md items-center justify-center" type="submit" disabled={isLoading || !bannerImageFile}>
                  {isLoading ? t('banners.adding') : t('banners.addBanner')}
                </button>
              </form>
            </>
          )}
        </div>
    
        <h2 className='text-white text-xl font-bold mb-2 mt-5'>{t('banners.existingBanners')}</h2>
        {banners.length === 0 && !isLoading && <p className='text-red'>{t('banners.noBannersFound')}</p>}
        <table className="w-full table-auto datatable-one">
          <thead>
            <tr className='bg-gray-800 shadow-xl text-orange bg-[linear-gradient(135deg,_#4f008c,_#190237,_#190237)]'>
              <th className="p-3 text-center font-bold text-xs md:text-lg inner-shadow">{t('banners.image')}</th>
              <th className="p-3 text-center font-bold text-xs md:text-lg inner-shadow">{t('banners.title')}</th>
              <th className="p-3 text-center font-bold text-xs md:text-lg inner-shadow">{t('banners.displayOrder')}</th>
              <th className="p-3 text-center font-bold text-xs md:text-lg inner-shadow">{t('banners.active')}</th>
              <th className="p-3 text-center font-bold text-xs md:text-lg inner-shadow">{t('banners.link')}</th>
              <th className="p-3 text-center font-bold text-xs md:text-lg inner-shadow">{t('banners.delete')}</th>
            </tr>
          </thead>
          <tbody>
            {banners.map(banner => (
              <tr className="border-b border-gray-500 bg-[linear-gradient(135deg,rgba(79,0,140,0.7),rgba(25,2,55,0.7),rgba(25,2,55,0.5))]" key={banner.id}>
                <td className="p-3 text-white text-center text-xs md:text-sm">
                  <img className='w-50 h-auto' src={banner.image_url?.startsWith('http') ? banner.image_url : `${process.env.NEXT_PUBLIC_API_URL}${banner.image_url}`} alt={banner.title || t('banners.untitled')} />
                </td>
                <td className="p-3 text-white text-center text-xs md:text-sm">{banner.title || t('banners.untitled')}</td>
                <td className="p-3 text-white text-center text-xs md:text-sm">{banner.display_order}</td>
                <td className="p-3 text-white text-center text-xs md:text-sm">{banner.is_active ? t('banners.yes') : t('banners.no')}</td>
                <td className="p-3 text-white text-center text-xs md:text-sm">
                  {banner.link_url && <a href={banner.link_url} target="_blank" rel="noopener noreferrer">{t('banners.link')}</a>}
                </td>
                <td className="p-3 text-white text-center text-xs md:text-sm">
                  <button
                    className='text-white px-2 py-1 text-md mx-1 rounded-md bg-red' 
                    onClick={() => handleDeleteBanner(banner.id)} 
                    disabled={isLoading}>
                    {t('banners.delete')}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>   
    </>
  );
};

export default BannersPage;