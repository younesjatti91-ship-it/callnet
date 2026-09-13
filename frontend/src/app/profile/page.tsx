'use client';

import React, { useEffect, useState } from 'react';
import {
  User,
  Mail,
  Phone,
  Lock,
  Camera,
  Shield,
  Crown,
  Headphones,
  Store as StoreIcon,
  Truck,
  CheckCircle2,
  AlertCircle,
  Save,
  KeyRound,
  Building,
  Sparkles,
  RefreshCw,
  Eye,
  EyeOff,
} from 'lucide-react';
import { Sidebar } from '../../components/Sidebar';
import { Header } from '../../components/Header';
import { api } from '../../lib/api';

function createSvgAvatar(gradientStops: string, innerSvg: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160" width="160" height="160">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      ${gradientStops}
    </linearGradient>
    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="3" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over" />
    </filter>
  </defs>
  <rect width="160" height="160" rx="36" fill="url(#bgGrad)"/>
  <rect x="2" y="2" width="156" height="156" rx="34" fill="none" stroke="rgba(255,255,255,0.15)" stroke-width="2"/>
  ${innerSvg}
</svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

// Pure SVG Vector Role-Relevant Avatars
const AVATAR_SVGS = {
  // SuperAdmin Avatars
  superadmin_crown: createSvgAvatar(
    '<stop offset="0%" stop-color="#311000"/><stop offset="50%" stop-color="#1a0b2e"/><stop offset="100%" stop-color="#020617"/>',
    `<g filter="url(#glow)">
      <path d="M38,112 L122,112 L116,62 L94,84 L80,44 L66,84 L44,62 Z" fill="#b45309" stroke="#fef08a" stroke-width="3" stroke-linejoin="round"/>
      <rect x="40" y="102" width="80" height="12" rx="4" fill="#ca8a04" stroke="#fde047" stroke-width="1.5"/>
      <circle cx="80" cy="40" r="6" fill="#fde047"/>
      <circle cx="42" cy="58" r="5" fill="#fde047"/>
      <circle cx="118" cy="58" r="5" fill="#fde047"/>
      <circle cx="66" cy="82" r="4" fill="#ef4444"/>
      <circle cx="94" cy="82" r="4" fill="#3b82f6"/>
      <circle cx="80" cy="108" r="3.5" fill="#10b981"/>
    </g>`
  ),
  superadmin_key: createSvgAvatar(
    '<stop offset="0%" stop-color="#3b1d06"/><stop offset="60%" stop-color="#18181b"/><stop offset="100%" stop-color="#09090b"/>',
    `<g filter="url(#glow)">
      <circle cx="64" cy="64" r="22" fill="none" stroke="#facc15" stroke-width="7"/>
      <circle cx="64" cy="64" r="9" fill="#fde047"/>
      <path d="M80,80 L122,122 M104,104 L116,92 M114,114 L126,102" stroke="#facc15" stroke-width="7" stroke-linecap="round"/>
      <polygon points="64,46 67,58 79,61 70,69 73,81 64,74 55,81 58,69 49,61 61,58" fill="#ca8a04"/>
    </g>`
  ),
  superadmin_sigil: createSvgAvatar(
    '<stop offset="0%" stop-color="#451a03"/><stop offset="50%" stop-color="#171717"/><stop offset="100%" stop-color="#020617"/>',
    `<g filter="url(#glow)">
      <path d="M80,28 L122,52 L122,94 C122,118 80,136 80,136 C80,136 38,118 38,94 L38,52 Z" fill="#78350f" stroke="#fbbf24" stroke-width="3"/>
      <path d="M80,40 L108,56 L108,88 C108,106 80,120 80,120 C80,120 52,106 52,88 L52,56 Z" fill="#b45309" stroke="#fde047" stroke-width="1.5"/>
      <polygon points="80,56 84,70 98,70 87,79 91,93 80,84 69,93 73,79 62,70 76,70" fill="#fde047"/>
    </g>`
  ),

  // Admin Avatars
  admin_shield: createSvgAvatar(
    '<stop offset="0%" stop-color="#1e1b4b"/><stop offset="60%" stop-color="#0f172a"/><stop offset="100%" stop-color="#020617"/>',
    `<g filter="url(#glow)">
      <path d="M80,26 L124,48 L124,92 C124,120 80,138 80,138 C80,138 36,120 36,92 L36,48 Z" fill="#312e81" stroke="#818cf8" stroke-width="3.5"/>
      <rect x="66" y="74" width="28" height="22" rx="5" fill="#c7d2fe"/>
      <path d="M72,74 L72,62 C72,56 76,52 80,52 C84,52 88,56 88,62 L88,74" fill="none" stroke="#c7d2fe" stroke-width="3.5" stroke-linecap="round"/>
      <circle cx="80" cy="83" r="2.5" fill="#1e1b4b"/>
      <line x1="80" y1="85" x2="80" y2="90" stroke="#1e1b4b" stroke-width="2.5"/>
    </g>`
  ),
  admin_command: createSvgAvatar(
    '<stop offset="0%" stop-color="#172554"/><stop offset="50%" stop-color="#0f172a"/><stop offset="100%" stop-color="#020617"/>',
    `<g filter="url(#glow)">
      <polygon points="80,30 124,55 124,105 80,130 36,105 36,55" fill="#1e293b" stroke="#60a5fa" stroke-width="3"/>
      <circle cx="80" cy="80" r="20" fill="none" stroke="#38bdf8" stroke-width="2.5" stroke-dasharray="6,4"/>
      <circle cx="80" cy="80" r="7" fill="#60a5fa"/>
      <line x1="80" y1="36" x2="80" y2="58" stroke="#93c5fd" stroke-width="2"/>
      <line x1="80" y1="102" x2="80" y2="124" stroke="#93c5fd" stroke-width="2"/>
      <line x1="42" y1="58" x2="62" y2="70" stroke="#93c5fd" stroke-width="2"/>
      <line x1="118" y1="58" x2="98" y2="70" stroke="#93c5fd" stroke-width="2"/>
    </g>`
  ),
  admin_sentinel: createSvgAvatar(
    '<stop offset="0%" stop-color="#2e1065"/><stop offset="60%" stop-color="#090d16"/><stop offset="100%" stop-color="#020617"/>',
    `<g filter="url(#glow)">
      <path d="M38,52 L80,32 L122,52 L112,88 L80,130 L48,88 Z" fill="#1e1b4b" stroke="#a78bfa" stroke-width="3.5"/>
      <polyline points="54,68 80,50 106,68" fill="none" stroke="#c4b5fd" stroke-width="3.5" stroke-linecap="round"/>
      <polyline points="60,86 80,72 100,86" fill="none" stroke="#c4b5fd" stroke-width="3" stroke-linecap="round"/>
      <circle cx="80" cy="100" r="4.5" fill="#a78bfa"/>
    </g>`
  ),

  // Seller Avatars
  seller_store: createSvgAvatar(
    '<stop offset="0%" stop-color="#064e3b"/><stop offset="60%" stop-color="#022c22"/><stop offset="100%" stop-color="#020617"/>',
    `<g filter="url(#glow)">
      <path d="M36,65 L124,65 L118,44 L42,44 Z" fill="#047857" stroke="#34d399" stroke-width="2.5"/>
      <path d="M38,65 C38,72 44,76 50,76 C56,76 60,72 60,65 C60,72 66,76 72,76 C78,76 82,72 82,65 C82,72 88,76 94,76 C100,76 104,72 104,65 C104,72 110,76 116,76 C122,76 126,72 126,65" fill="#10b981" stroke="#34d399" stroke-width="2"/>
      <rect x="44" y="76" width="72" height="46" fill="#065f46" stroke="#34d399" stroke-width="2"/>
      <rect x="52" y="86" width="22" height="24" rx="3" fill="#6ee7b7" opacity="0.85"/>
      <rect x="84" y="86" width="22" height="36" rx="3" fill="#022c22" stroke="#34d399" stroke-width="1.5"/>
      <circle cx="88" cy="104" r="2.5" fill="#34d399"/>
    </g>`
  ),
  seller_cart: createSvgAvatar(
    '<stop offset="0%" stop-color="#047857"/><stop offset="50%" stop-color="#064e3b"/><stop offset="100%" stop-color="#020617"/>',
    `<g filter="url(#glow)">
      <circle cx="56" cy="118" r="7" fill="#34d399"/>
      <circle cx="106" cy="118" r="7" fill="#34d399"/>
      <path d="M34,44 L48,44 L60,98 L114,98 L124,56 L54,56" fill="none" stroke="#10b981" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round"/>
      <polyline points="72,80 90,62 104,70 124,44" fill="none" stroke="#facc15" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
      <polyline points="114,44 124,44 124,54" fill="none" stroke="#facc15" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
    </g>`
  ),
  seller_growth: createSvgAvatar(
    '<stop offset="0%" stop-color="#14532d"/><stop offset="60%" stop-color="#052e16"/><stop offset="100%" stop-color="#020617"/>',
    `<g filter="url(#glow)">
      <polygon points="80,32 124,64 80,128 36,64" fill="#065f46" stroke="#34d399" stroke-width="3"/>
      <polyline points="36,64 80,78 124,64" fill="none" stroke="#6ee7b7" stroke-width="2.5"/>
      <line x1="80" y1="32" x2="80" y2="128" stroke="#6ee7b7" stroke-width="2.5"/>
      <line x1="56" y1="46" x2="80" y2="78" stroke="#a7f3d0" stroke-width="1.5"/>
      <line x1="104" y1="46" x2="80" y2="78" stroke="#a7f3d0" stroke-width="1.5"/>
    </g>`
  ),

  // Agent Avatars
  agent_headset: createSvgAvatar(
    '<stop offset="0%" stop-color="#0c4a6e"/><stop offset="60%" stop-color="#082f49"/><stop offset="100%" stop-color="#020617"/>',
    `<g filter="url(#glow)">
      <path d="M40,84 A40,40 0 0,1 120,84" fill="none" stroke="#38bdf8" stroke-width="5" stroke-linecap="round"/>
      <rect x="34" y="76" width="16" height="30" rx="7" fill="#0284c7" stroke="#7dd3fc" stroke-width="2"/>
      <rect x="110" y="76" width="16" height="30" rx="7" fill="#0284c7" stroke="#7dd3fc" stroke-width="2"/>
      <path d="M118,98 C118,114 102,122 88,122 L78,122" fill="none" stroke="#38bdf8" stroke-width="3.5" stroke-linecap="round"/>
      <circle cx="74" cy="122" r="5" fill="#38bdf8"/>
      <path d="M24,80 A54,54 0 0,1 24,104" fill="none" stroke="#7dd3fc" stroke-width="2.5" stroke-linecap="round"/>
      <path d="M136,80 A54,54 0 0,0 136,104" fill="none" stroke="#7dd3fc" stroke-width="2.5" stroke-linecap="round"/>
    </g>`
  ),
  agent_microphone: createSvgAvatar(
    '<stop offset="0%" stop-color="#0369a1"/><stop offset="50%" stop-color="#082f49"/><stop offset="100%" stop-color="#020617"/>',
    `<g filter="url(#glow)">
      <rect x="66" y="40" width="28" height="50" rx="14" fill="#0284c7" stroke="#38bdf8" stroke-width="3"/>
      <line x1="72" y1="54" x2="88" y2="54" stroke="#7dd3fc" stroke-width="2"/>
      <line x1="72" y1="64" x2="88" y2="64" stroke="#7dd3fc" stroke-width="2"/>
      <line x1="72" y1="74" x2="88" y2="74" stroke="#7dd3fc" stroke-width="2"/>
      <path d="M52,70 C52,92 64,106 80,106 C96,106 108,92 108,70" fill="none" stroke="#38bdf8" stroke-width="3.5" stroke-linecap="round"/>
      <line x1="80" y1="106" x2="80" y2="126" stroke="#38bdf8" stroke-width="4"/>
      <line x1="58" y1="126" x2="102" y2="126" stroke="#38bdf8" stroke-width="4" stroke-linecap="round"/>
    </g>`
  ),
  agent_voice_wave: createSvgAvatar(
    '<stop offset="0%" stop-color="#1e3a8a"/><stop offset="60%" stop-color="#0369a1"/><stop offset="100%" stop-color="#020617"/>',
    `<g filter="url(#glow)">
      <path d="M40,42 C40,42 120,42 120,42 C128,42 134,48 134,56 L134,96 C134,104 128,110 120,110 L68,110 L44,128 L46,110 C40,110 36,104 36,96 L36,56 C36,48 40,42 40,42 Z" fill="#0284c7" stroke="#38bdf8" stroke-width="3"/>
      <line x1="58" y1="76" x2="58" y2="76" stroke="#bae6fd" stroke-width="7" stroke-linecap="round"/>
      <line x1="72" y1="66" x2="72" y2="86" stroke="#bae6fd" stroke-width="6" stroke-linecap="round"/>
      <line x1="86" y1="58" x2="86" y2="94" stroke="#f0f9ff" stroke-width="6" stroke-linecap="round"/>
      <line x1="100" y1="68" x2="100" y2="84" stroke="#bae6fd" stroke-width="6" stroke-linecap="round"/>
      <line x1="112" y1="76" x2="112" y2="76" stroke="#bae6fd" stroke-width="7" stroke-linecap="round"/>
    </g>`
  ),

  // Courier Avatars
  courier_truck: createSvgAvatar(
    '<stop offset="0%" stop-color="#7c2d12"/><stop offset="50%" stop-color="#431407"/><stop offset="100%" stop-color="#020617"/>',
    `<g filter="url(#glow)">
      <path d="M36,94 L36,54 L86,54 L106,70 L126,70 L126,94 Z" fill="#ea580c" stroke="#fb923c" stroke-width="3"/>
      <polygon points="88,58 104,70 88,70" fill="#fed7aa"/>
      <circle cx="56" cy="100" r="9" fill="#1c1917" stroke="#fb923c" stroke-width="3.5"/>
      <circle cx="110" cy="100" r="9" fill="#1c1917" stroke="#fb923c" stroke-width="3.5"/>
      <line x1="20" y1="62" x2="30" y2="62" stroke="#fdba74" stroke-width="3" stroke-linecap="round"/>
      <line x1="14" y1="74" x2="28" y2="74" stroke="#fdba74" stroke-width="3" stroke-linecap="round"/>
      <line x1="18" y1="84" x2="26" y2="84" stroke="#fdba74" stroke-width="3" stroke-linecap="round"/>
    </g>`
  ),
  courier_parcel: createSvgAvatar(
    '<stop offset="0%" stop-color="#9a3412"/><stop offset="60%" stop-color="#291206"/><stop offset="100%" stop-color="#020617"/>',
    `<g filter="url(#glow)">
      <rect x="56" y="56" width="48" height="48" rx="5" fill="#c2410c" stroke="#fb923c" stroke-width="3"/>
      <line x1="80" y1="56" x2="80" y2="104" stroke="#fed7aa" stroke-width="3.5"/>
      <line x1="56" y1="80" x2="104" y2="80" stroke="#fed7aa" stroke-width="3.5"/>
      <path d="M54,68 C34,58 28,74 20,74 C30,82 42,78 54,84" fill="none" stroke="#fdba74" stroke-width="3" stroke-linecap="round"/>
      <path d="M106,68 C126,58 132,74 140,74 C130,82 118,78 106,84" fill="none" stroke="#fdba74" stroke-width="3" stroke-linecap="round"/>
    </g>`
  ),
  courier_beacon: createSvgAvatar(
    '<stop offset="0%" stop-color="#831843"/><stop offset="50%" stop-color="#431407"/><stop offset="100%" stop-color="#020617"/>',
    `<g filter="url(#glow)">
      <path d="M80,28 C58,28 44,42 44,62 C44,88 80,130 80,130 C80,130 116,88 116,62 C116,42 102,28 80,28 Z" fill="#b91c1c" stroke="#fca5a5" stroke-width="3"/>
      <rect x="66" y="50" width="28" height="24" rx="3" fill="#fed7aa"/>
      <line x1="80" y1="50" x2="80" y2="74" stroke="#c2410c" stroke-width="2"/>
      <line x1="66" y1="62" x2="94" y2="62" stroke="#c2410c" stroke-width="2"/>
    </g>`
  ),

  // Manager & Moderator Avatars
  manager_gear: createSvgAvatar(
    '<stop offset="0%" stop-color="#3b0764"/><stop offset="60%" stop-color="#1e1b4b"/><stop offset="100%" stop-color="#020617"/>',
    `<g filter="url(#glow)">
      <circle cx="80" cy="80" r="26" fill="#581c87" stroke="#c084fc" stroke-width="4"/>
      <circle cx="80" cy="80" r="10" fill="#e9d5ff"/>
      <path d="M80,44 L80,54 M80,106 L80,116 M44,80 L54,80 M106,80 L116,80 M54,54 L62,62 M98,98 L106,106 M106,54 L98,62 M62,98 L54,106" stroke="#c084fc" stroke-width="5" stroke-linecap="round"/>
    </g>`
  ),
  moderator_scales: createSvgAvatar(
    '<stop offset="0%" stop-color="#1e293b"/><stop offset="60%" stop-color="#0f172a"/><stop offset="100%" stop-color="#020617"/>',
    `<g filter="url(#glow)">
      <line x1="80" y1="36" x2="80" y2="120" stroke="#94a3b8" stroke-width="4"/>
      <line x1="60" y1="120" x2="100" y2="120" stroke="#94a3b8" stroke-width="4" stroke-linecap="round"/>
      <line x1="46" y1="52" x2="114" y2="52" stroke="#cbd5e1" stroke-width="3"/>
      <path d="M46,52 L36,80 L56,80 Z" fill="#475569" stroke="#94a3b8" stroke-width="2"/>
      <path d="M114,52 L104,80 L124,80 Z" fill="#475569" stroke="#94a3b8" stroke-width="2"/>
      <circle cx="80" cy="42" r="6" fill="#64748b"/>
    </g>`
  ),
};

// Curated default role avatars (Vector SVGs)
const ROLE_DEFAULT_AVATARS: Record<string, { label: string; icon: any; color: string; avatarUrl: string }> = {
  SuperAdmin: {
    label: 'Apex Imperial Crown',
    icon: Crown,
    color: 'from-amber-500 to-yellow-600',
    avatarUrl: AVATAR_SVGS.superadmin_crown,
  },
  Admin: {
    label: 'Cyber Sentinel Shield',
    icon: Shield,
    color: 'from-indigo-500 to-purple-600',
    avatarUrl: AVATAR_SVGS.admin_shield,
  },
  Seller: {
    label: 'E-Commerce Emporium',
    icon: StoreIcon,
    color: 'from-emerald-500 to-teal-600',
    avatarUrl: AVATAR_SVGS.seller_store,
  },
  Agent: {
    label: 'Pro Telephony Headset',
    icon: Headphones,
    color: 'from-cyan-500 to-blue-600',
    avatarUrl: AVATAR_SVGS.agent_headset,
  },
  Courier: {
    label: 'Express Velocity Van',
    icon: Truck,
    color: 'from-orange-500 to-amber-600',
    avatarUrl: AVATAR_SVGS.courier_truck,
  },
  Manager: {
    label: 'Operations Matrix',
    icon: Shield,
    color: 'from-purple-500 to-indigo-600',
    avatarUrl: AVATAR_SVGS.manager_gear,
  },
  Moderator: {
    label: 'Compliance Balance',
    icon: Shield,
    color: 'from-slate-500 to-indigo-600',
    avatarUrl: AVATAR_SVGS.moderator_scales,
  },
};

// Role-Specific Presets: Only avatars relevant to the user's role are presented
const PRESET_AVATARS = [
  // SuperAdmin
  { id: 'sa_crown', role: 'SuperAdmin', name: 'Imperial Crown', url: AVATAR_SVGS.superadmin_crown },
  { id: 'sa_key', role: 'SuperAdmin', name: 'Sovereign Master Key', url: AVATAR_SVGS.superadmin_key },
  { id: 'sa_sigil', role: 'SuperAdmin', name: 'Apex Sovereign Crest', url: AVATAR_SVGS.superadmin_sigil },

  // Admin
  { id: 'adm_shield', role: 'Admin', name: 'Sentinel Shield', url: AVATAR_SVGS.admin_shield },
  { id: 'adm_command', role: 'Admin', name: 'Command Console', url: AVATAR_SVGS.admin_command },
  { id: 'adm_sentinel', role: 'Admin', name: 'Cyber Sentinel', url: AVATAR_SVGS.admin_sentinel },

  // Seller
  { id: 'sel_store', role: 'Seller', name: 'Enterprise Store', url: AVATAR_SVGS.seller_store },
  { id: 'sel_cart', role: 'Seller', name: 'Growth Cart Surge', url: AVATAR_SVGS.seller_cart },
  { id: 'sel_growth', role: 'Seller', name: 'Merchant Diamond', url: AVATAR_SVGS.seller_growth },

  // Agent
  { id: 'agt_headset', role: 'Agent', name: 'Operator Headset', url: AVATAR_SVGS.agent_headset },
  { id: 'agt_mic', role: 'Agent', name: 'Broadcast Voice Mic', url: AVATAR_SVGS.agent_microphone },
  { id: 'agt_wave', role: 'Agent', name: 'Voice Soundwave Pulse', url: AVATAR_SVGS.agent_voice_wave },

  // Courier
  { id: 'cur_truck', role: 'Courier', name: 'Dispatch Express Van', url: AVATAR_SVGS.courier_truck },
  { id: 'cur_parcel', role: 'Courier', name: 'Speed Winged Parcel', url: AVATAR_SVGS.courier_parcel },
  { id: 'cur_beacon', role: 'Courier', name: 'Navigation Beacon', url: AVATAR_SVGS.courier_beacon },

  // Manager & Moderator
  { id: 'mgr_gear', role: 'Manager', name: 'Operations Precision Gear', url: AVATAR_SVGS.manager_gear },
  { id: 'mod_scales', role: 'Moderator', name: 'Compliance Scales', url: AVATAR_SVGS.moderator_scales },
];

export default function ProfilePage() {
  const [store, setStore] = useState({ id: 'default', name: 'Store', currency: 'MAD' });
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [stores, setStores] = useState<any[]>([]);

  // Profile Form States
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [customUrlInput, setCustomUrlInput] = useState('');

  // Password Form States
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Status & Feedback
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState('');
  const [profileError, setProfileError] = useState('');

  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordError, setPasswordError] = useState('');

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const me = await api.getMe();
        if (me?.user) {
          setUser(me.user);
          setName(me.user.name || '');
          setEmail(me.user.email || '');
          setPhone(me.user.phoneNumber || me.user.phone || '');
          const initialAvatar = me.user.avatarUrl || ROLE_DEFAULT_AVATARS[me.user.role]?.avatarUrl || '';
          setAvatarUrl(initialAvatar);
          setCustomUrlInput(initialAvatar);
        }
        if (me?.stores && me.stores.length > 0) {
          setStores(me.stores);
          const current = api.getCurrentStore();
          if (current) {
            setStore(current);
          } else {
            setStore(me.stores[0]);
            api.setCurrentStore(me.stores[0]);
          }
        }
      } catch (err: any) {
        setProfileError(err.message || 'Failed to load profile data');
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert('Avatar file size must be less than 2MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setAvatarUrl(result);
      setCustomUrlInput(result);
    };
    reader.readAsDataURL(file);
  };

  const handleSelectPreset = (url: string) => {
    setAvatarUrl(url);
    setCustomUrlInput(url);
  };

  const handleApplyRoleDefault = () => {
    const roleKey = user?.role || 'Seller';
    const def = ROLE_DEFAULT_AVATARS[roleKey]?.avatarUrl || ROLE_DEFAULT_AVATARS.Seller.avatarUrl;
    setAvatarUrl(def);
    setCustomUrlInput(def);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    setProfileSuccess('');
    setProfileError('');

    try {
      const res = await api.updateProfile({
        name,
        email,
        phone,
        avatarUrl,
      });

      if (res?.user) {
        setUser(res.user);
        setProfileSuccess('Profile information updated successfully!');
        setTimeout(() => setProfileSuccess(''), 4000);
      }
    } catch (err: any) {
      setProfileError(err.message || 'Failed to update profile');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleSavePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordSuccess('');
    setPasswordError('');

    if (!currentPassword) {
      setPasswordError('Please enter your current password.');
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match.');
      return;
    }

    setSavingPassword(true);
    try {
      await api.updateProfile({
        currentPassword,
        newPassword,
      });
      setPasswordSuccess('Password changed successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPasswordSuccess(''), 4000);
    } catch (err: any) {
      setPasswordError(err.message || 'Failed to change password');
    } finally {
      setSavingPassword(false);
    }
  };

  const roleMeta = ROLE_DEFAULT_AVATARS[user?.role || 'Seller'] || ROLE_DEFAULT_AVATARS.Seller;
  const RoleIcon = roleMeta.icon;

  // Filter avatar presets strictly by current user's role
  const userRoleKey = (user?.role || 'Seller').toLowerCase();
  const displayedPresets = PRESET_AVATARS.filter(
    (p) => p.role.toLowerCase() === userRoleKey
  );
  const activePresets = displayedPresets.length > 0 ? displayedPresets : PRESET_AVATARS.filter((p) => p.role === 'Seller');

  return (
    <div className="flex h-screen bg-slate-950 font-sans text-slate-100 antialiased overflow-hidden">
      <Sidebar activeStore={store} onStoreChange={setStore} />

      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <Header activeStore={store} />

        <main className="p-6 space-y-6 max-w-5xl mx-auto w-full">
          {/* Page Banner */}
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 p-6 border border-slate-800 shadow-2xl">
            <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="relative group">
                  <div className="w-20 h-20 rounded-2xl overflow-hidden ring-4 ring-slate-700/50 shadow-xl bg-slate-800 flex items-center justify-center">
                    {avatarUrl ? (
                      <img
                        src={avatarUrl}
                        alt={user?.name || 'Profile'}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = roleMeta.avatarUrl;
                        }}
                      />
                    ) : (
                      <User className="w-10 h-10 text-slate-400" />
                    )}
                  </div>
                  <label
                    htmlFor="avatar-upload"
                    className="absolute -bottom-2 -right-2 p-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white cursor-pointer shadow-lg transition-transform active:scale-95"
                    title="Upload custom avatar image"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    <input
                      id="avatar-upload"
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                </div>

                <div>
                  <div className="flex items-center gap-2.5">
                    <h1 className="text-2xl font-bold text-white tracking-tight">{user?.name || 'User Account'}</h1>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                      <RoleIcon className="w-3.5 h-3.5" />
                      {user?.role || 'Seller'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">{user?.email}</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">Account ID: <span className="font-mono text-slate-400">{user?.id || '—'}</span></p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                <button
                  type="button"
                  onClick={handleApplyRoleDefault}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 text-xs font-semibold border border-indigo-500/40 transition-all shadow-sm cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  Reset to Role Default Avatar
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column: Avatar Chooser & Stores */}
            <div className="space-y-6">
              {/* Avatar Selector Card */}
              <div className="glass-panel p-5 rounded-2xl border-slate-800 bg-slate-900/60">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Camera className="w-4 h-4 text-indigo-400" />
                    Role Avatars ({user?.role || 'User'})
                  </h3>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                    {activePresets.length} Avatars
                  </span>
                </div>
                <p className="text-xs text-slate-400 mb-4">
                  Stylized vector avatars curated specifically for your <strong className="text-slate-200">{user?.role || 'account'}</strong> privileges:
                </p>

                {/* Preset Avatars Grid - Filtered Strictly to User's Role */}
                <div className="grid grid-cols-3 gap-2.5 mb-4">
                  {activePresets.map((p) => {
                    const isSelected = avatarUrl === p.url;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => handleSelectPreset(p.url)}
                        className={`relative rounded-2xl overflow-hidden aspect-square border-2 transition-all p-1 bg-slate-950 flex flex-col items-center justify-between group ${
                          isSelected
                            ? 'border-indigo-500 ring-2 ring-indigo-500/50 scale-105 shadow-lg shadow-indigo-500/20'
                            : 'border-slate-800 hover:border-slate-700 opacity-80 hover:opacity-100'
                        }`}
                        title={`${p.name} (${p.role})`}
                      >
                        <div className="w-full h-full flex items-center justify-center overflow-hidden rounded-xl">
                          <img src={p.url} alt={p.name} className="w-full h-full object-contain" />
                        </div>
                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/95 via-black/80 to-transparent p-1 text-center">
                          <span className="text-[9px] font-medium text-slate-200 truncate block">{p.name}</span>
                        </div>
                        {isSelected && (
                          <div className="absolute top-1.5 right-1.5 bg-indigo-600 rounded-full p-0.5 shadow-md">
                            <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Custom Avatar URL input */}
                <div className="space-y-2 pt-3 border-t border-slate-800/80">
                  <label className="text-[11px] font-medium text-slate-400">Custom Avatar Image URL</label>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      placeholder="https://..."
                      value={customUrlInput}
                      onChange={(e) => setCustomUrlInput(e.target.value)}
                      className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                    />
                    <button
                      type="button"
                      onClick={() => setAvatarUrl(customUrlInput)}
                      className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 cursor-pointer"
                    >
                      Apply
                    </button>
                  </div>
                </div>
              </div>

              {/* Associated Stores Card */}
              <div className="glass-panel p-5 rounded-2xl border-slate-800 bg-slate-900/60">
                <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-2">
                  <Building className="w-4 h-4 text-emerald-400" />
                  Your Active Scope
                </h3>
                <p className="text-xs text-slate-400 mb-3">
                  {user?.role === 'SuperAdmin' || user?.role === 'Admin'
                    ? 'Platform-wide administrative access to all stores & channels.'
                    : `Stores linked to your ${user?.role} account:`}
                </p>

                {stores.length > 0 ? (
                  <div className="space-y-2">
                    {stores.map((s: any) => (
                      <div
                        key={s.id}
                        className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/70 border border-slate-800/80 text-xs"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <StoreIcon className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          <span className="font-semibold text-white truncate">{s.name}</span>
                        </div>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-800 text-slate-300">
                          {s.currency || 'MAD'}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-3 rounded-xl bg-slate-950/50 border border-slate-800 text-xs text-slate-500 text-center">
                    All global system stores
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Edit Profile & Password */}
            <div className="lg:col-span-2 space-y-6">
              {/* Personal Details Form */}
              <div className="glass-panel p-6 rounded-2xl border-slate-800 bg-slate-900/60">
                <h2 className="text-base font-bold text-white flex items-center gap-2 mb-1">
                  <User className="w-5 h-5 text-indigo-400" />
                  Account Information
                </h2>
                <p className="text-xs text-slate-400 mb-5">
                  Update your contact details, operational name, and account configuration.
                </p>

                {profileSuccess && (
                  <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>{profileSuccess}</span>
                  </div>
                )}

                {profileError && (
                  <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{profileError}</span>
                  </div>
                )}

                <form onSubmit={handleSaveProfile} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                        Full Name
                      </label>
                      <div className="relative">
                        <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          required
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="Your display name"
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-3 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                        Email Address
                      </label>
                      <div className="relative">
                        <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="email"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="name@domain.com"
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-3 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                        Phone Number
                      </label>
                      <div className="relative">
                        <Phone className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="+212 600 000 000"
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-3 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                        Account Role
                      </label>
                      <div className="relative">
                        <Shield className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          disabled
                          value={`${user?.role || 'Seller'} (Role Assigned)`}
                          className="w-full bg-slate-950/50 border border-slate-800/60 rounded-xl pl-10 pr-3 py-2.5 text-xs text-slate-400 cursor-not-allowed"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      type="submit"
                      disabled={savingProfile}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold shadow-lg shadow-indigo-600/20 transition-all"
                    >
                      {savingProfile ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <Save className="w-4 h-4" />
                      )}
                      <span>Save Profile Changes</span>
                    </button>
                  </div>
                </form>
              </div>

              {/* Password & Security Card */}
              <div className="glass-panel p-6 rounded-2xl border-slate-800 bg-slate-900/60">
                <h2 className="text-base font-bold text-white flex items-center gap-2 mb-1">
                  <KeyRound className="w-5 h-5 text-amber-400" />
                  Security & Password
                </h2>
                <p className="text-xs text-slate-400 mb-5">
                  Change your password to keep your business data and store accounts secure.
                </p>

                {passwordSuccess && (
                  <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>{passwordSuccess}</span>
                  </div>
                )}

                {passwordError && (
                  <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{passwordError}</span>
                  </div>
                )}

                <form onSubmit={handleSavePassword} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Current Password
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder="Enter current password"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-10 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-amber-500"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                        New Password
                      </label>
                      <div className="relative">
                        <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="At least 6 characters"
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-3 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-amber-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                        Confirm New Password
                      </label>
                      <div className="relative">
                        <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="Re-type new password"
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-3 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-amber-500"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      type="submit"
                      disabled={savingPassword}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white text-xs font-semibold shadow-lg shadow-amber-600/20 transition-all"
                    >
                      {savingPassword ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <Lock className="w-4 h-4" />
                      )}
                      <span>Update Password</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
