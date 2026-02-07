"use client";

import React from 'react';
import { AIModel, VideoModel, getQualityColor, getSpeedColor, getProviderIcon } from '@/lib/ai-models-config';
import { Zap, Crown, Sparkles, Check } from 'lucide-react';

interface ModelSelectorProps {
  models: AIModel[] | VideoModel[];
  selectedModelId: string;
  onSelectModel: (modelId: string) => void;
  size?: string; // For images: '1024x1024', etc.
  duration?: number; // For videos: 5, 10, 15
  profit?: number; // Profit margin from plan
  className?: string;
  compact?: boolean;
}

export function ModelSelector({ 
  models, 
  selectedModelId, 
  onSelectModel, 
  size,
  duration,
  profit = 0,
  className = '',
  compact = false
}: ModelSelectorProps) {
  
  const getModelCost = (model: AIModel | VideoModel): number => {
    if ('creditsByDuration' in model && duration) {
      return (model.creditsByDuration[duration] ?? model.baseCostCredits) + profit;
    }
    if ('creditsBySize' in model && size && model.creditsBySize) {
      return (model.creditsBySize[size] ?? model.baseCostCredits) + profit;
    }
    return model.baseCostCredits + profit;
  };

  if (compact) {
    return (
      <div className={`space-y-1.5 ${className}`}>
        {models.map((model) => {
          const isSelected = model.id === selectedModelId;
          const cost = getModelCost(model);
          
          return (
            <button
              key={model.id}
              onClick={() => onSelectModel(model.id)}
              className={`w-full flex items-center justify-between p-2.5 rounded-xl border transition-all duration-200 ${
                isSelected
                  ? 'bg-gradient-to-r from-purple-500/10 to-blue-500/10 border-purple-500/40 shadow-lg shadow-purple-500/5'
                  : 'bg-white/[0.02] border-white/5 hover:bg-white/[0.05] hover:border-white/10'
              }`}
            >
              <div className="flex items-center gap-2">
                {isSelected && (
                  <div className="w-4 h-4 rounded-full bg-purple-500 flex items-center justify-center">
                    <Check size={10} className="text-white" />
                  </div>
                )}
                <span className="text-[10px] opacity-60">{getProviderIcon(model.provider)}</span>
                <span className={`text-xs font-bold ${isSelected ? 'text-white' : 'text-gray-400'}`}>
                  {model.name}
                </span>
                {model.isNew && (
                  <span className="px-1.5 py-0.5 text-[8px] font-black bg-green-500/20 text-green-400 rounded-full border border-green-500/30">
                    NEW
                  </span>
                )}
                {model.isPremium && (
                  <Crown size={10} className="text-yellow-500" />
                )}
              </div>
              <div className={`text-xs font-bold ${isSelected ? 'text-purple-400' : 'text-gray-500'}`}>
                {cost} <span className="text-[8px] opacity-60">credits</span>
              </div>
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div className={`grid grid-cols-1 gap-2 ${className}`}>
      {models.map((model) => {
        const isSelected = model.id === selectedModelId;
        const cost = getModelCost(model);
        
        return (
          <button
            key={model.id}
            onClick={() => onSelectModel(model.id)}
            className={`relative w-full p-3 rounded-2xl border transition-all duration-300 text-right group ${
              isSelected
                ? 'bg-gradient-to-r from-purple-500/10 via-blue-500/5 to-transparent border-purple-500/40 shadow-xl shadow-purple-500/10'
                : 'bg-white/[0.02] border-white/5 hover:bg-white/[0.05] hover:border-white/10'
            }`}
          >
            {/* Selection Indicator */}
            <div className={`absolute top-3 left-3 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
              isSelected 
                ? 'bg-purple-500 border-purple-500' 
                : 'border-white/20 group-hover:border-white/40'
            }`}>
              {isSelected && <Check size={12} className="text-white" />}
            </div>

            {/* Model Info */}
            <div className="flex items-start justify-between">
              <div className="flex-1 pr-8">
                <div className="flex items-center gap-2 mb-1">
                  <span className="opacity-50">{getProviderIcon(model.provider)}</span>
                  <h4 className={`text-sm font-bold ${isSelected ? 'text-white' : 'text-gray-300'}`}>
                    {model.name}
                  </h4>
                  {model.badge && (
                    <span className="px-1.5 py-0.5 text-[8px] font-black bg-white/10 text-white/70 rounded-full">
                      {model.badge}
                    </span>
                  )}
                  {model.isNew && (
                    <span className="px-1.5 py-0.5 text-[8px] font-black bg-green-500/20 text-green-400 rounded-full border border-green-500/30 flex items-center gap-0.5">
                      <Sparkles size={8} /> جديد
                    </span>
                  )}
                  {model.isPremium && (
                    <Crown size={12} className="text-yellow-500" />
                  )}
                </div>
                <p className="text-[10px] text-gray-500 mb-2">{model.description}</p>
                
                {/* Quality & Speed Tags */}
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 text-[8px] font-bold rounded-full border ${getQualityColor(model.quality)}`}>
                    {model.quality === 'ultra' ? 'Ultra HD' : model.quality === 'high' ? 'High' : 'Standard'}
                  </span>
                  <span className={`flex items-center gap-0.5 text-[8px] font-bold ${getSpeedColor(model.speed)}`}>
                    <Zap size={8} />
                    {model.speed === 'fast' ? 'سريع' : model.speed === 'medium' ? 'متوسط' : 'بطيء'}
                  </span>
                  {'hasAudio' in model && model.hasAudio && (
                    <span className="px-2 py-0.5 text-[8px] font-bold rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                      🔊 Audio
                    </span>
                  )}
                </div>
              </div>

              {/* Cost */}
              <div className={`text-left ${isSelected ? 'text-purple-400' : 'text-gray-500'}`}>
                <div className="text-lg font-black">{cost}</div>
                <div className="text-[8px] opacity-60 uppercase tracking-tighter">credits</div>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}

export default ModelSelector;
