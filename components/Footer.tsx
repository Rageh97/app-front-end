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
   
    <footer className=" relative w-full bg-[#190237] shadow-2xl pt-10  rounded-t-[70px]   border-2 border-t-orange mt-10">

    <div className="w-full flex flex-col items-center justify-between gap-5">
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
<Link href={"/Policy"}>            <p className="text-xs md:text-lg bg-[linear-gradient(135deg,#00c48c,_#4f008c,_#190237)] px-1 sm:px-3 lg:px-7 py-1 rounded-md text-center">{t('footer.returnPolicy')}</p>
</Link>
          </div>
          <img className="w-50 md:w-100" src="/images/logoN.png" alt="Site Logo"/>
          {/* {displayLogoUrl?<img className="w-50 md:w-100" src={displayLogoUrl} alt="Site Logo"/>:<img className="w-50 md:w-100" src="/images/logoN.png" alt="Site Logo"/>} */}
          <div className="flex flex-col gap-6 text-white">
          <div className="flex items-center bg-[linear-gradient(135deg,#00c48c,_#4f008c,_#190237)] px-8 py-1 rounded-md text-center">
          <a className="flex items-center" href="https://wa.me/9647702930873" target="_blank">
            <p className="text-xs md:text-lg">{t('footer.contactUs')}</p>
            <img className="w-5 sm:w-8" src="https://static.vecteezy.com/system/resources/previews/024/398/617/non_2x/whatsapp-logo-icon-isolated-on-transparent-background-free-png.png"/>
           </a>
          </div>
           <Link href="/plans">
            <p className="text-xs md:text-lg bg-[linear-gradient(135deg,#00c48c,_#4f008c,_#190237)]  px-1 sm:px-3 lg:px-7 py-1 rounded-md text-center">{t('footer.ourPackages')}</p>
         </Link>
          </div>
        </div>
        {/* footer */}
        <div className="w-full flex flex-col items-center justify-center text-white gap-2 ">
            <div className="w-full flex items-center justify-center gap-1">
              <img className="w-[50%] md:w-[30%]" src="/images/payments.png" />
            </div>
            <div className="text-xs  md:mb-0 sm:text-lg w-[80%] md:w-[50%] text-center bg-[linear-gradient(135deg,#00c48c,_#4f008c,_#190237)] rounded-t-3xl py-2 px-5 font-bold mt-3">
          <span className="text-[#00c48c]">2025 © </span> {t('footer.allRightsReserved')}<span className="text-orange font-bold mb-0"> {t('footer.nexus')}</span> 
            </div>
        </div>
    </div>

  </footer> 
  )
}

export default Footer
