"use client"
import axios from 'axios';
import React, { useEffect, useState } from 'react';
import toast, { Toaster } from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

const PolicyPage = () => {
      const { t, i18n } = useTranslation();
  
      const [loading, setLoading] = useState(true);
      const [policies, setPolicies] = useState([]);
      const [conditions, setConditions] = useState([]);
  // Fetch all policies
  const fetchPolicies = async () => {
    try {
      setLoading(true);
      const response = await axios.get(process.env.NEXT_PUBLIC_API_URL +'/api/policy');
      setPolicies(response.data);
    } catch (error) {
      console.error('Error fetching policies:', error);
      toast.error(t('policy.failedToLoad'));
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchPolicies();
  }, []);
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
  return (
  <div  className="min-h-screen w-full  flex flex-col lg:flex-row gap-8 mt-20 px-3 xl:px-0">
    {/* Conditions */}
    <div className="relative w-full h-full ">
    <div className="flex-1 max-w-3xl bg-[linear-gradient(135deg,_#190237,_#190237,_#4f008c)] mx-auto py-10  gradient-border-inf rounded-[30px] px-4 text-right" dir="rtl">
    {conditions.map((condition) => (
      <>
      <h1 dir={i18n.language === 'ar' ? 'rtl' : 'ltr'} className="text-xl xl:text-2xl font-bold mb-6 text-orange flex items-center gap-2">
      {(() => {  const text = typeof condition.conditionTitle === 'object' ? condition.conditionTitle : { en: condition.conditionTitle, ar: condition.conditionTitle };
       return i18n.language === 'ar' ? text.ar || text.en : text.en || text.ar; })()}
    </h1>
    <p dir={i18n.language === 'ar' ? 'rtl' : 'ltr'} className="mb-8 text-md xl:text-lg text-white">
      {(() => { const text = typeof condition.conditionContent === 'object' ? condition.conditionContent : { en: condition.conditionContent, ar: condition.conditionContent };
       return i18n.language === 'ar' ? text.ar || text.en : text.en || text.ar; })()}
    </p>
   
    </>
    ))}
    
 
    </div>
    </div>

    {/* Refund Policy */}
    <div className="relative w-full h-full">
    <div className="flex-1 max-w-3xl bg-[linear-gradient(135deg,_#190237,_#190237,_#4f008c)] rounded-[30px] mx-auto py-10 px-4 text-right  gradient-border-inf" dir="rtl">
    {policies.map((policy) => (
      <>
      <h1 dir={i18n.language === 'ar' ? 'rtl' : 'ltr'} className="text-xl xl:text-2xl font-bold mb-6 text-[#00c48c] flex items-center gap-2">
      {(() => {  const text = typeof policy.policyTitle === 'object' ? policy.policyTitle : { en: policy.policyTitle, ar: policy.policyTitle };
       return i18n.language === 'ar' ? text.ar || text.en : text.en || text.ar; })()}
    </h1>
    <p  dir={i18n.language === 'ar' ? 'rtl' : 'ltr'}className="mb-8 text-md xl:text-lg text-white">
      {(() => { const text = typeof policy.policyContent === 'object' ? policy.policyContent : { en: policy.policyContent, ar: policy.policyContent };
       return i18n.language === 'ar' ? text.ar || text.en : text.en || text.ar; })()}
    </p>
   
    </>
    ))}
    </div>
    </div>
  </div>
  )
}

export default PolicyPage;