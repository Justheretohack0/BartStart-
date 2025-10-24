

import React, { useState, useEffect, useRef } from 'react';

// --- Types ---
interface CustomTheme {
    name: string;
    colors: {
        bgStart: string;
        bgEnd: string;
        clockAccent: string;
        dateText: string;
        statsText: string;
    };
}
type PrebuiltThemeKey = 'morning' | 'day' | 'night' | 'stormy' | 'dawn' | 'sunset' | 'midnight' | 'sakura' | 'matcha' | 'koinobori' | 'sumie';
type ThemeKey = PrebuiltThemeKey | string; // string for custom theme names
type SearchEngine = 'google' | 'bing' | 'duckduckgo' | 'startpage';
interface Shortcut {
    name: string;
    url: string;
}

const PREBUILT_THEMES: PrebuiltThemeKey[] = ['morning', 'day', 'night', 'stormy', 'dawn', 'sunset', 'midnight', 'sakura', 'matcha', 'koinobori', 'sumie'];


// --- Helper Functions ---
const getTimeOfDay = (date: Date): 'morning' | 'day' | 'night' => {
    const hour = date.getHours();
    if (hour >= 5 && hour < 12) return 'morning';
    if (hour >= 12 && hour < 17) return 'day';
    return 'night';
};

const isColorDark = (hexColor: string): boolean => {
  try {
    const hex = hexColor.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16) / 255;
    const g = parseInt(hex.substring(2, 4), 16) / 255;
    const b = parseInt(hex.substring(4, 6), 16) / 255;
    const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    return luminance < 0.5;
  } catch (e) {
    return true; // Default to dark on parsing error
  }
};

// --- Icons ---
const SunIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
    </svg>
);
const CloudIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 10h-1.26A8 8 0 1 0 4 16.25h16.5A5.5 5.5 0 0 0 18 10z"></path>
    </svg>
);
const RainIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 13v8"></path><path d="M8 13v8"></path><path d="M12 15v8"></path><path d="M20 16.58A5 5 0 0 0 18 7h-1.26A8 8 0 1 0 4 15.25"></path>
    </svg>
);
const PartlyCloudyIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <path d="M17.5 19H9a7 7 0 1 1 6.33-10.5"/>
        <path d="M16 8A5 5 0 1 1 9 5.5"/>
    </svg>
);

