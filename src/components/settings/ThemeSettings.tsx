import React from 'react';
import { ThemeSettings as ThemeSettingsType } from '../../types/dashboard';
import { Palette, Sliders, Check } from 'lucide-react';

interface ThemeSettingsProps {
  theme: ThemeSettingsType;
  onUpdateTheme: (partial: Partial<ThemeSettingsType>) => void;
}

const PRESETS: {
  id: ThemeSettingsType['themePreset'];
  label: string;
  accent: string;
  rgb: string;
  secondary: string;
}[] = [
  { id: 'matrix', label: 'Matrix Hacker', accent: '#00ff66', rgb: '0, 255, 102', secondary: '#7ba38e' },
  { id: 'cyberpunk', label: 'Cyberpunk Cyan', accent: '#00f0ff', rgb: '0, 240, 255', secondary: '#709aa8' },
  { id: 'amber', label: 'Solar Amber', accent: '#ffb700', rgb: '255, 183, 0', secondary: '#aa9670' },
  { id: 'crimson', label: 'Crimson Breach', accent: '#ff2a5f', rgb: '255, 42, 95', secondary: '#a8707e' },
  { id: 'obsidian', label: 'Obsidian Neon', accent: '#a855f7', rgb: '168, 85, 247', secondary: '#967aa8' },
];

function hexToRgb(hex: string): string {
  const clean = hex.replace('#', '');
  if (clean.length === 3) {
    const r = parseInt(clean[0] + clean[0], 16);
    const g = parseInt(clean[1] + clean[1], 16);
    const b = parseInt(clean[2] + clean[2], 16);
    return `${r}, ${g}, ${b}`;
  }
  if (clean.length === 6) {
    const r = parseInt(clean.substring(0, 2), 16);
    const g = parseInt(clean.substring(2, 4), 16);
    const b = parseInt(clean.substring(4, 6), 16);
    return `${r}, ${g}, ${b}`;
  }
  return '0, 255, 102';
}

export const ThemeSettings: React.FC<ThemeSettingsProps> = ({ theme, onUpdateTheme }) => {
  return (
    <div className="space-y-6">
      {/* Preset Theme Selection */}
      <div>
        <label className="text-xs font-mono uppercase tracking-wider text-emerald-400 font-bold block mb-3 flex items-center gap-1.5">
          <Palette className="w-3.5 h-3.5" />
          <span>Color Presets</span>
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {PRESETS.map(preset => {
            const isSelected = theme.themePreset === preset.id;
            return (
              <button
                key={preset.id}
                onClick={() =>
                  onUpdateTheme({
                    themePreset: preset.id,
                    accentColor: preset.accent,
                    accentRgb: preset.rgb,
                    secondaryColor: preset.secondary,
                  })
                }
                className={`p-2.5 rounded-xl text-left border flex items-center justify-between transition-all ${
                  isSelected
                    ? 'bg-black/60 border-emerald-400 ring-1 ring-emerald-400 shadow-md shadow-emerald-500/10'
                    : 'bg-black/30 hover:bg-black/50 border-gray-800 text-gray-400 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span
                    className="w-4 h-4 rounded-full border border-black/40"
                    style={{ backgroundColor: preset.accent }}
                  />
                  <span className="text-xs font-mono font-medium">{preset.label}</span>
                </div>
                {isSelected && <Check className="w-3.5 h-3.5 text-emerald-400" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Custom Colors */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-gray-800">
        <div>
          <label className="text-xs font-mono text-gray-300 block mb-1.5">
            Primary Accent Color
          </label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={theme.accentColor}
              onChange={e => {
                const color = e.target.value;
                onUpdateTheme({
                  accentColor: color,
                  accentRgb: hexToRgb(color),
                  themePreset: 'custom',
                });
              }}
              className="w-8 h-8 rounded border border-gray-700 bg-transparent cursor-pointer"
            />
            <input
              type="text"
              value={theme.accentColor}
              onChange={e => {
                const color = e.target.value;
                if (/^#[0-9A-Fa-f]{6}$/.test(color)) {
                  onUpdateTheme({
                    accentColor: color,
                    accentRgb: hexToRgb(color),
                    themePreset: 'custom',
                  });
                }
              }}
              className="px-2.5 py-1 text-xs font-mono rounded bg-black/50 border border-gray-700 text-white w-24"
            />
          </div>
        </div>

        <div>
          <label className="text-xs font-mono text-gray-300 block mb-1.5">
            Secondary Text Color
          </label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={theme.secondaryColor}
              onChange={e =>
                onUpdateTheme({
                  secondaryColor: e.target.value,
                  themePreset: 'custom',
                })
              }
              className="w-8 h-8 rounded border border-gray-700 bg-transparent cursor-pointer"
            />
            <input
              type="text"
              value={theme.secondaryColor}
              onChange={e => {
                const color = e.target.value;
                if (/^#[0-9A-Fa-f]{6}$/.test(color)) {
                  onUpdateTheme({
                    secondaryColor: color,
                    themePreset: 'custom',
                  });
                }
              }}
              className="px-2.5 py-1 text-xs font-mono rounded bg-black/50 border border-gray-700 text-white w-24"
            />
          </div>
        </div>
      </div>

      {/* Glassmorphism Sliders */}
      <div className="space-y-4 pt-3 border-t border-gray-800">
        <label className="text-xs font-mono uppercase tracking-wider text-emerald-400 font-bold block flex items-center gap-1.5">
          <Sliders className="w-3.5 h-3.5" />
          <span>Matte Glass Appearance</span>
        </label>

        {/* Card Transparency / Opacity */}
        <div>
          <div className="flex items-center justify-between text-xs font-mono text-gray-300 mb-1">
            <span>Glass Opacity</span>
            <span className="text-emerald-400">{Math.round(theme.glassOpacity * 100)}%</span>
          </div>
          <input
            type="range"
            min="0.2"
            max="0.95"
            step="0.05"
            value={theme.glassOpacity}
            onChange={e => onUpdateTheme({ glassOpacity: parseFloat(e.target.value) })}
            className="w-full accent-emerald-400 h-1.5 bg-gray-800 rounded-lg cursor-pointer"
          />
        </div>

        {/* Blur Radius */}
        <div>
          <div className="flex items-center justify-between text-xs font-mono text-gray-300 mb-1">
            <span>Backdrop Frost Blur</span>
            <span className="text-emerald-400">{theme.glassBlur}px</span>
          </div>
          <input
            type="range"
            min="4"
            max="32"
            step="2"
            value={theme.glassBlur}
            onChange={e => onUpdateTheme({ glassBlur: parseInt(e.target.value, 10) })}
            className="w-full accent-emerald-400 h-1.5 bg-gray-800 rounded-lg cursor-pointer"
          />
        </div>

        {/* Border Intensity */}
        <div>
          <div className="flex items-center justify-between text-xs font-mono text-gray-300 mb-1">
            <span>Border Accent Intensity</span>
            <span className="text-emerald-400">{Math.round(theme.borderIntensity * 100)}%</span>
          </div>
          <input
            type="range"
            min="0.05"
            max="0.5"
            step="0.02"
            value={theme.borderIntensity}
            onChange={e => onUpdateTheme({ borderIntensity: parseFloat(e.target.value) })}
            className="w-full accent-emerald-400 h-1.5 bg-gray-800 rounded-lg cursor-pointer"
          />
        </div>
      </div>
    </div>
  );
};
