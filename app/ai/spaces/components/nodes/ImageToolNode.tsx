import React from 'react';
import { Handle, NodeProps, Position } from '@xyflow/react';
import { Image as ImageIcon, Maximize2 } from 'lucide-react';
import { BaseNodeWrapper } from './BaseNodeWrapper';
import { SpacesNode, useSpacesStore } from '@/stores/spacesStore';

const SELECTS: Record<string, Array<{ key: string; label: string; options: Array<[string, string]> }>> = {
  logo: [{ key: 'style', label: 'الأسلوب', options: [['modern', 'حديث'], ['classic', 'كلاسيكي'], ['playful', 'مرح'], ['professional', 'احترافي']] }],
  sketch: [
    { key: 'style', label: 'الأسلوب', options: [['realistic', 'واقعي'], ['artistic', 'فني'], ['cartoon', 'كرتوني'], ['anime', 'أنمي']] },
    { key: 'colorScheme', label: 'الألوان', options: [['natural', 'طبيعية'], ['vibrant', 'زاهية'], ['monochrome', 'أحادية'], ['sepia', 'سيبيا']] },
  ],
  'id-photo': [{ key: 'background', label: 'الخلفية', options: [['white', 'بيضاء'], ['blue', 'زرقاء'], ['red', 'حمراء'], ['grey', 'رمادية']] }],
  edit: [{ key: 'editType', label: 'نوع التعديل', options: [['remove_object', 'حذف عنصر'], ['add_object', 'إضافة عنصر'], ['change_background', 'تغيير الخلفية'], ['enhance_quality', 'تحسين الجودة']] }],
  relight: [{ key: 'direction', label: 'اتجاه الضوء', options: [['right', 'يمين'], ['left', 'يسار'], ['front', 'أمام'], ['back', 'خلف'], ['top', 'أعلى'], ['bottom', 'أسفل']] }],
  'hair-style': [
    { key: 'gender', label: 'الفئة', options: [['female', 'نسائي'], ['male', 'رجالي']] },
    { key: 'hairstyle', label: 'القصة', options: [['french_bob', 'French bob'], ['pixie_cut', 'Pixie'], ['layered_blowout', 'Layered'], ['curly_volume', 'Curly'], ['taper_fade', 'Taper fade'], ['textured_quiff', 'Quiff'], ['buzz_cut', 'Buzz cut']] },
    { key: 'hairColor', label: 'اللون', options: [['natural_black', 'أسود'], ['dark_brown', 'بني داكن'], ['chestnut_brown', 'كستنائي'], ['honey_blonde', 'أشقر عسلي'], ['copper_red', 'نحاسي']] },
  ],
  'age-journey': [
    { key: 'mode', label: 'النتيجة', options: [['image', 'صورة'], ['video', 'فيديو']] },
    { key: 'targetAge', label: 'العمر', options: [['45', '45'], ['55', '55'], ['65', '65'], ['80', '80']] },
  ],
  'fisheye-night': [
    { key: 'mode', label: 'النتيجة', options: [['image', 'صورة'], ['video', 'فيديو']] },
    { key: 'atmosphere', label: 'الأجواء', options: [['cctv_security', 'مراقبة'], ['horror_street', 'شارع غامض'], ['rave_party', 'حفلة'], ['cyberpunk_alley', 'سايبربانك']] },
  ],
  'celebrity-mode': [
    { key: 'mode', label: 'النتيجة', options: [['image', 'صورة'], ['video', 'فيديو']] },
    { key: 'setting', label: 'المشهد', options: [['red_carpet', 'سجادة حمراء'], ['vip_airport', 'وصول VIP'], ['press_conference', 'مؤتمر صحفي']] },
  ],
};

const PROMPT_TOOLS = new Set(['logo', 'sketch', 'edit', 'clothes-swap']);

