import React, { useState } from 'react';
import { BackgroundType, ThemeSettings } from '../../types/dashboard';
import { Image, Sparkles, Upload, Link2, Check } from 'lucide-react';

interface BackgroundSettingsProps {
  theme: ThemeSettings;
  onUpdateTheme: (partial: Partial<ThemeSettings>) => void;
}

const GRADIENT_PRESETS = [
  {
    name: 'Matrix Dark Void',
    value: 'radial-gradient(ellipse at top, #0c2417 0%, #050f0a 45%, #010402 100%)',
  },
  {
    name: 'Cyberpunk Eclipse',
    value: 'radial-gradient(ellipse at top right, #112a38 0%, #061118 45%, #020608 100%)',
  },
  {
    name: 'Solarized Abyss',
    value: 'radial-gradient(circle at 50% 20%, #2b1f07 0%, #0d0a03 55%, #020201 100%)',
  },
  {
    name: 'Deep Obsidian Space',
    value: 'radial-gradient(ellipse at bottom, #19092b 0%, #07030d 50%, #000000 100%)',
  },
];

const WALLPAPER_PRESETS = [
  {
    name: 'Cyber Matrix Grid',
    url: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?q=80&w=1920&auto=format&fit=crop',
  },
  {
    name: 'Futuristic Dark Neon City',
    url: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?q=80&w=1920&auto=format&fit=crop',
  },
  {
    name: 'Deep Cosmos Nebula',
    url: 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?q=80&w=1920&auto=format&fit=crop',
  },
  {
    name: 'Abstract Dark Topology',
    url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1920&auto=format&fit=crop',
  },
];

