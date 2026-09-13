'use client';

import React, { useEffect, useState, useRef } from 'react';
import {
  MessageSquare,
  QrCode,
  Radio,
  Send,
  Sparkles,
  RefreshCw,
  Plus,
  Trash2,
  CheckCircle2,
  Clock,
  CheckCheck,
  Check,
  AlertCircle,
  Phone,
  Layers,
  Play,
  Smartphone,
  ShieldCheck,
  Users,
  Search,
  ChevronLeft,
  MessageCircle,
  ExternalLink,
  X,
  UserCheck,
  Paperclip,
  Headphones,
  FileText,
  Image as ImageIcon,
  Pause,
  Volume2,
  Edit2,
  Download,
  ShoppingBag,
  Tag,
  Megaphone,
  Percent,
  Package,
  UserPlus,
} from 'lucide-react';
import Link from 'next/link';
import { Sidebar } from '../../components/Sidebar';
import { Header } from '../../components/Header';
import { api } from '../../lib/api';
import { formatDate } from '../../lib/utils';
import { useLanguage } from '../../context/LanguageContext';

function VoiceNotePlayer({ src }: { src: string }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [hasError, setHasError] = useState(false);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current
        .play()
        .then(() => {
          setIsPlaying(true);
          setHasError(false);
        })
        .catch((err) => {
          console.warn('Audio playback issue:', err);
          setHasError(true);
        });
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration || 0);
      setHasError(false);
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setCurrentTime(0);
  };

  const cycleSpeed = () => {
    if (!audioRef.current) return;
    const rates = [1, 1.5, 2];
    const nextRate = rates[(rates.indexOf(playbackRate) + 1) % rates.length];
    audioRef.current.playbackRate = nextRate;
    setPlaybackRate(nextRate);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setCurrentTime(val);
    if (audioRef.current) {
      audioRef.current.currentTime = val;
    }
  };

  const formatTime = (secs: number) => {
    if (isNaN(secs) || secs < 0) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="flex flex-col gap-1.5 p-2.5 bg-black/40 rounded-2xl border border-black/20 min-w-[270px] max-w-sm shadow-inner">
      <audio
        ref={audioRef}
        src={src}
        preload="metadata"
        crossOrigin="anonymous"
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleEnded}
        onError={() => setHasError(true)}
        className="hidden"
      />
      <div className="flex items-center gap-3">
        {/* Play/Pause Button */}
        <button
          type="button"
          onClick={togglePlay}
          className="h-9 w-9 rounded-full bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-slate-950 flex items-center justify-center shrink-0 shadow-md transition-all cursor-pointer"
          title={isPlaying ? 'Pause Voice Note' : 'Play Voice Note'}
        >
          {isPlaying ? <Pause className="h-4 w-4 fill-current" /> : <Play className="h-4 w-4 fill-current ml-0.5" />}
        </button>

        {/* Progress & Time */}
        <div className="flex-1 flex flex-col justify-center gap-1 min-w-[120px]">
          <input
            type="range"
            min="0"
            max={duration || 100}
            value={currentTime}
            onChange={handleSeek}
            className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-400"
          />
          <div className="flex justify-between items-center text-[10px] text-slate-300 font-mono">
            <span>{formatTime(currentTime)}</span>
            <span>{duration > 0 ? formatTime(duration) : 'Voice Note'}</span>
          </div>
        </div>

        {/* Playback Rate multiplier */}
        <button
          type="button"
          onClick={cycleSpeed}
          className="px-2 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-emerald-300 text-[10px] font-bold font-mono transition-colors shrink-0 cursor-pointer"
          title="Playback Speed"
        >
          {playbackRate}x
        </button>

        {/* Direct Open / Download Link */}
        <a
          href={src}
          target="_blank"
          rel="noreferrer"
          download="voice_note.ogg"
          className="text-slate-400 hover:text-emerald-400 p-1 shrink-0 transition-colors"
          title="Download or open audio in new tab"
        >
          <ExternalLink className="h-3.5 w-3.5" />
        </a>
      </div>

      {hasError && (
        <div className="text-[10px] text-amber-300 flex items-center gap-1 px-1">
          <AlertCircle className="h-3 w-3" />
          <span>Click external icon to open directly</span>
        </div>
      )}
    </div>
  );
}

