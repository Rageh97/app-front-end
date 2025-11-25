'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect, FormEvent, ChangeEvent } from 'react';
import { useTranslation } from 'react-i18next';

interface SocialLink {
  id: number;
  name: string;
  url: string;
  icon_type: 'image' | 'react_icon';
  icon_value: string; // Path for image or React Icon name
  display_order: number;
  is_active: boolean;
  createdAt?: string;
  updatedAt?: string;
}

const SocialLinksPage = () => {
  const { t } = useTranslation();
  const pathname = usePathname();
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [adminToken, setAdminToken] = useState<string | null>(null);

  const [isEditing, setIsEditing] = useState<SocialLink | null>(null);
  const [formData, setFormData] = useState<Partial<SocialLink>>({
    name: '',
    url: '',
    icon_value: '', // Will hold image path for edits, primarily for preview
    display_order: 0,
    is_active: true,
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('a'); // Or however you get your admin token
    setAdminToken(token);
    if (token) {
      fetchSocialLinks(token);
    }
  }, []);

  const fetchSocialLinks = async (token: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/social-links/social-links`, {
        headers: { 'Authorization': `${token}` },
      });
      if (!response.ok) {
        const errData = await response.json().catch(() => ({ message: response.statusText }));
        throw new Error(errData.message || t('socialLinks.failedToFetch'));
      }
      const data: SocialLink[] = await response.json();
      setSocialLinks(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    let val = value;
    if (type === 'checkbox') {
      val = (e.target as HTMLInputElement).checked as any;
    }
    if (name === 'display_order') {
        val = parseInt(value, 10) as any;
    }
    setFormData(prev => ({ ...prev, [name]: val }));
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setSelectedFile(null);
      setImagePreview(null);
    }
  };

  const resetForm = () => {
    setIsEditing(null);
    setFormData({
      name: '',
      url: '',
      icon_value: '', // Will hold image path for edits, primarily for preview
      display_order: 0,
      is_active: true,
    });
    setSelectedFile(null);
    setImagePreview(null);
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!adminToken) {
      setError(t('socialLinks.adminTokenMissing'));
      return;
    }
    setIsLoading(true);
    setError(null);

    const payload = new FormData();
    payload.append('name', formData.name || '');
    payload.append('url', formData.url || '');
    if (selectedFile) {
      payload.append('socialIconImage', selectedFile);
    } else if (isEditing && !formData.icon_value) {
      // If editing and icon_value was cleared (e.g. if we add a delete image button in future)
      // and no new file is selected, we might want to send a signal to clear the image.
      // For now, if no file is selected, existing image is kept unless backend explicitly removes it.
    }
    payload.append('icon_type', 'image'); // Always image type now
    // icon_value is now managed by the backend based on file upload
    payload.append('display_order', (formData.display_order || 0).toString());
    payload.append('is_active', String(formData.is_active));

    const endpoint = isEditing
      ? `${process.env.NEXT_PUBLIC_API_URL}/api/social-links/admin/social-links/${isEditing.id}`
      : `${process.env.NEXT_PUBLIC_API_URL}/api/social-links/admin/social-links`;
    const method = isEditing ? 'PUT' : 'POST';

    try {
      const response = await fetch(endpoint, {
        method,
        headers: { 'Authorization': `${adminToken}` }, // FormData sets Content-Type automatically
        body: payload,
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({ message: response.statusText }));
        throw new Error(errData.message || t('socialLinks.failedToSave'));
      }
      await response.json(); // Or process the response data if needed
      fetchSocialLinks(adminToken);
      resetForm();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // const handleEdit = (link: SocialLink) => {
  //   setIsEditing(link);
  //   setFormData({
  //       name: link.name,
  //       url: link.url,
  //       icon_value: link.icon_value || '', // Store existing image path
  //       display_order: link.display_order,
  //       is_active: link.is_active,
  //   });
  //   setSelectedFile(null);
  //   if (link.icon_value) {
  //       setImagePreview(`${process.env.NEXT_PUBLIC_API_URL}${link.icon_value}`);
  //   } else {
  //       setImagePreview(null);
  //   }
  // };

  const handleDelete = async (id: number) => {
    if (!adminToken || !confirm(t('socialLinks.confirmDelete'))) return;
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/social-links/admin/social-links/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `${adminToken}` },
      });
      if (!response.ok) {
        const errData = await response.json().catch(() => ({ message: response.statusText }));
        throw new Error(errData.message || t('socialLinks.failedToDelete'));
      }
      fetchSocialLinks(adminToken);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Basic styling (consider moving to a CSS file or using a UI library)
  const styles: { [key: string]: React.CSSProperties } = {
    container: { padding: '20px', fontFamily: 'Arial, sans-serif' },
    form: { marginBottom: '30px', padding: '20px', border: '1px solid #ccc', borderRadius: '5px' },
    inputGroup: { marginBottom: '15px' },
    label: { display: 'block', marginBottom: '5px', fontWeight: 'bold' },
    input: { width: '100%', padding: '10px', boxSizing: 'border-box', borderRadius: '3px', border: '1px solid #ddd' },
    select: { width: '100%', padding: '10px', boxSizing: 'border-box', borderRadius: '3px', border: '1px solid #ddd' },
    checkboxLabel: { marginLeft: '5px' },
    button: { padding: '10px 15px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '3px', cursor: 'pointer', marginRight: '10px' },
    cancelButton: { backgroundColor: '#6c757d' },
    error: { color: 'red', marginBottom: '10px', border: '1px solid red', padding: '10px', borderRadius: '3px' },
    success: { color: 'green', marginBottom: '10px', border: '1px solid green', padding: '10px', borderRadius: '3px' }, // You can add success state if needed
    list: { listStyle: 'none', padding: 0 },
    listItem: { border: '1px solid #eee', padding: '15px', marginBottom: '10px', borderRadius: '5px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' },
    itemDetails: { flexGrow: 1 },
    itemActions: { marginTop: '10px' },
    iconPreview: { maxWidth: '50px', maxHeight: '50px', marginRight: '10px', border: '1px solid #ddd' },
  };

  if (!adminToken) {
    return <p style={styles.error}>{t('socialLinks.adminTokenMissing')}</p>;
  }

  return (
    <>
    <div className="flex items-center justify-center flex-wrap md:gap-5 gap-2 p-3">
    <Link className={`text-white text-xs md:text-lg inner-shadow md:px-5 px-2 py-2 rounded-md ${pathname === '/admin/setting/logo' ? 'bg-[#ff7720] inner-shadow-admin text-[#000000]' : 'bg-[#35214f]'}`} href="/admin/setting/logo">{t('settings.logo')}</Link>
<Link className={`text-white text-xs md:text-lg inner-shadow md:px-5 px-2 py-2 rounded-md ${pathname === '/admin/setting/notifications' ? 'bg-[#ff7720] inner-shadow-admin text-[#000000]' : 'bg-[#35214f]'}`} href="/admin/setting/notifications">{t('settings.notifications')}</Link>
<Link className={`text-white text-xs md:text-lg inner-shadow md:px-5 px-2 py-2 rounded-md ${pathname === '/admin/setting/socialLinks' ? 'bg-[#ff7720] inner-shadow-admin text-[#000000]' : 'bg-[#35214f]'}`} href="/admin/setting/socialLinks">{t('settings.socialLinks')}</Link>
<Link className={`text-white text-xs md:text-lg inner-shadow md:px-5 px-2 py-2 rounded-md ${pathname === '/admin/setting/banners' ? 'bg-[#ff7720] inner-shadow-admin text-[#000000]' : 'bg-[#35214f]'}`} href="/admin/setting/banners">{t('settings.banners')}</Link>
<Link className={`text-white inner-shadow md:px-5 px-2 text-xs md:text-lg py-2 rounded-md ${pathname === '/admin/setting/policy' ? 'bg-[#ff7720] inner-shadow-admin text-[#000000]' : 'bg-[#35214f]'}`} href="/admin/setting/policy">
        {t('footer.returnPolicy')}
        </Link>
        <Link className={`text-white inner-shadow md:px-5 px-2 text-xs md:text-xl py-2 rounded-md ${pathname === '/admin/setting/condition' ? 'bg-[#ff7720] inner-shadow-admin text-[#000000]' : 'bg-[#35214f]'}`} href="/admin/setting/condition">
        {t('footer.returnCondition')}
        </Link>
    </div>
    <div className='flex w-full flex-col items-center justify-center p-5'>

    <div className='flex p-4 flex-col items-center justify-center bg-[linear-gradient(135deg,_#4f008c,_#190237,_#190237)] w-[100%] md:w-[60%] rounded-lg'>
      <h1 className="text-2xl font-bold text-white text-center">{t('socialLinks.manageSocialLinks')}</h1>

      {error && <p className="text-red">{error}</p>}
      {/* {isLoading && <p>Loading...</p>} // Can be more granular */} 

      <form onSubmit={handleSubmit} className='flex flex-col items-center justify-center gap-3'>
        <h2 className='text-[#00c48c]'>{isEditing ? t('socialLinks.edit') : t('socialLinks.addNew')} {t('socialLinks.socialLink')}</h2>
        <div className='w-full'>
          <label htmlFor="name" className='text-[#00c48c]'>{t('socialLinks.name')}*:</label>
          <input type="text" id="name" name="name" value={formData.name} onChange={handleInputChange} required className='w-full bg-white p-2 rounded-md' />
        </div>
        <div className='w-full'>
          <label htmlFor="url" className='text-[#00c48c]'>{t('socialLinks.url')}*:</label>
          <input type="url" id="url" name="url" value={formData.url} onChange={handleInputChange} required  className='w-full bg-white p-2 rounded-md'/>
        </div>
        <div>
          <label htmlFor="socialIconImage" className='text-[#00c48c]'>{t('socialLinks.iconImage')}:</label>
          <input type="file" id="socialIconImage" name="socialIconImage" onChange={handleFileChange} accept=".png,.jpg,.jpeg,.gif,.svg"  className='w-full bg-white p-2 rounded-md'/>
          {imagePreview && <img src={imagePreview} alt="Preview" />}
          {isEditing && formData.icon_value && !imagePreview && (
            <small>{t('socialLinks.currentImage')}: <a href={`${process.env.NEXT_PUBLIC_API_URL}${formData.icon_value}`} target="_blank" rel="noopener noreferrer">{t('socialLinks.view')}</a>. {t('socialLinks.uploadNewImage')}</small>
          )}
          {isEditing && !formData.icon_value && <small>{t('socialLinks.noCurrentImage')}</small>}
          {/* {!isEditing && <small>Optional: Upload an icon image.</small>} */}
        </div>

        <div className='w-full'>
          <label htmlFor="display_order" className='text-[#00c48c]'>{t('socialLinks.displayOrder')}:</label>
          <input type="number" id="display_order" name="display_order" value={formData.display_order} onChange={handleInputChange} className='w-full bg-white p-2 rounded-md' />
        </div>
        <div className='mt-3 '>
          <input type="checkbox" id="is_active" name="is_active" checked={formData.is_active} onChange={handleInputChange} />
          <label htmlFor="is_active" className='text-[#00c48c] mx-2'>{t('socialLinks.active')}</label>
        </div>
        <button type="submit" disabled={isLoading} className="text-white w-full mt-3 mb-3 bg-[#00c48c] px-5 py-2 rounded-md items-center justify-center">
          {isLoading ? (isEditing ? t('socialLinks.updating') : t('socialLinks.adding')) : (isEditing ? t('socialLinks.updateLink') : t('socialLinks.addLink'))}
        </button>
        {isEditing && (
          <button type="button" onClick={resetForm} className="text-white w-full mt-3 mb-3 bg-[#00c48c] px-5 py-2 rounded-md items-center justify-center" disabled={isLoading}>
            {t('socialLinks.cancelEdit')}
          </button>
        )}
      </form>
      </div>
      <h2 className='text-white text-xl font-bold  mb-2 mt-5'>{t('socialLinks.existingSocialLinks')}</h2>
      {isLoading && !socialLinks.length && <p>{t('socialLinks.loadingLinks')}</p>}
      <table className="w-full table-auto datatable-one">
        <thead>
          <tr className='bg-gray-800 shadow-xl text-orange bg-[linear-gradient(135deg,_#4f008c,_#190237,_#190237)]'>
            <th className="p-3 text-center font-bold text-xs md:text-lg inner-shadow">{t('socialLinks.icon')}</th>
            <th className="p-3 text-center font-bold text-xs md:text-lg inner-shadow">{t('socialLinks.name')}</th>
            <th className="p-3 text-center font-bold text-xs md:text-lg inner-shadow">{t('socialLinks.url')}</th>
            <th className="p-3 text-center font-bold text-xs md:text-lg inner-shadow">{t('socialLinks.displayOrder')}</th>
            <th className="p-3 text-center font-bold text-xs md:text-lg inner-shadow">{t('socialLinks.active')}</th>
            <th className="p-3 text-center font-bold text-xs md:text-lg inner-shadow">{t('socialLinks.actions')}</th>
          </tr>
        </thead>
        <tbody>
          {socialLinks.map(link => (
            <tr className="border-b border-gray-500 bg-[linear-gradient(135deg,rgba(79,0,140,0.7),rgba(25,2,55,0.7),rgba(25,2,55,0.5))]" key={link.id}>
              <td className="p-3 text-white text-center text-xs md:text-sm">
                {link.icon_value ? (
                  <img src={`${process.env.NEXT_PUBLIC_API_URL}${link.icon_value}`} alt={link.name} style={styles.iconPreview} />
                ) : (
                  <span style={{...styles.iconPreview, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: '#f0f0f0', color: '#777', fontSize: '0.8em'}}>{t('socialLinks.noImage')}</span>
                )}
              </td>
              <td className="p-3 text-white text-center text-xs md:text-sm"><strong>{link.name}</strong></td>
              <td className="p-3 text-white text-center text-xs md:text-sm">{link.url}</td>
              <td className="p-3 text-white text-center text-xs md:text-sm">{link.display_order}</td>
              <td className="p-3 text-white text-center text-xs md:text-sm">{link.is_active ? t('socialLinks.active') : t('socialLinks.inactive')}</td>
              <td className="p-3 text-white text-center text-xs md:text-sm" style={styles.itemActions}>
                {/* <button onClick={() => handleEdit(link)} className='text-white px-2 py-1 text-md mx-1 rounded-md bg-orange' disabled={isLoading}>Edit</button> */}
                <button onClick={() => handleDelete(link.id)} className='text-white px-2 py-1 text-md mx-1 rounded-md bg-red' disabled={isLoading}>{t('socialLinks.delete')}</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    
   </div>
    </>
  );
};

export default SocialLinksPage;
