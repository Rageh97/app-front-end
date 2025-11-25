'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { useEffect, useState } from 'react';
import axios from 'axios';
import toast, { Toaster } from 'react-hot-toast';

interface Condition {
  condition_Id: number;
  conditionTitle: {
    en: string;
    ar: string;
  };
  conditionContent: {
    en: string;
    ar: string;
  };
 
  isActive: boolean;
}


const ConditionPage = () => {
    const { t, i18n } = useTranslation();
    const pathname = usePathname();

    const [loading, setLoading] = useState(true);
    const [conditions, setConditions] = useState<Condition[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    conditionTitle_en: '',
    conditionTitle_ar: '',
    conditionContent_en: '',
    conditionContent_ar: '',

  });
// Fetch all policies
const fetchConditions = async () => {
  try {
    setLoading(true);
    const response = await axios.get(process.env.NEXT_PUBLIC_API_URL +'/api/condition');
    setConditions(response.data);
  } catch (error) {
    console.error('Error fetching conditions:', error);
    toast.error(t('policy.failedToLoad'));
  } finally {
    setLoading(false);
  }
};

useEffect(() => {
  fetchConditions();
}, []);
// ............................

// Handle form input changes
const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
  const { name, value } = e.target;
  setFormData(prev => ({ ...prev, [name]: value }));
};

