"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import Link from "next/link";
import { toast, Toaster } from "react-hot-toast";
import FingerprintJS from "@fingerprintjs/fingerprintjs";
import { 
  ArrowRight, Mic, Play, Pause, Download, Volume2,
  CreditCard, RefreshCw, Check, ChevronDown,
  X, Upload, CheckCircle2, Copy, Trash2, History, RotateCcw,
  Sparkles, Globe2, Clapperboard, Drama, FileText,
  MessageSquare, Sliders, Terminal, SlidersHorizontal, Menu, Crown
} from "lucide-react";
import { BorderBeam } from "@/components/ui/border-beam";
import UpgradeModal from "@/components/Modals/UpgradeModal";
import { AIGenerateButton, AIDeleteModal } from "@/components/ai";
import { useAiPricing } from '@/hooks/useAiPricing';

interface Persona {
  id: string;
  name: string;
  badge: string;
  badgeType: 'gemini' | 'openai' | 'custom' | 'pro';
  gender: 'male' | 'female';
  toneCategory: 'حيوي' | 'رسمي' | 'هادئ' | 'إعلاني' | 'قصصي' | 'متوازن';
  desc: string;
  model: string;
  avatar?: string;
}

const PERSONAS: Persona[] = [
  {
    id: 'zaid',
    name: 'زيد',
    badge: 'جيميني 3',
    badgeType: 'gemini',
    gender: 'male',
    toneCategory: 'حيوي',
    desc: 'صوت رجالي قوي ومعبر',
    model: 'gemini-3.1'
  },
  {
    id: 'amira',
    name: 'أميرة',
    badge: 'جيميني 3',
    badgeType: 'gemini',
    gender: 'female',
    toneCategory: 'هادئ',
    desc: 'صوت نسائي عذب ورخيم',
    model: 'gemini-3.1'
  },
  {
    id: 'nesreen',
    name: 'نهرين',
    badge: 'جيميني 3',
    badgeType: 'gemini',
    gender: 'female',
    toneCategory: 'هادئ',
    desc: 'صوت نسائي سلس وهادئ',
    model: 'gemini-3.1'
  },
  {
    id: 'layan',
    name: 'ليان',
    badge: 'جيميني 3',
    badgeType: 'gemini',
    gender: 'female',
    toneCategory: 'حيوي',
    desc: 'صوت نسائي عفوي ومنطلق',
    model: 'gemini-3.1'
  },
  {
    id: 'adnan',
    name: 'عدنان',
    badge: 'جيميني 3',
    badgeType: 'gemini',
    gender: 'male',
    toneCategory: 'رسمي',
    desc: 'صوت إذاعي عميق وفخم',
    model: 'gemini-3.1'
  },
  {
    id: 'tariq',
    name: 'طارق',
    badge: 'جيميني 3',
    badgeType: 'gemini',
    gender: 'male',
    toneCategory: 'حيوي',
    desc: 'صوت شبابي واثق وجذاب',
    model: 'gemini-3.1'
  },
  {
    id: 'ali',
    name: 'علي',
    badge: 'جيميني 3',
    badgeType: 'gemini',
    gender: 'male',
    toneCategory: 'حيوي',
    desc: 'صوت شبابي مفعم بالحيوية',
    model: 'gemini-3.1'
  },
  {
    id: 'sarah',
    name: 'سارة',
    badge: 'OpenAI',
    badgeType: 'openai',
    gender: 'female',
    toneCategory: 'حيوي',
    desc: 'صوت مرح ومشرق',
    model: 'openai'
  },
  {
    id: 'omar',
    name: 'عمر',
    badge: 'OpenAI',
    badgeType: 'openai',
    gender: 'male',
    toneCategory: 'رسمي',
    desc: 'صوت دافئ ومتزن',
    model: 'openai'
  },
  {
    id: 'youssef',
    name: 'يوسف',
    badge: 'OpenAI',
    badgeType: 'openai',
    gender: 'male',
    toneCategory: 'إعلاني',
    desc: 'صوت سينمائي ترويجي',
    model: 'openai'
  },
  {
    id: 'haidar',
    name: 'حيدر',
    badge: 'OpenAI',
    badgeType: 'openai',
    gender: 'male',
    toneCategory: 'قصصي',
    desc: 'راوي قصص سينمائي',
    model: 'openai'
  },
  {
    id: 'mariam',
    name: 'مريم',
    badge: 'OpenAI',
    badgeType: 'openai',
    gender: 'female',
    toneCategory: 'رسمي',
    desc: 'صوت وثائقي نقي',
    model: 'openai'
  },
  {
    id: 'shams',
    name: 'شمس',
    badge: 'بودكاست',
    badgeType: 'openai',
    gender: 'female',
    toneCategory: 'متوازن',
    desc: 'صوت حواري متوازن',
    model: 'openai'
  }
];

const SUGGESTIONS = [
  {
    title: 'سرد قصصي',
    text: 'كان يا ما كان في قديم الزمان، في قرية هادئة تحيط بها الجبال الخضراء، عاش حكيم يعرف أسرار الطبيعة وألغاز النجوم. وفي ليلة صافية، ظهر نجم ساطع لم يره أحد من قبل...'
  },
  {
    title: 'نص إعلاني',
    text: 'مرحباً بكم في عصر الابتكار والسرعة. خدماتنا صُممت خصيصاً لتمنحك الأفضلية والتألق في عالم الأعمال المتسارع، بجودة لا تضاهى وتجربة فريدة ومميزة.'
  },
  {
    title: 'مقدمة بودكاست',
    text: 'مرحباً بكم في حلقة جديدة ومثيرة من البودكاست الأسبوعي. اليوم سنغوص معاً في أعماق التكنولوجيا الذكية ونستكشف كيف تصنع الخوارزميات ثورة جديدة في عالمنا المعاصر.'
  },
  {
    title: 'حوار إذاعي',
    text: 'المحاور: ما هو السر الحقيقي للنجاح في هذا العصر الرقمي السريع؟\nالخبير: السر ليس في السرعة وحدها، بل في القدرة على التكيف والتعلم المستمر مع كل تغير يطرأ على العالم من حولنا.'
  },
  {
    title: 'مشهد وثائقي',
    text: 'في ساعات الفجر الأولى، حين كان الضباب يعانق سطح الماء الهادئ، وقفنا على حافة القارب نترقب بهدوء. كانت نسائم البحر الباردة تحمل رائحة المغامرة قبل شروق الشمس.'
  }
];

const CUSTOM_PROMPT_PRESETS = [
  {
    title: 'إعلان مصري حماسي',
    prompt: 'تحدث بصوت شاب إذاعي حماسي باللهجة المصرية، وبنبرة ترويجية سريعة ومبهجة واقرأ هذا الإعلان: "عرض الصيف الأقوى رجع من جديد! خصومات تصل لحد سبعين في المية على كل المنتجات. الحق العرض قبل ما يخلص!"'
  },
  {
    title: 'حكمة عراقية دافئة',
    prompt: 'تحدث بصوت رجل مسن حكيم باللهجة العراقية الأصيلة وبنبرة دافئة وهادئة: "يا وليدي تذكر دائماً، أن القوة الحقيقية مو بكثرة الكلام، القوة هي صبرك وطيبتك ووكفتك الصح وية الناس."'
  },
  {
    title: 'بودكاست خليجي عفوي',
    prompt: 'تحدثي بصوت فتاة شابة عفوية ومرحة باللهجة الخليجية وبنبرة مشرقة: "يا هلا والله ومسهلا فيكم بحلقة جديدة من بودكاستنا، اليوم نبي نسولف عن أسرار الإنتاجية وكيف تنظم يومك بكل روقان."'
  },
  {
    title: 'وثائقي فصحى فخم',
    prompt: 'تحدث بنبرة راوي وثائقيات عميق ورسمي بالعربية الفصحى وبسرعة هادئة ومتزنة: "في أقاصي الأرض، حيث تلتقي الثلوج الأبدية بالرياح العاتية، تروي الطبيعة ملحمة البقاء بصمت مهيب."'
  },
  {
    title: 'سرد شامي لطيف',
    prompt: 'تحدثي بصوت أنثوي شامي لطيف وناعم وبنبرة دافئة وقصصية: "صباح الخير يا حلوين، فنجان قهوة الصبح مو بس مشروب، هو رواء وراحة بال لتبلش يومك بأمل وتفاؤل."'
  }
];

const SAMPLE_DRAMA_SCRIPT = `(صوت موسيقى تصويرية هادئة وحزينة)

طارق (بنبرة منكسرة ومترددة):
كنتُ أعتقد أننا نتشارك الحلم نفسه... لكنكِ بنيتِ نصركِ على أنقاض كل ما وعدتِ به.

ليلى (بنبرة باردة وحازمة):
الأحلام ترفٌ لا نملكه يا طارق. في هذا العالم، إما أن ترضى بأن تكون الضحية، أو تقرر بيدك مَن يدفع الثمن.

طارق (بانفعال وغضب مكتوم):
والثمن كان أنا؟ سنوات من الثقة والوفاء... أحرقتِها في ليلة واحدة؟

ليلى (تتنهد، بصوت يتسلل إليه الحزن والندم):
لو تركتُك تكمل الطريق معي لسقطنا معاً. أحياناً... يجب أن تكسر قلب من تحب، لتحميه من مصير أسوأ.

طارق (بهمس مرير، وصوت يبتعد تدريجياً):
أنتِ لم تحميني يا ليلى... أنتِ فقط تركتِني وحيداً في العاصفة.

(صوت رياح خافت يتلاشى مع صمت مطبق)`;

interface HistoryItem {
  id: number;
  text: string;
  voiceName: string;
  voiceBadge: string;
  dialect: string;
  url: string;
  date: string;
}

