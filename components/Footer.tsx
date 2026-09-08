import { Facebook, Instagram, Youtube } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

interface SocialLinkData {
  id: number;
  name: string;
  url: string;
  icon_value: string | null; // Path to the icon image
  display_order: number;
  is_active: boolean;
}

const Footer = () => {
  const { t } = useTranslation();
  const [dynamicLogoUrl, setDynamicLogoUrl] = useState<string | null>(null);
  const [socialLinks, setSocialLinks] = useState<SocialLinkData[]>([]); // State for social links
  const staticLogoPath = "/images/nexus-logo-22.png"; // Define static path
  const API_URL = process.env.NEXT_PUBLIC_API_URL;
  const fallbackLinks = [
    {
      id: "whatsapp",
      name: "WhatsApp",
      url: "https://wa.me/9647702930873",
      content: (
        <img
          src="https://static.vecteezy.com/system/resources/previews/024/398/617/non_2x/whatsapp-logo-icon-isolated-on-transparent-background-free-png.png"
          alt="WhatsApp"
          className="w-8 h-8 object-contain"
        />
      ),
    },
    {
      id: "instagram",
      name: "Instagram",
      url: "https://www.instagram.com/codeekey/",
      content: (
        <Instagram className="w-7 h-7 text-[#ff4d67]" aria-label="Instagram" />
      ),
    },
    {
      id: "youtube",
      name: "YouTube",
      url: "https://www.youtube.com/@codeekey",
      content: (
        <Youtube className="w-7 h-7 text-[#ff0000]" aria-label="YouTube" />
      ),
    },
    {
      id: "facebook",
      name: "Facebook",
      url: "https://www.facebook.com/codeekey",
      content: (
        <Facebook className="w-7 h-7 text-[#1877f2]" aria-label="Facebook" />
      ),
    },
  ];

  useEffect(() => {
    const fetchData = async () => {
      // Fetch Logo
      try {
        const logoResponse = await fetch(`${API_URL}/api/admin/settings/site_logo`);
        if (logoResponse.ok) {
          const logoResult = await logoResponse.json();
          if (logoResult.value) {
            setDynamicLogoUrl(`${API_URL}${logoResult.value}`);
          }
        }
      } catch (error) {
        console.error("Failed to fetch site logo for footer:", error);
      }

      // Fetch Social Links
      try {
        // Adjust this path if your social link routes are registered differently in the backend
        const socialLinksResponse = await fetch(`${API_URL}/api/social-links/social-links`); 
        if (socialLinksResponse.ok) {
          const linksResult = await socialLinksResponse.json();
          setSocialLinks(linksResult);
        }
      } catch (error) {
        console.error("Failed to fetch social links for footer:", error);
      }
    };

    fetchData();
  }, [API_URL]);

  const displayLogoUrl = dynamicLogoUrl || staticLogoPath;

  return (
    <footer className="relative w-full bg-[#190237] dark:bg-[#07080E] shadow-2xl pt-10 dark:pt-14 rounded-t-[70px] dark:rounded-none border-2 border-t-orange dark:border-0 dark:border-t dark:border-zinc-800 mt-10">

      {/* ==================== DARK MODE FOOTER LAYOUT ==================== */}
      <div className="hidden dark:block max-w-[1400px] mx-auto px-6 md:px-10 pb-8">
        {/* Top Ambient Glow */}
        <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-[#00c48c]/50 to-transparent pointer-events-none" />
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[600px] h-[200px] bg-[#00c48c]/5 rounded-full blur-[100px] pointer-events-none" />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 pb-12 border-b border-zinc-800/80">
          {/* Column 1: Brand & Identity */}
          <div className="flex flex-col items-center sm:items-start text-center sm:text-right gap-4">
            <Link href="/dashboard" className="inline-block">
              <img className="h-10 w-auto" src="/images/logoN.png" alt="Nexus Toolz" />
            </Link>
            <p className="text-zinc-400 text-xs leading-relaxed max-w-sm">
              Nexus Toolz - منصتك المتكاملة الرائدة لتوفير أقوى أدوات الذكاء الاصطناعي والتصميم والإنتاجية الرقمية بأعلى استقرار وسرعة.
            </p>
            
            {/* Live Support Indicator */}
            <a 
              href="https://wa.me/9647702930873" 
              target="_blank" 
              rel="noopener noreferrer"
              className="mt-1 inline-flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/15 border border-emerald-500/30 text-[#00c48c] text-xs font-bold transition-all group shadow-sm"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#00c48c]"></span>
              </span>
              <span>الدعم الفني المباشر (24/7)</span>
            </a>
          </div>

          {/* Column 2: Platform Links */}
          <div className="flex flex-col items-center sm:items-start text-center sm:text-right gap-3">
            <h4 className="text-white font-bold text-sm tracking-wider flex items-center gap-2 mb-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00c48c]" />
              الخدمات والباقات
            </h4>
            <ul className="space-y-2.5 text-xs text-zinc-400">
              <li>
                <Link href="/plans" className="hover:text-[#00c48c] hover:translate-x-1 inline-block transition-all">
                  {t('footer.ourPackages')}
                </Link>
              </li>
              <li>
                <Link href="/videos" className="hover:text-[#00c48c] hover:translate-x-1 inline-block transition-all">
                  {t('dashboard.tutorials')}
                </Link>
              </li>
              <li>
                <Link href="/subscriptions" className="hover:text-[#00c48c] hover:translate-x-1 inline-block transition-all">
                  {t('dashboard.Subscriptions')}
                </Link>
              </li>
              <li>
                <Link href="/orders" className="hover:text-[#00c48c] hover:translate-x-1 inline-block transition-all">
                  {t('dashboard.orders')}
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Security & Policies */}
          <div className="flex flex-col items-center sm:items-start text-center sm:text-right gap-3">
            <h4 className="text-white font-bold text-sm tracking-wider flex items-center gap-2 mb-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00c48c]" />
              الأمان والسياسات
            </h4>
            <ul className="space-y-2.5 text-xs text-zinc-400">
              <li>
                <Link href="/Policy" className="hover:text-[#00c48c] hover:translate-x-1 inline-block transition-all">
                  {t('footer.returnPolicy')}
                </Link>
              </li>
              <li>
                <Link href="/devices" className="hover:text-[#00c48c] hover:translate-x-1 inline-block transition-all">
                  إدارة الأجهزة المسجلة
                </Link>
              </li>
              
            </ul>
          </div>

          {/* Column 4: Socials & Payments */}
          <div className="flex flex-col items-center sm:items-start text-center sm:text-right gap-4">
            <h4 className="text-white font-bold text-sm tracking-wider flex items-center gap-2 mb-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00c48c]" />
              تواصل معنا
            </h4>
            
            {/* Social Icons Bar */}
            <div className="flex items-center gap-2.5 flex-wrap justify-center sm:justify-start">
              {socialLinks.length > 0
                ? socialLinks.map((link) => (
                    <Link
                      href={link.url}
                      key={link.id}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2.5 bg-[#12141F] border border-zinc-800 hover:border-[#00c48c]/50 rounded-xl text-zinc-300 hover:text-[#00c48c] hover:bg-[#181B29] transition-all shadow-sm hover:scale-105"
                    >
                      {link.icon_value ? (
                        <img
                          src={`${API_URL}${link.icon_value}`}
                          alt={link.name}
                          className="w-4 h-4 object-contain"
                        />
                      ) : (
                        <span className="text-xs font-bold">{link.name.substring(0, 1)}</span>
                      )}
                    </Link>
                  ))
                : fallbackLinks.map((link) => (
                    <Link
                      href={link.url}
                      key={link.id}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={link.name}
                      className="p-2.5 bg-[#12141F] border border-zinc-800 hover:border-[#00c48c]/50 rounded-xl text-zinc-300 hover:text-[#00c48c] hover:bg-[#181B29] transition-all shadow-sm hover:scale-105"
                    >
                      {link.content}
                    </Link>
                  ))}
            </div>

            {/* Payment Gateway Box */}
            <div className="w-full mt-1 p-2.5 rounded-xl bg-[#12141F] border border-zinc-800/80 flex items-center justify-center">
              <img className="h-6 w-auto opacity-80" src="/images/payments.png" alt="Payment Methods" />
            </div>
          </div>
        </div>

        {/* Bottom Copyright & Back to top */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-400">
          <div className="text-center sm:text-right">
            <span className="text-[#00c48c] font-semibold">2025 © </span> 
            {t('footer.allRightsReserved')} 
            <span className="text-white font-bold ms-1">{t('footer.nexus')}</span>
          </div>

          <button
            onClick={() => {
              if (typeof window !== 'undefined') {
                const mainArea = document.querySelector('main');
                if (mainArea) {
                  mainArea.scrollTo({ top: 0, behavior: 'smooth' });
                } else {
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }
              }
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#12141F] hover:bg-[#181B29] border border-zinc-800 text-zinc-400 hover:text-white transition-all text-[11px] font-medium"
          >
            <span>العودة للأعلى</span>
            <span>↑</span>
          </button>
        </div>
      </div>

      {/* ==================== LIGHT MODE ORIGINAL FOOTER LAYOUT ==================== */}
      <div className="dark:hidden w-full flex flex-col items-center justify-between gap-5">
        {/* social icon */}
        <div className="flex items-center flex-wrap justify-center gap-1 md:gap-2">
          {socialLinks.length > 0
            ? socialLinks.map((link) => (
                <Link
                  href={link.url}
                  key={link.id}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {link.icon_value ? (
                    <img
                      src={`${API_URL}${link.icon_value}`}
                      alt={link.name}
                      className="w-11 h-11 sm:w-15 sm:h-15 object-contain mx-1"
                    />
                  ) : (
                    <span className="mx-1 flex items-center justify-center text-white text-sm sm:text-base">
                      {link.name.substring(0, 1)}
                    </span>
                  )}
                </Link>
              ))
            : fallbackLinks.map((link) => (
                <Link
                  href={link.url}
                  key={link.id}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={link.name}
                >
                  <div className="mx-2 flex items-center justify-center transition-transform hover:scale-105">
                    <span className="sr-only">{link.name}</span>
                    {link.content}
                  </div>
                </Link>
              ))}
        </div>
        {/* links and logo */}
        <div className="w-full flex flex-col gap-3 md:flex-row items-center justify-between sm:justify-around px-5 cursor-pointer">
          <div className="flex flex-col gap-6 text-white">
            <p className="text-xs md:text-lg bg-[linear-gradient(135deg,#00c48c,_#4f008c,_#190237)] px-1 sm:px-3 lg:px-7 py-1 rounded-md text-center">{t('footer.rateUs')}</p>
            <Link href={"/Policy"}>
              <p className="text-xs md:text-lg bg-[linear-gradient(135deg,#00c48c,_#4f008c,_#190237)] px-1 sm:px-3 lg:px-7 py-1 rounded-md text-center">{t('footer.returnPolicy')}</p>
            </Link>
          </div>
          <img className="w-50 md:w-100" src="/images/logoN.png" alt="Site Logo"/>
          <div className="flex flex-col gap-6 text-white">
            <div className="flex items-center bg-[linear-gradient(135deg,#00c48c,_#4f008c,_#190237)] px-8 py-1 rounded-md text-center">
              <a className="flex items-center" href="https://wa.me/9647702930873" target="_blank">
                <p className="text-xs md:text-lg">{t('footer.contactUs')}</p>
                <img className="w-5 sm:w-8" src="https://static.vecteezy.com/system/resources/previews/024/398/617/non_2x/whatsapp-logo-icon-isolated-on-transparent-background-free-png.png"/>
              </a>
            </div>
            <Link href="/plans">
              <p className="text-xs md:text-lg bg-[linear-gradient(135deg,#00c48c,_#4f008c,_#190237)] px-1 sm:px-3 lg:px-7 py-1 rounded-md text-center">{t('footer.ourPackages')}</p>
            </Link>
          </div>
        </div>
        {/* footer bottom */}
        <div className="w-full flex flex-col items-center justify-center text-white gap-2 ">
          <div className="w-full flex items-center justify-center gap-1">
            <img className="w-[50%] md:w-[30%]" src="/images/payments.png" />
          </div>
          <div className="text-xs md:mb-0 sm:text-lg w-[80%] md:w-[50%] text-center bg-[linear-gradient(135deg,#00c48c,_#4f008c,_#190237)] rounded-t-3xl py-2 px-5 font-bold mt-3">
            <span className="text-[#00c48c]">2025 © </span> {t('footer.allRightsReserved')}<span className="text-orange font-bold mb-0"> {t('footer.nexus')}</span> 
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer
