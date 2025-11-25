import { usePacksList } from "@/utils/pack/getPacksList";
import react from "react"
const DeviceInfo = () => {
    const { isLoading, isError, data } = usePacksList();

    return(
        <div className="max-w-6xl rounded-[60px] border-2 border-orange p-8 flex items-center mt-20">
                  <div className="hidden md:flex">
                    <img className="w-100 shadow-xl" src="/images/ppp-removebg-preview.png" alt="" />
                </div>
                <div>
                    <ul dir="rtl" className="text-white flex flex-col gap-2 list-disc  text-xl">
                        <li  className="text-orange">باقة  <span className="text-[#00c48c] font-bold">{data?.find((p: any) => p.pack_name.trim() === "AI Plan" )?.monthly_price}AI Plan </span> دولار شهريًا
                        </li>
                        <li>مناسبة للمستخدمين العاديين اللي يحتاجون أدوات تحليل أساسية</li>
                        <li> تقدر تضيف جهاز إضافي على نفس الاشتراك مقابل <span className="text-[#00c48c] font-bold">{data?.find((p: any) => p.pack_name.trim() === "AI Plan" )?.additional_device_price}</span> دولار
                        </li>
                        <li> مثالي لو تبغى تستخدم الباقة على جوال ولابتوب بنفس الوقت
                        </li>
                        {data?.map((p) => p.pack_name.trim() === "Designers plan"  ?<>
                         <li className="text-orange">باقة  <span className="text-[#00c48c] font-bold">{p.monthly_price}Designers Plan</span> دولار شهريًا</li>
                        <li>مصممة للمحللين النشطين واللي يحتاجون أدوات وميزات متقدمة</li>
                        <li> تقدر تضيف جهاز إضافي بقيمة <span className="text-[#00c48c] font-bold">{p.additional_device_price}</span> دولار</li>
                        <li>مناسبة للي يشتغل من أكثر من بيئة عمل ويحتاج مرونة أكبر</li></> :"" )}
                        
                      
                      {data?.map((p) => p.pack_name.trim() === "All in One Plan"  ? <> 

                        <li className="text-orange"> باقة  <span className="text-[#00c48c] font-bold">{p.monthly_price}All in One Plan</span> دولار شهريًا
                        </li>
                        <li>مخصصة للشركات والمحترفين اللي يحتاجون أعلى أداء وتحكم
                        </li>
                        <li>إضافة كل جهاز إضافي بقيمة <span className="text-[#00c48c] font-bold">{p.additional_device_price}</span> دولار
                        </li>
                        <li>مثالية للفرق أو المكاتب اللي يستخدم فيها أكثر من شخص نفس الاشتراك
                        </li>
                        <li>كل باقة تدعم إضافة حتى 5 أجهزة كحد أقصى على نفس الحساب
                        </li>
                        <li> اختر الباقة اللي تناسب احتياجك، ووسع اشتراكك بسهولة حسب عدد أجهزتك أو فريقك</li>
                      </> : "")}
                        
                    </ul>
                </div>


             
        </div>
    )
}

export default DeviceInfo