// 3D Apple Memoji Style Avatar Component
function PersonaMemojiAvatar({ persona, className = "w-full h-full" }: { persona?: Persona | null; className?: string }) {
  if (!persona) return null;

  // Custom image if uploaded
  if (persona.avatar && !persona.avatar.includes('/images/user/user-')) {
    return (
      <img
        src={persona.avatar}
        alt={persona.name}
        className={`${className} object-cover rounded-full`}
        onError={(e) => {
          (e.target as HTMLElement).style.display = 'none';
        }}
      />
    );
  }

  const id = persona.id;

  // 1. Zaid (Red Beanie + Round Glasses + Beard)
  if (id === 'zaid') {
    return (
      <svg viewBox="0 0 100 100" className={className} fill="none">
        <circle cx="50" cy="50" r="50" fill="#e8e4de" />
        {/* Shoulders */}
        <path d="M22 88c0-14 12-22 28-22s28 8 28 22v12H22V88z" fill="#374151" />
        <path d="M42 66h16v14c0 4-3 7-8 7s-8-3-8-7V66z" fill="#e5ad89" />
        {/* Head */}
        <ellipse cx="50" cy="52" rx="20" ry="24" fill="#f4c29e" />
        {/* Ears */}
        <circle cx="29" cy="52" r="5" fill="#e8b18c" />
        <circle cx="71" cy="52" r="5" fill="#e8b18c" />
        {/* Beard */}
        <path d="M34 50c0 14 7 24 16 24s16-10 16-24c-3 4-9 6-16 6s-13-2-16-6z" fill="#2b231f" />
        {/* Mouth */}
        <path d="M44 63c2 3 10 3 12 0" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" />
        {/* Eyes & Eyebrows */}
        <ellipse cx="42" cy="48" rx="2.5" ry="3" fill="#1f2937" />
        <ellipse cx="58" cy="48" rx="2.5" ry="3" fill="#1f2937" />
        <circle cx="43" cy="47" r="0.8" fill="#ffffff" />
        <circle cx="59" cy="47" r="0.8" fill="#ffffff" />
        <path d="M38 43c2-1.5 5-1.5 8 0" stroke="#2b231f" strokeWidth="2" strokeLinecap="round" />
        <path d="M54 43c3-1.5 6-1.5 8 0" stroke="#2b231f" strokeWidth="2" strokeLinecap="round" />
        {/* Glasses */}
        <circle cx="42" cy="48" r="7.5" stroke="#18181b" strokeWidth="2.2" fill="#ffffff" fillOpacity="0.15" />
        <circle cx="58" cy="48" r="7.5" stroke="#18181b" strokeWidth="2.2" fill="#ffffff" fillOpacity="0.15" />
        <path d="M49.5 48h1" stroke="#18181b" strokeWidth="2.2" strokeLinecap="round" />
        <path d="M34.5 47l-4.5-1" stroke="#18181b" strokeWidth="1.8" strokeLinecap="round" />
        <path d="M65.5 47l4.5-1" stroke="#18181b" strokeWidth="1.8" strokeLinecap="round" />
        {/* Red Beanie Cap */}
        <path d="M28 40c0-15 9-25 22-25s22 10 22 25H28z" fill="#dc2626" />
        <path d="M26 38c0-3 2-5 5-5h38c3 0 5 2 5 5v5c0 2-2 4-5 4H31c-3 0-5-2-5-4v-5z" fill="#b91c1c" />
        <path d="M35 34v8M45 34v8M55 34v8M65 34v8" stroke="#991b1b" strokeWidth="1.2" strokeLinecap="round" />
      </svg>
    );
  }

  // 2. Amira (Blonde Ponytail + Earrings + Sweet Smile)
  if (id === 'amira') {
    return (
      <svg viewBox="0 0 100 100" className={className} fill="none">
        <circle cx="50" cy="50" r="50" fill="#ede7e1" />
        {/* Ponytail */}
        <path d="M62 30c12-4 22 4 20 20-1 9-8 16-16 18" stroke="#eab308" strokeWidth="10" strokeLinecap="round" fill="none" />
        <circle cx="64" cy="30" r="4" fill="#6366f1" />
        {/* Shoulders */}
        <path d="M24 88c0-13 12-20 26-20s26 7 26 20v12H24V88z" fill="#f43f5e" />
        <path d="M43 66h14v12c0 4-3 6-7 6s-7-2-7-6V66z" fill="#fed7aa" />
        {/* Head */}
        <ellipse cx="50" cy="50" rx="19" ry="21" fill="#ffedd5" />
        {/* Golden Hoop Earrings */}
        <circle cx="30" cy="50" r="4" fill="#fed7aa" />
        <circle cx="70" cy="50" r="4" fill="#fed7aa" />
        <circle cx="30" cy="54" r="3" stroke="#f59e0b" strokeWidth="1.5" fill="none" />
        <circle cx="70" cy="54" r="3" stroke="#f59e0b" strokeWidth="1.5" fill="none" />
        {/* Blonde Hair */}
        <path d="M30 46c-1-14 8-24 20-24s21 10 20 24c-4-6-10-9-20-9s-16 3-20 9z" fill="#facc15" />
        <path d="M31 43c2-8 8-15 19-15 6 0 12 3 16 7" stroke="#eab308" strokeWidth="2.5" strokeLinecap="round" fill="none" />
        {/* Eyes & Lashes */}
        <ellipse cx="43" cy="49" rx="2.5" ry="3" fill="#374151" />
        <ellipse cx="57" cy="49" rx="2.5" ry="3" fill="#374151" />
        <circle cx="44" cy="48" r="0.8" fill="#ffffff" />
        <circle cx="58" cy="48" r="0.8" fill="#ffffff" />
        <path d="M39 45l3 2M61 45l-3 2" stroke="#1f2937" strokeWidth="1.2" strokeLinecap="round" />
        <path d="M39 44c2-2 6-2 8 0" stroke="#ca8a04" strokeWidth="1.8" strokeLinecap="round" />
        <path d="M53 44c2-2 6-2 8 0" stroke="#ca8a04" strokeWidth="1.8" strokeLinecap="round" />
        {/* Cheeks & Smile */}
        <circle cx="38" cy="54" r="3" fill="#fda4af" opacity="0.6" />
        <circle cx="62" cy="54" r="3" fill="#fda4af" opacity="0.6" />
        <path d="M45 58c2 3 8 3 10 0" stroke="#e11d48" strokeWidth="2.5" strokeLinecap="round" />
      </svg>
    );
  }

  // 3. Nesreen / Nahrin (Purple Beanie + Peace Sign + Dark Strands)
  if (id === 'nesreen') {
    return (
      <svg viewBox="0 0 100 100" className={className} fill="none">
        <circle cx="50" cy="50" r="50" fill="#ebe6f2" />
        <path d="M22 88c0-13 12-21 28-21s28 8 28 21v12H22V88z" fill="#7c3aed" />
        <path d="M43 65h14v13c0 4-3 6-7 6s-7-2-7-6V65z" fill="#fbcfe8" />
        <path d="M30 46v16c0 6 3 12 7 12h26c4 0 7-6 7-12V46" fill="#262626" />
        <ellipse cx="50" cy="50" rx="19" ry="22" fill="#fdf2f8" />
        <path d="M32 46c2 6 5 14 5 18M68 46c-2 6-5 14-5 18" stroke="#262626" strokeWidth="3" strokeLinecap="round" />
        {/* Purple Beanie */}
        <path d="M28 38c0-15 10-24 22-24s22 9 22 24H28z" fill="#9333ea" />
        <path d="M26 36c0-3 2-5 5-5h38c3 0 5 2 5 5v5c0 2-2 4-5 4H31c-3 0-5-2-5-4v-5z" fill="#7e22ce" />
        <ellipse cx="43" cy="48" rx="2.5" ry="3" fill="#1f2937" />
        <ellipse cx="57" cy="48" rx="2.5" ry="3" fill="#1f2937" />
        <circle cx="44" cy="47" r="0.8" fill="#ffffff" />
        <circle cx="58" cy="47" r="0.8" fill="#ffffff" />
        <path d="M39 43c2-2 5-2 8 0" stroke="#581c87" strokeWidth="1.8" strokeLinecap="round" />
        <path d="M53 43c3-2 6-2 8 0" stroke="#581c87" strokeWidth="1.8" strokeLinecap="round" />
        <circle cx="39" cy="53" r="3" fill="#f472b6" opacity="0.6" />
        <circle cx="61" cy="53" r="3" fill="#f472b6" opacity="0.6" />
        <path d="M45 56c2 3 8 3 10 0" stroke="#be185d" strokeWidth="2.5" strokeLinecap="round" />
        {/* Peace Hand */}
        <g transform="translate(68, 52) scale(0.65)">
          <ellipse cx="14" cy="24" rx="8" ry="10" fill="#fbcfe8" />
          <rect x="7" y="4" width="4.5" height="18" rx="2.2" fill="#fbcfe8" />
          <rect x="15" y="6" width="4.5" height="17" rx="2.2" fill="#fbcfe8" />
          <circle cx="16" cy="22" r="6" fill="#f472b6" opacity="0.2" />
        </g>
      </svg>
    );
  }

  // 4. Layan (Dark Hair + Cyan/Dark Headphones)
  if (id === 'layan') {
    return (
      <svg viewBox="0 0 100 100" className={className} fill="none">
        <circle cx="50" cy="50" r="50" fill="#e2e8f0" />
        <path d="M22 88c0-13 12-21 28-21s28 8 28 21v12H22V88z" fill="#0f172a" />
        <path d="M43 65h14v13c0 4-3 6-7 6s-7-2-7-6V65z" fill="#fed7aa" />
        <path d="M28 45c0-16 10-25 22-25s22 9 22 25v18c0 5-4 10-8 10h-2c-2-5-4-12-4-18H40c0 6-2 13-4 18h-2c-4 0-8-5-8-10V45z" fill="#18181b" />
        <ellipse cx="50" cy="51" rx="19" ry="21" fill="#ffedd5" />
        <path d="M31 38c6 0 10 4 19 4s13-4 19-4c-4-8-10-12-19-12s-15 4-19 12z" fill="#18181b" />
        {/* Headphones */}
        <path d="M26 48c0-18 10-28 24-28s24 10 24 28" stroke="#334155" strokeWidth="4.5" strokeLinecap="round" fill="none" />
        <rect x="23" y="42" width="6" height="15" rx="3" fill="#06b6d4" />
        <rect x="71" y="42" width="6" height="15" rx="3" fill="#06b6d4" />
        <ellipse cx="43" cy="49" rx="2.5" ry="3" fill="#0f172a" />
        <ellipse cx="57" cy="49" rx="2.5" ry="3" fill="#0f172a" />
        <circle cx="44" cy="48" r="0.8" fill="#ffffff" />
        <circle cx="58" cy="48" r="0.8" fill="#ffffff" />
        <path d="M39 44c2-2 5-2 8 0" stroke="#18181b" strokeWidth="1.8" strokeLinecap="round" />
        <path d="M53 44c3-2 6-2 8 0" stroke="#18181b" strokeWidth="1.8" strokeLinecap="round" />
        <path d="M45 57c2 3 8 3 10 0" stroke="#e11d48" strokeWidth="2.5" strokeLinecap="round" />
      </svg>
    );
  }

  // 5. Adnan (Distinguished Grey Hair + Beard + Glasses)
  if (id === 'adnan') {
    return (
      <svg viewBox="0 0 100 100" className={className} fill="none">
        <circle cx="50" cy="50" r="50" fill="#e5e5eb" />
        <path d="M22 88c0-14 12-22 28-22s28 8 28 22v12H22V88z" fill="#1e293b" />
        <path d="M43 66h14v13c0 4-3 6-7 6s-7-2-7-6V66z" fill="#e2b49a" />
        <path d="M28 44c0-16 10-25 22-25s22 9 22 25c-4-4-10-7-22-7s-18 3-22 7z" fill="#9ca3af" />
        <path d="M30 38c3-8 9-13 20-13s17 5 20 13c-5-4-11-6-20-6s-15 2-20 6z" fill="#d1d5db" />
        <ellipse cx="50" cy="51" rx="19" ry="22" fill="#eed2bf" />
        <circle cx="30" cy="51" r="4.5" fill="#e2b49a" />
        <circle cx="70" cy="51" r="4.5" fill="#e2b49a" />
        {/* Grey Beard */}
        <path d="M34 50c0 14 7 24 16 24s16-10 16-24c-3 3-9 5-16 5s-13-2-16-5z" fill="#9ca3af" />
        <path d="M40 60c3 1 7 1 10 0 4 3 8 3 10 0-3 6-7 10-10 10s-7-4-10-10z" fill="#d1d5db" />
        {/* Glasses */}
        <rect x="34" y="43" width="13" height="10" rx="2.5" stroke="#374151" strokeWidth="2" fill="#ffffff" fillOpacity="0.2" />
        <rect x="53" y="43" width="13" height="10" rx="2.5" stroke="#374151" strokeWidth="2" fill="#ffffff" fillOpacity="0.2" />
        <path d="M47 47h6M34 46l-4-1M66 46l4-1" stroke="#374151" strokeWidth="2" strokeLinecap="round" />
        <ellipse cx="40.5" cy="48" rx="2" ry="2.5" fill="#1f2937" />
        <ellipse cx="59.5" cy="48" rx="2" ry="2.5" fill="#1f2937" />
        <path d="M36 40c2-1 6-1 9 0" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" />
        <path d="M55 40c3-1 7-1 9 0" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" />
        <path d="M45 64c2 2 8 2 10 0" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />
      </svg>
    );
  }

  // 6. Tariq (Handsome Pompadour Hair + Stubble + Smile)
  if (id === 'tariq') {
    return (
      <svg viewBox="0 0 100 100" className={className} fill="none">
        <circle cx="50" cy="50" r="50" fill="#ebe4dc" />
        <path d="M22 88c0-14 12-22 28-22s28 8 28 22v12H22V88z" fill="#1e3a8a" />
        <path d="M43 66h14v13c0 4-3 6-7 6s-7-2-7-6V66z" fill="#e5ad89" />
        <path d="M29 44c0-18 10-27 21-27s21 9 21 27H29z" fill="#26201c" />
        <path d="M28 35c3-12 11-18 22-18 14 0 22 7 22 17-6-4-14-6-22-6s-16 2-22 7z" fill="#382e27" />
        <ellipse cx="50" cy="52" rx="19" ry="22" fill="#f4c29e" />
        <circle cx="30" cy="52" r="4.5" fill="#e8b18c" />
        <circle cx="70" cy="52" r="4.5" fill="#e8b18c" />
        <path d="M35 54c0 10 7 18 15 18s15-8 15-18c-3 2-8 3-15 3s-12-1-15-3z" fill="#524037" opacity="0.35" />
        <ellipse cx="42" cy="49" rx="2.5" ry="3" fill="#1f2937" />
        <ellipse cx="58" cy="49" rx="2.5" ry="3" fill="#1f2937" />
        <circle cx="43" cy="48" r="0.8" fill="#ffffff" />
        <circle cx="59" cy="48" r="0.8" fill="#ffffff" />
        <path d="M37 43c3-2 7-2 10 0" stroke="#26201c" strokeWidth="2.2" strokeLinecap="round" />
        <path d="M53 43c3-2 7-2 10 0" stroke="#26201c" strokeWidth="2.2" strokeLinecap="round" />
        <path d="M44 62c2 3 10 3 12 0" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" />
      </svg>
    );
  }

  // 7. Ali (Energetic Young Guy with Blue Hoodie)
  if (id === 'ali') {
    return (
      <svg viewBox="0 0 100 100" className={className} fill="none">
        <circle cx="50" cy="50" r="50" fill="#e0e7ff" />
        <path d="M22 88c0-14 12-22 28-22s28 8 28 22v12H22V88z" fill="#2563eb" />
        <path d="M43 66h14v13c0 4-3 6-7 6s-7-2-7-6V66z" fill="#e5ad89" />
        <path d="M28 42c0-16 10-24 22-24s22 8 22 24c-3-5-9-8-22-8s-19 3-22 8z" fill="#1f2937" />
        <ellipse cx="50" cy="51" rx="19" ry="22" fill="#f4c29e" />
        <circle cx="30" cy="51" r="4.5" fill="#e8b18c" />
        <circle cx="70" cy="51" r="4.5" fill="#e8b18c" />
        <ellipse cx="42" cy="48" rx="2.5" ry="3" fill="#1f2937" />
        <ellipse cx="58" cy="48" rx="2.5" ry="3" fill="#1f2937" />
        <circle cx="43" cy="47" r="0.8" fill="#ffffff" />
        <circle cx="59" cy="47" r="0.8" fill="#ffffff" />
        <path d="M37 42c3-2 7-2 10 0" stroke="#1f2937" strokeWidth="2" strokeLinecap="round" />
        <path d="M53 42c3-2 7-2 10 0" stroke="#1f2937" strokeWidth="2" strokeLinecap="round" />
        <path d="M43 60c3 4 11 4 14 0" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" />
      </svg>
    );
  }

  // 8. Sarah (Curly Honey Hair + Bright Smile)
  if (id === 'sarah') {
    return (
      <svg viewBox="0 0 100 100" className={className} fill="none">
        <circle cx="50" cy="50" r="50" fill="#fef3c7" />
        <circle cx="30" cy="40" r="10" fill="#92400e" />
        <circle cx="70" cy="40" r="10" fill="#92400e" />
        <circle cx="28" cy="55" r="9" fill="#92400e" />
        <circle cx="72" cy="55" r="9" fill="#92400e" />
        <path d="M22 88c0-13 12-21 28-21s28 8 28 21v12H22V88z" fill="#ea580c" />
        <path d="M43 65h14v13c0 4-3 6-7 6s-7-2-7-6V65z" fill="#fed7aa" />
        <ellipse cx="50" cy="50" rx="19" ry="21" fill="#ffedd5" />
        <path d="M31 38c4-6 10-8 19-8s15 2 19 8c-3-2-9-3-19-3s-16 1-19 3z" fill="#b45309" />
        <ellipse cx="43" cy="48" rx="2.5" ry="3" fill="#1f2937" />
        <ellipse cx="57" cy="48" rx="2.5" ry="3" fill="#1f2937" />
        <circle cx="44" cy="47" r="0.8" fill="#ffffff" />
        <circle cx="58" cy="47" r="0.8" fill="#ffffff" />
        <circle cx="38" cy="54" r="3" fill="#fda4af" opacity="0.6" />
        <circle cx="62" cy="54" r="3" fill="#fda4af" opacity="0.6" />
        <path d="M44 58c3 4 9 4 12 0" stroke="#be185d" strokeWidth="2.5" strokeLinecap="round" />
      </svg>
    );
  }

  // 9. Omar (Smart Dark Hair + Glasses)
  if (id === 'omar') {
    return (
      <svg viewBox="0 0 100 100" className={className} fill="none">
        <circle cx="50" cy="50" r="50" fill="#e2e8f0" />
        <path d="M22 88c0-14 12-22 28-22s28 8 28 22v12H22V88z" fill="#334155" />
        <path d="M43 66h14v13c0 4-3 6-7 6s-7-2-7-6V66z" fill="#e5ad89" />
        <path d="M29 44c0-16 10-25 21-25s21 9 21 25c-4-5-11-8-21-8s-17 3-21 8z" fill="#18181b" />
        <ellipse cx="50" cy="51" rx="19" ry="22" fill="#f4c29e" />
        <circle cx="30" cy="51" r="4.5" fill="#e8b18c" />
        <circle cx="70" cy="51" r="4.5" fill="#e8b18c" />
        <path d="M44 65c2 4 10 4 12 0-2 4-5 6-6 6s-4-2-6-6z" fill="#18181b" />
        <rect x="35" y="44" width="12" height="9" rx="2" stroke="#475569" strokeWidth="1.8" fill="#ffffff" fillOpacity="0.2" />
        <rect x="53" y="44" width="12" height="9" rx="2" stroke="#475569" strokeWidth="1.8" fill="#ffffff" fillOpacity="0.2" />
        <path d="M47 48h6" stroke="#475569" strokeWidth="1.8" />
        <ellipse cx="41" cy="48" rx="2" ry="2.5" fill="#1f2937" />
        <ellipse cx="59" cy="48" rx="2" ry="2.5" fill="#1f2937" />
        <path d="M45 59c2 2 8 2 10 0" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />
      </svg>
    );
  }

  // 10. Youssef (Presenter with Headset Mic)
  if (id === 'youssef') {
    return (
      <svg viewBox="0 0 100 100" className={className} fill="none">
        <circle cx="50" cy="50" r="50" fill="#e7e5e4" />
        <path d="M22 88c0-14 12-22 28-22s28 8 28 22v12H22V88z" fill="#047857" />
        <path d="M43 66h14v13c0 4-3 6-7 6s-7-2-7-6V66z" fill="#e5ad89" />
        <path d="M29 43c0-16 10-25 21-25s21 9 21 25H29z" fill="#1c1917" />
        <ellipse cx="50" cy="51" rx="19" ry="22" fill="#f4c29e" />
        <circle cx="30" cy="51" r="4.5" fill="#e8b18c" />
        <circle cx="70" cy="51" r="4.5" fill="#e8b18c" />
        <ellipse cx="42" cy="48" rx="2.5" ry="3" fill="#1f2937" />
        <ellipse cx="58" cy="48" rx="2.5" ry="3" fill="#1f2937" />
        <path d="M30 51c0 8 8 13 16 13" stroke="#000000" strokeWidth="2.2" strokeLinecap="round" fill="none" />
        <circle cx="47" cy="64" r="3" fill="#ef4444" />
        <path d="M44 60c3 3 9 3 12 0" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" />
      </svg>
    );
  }

  // 11. Haidar (Mature Storyteller Beard)
  if (id === 'haidar') {
    return (
      <svg viewBox="0 0 100 100" className={className} fill="none">
        <circle cx="50" cy="50" r="50" fill="#ede5dc" />
        <path d="M22 88c0-14 12-22 28-22s28 8 28 22v12H22V88z" fill="#78350f" />
        <path d="M43 66h14v13c0 4-3 6-7 6s-7-2-7-6V66z" fill="#d49774" />
        <path d="M28 44c0-16 10-25 22-25s22 9 22 25c-4-4-10-7-22-7s-18 3-22 7z" fill="#44403c" />
        <ellipse cx="50" cy="51" rx="19" ry="22" fill="#e2ab86" />
        <circle cx="30" cy="51" r="4.5" fill="#d49774" />
        <circle cx="70" cy="51" r="4.5" fill="#d49774" />
        <path d="M33 50c0 16 7 26 17 26s17-10 17-26c-4 4-10 6-17 6s-13-2-17-6z" fill="#44403c" />
        <path d="M38 56c4 3 8 4 12 4s8-1 12-4" stroke="#a8a29e" strokeWidth="1.5" strokeLinecap="round" />
        <ellipse cx="42" cy="48" rx="2.5" ry="3" fill="#1f2937" />
        <ellipse cx="58" cy="48" rx="2.5" ry="3" fill="#1f2937" />
        <path d="M44 64c2 2 10 2 12 0" stroke="#ffffff" strokeWidth="2.2" strokeLinecap="round" />
      </svg>
    );
  }

  // 12. Mariam (Poised Narrator)
  if (id === 'mariam') {
    return (
      <svg viewBox="0 0 100 100" className={className} fill="none">
        <circle cx="50" cy="50" r="50" fill="#ede9fe" />
        <path d="M24 88c0-13 12-20 26-20s26 7 26 20v12H24V88z" fill="#4338ca" />
        <path d="M43 66h14v12c0 4-3 6-7 6s-7-2-7-6V66z" fill="#fed7aa" />
        <path d="M28 44c0-16 10-24 22-24s22 8 22 24v12c0 4-3 8-7 8h-30c-4 0-7-4-7-8V44z" fill="#1c1917" />
        <ellipse cx="50" cy="50" rx="19" ry="21" fill="#ffedd5" />
        <circle cx="30" cy="50" r="4" fill="#fed7aa" />
        <circle cx="70" cy="50" r="4" fill="#fed7aa" />
        <circle cx="30" cy="54" r="2.5" fill="#ffffff" />
        <circle cx="70" cy="54" r="2.5" fill="#ffffff" />
        <ellipse cx="43" cy="49" rx="2.5" ry="3" fill="#1f2937" />
        <ellipse cx="57" cy="49" rx="2.5" ry="3" fill="#1f2937" />
        <circle cx="44" cy="48" r="0.8" fill="#ffffff" />
        <circle cx="58" cy="48" r="0.8" fill="#ffffff" />
        <path d="M45 58c2 3 8 3 10 0" stroke="#be123c" strokeWidth="2.5" strokeLinecap="round" />
      </svg>
    );
  }

  // 13. Shams (Podcast Host with Yellow Headband)
  if (id === 'shams') {
    return (
      <svg viewBox="0 0 100 100" className={className} fill="none">
        <circle cx="50" cy="50" r="50" fill="#fef3c7" />
        <path d="M22 88c0-13 12-21 28-21s28 8 28 21v12H22V88z" fill="#d97706" />
        <path d="M43 65h14v13c0 4-3 6-7 6s-7-2-7-6V65z" fill="#fed7aa" />
        <path d="M28 44c0-16 10-24 22-24s22 8 22 24v12c0 4-4 8-8 8H36c-4 0-8-4-8-8V44z" fill="#262626" />
        <ellipse cx="50" cy="51" rx="19" ry="21" fill="#ffedd5" />
        <path d="M29 36c4-8 11-12 21-12s17 4 21 12" stroke="#facc15" strokeWidth="5.5" strokeLinecap="round" fill="none" />
        <rect x="24" y="42" width="6" height="14" rx="3" fill="#1e293b" />
        <rect x="70" y="42" width="6" height="14" rx="3" fill="#1e293b" />
        <ellipse cx="43" cy="49" rx="2.5" ry="3" fill="#1f2937" />
        <ellipse cx="57" cy="49" rx="2.5" ry="3" fill="#1f2937" />
        <circle cx="44" cy="48" r="0.8" fill="#ffffff" />
        <circle cx="58" cy="48" r="0.8" fill="#ffffff" />
        <path d="M45 57c2 3 8 3 10 0" stroke="#e11d48" strokeWidth="2.5" strokeLinecap="round" />
      </svg>
    );
  }

  // Fallback / Custom Clone Voice
  return (
    <svg viewBox="0 0 100 100" className={className} fill="none">
      <circle cx="50" cy="50" r="50" fill={persona.gender === 'female' ? '#2e1065' : '#1e1b4b'} />
      <circle cx="50" cy="45" r="16" fill={persona.gender === 'female' ? '#a855f7' : '#6366f1'} />
      <path d="M26 84c0-12 11-18 24-18s24 6 24 18" fill={persona.gender === 'female' ? '#c084fc' : '#818cf8'} />
      <circle cx="50" cy="45" r="6" fill="#ffffff" opacity="0.3" />
    </svg>
  );
}

