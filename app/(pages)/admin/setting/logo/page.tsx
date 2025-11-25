'use client';

import { useState, useEffect, ChangeEvent, FormEvent } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslation } from 'react-i18next';

const API_URL = process.env.NEXT_PUBLIC_API_URL;
const MAIN_LOGO_KEY = 'site_logo';
const SUB_LOGO_KEY = 'site_sub_logo';

const LogoPage = () => {
    const { t } = useTranslation();
    const pathname = usePathname();
    const [currentMainLogoUrl, setCurrentMainLogoUrl] = useState<string | null>(null);
    const [currentSubLogoUrl, setCurrentSubLogoUrl] = useState<string | null>(null);
    const [selectedMainFile, setSelectedMainFile] = useState<File | null>(null);
    const [selectedSubFile, setSelectedSubFile] = useState<File | null>(null);
    const [previewMainUrl, setPreviewMainUrl] = useState<string | null>(null);
    const [previewSubUrl, setPreviewSubUrl] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [message, setMessage] = useState<string>('');
    const [error, setError] = useState<string>('');

    const fetchCurrentLogos = async () => {
        setIsLoading(true);
        setError('');
        try {
            const response = await fetch(`${API_URL}/api/admin/settings/logos`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('a')}`,
                },
            });
            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.message || t('logo.failedToFetch'));
            }
            const data = await response.json();
            if (data.mainLogo) {
                setCurrentMainLogoUrl(`${API_URL}${data.mainLogo}`);
            }
            if (data.subLogo) {
                setCurrentSubLogoUrl(`${API_URL}${data.subLogo}`);
            }
        } catch (err: any) {
            setError(err.message || t('logo.errorFetching'));
            console.error('Fetch logos error:', err);
        }
        setIsLoading(false);
    };

    useEffect(() => {
        fetchCurrentLogos();
    }, []);

    const handleMainFileChange = (event: ChangeEvent<HTMLInputElement>) => {
        setMessage('');
        setError('');
        if (event.target.files && event.target.files[0]) {
            const file = event.target.files[0];
            setSelectedMainFile(file);
            setPreviewMainUrl(URL.createObjectURL(file));
        } else {
            setSelectedMainFile(null);
            setPreviewMainUrl(null);
        }
    };

    const handleSubFileChange = (event: ChangeEvent<HTMLInputElement>) => {
        setMessage('');
        setError('');
        if (event.target.files && event.target.files[0]) {
            const file = event.target.files[0];
            setSelectedSubFile(file);
            setPreviewSubUrl(URL.createObjectURL(file));
        } else {
            setSelectedSubFile(null);
            setPreviewSubUrl(null);
        }
    };

    const handleMainLogoSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!selectedMainFile) {
            setError(t('logo.selectMainLogo'));
            return;
        }

        setIsLoading(true);
        setMessage('');
        setError('');

        const formData = new FormData();
        formData.append('logoImage', selectedMainFile);
        formData.append('logoType', 'main');

        try {
            const response = await fetch(`${API_URL}/api/admin/settings/${MAIN_LOGO_KEY}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('a')}`,
                },
                body: formData,
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || t('logo.failedToUpdateMain'));
            }

            const updatedSetting = await response.json();
            setMessage(t('logo.mainLogoUpdated'));
            if (updatedSetting.value) {
                setCurrentMainLogoUrl(`${API_URL}${updatedSetting.value}?t=${new Date().getTime()}`);
            }
            setSelectedMainFile(null);
            setPreviewMainUrl(null);
        } catch (err: any) {
            setError(err.message || t('logo.errorUploadingMain'));
            console.error('Upload error:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubLogoSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!selectedSubFile) {
            setError(t('logo.selectSubLogo'));
            return;
        }

        setIsLoading(true);
        setMessage('');
        setError('');

        const formData = new FormData();
        formData.append('logoImage', selectedSubFile);
        formData.append('logoType', 'sub');

        try {
            const response = await fetch(`${API_URL}/api/admin/settings/${SUB_LOGO_KEY}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('a')}`,
                },
                body: formData,
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || t('logo.failedToUpdateSub'));
            }

            const updatedSetting = await response.json();
            setMessage(t('logo.subLogoUpdated'));
            if (updatedSetting.value) {
                setCurrentSubLogoUrl(`${API_URL}${updatedSetting.value}?t=${new Date().getTime()}`);
            }
            setSelectedSubFile(null);
            setPreviewSubUrl(null);
        } catch (err: any) {
            setError(err.message || t('logo.errorUploadingSub'));
            console.error('Upload error:', err);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            <div className="flex items-center justify-center flex-wrap md:gap-5 gap-2 p-5">
                <Link className={`text-white text-xs md:text-lg inner-shadow md:px-5 px-2 py-2 rounded-md ${pathname === '/admin/setting/logo' ? 'bg-[#ff7720] inner-shadow-admin text-[#000000]' : 'bg-[#35214f]'}`} href="/admin/setting/logo">{t('settings.logo')}</Link>
                <Link className={`text-white text-xs md:text-lg inner-shadow md:px-5 px-2 py-2 rounded-md ${pathname === '/admin/setting/notifications' ? 'bg-[#ff7720] inner-shadow-admin text-[#000000]' : 'bg-[#35214f]'}`} href="/admin/setting/notifications">{t('settings.notifications')}</Link>
                <Link className={`text-white text-xs md:text-lg inner-shadow md:px-5 px-2 py-2 rounded-md ${pathname === '/admin/setting/socialLinks' ? 'bg-[#ff7720] inner-shadow-admin text-[#000000]' : 'bg-[#35214f]'}`} href="/admin/setting/socialLinks">{t('settings.socialLinks')}</Link>
                <Link className={`text-white text-xs md:text-lg inner-shadow md:px-5 px-2 py-2 rounded-md ${pathname === '/admin/setting/banners' ? 'bg-[#ff7720] inner-shadow-admin text-[#000000]' : 'bg-[#35214f]'}`} href="/admin/setting/banners">{t('settings.banners')}</Link>
                <Link className={`text-white inner-shadow md:px-5 px-2 text-xs md:text-lg py-2 rounded-md ${pathname === '/admin/setting/policy' ? 'bg-[#ff7720] inner-shadow-admin text-[#000000]' : 'bg-[#35214f]'}`} href="/admin/setting/policy">
        {t('footer.returnPolicy')}
        </Link>
        <Link className={`text-white inner-shadow md:px-5 px-2 text-xs md:text-lg py-2 rounded-md ${pathname === '/admin/setting/condition' ? 'bg-[#ff7720] inner-shadow-admin text-[#000000]' : 'bg-[#35214f]'}`} href="/admin/setting/condition">
        {t('footer.returnCondition')}
        </Link>
            </div>
            <div className='flex items-center justify-center p-5'>
                <div className="w-full flex flex-col items-center justify-center bg-[linear-gradient(135deg,_#4f008c,_#190237,_#190237)] p-4 w-[50%] rounded-lg">
                    <h1 className="text-2xl font-bold text-white mb-6">{t('logo.manageSiteLogos')}</h1>

                    {isLoading && <p className="text-white">{t('logo.uploading')}</p>}
                    {message && <p className="text-[#00c48c]">{message}</p>}
                    {error && <p className="text-red">{error}</p>}

                    {/* Main Logo Section */}
                    <div className="w-full mb-8">
                        <h2 className="text-orange text-center mb-4">{t('logo.mainLogo')}:</h2>
                        <div className="flex flex-col items-center">
                            {currentMainLogoUrl ? (
                                <img src={currentMainLogoUrl} alt={t('logo.mainLogo')} className="w-40 mb-4" />
                            ) : (
                                <p className="text-orange mb-4">{t('logo.noMainLogo')}</p>
                            )}

                            <form onSubmit={handleMainLogoSubmit} className="flex flex-col items-center w-full">
                                <div className="w-full mb-4">
                                    <label className="text-[#00c48c] block mb-2" htmlFor="mainLogoUpload">{t('logo.uploadNewMainLogo')}:</label>
                                    <input 
                                        className="w-full p-2 rounded-md bg-white"
                                        type="file" 
                                        id="mainLogoUpload" 
                                        accept=".png,.jpg,.jpeg,.gif,.svg" 
                                        onChange={handleMainFileChange} 
                                    />
                                </div>

                                {previewMainUrl && (
                                    <div className="mb-4">
                                        <h3 className="text-[#00c48c] mb-2">{t('logo.newMainLogoPreview')}:</h3>
                                        <img src={previewMainUrl} alt={t('logo.newMainLogoPreview')} className="w-40" />
                                    </div>
                                )}

                                <button 
                                    type="submit" 
                                    disabled={isLoading || !selectedMainFile} 
                                    className="text-white mt-3 mb-3 bg-[#00c48c] px-5 py-2 rounded-md items-center justify-center"
                                >
                                    {isLoading ? t('logo.uploading') : t('logo.uploadSaveMainLogo')}
                                </button>
                            </form>
                        </div>
                    </div>

                    {/* Sub Logo Section */}
                    <div className="w-full">
                        <h2 className="text-orange text-center mb-4">{t('logo.subLogo')}:</h2>
                        <div className="flex flex-col items-center">
                            {currentSubLogoUrl ? (
                                <img src={currentSubLogoUrl} alt={t('logo.subLogo')} className="w-40 mb-4" />
                            ) : (
                                <p className="text-orange mb-4">{t('logo.noSubLogo')}</p>
                            )}

                            <form onSubmit={handleSubLogoSubmit} className="flex flex-col items-center w-full">
                                <div className="w-full mb-4">
                                    <label className="text-[#00c48c] block mb-2" htmlFor="subLogoUpload">{t('logo.uploadNewSubLogo')}:</label>
                                    <input 
                                        className="w-full p-2 rounded-md bg-white"
                                        type="file" 
                                        id="subLogoUpload" 
                                        accept=".png,.jpg,.jpeg,.gif,.svg" 
                                        onChange={handleSubFileChange} 
                                    />
                                </div>

                                {previewSubUrl && (
                                    <div className="mb-4">
                                        <h3 className="text-[#00c48c] mb-2">{t('logo.newSubLogoPreview')}:</h3>
                                        <img src={previewSubUrl} alt={t('logo.newSubLogoPreview')} className="w-40" />
                                    </div>
                                )}

                                <button 
                                    type="submit" 
                                    disabled={isLoading || !selectedSubFile} 
                                    className="text-white mt-3 mb-3 bg-[#00c48c] px-5 py-2 rounded-md items-center justify-center"
                                >
                                    {isLoading ? t('logo.uploading') : t('logo.uploadSaveSubLogo')}
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default LogoPage;