// Handle form submission
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  
  const conditionData = {
    conditionTitle: {
      en: formData.conditionTitle_en,
      ar: formData.conditionTitle_ar,
    },
    conditionContent: {
      en: formData.conditionContent_en,
      ar: formData.conditionContent_ar,
    },
    
  };


  try {
    let response;
    if (editingId !== null) {
      response = await axios.put(
        `${process.env.NEXT_PUBLIC_API_URL}/api/condition/${editingId}`,
        conditionData,
        { headers: { 'Content-Type': 'application/json' } }
      );
      toast.success(t('condition.updatedCondition'));
    } else {
      response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/condition`,
        conditionData,
        { headers: { 'Content-Type': 'application/json' } }
      );
      toast.success(t('condition.conditionAdded'));
    }
     // Add this line
    
    // Reset form and refresh list
    setFormData({
      conditionTitle_en: '',
      conditionTitle_ar: '',
      conditionContent_en: '',
      conditionContent_ar: '',
    });
    setEditingId(null);
    fetchConditions();
  } catch (error) {
    console.error('Full error object:', error);
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error('Error response data:', error.response.data);
      console.error('Error response status:', error.response.status);
      console.error('Error response headers:', error.response.headers);
    } else if (error.request) {
      // The request was made but no response was received
      console.error('Error request:', error.request);
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error('Error message:', error.message);
    }
    toast.error(t('condition.failedToAdd'));
  }
};
 // Handle edit button click
 const handleEdit = (condition: Condition) => {
  setEditingId(condition.condition_Id);
  setFormData({
    conditionTitle_en: condition.conditionTitle.en,
    conditionTitle_ar: condition.conditionTitle.ar,
    conditionContent_en: condition.conditionContent.en,
    conditionContent_ar: condition.conditionContent.ar,
  });
  document.getElementById('condition-form')?.scrollIntoView({ behavior: 'smooth' });
};

// Handle delete button click
const handleDelete = async (id: number) => {
 
    try {
      await axios.delete(process.env.NEXT_PUBLIC_API_URL +`/api/condition/${id}`);
      toast.success(t('condition.conditionDeleted'));
      fetchConditions();
    } catch (error) {
      console.error('Error deleting condition:', error);
      toast.error(t('condition.failedToDelete'));
    }

};



    return (
        <>
           <Toaster position="top-right" reverseOrder={false} />

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

      
           <div className="p-6 bg-transparent">
           <div className="w-[100%] md:w-[80%] mx-auto bg-[linear-gradient(135deg,_#4f008c,_#190237,_#190237)] rounded-lg p-8">
          <h1 className="text-2xl font-bold mb-6 text-center text-white">{t('condition.addCondition')}</h1>
        
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="conditionTitle_en" className="block text-sm font-medium text-white mb-1">Condition Title (English)</label>
                <textarea
                  id="conditionTitle_en"
                  name="conditionTitle_en"
                  value={formData.conditionTitle_en.trim()}
                  onChange={handleChange}
                  className="p-3 bg-transparent border border-orange text-white rounded-lg w-full"
                  placeholder="Enter condition title in English"
                  required
                  rows={2}
                />
              </div>
              <div>
                <label htmlFor="conditionTitle_ar" className="block text-sm font-medium text-white mb-1">Condition (العربية)</label>
                <textarea
                  id="conditionTitle_ar"
                  name="conditionTitle_ar"
                  value={formData.conditionTitle_ar.trim()}
                  onChange={handleChange}
                  className="p-3 bg-transparent border border-orange text-white rounded-lg w-full"
                  placeholder="أدخل عنوان الشروط والأحكام باللغة العربية"
                  required
                  rows={2}
                />
              </div>
              <div>
                <label htmlFor="conditionContent_en" className="block text-sm font-medium text-white mb-1">Condition Content (English)</label>
                <textarea
                  id="conditionContent_en"
                  name="conditionContent_en"
                  value={formData.conditionContent_en.trim()}
                  onChange={handleChange}
                  className="p-3 bg-transparent border border-orange text-white rounded-lg w-full"
                  placeholder="Enter condition content in English"
                  required
                  rows={4}
                />
              </div>
              <div>
                <label htmlFor="conditionContent_ar" className="block text-sm font-medium text-white mb-1">Condition Content (العربية)</label>
                <textarea
                  id="conditionContent_ar"
                  name="conditionContent_ar"
                  value={formData.conditionContent_ar.trim()}
                  onChange={handleChange}
                  className="p-3 bg-transparent border border-orange text-white rounded-lg w-full"
                  placeholder="أدخل محتوى الشروط والأحكام باللغة العربية"
                  required
                  rows={4}
                />
              </div>
            </div>
            
            <button
              type="submit"
              className="w-full p-3 bg-[#00c48c] text-white rounded-lg hover:bg-[#ff8c00] focus:outline-none"
           
            >
             {editingId ? t('condition.updateCondition') : t('condition.submit')}
            </button>
          </form>
        </div>
      </div>
        {/* Policies List */}
        <div className="max-w-6xl mx-auto p-6">
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-center text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-orange-600 mb-6">
            {t('condition.conditionsList')}
          </h2>
          
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
              <p className="mt-4 text-gray-400">{t('common.loading')}...</p>
            </div>
          ) : conditions.length === 0 ? (
            <div className="text-center py-12 bg-gray-800/50 rounded-xl">
              <p className="text-gray-400">{t('condition.noCondition')}</p>
            </div>
          ) : (<>
          <div className=''>

            <div className=" rounded-xl">
              {conditions.map((condition) => (
                <div 
                  key={condition.condition_Id} 
                  className={`mb-5 bg-[linear-gradient(135deg,_#190237,_#190237,_#4f008c)] rounded-xl p-6 shadow-lg transition-all hover:shadow-xl ${
                    condition.isActive 
                      ? 'from-gray-800 to-gray-900 border-l-4 border-orange-500' 
                      : 'from-gray-900 to-gray-950 border-l-4 border-gray-600 opacity-75'
                  }`}
                >
                  <div className="flex justify-between items-start mb-4">
                   
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEdit(condition)}
                        className="p-2 text-blue-400 hover:text-blue-300 hover:bg-blue-900/30 rounded-full transition-colors"
                        title={t('common.edit')}
                      >
                        <svg className="w-5 h-5 text-orange" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDelete(condition.condition_Id)}
                        className="p-2 text-red-400 hover:text-red-300 hover:bg-red-900/30 rounded-full transition-colors"
                        title={t('common.delete')}
                      >
                        <svg className="w-5 h-5 text-red" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                  
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      {/* <h4 className="text-sm font-medium text-orange-400 mb-1">English</h4> */}
                      <p className="text-white whitespace-pre-line">
                      {(() => {
                        const text = typeof condition.conditionTitle === 'object' ? condition.conditionTitle : { en: condition.conditionTitle, ar: condition.conditionTitle };
                        return i18n.language === 'ar' ? text.ar || text.en : text.en || text.ar;
                      })()}
                      </p>
                      <p className="text-white whitespace-pre-line">
                      {(() => {
                        const text = typeof condition.conditionContent === 'object' ? condition.conditionContent : { en: condition.conditionContent, ar: condition.conditionContent };
                        return i18n.language === 'ar' ? text.ar || text.en : text.en || text.ar;
                      })()}
                      </p>
                     
                    </div>
                    
                    {/* <div className="pt-4 border-t border-gray-700">
                      <h4 className="text-sm font-medium text-orange-400 mb-1 text-right" dir="rtl">العربية</h4>
                      <p className="text-gray-300 whitespace-pre-line text-right" dir="rtl">
                        {policy.policy.ar}
                      </p>
                    </div> */}
                  </div>
                </div>
              ))}
            </div>
            </div>
            </>)}
        </div>
      </div>
        </>
    );
};

export default ConditionPage;