export default function TextToSpeechPage() {
  const [text, setText] = useState("");
  const [selectedVoiceId, setSelectedVoiceId] = useState("zaid");
  const [selectedDialect, setSelectedDialect] = useState<string>("فصحى");
  const [speed, setSpeed] = useState(1.0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [balance, setBalance] = useState<any>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; type: 'single' | 'all'; id?: number | null }>({ isOpen: false, type: 'single', id: null });
  const [isDeletingModal, setIsDeletingModal] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  
  // Navigation View: 'studio' | 'prompt' | 'script' | 'history'
  const [currentView, setCurrentView] = useState<'studio' | 'prompt' | 'script' | 'history'>('studio');
  
  // Custom Prompt View State
  const [customPrompt, setCustomPrompt] = useState(CUSTOM_PROMPT_PRESETS[0].prompt);
  const [isGeneratingPrompt, setIsGeneratingPrompt] = useState(false);
  const [promptAudioUrl, setPromptAudioUrl] = useState<string | null>(null);
  const [isPromptPlaying, setIsPromptPlaying] = useState(false);

  // Script / Drama Studio State
  const [scriptText, setScriptText] = useState(SAMPLE_DRAMA_SCRIPT);
  const [scriptDialect, setScriptDialect] = useState('فصحى');
  const [isGeneratingScript, setIsGeneratingScript] = useState(false);
  const [scriptAudioUrl, setScriptAudioUrl] = useState<string | null>(null);
  const [isScriptPlaying, setIsScriptPlaying] = useState(false);
  const [scriptCharacters, setScriptCharacters] = useState<string[]>([]);

  // Sidebar Tabs: 'platform' | 'my_voices'
  const [activeTab, setActiveTab] = useState<'platform' | 'my_voices'>('platform');

  // Filters for persona list
  const [filterModel, setFilterModel] = useState<string>('all');
  const [filterGender, setFilterGender] = useState<string>('all');
  const [filterTone, setFilterTone] = useState<string>('all');

  // Custom Cloned Voices state
  const [myVoices, setMyVoices] = useState<Persona[]>([]);
  const [showCloneModal, setShowCloneModal] = useState(false);
  const [cloneAudioSample, setCloneAudioSample] = useState<string | null>(null);
  const [cloneSampleName, setCloneSampleName] = useState<string>('');
  const [cloneVoiceName, setCloneVoiceName] = useState<string>('صوتي المستنسخ');
  const [isCloning, setIsCloning] = useState(false);

  // History Player state
  const [playingHistoryId, setPlayingHistoryId] = useState<number | null>(null);
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);

  const audioRef = useRef<HTMLAudioElement>(null);
  const promptAudioRef = useRef<HTMLAudioElement>(null);
  const scriptAudioRef = useRef<HTMLAudioElement>(null);
  const historyAudioRef = useRef<HTMLAudioElement>(null);
  const cloneFileRef = useRef<HTMLInputElement>(null);
  const apiBase = useMemo(() => process.env.NEXT_PUBLIC_API_URL, []);
  const getToken = () => typeof window !== 'undefined' ? localStorage.getItem("a") : null;

  const { operationPrice } = useAiPricing();
  const creditsNeeded = operationPrice('text-to-speech', 3);
  const scriptCreditsNeeded = 5;

  const fetchBalance = async () => {
    if (!apiBase) return;
    try {
      const res = await fetch(`${apiBase}/api/credits/me/balance`, {
        headers: { 'Authorization': getToken() as any, "User-Client": (global as any)?.clientId1328 }
      });
      if (res.ok) setBalance(await res.json());
    } catch (e) {}
  };

  const fetchUserAudios = async () => {
    if (!apiBase) return;
    try {
      const res = await fetch(`${apiBase}/api/ai/user-audios?tool=tts`, {
        headers: { 'Authorization': getToken() as any, "User-Client": (global as any)?.clientId1328 }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.audios) && data.audios.length > 0) {
          const formatted = data.audios.map((a: any) => ({
            id: a.id,
            text: a.text,
            voiceName: a.voiceName || 'زيد',
            voiceBadge: a.voiceBadge || 'Gemini HD',
            dialect: a.dialect || 'فصحى',
            url: a.url,
            date: new Date(a.date).toLocaleDateString('ar-EG', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
          }));
          setHistory(formatted);
          if (typeof window !== 'undefined') {
            localStorage.setItem('nexus_tts_history', JSON.stringify(formatted));
          }
          return;
        }
      }
    } catch (e) {}

    if (typeof window !== 'undefined') {
      const savedHistory = localStorage.getItem('nexus_tts_history');
      if (savedHistory) {
        try {
          const parsed = JSON.parse(savedHistory);
          if (Array.isArray(parsed)) setHistory(parsed);
        } catch (e) {}
      }
    }
  };

  useEffect(() => {
    let cancelled = false;
    const init = async () => {
      try {
        if (!(global as any)?.clientId1328) {
          const fp = await FingerprintJS.load();
          const result = await fp.get();
          (global as any).clientId1328 = result.visitorId;
        }
        if (!cancelled) {
          fetchBalance();
          fetchUserAudios();

          if (typeof window !== 'undefined') {
            const savedVoices = localStorage.getItem('nexus_custom_voices');
            if (savedVoices) {
              try { setMyVoices(JSON.parse(savedVoices)); } catch (e) {}
            }

            const urlParams = new URLSearchParams(window.location.search);
            const initialText = urlParams.get('text') || urlParams.get('prompt');
            if (initialText) setText(initialText);
          }
        }
      } catch (e) {}
    };
    init();
    return () => { cancelled = true; };
  }, []);

  const filteredPersonas = useMemo(() => {
    const list = activeTab === 'my_voices' ? myVoices : PERSONAS;
    return list.filter((p) => {
      if (filterModel !== 'all') {
        if (filterModel === 'gemini' && p.badgeType !== 'gemini' && p.badgeType !== 'pro') return false;
        if (filterModel === 'openai' && p.badgeType !== 'openai') return false;
        if (filterModel === 'custom' && p.badgeType !== 'custom') return false;
      }
      if (filterGender !== 'all' && p.gender !== filterGender) return false;
      if (filterTone !== 'all' && p.toneCategory !== filterTone) return false;
      return true;
    });
  }, [activeTab, myVoices, filterModel, filterGender, filterTone]);

  const currentSelectedPersona = useMemo(() => {
    return [...PERSONAS, ...myVoices].find(p => p.id === selectedVoiceId) || PERSONAS[0];
  }, [selectedVoiceId, myVoices]);

  // 1. Single Voice Generation
  const handleGenerate = async () => {
    if (!text.trim()) {
      toast.error('يرجى إدخال النص المطلوب تحويله');
      return;
    }

    if (!balance || balance.remaining_credits < creditsNeeded) {
      setShowUpgradeModal(true);
      return;
    }

    setIsGenerating(true);
    try {
      const response = await fetch(`${apiBase}/api/ai/text-to-speech`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': getToken() as any,
          "User-Client": (global as any)?.clientId1328
        },
        body: JSON.stringify({
          text: text.trim(),
          voice: selectedVoiceId,
          model: currentSelectedPersona.model || 'gemini-3.1',
          speed: speed,
          language: 'ar',
          dialect: selectedDialect
        })
      });

      const data = await response.json();
      if (data.success && data.audio_url) {
        setAudioUrl(data.audio_url);
        toast.success(`تم إنشاء الصوت بنجاح (${currentSelectedPersona.name})`);
        fetchBalance();

        const newItem: HistoryItem = {
          id: Date.now(),
          text: text.trim(),
          voiceName: currentSelectedPersona.name,
          voiceBadge: currentSelectedPersona.badge,
          dialect: selectedDialect,
          url: data.audio_url,
          date: new Date().toLocaleDateString('ar-EG', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
        };

        const updatedHistory = [newItem, ...history];
        setHistory(updatedHistory);
        if (typeof window !== 'undefined') {
          localStorage.setItem('nexus_tts_history', JSON.stringify(updatedHistory));
        }
      } else {
        toast.error(data.message || 'فشل إنشاء الصوت');
      }
    } catch (error: any) {
      toast.error('خطأ في الاتصال بالخادم');
    } finally {
      setIsGenerating(false);
    }
  };

  // 2. Custom Prompt Generation
  const handleGenerateCustomPrompt = async () => {
    if (!customPrompt.trim()) {
      toast.error('يرجى كتابة البرومبت الصوتي');
      return;
    }

    if (!balance || balance.remaining_credits < creditsNeeded) {
      setShowUpgradeModal(true);
      return;
    }

    setIsGeneratingPrompt(true);
    try {
      const response = await fetch(`${apiBase}/api/ai/custom-prompt-audio`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': getToken() as any,
          "User-Client": (global as any)?.clientId1328
        },
        body: JSON.stringify({
          prompt: customPrompt.trim()
        })
      });

      const data = await response.json();
      if (data.success && data.audio_url) {
        setPromptAudioUrl(data.audio_url);
        toast.success('تم توليد الصوت من البرومبت المخصص');
        fetchBalance();

        const newItem: HistoryItem = {
          id: Date.now(),
          text: customPrompt.trim().substring(0, 180) + '...',
          voiceName: 'برومبت مخصص',
          voiceBadge: 'أمر مباشر',
          dialect: 'مخصص',
          url: data.audio_url,
          date: new Date().toLocaleDateString('ar-EG', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
        };

        const updatedHistory = [newItem, ...history];
        setHistory(updatedHistory);
        if (typeof window !== 'undefined') {
          localStorage.setItem('nexus_tts_history', JSON.stringify(updatedHistory));
        }
      } else {
        toast.error(data.message || 'فشل توليد الصوت  ');
      }
    } catch (error: any) {
      toast.error('خطأ في الاتصال بالخادم');
    } finally {
      setIsGeneratingPrompt(false);
    }
  };

  // 3. Drama Script Generation
  const handleGenerateScript = async () => {
    if (!scriptText.trim()) {
      toast.error('يرجى كتابة نص السيناريو والحوار');
      return;
    }

    if (!balance || balance.remaining_credits < scriptCreditsNeeded) {
      setShowUpgradeModal(true);
      return;
    }

    setIsGeneratingScript(true);
    try {
      const response = await fetch(`${apiBase}/api/ai/dialogue-script`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': getToken() as any,
          "User-Client": (global as any)?.clientId1328
        },
        body: JSON.stringify({
          script_text: scriptText.trim(),
          dialect: scriptDialect
        })
      });

      const data = await response.json();
      if (data.success && data.audio_url) {
        setScriptAudioUrl(data.audio_url);
        setScriptCharacters(data.characters || []);
        toast.success(`تم إنتاج المشهد الدرامي بنجاح (${(data.characters || []).join(' و ')})`);
        fetchBalance();

        const newItem: HistoryItem = {
          id: Date.now(),
          text: scriptText.trim().substring(0, 180) + '...',
          voiceName: `مشهد درامي (${(data.characters || []).join('، ')})`,
          voiceBadge: 'حوار متعدد الأصوات',
          dialect: scriptDialect,
          url: data.audio_url,
          date: new Date().toLocaleDateString('ar-EG', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
        };

        const updatedHistory = [newItem, ...history];
        setHistory(updatedHistory);
        if (typeof window !== 'undefined') {
          localStorage.setItem('nexus_tts_history', JSON.stringify(updatedHistory));
        }
      } else {
        toast.error(data.message || 'فشل إنتاج المشهد الدرامي');
      }
    } catch (error: any) {
      toast.error('خطأ في الاتصال بالخادم');
    } finally {
      setIsGeneratingScript(false);
    }
  };

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const togglePlayPrompt = () => {
    if (!promptAudioRef.current) return;
    if (isPromptPlaying) {
      promptAudioRef.current.pause();
      setIsPromptPlaying(false);
    } else {
      promptAudioRef.current.play();
      setIsPromptPlaying(true);
    }
  };

  const togglePlayScript = () => {
    if (!scriptAudioRef.current) return;
    if (isScriptPlaying) {
      scriptAudioRef.current.pause();
      setIsScriptPlaying(false);
    } else {
      scriptAudioRef.current.play();
      setIsScriptPlaying(true);
    }
  };

  const togglePlayHistory = (item: HistoryItem) => {
    if (!historyAudioRef.current) return;
    if (playingHistoryId === item.id) {
      historyAudioRef.current.pause();
      setPlayingHistoryId(null);
    } else {
      historyAudioRef.current.src = item.url;
      historyAudioRef.current.play();
      setPlayingHistoryId(item.id);
    }
  };

  const handleDownload = async (url: string, name: string = 'nexus_voice') => {
    try {
      const res = await fetch(url);
      const blob = await res.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `${name}_${Date.now()}.mp3`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
      toast.success('تم تحميل ملف MP3');
    } catch (e) {
      window.open(url, '_blank');
    }
  };

  const handleDeleteHistoryItem = async (id: number, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const filtered = history.filter(item => item.id !== id);
    setHistory(filtered);
    if (typeof window !== 'undefined') {
      localStorage.setItem('nexus_tts_history', JSON.stringify(filtered));
    }
    if (playingHistoryId === id && historyAudioRef.current) {
      historyAudioRef.current.pause();
      setPlayingHistoryId(null);
    }
    
    try {
      if (apiBase && id) {
        await fetch(`${apiBase}/api/ai/user-audios/${id}`, {
          method: 'DELETE',
          headers: { 'Authorization': getToken() as any, "User-Client": (global as any)?.clientId1328 }
        });
      }
    } catch (err) {}

    toast.success('تم حذف التسجيل');
  };

  const handleDeleteAllHistory = async () => {
    setHistory([]);
    localStorage.removeItem('nexus_tts_history');
    if (apiBase) {
      await fetch(`${apiBase}/api/ai/user-audios?tool=tts`, {
        method: 'DELETE',
        headers: { 'Authorization': getToken() as any, "User-Client": (global as any)?.clientId1328 }
      }).catch(() => undefined);
    }
    toast.success('تم مسح سجل التسجيلات');
  };

  const handleConfirmDelete = async () => {
    setIsDeletingModal(true);
    try {
      if (deleteModal.type === 'single' && deleteModal.id != null) await handleDeleteHistoryItem(deleteModal.id);
      else if (deleteModal.type === 'all') await handleDeleteAllHistory();
      setDeleteModal({ isOpen: false, type: 'single', id: null });
    } finally {
      setIsDeletingModal(false);
    }
  };



  // Clone handler
  const handleAudioUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('audio/')) {
      toast.error('يرجى اختيار ملف صوتي صالح (MP3, WAV)');
      return;
    }
    setCloneSampleName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      setCloneAudioSample(event.target?.result as string);
      toast.success('تم رفع العينة بنجاح');
    };
    reader.readAsDataURL(file);
  };

  const handleCreateClone = async () => {
    if (!cloneAudioSample) {
      toast.error('يرجى رفع عينة صوتية (10-30 ثانية)');
      return;
    }
    if (!cloneVoiceName.trim()) {
      toast.error('يرجى كتابة اسم للصوت');
      return;
    }

    setIsCloning(true);
    try {
      const newVoice: Persona = {
        id: `clone_${Date.now()}`,
        name: cloneVoiceName.trim(),
        badge: 'استنساخ',
        badgeType: 'custom',
        gender: 'male',
        toneCategory: 'حيوي',
        desc: 'صوت مستنسخ خاص بك',
        model: 'gemini-3.1'
      };

      const updated = [newVoice, ...myVoices];
      setMyVoices(updated);
      localStorage.setItem('nexus_custom_voices', JSON.stringify(updated));
      setSelectedVoiceId(newVoice.id);
      setActiveTab('my_voices');
      setShowCloneModal(false);
      setCloneAudioSample(null);
      setCloneSampleName('');
      toast.success(`تم حفظ "${cloneVoiceName}" في أصواتك`);
    } catch (e) {
      toast.error('حدث خطأ أثناء الحفظ');
    } finally {
      setIsCloning(false);
    }
  };

  return (
    <>
      <Toaster position="top-right" />
      <audio ref={historyAudioRef} onEnded={() => setPlayingHistoryId(null)} className="hidden" />

      {/* Global CSS for Zero Scrollbars */}
      <style jsx global>{`
        /* Hide all scrollbars globally */
        *::-webkit-scrollbar {
          display: none !important;
          width: 0 !important;
          height: 0 !important;
        }
        * {
          -ms-overflow-style: none !important;
          scrollbar-width: none !important;
        }
      `}</style>

      {/* Main Luxury Frame */}
      <div className="h-screen flex flex-col bg-[#06070B] text-[#dcdfe8] selection:bg-emerald-500/30 overflow-hidden font-sans" dir="rtl">
        
        {/* Modern Studio Header */}
        <header className="shrink-0 z-50 bg-[#0B0D14] border-b border-white/[0.08] px-3.5 sm:px-6 py-2.5 flex flex-col md:flex-row gap-2.5 md:gap-0 justify-between items-stretch md:items-center">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 sm:gap-4">
              <Link 
                href="/ai" 
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#121520] hover:bg-[#161a27] border border-white/[0.08] transition-all font-semibold text-xs text-gray-300 hover:text-white"
              >
                <ArrowRight size={13} />
                <span className="hidden sm:inline">الرئيسية</span>
              </Link>
              
              <div className="flex items-center gap-2">
                <span className="text-xs sm:text-sm font-bold tracking-tight text-white">
                  استوديو الإنتاج الصوتي
                </span>
              </div>
            </div>

            {/* Mobile Actions: Credits & Settings Toggle */}
            <div className="flex items-center gap-2 md:hidden">
              <div className="bg-[#121520] border border-white/[0.08] px-2.5 py-1 rounded-lg flex items-center gap-1.5 text-xs">
                <CreditCard size={11} className="text-emerald-400" />
                <span className="font-bold text-white font-mono text-[11px]">{balance?.remaining_credits || 0}</span>
              </div>

              {currentView === 'studio' && (
                <button
                  onClick={() => setShowMobileSidebar(!showMobileSidebar)}
                  className="px-2.5 py-1 rounded-lg bg-emerald-600/20 text-emerald-200 border border-emerald-500/40 text-xs font-semibold flex items-center gap-1.5 active:scale-95 transition-all shadow-sm"
                >
                  <SlidersHorizontal size={12} />
                  <span>الشخصيات</span>
                </button>
              )}
            </div>
          </div>

          {/* Segmented View Switcher with Official BorderBeam */}
          <div className="relative rounded-lg overflow-x-auto no-scrollbar bg-[#121520] border border-white/[0.08] p-1 flex items-center gap-1 shadow-md shrink-0">
            <BorderBeam size={50} duration={6} delay={0} colorFrom="#10b981" colorTo="#059669" borderWidth={1.5} borderRadius={8} className="z-50" />
            
            <button
              onClick={() => setCurrentView('studio')}
              className={`relative z-10 px-3 sm:px-4 py-1.5 text-xs font-semibold rounded-md transition-all whitespace-nowrap ${
                currentView === 'studio'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              أصوات المنصة
            </button>

            <button
              onClick={() => setCurrentView('prompt')}
              className={`relative z-10 px-3 sm:px-4 py-1.5 text-xs font-semibold rounded-md transition-all whitespace-nowrap ${
                currentView === 'prompt'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              توليد بالأوامر
            </button>

            <button
              onClick={() => setCurrentView('script')}
              className={`relative z-10 px-3 sm:px-4 py-1.5 text-xs font-semibold rounded-md transition-all whitespace-nowrap ${
                currentView === 'script'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              توليد سيناريو درامي
            </button>

            <button
              onClick={() => setCurrentView('history')}
              className={`relative z-10 px-3 sm:px-4 py-1.5 text-xs font-semibold rounded-md transition-all whitespace-nowrap ${
                currentView === 'history'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              السجل الصوتي
            </button>
          </div>

          {/* Desktop Right Actions: Credits & Upgrade */}
          <div className="hidden md:flex items-center gap-3 shrink-0">
            <div className="bg-[#121520] border border-white/[0.08] px-3 py-1.5 rounded-lg flex items-center gap-2 text-xs">
              <CreditCard size={12} className="text-emerald-400" />
              <span className="text-gray-400">الرصيد:</span>
              <span className="font-bold text-white font-mono">{balance?.remaining_credits || 0}</span>
            </div>

            <Link
              href="/ai/plans"
              className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-all shadow-sm flex items-center gap-1.5"
            >
              <Crown size={12} />
              <span>ترقية الباقة</span>
            </Link>
          </div>
        </header>

        {/* VIEW 1: Main Studio Container */}
        {currentView === 'studio' && (
          <div className="flex-1 flex overflow-hidden">
            {/* Left Sidebar: Personas & Settings (Slide-over drawer on mobile, static on desktop) */}
            <aside className={`fixed inset-y-0 right-0 z-50 lg:static lg:z-auto w-[85%] sm:w-[360px] lg:w-[360px] h-full lg:h-[calc(100vh-3.5rem)] border-l border-white/[0.08] bg-[#0B0D14] flex flex-col justify-between shrink-0 shadow-2xl transition-transform duration-300 ${
              showMobileSidebar ? 'translate-x-0' : 'translate-x-full lg:translate-x-0 hidden lg:flex'
            }`}>
              
              {/* Drawer Mobile Header */}
              <div className="flex items-center justify-between p-3.5 border-b border-white/[0.08] lg:hidden shrink-0">
                <span className="text-xs font-bold text-white flex items-center gap-2">
                  <SlidersHorizontal size={13} className="text-emerald-400" />
                  <span>تحديد الشخصية وإعدادات الصوت</span>
                </span>
                <button 
                  onClick={() => setShowMobileSidebar(false)}
                  className="p-1.5 rounded-md bg-[#121520] text-gray-400 hover:text-white"
                >
                  <X size={15} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                
                {/* Voice profile matching banner */}
                <div 
                  onClick={() => { window.location.href = '/ai/voice-clone'; }}
                  className="rounded-xl p-3 cursor-pointer transition-all border border-white/[0.08] bg-[#121520] hover:border-emerald-500/50 hover:bg-[#161a27] flex items-center justify-between group shadow-sm"
                >
                  <div className="space-y-0.5">
                    <h3 className="text-xs font-bold text-white group-hover:text-emerald-300 transition-colors">مطابقة نبرة صوتية</h3>
                    <p className="text-[10px] text-gray-400">حلّل العينة واختر أقرب صوت احترافي</p>
                  </div>
                  <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:bg-emerald-600 group-hover:text-white transition-all">
                    <Mic size={13} />
                  </div>
                </div>

                {/* Sub-tabs: منصة / أصواتي */}
                <div className="flex items-center bg-[#121520] p-1 rounded-lg border border-white/[0.08]">
                  <button
                    onClick={() => setActiveTab('platform')}
                    className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all ${
                      activeTab === 'platform' 
                        ? 'bg-emerald-600 text-white shadow-sm' 
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    أصوات المنصة
                  </button>
                  <button
                    onClick={() => setActiveTab('my_voices')}
                    className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all flex items-center justify-center gap-1.5 ${
                      activeTab === 'my_voices' 
                        ? 'bg-emerald-600 text-white shadow-sm' 
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    <span>أصواتي</span>
                    {myVoices.length > 0 && (
                      <span className="px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 text-[9px] font-mono">{myVoices.length}</span>
                    )}
                  </button>
                </div>

                {/* Clear Well-Defined Filter Row */}
                <div className="grid grid-cols-4 gap-1.5">
                  <div className="relative">
                    <select
                      value={filterModel}
                      onChange={(e) => setFilterModel(e.target.value)}
                      className="w-full bg-[#121520] border border-white/[0.08] text-[10px] text-gray-200 font-medium rounded-lg py-1.5 px-2 appearance-none cursor-pointer focus:border-emerald-500 outline-none transition-colors"
                    >
                      <option value="all">النموذج: الكل</option>
                      <option value="gemini">جيميني</option>
                      <option value="openai">OpenAI</option>
                      <option value="custom">مطابقة نبرة</option>
                    </select>
                    <ChevronDown size={10} className="absolute left-1.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  </div>

                  <div className="relative">
                    <select
                      value={selectedDialect}
                      onChange={(e) => setSelectedDialect(e.target.value)}
                      className="w-full bg-[#121520] border border-white/[0.08] text-[10px] text-emerald-300 font-medium rounded-lg py-1.5 px-2 appearance-none cursor-pointer focus:border-emerald-500 outline-none transition-colors"
                    >
                      <option value="فصحى">لهجة: فصحى</option>
                      <option value="عراقية">لهجة: عراقية</option>
                      <option value="مصرية">لهجة: مصرية</option>
                      <option value="خليجية">لهجة: خليجية</option>
                      <option value="شامية">لهجة: شامية</option>
                    </select>
                    <ChevronDown size={10} className="absolute left-1.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  </div>

                  <div className="relative">
                    <select
                      value={filterGender}
                      onChange={(e) => setFilterGender(e.target.value)}
                      className="w-full bg-[#121520] border border-white/[0.08] text-[10px] text-gray-200 font-medium rounded-lg py-1.5 px-2 appearance-none cursor-pointer focus:border-emerald-500 outline-none transition-colors"
                    >
                      <option value="all">النوع: الكل</option>
                      <option value="male">ذكر</option>
                      <option value="female">أنثى</option>
                    </select>
                    <ChevronDown size={10} className="absolute left-1.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  </div>

                  <div className="relative">
                    <select
                      value={filterTone}
                      onChange={(e) => setFilterTone(e.target.value)}
                      className="w-full bg-[#121520] border border-white/[0.08] text-[10px] text-gray-200 font-medium rounded-lg py-1.5 px-2 appearance-none cursor-pointer focus:border-emerald-500 outline-none transition-colors"
                    >
                      <option value="all">النبرة: الكل</option>
                      <option value="حيوي">حيوي</option>
                      <option value="رسمي">رسمي</option>
                      <option value="هادئ">هادئ</option>
                      <option value="إعلاني">إعلاني</option>
                      <option value="قصصي">قصصي</option>
                      <option value="متوازن">بودكاست</option>
                    </select>
                    <ChevronDown size={10} className="absolute left-1.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  </div>
                </div>

                {/* Personas Cards List with Human Person Avatar Icons */}
                <div className="space-y-1.5 pt-0.5">
                  {filteredPersonas.length === 0 ? (
                    <div className="p-6 text-center bg-[#121520] rounded-xl border border-white/[0.08]">
                      <p className="text-xs text-gray-400">لا توجد أصوات مطابقة للفلاتر</p>
                      <button
                        onClick={() => { setFilterModel('all'); setFilterGender('all'); setFilterTone('all'); }}
                        className="text-[10px] text-emerald-400 underline font-bold mt-1.5"
                      >
                        إعادة ضبط الفلاتر
                      </button>
                    </div>
                  ) : (
                    filteredPersonas.map((persona) => {
                      const isSelected = selectedVoiceId === persona.id;

                      return (
                        <div
                          key={persona.id}
                          onClick={() => {
                            setSelectedVoiceId(persona.id);
                            setShowMobileSidebar(false);
                          }}
                          className={`p-2.5 sm:p-3 rounded-xl border transition-all cursor-pointer flex items-center gap-3.5 ${
                            isSelected
                              ? 'bg-emerald-500/15 border-emerald-500/50 shadow-sm'
                              : 'bg-[#121520] border-white/[0.08] hover:border-white/20 hover:bg-[#161a27]'
                          }`}
                        >
                          {/* 3D Apple Memoji Circular Avatar */}
                          <div className={`w-11 h-11 rounded-full overflow-hidden shrink-0 border transition-all flex items-center justify-center shadow-inner ${
                            isSelected 
                              ? 'border-emerald-400 ring-2 ring-emerald-500/40' 
                              : 'border-white/10'
                          }`}>
                            <PersonaMemojiAvatar persona={persona} />
                          </div>

                          {/* Persona Details */}
                          <div className="flex-1 min-w-0 text-right space-y-0.5">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className={`text-sm font-bold tracking-wide ${isSelected ? 'text-emerald-300' : 'text-white'}`}>
                                {persona.name}
                              </span>
                              <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold border flex items-center gap-1 shadow-sm bg-white/5 text-emerald-300 border-emerald-500/30">
                                <span className="text-[9px]">✦</span>
                                <span>{persona.badge}</span>
                              </span>
                            </div>
                            <p className="text-[11px] text-gray-400 font-normal truncate">
                              {persona.gender === 'female' ? 'أنثى' : 'ذكر'}، {selectedDialect}، {persona.toneCategory}
                            </p>
                          </div>

                          {/* Selection Radio / Check Indicator */}
                          <div className={`w-4 h-4 rounded-full flex items-center justify-center transition-all shrink-0 ${
                            isSelected 
                              ? 'bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-400/30' 
                              : 'border border-white/20 bg-transparent opacity-40'
                          }`}>
                            {isSelected && <Check size={9} strokeWidth={3} />}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Speed Control Slider Card */}
                <div className="p-3 rounded-xl bg-[#121520] border border-white/[0.08] space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-semibold text-gray-300 flex items-center gap-1.5">
                      <Sliders size={12} className="text-emerald-400" />
                      <span>سرعة النطق:</span>
                    </label>
                    <span className="text-xs font-mono font-bold text-emerald-300 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">{speed}x</span>
                  </div>
                  <input
                    type="range"
                    min="0.5"
                    max="2.0"
                    step="0.1"
                    value={speed}
                    onChange={(e) => setSpeed(parseFloat(e.target.value))}
                    className="w-full h-1.5 bg-[#252838] rounded appearance-none cursor-pointer accent-emerald-500"
                  />
                  <div className="flex justify-between text-[9px] text-gray-500 font-mono">
                    <span>0.5x بطيء</span>
                    <span>1.0x طبيعي</span>
                    <span>2.0x سريع</span>
                  </div>
                </div>

              </div>

            </aside>

            {/* Right Main Canvas */}
            <main className="flex-1 flex flex-col bg-[#06070B] p-3 sm:p-5 overflow-y-auto space-y-3 sm:space-y-4">
              
              {/* Mobile Active Persona Quick Bar */}
              <div className="flex lg:hidden items-center justify-between p-2.5 rounded-lg bg-[#0B0D14] border border-white/[0.08] shadow-sm">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-full overflow-hidden shrink-0 border border-emerald-500/40 bg-[#e8e4de] flex items-center justify-center">
                    <PersonaMemojiAvatar persona={currentSelectedPersona} />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-white">{currentSelectedPersona.name}</span>
                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/15 text-emerald-300 font-medium">{currentSelectedPersona.badge}</span>
                    </div>
                    <span className="text-[10px] text-gray-400">{selectedDialect} • سرعة {speed}x</span>
                  </div>
                </div>
                <button
                  onClick={() => setShowMobileSidebar(true)}
                  className="px-3 py-1.5 rounded-lg bg-emerald-600/20 text-emerald-200 hover:bg-emerald-600 hover:text-white text-xs font-semibold border border-emerald-500/30 transition-all flex items-center gap-1.5 active:scale-95 shadow-sm"
                >
                  <SlidersHorizontal size={11} />
                  <span>تغيير الصوت</span>
                </button>
              </div>

              {/* Text Input Canvas */}
              <div className="flex-1 flex flex-col space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-semibold text-gray-300 flex items-center gap-2">
                    <MessageSquare size={13} className="text-emerald-400" />
                    <span>النص المراد تحويله</span>
                  </label>
                  <div className="flex items-center gap-3">
                    {text && (
                      <button
                        onClick={() => setText("")}
                        className="text-[11px] text-gray-400 hover:text-rose-400 transition-colors"
                      >
                        مسح النص
                      </button>
                    )}
                    <span className="text-[11px] text-gray-500 font-mono bg-[#121520] px-2 py-0.5 rounded border border-white/[0.08]">
                      {text.length} / 5000 حرف
                    </span>
                  </div>
                </div>

                <div className="relative flex-1 min-h-[260px] rounded-xl bg-[#0B0D14] border border-white/[0.08] focus-within:border-emerald-500/80 transition-all p-4 flex flex-col justify-between shadow-sm">
                  <textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="اكتب أو الصق النص هنا باللغة العربية أو أي لهجة... يدعم التشكيل والتنقيط وعلامات الترقيم لتحقيق أعلى دقة وإحساس طبيعي."
                    maxLength={5000}
                    className="w-full flex-1 bg-transparent text-sm text-gray-100 placeholder:text-gray-600 outline-none resize-none leading-relaxed font-normal"
                  />

                  {/* Suggestions Chips */}
                  <div className="pt-3.5 border-t border-white/[0.08]">
                    <div className="text-[11px] font-semibold text-gray-400 mb-2">نماذج مقترحة سريعة:</div>
                    <div className="flex flex-wrap gap-2">
                      {SUGGESTIONS.map((item, idx) => (
                        <button
                          key={idx}
                          onClick={() => {
                            setText(item.text);
                            toast.success(`تم اختيار "${item.title}"`);
                          }}
                          className="px-3 py-1.5 rounded-lg bg-[#121520] hover:bg-[#161a27] border border-white/[0.08] text-[11px] font-medium text-gray-300 hover:text-white transition-all active:scale-95"
                        >
                          {item.title}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Audio Result Player Card */}
              {audioUrl && (
                <div className="p-3.5 rounded-xl bg-[#0B0D14] border border-white/[0.08] flex flex-col sm:flex-row items-center justify-between gap-4 shadow-lg">
                  <audio
                    ref={audioRef}
                    src={audioUrl}
                    onEnded={() => setIsPlaying(false)}
                    className="hidden"
                  />

                  <div className="flex items-center gap-3 w-full sm:w-auto">
                    <button
                      onClick={togglePlay}
                      className="w-10 h-10 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center transition-all shrink-0 shadow-md"
                    >
                      {isPlaying ? <Pause size={18} /> : <Play size={18} className="ms-0.5" />}
                    </button>

                    <div className="w-10 h-10 rounded-full overflow-hidden shrink-0 border border-emerald-400/40 shadow-sm bg-[#e8e4de] flex items-center justify-center">
                      <PersonaMemojiAvatar persona={currentSelectedPersona} />
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white">الملف الصوتي جاهز</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-medium">
                          {currentSelectedPersona.name} ({currentSelectedPersona.badge})
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-[#121520] text-gray-400 border border-white/[0.08]">
                          {selectedDialect}
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-400 mt-0.5">
                        السرعة: {speed}x • ملف MP3 عالي النقاء
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(audioUrl);
                        toast.success('تم نسخ الرابط');
                      }}
                      className="px-3.5 py-1.5 rounded-lg bg-[#121520] hover:bg-[#161a27] text-gray-300 hover:text-white text-xs font-semibold transition-all border border-white/[0.08]"
                    >
                      نسخ الرابط
                    </button>

                    <button
                      onClick={() => handleDownload(audioUrl, currentSelectedPersona.name)}
                      className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-all flex items-center gap-1.5 shadow-sm"
                    >
                      <Download size={13} />
                      <span>تحميل MP3</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Main Bottom Generate Action */}
              <div>
                <AIGenerateButton
                  onClick={handleGenerate}
                  isGenerating={isGenerating}
                  disabled={!text.trim()}
                  cost={creditsNeeded}
                  label="إنشاء"
                  generatingLabel="جاري الإنشاء..."
                  icon={Volume2}
                  variant="emerald"
                />
              </div>
            </main>
          </div>
        )}

        {/* VIEW 2: Custom Master Prompt Studio (Zero Settings) */}
        {currentView === 'prompt' && (
          <main className="flex-1 bg-[#06070B] p-5 lg:p-7 overflow-y-auto">
            <div className="max-w-4xl mx-auto space-y-4">
              
              {/* Header Banner */}
              <div className="p-4 rounded-xl bg-[#0B0D14] border border-white/[0.08] shadow-sm space-y-1">
                <div className="flex items-center gap-2.5">
                  <Terminal size={16} className="text-emerald-400" />
                  <h2 className="text-sm font-bold text-white">
                    توليد الصوت بالأمر المباشر الشامل (Custom Prompt Mode)
                  </h2>
                </div>
                <p className="text-xs text-gray-400">
                  اكتب برومبت شامل لكل ما تريده (النص، اللهجة، النبرة، المشاعر، ونوع الصوت) وسينفذه النموذج بدقة دون الحاجة لأي إعدادات جانبية.
                </p>
              </div>

              {/* Preset Cards */}
              <div className="space-y-1.5">
                <div className="text-xs font-semibold text-gray-400">
                  نماذج برومبت للاستلهام:
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  {CUSTOM_PROMPT_PRESETS.map((preset, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setCustomPrompt(preset.prompt);
                        toast.success(`تم تحميل: ${preset.title}`);
                      }}
                      className="p-3 rounded-xl bg-[#121520] hover:bg-[#161a27] border border-white/[0.08] hover:border-emerald-500/50 text-right transition-all group"
                    >
                      <span className="text-xs font-semibold text-gray-200 group-hover:text-emerald-300 block">
                        {preset.title}
                      </span>
                      <span className="text-[10px] text-gray-500 line-clamp-2 mt-1 font-normal">
                        {preset.prompt}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Master Prompt Canvas */}
              <div className="rounded-xl bg-[#0B0D14] border border-white/[0.08] p-4 space-y-3.5 shadow-sm focus-within:border-emerald-500/80 transition-all">
                <div className="flex justify-between items-center pb-2.5 border-b border-white/[0.08]">
                  <span className="text-xs font-semibold text-gray-300">
                    نص البرومبت الشامل
                  </span>
                  <div className="flex items-center gap-3">
                    {customPrompt && (
                      <button
                        onClick={() => setCustomPrompt("")}
                        className="text-[11px] text-gray-400 hover:text-rose-400 transition-colors"
                      >
                        مسح
                      </button>
                    )}
                    <span className="text-[10px] text-gray-500 font-mono bg-[#121520] px-2 py-0.5 rounded border border-white/[0.08]">
                      {customPrompt.length} / 5000 حرف
                    </span>
                  </div>
                </div>

                <div className="relative">
                  <textarea
                    value={customPrompt}
                    onChange={(e) => setCustomPrompt(e.target.value)}
                    rows={7}
                    placeholder="اكتب البرومبت الكامل هنا... مثال: تحدث بصوت شاب إذاعي حماسي باللهجة المصرية واقرأ هذا النص: ..."
                    className="w-full bg-transparent text-sm text-gray-100 placeholder:text-gray-600 outline-none leading-relaxed font-normal resize-y"
                  />
                </div>

                <AIGenerateButton
                  onClick={handleGenerateCustomPrompt}
                  isGenerating={isGeneratingPrompt}
                  disabled={!customPrompt.trim()}
                  cost={creditsNeeded}
                  label="إنشاء الصوت بالبرومبت"
                  generatingLabel="جاري توليد الصوت..."
                  icon={Sparkles}
                  variant="emerald"
                />
              </div>

              {/* Result Player */}
              {promptAudioUrl && (
                <div className="p-3.5 rounded-xl bg-[#0B0D14] border border-emerald-500/50 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-lg">
                  <audio
                    ref={promptAudioRef}
                    src={promptAudioUrl}
                    onEnded={() => setIsPromptPlaying(false)}
                    className="hidden"
                  />

                  <div className="flex items-center gap-3.5 w-full sm:w-auto">
                    <button
                      onClick={togglePlayPrompt}
                      className="w-10 h-10 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center transition-all shrink-0 shadow-md"
                    >
                      {isPromptPlaying ? <Pause size={18} /> : <Play size={18} className="ms-0.5" />}
                    </button>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white">الصوت المخصص جاهز</span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-medium">
                          برومبت مخصص
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-400 mt-0.5">
                        تم التوليد بناءً على تعليمات البرومبت المباشر
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(promptAudioUrl);
                        toast.success('تم نسخ الرابط');
                      }}
                      className="px-3.5 py-1.5 rounded-lg bg-[#121520] hover:bg-[#161a27] text-gray-300 hover:text-white text-xs font-semibold transition-all border border-white/[0.08]"
                    >
                      نسخ الرابط
                    </button>

                    <button
                      onClick={() => handleDownload(promptAudioUrl, 'custom_prompt')}
                      className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-all flex items-center gap-1.5 shadow-sm"
                    >
                      <Download size={13} />
                      <span>تحميل MP3</span>
                    </button>
                  </div>
                </div>
              )}

            </div>
          </main>
        )}

        {/* VIEW 3: Script & Multi-Speaker Drama Studio */}
        {currentView === 'script' && (
          <main className="flex-1 bg-[#06070B] p-5 lg:p-7 overflow-y-auto">
            <div className="max-w-4xl mx-auto space-y-4">
              
              {/* Header Banner */}
              <div className="p-4 rounded-xl bg-[#0B0D14] border border-white/[0.08] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 shadow-sm">
                <div>
                  <div className="flex items-center gap-2">
                    <Drama size={16} className="text-emerald-400" />
                    <h2 className="text-sm font-bold text-white">
                      إنتاج السيناريوهات والحوارات الدرامية
                    </h2>
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">
                    اكتب الحوار والمشاعر بين الأقواس، وسيقوم النظام بتوزيع الشخصيات وتمثيل كل نبرة ودمجها في ملف MP3 واحد.
                  </p>
                </div>

                <button
                  onClick={() => {
                    setScriptText(SAMPLE_DRAMA_SCRIPT);
                    toast.success('تم تحميل نموذج حوار درامي');
                  }}
                  className="px-3 py-1.5 rounded-lg bg-[#121520] hover:bg-[#161a27] border border-white/[0.08] text-xs font-semibold text-emerald-300 hover:text-white transition-all flex items-center gap-1.5 shrink-0"
                >
                  <FileText size={12} />
                  <span>تحميل نموذج جاهز</span>
                </button>
              </div>

              {/* Script Canvas */}
              <div className="rounded-xl bg-[#0B0D14] border border-white/[0.08] p-4 space-y-3.5 shadow-sm focus-within:border-emerald-500/80 transition-all">
                
                <div className="flex justify-between items-center pb-2.5 border-b border-white/[0.08]">
                  <div className="flex items-center gap-2">
                    <label className="text-xs font-semibold text-gray-300 flex items-center gap-1.5">
                      <Globe2 size={12} className="text-emerald-400" />
                      <span>اللهجة المطلوبة:</span>
                    </label>
                    <select
                      value={scriptDialect}
                      onChange={(e) => setScriptDialect(e.target.value)}
                      className="bg-[#121520] border border-white/[0.08] text-xs text-emerald-300 font-medium rounded-lg py-1 px-2.5 outline-none cursor-pointer focus:border-emerald-500"
                    >
                      <option value="فصحى">العربية الفصحى</option>
                      <option value="عراقية">اللهجة العراقية</option>
                      <option value="مصرية">اللهجة المصرية</option>
                      <option value="خليجية">اللهجة الخليجية</option>
                      <option value="شامية">اللهجة الشامية</option>
                    </select>
                  </div>

                  <span className="text-[10px] text-gray-500 font-mono">
                    {scriptText.length} حرف
                  </span>
                </div>

                <div className="relative">
                  <textarea
                    value={scriptText}
                    onChange={(e) => setScriptText(e.target.value)}
                    rows={11}
                    placeholder="اكتب أو الصق نص السيناريو والبرومبت هنا..."
                    className="w-full bg-transparent text-sm text-gray-100 placeholder:text-gray-600 outline-none leading-relaxed font-mono resize-y"
                  />
                </div>

                <button
                  onClick={handleGenerateScript}
                  disabled={!scriptText.trim() || isGeneratingScript}
                  className="w-full py-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 active:scale-[0.99] text-white font-bold text-sm transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isGeneratingScript ? (
                    <>
                      <RefreshCw size={15} className="animate-spin text-white" />
                      <span>جاري إنتاج المشهد...</span>
                    </>
                  ) : (
                    <>
                      <Clapperboard size={15} className="text-emerald-200" />
                      <span>إنتاج المشهد ({scriptCreditsNeeded} كريديت)</span>
                    </>
                  )}
                </button>

              </div>

              {/* Script Result Player */}
              {scriptAudioUrl && (
                <div className="p-3.5 rounded-xl bg-[#0B0D14] border border-emerald-500/50 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-lg">
                  <audio
                    ref={scriptAudioRef}
                    src={scriptAudioUrl}
                    onEnded={() => setIsScriptPlaying(false)}
                    className="hidden"
                  />

                  <div className="flex items-center gap-3.5 w-full sm:w-auto">
                    <button
                      onClick={togglePlayScript}
                      className="w-10 h-10 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center transition-all shrink-0 shadow-md"
                    >
                      {isScriptPlaying ? <Pause size={18} /> : <Play size={18} className="ms-0.5" />}
                    </button>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white">المشهد الدرامي جاهز</span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-medium">
                          {scriptCharacters.join(' • ') || 'حوار متعدد الأصوات'}
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-400 mt-0.5">
                        تم دمج المشهد في ملف MP3 عالي النقاء
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(scriptAudioUrl);
                        toast.success('تم نسخ الرابط');
                      }}
                      className="px-3.5 py-1.5 rounded-lg bg-[#121520] hover:bg-[#161a27] text-gray-300 hover:text-white text-xs font-semibold transition-all border border-white/[0.08]"
                    >
                      نسخ الرابط
                    </button>

                    <button
                      onClick={() => handleDownload(scriptAudioUrl, 'drama_scene')}
                      className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-all flex items-center gap-1.5 shadow-sm"
                    >
                      <Download size={13} />
                      <span>تحميل MP3</span>
                    </button>
                  </div>
                </div>
              )}

            </div>
          </main>
        )}

        {/* VIEW 4: Results & History Tab */}
        {currentView === 'history' && (
          <main className="flex-1 bg-[#06070B] p-5 lg:p-7 overflow-y-auto">
            <div className="max-w-4xl mx-auto space-y-4">
              
              <div className="flex justify-between items-center pb-3 border-b border-white/[0.08]">
                <div>
                  <h2 className="text-sm font-bold text-white flex items-center gap-2">
                    <History size={15} className="text-emerald-400" />
                    <span>السجل والتسجيلات السابقة</span>
                  </h2>
                  <p className="text-xs text-gray-400 mt-0.5">
                    استعرض واستمع وحمّل كافة التسجيلات السابقة بصيغة MP3
                  </p>
                </div>

                <div className="flex items-center gap-2.5">
                  <button
                    onClick={() => setCurrentView('studio')}
                    className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-all shadow-sm"
                  >
                    إنشاء جديد
                  </button>

                  {history.length > 0 && (
                    <button
                      onClick={() => setDeleteModal({ isOpen: true, type: 'all', id: null })}
                      className="px-3.5 py-1.5 rounded-lg bg-[#121520] hover:bg-rose-950/40 text-rose-400 border border-white/[0.08] text-xs font-semibold transition-all"
                    >
                      مسح السجل
                    </button>
                  )}
                </div>
              </div>

              {history.length === 0 ? (
                <div className="py-16 text-center bg-[#0B0D14] rounded-xl border border-white/[0.08] space-y-2">
                  <p className="text-xs text-gray-400">لا توجد تسجيلات محفوظة حالياً</p>
                  <button
                    onClick={() => setCurrentView('studio')}
                    className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-all mt-1 shadow-sm"
                  >
                    إنشاء أول تسجيل
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  {history.map((item) => {
                    const isItemPlaying = playingHistoryId === item.id;

                    return (
                      <div
                        key={item.id}
                        className={`p-3.5 rounded-xl border transition-all ${
                          isItemPlaying 
                            ? 'bg-emerald-950/20 border-emerald-500/70 shadow-sm' 
                            : 'bg-[#0B0D14] border-white/[0.08] hover:border-white/20'
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                          
                          <div className="flex items-start gap-3 w-full sm:w-auto">
                            <button
                              onClick={() => togglePlayHistory(item)}
                              className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all shrink-0 ${
                                isItemPlaying
                                  ? 'bg-emerald-600 text-white shadow-sm'
                                  : 'bg-[#121520] text-emerald-300 hover:bg-emerald-600 hover:text-white border border-white/[0.08]'
                              }`}
                            >
                              {isItemPlaying ? <Pause size={15} /> : <Play size={15} className="ms-0.5" />}
                            </button>

                            <div className="space-y-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-xs font-bold text-white">{item.voiceName}</span>
                                <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 font-medium">
                                  {item.voiceBadge}
                                </span>
                                {item.dialect && (
                                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-[#121520] text-gray-400 border border-white/[0.08]">
                                    {item.dialect}
                                  </span>
                                )}
                                <span className="text-[10px] text-gray-500 font-mono">
                                  {item.date}
                                </span>
                              </div>

                              <p className="text-xs text-gray-300 max-w-xl font-normal line-clamp-1">
                                {item.text}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 w-full sm:w-auto justify-end shrink-0">
                            <button
                              onClick={() => {
                                setText(item.text);
                                setCurrentView('studio');
                                toast.success('تم تحميل النص في الاستوديو');
                              }}
                              className="p-1.5 px-2.5 rounded-lg bg-[#121520] hover:bg-[#161a27] text-gray-300 hover:text-white text-xs font-medium transition-all border border-white/[0.08] flex items-center gap-1.5"
                              title="إعادة استخدام النص"
                            >
                              <RotateCcw size={12} />
                              <span className="hidden sm:inline">إعادة استخدام</span>
                            </button>

                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(item.text);
                                toast.success('تم نسخ النص');
                              }}
                              className="p-1.5 rounded-lg bg-[#121520] hover:bg-[#161a27] text-gray-300 hover:text-white text-xs font-medium transition-all border border-white/[0.08]"
                              title="نسخ النص"
                            >
                              <Copy size={13} />
                            </button>

                            <button
                              onClick={() => handleDownload(item.url, item.voiceName)}
                              className="p-1.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-all flex items-center gap-1.5 shadow-sm"
                              title="تحميل الملف"
                            >
                              <Download size={12} />
                              <span>تحميل MP3</span>
                            </button>

                            <button
                              onClick={(e) => handleDeleteHistoryItem(item.id, e)}
                              className="p-1.5 rounded-lg bg-rose-950/20 hover:bg-rose-600 text-rose-400 hover:text-white transition-all border border-rose-500/20"
                              title="حذف"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>

                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

            </div>
          </main>
        )}

        {/* Quick Voice Clone Modal */}
        {showCloneModal && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-[#0B0D14] border border-white/[0.08] rounded-xl p-5 w-full max-w-sm space-y-3.5 shadow-2xl">
              
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                    <Mic size={14} />
                  </div>
                  <h3 className="text-sm font-bold text-white">مطابقة نبرة صوتية</h3>
                </div>
                <button 
                  onClick={() => setShowCloneModal(false)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <X size={15} />
                </button>
              </div>

              <p className="text-xs text-gray-400">
                ارفع عينة صوتية واضحة ومسجلة مسبقاً (10 إلى 30 ثانية).
              </p>

              <div 
                onClick={() => cloneFileRef.current?.click()}
                className={`border border-dashed rounded-xl p-4 text-center cursor-pointer transition-all ${
                  cloneAudioSample 
                    ? 'border-emerald-500 bg-emerald-500/10' 
                    : 'border-white/[0.08] hover:border-emerald-500/60 bg-[#121520]'
                }`}
              >
                {cloneAudioSample ? (
                  <div className="flex flex-col items-center gap-1.5">
                    <CheckCircle2 size={18} className="text-emerald-400" />
                    <span className="text-xs font-bold text-white truncate max-w-[220px]">{cloneSampleName || 'تم رفع الملف بنجاح'}</span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-1.5 py-1">
                    <Upload size={18} className="text-gray-400" />
                    <span className="text-xs text-gray-300 font-semibold">اختر ملف صوتي (MP3, WAV)</span>
                  </div>
                )}
              </div>
              <input ref={cloneFileRef} type="file" accept="audio/*" onChange={handleAudioUpload} className="hidden" />

              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-300">اسم الصوت</label>
                <input
                  type="text"
                  value={cloneVoiceName}
                  onChange={(e) => setCloneVoiceName(e.target.value)}
                  placeholder="مثال: صوتي الرسمي"
                  className="w-full bg-[#121520] border border-white/[0.08] rounded-lg px-3 py-1.5 text-xs text-white placeholder:text-gray-600 focus:border-emerald-500 outline-none"
                />
              </div>

              <div className="flex gap-2 pt-1.5">
                <button
                  onClick={handleCreateClone}
                  disabled={!cloneAudioSample || isCloning}
                  className="flex-1 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-all disabled:opacity-50 shadow-sm"
                >
                  {isCloning ? 'جاري الحفظ...' : 'حفظ واستخدام الصوت'}
                </button>
                <button
                  onClick={() => setShowCloneModal(false)}
                  className="px-3.5 py-2 rounded-lg bg-[#121520] hover:bg-[#161a27] text-gray-300 text-xs font-semibold transition-all border border-white/[0.08]"
                >
                  إلغاء
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Upgrade Modal */}
        <UpgradeModal
          isOpen={showUpgradeModal}
          onClose={() => setShowUpgradeModal(false)}
          currentPlan={balance?.plan_name || 'مجاني'}
          requiredCredits={creditsNeeded}
          currentCredits={balance?.remaining_credits || 0}
        />
      </div>
      <AIDeleteModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal(prev => ({ ...prev, isOpen: false }))}
        onConfirm={handleConfirmDelete}
        type={deleteModal.type}
        itemType="تسجيل صوتي"
        isDeleting={isDeletingModal}
      />
    </>
  );
}
