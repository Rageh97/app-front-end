"use client";
import { FunctionComponent, useState, useEffect } from "react";
import { useMyInfo } from "@/utils/user-info/getUserInfo";
import api from "@/utils/api";
import { Play, Shield, Globe, HardDrive, ShieldAlert, Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";

const TestProxyPage: FunctionComponent = () => {
  const { data, isLoading: infoLoading, error: infoError } = useMyInfo();
  const [selectedToolId, setSelectedToolId] = useState<string>("");
  const [selectedTool, setSelectedTool] = useState<any>(null);
  const [testing, setTesting] = useState<boolean>(false);
  const [testResult, setTestResult] = useState<any>(null);

  // Update selected tool details when selection changes
  useEffect(() => {
    if (selectedToolId && data?.toolsData) {
      const tool = data.toolsData.find((t: any) => t.tool_id.toString() === selectedToolId);
      setSelectedTool(tool || null);
      setTestResult(null);
    } else {
      setSelectedTool(null);
      setTestResult(null);
    }
  }, [selectedToolId, data]);

  const handleTestProxy = async () => {
    if (!selectedTool) return;
    setTesting(true);
    setTestResult(null);

    try {
      // 1. Generate proxy token
      const response = await api.post("/api/proxy/token", {
        tool_id: selectedTool.tool_id
      });

      if (response.data?.success && response.data?.data?.token) {
        const token = response.data.data.token;
        const prefix = selectedTool.metadata?.cloud_path_prefix || "envato";
        const proxyUrl = `https://tools.nexustoolz.com/api/proxy/${prefix}/?token=${token}`;
        
        setTestResult({
          success: true,
          message: "تم توليد رمز الدخول بنجاح! يمكنك الآن تشغيل البروكسي.",
          token: token,
          proxyUrl: proxyUrl,
          metadata: selectedTool.metadata
        });
      } else {
        setTestResult({
          success: false,
          message: response.data?.message || "فشل توليد رمز الدخول من الخادم."
        });
      }
    } catch (err: any) {
      console.error("Test proxy error:", err);
      setTestResult({
        success: false,
        message: err.response?.data?.message || err.message || "حدث خطأ أثناء الاتصال بالخادم."
      });
    } finally {
      setTesting(false);
    }
  };

  const cloudTools = data?.toolsData?.filter((t: any) => t.tool_mode === "cloud") || [];

  if (infoLoading) {
    return (
      <div className="min-h-screen bg-[#0b0f19] flex items-center justify-center">
        <Loader2 className="animate-spin text-[#00c48c] w-12 h-12" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0b0f19] text-white p-6 md:p-12">
      <div className="max-w-4xl mx-auto flex flex-col gap-6">
        
        {/* Back Link */}
        <Link href="/subscriptions" className="flex items-center gap-2 text-gray-400 hover:text-white transition w-fit">
          <ArrowLeft size={18} />
          الرجوع إلى الاشتراكات
        </Link>

        {/* Header Card */}
        <div className="p-8 rounded-3xl bg-[linear-gradient(135deg,_#190237,_#00c48c30)] border border-[#00c48c]/30 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#00c48c]/10 rounded-full blur-3xl"></div>
          <h1 className="text-3xl font-black text-white flex items-center gap-3">
            🧪 لوحة اختبار وتجربة البروكسي السحابي
          </h1>
          <p className="text-gray-400 mt-2 max-w-2xl leading-relaxed">
            استخدم هذه الصفحة لاختبار الأدوات السحابية التي تم تفعيل البروكسي لها. تقوم الصفحة بالتحقق من اشتراكك، وتوليد رمز دخول آمن، وتوفير رابط تشغيل الأداة عبر خادم `tools.nexustoolz.com`.
          </p>
        </div>

        {/* Main Content Form */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Selector Card */}
          <div className="md:col-span-1 p-6 rounded-3xl bg-[#131926] border border-white/5 flex flex-col gap-4">
            <h3 className="text-md font-bold text-gray-300">اختر الأداة السحابية</h3>
            
            <select
              value={selectedToolId}
              onChange={(e) => setSelectedToolId(e.target.value)}
              className="w-full bg-[#0b0f19] border border-white/10 rounded-xl p-3 text-white outline-none focus:border-[#00c48c] transition"
            >
              <option value="">-- اختر أداة --</option>
              {cloudTools.map((t: any) => (
                <option key={t.tool_id} value={t.tool_id.toString()}>
                  {t.tool_name}
                </option>
              ))}
            </select>

            {selectedTool && (
              <div className="mt-4 flex flex-col gap-2 text-sm text-gray-400">
                <div className="flex justify-between border-b border-white/5 py-1">
                  <span>معرف الأداة:</span>
                  <span className="text-white">{selectedTool.tool_id}</span>
                </div>
                <div className="flex justify-between border-b border-white/5 py-1">
                  <span>الخطة المطلوبة:</span>
                  <span className="text-[#ff7702] uppercase font-bold">{selectedTool.tool_plan}</span>
                </div>
                <div className="flex justify-between border-b border-white/5 py-1">
                  <span>وضع الأداة:</span>
                  <span className="text-[#00c48c] font-bold">Cloud Proxy</span>
                </div>
              </div>
            )}
          </div>

          {/* Configuration and Testing Card */}
          <div className="md:col-span-2 p-6 rounded-3xl bg-[#131926] border border-white/5 flex flex-col gap-5">
            {!selectedTool ? (
              <div className="h-full flex items-center justify-center text-gray-500 py-12">
                الرجاء اختيار أداة من القائمة الجانبية لعرض الإعدادات وبدء الاختبار.
              </div>
            ) : (
              <>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  ⚙️ إعدادات الأداة: <span className="text-[#00c48c]">{selectedTool.tool_name}</span>
                </h3>

                {/* Metadata details */}
                <div className="grid grid-cols-2 gap-4 bg-[#0b0f19] p-4 rounded-2xl border border-white/5 text-sm">
                  <div className="flex flex-col gap-1 col-span-2 md:col-span-1">
                    <span className="text-gray-400 text-xs">رابط الهدف الأصلي (Target URL)</span>
                    <span className="text-white truncate font-mono">{selectedTool.metadata?.cloud_target_url || "غير محدد"}</span>
                  </div>
                  <div className="flex flex-col gap-1 col-span-2 md:col-span-1">
                    <span className="text-gray-400 text-xs">بادئة مسار البروكسي (Prefix)</span>
                    <span className="text-[#00c48c] font-mono font-bold">/{selectedTool.metadata?.cloud_path_prefix || "غير محدد"}</span>
                  </div>
                  <div className="flex flex-col gap-1 col-span-2 md:col-span-1">
                    <span className="text-gray-400 text-xs">طريقة الوصول (Access Mode)</span>
                    <span className="text-white font-bold">{selectedTool.metadata?.cloud_access_mode === 'proxy' ? 'بروكسي سحابي (Proxy)' : 'رابط مباشر (Direct)'}</span>
                  </div>
                  <div className="flex flex-col gap-1 col-span-2 md:col-span-1">
                    <span className="text-gray-400 text-xs">الحد اليومي للتحميل (Daily Limit)</span>
                    <span className="text-white font-bold">{selectedTool.metadata?.cloud_daily_download_limit || "غير محدود (0)"} ملفات</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-4">
                  <button
                    onClick={handleTestProxy}
                    disabled={testing}
                    className="w-full py-4 rounded-xl bg-gradient-to-r from-[#00c48c] to-[#4f008c] hover:opacity-90 transition font-bold flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {testing ? (
                      <>
                        <Loader2 className="animate-spin" size={18} />
                        جاري فحص الاشتراك وتوليد الرمز...
                      </>
                    ) : (
                      <>
                        <Play size={18} />
                        ابدأ اختبار البروكسي (Test Proxy)
                      </>
                    )}
                  </button>

                  {/* Test Result Display */}
                  {testResult && (
                    <div className={`p-5 rounded-2xl border ${testResult.success ? 'bg-[#00c48c]/10 border-[#00c48c]/30' : 'bg-red-950/20 border-red-900/30'} flex flex-col gap-3 animate-in fade-in duration-300`}>
                      <div className="flex items-center gap-2 font-bold text-sm">
                        {testResult.success ? (
                          <span className="text-[#00c48c] flex items-center gap-1">🟢 {testResult.message}</span>
                        ) : (
                          <span className="text-red-500 flex items-center gap-1">🔴 {testResult.message}</span>
                        )}
                      </div>
                      
                      {testResult.success && (
                        <div className="flex flex-col gap-3 mt-1">
                          <div className="bg-black/40 p-3 rounded-lg font-mono text-xs break-all border border-white/5">
                            <span className="text-gray-400">One-time Token: </span>
                            <span className="text-white">{testResult.token}</span>
                          </div>
                          
                          <a
                            href={testResult.proxyUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full py-3 bg-[#00c48c] text-black font-black text-center rounded-xl hover:bg-[#00b07e] transition flex items-center justify-center gap-2"
                          >
                            🚀 تشغيل البروكسي الآن (Launch Proxy)
                          </a>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

        </div>

      </div>
    </div>
  );
};

export default TestProxyPage;