export const ImageToolNode: React.FC<NodeProps<SpacesNode>> = ({ id, data }) => {
  const { updateNodeData, openPreview } = useSpacesStore();
  const toolId = data.toolId || '';
  const resultType = data.outputType === 'text' ? 'text' : data.mode === 'video' ? 'video' : 'image';

  const uploadSecondary = (file?: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => updateNodeData(id, { garmentImageUrl: String(reader.result || '') });
    reader.readAsDataURL(file);
  };

  return (
    <BaseNodeWrapper id={id} data={data} icon={<ImageIcon size={13} className="text-sky-400" />}>
      {data.requiresImage && (
        <div className="relative flex items-center justify-start pb-1">
          <Handle type="target" position={Position.Left} id="image-in" className="!bg-blue-500 !-left-4" />
          <span className="mr-2 text-[10px] font-bold text-blue-400">مدخل الصورة</span>
        </div>
      )}
      {PROMPT_TOOLS.has(toolId) && (
        <div className="relative">
          <Handle type="target" position={Position.Left} id="prompt-in" className="!bg-emerald-500 !-left-4" />
          <textarea
            value={data.prompt || ''}
            onChange={(event) => updateNodeData(id, { prompt: event.target.value })}
            placeholder={toolId === 'logo' ? 'اسم العلامة أو وصف الشعار...' : 'وصف التعديل أو النتيجة...'}
            rows={2}
            className="w-full resize-none rounded-md border border-white/10 bg-[#07090e] p-2 text-xs text-white outline-none focus:border-sky-500"
          />
        </div>
      )}
      <div className="grid grid-cols-2 gap-1.5">
        {(SELECTS[toolId] || []).map((field) => (
          <label key={field.key} className="text-[10px] font-bold text-gray-400">
            {field.label}
            <select
              value={String(data[field.key] ?? field.options[0][0])}
              onChange={(event) => updateNodeData(id, { [field.key]: field.key === 'targetAge' ? Number(event.target.value) : event.target.value })}
              className="mt-1 w-full rounded-md border border-white/10 bg-[#07090e] p-1.5 text-xs text-white outline-none"
            >
              {field.options.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </label>
        ))}
      </div>
      {data.acceptsSecondImage && (
        <label className="block cursor-pointer rounded-md border border-dashed border-white/10 px-2 py-2 text-center text-[10px] text-gray-500 hover:border-sky-500/40 hover:text-gray-300">
          {data.garmentImageUrl ? 'تمت إضافة صورة قطعة الملابس' : 'صورة قطعة ملابس اختيارية'}
          <input type="file" accept="image/*" className="hidden" onChange={(event) => uploadSecondary(event.target.files?.[0])} />
        </label>
      )}
      {data.output && (data.output.url ? (
        <button
          type="button"
          onClick={() => openPreview({ nodeId: id, url: data.output?.url, type: resultType, prompt: data.prompt, media_id: data.media_id })}
          className="relative block aspect-video w-full overflow-hidden rounded-md border border-white/10"
        >
          {resultType === 'video'
            ? <video src={data.output.url} className="h-full w-full object-cover" muted />
            : <img src={data.output.url} alt="النتيجة" className="h-full w-full object-cover" />}
          <span className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity hover:opacity-100"><Maximize2 size={14} /></span>
        </button>
      ) : (
        <p className="rounded-md border border-white/10 bg-black/20 p-2 text-[11px] leading-5 text-gray-300">{data.output.text}</p>
      ))}
      <div className="relative flex items-center justify-end pt-1">
        <span className="ml-2 text-[10px] font-bold text-sky-400">{resultType === 'text' ? 'مخرج النص' : resultType === 'video' ? 'مخرج الفيديو' : 'مخرج الصورة'}</span>
        <Handle type="source" position={Position.Right} id={resultType === 'text' ? 'prompt-out' : `${resultType}-out`} className="!-right-4 !bg-sky-500" />
      </div>
    </BaseNodeWrapper>
  );
};