export default function WhatsAppPage() {
  const { t } = useLanguage();
  const [store, setStore] = useState<any>({ id: '', name: 'Loading...', currency: 'MAD' });

  const [activeTab, setActiveTab] = useState<'sessions' | 'chats' | 'contacts' | 'broadcast' | 'logs'>('sessions');

  const [engineHealth, setEngineHealth] = useState<any>({ isAlive: true, mode: 'mock', version: '2026.1' });
  const [sessions, setSessions] = useState<any[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(false);

  const [selectedSessionId, setSelectedSessionId] = useState<string>('');
  const [activeSession, setActiveSession] = useState<any>(null);

  // QR Modal State
  const [showQrModal, setShowQrModal] = useState(false);
  const [qrModalSession, setQrModalSession] = useState<any>(null);
  const [qrData, setQrData] = useState<string | null>(null);
  const [qrStatus, setQrStatus] = useState<string>('STARTING');
  const [qrLoading, setQrLoading] = useState(false);
  const qrPollRef = useRef<any>(null);

  // New session modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [newSessionPhone, setNewSessionPhone] = useState('');
  const [newSessionLabel, setNewSessionLabel] = useState('');
  const [newSessionEngine, setNewSessionEngine] = useState('NOWEB');
  const [newSessionDefault, setNewSessionDefault] = useState(false);

  // Chats & Messages State
  const [chats, setChats] = useState<any[]>([]);
  const [selectedChat, setSelectedChat] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [chatInputText, setChatInputText] = useState('');
  const [loadingChats, setLoadingChats] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [searchChatQuery, setSearchChatQuery] = useState('');
  const [chatFilterType, setChatFilterType] = useState<'all' | 'active'>('active');

  // Contacts State
  const [contacts, setContacts] = useState<any[]>([]);
  const [loadingContacts, setLoadingContacts] = useState(false);
  const [searchContactQuery, setSearchContactQuery] = useState('');
  const [contactFilterType, setContactFilterType] = useState<'saved' | 'all'>('saved');

  // Session rename state
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editingSessionLabel, setEditingSessionLabel] = useState<string>('');
  const [isRenamingSession, setIsRenamingSession] = useState(false);

  // Single Direct Message Test
  const [singleTo, setSingleTo] = useState('');
  const [singleMessage, setSingleMessage] = useState('Salam! Your COD order is confirmed and ready for dispatch.');
  const [isSendingSingle, setIsSendingSingle] = useState(false);
  const [singleSendStatus, setSingleSendStatus] = useState<string | null>(null);

  // Campaign Broadcast
  const [campaign, setCampaign] = useState({
    name: 'Pre-Shipment WhatsApp Confirmation',
    templateBody: 'Hello {{name}}! Your COD order #{{order_number}} for MAD {{cod_amount}} is packed and ready. Reply YES to confirm delivery to {{city}}.',
    recipients: '',
    throttleMs: 2000,
  });
  const [isLaunching, setIsLaunching] = useState(false);
  const [launchSuccess, setLaunchSuccess] = useState(false);

  // Save Contact to Phone & DB Modal
  const [showSaveContactModal, setShowSaveContactModal] = useState(false);
  const [contactToSave, setContactToSave] = useState<any>(null);
  const [clientNameInput, setClientNameInput] = useState('');
  const [isSavingContact, setIsSavingContact] = useState(false);
  const [contactSaveResult, setContactSaveResult] = useState<{ success: boolean; msg: string; vcardText?: string } | null>(null);

  // Logs
  const [deliveryLogs, setDeliveryLogs] = useState<any[]>([]);



  // Initialize store dynamically from user session
  useEffect(() => {
    const initStore = async () => {
      const current = api.getCurrentStore();
      if (current && current.id) {
        setStore(current);
      } else {
        try {
          const me = await api.getMe();
          if (me?.stores && me.stores.length > 0) {
            setStore(me.stores[0]);
            api.setCurrentStore(me.stores[0]);
          }
        } catch {}
      }
    };
    initStore();
  }, []);

  const loadData = async () => {
    if (!store.id || store.id === 'default') return;
    setLoadingSessions(true);
    try {
      // 1. Health
      const health = await api.getWhatsAppHealth();
      const hData = health?.data || health;
      if (hData) setEngineHealth(hData);

      // 2. Sessions
      const res = await api.getWhatsAppSessions(store.id);
      const list = Array.isArray(res) ? res : (Array.isArray(res?.data) ? res.data : []);
      setSessions(list);
      if (list.length > 0) {
        const def = list.find((s: any) => s.status === 'WORKING') || list.find((s: any) => s.isDefault) || list[0];
        setSelectedSessionId(def.id);
        setActiveSession(def);
      } else {
        setActiveSession(null);
      }

      // 3. Logs
      const logs = await api.getWhatsAppLogs(store.id);
      const logsList = Array.isArray(logs) ? logs : (Array.isArray(logs?.data) ? logs.data : []);
      setDeliveryLogs(logsList);
    } catch {
      // Clean account keeps empty array
      setSessions([]);
      setDeliveryLogs([]);
    } finally {
      setLoadingSessions(false);
    }
  };

  useEffect(() => {
    if (store.id) {
      loadData();
    }
  }, [store.id]);

  useEffect(() => {
    const found = sessions.find((s) => s.id === selectedSessionId) || sessions[0] || null;
    setActiveSession(found);
  }, [selectedSessionId, sessions]);

  // Load Chats when switching to 'chats' tab or changing active session
  useEffect(() => {
    if (activeTab === 'chats' && activeSession && store.id) {
      loadChats(activeSession.id);
    } else if (activeTab === 'contacts' && activeSession && store.id) {
      loadContacts(activeSession.id);
    }
  }, [activeTab, activeSession?.id, store.id]);

  const handleSwitchSession = (sessionId: string) => {
    setSelectedSessionId(sessionId);
    const found = sessions.find((s) => s.id === sessionId);
    if (found) {
      setActiveSession(found);
      setSelectedChat(null);
      setMessages([]);
      if (activeTab === 'chats') {
        loadChats(found.id, true);
      } else if (activeTab === 'contacts') {
        loadContacts(found.id);
      }
    }
  };

  const loadChats = async (sessionId: string, autoSelectFirst: boolean = false) => {
    setLoadingChats(true);
    try {
      const res = await api.getWhatsAppChats(store.id, sessionId);
      const chatsList = Array.isArray(res) ? res : (Array.isArray(res?.data) ? res.data : []);
      setChats(chatsList);
      if (chatsList.length > 0 && (autoSelectFirst || !selectedChat)) {
        setSelectedChat(chatsList[0]);
        loadMessages(sessionId, chatsList[0].id);
      } else if (chatsList.length === 0) {
        setSelectedChat(null);
        setMessages([]);
      }
    } catch {
      setChats([]);
      setSelectedChat(null);
      setMessages([]);
    } finally {
      setLoadingChats(false);
    }
  };

  const loadContacts = async (sessionId: string) => {
    setLoadingContacts(true);
    try {
      const res = await api.getWhatsAppContacts(store.id, sessionId);
      const contactsList = Array.isArray(res) ? res : (Array.isArray(res?.data) ? res.data : []);
      setContacts(contactsList);
    } catch {
      setContacts([]);
    } finally {
      setLoadingContacts(false);
    }
  };

  // 1. Send Client to Orders Page (Pre-filled conversion flow)
  const handleSendToOrders = (chatOrContact: any) => {
    const name = chatOrContact.name || chatOrContact.pushname || 'WhatsApp Client';
    const rawPhone = (
      chatOrContact.phoneNumber ||
      chatOrContact.number ||
      (chatOrContact.id?.includes('@c.us') ? chatOrContact.id.replace('@c.us', '') : chatOrContact.id) ||
      ''
    ).replace(/[^0-9]/g, '');
    const phone = rawPhone ? `+${rawPhone}` : '';
    window.location.href = `/orders?create=true&customerName=${encodeURIComponent(name)}&customerPhone=${encodeURIComponent(phone)}&source=whatsapp`;
  };

  // 2. Save Client Contact on Phone & update in DB
  const handleOpenSaveContact = (chatOrContact: any) => {
    setContactToSave(chatOrContact);
    const existingName = chatOrContact.name && !chatOrContact.name.startsWith('212') && chatOrContact.name !== 'WhatsApp Contact'
      ? chatOrContact.name
      : (chatOrContact.pushname && !chatOrContact.pushname.startsWith('212') ? chatOrContact.pushname : '');
    setClientNameInput(existingName);
    setContactSaveResult(null);
    setShowSaveContactModal(true);
  };

  const handleSaveContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientNameInput.trim()) return;
    setIsSavingContact(true);
    setContactSaveResult(null);

    const rawPhone = (
      contactToSave?.phoneNumber ||
      contactToSave?.number ||
      (contactToSave?.id?.includes('@c.us') ? contactToSave.id.replace('@c.us', '') : contactToSave?.id || '')
    ).replace(/[^0-9]/g, '');
    const cleanPhone = rawPhone ? `+${rawPhone}` : '';

    try {
      // 1. Update contact name in DB
      await api.updateStoredWhatsAppContact(store.id, {
        chatId: contactToSave.id,
        phone: cleanPhone,
        name: clientNameInput.trim(),
        tags: ['verified_client', 'saved_to_phone'],
      });

      // 2. Update live state
      if (selectedChat && (selectedChat.id === contactToSave.id || selectedChat.phoneNumber === contactToSave.phoneNumber)) {
        setSelectedChat({ ...selectedChat, name: clientNameInput.trim() });
      }
      setChats((prev) =>
        prev.map((c) => (c.id === contactToSave.id ? { ...c, name: clientNameInput.trim() } : c))
      );

      // 3. Generate standard vCard 3.0 file
      const vcard = `BEGIN:VCARD\r\nVERSION:3.0\r\nFN:${clientNameInput.trim()}\r\nN:${clientNameInput.trim()};;;;\r\nTEL;TYPE=CELL:${cleanPhone}\r\nNOTE:COD Flow Client - Store: ${store.name}\r\nEND:VCARD\r\n`;

      // 4. Download .vcf file directly for immediate 1-tap addition to Phone Address Book
      const blob = new Blob([vcard], { type: 'text/vcard;charset=utf-8' });
      const downloadUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `${clientNameInput.trim().replace(/[^a-zA-Z0-9]/g, '_')}_contact.vcf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(downloadUrl);

      setContactSaveResult({
        success: true,
        msg: `Client "${clientNameInput.trim()}" updated in DB & vCard downloaded to your phone!`,
        vcardText: vcard,
      });

      // Reload stored DB contacts
      loadStoredDbContacts();

      setTimeout(() => {
        setShowSaveContactModal(false);
      }, 2400);
    } catch (err: any) {
      setContactSaveResult({
        success: false,
        msg: err.message || 'Failed to update contact in database',
      });
    } finally {
      setIsSavingContact(false);
    }
  };



  // Stored Inquired Contacts from DB (Persisted automatically from WhatsApp conversations)
  const [storedDbContacts, setStoredDbContacts] = useState<any[]>([]);
  const [loadingStoredContacts, setLoadingStoredContacts] = useState(false);

  const loadStoredDbContacts = async () => {
    if (!store.id || store.id === 'default') return;
    setLoadingStoredContacts(true);
    try {
      const res = await api.getStoredWhatsAppContacts(store.id);
      const list = Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : []);
      setStoredDbContacts(list);
    } catch {
      setStoredDbContacts([]);
    } finally {
      setLoadingStoredContacts(false);
    }
  };

  useEffect(() => {
    if (store.id) {
      loadStoredDbContacts();
    }
  }, [store.id, activeTab]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [uploadingMedia, setUploadingMedia] = useState(false);

  const loadMessages = async (sessionId: string, chatId: string) => {
    setLoadingMessages(true);
    try {
      const res = await api.getWhatsAppMessages(store.id, sessionId, chatId);
      const msgsList = Array.isArray(res) ? res : (Array.isArray(res?.data) ? res.data : []);
      // Sort chronologically (oldest at top, newest at bottom)
      const sorted = [...msgsList].sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
      setMessages(sorted);
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
      }, 60);
    } catch {
      setMessages([]);
    } finally {
      setLoadingMessages(false);
    }
  };

  const handleSendMediaFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedChat || !activeSession) return;

    setUploadingMedia(true);
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const base64Data = (reader.result as string).split(',')[1];
        await api.sendWhatsAppMedia(
          store.id,
          selectedChat.id,
          { filename: file.name, mimetype: file.type || 'application/octet-stream', data: base64Data },
          chatInputText.trim() || undefined,
          activeSession.id
        );
        const newMsg = {
          id: `local-media-${Date.now()}`,
          timestamp: Date.now(),
          from: activeSession.sessionName,
          to: selectedChat.id,
          body: chatInputText.trim(),
          fromMe: true,
          hasMedia: true,
          media: {
            filename: file.name,
            mimetype: file.type,
            url: URL.createObjectURL(file),
          },
        };
        setMessages((prev) => [...prev, newMsg]);
        setChatInputText('');
        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 60);
      } catch (err: any) {
        alert(`Failed to send media file: ${err.message}`);
      } finally {
        setUploadingMedia(false);
        if (e.target) e.target.value = '';
      }
    };
    reader.readAsDataURL(file);
  };

  // 1-Click QR Code Flow: Immediately opens QR code modal and polls WAHA until connected
  const handleQuickConnect = async (existingSession?: any) => {
    setShowQrModal(true);
    setQrLoading(true);
    setQrData(null);
    setQrStatus('STARTING');

    try {
      let targetSession = existingSession;
      if (!targetSession) {
        const nextNumber = sessions.length + 1;
        setQrModalSession({ label: `WhatsApp Line #${nextNumber}` });
        const res = await api.createWhatsAppSession(store.id, {
          label: `WhatsApp Line #${nextNumber}`,
          engine: 'WEBJS',
          isDefault: sessions.length === 0,
        });
        targetSession = (res && res.id) ? res : (res?.data || res);
      }
      setQrModalSession(targetSession);

      // Start polling for QR code from WAHA
      pollForQR(targetSession);
    } catch (err: any) {
      alert(`Could not initialize WhatsApp Line: ${err.message}`);
      setShowQrModal(false);
      setQrLoading(false);
    }
  };

  const handleCreateSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!store?.id) return;
    setShowAddModal(false);
    setShowQrModal(true);
    setQrLoading(true);
    setQrData(null);
    setQrStatus('STARTING');
    try {
      setQrModalSession({ label: newSessionLabel || 'WhatsApp Line' });
      const res = await api.createWhatsAppSession(store.id, {
        phoneNumber: newSessionPhone || undefined,
        label: newSessionLabel || undefined,
        isDefault: newSessionDefault,
        engine: newSessionEngine,
      });
      const targetSession = (res && res.id) ? res : (res?.data || res);
      setQrModalSession(targetSession);
      pollForQR(targetSession);
    } catch (err: any) {
      alert(`Error creating WhatsApp session: ${err.message}`);
      setShowQrModal(false);
      setQrLoading(false);
    }
  };

  const pollForQR = (session: any) => {
    if (qrPollRef.current) {
      clearInterval(qrPollRef.current);
      qrPollRef.current = null;
    }

    const sessId = session?.id || session?.sessionId || session?.sessionName;
    if (!sessId) return;

    let hasReceivedQR = false;

    const onConnected = async () => {
      if (qrPollRef.current) {
        clearInterval(qrPollRef.current);
        qrPollRef.current = null;
      }
      setQrStatus('WORKING');
      setQrLoading(false);
      await loadData();
      setTimeout(() => {
        setShowQrModal(false);
      }, 2000);
    };

    const checkOnce = async () => {
      try {
        if (!hasReceivedQR) {
          // Phase 1: Request QR code until rendered
          const res = await api.getWhatsAppQR(store.id, sessId);
          const qrPayload = (res && (res.status || res.qr)) ? res : (res?.data || {});
          const st = qrPayload.status || 'STARTING';
          setQrStatus(st);

          if (qrPayload.qr) {
            hasReceivedQR = true;
            setQrData(qrPayload.qr);
            setQrLoading(false);
          }

          if (st === 'WORKING') {
            await onConnected();
          }
        } else {
          // Phase 2: QR is already visible! Only check lightweight session status
          // This keeps the QR code rock-solid and prevents disrupting Chromium while the user scans
          const statusRes = await api.getWhatsAppStatus(store.id, sessId);
          const stPayload = (statusRes && statusRes.status) ? statusRes : (statusRes?.data || {});
          const currentStatus = stPayload.status;
          if (currentStatus) {
            setQrStatus(currentStatus);
            if (currentStatus === 'WORKING') {
              await onConnected();
            }
          }
        }
      } catch {
        // Continue polling
      }
    };

    // First attempt immediately
    checkOnce();

    // Poll every 2000ms
    qrPollRef.current = setInterval(checkOnce, 2000);
  };

  const handleCloseQrModal = () => {
    if (qrPollRef.current) {
      clearInterval(qrPollRef.current);
      qrPollRef.current = null;
    }
    setShowQrModal(false);
    setQrData(null);
    setQrLoading(false);
    loadData();
  };

  const handleSetDefault = async (sessId: string) => {
    try {
      await api.setDefaultWhatsAppSession(store.id, sessId);
      await loadData();
    } catch (err: any) {
      alert(`Error setting default session: ${err.message}`);
    }
  };

  const handleDeleteSession = async (sessId: string) => {
    if (!confirm('Are you sure you want to delete and unpair this WhatsApp session? This will automatically log out and unlink this device from your WhatsApp mobile phone.')) return;
    try {
      await api.deleteWhatsAppSession(store.id, sessId);
      await loadData();
    } catch (err: any) {
      alert(`Error deleting session: ${err.message}`);
    }
  };

  const handleStartRename = (sess: any) => {
    setEditingSessionId(sess.id);
    setEditingSessionLabel(sess.label || sess.sessionName || '');
  };

  const handleCancelRename = () => {
    setEditingSessionId(null);
    setEditingSessionLabel('');
  };

  const handleSaveRename = async (sessId: string) => {
    if (!editingSessionLabel.trim() || !store?.id) return;
    setIsRenamingSession(true);
    try {
      await api.updateWhatsAppSession(store.id, sessId, { label: editingSessionLabel.trim() });
      setSessions((prev) =>
        prev.map((s) => (s.id === sessId ? { ...s, label: editingSessionLabel.trim() } : s))
      );
      if (activeSession?.id === sessId) {
        setActiveSession((prev: any) => ({ ...prev, label: editingSessionLabel.trim() }));
      }
      setEditingSessionId(null);
    } catch (err: any) {
      alert(`Error updating session name: ${err.message}`);
    } finally {
      setIsRenamingSession(false);
    }
  };

  // Send message in Live Chat
  const handleSendChatMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInputText.trim() || !selectedChat || !activeSession) return;
    setSendingMessage(true);
    try {
      await api.sendWhatsAppMessage(store.id, selectedChat.id, chatInputText, undefined, activeSession.id);
      const newMsg = {
        id: `local-${Date.now()}`,
        timestamp: Date.now(),
        from: activeSession.sessionName,
        to: selectedChat.id,
        body: chatInputText,
        fromMe: true,
      };
      setMessages((prev) => [...prev, newMsg]);
      setChatInputText('');
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 50);
    } catch (err: any) {
      alert(`Failed to send message: ${err.message}`);
    } finally {
      setSendingMessage(false);
    }
  };

  const handleSendSingle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!singleTo || !singleMessage) return;
    setIsSendingSingle(true);
    setSingleSendStatus(null);
    try {
      await api.sendWhatsAppMessage(store.id, singleTo, singleMessage, undefined, activeSession?.id);
      setSingleSendStatus('success');
      setSingleTo('');
      await loadData();
    } catch (err: any) {
      setSingleSendStatus(`error: ${err.message}`);
    } finally {
      setIsSendingSingle(false);
    }
  };

  const handleLaunchBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLaunching(true);
    setLaunchSuccess(false);
    try {
      const recipientList = campaign.recipients
        .split(',')
        .map((p) => p.trim())
        .filter(Boolean);

      await api.createBroadcast(store.id, {
        name: campaign.name,
        templateBody: campaign.templateBody,
        recipientPhones: recipientList,
        throttleMs: campaign.throttleMs,
      });

      setLaunchSuccess(true);
      await loadData();
    } catch (err: any) {
      alert(`Broadcast failed: ${err.message}`);
    } finally {
      setIsLaunching(false);
    }
  };

  const filteredChats = chats.filter((c) => {
    const matchesSearch =
      c.name?.toLowerCase().includes(searchChatQuery.toLowerCase()) ||
      c.phoneNumber?.includes(searchChatQuery) ||
      c.id?.toLowerCase().includes(searchChatQuery.toLowerCase());
    if (!matchesSearch) return false;
    if (chatFilterType === 'active') {
      return Boolean(c.lastMessage || c.hasRecentActivity);
    }
    return true;
  });

  const filteredContacts = contacts.filter((c) => {
    const matchesSearch =
      c.name?.toLowerCase().includes(searchContactQuery.toLowerCase()) ||
      c.number?.includes(searchContactQuery) ||
      c.pushname?.toLowerCase().includes(searchContactQuery.toLowerCase());
    if (!matchesSearch) return false;
    if (contactFilterType === 'saved') {
      return Boolean(c.isMyContact);
    }
    return true;
  });

  return (
    <div className="flex h-screen bg-slate-950 font-sans text-slate-100 antialiased overflow-hidden">
      <Sidebar activeStore={store} onStoreChange={setStore} />

      <div className="flex flex-1 flex-col overflow-hidden">
        <Header activeStore={store} />

        <main className="flex-1 overflow-y-auto p-3 sm:p-6 lg:p-8 space-y-6 pb-24 lg:pb-8">
          {/* Top Title Banner */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-800 pb-5">
            <div>
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/30">
                  <MessageSquare className="h-6 w-6" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                    WhatsApp Automation & Inbox
                    <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-400 ring-1 ring-emerald-500/20">
                      WAHA Companion Engine
                    </span>
                  </h1>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Connect WhatsApp via QR code, manage multiple phone numbers, and chat with customers in real time.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 rounded-lg bg-slate-900 px-3 py-1.5 border border-slate-800 text-xs">
                <span className="relative flex h-2 w-2">
                  <span
                    className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                      engineHealth.isAlive ? 'bg-emerald-400' : 'bg-rose-400'
                    }`}
                  ></span>
                  <span
                    className={`relative inline-flex rounded-full h-2 w-2 ${
                      engineHealth.isAlive ? 'bg-emerald-500' : 'bg-rose-500'
                    }`}
                  ></span>
                </span>
                <span className="font-medium text-slate-300">
                  WAHA: {engineHealth.isAlive ? 'Docker Connected' : 'Offline'}
                </span>
                <span className="text-slate-500">|</span>
                <span className="text-slate-400 font-mono text-[11px]">{engineHealth.mode || 'live'}</span>
              </div>

              <button
                onClick={() => handleQuickConnect()}
                className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-emerald-500 transition-colors"
              >
                <Plus className="h-4 w-4" />
                Add WhatsApp Line
              </button>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-2 border-b border-slate-800 pb-2 overflow-x-auto">
            <button
              onClick={() => setActiveTab('sessions')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'sessions'
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <Smartphone className="h-4 w-4" />
              WhatsApp Sessions ({sessions.length})
            </button>

            <button
              onClick={() => setActiveTab('chats')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'chats'
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <MessageCircle className="h-4 w-4" />
              Live Chats & Inbox
            </button>

            <button
              onClick={() => setActiveTab('contacts')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'contacts'
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <Users className="h-4 w-4" />
              Contacts Directory
            </button>

            <button
              onClick={() => setActiveTab('broadcast')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'broadcast'
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <Radio className="h-4 w-4" />
              Broadcast Campaigns
            </button>

            <button
              onClick={() => setActiveTab('logs')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'logs'
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <Layers className="h-4 w-4" />
              Delivery Logs ({deliveryLogs.length})
            </button>
          </div>

          {/* TAB 1: SESSIONS & PHONE LINES */}
          {activeTab === 'sessions' && (
            <div className="space-y-6">
              {loadingSessions ? (
                <div className="flex flex-col items-center justify-center p-12 text-slate-400">
                  <RefreshCw className="h-8 w-8 animate-spin text-emerald-500 mb-3" />
                  <p className="text-sm font-medium">Loading WhatsApp sessions...</p>
                </div>
              ) : sessions.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-800 bg-slate-900/30 p-12 text-center">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20 mb-4">
                    <QrCode className="h-7 w-7" />
                  </div>
                  <h3 className="text-base font-semibold text-white">No WhatsApp Sessions Connected</h3>
                  <p className="text-xs text-slate-400 max-w-md mx-auto mt-1 mb-6">
                    Connect your WhatsApp Business or personal phone number via QR code to automatically confirm COD orders and chat with customers.
                  </p>
                  <button
                    onClick={() => handleQuickConnect()}
                    className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-emerald-500 shadow-md transition-colors"
                  >
                    <Plus className="h-4 w-4" />
                    Connect First WhatsApp Line (QR Code)
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {sessions.map((sess) => {
                    const isWorking = sess.status === 'WORKING';
                    return (
                      <div
                        key={sess.id}
                        className={`rounded-xl border p-5 transition-all relative ${
                          sess.isDefault
                            ? 'border-emerald-500/40 bg-slate-900/90 shadow-lg shadow-emerald-500/5'
                            : 'border-slate-800 bg-slate-900/40 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div
                              className={`flex h-10 w-10 items-center justify-center rounded-xl font-bold ${
                                isWorking
                                  ? 'bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/30'
                                  : 'bg-amber-500/10 text-amber-400 ring-1 ring-amber-500/30'
                              }`}
                            >
                              <Smartphone className="h-5 w-5" />
                            </div>
                            <div className="flex-1 min-w-0">
                              {editingSessionId === sess.id ? (
                                <div className="flex items-center gap-1.5 mt-0.5">
                                  <input
                                    type="text"
                                    value={editingSessionLabel}
                                    onChange={(e) => setEditingSessionLabel(e.target.value)}
                                    placeholder="Line name..."
                                    className="rounded bg-slate-950 px-2 py-1 text-xs text-white border border-emerald-500 focus:outline-none w-36"
                                    autoFocus
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') handleSaveRename(sess.id);
                                      if (e.key === 'Escape') handleCancelRename();
                                    }}
                                  />
                                  <button
                                    type="button"
                                    onClick={() => handleSaveRename(sess.id)}
                                    disabled={isRenamingSession}
                                    className="p-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer"
                                    title="Save Name"
                                  >
                                    {isRenamingSession ? <RefreshCw className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={handleCancelRename}
                                    className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
                                    title="Cancel"
                                  >
                                    <X className="h-3 w-3" />
                                  </button>
                                </div>
                              ) : (
                                <div className="flex items-center gap-1.5">
                                  <h4 className="text-sm font-bold text-white flex items-center gap-1.5 truncate">
                                    {sess.label || sess.sessionName}
                                    {sess.isDefault && (
                                      <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-semibold text-emerald-300 shrink-0">
                                        Default
                                      </span>
                                    )}
                                  </h4>
                                  <button
                                    type="button"
                                    onClick={() => handleStartRename(sess)}
                                    className="text-slate-400 hover:text-emerald-400 p-0.5 transition-colors cursor-pointer shrink-0"
                                    title="Rename WhatsApp Line"
                                  >
                                    <Edit2 className="h-3 w-3" />
                                  </button>
                                </div>
                              )}
                              <p className="text-xs text-emerald-400 font-mono mt-0.5 flex items-center gap-1">
                                <Phone className="h-3 w-3" />
                                <span>{sess.connectedPhone ? `+${sess.connectedPhone}` : 'No phone paired yet'}</span>
                              </p>
                            </div>
                          </div>

                          <span
                            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                              isWorking
                                ? 'bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/30'
                                : sess.status === 'SCAN_QR_CODE'
                                ? 'bg-cyan-500/10 text-cyan-400 ring-1 ring-cyan-500/30'
                                : 'bg-slate-800 text-slate-400'
                            }`}
                          >
                            <span className="h-1.5 w-1.5 rounded-full bg-current"></span>
                            {sess.status}
                          </span>
                        </div>

                        <div className="mt-4 pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs">
                          <span className="text-slate-400 text-[11px]">
                            Engine: <strong className="text-slate-200">{sess.engine || 'NOWEB'}</strong>
                          </span>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleQuickConnect(sess)}
                              className="inline-flex items-center gap-1 rounded-md bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20 transition-colors"
                            >
                              <QrCode className="h-3.5 w-3.5" />
                              {isWorking ? 'View Session / QR' : 'Scan QR Code'}
                            </button>

                            {!sess.isDefault && (
                              <button
                                onClick={() => handleSetDefault(sess.id)}
                                className="text-slate-400 hover:text-slate-200 text-[11px] font-medium"
                              >
                                Set Default
                              </button>
                            )}

                            <button
                              onClick={() => handleDeleteSession(sess.id)}
                              className="text-slate-500 hover:text-rose-400 transition-colors p-1"
                              title="Delete Session"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Direct Quick Test Box */}
              {activeSession && (
                <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 mt-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Send className="h-4 w-4 text-emerald-400" />
                    <h3 className="text-sm font-bold text-white">Send Direct Test Message</h3>
                    <span className="text-xs text-slate-400">
                      (Using active session: <span className="text-emerald-400 font-mono">{activeSession.label || activeSession.sessionName}</span>)
                    </span>
                  </div>

                  <form onSubmit={handleSendSingle} className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] font-medium text-slate-400 mb-1">Destination Phone Number</label>
                      <input
                        type="text"
                        placeholder="+212612345678"
                        value={singleTo}
                        onChange={(e) => setSingleTo(e.target.value)}
                        className="w-full rounded-lg bg-slate-950 px-3 py-2 text-xs text-slate-200 border border-slate-800 focus:border-emerald-500 focus:outline-none font-mono"
                        required
                      />
                    </div>
                    <div className="md:col-span-2 flex gap-2">
                      <div className="flex-1">
                        <label className="block text-[11px] font-medium text-slate-400 mb-1">Message Body</label>
                        <input
                          type="text"
                          value={singleMessage}
                          onChange={(e) => setSingleMessage(e.target.value)}
                          className="w-full rounded-lg bg-slate-950 px-3 py-2 text-xs text-slate-200 border border-slate-800 focus:border-emerald-500 focus:outline-none"
                          required
                        />
                      </div>
                      <div className="flex items-end">
                        <button
                          type="submit"
                          disabled={isSendingSingle}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-500 transition-colors disabled:opacity-50"
                        >
                          {isSendingSingle ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                          Send
                        </button>
                      </div>
                    </div>
                  </form>

                  {singleSendStatus === 'success' && (
                    <div className="mt-3 flex items-center gap-2 text-xs text-emerald-400 bg-emerald-500/10 p-2.5 rounded-lg border border-emerald-500/20">
                      <CheckCircle2 className="h-4 w-4" />
                      Message sent successfully via WAHA WhatsApp Engine!
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: LIVE CHATS & INBOX */}
          {activeTab === 'chats' && (
            <div className="space-y-3">
              {/* WhatsApp Active Line / Session Switcher */}
              <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-3.5 flex flex-wrap items-center justify-between gap-3 shadow-md">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    <Smartphone className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-slate-300">Active Line:</span>
                      <span className="text-xs font-bold text-white">
                        {activeSession ? (activeSession.label || activeSession.sessionName) : 'No line selected'}
                      </span>
                      {activeSession?.status === 'WORKING' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                          Online
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                          {activeSession?.status || 'Offline'}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-emerald-400 font-mono flex items-center gap-1 mt-0.5">
                      <Phone className="h-3 w-3" />
                      <span>{activeSession?.connectedPhone ? `+${activeSession.connectedPhone}` : 'No phone linked'}</span>
                      <span className="text-slate-600 mx-1">•</span>
                      <span className="text-slate-400">{filteredChats.length} conversations loaded</span>
                    </p>
                  </div>
                </div>

                {/* Session Switcher Selector */}
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-400">Switch Session Line:</span>
                  <select
                    value={selectedSessionId}
                    onChange={(e) => handleSwitchSession(e.target.value)}
                    className="rounded-lg bg-slate-950 px-3 py-1.5 text-xs text-white font-semibold border border-slate-700 hover:border-emerald-500/60 focus:outline-none focus:border-emerald-500 cursor-pointer shadow-sm"
                  >
                    {sessions.length === 0 && <option value="">No sessions available</option>}
                    {sessions.map((sess) => (
                      <option key={sess.id} value={sess.id}>
                        {sess.label || sess.sessionName} ({sess.connectedPhone ? `+${sess.connectedPhone}` : sess.status}) {sess.status === 'WORKING' ? '🟢' : '⚪'}
                      </option>
                    ))}
                  </select>

                  <button
                    type="button"
                    onClick={() => {
                      if (activeSession) loadChats(activeSession.id, false);
                    }}
                    className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer border border-slate-700"
                    title="Refresh Chats"
                  >
                    <RefreshCw className={`h-3.5 w-3.5 ${loadingChats ? 'animate-spin text-emerald-400' : ''}`} />
                  </button>
                </div>
              </div>

              {/* Chat Split Pane */}
              <div className="rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden flex flex-col md:flex-row h-[700px] md:h-[620px]">
                {/* Left Column: Chats list */}
                <div className={`w-full md:w-80 border-r border-slate-800 flex flex-col bg-slate-900/40 h-full ${selectedChat ? 'hidden md:flex' : 'flex'}`}>
                  <div className="p-3 border-b border-slate-800 space-y-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-500" />
                      <input
                        type="text"
                        placeholder="Search conversations..."
                        value={searchChatQuery}
                        onChange={(e) => setSearchChatQuery(e.target.value)}
                        className="w-full rounded-lg bg-slate-950 pl-8 pr-3 py-1.5 text-xs text-slate-200 border border-slate-800 focus:border-emerald-500 focus:outline-none"
                      />
                    </div>
                  <div className="flex gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
                    <button
                      type="button"
                      onClick={() => setChatFilterType('active')}
                      className={`flex-1 py-1 text-[11px] font-semibold rounded-md transition-colors text-center cursor-pointer ${
                        chatFilterType === 'active'
                          ? 'bg-emerald-600 text-white shadow-sm'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      Active ({chats.filter((c) => c.lastMessage || c.hasRecentActivity).length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setChatFilterType('all')}
                      className={`flex-1 py-1 text-[11px] font-semibold rounded-md transition-colors text-center cursor-pointer ${
                        chatFilterType === 'all'
                          ? 'bg-slate-800 text-white shadow-sm'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      All ({chats.length})
                    </button>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto divide-y divide-slate-800/60">
                  {loadingChats ? (
                    <div className="p-8 text-center text-slate-500 text-xs">
                      <RefreshCw className="h-5 w-5 animate-spin mx-auto text-emerald-500 mb-2" />
                      Loading chats from WAHA...
                    </div>
                  ) : filteredChats.length === 0 ? (
                    <div className="p-8 text-center text-slate-500 text-xs">
                      <MessageSquare className="h-6 w-6 mx-auto mb-2 text-slate-600" />
                      No conversations found on this WhatsApp line.
                    </div>
                  ) : (
                    filteredChats.map((chat) => {
                      const isSelected = selectedChat?.id === chat.id;
                      return (
                        <button
                          key={chat.id}
                          onClick={() => {
                            setSelectedChat(chat);
                            if (activeSession) loadMessages(activeSession.id, chat.id);
                          }}
                          className={`w-full text-left p-3.5 flex items-start gap-3 transition-colors ${
                            isSelected ? 'bg-emerald-500/10 border-l-2 border-emerald-500' : 'hover:bg-slate-800/40'
                          }`}
                        >
                          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-800 text-slate-300 font-bold text-xs shrink-0">
                            {chat.name ? chat.name.slice(0, 2).toUpperCase() : 'WA'}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <h4 className="text-xs font-bold text-white truncate">
                                {chat.name || (chat.phoneNumber ? `+${chat.phoneNumber}` : chat.id)}
                              </h4>
                              {chat.lastMessage?.timestamp && (
                                <span className="text-[10px] text-slate-500">
                                  {new Date(chat.lastMessage.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              )}
                            </div>
                            {chat.phoneNumber && (
                              <p className="text-[10px] text-emerald-400 font-mono flex items-center gap-1 mt-0.5">
                                <Phone className="h-2.5 w-2.5" />
                                <span>+{chat.phoneNumber}</span>
                              </p>
                            )}
                            <p className="text-[11px] text-slate-400 truncate mt-0.5 font-sans">
                              {chat.lastMessage?.body || (chat.lastMessage?.hasMedia ? '🎵 Audio / Media message' : 'WhatsApp conversation')}
                            </p>
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Right Column: Chat Thread & Composer */}
              <div className={`flex-1 flex flex-col bg-slate-950 h-full ${!selectedChat ? 'hidden md:flex' : 'flex'}`}>
                {selectedChat ? (
                  <>
                    {/* Chat Header */}
                    <div className="p-3.5 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 bg-slate-900/40">
                      <div className="flex items-center gap-2.5">
                        <button
                          type="button"
                          onClick={() => setSelectedChat(null)}
                          className="md:hidden p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-slate-700 transition-colors shrink-0 cursor-pointer"
                          title="Back to Conversations"
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </button>
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-tr from-emerald-600 to-teal-500 text-slate-950 font-bold text-xs shadow-md shrink-0">
                          {selectedChat.name ? selectedChat.name.slice(0, 2).toUpperCase() : 'WA'}
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-white flex items-center gap-2">
                            {selectedChat.name || (selectedChat.phoneNumber ? `+${selectedChat.phoneNumber}` : selectedChat.id)}
                            <span className="h-2 w-2 rounded-full bg-emerald-500 inline-block" title="Online" />
                          </h4>
                          <p className="text-[11px] text-emerald-400 font-mono flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            <span>
                              {selectedChat.phoneNumber
                                ? `+${selectedChat.phoneNumber}`
                                : (selectedChat.id?.includes('@lid') ? 'WhatsApp User' : `+${selectedChat.id?.replace(/[^0-9]/g, '')}`)}
                            </span>
                          </p>
                        </div>
                      </div>

                      {/* Call, Orders & Active Line Actions */}
                      <div className="flex flex-wrap items-center gap-2">
                        {/* 1. Direct Send Client to Orders Button */}
                        <button
                          type="button"
                          onClick={() => handleSendToOrders(selectedChat)}
                          title="Convert this conversation into a COD Order with client details pre-filled"
                          className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-500 transition-all shadow-md cursor-pointer border border-emerald-400/40"
                        >
                          <ShoppingBag className="h-3.5 w-3.5" />
                          <span>Send to Orders</span>
                        </button>

                        {/* 2. Direct Save Contact to Phone & DB Button */}
                        <button
                          type="button"
                          onClick={() => handleOpenSaveContact(selectedChat)}
                          title="Save this contact on your phone and update their name in the database"
                          className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600/90 px-3 py-1.5 text-xs font-bold text-white hover:bg-blue-500 transition-all shadow-md cursor-pointer border border-blue-400/40"
                        >
                          <UserPlus className="h-3.5 w-3.5" />
                          <span>Save Contact</span>
                        </button>



                        {(() => {
                          const cleanPhone = (selectedChat.phoneNumber || (selectedChat.id?.includes('@c.us') ? selectedChat.id.replace('@c.us', '') : '')).replace(/[^0-9]/g, '');
                          return (
                            <>
                              {cleanPhone && (
                                <a
                                  href={`tel:+${cleanPhone}`}
                                  title="Voice Call via GSM or Softphone"
                                  className="inline-flex items-center gap-1.5 rounded-lg bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
                                >
                                  <Phone className="h-3.5 w-3.5" />
                                  <span>Call</span>
                                </a>
                              )}
                              <Link
                                href="/call-center"
                                title="Open Call Center Lead Dialer"
                                className="inline-flex items-center gap-1.5 rounded-lg bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
                              >
                                <Headphones className="h-3.5 w-3.5 text-cyan-400" />
                                <span className="hidden sm:inline">Call Center</span>
                              </Link>
                              {cleanPhone && (
                                <a
                                  href={`https://wa.me/${cleanPhone}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  title="Open in WhatsApp Web / App"
                                  className="inline-flex items-center gap-1 rounded-lg bg-slate-800 px-2.5 py-1.5 text-xs font-semibold text-slate-300 hover:bg-slate-700 transition-colors"
                                >
                                  <ExternalLink className="h-3.5 w-3.5" />
                                </a>
                              )}
                            </>
                          );
                        })()}
                        <span className="hidden md:inline-flex rounded-full bg-slate-800/80 px-2.5 py-1 text-[10px] font-semibold text-slate-300 border border-slate-700">
                          {activeSession?.label || 'WhatsApp Line'}
                        </span>
                        <span
                          className="hidden lg:inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-1 text-[10px] font-semibold text-emerald-300 border border-emerald-500/20"
                          title="Message history synced from last 7 days (Configurable in backend .env: WHATSAPP_MESSAGE_HISTORY_DAYS)"
                        >
                          <Clock className="h-3 w-3" />
                          7-Day Window (.env)
                        </span>
                      </div>
                    </div>

                    {/* Chat Messages */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
                      {loadingMessages ? (
                        <div className="flex items-center justify-center h-full text-slate-500 text-xs">
                          <RefreshCw className="h-5 w-5 animate-spin mr-2 text-emerald-500" />
                          Loading message history...
                        </div>
                      ) : messages.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-slate-500 text-xs p-6 text-center space-y-3">
                          <div className="w-12 h-12 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400">
                            <MessageSquare className="h-6 w-6 text-emerald-400" />
                          </div>
                          <div className="space-y-1">
                            <h4 className="text-white font-bold text-sm">No Messages in 7-Day Window</h4>
                            <p className="text-slate-400 text-xs max-w-sm">
                              No recent messages recorded in the last 7 days for this contact.
                            </p>
                            <span className="inline-block text-[10px] text-slate-400 bg-slate-950 px-2.5 py-1 rounded border border-slate-800 font-mono">
                              Configured via WHATSAPP_MESSAGE_HISTORY_DAYS in backend .env
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setChatInputText('Bonjour,');
                            }}
                            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-colors shadow-md cursor-pointer"
                          >
                            Send WhatsApp Message
                          </button>
                        </div>
                      ) : (
                        messages.map((msg) => {
                          const token = typeof window !== 'undefined' ? (localStorage.getItem('codflow_token') || '') : '';
                          const mediaUrl = msg.media?.url
                            ? (msg.media.url.startsWith('blob:')
                                ? msg.media.url
                                : `http://localhost:4000/api/whatsapp/sessions/${store.id}/${activeSession.id}/media?url=${encodeURIComponent(msg.media.url)}&token=${encodeURIComponent(token)}`)
                            : null;
                          const mime = msg.media?.mimetype || '';
                          const isImage = mime.startsWith('image/');
                          const isAudio = mime.startsWith('audio/') || msg.media?.filename?.endsWith('.oga') || msg.media?.filename?.endsWith('.ogg') || msg.media?.filename?.endsWith('.mp3');
                          const isVideo = mime.startsWith('video/');

                          return (
                            <div
                              key={msg.id}
                              className={`flex ${msg.fromMe ? 'justify-end' : 'justify-start'}`}
                            >
                              <div
                                className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-xs shadow-md ${
                                  msg.fromMe
                                    ? 'bg-emerald-600 text-white rounded-br-xs'
                                    : 'bg-slate-800 text-slate-100 rounded-bl-xs border border-slate-700/60'
                                }`}
                              >
                                {/* Media Container */}
                                {mediaUrl && (
                                  <div className="mb-2">
                                    {isImage ? (
                                      <div className="space-y-1">
                                        <a href={mediaUrl} target="_blank" rel="noreferrer" title="Click to view full image in new tab">
                                          <img
                                            src={mediaUrl}
                                            crossOrigin="anonymous"
                                            loading="lazy"
                                            alt={msg.media?.filename || 'Photo'}
                                            className="max-w-xs max-h-64 rounded-xl object-cover bg-black/40 border border-black/20 hover:opacity-90 transition-opacity cursor-pointer shadow"
                                          />
                                        </a>
                                        <div className="flex items-center justify-between text-[10px] text-slate-300 px-0.5">
                                          <span className="truncate max-w-[150px]">{msg.media?.filename || 'Photo'}</span>
                                          <a href={mediaUrl} target="_blank" rel="noreferrer" className="text-emerald-300 hover:underline flex items-center gap-0.5">
                                            <ExternalLink className="h-2.5 w-2.5" /> Open
                                          </a>
                                        </div>
                                      </div>
                                    ) : isAudio ? (
                                      <div className="mb-1">
                                        <VoiceNotePlayer src={mediaUrl} />
                                      </div>
                                    ) : isVideo ? (
                                      <video
                                        controls
                                        className="max-w-xs max-h-64 rounded-xl bg-black/40"
                                        src={mediaUrl}
                                      />
                                    ) : (
                                      <a
                                        href={mediaUrl}
                                        target="_blank"
                                        rel="noreferrer"
                                        download={msg.media?.filename || 'document'}
                                        className="flex items-center gap-2.5 p-2 bg-black/30 rounded-xl border border-black/20 hover:bg-black/50 transition-colors"
                                      >
                                        <FileText className="h-5 w-5 text-emerald-300 shrink-0" />
                                        <div className="text-left overflow-hidden">
                                          <p className="text-xs font-semibold text-white truncate max-w-[180px]">
                                            {msg.media?.filename || 'Document Attachment'}
                                          </p>
                                          <span className="text-[10px] text-slate-300">Click to open / download</span>
                                        </div>
                                      </a>
                                    )}
                                  </div>
                                )}

                                {/* Message text */}
                                {msg.body && <p className="whitespace-pre-wrap">{msg.body}</p>}
                                {!msg.body && !mediaUrl && (
                                  <p className="italic opacity-80 text-[11px]">
                                    {msg.hasMedia ? '🎵 [Voice Note / Audio Message]' : '[Message]'}
                                  </p>
                                )}

                                <div
                                  className={`mt-1 text-[9px] flex items-center justify-end gap-1 ${
                                    msg.fromMe ? 'text-emerald-200' : 'text-slate-400'
                                  }`}
                                >
                                  <span>
                                    {new Date(msg.timestamp).toLocaleTimeString([], {
                                      hour: '2-digit',
                                      minute: '2-digit',
                                    })}
                                  </span>
                                  {msg.fromMe && <CheckCheck className="h-3 w-3" />}
                                </div>
                              </div>
                            </div>
                          );
                        })
                      )}
                      <div ref={messagesEndRef} />
                    </div>

                    {/* Message Composer with Media Upload & Send */}
                    <form onSubmit={handleSendChatMessage} className="p-3 border-t border-slate-800 bg-slate-900/40 flex items-center gap-2">
                      {/* Media File Picker */}
                      <label
                        className={`cursor-pointer p-2.5 rounded-lg border border-slate-800 bg-slate-950 text-slate-400 hover:text-emerald-400 hover:border-emerald-500/50 hover:bg-slate-900 transition-all flex items-center justify-center shrink-0 ${
                          uploadingMedia ? 'opacity-50 pointer-events-none' : ''
                        }`}
                        title="Attach Photo, Voice Note, Document, or Video"
                      >
                        {uploadingMedia ? <RefreshCw className="h-4 w-4 animate-spin text-emerald-400" /> : <Paperclip className="h-4 w-4" />}
                        <input
                          type="file"
                          className="hidden"
                          onChange={handleSendMediaFile}
                          disabled={uploadingMedia}
                          accept="image/*,audio/*,video/*,application/pdf,.doc,.docx"
                        />
                      </label>

                      <input
                        type="text"
                        placeholder={uploadingMedia ? 'Uploading media attachment...' : 'Type a WhatsApp message...'}
                        value={chatInputText}
                        onChange={(e) => setChatInputText(e.target.value)}
                        disabled={uploadingMedia}
                        className="flex-1 rounded-lg bg-slate-950 px-3.5 py-2.5 text-xs text-slate-100 border border-slate-800 focus:border-emerald-500 focus:outline-none"
                      />
                      <button
                        type="submit"
                        disabled={sendingMessage || uploadingMedia || !chatInputText.trim()}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-emerald-500 transition-colors disabled:opacity-50 shrink-0 shadow-md"
                      >
                        {sendingMessage ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                        <span>Send</span>
                      </button>
                    </form>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-slate-500 text-xs">
                    <MessageSquare className="h-10 w-10 mb-2 text-slate-700" />
                    Select a conversation from the left to read messages and reply.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: CONTACTS DIRECTORY */}
        {activeTab === 'contacts' && (
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-emerald-400" />
                  <h3 className="text-sm font-bold text-white">WhatsApp Contacts Directory</h3>
                </div>

                {/* Contacts Session Switcher */}
                <div className="flex items-center gap-1.5 bg-slate-950 px-2 py-1 rounded-lg border border-slate-800">
                  <span className="text-[10px] text-slate-400 font-medium">Line:</span>
                  <select
                    value={selectedSessionId}
                    onChange={(e) => handleSwitchSession(e.target.value)}
                    className="bg-transparent text-xs text-emerald-400 font-semibold focus:outline-none cursor-pointer"
                  >
                    {sessions.map((sess) => (
                      <option key={sess.id} value={sess.id} className="bg-slate-900 text-white">
                        {sess.label || sess.sessionName} ({sess.connectedPhone ? `+${sess.connectedPhone}` : sess.status})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Filter Tabs */}
                <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-[11px]">
                  <button
                    type="button"
                    onClick={() => setContactFilterType('saved')}
                    className={`px-2.5 py-1 rounded-md font-semibold transition-colors cursor-pointer ${
                      contactFilterType === 'saved'
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Saved Phone Contacts ({contacts.filter((c) => c.isMyContact).length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setContactFilterType('all')}
                    className={`px-2.5 py-1 rounded-md font-semibold transition-colors cursor-pointer ${
                      contactFilterType === 'all'
                        ? 'bg-slate-800 text-white shadow-sm'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    All ({contacts.length})
                  </button>
                </div>
              </div>

              <div className="relative w-72">
                <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-500" />
                <input
                  type="text"
                  placeholder="Search contacts by name or phone..."
                  value={searchContactQuery}
                  onChange={(e) => setSearchContactQuery(e.target.value)}
                  className="w-full rounded-lg bg-slate-950 pl-8 pr-3 py-1.5 text-xs text-slate-200 border border-slate-800 focus:border-emerald-500 focus:outline-none"
                />
              </div>
            </div>

              {loadingContacts ? (
                <div className="p-12 text-center text-slate-500 text-xs">
                  <RefreshCw className="h-6 w-6 animate-spin mx-auto text-emerald-500 mb-2" />
                  Loading contacts from WAHA...
                </div>
              ) : filteredContacts.length === 0 ? (
                <div className="p-12 text-center text-slate-500 text-xs border border-dashed border-slate-800 rounded-xl">
                  <Users className="h-8 w-8 mx-auto mb-2 text-slate-600" />
                  No contacts found in this filter view.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {filteredContacts.map((contact) => (
                    <div
                      key={contact.id}
                      className="rounded-lg border border-slate-800 bg-slate-900/40 p-3.5 flex items-center justify-between hover:border-slate-700 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-800 text-slate-300 font-bold text-xs shrink-0">
                          {contact.name ? contact.name.slice(0, 2).toUpperCase() : 'WA'}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <h4 className="text-xs font-bold text-white truncate">
                              {contact.name || contact.pushname || 'WhatsApp Contact'}
                            </h4>
                            {contact.isMyContact && (
                              <span className="shrink-0 text-[9px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.5 rounded">
                                Phone
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-emerald-400 font-mono flex items-center gap-1 mt-0.5">
                            <Phone className="h-2.5 w-2.5" />
                            <span>{contact.number ? `+${contact.number}` : contact.id}</span>
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0 ml-2">
                        <button
                          onClick={() => handleSendToOrders(contact)}
                          title="Convert this contact into a pre-filled COD Order"
                          className="inline-flex items-center gap-1 rounded-md bg-emerald-500/10 px-2 py-1 text-xs font-semibold text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20 transition-colors"
                        >
                          <ShoppingBag className="h-3 w-3" />
                          <span>Order</span>
                        </button>

                        <button
                          onClick={() => handleOpenSaveContact(contact)}
                          title="Save contact on phone and update name in database"
                          className="inline-flex items-center gap-1 rounded-md bg-blue-500/10 px-2 py-1 text-xs font-semibold text-blue-400 hover:bg-blue-500/20 border border-blue-500/20 transition-colors"
                        >
                          <UserPlus className="h-3 w-3" />
                          <span>Save</span>
                        </button>



                        <button
                          onClick={() => {
                            setSelectedChat({ id: contact.id, name: contact.name || contact.pushname, phoneNumber: contact.number });
                            if (activeSession) loadMessages(activeSession.id, contact.id);
                            setActiveTab('chats');
                          }}
                          className="inline-flex items-center gap-1 rounded-md bg-slate-800 px-2 py-1 text-xs font-semibold text-slate-300 hover:bg-slate-700 transition-colors"
                        >
                          <MessageSquare className="h-3 w-3" />
                          <span>Chat</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: BROADCAST CAMPAIGNS */}
          {activeTab === 'broadcast' && (
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Radio className="h-4 w-4 text-emerald-400" />
                  <h3 className="text-sm font-bold text-white">Broadcast Campaign Launcher</h3>
                </div>
                {storedDbContacts.length > 0 && (
                  <span className="text-[11px] font-semibold text-purple-400 bg-purple-500/10 px-2.5 py-1 rounded-full border border-purple-500/20">
                    {storedDbContacts.length} Contacts Saved in DB
                  </span>
                )}
              </div>

              {/* Inquired Contacts Stored in DB - Quick Import Card */}
              {storedDbContacts.length > 0 && (
                <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-lg bg-gradient-to-r from-purple-950/40 via-slate-900 to-slate-900 border border-purple-800/40 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-400 shrink-0">
                      <Megaphone className="h-4 w-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white flex items-center gap-2">
                        Stored WhatsApp Conversation Contacts ({storedDbContacts.length} in DB)
                        <span className="text-[9px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded font-mono">Persisted in DB</span>
                      </h4>
                      <p className="text-[11px] text-slate-400">
                        All contacts from your WhatsApp inbox are stored in the database. Promote future product releases and new collections to them anytime.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const phones = storedDbContacts
                        .map((l) => (l.phone ? (l.phone.startsWith('+') ? l.phone : `+${l.phone}`) : ''))
                        .filter(Boolean);
                      setCampaign({
                        ...campaign,
                        name: `Store Launch Promotion - ${new Date().toLocaleDateString()}`,
                        recipients: phones.join(', '),
                        templateBody: `Salam {{name}}! 🎁 New collection arrival at ${store.name || 'our shop'}! Reply YES to discover our new products with an exclusive 15% discount for you.`,
                      });
                    }}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-purple-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-purple-500 shadow-md transition-colors shrink-0 cursor-pointer"
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>Import Stored Contacts ({storedDbContacts.length})</span>
                  </button>
                </div>
              )}

              <form onSubmit={handleLaunchBroadcast} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Campaign Name</label>
                  <input
                    type="text"
                    value={campaign.name}
                    onChange={(e) => setCampaign({ ...campaign, name: e.target.value })}
                    className="w-full rounded-lg bg-slate-950 px-3 py-2 text-xs text-slate-200 border border-slate-800 focus:border-emerald-500 focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">
                    Recipients (comma-separated international phone numbers)
                  </label>
                  <textarea
                    rows={3}
                    placeholder="+212612345678, +212688990011"
                    value={campaign.recipients}
                    onChange={(e) => setCampaign({ ...campaign, recipients: e.target.value })}
                    className="w-full rounded-lg bg-slate-950 px-3 py-2 text-xs text-slate-200 border border-slate-800 focus:border-emerald-500 focus:outline-none font-mono"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">
                    Template Message Body (Supported Variables: {'{{name}}'}, {'{{order_number}}'}, {'{{cod_amount}}'}, {'{{city}}'})
                  </label>
                  <textarea
                    rows={3}
                    value={campaign.templateBody}
                    onChange={(e) => setCampaign({ ...campaign, templateBody: e.target.value })}
                    className="w-full rounded-lg bg-slate-950 px-3 py-2 text-xs text-slate-200 border border-slate-800 focus:border-emerald-500 focus:outline-none"
                    required
                  />
                </div>

                <div className="flex items-center justify-between pt-2">
                  <span className="text-xs text-slate-400">
                    Throttling: <strong className="text-slate-200">2000 ms</strong> between messages to ensure WhatsApp anti-ban compliance.
                  </span>

                  <button
                    type="submit"
                    disabled={isLaunching}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-500 transition-colors disabled:opacity-50"
                  >
                    {isLaunching ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
                    Launch Broadcast
                  </button>
                </div>
              </form>

              {launchSuccess && (
                <div className="flex items-center gap-2 text-xs text-emerald-400 bg-emerald-500/10 p-3 rounded-lg border border-emerald-500/20">
                  <CheckCircle2 className="h-4 w-4" />
                  Broadcast campaign queued successfully! Track delivery progress in Delivery Logs.
                </div>
              )}
            </div>
          )}

          {/* TAB 5: DELIVERY LOGS */}
          {activeTab === 'logs' && (
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden">
              <div className="p-4 border-b border-slate-800 flex items-center justify-between">
                <h3 className="text-sm font-bold text-white">Message Delivery Audit Trail</h3>
                <span className="text-xs text-slate-500">{deliveryLogs.length} total events</span>
              </div>

              {deliveryLogs.length === 0 ? (
                <div className="p-12 text-center text-slate-500 text-xs">
                  <Clock className="h-6 w-6 mx-auto mb-2 text-slate-600" />
                  No messages sent or logged yet.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-300">
                    <thead className="bg-slate-950/60 text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-800">
                      <tr>
                        <th className="px-4 py-3">Time</th>
                        <th className="px-4 py-3">Recipient</th>
                        <th className="px-4 py-3">Message Snippet</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3">External ID</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 font-sans">
                      {deliveryLogs.map((log) => (
                        <tr key={log.id} className="hover:bg-slate-800/30">
                          <td className="px-4 py-3 text-slate-500 font-mono text-[11px] whitespace-nowrap">
                            {formatDate(log.createdAt)}
                          </td>
                          <td className="px-4 py-3 font-mono font-medium text-slate-200">
                            {log.recipientPhone}
                          </td>
                          <td className="px-4 py-3 max-w-xs truncate text-slate-300">
                            {log.messageContent}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span
                              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                                log.status === 'delivered' || log.status === 'read'
                                  ? 'bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/30'
                                  : log.status === 'sent'
                                  ? 'bg-blue-500/10 text-blue-400 ring-1 ring-blue-500/30'
                                  : 'bg-rose-500/10 text-rose-400 ring-1 ring-rose-500/30'
                              }`}
                            >
                              {log.status === 'delivered' || log.status === 'read' ? (
                                <CheckCheck className="h-3 w-3" />
                              ) : (
                                <Check className="h-3 w-3" />
                              )}
                              {log.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-slate-500 font-mono text-[10px] truncate max-w-[120px]">
                            {log.externalMessageId || '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      {/* QR CODE SCANNER MODAL */}
      {showQrModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-150">
            <button
              onClick={handleCloseQrModal}
              className="absolute right-4 top-4 text-slate-400 hover:text-white transition-colors"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20 mb-3">
                <QrCode className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-white">Scan WhatsApp QR Code</h3>
              <p className="text-xs text-slate-400 mt-1">
                Open WhatsApp on your phone ➔ Settings / Linked Devices ➔ Link a Device ➔ Scan this QR code.
              </p>
            </div>

            {/* QR Display Area */}
            <div className="mt-6 flex flex-col items-center justify-center">
              {qrStatus === 'WORKING' ? (
                <div className="flex flex-col items-center justify-center h-64 w-64 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 p-6 text-center animate-in fade-in zoom-in-95">
                  <CheckCircle2 className="h-16 w-16 mb-3 text-emerald-400 animate-pulse" />
                  <span className="text-base font-bold text-white">Connected Successfully!</span>
                  <span className="text-xs text-emerald-300/80 mt-1">WhatsApp phone line is paired and ready.</span>
                </div>
              ) : qrData ? (
                <div className="flex flex-col items-center animate-in fade-in duration-200">
                  <div className="p-4 bg-white rounded-2xl shadow-2xl border-4 border-emerald-500/30">
                    <img
                      src={qrData}
                      alt="WhatsApp QR Code"
                      className="h-60 w-60 object-contain block"
                    />
                  </div>
                  <span className="text-xs font-semibold text-emerald-400 mt-3 flex items-center gap-1.5 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                    <Smartphone className="h-3.5 w-3.5" />
                    Scan with WhatsApp on your phone now
                  </span>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-64 w-64 rounded-2xl bg-slate-950 border border-slate-800 p-6 text-center">
                  <RefreshCw className="h-9 w-9 animate-spin text-emerald-500 mb-3" />
                  <span className="text-sm font-semibold text-white">Starting WhatsApp Engine...</span>
                  <span className="text-xs text-slate-400 mt-2">
                    QR code will appear in ~3 seconds.
                  </span>
                </div>
              )}

              {/* Status Indicator */}
              <div className="mt-5 flex items-center gap-2 text-xs">
                <span className="relative flex h-2 w-2">
                  <span
                    className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                      qrStatus === 'WORKING' ? 'bg-emerald-400' : 'bg-amber-400'
                    }`}
                  ></span>
                  <span
                    className={`relative inline-flex rounded-full h-2 w-2 ${
                      qrStatus === 'WORKING' ? 'bg-emerald-500' : 'bg-amber-500'
                    }`}
                  ></span>
                </span>
                <span className="text-slate-400">Live Engine Status:</span>
                <strong className="text-white font-mono uppercase tracking-wider">{qrStatus}</strong>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
              <span>Line: <strong className="text-slate-200">{qrModalSession?.label || qrModalSession?.sessionName}</strong></span>
              <button
                onClick={handleCloseQrModal}
                className="rounded-lg bg-slate-800 px-3.5 py-1.5 text-xs font-semibold text-slate-200 hover:bg-slate-700 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* NEW SESSION MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl relative">
            <button
              onClick={() => setShowAddModal(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-white transition-colors"
            >
              <X className="h-5 w-5" />
            </button>

            <h3 className="text-base font-bold text-white mb-1">Add WhatsApp Line</h3>
            <p className="text-xs text-slate-400 mb-4">
              Add a dedicated WhatsApp Business or confirmation phone line to this store.
            </p>

            <form onSubmit={handleCreateSession} className="space-y-4 text-xs">
              <div>
                <label className="block font-medium text-slate-300 mb-1">Phone Number (Optional)</label>
                <input
                  type="text"
                  placeholder="+212600112233"
                  value={newSessionPhone}
                  onChange={(e) => setNewSessionPhone(e.target.value)}
                  className="w-full rounded-lg bg-slate-950 px-3 py-2 text-slate-200 border border-slate-800 focus:border-emerald-500 focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-300 mb-1">Line Label / Agent Name</label>
                <input
                  type="text"
                  placeholder="e.g. Casablanca Support Line or Agent 01"
                  value={newSessionLabel}
                  onChange={(e) => setNewSessionLabel(e.target.value)}
                  className="w-full rounded-lg bg-slate-950 px-3 py-2 text-slate-200 border border-slate-800 focus:border-emerald-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block font-medium text-slate-300 mb-1">Engine</label>
                <select
                  value={newSessionEngine}
                  onChange={(e) => setNewSessionEngine(e.target.value)}
                  className="w-full rounded-lg bg-slate-950 px-3 py-2 text-slate-200 border border-slate-800 focus:border-emerald-500 focus:outline-none"
                >
                  <option value="NOWEB">NOWEB (Lightweight, No Chromium, Fast)</option>
                  <option value="WEBJS">WEBJS (WhatsApp Web Browser Emulation)</option>
                  <option value="GOWS">GOWS (Go-based High Throughput)</option>
                </select>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="defaultCheck"
                  checked={newSessionDefault}
                  onChange={(e) => setNewSessionDefault(e.target.checked)}
                  className="rounded bg-slate-950 border-slate-800 text-emerald-500 focus:ring-0"
                />
                <label htmlFor="defaultCheck" className="text-slate-300">
                  Set as store default line for automated order confirmations
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="rounded-lg bg-slate-800 px-3 py-2 font-semibold text-slate-300 hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-emerald-600 px-4 py-2 font-bold text-white hover:bg-emerald-500"
                >
                  Create & Open QR
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SAVE CONTACT TO PHONE & DB MODAL */}
      {showSaveContactModal && contactToSave && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl relative">
            <button
              onClick={() => setShowSaveContactModal(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-white transition-colors"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-400">
                <UserPlus className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Save Contact to Phone</h3>
                <p className="text-xs text-slate-400">Assign client name, save to Database & export directly to your Phone</p>
              </div>
            </div>

            {contactSaveResult && (
              <div
                className={`p-3 rounded-xl text-xs mb-4 border ${
                  contactSaveResult.success
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                    : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  {contactSaveResult.success ? (
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
                  ) : (
                    <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
                  )}
                  <span>{contactSaveResult.msg}</span>
                </div>
              </div>
            )}

            <form onSubmit={handleSaveContactSubmit} className="space-y-4 text-xs">
              {/* Client Phone Info */}
              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Client WhatsApp Phone Number
                </label>
                <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-emerald-400 font-mono">
                  <Phone className="h-4 w-4" />
                  <span>
                    {(() => {
                      const cleanPhone = (
                        contactToSave?.phoneNumber ||
                        contactToSave?.number ||
                        (contactToSave?.id?.includes('@c.us') ? contactToSave.id.replace('@c.us', '') : contactToSave?.id || '')
                      ).replace(/[^0-9]/g, '');
                      return cleanPhone ? `+${cleanPhone}` : 'Unknown Phone';
                    })()}
                  </span>
                </div>
              </div>

              {/* Client Name Input */}
              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  What is the client's name? <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={clientNameInput}
                  onChange={(e) => setClientNameInput(e.target.value)}
                  placeholder="e.g. Karim Tazi (Casablanca Client)"
                  className="w-full rounded-xl bg-slate-950 border border-slate-700 px-3 py-2.5 text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none text-xs"
                  autoFocus
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  This will update the contact's name in your database and download a standard vCard to add directly to your phone's address book.
                </p>
              </div>

              {/* Action buttons */}
              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowSaveContactModal(false)}
                  className="rounded-lg bg-slate-800 px-3.5 py-2 font-semibold text-slate-300 hover:bg-slate-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingContact || !clientNameInput.trim()}
                  className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 font-bold text-white hover:bg-blue-500 disabled:opacity-50 transition-colors shadow-lg shadow-blue-600/30"
                >
                  {isSavingContact ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Smartphone className="h-4 w-4" />
                      <span>Save to Phone & DB</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