// --- Custom Hook for Weather ---
const useWeather = () => {
    const [weather, setWeather] = useState<{ temp: number; precipitation: number; cloudCover: number } | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchWeather = (lat: number, lon: number) => {
            fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,precipitation,cloud_cover`)
                .then(res => res.json())
                .then(data => {
                    if (data.current) {
                        setWeather({
                            temp: Math.round(data.current.temperature_2m),
                            precipitation: data.current.precipitation,
                            cloudCover: data.current.cloud_cover,
                        });
                    }
                })
                .catch(() => setError('Could not fetch weather data.'));
        };

        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    fetchWeather(position.coords.latitude, position.coords.longitude);
                },
                () => {
                    // Fallback on error/denial
                    fetchWeather(21.1463, 79.0849);
                    setError("Location access denied. Using default.");
                }
            );
        } else {
             // Fallback if geolocation is not supported
             fetchWeather(21.1463, 79.0849);
             setError("Geolocation not supported. Using default.");
        }
    }, []);

    return { weather, error };
};


// --- Weather Widget ---
const WeatherWidget: React.FC<{ weatherData: any, theme: any }> = ({ weatherData, theme }) => {
    const getWeatherIcon = () => {
        if (!weatherData) return null;
        if (weatherData.precipitation > 0.1) return <RainIcon className="w-8 h-8" />;
        if (weatherData.cloudCover > 75) return <CloudIcon className="w-8 h-8" />;
        if (weatherData.cloudCover > 25) return <PartlyCloudyIcon className="w-8 h-8" />;
        return <SunIcon className="w-8 h-8" />;
    };

    return (
        <div className={`absolute top-6 right-6 flex items-center gap-3 p-2 pr-4 rounded-full ${theme.modalBg} ${theme.modalText} backdrop-blur-sm border ${theme.modalBorder} shadow-lg transition-colors duration-1000`}>
            {weatherData ? (
                <>
                    {getWeatherIcon()}
                    <span className="text-xl font-bold font-mono">{weatherData.temp}°C</span>
                </>
            ) : (
                <span className="px-2 text-sm">Loading weather...</span>
            )}
        </div>
    );
};


// --- Custom Hook for System Stats ---
const useSystemStats = () => {
  const [stats, setStats] = useState({
    ram: 45,
    cpu: 3,
    download: 257.8,
    upload: 7.2,
  });

  useEffect(() => {
    const intervalId = setInterval(() => {
      // RAM Usage (approximated from browser tab memory)
      const memory = (performance as any).memory;
      const ramUsage = memory && memory.jsHeapSizeLimit > 0
        ? (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100
        : Math.random() * 20 + 30; 

      setStats(prevStats => ({
        ram: ramUsage,
        cpu: Math.max(0, Math.min(100, prevStats.cpu + (Math.random() - 0.5) * 4)),
        download: Math.max(0, prevStats.download + (Math.random() - 0.5) * 50),
        upload: Math.max(0, prevStats.upload + (Math.random() - 0.5) * 5),
      }));
    }, 2000);

    return () => clearInterval(intervalId);
  }, []);

  return stats;
};


// --- System Info Widget ---
const StatBar: React.FC<{ label: string, value: number, unit: string, barColor: string, trackColor: string }> = ({ label, value, unit, barColor, trackColor }) => {
    const displayValue = unit === '%' ? value.toFixed(0) : value.toFixed(1);
    
    // Normalize values for progress bar display. These max values are for visualization purposes.
    const getPercentage = () => {
        if (unit === '%') return value;
        if (label === 'DOWN') return (value / 1000) * 100; // Assumes 1000 k = 100%
        if (label === 'UP') return (value / 500) * 100;   // Assumes 500 k = 100%
        return 0;
    }
    const percentage = getPercentage();

    return (
        <div className="flex items-center gap-3 text-xs">
            <span className="w-10 text-left uppercase tracking-widest font-bold">{label}</span>
            <div className="flex-1 h-1 rounded-full" style={{ backgroundColor: trackColor }}>
                <div 
                    className="h-1 rounded-full transition-all duration-500 ease-out" 
                    style={{ width: `${Math.min(100, Math.max(0, percentage))}%`, backgroundColor: barColor }}
                />
            </div>
            <span className="w-16 text-right font-mono">{displayValue}<span className="opacity-70">{unit}</span></span>
        </div>
    );
};


const SystemInfo: React.FC<{ textColor: string, strokeColor: string, barColor: string }> = ({ textColor, strokeColor, barColor }) => {
    const stats = useSystemStats();

    return (
        <div className={`mt-8 p-4 w-72 space-y-3 font-['Lato'] ${textColor}`}>
            <StatBar label="RAM" value={stats.ram} unit="%" barColor={barColor} trackColor={strokeColor}/>
            <StatBar label="CPU" value={stats.cpu} unit="%" barColor={barColor} trackColor={strokeColor}/>
            <StatBar label="DOWN" value={stats.download} unit="kb" barColor={barColor} trackColor={strokeColor}/>
            <StatBar label="UP" value={stats.upload} unit="kb" barColor={barColor} trackColor={strokeColor}/>
        </div>
    );
};

// --- Custom Theme Editor ---
const CustomThemeEditor: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onSave: (theme: CustomTheme) => void;
    theme: any;
}> = ({ isOpen, onClose, onSave, theme }) => {
    const [name, setName] = useState('My Custom Theme');
    const [colors, setColors] = useState({
        bgStart: '#1a2a6c',
        bgEnd: '#b21f1f',
        clockAccent: '#ffffff',
        dateText: '#ffffff',
        statsText: '#ffffff',
    });

    const handleSave = () => {
        if (name.trim()) {
            onSave({ name: name.trim(), colors });
            onClose();
        }
    };
    
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 z-40 flex items-center justify-center" onClick={onClose}>
            <div className={`p-6 rounded-2xl shadow-2xl w-96 ${theme.modalBg} ${theme.modalText} border ${theme.modalBorder} backdrop-blur-2xl`} onClick={e => e.stopPropagation()}>
                <h2 className="text-xl font-bold mb-4">Create Custom Theme</h2>
                <div className="space-y-3">
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Theme Name"
                        className={`w-full border-none rounded-md px-3 py-2 ${theme.inputBg} ${theme.inputText} ${theme.inputPlaceholder}`}
                    />
                    {Object.entries(colors).map(([key, value]) => (
                        <div key={key} className="flex items-center justify-between">
                            <label className="capitalize text-sm">{key.replace(/([A-Z])/g, ' $1')}</label>
                            <input
                                type="color"
                                value={value}
                                onChange={(e) => setColors(prev => ({ ...prev, [key]: e.target.value }))}
                                className="w-24 h-8 p-0 border-none rounded cursor-pointer bg-transparent"
                            />
                        </div>
                    ))}
                </div>
                <div className="mt-6 flex justify-end gap-3">
                    <button onClick={onClose} className={`px-4 py-1.5 text-sm rounded-full transition-colors ${theme.modalButtonBg} ${theme.modalButtonHoverBg}`}>Cancel</button>
                    <button onClick={handleSave} className={`px-4 py-1.5 text-sm rounded-full transition-colors ${theme.modalButtonBg} ${theme.modalButtonHoverBg}`}>Save</button>
                </div>
            </div>
        </div>
    );
};


// --- Settings Component ---
const Settings: React.FC<{
    theme: any;
    isSettingsOpen: boolean;
    setIsSettingsOpen: (isOpen: boolean) => void;
    activeThemeKey: ThemeKey | null;
    setThemeOverride: (theme: ThemeKey | null) => void;
    customThemes: CustomTheme[];
    openCustomEditor: () => void;
    searchMode: SearchEngine;
    handleSetSearchMode: (mode: SearchEngine) => void;
    showStats: boolean;
    onToggleStats: () => void;
    shortcuts: Shortcut[];
    onAddShortcut: (name: string, url: string) => void;
    onDeleteShortcut: (index: number) => void;
}> = ({
    theme, isSettingsOpen, setIsSettingsOpen, activeThemeKey,
    setThemeOverride, customThemes, openCustomEditor, searchMode,
    handleSetSearchMode, showStats, onToggleStats, shortcuts,
    onAddShortcut, onDeleteShortcut
}) => {
    const [newShortcutName, setNewShortcutName] = useState('');
    const [newShortcutUrl, setNewShortcutUrl] = useState('');

    const handleAddShortcutClick = () => {
        if (newShortcutName.trim() && newShortcutUrl.trim()) {
            onAddShortcut(newShortcutName, newShortcutUrl);
            setNewShortcutName('');
            setNewShortcutUrl('');
        }
    };

    const GearIcon = () => (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.438.995s.145.755.438.995l1.003.827c.48.398.668 1.03.26 1.431l-1.296 2.247a1.125 1.125 0 01-1.37.49l-1.217-.456c-.355-.133-.75-.072-1.075.124a6.57 6.57 0 01-.22.127c-.331.183-.581.495-.645.87l-.213 1.281c-.09.543-.56.94-1.11.94h-2.593c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.063-.374-.313.686-.645-.87a6.52 6.52 0 01-.22-.127c-.324-.196-.72-.257-1.075-.124l-1.217.456a1.125 1.125 0 01-1.37-.49l-1.296-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.437-.995s-.145-.755-.437-.995l-1.004-.827a1.125 1.125 0 01-.26-1.431l1.296-2.247a1.125 1.125 0 011.37.49l1.217.456c.355.133.75.072 1.075-.124.072-.044.146-.087.22-.127.332-.183.582-.495.645-.87l.213-1.281z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
    );
    const DeleteIcon = () => (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
    );

    const prebuiltThemeOptions: { key: PrebuiltThemeKey, label: string }[] = [
        { key: 'morning', label: 'Morning' }, { key: 'day', label: 'Day' }, { key: 'night', label: 'Night' },
        { key: 'stormy', label: 'Stormy Sea' }, { key: 'dawn', label: 'Calm Dawn' }, { key: 'sunset', label: 'Golden Sunset' },
        { key: 'midnight', label: 'Midnight Ink' }, { key: 'sakura', label: 'Sakura' }, { key: 'matcha', label: 'Matcha' },
        { key: 'koinobori', label: 'Koinobori' }, { key: 'sumie', label: 'Sumi-e' },
    ];
    
    return (
        <>
            <button
                onClick={() => setIsSettingsOpen(!isSettingsOpen)}
                className={`fixed bottom-6 right-6 z-30 p-3 rounded-full transition-all duration-300 ${theme.modalButtonBg} ${theme.modalButtonHoverBg} ${theme.inputText}`}
                aria-label="Open theme settings"
            >
                <GearIcon />
            </button>
            <div 
                className={`fixed inset-0 z-20 transition-opacity duration-300 ${isSettingsOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                onClick={() => setIsSettingsOpen(false)}
            >
                <div 
                    className={`absolute bottom-24 right-6 p-4 rounded-2xl shadow-2xl w-64 max-h-[70vh] overflow-y-auto transition-all duration-300 ease-out ${theme.modalBg} ${theme.modalText} border ${theme.modalBorder} backdrop-blur-2xl ${isSettingsOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`} 
                    onClick={(e) => e.stopPropagation()}
                >
                    <h3 className="font-bold text-sm tracking-wider uppercase mb-3">Theme</h3>
                    <div className="flex flex-col items-start gap-1">
                        <button onClick={() => { setThemeOverride(null); setIsSettingsOpen(false); }} className={`w-full text-left px-3 py-1.5 rounded-md text-sm transition-colors ${theme.modalButtonHoverBg} ${ activeThemeKey === null ? theme.modalButtonBg : 'bg-transparent' }`}>Automatic</button>
                        <button onClick={openCustomEditor} className={`w-full text-left px-3 py-1.5 rounded-md text-sm transition-colors ${theme.modalButtonHoverBg}`}>+ Create Theme</button>
                        {customThemes.map(opt => (
                            <button key={opt.name} onClick={() => { setThemeOverride(opt.name); setIsSettingsOpen(false); }} className={`w-full text-left px-3 py-1.5 rounded-md text-sm transition-colors ${theme.modalButtonHoverBg} ${ activeThemeKey === opt.name ? theme.modalButtonBg : 'bg-transparent' }`}>{opt.name}</button>
                        ))}
                        <div className={`w-full h-px my-2 ${theme.modalBorder}`}></div>
                        {prebuiltThemeOptions.map(opt => (
                            <button key={opt.label} onClick={() => { setThemeOverride(opt.key); setIsSettingsOpen(false); }} className={`w-full text-left px-3 py-1.5 rounded-md text-sm transition-colors ${theme.modalButtonHoverBg} ${ activeThemeKey === opt.key ? theme.modalButtonBg : 'bg-transparent' }`}>{opt.label}</button>
                        ))}
                    </div>

                    <div className={`w-full h-px my-2 ${theme.modalBorder}`}></div>
                    
                    <h3 className="font-bold text-sm tracking-wider uppercase mb-1">View</h3>
                    <div className="flex items-center justify-between px-3 py-1.5">
                        <label htmlFor="stats-toggle" className="text-sm cursor-pointer select-none">System Stats</label>
                        <button
                            id="stats-toggle"
                            onClick={onToggleStats}
                            role="switch"
                            aria-checked={showStats}
                            className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-offset-transparent ${theme.inputFocusRing} ${showStats ? 'bg-sky-500' : theme.modalButtonBg}`}
                        >
                            <span className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${showStats ? 'translate-x-6' : 'translate-x-1'}`} />
                        </button>
                    </div>

                    <div className={`w-full h-px my-2 ${theme.modalBorder}`}></div>

                    <h3 className="font-bold text-sm tracking-wider uppercase mb-2">Shortcuts</h3>
                    <div className="space-y-2 px-1">
                        {shortcuts.map((shortcut, index) => (
                            <div key={index} className="flex items-center justify-between text-sm group">
                                <span className="truncate pr-2">{shortcut.name}</span>
                                <button
                                    onClick={() => onDeleteShortcut(index)}
                                    className="opacity-50 group-hover:opacity-100 transition-opacity"
                                    aria-label={`Delete ${shortcut.name} shortcut`}
                                >
                                    <DeleteIcon />
                                </button>
                            </div>
                        ))}
                        {shortcuts.length > 0 && <div className={`w-full h-px my-2 ${theme.modalBorder}`}></div>}
                        <div className="pt-1 space-y-2">
                            <input
                                type="text"
                                placeholder="Name"
                                value={newShortcutName}
                                onChange={(e) => setNewShortcutName(e.target.value)}
                                className={`w-full border-none rounded-md px-2 py-1 text-sm ${theme.inputBg} ${theme.inputText} ${theme.inputPlaceholder}`}
                            />
                            <input
                                type="url"
                                placeholder="URL (e.g. google.com)"
                                value={newShortcutUrl}
                                onChange={(e) => setNewShortcutUrl(e.target.value)}
                                className={`w-full border-none rounded-md px-2 py-1 text-sm ${theme.inputBg} ${theme.inputText} ${theme.inputPlaceholder}`}
                            />
                            <button
                                onClick={handleAddShortcutClick}
                                className={`w-full text-center px-3 py-1.5 rounded-md text-sm transition-colors ${theme.modalButtonBg} ${theme.modalButtonHoverBg}`}
                            >
                                Add Shortcut
                            </button>
                        </div>
                    </div>

                    <h3 className="font-bold text-sm tracking-wider uppercase mt-4 mb-2">Search Engine</h3>
                    <div className="flex flex-col items-start gap-1">
                        {SEARCH_OPTIONS.map(opt => (
                            <button
                                key={opt.key}
                                onClick={() => { handleSetSearchMode(opt.key); setIsSettingsOpen(false); }}
                                className={`w-full text-left px-3 py-1.5 rounded-md text-sm transition-colors ${theme.modalButtonHoverBg} ${ searchMode === opt.key ? theme.modalButtonBg : 'bg-transparent' }`}
                            >
                                {opt.name}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </>
    );
};


// --- Search Engine Data ---
const SEARCH_URLS: Record<SearchEngine, string> = {
  google: 'https://www.google.com/search?q=',
  bing: 'https://www.bing.com/search?q=',
  duckduckgo: 'https://duckduckgo.com/?q=',
  startpage: 'https://www.startpage.com/do/search?query=',
};

const SEARCH_OPTIONS: { key: SearchEngine; name: string; }[] = [
    { key: 'google', name: 'Google' },
    { key: 'bing', name: 'Bing' },
    { key: 'duckduckgo', name: 'DuckDuckGo' },
    { key: 'startpage', name: 'Startpage' },
];

const Toast: React.FC<{ message: string; show: boolean }> = ({ message, show }) => (
    <div className={`fixed bottom-10 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full text-white bg-black/50 backdrop-blur-sm shadow-lg transition-all duration-300 ease-in-out z-50 ${show ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}>
        {message}
    </div>
);

// --- Shortcuts Display Component ---
const ShortcutsDisplay: React.FC<{ shortcuts: Shortcut[], theme: any }> = ({ shortcuts, theme }) => {
    if (shortcuts.length === 0) return <div className="h-4"></div>; // Reserve space to prevent layout shift

    return (
        <div className="flex justify-center items-center gap-2 mb-4 flex-wrap px-4 h-min">
            {shortcuts.map((shortcut, index) => (
                <a
                    key={index}
                    href={shortcut.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`px-3 py-1.5 rounded-full text-sm transition-colors duration-200 animate-fade-in-up ${theme.modalButtonBg} ${theme.modalButtonHoverBg} ${theme.inputText}`}
                    style={{ animationDelay: `${index * 50}ms`}}
                >
                    {shortcut.name}
                </a>
            ))}
        </div>
    );
};

// --- Main App Component ---
const App: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [searchQuery, setSearchQuery] = useState('');
  
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [themeOverride, setThemeOverride] = useState<ThemeKey | null>(null);
  const [customThemes, setCustomThemes] = useState<CustomTheme[]>([]);
  const [isCustomThemeEditorOpen, setIsCustomThemeEditorOpen] = useState(false);
  const [shortcuts, setShortcuts] = useState<Shortcut[]>([]);

  const [searchMode, setSearchMode] = useState<SearchEngine>(
    () => (localStorage.getItem('defaultSearchEngine') as SearchEngine) || 'google'
  );
  
  const [showStats, setShowStats] = useState(
    () => localStorage.getItem('showStats') !== 'false'
  );
  
  const { weather, error: weatherError } = useWeather();
  const [showWeatherToast, setShowWeatherToast] = useState(false);
  const weatherToastTimer = useRef<any>(null);


  useEffect(() => {
    const timer = setInterval(() => setCurrentDate(new Date()), 1000);
    const savedTheme = localStorage.getItem('themeOverride');
    if (savedTheme) setThemeOverride(savedTheme);
    
    const savedCustomThemes = localStorage.getItem('customThemes');
    if (savedCustomThemes) setCustomThemes(JSON.parse(savedCustomThemes));

    const savedShortcuts = localStorage.getItem('shortcuts');
    if (savedShortcuts) setShortcuts(JSON.parse(savedShortcuts));

    const style = document.createElement('style');
    style.innerHTML = `
        @keyframes gradient-animation {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
        }
        .animated-gradient {
            background-size: 400% 400%;
            animation: gradient-animation 30s ease infinite;
        }
        @keyframes fade-in-up {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up {
            animation: fade-in-up 0.5s ease-out forwards;
            opacity: 0;
        }
    `;
    document.head.appendChild(style);

    return () => {
      clearInterval(timer);
      document.head.removeChild(style);
    };
  }, []);

  useEffect(() => {
    if (weatherError) {
        setShowWeatherToast(true);
        weatherToastTimer.current = setTimeout(() => setShowWeatherToast(false), 4000);
    }
    return () => clearTimeout(weatherToastTimer.current);
  }, [weatherError]);

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            const baseUrl = SEARCH_URLS[searchMode];
            window.location.href = `${baseUrl}${encodeURIComponent(searchQuery)}`;
        }
    };

  const formatHours = (date: Date): string => date.getHours().toString().padStart(2, '0');
  const formatMinutes = (date: Date): string => date.getMinutes().toString().padStart(2, '0');
  const formatDay = (date: Date): string => date.toLocaleDateString('en-US', { weekday: 'long' });
  const formatDate = (date: Date): string => date.toLocaleDateString('en-US', { day: '2-digit', month: 'long', year: 'numeric' }).toUpperCase();

  const handleThemeOverride = (theme: ThemeKey | null) => {
    setThemeOverride(theme);
    if (theme) localStorage.setItem('themeOverride', theme);
    else localStorage.removeItem('themeOverride');
  };
  
  const handleToggleStats = () => {
      setShowStats(prev => {
          const newState = !prev;
          localStorage.setItem('showStats', String(newState));
          return newState;
      });
  };

  const handleSetSearchMode = (mode: SearchEngine) => {
    setSearchMode(mode);
    localStorage.setItem('defaultSearchEngine', mode);
  };

  const handleSaveCustomTheme = (theme: CustomTheme) => {
    const updatedThemes = [...customThemes.filter(t => t.name !== theme.name), theme];
    setCustomThemes(updatedThemes);
    localStorage.setItem('customThemes', JSON.stringify(updatedThemes));
    handleThemeOverride(theme.name);
  };

  const handleAddShortcut = (name: string, url: string) => {
    let fullUrl = url.trim();
    if (!/^https?:\/\//i.test(fullUrl)) {
        fullUrl = 'https://' + fullUrl;
    }
    const newShortcut: Shortcut = { name: name.trim(), url: fullUrl };
    const updatedShortcuts = [...shortcuts, newShortcut];
    setShortcuts(updatedShortcuts);
    localStorage.setItem('shortcuts', JSON.stringify(updatedShortcuts));
  };

  const handleDeleteShortcut = (indexToDelete: number) => {
      const updatedShortcuts = shortcuts.filter((_, index) => index !== indexToDelete);
      setShortcuts(updatedShortcuts);
      localStorage.setItem('shortcuts', JSON.stringify(updatedShortcuts));
  };

  const timeOfDay = getTimeOfDay(currentDate);
  const activeThemeKey: ThemeKey = themeOverride || timeOfDay;
  
  const backgroundStyles: Record<PrebuiltThemeKey, string> = {
      morning: 'from-[#f3d6a2] to-[#a7c3d1]', day: 'from-[#dcd6c6] to-[#6b94a3]',
      night: 'from-[#0c246b] to-[#05102c]',
      stormy: 'from-[#2c3e50] to-[#34495e]', dawn: 'from-[#ffdde1] to-[#ee9ca7]',
      sunset: 'from-[#ff9966] to-[#ff5e62]', midnight: 'from-[#0f0c29] to-[#24243e]',
      sakura: 'from-[#FFB7C5] to-[#FFE4E1]', matcha: 'from-[#C7E5C2] to-[#A2D4AB]',
      koinobori: 'from-[#1a2a6c] to-[#b21f1f]', sumie: 'from-[#606c88] to-[#3f4c6b]',
  };
  
  let theme;
  const customTheme = customThemes.find(t => t.name === activeThemeKey);

  if (customTheme) {
    const isDark = isColorDark(customTheme.colors.bgStart) || isColorDark(customTheme.colors.bgEnd);
    theme = {
      bg: `from-[${customTheme.colors.bgStart}] to-[${customTheme.colors.bgEnd}]`,
      clockOverlay: isDark ? 'text-white/10' : 'text-black/10',
      clockAccent: `text-[${customTheme.colors.clockAccent}]`,
      dateText: `text-[${customTheme.colors.dateText}]`,
      statsText: `text-[${customTheme.colors.statsText}]`,
      statsStroke: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)',
      statsBarFill: isDark ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)',
      inputBg: isDark ? 'bg-white/10' : 'bg-black/5',
      inputText: isDark ? 'text-white/80' : 'text-black/90',
      inputPlaceholder: isDark ? 'placeholder:text-white/50' : 'placeholder:text-black/60',
      inputFocusRing: isDark ? 'focus:ring-white/30' : 'focus:ring-black/20',
      modalBg: isDark ? 'bg-black/50' : 'bg-white/70',
      modalText: isDark ? 'text-white/90' : 'text-black/90',
      modalBorder: isDark ? 'border-white/20' : 'border-black/20',
      modalButtonBg: isDark ? 'bg-white/10' : 'bg-black/10',
      modalButtonHoverBg: isDark ? 'hover:bg-white/20' : 'hover:bg-black/20',
    };
  } else {
    const key = activeThemeKey as PrebuiltThemeKey;
    const isDark = ['night', 'stormy', 'midnight', 'koinobori', 'sumie'].includes(key);
    theme = {
      bg: backgroundStyles[key],
      clockOverlay: isDark ? 'text-white/10' : 'text-black/10',
      clockAccent: isDark ? 'text-[#f0f8ff]' : 'text-stone-700',
      dateText: isDark ? 'text-white/60' : 'text-black/70',
      statsText: isDark ? 'text-white/70' : 'text-black/80',
      statsStroke: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)',
      statsBarFill: isDark ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)',
      inputBg: isDark ? 'bg-white/10' : 'bg-black/5',
      inputText: isDark ? 'text-white/80' : 'text-black/90',
      inputPlaceholder: isDark ? 'placeholder:text-white/50' : 'placeholder:text-black/60',
      inputFocusRing: isDark ? 'focus:ring-white/30' : 'focus:ring-black/20',
      modalBg: isDark ? 'bg-black/50' : 'bg-white/70',
      modalText: isDark ? 'text-white/90' : 'text-black/90',
      modalBorder: isDark ? 'border-white/20' : 'border-black/20',
      modalButtonBg: isDark ? 'bg-white/10' : 'bg-black/10',
      modalButtonHoverBg: isDark ? 'hover:bg-white/20' : 'hover:bg-black/20',
    };
  }

  const placeholderText = `Search ${SEARCH_OPTIONS.find(o => o.key === searchMode)?.name}...`;

  return (
    <div className={`relative w-screen h-screen bg-gradient-to-b ${theme.bg} overflow-hidden transition-colors duration-1000 ease-in-out animated-gradient`}>
      <WeatherWidget weatherData={weather} theme={theme} />
      
      <main className="w-full h-full flex flex-col items-center justify-center pt-10">
        <div className="relative flex items-center justify-center select-none gap-x-4">
            <span className={`font-['Oswald'] text-[18rem] ${theme.clockOverlay} transition-transform duration-300 ease-out hover:scale-105`}>
                {formatHours(currentDate)}
            </span>
            <span className={`font-['Oswald'] text-[18rem] ${theme.clockOverlay} transition-transform duration-300 ease-out hover:scale-105`}>
                {formatMinutes(currentDate)}
            </span>
            <h1 className={`absolute font-['Dancing_Script'] text-8xl ${theme.clockAccent} top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 transition-colors duration-1000 tracking-wider`}>
                {formatDay(currentDate)}
            </h1>
        </div>
        <p className={`font-['Lato'] text-xl ${theme.dateText} tracking-[0.2em] -mt-8 transition-colors duration-1000`}>
          {formatDate(currentDate)}
        </p>
        {showStats ? (
          <SystemInfo textColor={theme.statsText} strokeColor={theme.statsStroke} barColor={theme.statsBarFill} />
        ) : (
          <div className="w-72 h-[132px] mt-8" />
        )}
      </main>

      <div className={`fixed left-1/2 -translate-x-1/2 w-full max-w-lg z-10 transition-all duration-500 ease-in-out ${showStats ? 'bottom-6' : 'bottom-48'}`}>
        <ShortcutsDisplay shortcuts={shortcuts} theme={theme} />
        <form onSubmit={handleSearchSubmit} className="px-4">
            <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} 
            placeholder={placeholderText}
            className={`w-full border-none rounded-full px-5 py-3 text-center focus:outline-none transition-all duration-300 ${theme.inputBg} ${theme.inputText} ${theme.inputPlaceholder} ${theme.inputFocusRing}`}
            />
        </form>
      </div>
      
      <Toast message={weatherError || ''} show={showWeatherToast} />
      
      <Settings 
        theme={theme} 
        isSettingsOpen={isSettingsOpen} 
        setIsSettingsOpen={setIsSettingsOpen} 
        activeThemeKey={themeOverride} 
        setThemeOverride={handleThemeOverride} 
        customThemes={customThemes} 
        openCustomEditor={() => setIsCustomThemeEditorOpen(true)} 
        searchMode={searchMode} 
        handleSetSearchMode={handleSetSearchMode}
        showStats={showStats}
        onToggleStats={handleToggleStats}
        shortcuts={shortcuts}
        onAddShortcut={handleAddShortcut}
        onDeleteShortcut={handleDeleteShortcut}
      />
      
      <CustomThemeEditor isOpen={isCustomThemeEditorOpen} onClose={() => setIsCustomThemeEditorOpen(false)} onSave={handleSaveCustomTheme} theme={theme} />
    </div>
  );
};

export default App;