export const BackgroundSettings: React.FC<BackgroundSettingsProps> = ({
  theme,
  onUpdateTheme,
}) => {
  const [customUrl, setCustomUrl] = useState('');
  const [urlError, setUrlError] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setUploadError('Please select a valid image file.');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setUploadError('Image size exceeds 2MB limit (recommended for browser localStorage).');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      onUpdateTheme({
        backgroundType: 'custom',
        backgroundValue: dataUrl,
      });
      setUploadError(null);
    };
    reader.onerror = () => {
      setUploadError('Failed to read image file.');
    };
    reader.readAsDataURL(file);
  };

  const handleCustomUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = customUrl.trim();
    if (!trimmed) return;

    try {
      const parsed = new URL(trimmed);
      if (!['http:', 'https:'].includes(parsed.protocol)) {
        setUrlError('Please enter a valid HTTP or HTTPS image URL.');
        return;
      }
    } catch {
      setUrlError('Please enter a valid URL (e.g. https://example.com/image.jpg).');
      return;
    }

    setUrlError(null);
    onUpdateTheme({
      backgroundType: 'wallpaper',
      backgroundValue: trimmed,
    });
  };

  return (
    <div className="space-y-6">
      {/* Background Mode Selector */}
      <div>
        <label className="text-xs font-mono uppercase tracking-wider text-emerald-400 font-bold block mb-3">
          Background Type
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {(['gradient', 'wallpaper', 'solid', 'custom'] as BackgroundType[]).map(type => (
            <button
              key={type}
              onClick={() => {
                if (type === 'gradient') {
                  onUpdateTheme({
                    backgroundType: 'gradient',
                    backgroundValue: GRADIENT_PRESETS[0].value,
                  });
                } else if (type === 'solid') {
                  onUpdateTheme({
                    backgroundType: 'solid',
                    backgroundValue: '#030705',
                  });
                } else if (type === 'wallpaper') {
                  onUpdateTheme({
                    backgroundType: 'wallpaper',
                    backgroundValue: WALLPAPER_PRESETS[0].url,
                  });
                }
              }}
              className={`py-2 px-3 rounded-xl font-mono text-xs capitalize transition-all border ${
                theme.backgroundType === type
                  ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300 font-semibold'
                  : 'bg-black/30 hover:bg-black/50 border-gray-800 text-gray-400'
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* GRADIENT PRESETS */}
      {theme.backgroundType === 'gradient' && (
        <div className="space-y-3">
          <label className="text-xs font-mono text-gray-300 block flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <span>Curated Cyber Gradients</span>
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {GRADIENT_PRESETS.map(preset => {
              const isSelected = theme.backgroundValue === preset.value;
              return (
                <button
                  key={preset.name}
                  onClick={() =>
                    onUpdateTheme({
                      backgroundType: 'gradient',
                      backgroundValue: preset.value,
                    })
                  }
                  className={`p-3 rounded-xl text-left border flex items-center justify-between transition-all ${
                    isSelected
                      ? 'border-emerald-400 ring-1 ring-emerald-400 shadow-md shadow-emerald-500/10'
                      : 'border-gray-800 hover:border-gray-700'
                  }`}
                  style={{ background: preset.value }}
                >
                  <span className="text-xs font-mono text-white font-medium drop-shadow-md">
                    {preset.name}
                  </span>
                  {isSelected && <Check className="w-4 h-4 text-emerald-400 drop-shadow" />}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* SOLID COLOR */}
      {theme.backgroundType === 'solid' && (
        <div className="space-y-3">
          <label className="text-xs font-mono text-gray-300 block">
            Select Pitch-Black / Near-Black Solid Color
          </label>
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={theme.backgroundValue}
              onChange={e =>
                onUpdateTheme({
                  backgroundType: 'solid',
                  backgroundValue: e.target.value,
                })
              }
              className="w-10 h-10 rounded border border-gray-700 bg-transparent cursor-pointer"
            />
            <input
              type="text"
              value={theme.backgroundValue}
              onChange={e =>
                onUpdateTheme({
                  backgroundType: 'solid',
                  backgroundValue: e.target.value,
                })
              }
              className="px-3 py-1.5 text-xs font-mono rounded-lg bg-black/50 border border-gray-700 text-white w-32"
            />
          </div>
        </div>
      )}

      {/* WALLPAPER PRESETS & CUSTOM URL */}
      {theme.backgroundType === 'wallpaper' && (
        <div className="space-y-4">
          <label className="text-xs font-mono text-gray-300 block flex items-center gap-1.5">
            <Image className="w-3.5 h-3.5 text-emerald-400" />
            <span>Curated Futuristic Wallpapers</span>
          </label>
          <div className="grid grid-cols-2 gap-3">
            {WALLPAPER_PRESETS.map(wp => {
              const isSelected = theme.backgroundValue === wp.url;
              return (
                <button
                  key={wp.name}
                  onClick={() =>
                    onUpdateTheme({
                      backgroundType: 'wallpaper',
                      backgroundValue: wp.url,
                    })
                  }
                  className={`group relative h-24 rounded-xl overflow-hidden border transition-all ${
                    isSelected
                      ? 'border-emerald-400 ring-2 ring-emerald-400'
                      : 'border-gray-800 hover:border-gray-600'
                  }`}
                >
                  <img
                    src={wp.url}
                    alt={wp.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-black/50 p-2 flex items-end">
                    <span className="text-[11px] font-mono text-white font-medium truncate">
                      {wp.name}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Custom URL Input */}
          <form onSubmit={handleCustomUrlSubmit} className="pt-2">
            <label className="text-xs font-mono text-gray-400 block mb-1">
              Or specify custom image URL
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type="url"
                  placeholder="https://example.com/wallpaper.jpg"
                  value={customUrl}
                  onChange={e => setCustomUrl(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs font-mono rounded-lg bg-black/50 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-emerald-400"
                />
                <Link2 className="w-3.5 h-3.5 text-gray-500 absolute left-2.5 top-2.5" />
              </div>
              <button
                type="submit"
                className="px-3 py-1.5 text-xs font-mono rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40"
              >
                Apply URL
              </button>
            </div>
            {urlError && (
              <p className="text-xs text-red-400 mt-1.5 font-mono">{urlError}</p>
            )}
          </form>
        </div>
      )}

      {/* LOCAL UPLOAD */}
      {theme.backgroundType === 'custom' && (
        <div className="space-y-3">
          <label className="text-xs font-mono text-gray-300 block flex items-center gap-1.5">
            <Upload className="w-3.5 h-3.5 text-emerald-400" />
            <span>Upload Device Wallpaper (Stored Locally)</span>
          </label>
          <div className="p-4 rounded-xl border border-dashed border-emerald-500/30 bg-black/30 text-center">
            <input
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="text-xs text-gray-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-mono file:bg-emerald-500/20 file:text-emerald-300 hover:file:bg-emerald-500/30 cursor-pointer"
            />
            {uploadError && (
              <p className="text-xs text-red-400 mt-2">{uploadError}</p>
            )}
            <p className="text-[11px] text-gray-500 mt-2">
              Max file size: 2MB. Converted to secure base64 string directly in your browser.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
