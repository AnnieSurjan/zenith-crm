import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI } from "@google/genai";
import { 
  Users, 
  Briefcase, 
  CheckSquare, 
  LayoutDashboard, 
  Layout,
  List,
  Plus, 
  Search, 
  Bell,
  TrendingUp,
  Clock,
  ChevronRight,
  MessageSquare,
  FileText,
  Phone,
  Mail,
  Building2,
  Calendar,
  Sparkles,
  ArrowUpRight,
  User,
  UserPlus,
  LogOut,
  Settings,
  ChevronLeft,
  Timer,
  Lock,
  Unlock,
  Moon,
  Sun,
  FileUp,
  Download,
  RefreshCw,
  Activity,
  Shield,
  BarChart3,
  ClipboardList,
  Bot,
  PenTool,
  Globe,
  ShieldCheck,
  Fingerprint,
  Key,
  Calculator,
  Flag,
  History,
  Paperclip,
  Megaphone,
  Settings2,
  CheckCircle2,
  XCircle,
  Zap,
  Cpu,
  ListChecks,
  Quote,
  Star
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  AreaChart, 
  Area,
  BarChart,
  Bar,
  Legend
} from 'recharts';
import { 
  BrowserRouter as Router, 
  Routes, 
  Route, 
  Link, 
  useNavigate, 
  useParams,
  useLocation
} from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths, startOfWeek, endOfWeek } from 'date-fns';
import { hu } from 'date-fns/locale';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { getNextStepSuggestion, generateEmailDraft } from './services/geminiService';
import { Client, Deal, Task, ClientDetail, Interaction, User as UserType, Invitation, AttendanceRecord } from './types';
import { translations } from './translations';

const LanguageContext = React.createContext<{
  lang: 'hu' | 'en';
  setLang: (lang: 'hu' | 'en') => void;
  t: (key: keyof typeof translations['hu']) => string;
}>({
  lang: 'hu',
  setLang: () => {},
  t: (key) => translations['hu'][key],
});

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Components ---

const EmailModal = ({ 
  isOpen, 
  onClose, 
  client, 
  onSent 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  client: ClientDetail; 
  onSent: () => void;
}) => {
  const [intent, setIntent] = useState('');
  const [draft, setDraft] = useState({ subject: '', body: '' });
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const handleGenerate = async () => {
    if (!intent.trim()) return;
    setIsGenerating(true);
    const fullDraft = await generateEmailDraft(client, intent);
    if (fullDraft) {
      const parts = fullDraft.split('---');
      const subject = parts[0].replace('Tárgy:', '').trim();
      const body = parts[1]?.trim() || parts[0].trim();
      setDraft({ subject, body });
    }
    setIsGenerating(false);
  };

  const handleSend = async () => {
    setIsSending(true);
    const res = await fetch('/api/email/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: client.id,
        subject: draft.subject,
        body: draft.body
      })
    });
    if (res.ok) {
      onSent();
      onClose();
    }
    setIsSending(false);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]"
          >
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <Mail className="w-5 h-5 text-emerald-500" /> AI Email Küldés
              </h3>
              <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
                <Plus className="w-6 h-6 rotate-45" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase">Mi a levél célja? (AI instrukció)</label>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    placeholder="Pl: Érdeklődés az ajánlat felől, vagy találkozó kérése..."
                    value={intent}
                    onChange={e => setIntent(e.target.value)}
                    className="flex-1 px-4 py-2 bg-slate-100 border-none rounded-xl focus:ring-2 focus:ring-emerald-500"
                  />
                  <button 
                    onClick={handleGenerate}
                    disabled={isGenerating || !intent}
                    className="bg-indigo-500 text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 disabled:opacity-50"
                  >
                    {isGenerating ? 'Generálás...' : <><Sparkles className="w-4 h-4" /> Draft</>}
                  </button>
                </div>
              </div>

              {draft.body && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-4"
                >
                  <div>
                    <label className="text-xs font-bold text-slate-400 uppercase">Tárgy</label>
                    <input 
                      type="text" 
                      value={draft.subject}
                      onChange={e => setDraft({ ...draft, subject: e.target.value })}
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-400 uppercase">Üzenet</label>
                    <textarea 
                      rows={10}
                      value={draft.body}
                      onChange={e => setDraft({ ...draft, body: e.target.value })}
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm leading-relaxed"
                    />
                  </div>
                </motion.div>
              )}
            </div>

            <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
              <button onClick={onClose} className="px-6 py-2 font-bold text-slate-500">Mégse</button>
              <button 
                onClick={handleSend}
                disabled={isSending || !draft.body}
                className="bg-emerald-500 text-white px-8 py-2 rounded-xl font-bold shadow-lg shadow-emerald-500/20 disabled:opacity-50 flex items-center gap-2"
              >
                {isSending ? 'Küldés...' : <><Mail className="w-4 h-4" /> Email Küldése</>}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

const Sidebar = ({ isCollapsed, onToggle }: { isCollapsed: boolean, onToggle: () => void }) => {
  const { t } = React.useContext(LanguageContext);
  const location = useLocation();
  const menuGroups = [
    {
      title: t('core'),
      items: [
        { icon: LayoutDashboard, label: t('dashboard'), path: '/dashboard' },
        { icon: Calendar, label: t('calendar'), path: '/calendar' },
        { icon: Clock, label: t('booking'), path: '/booking' },
      ]
    },
    {
      title: t('sales'),
      items: [
        { icon: Users, label: t('clients'), path: '/clients' },
        { icon: Briefcase, label: t('deals'), path: '/deals' },
        { icon: BarChart3, label: t('forecast'), path: '/forecast' },
      ]
    },
    {
      title: t('operations'),
      items: [
        { icon: CheckSquare, label: t('tasks'), path: '/tasks' },
        { icon: PenTool, label: t('documents'), path: '/documents' },
        { icon: ClipboardList, label: t('forms'), path: '/forms' },
        { icon: Megaphone, label: t('marketing'), path: '/marketing' },
      ]
    },
    {
      title: t('adminSection'),
      items: [
        { icon: UserPlus, label: t('team'), path: '/team' },
        { icon: Timer, label: t('attendance'), path: '/attendance' },
        { icon: Calculator, label: t('accounting'), path: '/accounting' },
        { icon: Settings2, label: t('settings'), path: '/settings' },
        { icon: Shield, label: t('security'), path: '/security' },
      ]
    }
  ];

  return (
    <motion.div 
      animate={{ width: isCollapsed ? 80 : 256 }}
      className="bg-slate-900 text-white h-screen fixed left-0 top-0 flex flex-col p-4 z-50 overflow-hidden"
    >
      <div className="flex items-center justify-between mb-8 px-2">
        <AnimatePresence mode="wait">
          {!isCollapsed && (
            <motion.div 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="flex items-center gap-3"
            >
              <Link to="/dashboard" className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center shrink-0">
                  <Briefcase className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="font-bold text-lg leading-tight">{t('appName')}</h1>
                  <p className="text-xs text-slate-400">{t('appSubtitle')}</p>
                </div>
              </Link>
            </motion.div>
          )}
          {isCollapsed && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center shrink-0 mx-auto"
            >
              <Briefcase className="w-6 h-6 text-white" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <nav className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-6">
        {menuGroups.map((group, idx) => (
          <div key={idx} className="space-y-2">
            {!isCollapsed && (
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-4 mb-2">
                {group.title}
              </p>
            )}
            <div className="space-y-1">
              {group.items.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    title={isCollapsed ? item.label : ''}
                    className={cn(
                      "flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200",
                      isActive 
                        ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20" 
                        : "text-slate-400 hover:bg-slate-800 hover:text-white",
                      isCollapsed && "justify-center px-0"
                    )}
                  >
                    <item.icon className="w-5 h-5 shrink-0" />
                    {!isCollapsed && <span className="font-medium whitespace-nowrap text-sm">{item.label}</span>}
                  </Link>
                );
              })}
            </div>
            {idx < menuGroups.length - 1 && !isCollapsed && (
              <div className="h-px bg-slate-800/50 mx-4 mt-4" />
            )}
          </div>
        ))}
      </nav>

      <div className="mt-auto space-y-2">
        <button 
          onClick={onToggle}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:bg-slate-800 hover:text-white transition-all duration-200"
          title={isCollapsed ? t('expand') : t('collapse')}
        >
          <motion.div
            animate={{ rotate: isCollapsed ? 180 : 0 }}
          >
            <ChevronLeft className="w-5 h-5 shrink-0" />
          </motion.div>
          {!isCollapsed && <span className="font-medium">{t('collapse')}</span>}
        </button>

        <Link 
          to="/profile"
          className={cn(
            "p-4 bg-slate-800/50 rounded-2xl border border-slate-700/50 flex items-center gap-3 hover:bg-slate-800 transition-colors",
            isCollapsed && "justify-center p-2"
          )}
        >
          <div className="w-8 h-8 bg-slate-700 rounded-full overflow-hidden shrink-0">
            <img src="https://picsum.photos/seed/admin/100/100" alt="Admin" referrerPolicy="no-referrer" />
          </div>
          {!isCollapsed && (
            <>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">Admin</p>
                <p className="text-[10px] text-slate-400">{t('profile')}</p>
              </div>
              <Settings className="w-4 h-4 text-slate-500" />
            </>
          )}
        </Link>
      </div>
    </motion.div>
  );
};

const Header = ({ title }: { title: string }) => {
  const { t, lang, setLang } = React.useContext(LanguageContext);
  const [isSubModalOpen, setIsSubModalOpen] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isChangingPlan, setIsChangingPlan] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isDark, setIsDark] = useState(() => document.body.classList.contains('dark'));
  const [notifications, setNotifications] = useState([
    { id: 1, title: lang === 'hu' ? 'Új feladat hozzárendelve' : 'New task assigned', time: '5 min', read: false, icon: CheckSquare, color: 'text-emerald-500' },
    { id: 2, title: lang === 'hu' ? 'Sikeres ajánlat lezárva' : 'Successful deal closed', time: '2 hours', read: false, icon: TrendingUp, color: 'text-blue-500' },
    { id: 3, title: lang === 'hu' ? 'Ügyfél visszajelzés érkezett' : 'Customer feedback received', time: 'Yesterday', read: true, icon: MessageSquare, color: 'text-amber-500' },
  ]);

  const toggleDarkMode = () => {
    const newDark = !isDark;
    setIsDark(newDark);
    if (newDark) {
      document.body.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.body.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      document.body.classList.add('dark');
      setIsDark(true);
    }
  }, []);

  const handleDownloadInvoices = () => {
    setIsDownloading(true);
    setTimeout(() => {
      setIsDownloading(false);
      alert(lang === 'hu' ? 'A legutóbbi számlák letöltése elindult (szimulált).' : 'Recent invoices download started (simulated).');
    }, 1500);
  };

  const handleChangePlan = () => {
    setIsChangingPlan(true);
    setTimeout(() => {
      setIsChangingPlan(false);
      alert(lang === 'hu' ? 'A csomagváltási kérelem rögzítve. Ügyfélszolgálatunk hamarosan keresni fogja Önt.' : 'Package change request recorded. Our customer service will contact you soon.');
    }, 1500);
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <header className="h-20 flex items-center justify-between px-8 bg-emerald-50/80 backdrop-blur-md sticky top-0 z-40 border-b border-emerald-100 dark:bg-slate-900/80 dark:border-slate-800">
      <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">{title}</h2>
      <div className="flex items-center gap-4">
        <button 
          onClick={() => setLang(lang === 'hu' ? 'en' : 'hu')}
          className="p-2 text-slate-500 hover:bg-emerald-100 dark:hover:bg-slate-800 rounded-full transition-colors flex items-center gap-2"
          title={lang === 'hu' ? 'English' : 'Magyar'}
        >
          <Globe className="w-5 h-5" />
          <span className="text-xs font-bold uppercase">{lang}</span>
        </button>
        <button 
          onClick={() => setIsSubModalOpen(true)}
          className="px-4 py-2 bg-amber-100 text-amber-700 rounded-xl font-bold text-sm hover:bg-amber-200 transition-colors flex items-center gap-2"
        >
          <Sparkles className="w-4 h-4" /> {t('subscription')}
        </button>
        <div className="relative">
          <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            placeholder={t('search')} 
            className="pl-10 pr-4 py-2 bg-white/80 border-none rounded-full text-sm focus:ring-2 focus:ring-emerald-500 transition-all w-64 shadow-sm"
          />
        </div>
        <button 
          onClick={toggleDarkMode}
          className="p-2 text-slate-500 hover:bg-emerald-100 dark:hover:bg-slate-800 rounded-full transition-colors"
          title={isDark ? t('lightMode') : t('darkMode')}
        >
          {isDark ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5" />}
        </button>
        <div className="relative">
          <button 
            onClick={() => setIsNotifOpen(!isNotifOpen)}
            className={cn(
              "p-2 rounded-full relative transition-colors",
              isNotifOpen ? "bg-emerald-100 text-emerald-600" : "text-slate-500 hover:bg-emerald-100"
            )}
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
            )}
          </button>

          <AnimatePresence>
            {isNotifOpen && (
              <>
                <div className="fixed inset-0 z-[-1]" onClick={() => setIsNotifOpen(false)} />
                <motion.div 
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden z-50"
                >
                  <div className="p-4 border-b border-slate-50 flex justify-between items-center">
                    <h4 className="font-bold text-slate-800">{t('notifications')}</h4>
                    <button 
                      onClick={() => setNotifications(notifications.map(n => ({ ...n, read: true })))}
                      className="text-[10px] font-bold text-emerald-600 uppercase hover:underline"
                    >
                      {t('markAllRead')}
                    </button>
                  </div>
                  <div className="max-h-96 overflow-y-auto divide-y divide-slate-50">
                    {notifications.map(n => (
                      <div key={n.id} className={cn("p-4 flex gap-3 hover:bg-slate-50 transition-colors cursor-pointer", !n.read && "bg-emerald-50/30")}>
                        <div className={cn("shrink-0 w-8 h-8 rounded-lg bg-white shadow-sm flex items-center justify-center", n.color)}>
                          <n.icon className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={cn("text-sm leading-tight mb-1", !n.read ? "font-bold text-slate-800" : "text-slate-600")}>{n.title}</p>
                          <p className="text-[10px] text-slate-400 font-medium">{n.time}</p>
                        </div>
                        {!n.read && <div className="w-2 h-2 bg-emerald-500 rounded-full mt-2"></div>}
                      </div>
                    ))}
                  </div>
                  <button className="w-full p-3 text-center text-xs font-bold text-slate-400 hover:text-emerald-600 transition-colors border-t border-slate-50">
                    {t('allNotifications')}
                  </button>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
        <Link to="/profile" className="w-10 h-10 bg-slate-200 rounded-full overflow-hidden border-2 border-white shadow-sm hover:opacity-80 transition-opacity">
          <img src="https://picsum.photos/seed/admin/100/100" alt="User" referrerPolicy="no-referrer" />
        </Link>
      </div>

      <AnimatePresence>
        {isSubModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSubModalOpen(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative bg-white rounded-3xl shadow-2xl w-full max-w-lg p-8"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold">{t('subscriptionDetails')}</h3>
                <button onClick={() => setIsSubModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                  <Plus className="w-6 h-6 rotate-45" />
                </button>
              </div>
              <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-2">
                <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                  <p className="text-xs font-bold text-emerald-600 uppercase mb-1">{t('activePlan')}</p>
                  <p className="text-xl font-bold text-emerald-900">Pro Business Plan</p>
                  <p className="text-xs text-emerald-600 mt-1">Következő számlázás: 2024. március 15.</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <p className="text-xs font-bold text-slate-400 uppercase mb-1">{t('monthlyFee')}</p>
                    <p className="font-bold">3.490 Ft / fő</p>
                  </div>
                  <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                    <p className="text-xs font-bold text-emerald-600 uppercase mb-1">{t('annualFee')}</p>
                    <p className="font-bold text-emerald-900">34.900 Ft / fő</p>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <h4 className="font-bold text-sm">Felhasználási adatok</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-500">Felhasználók</span>
                      <span className="font-bold">8 / 10</span>
                    </div>
                    <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-emerald-500 h-full w-[80%]"></div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-500">Tárhely</span>
                      <span className="font-bold">2.4 GB / 5 GB</span>
                    </div>
                    <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-blue-500 h-full w-[48%]"></div>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="font-bold text-sm">{t('billingDetails')}</h4>
                  <div className="text-sm text-slate-600 space-y-1 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <p className="font-bold text-slate-800">Zenith-CRM Kft.</p>
                    <p>Adószám: 12345678-2-42</p>
                    <p>1051 Budapest, Sas utca 1.</p>
                    <p>Fizetési mód: Bankkártya (**** 4242)</p>
                  </div>
                </div>
                <div className="pt-4 border-t border-slate-100 flex gap-3">
                  <button 
                    onClick={handleDownloadInvoices}
                    disabled={isDownloading}
                    className="flex-1 px-4 py-2 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition-colors disabled:opacity-50"
                  >
                    {isDownloading ? t('downloading') : t('downloadInvoices')}
                  </button>
                  <button 
                    onClick={handleChangePlan}
                    disabled={isChangingPlan}
                    className="flex-1 px-4 py-2 bg-emerald-500 text-white rounded-xl font-bold hover:bg-emerald-600 transition-colors disabled:opacity-50"
                  >
                    {isChangingPlan ? t('processing') : t('changePlan')}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </header>
  );
};

// --- Pages ---

const Dashboard = () => {
  const { t, lang } = React.useContext(LanguageContext);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [user, setUser] = useState<UserType | null>(null);
  const [activities, setActivities] = useState([
    { id: 1, user: 'Kovács János', action: lang === 'hu' ? 'új ajánlatot hozott létre' : 'created a new deal', target: 'Webshop fejlesztés', time: '10 min' },
    { id: 2, user: 'Nagy Petra', action: lang === 'hu' ? 'lezárt egy üzletet' : 'closed a deal', target: 'Marketing kampány', time: '1 hour' },
    { id: 3, user: 'Szabó Márk', action: lang === 'hu' ? 'feladatot fejezett be' : 'completed a task', target: 'Ügyfél hívása', time: '3 hours' },
  ]);
  const [isLocked, setIsLocked] = useState(() => {
    return localStorage.getItem('dashboard_locked') === 'true';
  });

  useEffect(() => {
    fetch('/api/deals').then(res => res.json()).then(setDeals);
    fetch('/api/tasks').then(res => res.json()).then(setTasks);
    fetch('/api/me').then(res => res.json()).then(setUser);
  }, []);

  const toggleLock = () => {
    const newState = !isLocked;
    setIsLocked(newState);
    localStorage.setItem('dashboard_locked', newState.toString());
  };

  const totalValue = deals.filter(d => d.status === 'won').reduce((acc, d) => acc + d.value, 0);
  const activeDeals = deals.filter(d => d.status !== 'won' && d.status !== 'lost').length;
  const wonDealsCount = deals.filter(d => d.status === 'won').length;
  const weeklyGoal = 10; 
  const progress = Math.min(Math.round((wonDealsCount / weeklyGoal) * 100), 100);

  const firstName = user?.name.split(' ')[0] || (lang === 'hu' ? 'Felhasználó' : 'User');

  return (
    <div className="relative min-h-full">
      <div className="absolute top-4 right-8 z-30 flex gap-3">
        <button 
          onClick={toggleLock}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-xl font-bold transition-all shadow-sm border",
            isLocked 
              ? "bg-emerald-500 text-white border-emerald-400 hover:bg-emerald-600" 
              : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
          )}
        >
          {isLocked ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
          {isLocked ? t('unlockDashboard') : t('hideDashboard')}
        </button>
      </div>

      <AnimatePresence mode="wait">
        {isLocked ? (
          <motion.div 
            key="locked"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="p-8 flex flex-col items-center justify-center min-h-[60vh] text-center"
          >
            <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-6">
              <Lock className="w-10 h-10 text-slate-400" />
            </div>
            <h3 className="text-2xl font-bold text-slate-800 mb-2">{t('dashboardLocked')}</h3>
            <p className="text-slate-500 max-w-md mb-8">
              {t('dashboardLockedDesc')}
            </p>
            <button 
              onClick={toggleLock}
              className="bg-emerald-500 text-white px-8 py-3 rounded-2xl font-bold shadow-lg shadow-emerald-500/20 hover:bg-emerald-600 transition-all flex items-center gap-2"
            >
              <Unlock className="w-5 h-5" /> {t('unlockNow')}
            </button>
          </motion.div>
        ) : (
          <motion.div 
            key="unlocked"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="p-8 space-y-8"
          >
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-slate-800">{t('welcomeUser').replace('{name}', firstName)} 👋</h2>
              <p className="text-slate-500">{t('welcomeSub')}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="glass-card p-6 flex items-center gap-4">
                <div className="p-3 bg-emerald-100 text-emerald-600 rounded-xl">
                  <TrendingUp className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm text-slate-500 font-medium">{t('totalRevenue')}</p>
                  <p className="text-2xl font-bold">{totalValue.toLocaleString()} Ft</p>
                </div>
              </div>
              <div className="glass-card p-6 flex items-center gap-4">
                <div className="p-3 bg-blue-100 text-blue-600 rounded-xl">
                  <Briefcase className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm text-slate-500 font-medium">{t('activeDeals')}</p>
                  <p className="text-2xl font-bold">{activeDeals} db</p>
                </div>
              </div>
              <div className="glass-card p-6 flex items-center gap-4">
                <div className="p-3 bg-amber-100 text-amber-600 rounded-xl">
                  <Clock className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm text-slate-500 font-medium">{t('todayTasks')}</p>
                  <p className="text-2xl font-bold">{tasks.length} db</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-8">
                <div className="glass-card overflow-hidden">
                  <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                    <h3 className="font-bold text-lg">{t('recentDeals')}</h3>
                    <Link to="/deals" className="text-emerald-600 text-sm font-medium hover:underline">{t('viewAll')}</Link>
                  </div>
                  <div className="divide-y divide-slate-50 dark:divide-slate-800">
                    {deals.slice(0, 5).map(deal => (
                      <div key={deal.id} className="p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-slate-800 dark:text-slate-200">{deal.title}</p>
                          <p className="text-xs text-slate-500">{deal.client_name}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-slate-900 dark:text-slate-100">{deal.value.toLocaleString()} Ft</p>
                          <span className={cn(
                            "text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider",
                            deal.status === 'won' ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" :
                            deal.status === 'lost' ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" :
                            "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                          )}>
                            {deal.status === 'prospect' ? 'Érdeklődő' : 
                             deal.status === 'offer_sent' ? 'Ajánlat kiküldve' :
                             deal.status === 'won' ? 'Megnyert' : 'Elvesztett'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="glass-card overflow-hidden">
                  <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                    <h3 className="font-bold text-lg">{t('upcomingTasks')}</h3>
                    <Link to="/tasks" className="text-emerald-600 text-sm font-medium hover:underline">{t('viewAll')}</Link>
                  </div>
                  <div className="divide-y divide-slate-50 dark:divide-slate-800">
                    {tasks.slice(0, 5).map(task => (
                      <div key={task.id} className="p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors flex items-center gap-4">
                        <div className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center text-slate-500">
                          <Calendar className="w-5 h-5" />
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-slate-800 dark:text-slate-200">{task.title}</p>
                          <p className="text-xs text-slate-500">{task.client_name}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs font-medium text-slate-400">
                            {format(new Date(task.due_date), 'MMM d.', { locale: hu })}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-8">
                <div className="glass-card p-6">
                  <div className="flex items-center gap-2 mb-6">
                    <Activity className="w-5 h-5 text-emerald-500" />
                    <h3 className="font-bold text-lg">{t('activityWall')}</h3>
                  </div>
                  <div className="space-y-6">
                    {activities.map(act => (
                      <div key={act.id} className="flex gap-3 relative before:absolute before:left-4 before:top-8 before:bottom-[-24px] before:w-0.5 before:bg-slate-100 dark:before:bg-slate-800 last:before:hidden">
                        <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0 z-10">
                          <User className="w-4 h-4 text-slate-400" />
                        </div>
                        <div>
                          <p className="text-sm text-slate-600 dark:text-slate-400">
                            <span className="font-bold text-slate-800 dark:text-slate-200">{act.user}</span> {act.action}
                          </p>
                          <p className="text-xs font-bold text-emerald-600 mt-0.5">{act.target}</p>
                          <p className="text-[10px] text-slate-400 mt-1">{act.time}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="glass-card p-6 bg-gradient-to-br from-emerald-500 to-teal-600 text-white">
                  <h3 className="font-bold text-lg mb-2">Heti célkitűzés</h3>
                  <p className="text-sm opacity-90 mb-4">
                    {wonDealsCount >= weeklyGoal 
                      ? 'Gratulálunk! Elérted a heti célkitűzést!' 
                      : `Már csak ${weeklyGoal - wonDealsCount} megnyert ajánlat kell a heti cél eléréséhez!`}
                  </p>
                  <div className="w-full bg-white/20 rounded-full h-2 mb-2">
                    <div className="bg-white h-full rounded-full transition-all duration-1000" style={{ width: `${progress}%` }}></div>
                  </div>
                  <p className="text-[10px] font-bold text-right">{progress}% Teljesítve</p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const ClientList = () => {
  const { t, lang } = React.useContext(LanguageContext);
  const [clients, setClients] = useState<Client[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newClient, setNewClient] = useState({ name: '', company: '', email: '', phone: '' });

  useEffect(() => {
    fetch('/api/clients').then(res => res.json()).then(setClients);
  }, []);

  const handleAddClient = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/clients', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newClient)
    });
    if (res.ok) {
      const data = await res.json();
      setClients([{ ...newClient, id: data.id, address: '', created_at: new Date().toISOString() }, ...clients]);
      setIsModalOpen(false);
      setNewClient({ name: '', company: '', email: '', phone: '' });
    }
  };

  const handleExportCSV = () => {
    const headers = ['Név', 'Cég', 'Email', 'Telefon', 'Cím', 'Létrehozva'];
    const rows = clients.map(c => [
      c.name,
      c.company || '',
      c.email || '',
      c.phone || '',
      c.address || '',
      format(new Date(c.created_at), 'yyyy-MM-dd HH:mm')
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `ugyfelek_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Ügyfelek</h2>
          <p className="text-slate-500">Kezeld az ügyfélkapcsolataidat egy helyen.</p>
        </div>
        <div className="flex gap-4">
          <label className="bg-white border border-slate-200 text-slate-600 px-4 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-slate-50 transition-colors cursor-pointer">
            <FileUp className="w-5 h-5" /> {t('importClients')}
            <input 
              type="file" 
              className="hidden" 
              accept=".csv,.xlsx" 
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  alert(lang === 'hu' ? `Fájl kiválasztva: ${file.name}. Az importálás elindult.` : `File selected: ${file.name}. Import started.`);
                }
              }} 
            />
          </label>
          <button 
            onClick={handleExportCSV}
            className="bg-white border border-slate-200 text-slate-600 px-4 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-slate-50 transition-colors"
          >
            <Download className="w-5 h-5" /> {t('exportClients')}
          </button>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-xl flex items-center gap-2 font-bold transition-all shadow-lg shadow-emerald-500/20"
          >
            <Plus className="w-5 h-5" /> Új ügyfél
          </button>
        </div>
      </div>

      <div className="glass-card overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100">
              <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Név / Cég</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Kapcsolat</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Létrehozva</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Műveletek</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {clients.map(client => (
              <tr key={client.id} className="hover:bg-slate-50 transition-colors group">
                <td className="px-6 py-4">
                  <Link to={`/clients/${client.id}`} className="block">
                    <p className="font-bold text-slate-800 group-hover:text-emerald-600 transition-colors">{client.name}</p>
                    <p className="text-xs text-slate-500 flex items-center gap-1">
                      <Building2 className="w-3 h-3" /> {client.company || 'Magánszemély'}
                    </p>
                  </Link>
                </td>
                <td className="px-6 py-4">
                  <div className="space-y-1">
                    <p className="text-sm text-slate-600 flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-slate-400" /> {client.email}
                    </p>
                    <p className="text-sm text-slate-600 flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-slate-400" /> {client.phone}
                    </p>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-slate-500">
                  {format(new Date(client.created_at), 'yyyy. MM. dd.')}
                </td>
                <td className="px-6 py-4 text-right">
                  <Link 
                    to={`/clients/${client.id}`}
                    className="inline-flex items-center gap-1 text-emerald-600 font-bold text-sm hover:underline"
                  >
                    {t('viewDetails')} <ChevronRight className="w-4 h-4" />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md p-8 overflow-hidden"
            >
              <h3 className="text-2xl font-bold mb-6">{t('addNewClient')}</h3>
              <form onSubmit={handleAddClient} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">{t('name')}</label>
                  <input 
                    required
                    type="text" 
                    value={newClient.name}
                    onChange={e => setNewClient({ ...newClient, name: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-100 border-none rounded-xl focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">{t('company')}</label>
                  <input 
                    type="text" 
                    value={newClient.company}
                    onChange={e => setNewClient({ ...newClient, company: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-100 border-none rounded-xl focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-1">{t('email')}</label>
                    <input 
                      type="email" 
                      value={newClient.email}
                      onChange={e => setNewClient({ ...newClient, email: e.target.value })}
                      className="w-full px-4 py-2 bg-slate-100 border-none rounded-xl focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-1">{t('phone')}</label>
                    <input 
                      type="text" 
                      value={newClient.phone}
                      onChange={e => setNewClient({ ...newClient, phone: e.target.value })}
                      className="w-full px-4 py-2 bg-slate-100 border-none rounded-xl focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>
                <div className="pt-4 flex gap-3">
                  <button 
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-xl transition-colors"
                  >
                    {t('cancel')}
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl transition-all shadow-lg shadow-emerald-500/20"
                  >
                    {t('save')}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

const ClientDetailView = () => {
  const { id } = useParams();
  const [client, setClient] = useState<ClientDetail | null>(null);
  const [aiSuggestion, setAiSuggestion] = useState<string>('');
  const [loadingAi, setLoadingAi] = useState(false);
  const [newNote, setNewNote] = useState('');
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [newTask, setNewTask] = useState({ 
    title: '', 
    due_date: format(new Date(), 'yyyy-MM-dd'),
    type: 'other',
    priority: 'medium'
  });
  const [documents, setDocuments] = useState([
    { id: 1, name: 'Szerződés_2024.pdf', size: '1.2 MB', date: '2024. 01. 15.' },
    { id: 2, name: 'Ajánlat_v2.docx', size: '450 KB', date: '2024. 02. 10.' },
  ]);

  const fetchClient = () => {
    fetch(`/api/clients/${id}`).then(res => res.json()).then(setClient);
  };

  useEffect(() => {
    fetchClient();
  }, [id]);

  const handleSyncEmails = () => {
    setIsSyncing(true);
    setTimeout(() => {
      setIsSyncing(false);
      alert('Email szinkronizálás befejeződött. 3 új levél importálva.');
    }, 2000);
  };

  const handleGetAiSuggestion = async () => {
    if (!client) return;
    setLoadingAi(true);
    const suggestion = await getNextStepSuggestion(client);
    setAiSuggestion(suggestion || '');
    setLoadingAi(false);
  };

  const handleAddNote = async () => {
    if (!newNote.trim()) return;
    const res = await fetch('/api/interactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ client_id: id, type: 'note', content: newNote })
    });
    if (res.ok) {
      const data = await res.json();
      setClient(prev => prev ? {
        ...prev,
        interactions: [{ id: data.id, client_id: Number(id), type: 'note', content: newNote, created_at: new Date().toISOString() }, ...prev.interactions]
      } : null);
      setNewNote('');
    }
  };

  const handleCreateInvoice = async (dealId: number, provider: 'Számlázz.hu' | 'Billingo') => {
    const res = await fetch('/api/invoicing/create-draft', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ deal_id: dealId, provider })
    });
    const data = await res.json();
    alert(data.message);
  };

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...newTask, client_id: Number(id), assigned_to: 1 })
    });
    if (res.ok) {
      const data = await res.json();
      const task: Task = { 
        id: data.id, 
        client_id: Number(id), 
        title: newTask.title, 
        due_date: newTask.due_date, 
        completed: false, 
        created_at: new Date().toISOString(),
        type: newTask.type as any,
        priority: newTask.priority as any,
        status: 'new',
        history: [{ user: 'Admin', action: 'Létrehozva', time: new Date().toISOString() }],
        attachments: []
      };
      setClient(prev => prev ? {
        ...prev,
        tasks: [task, ...prev.tasks]
      } : null);
      setIsTaskModalOpen(false);
      setNewTask({ 
        title: '', 
        due_date: format(new Date(), 'yyyy-MM-dd'),
        type: 'other',
        priority: 'medium'
      });
    }
  };

  if (!client) return <div className="p-8">Betöltés...</div>;

  return (
    <div className="p-8 space-y-8">
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-6">
          <div className="w-20 h-20 bg-slate-200 rounded-3xl overflow-hidden border-4 border-white shadow-md">
            <img src={`https://picsum.photos/seed/${client.id}/200/200`} alt={client.name} referrerPolicy="no-referrer" />
          </div>
          <div>
            <h2 className="text-3xl font-bold text-slate-800">{client.name}</h2>
            <p className="text-slate-500 flex items-center gap-2">
              <Building2 className="w-4 h-4" /> {client.company || 'Magánszemély'}
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={handleSyncEmails}
            disabled={isSyncing}
            className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            <RefreshCw className={cn("w-4 h-4", isSyncing && "animate-spin")} /> 
            {isSyncing ? 'Szinkronizálás...' : 'Email szinkron'}
          </button>
          <button 
            onClick={() => setIsEmailModalOpen(true)}
            className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-indigo-600 hover:bg-indigo-50 transition-colors flex items-center gap-2"
          >
            <Mail className="w-4 h-4" /> Email küldés
          </button>
          <button className="px-4 py-2 bg-white border border-slate-200 rounded-xl font-bold text-slate-600 hover:bg-slate-50 transition-colors">Szerkesztés</button>
          <button 
            onClick={() => setIsTaskModalOpen(true)}
            className="px-4 py-2 bg-emerald-500 text-white rounded-xl font-bold hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20"
          >
            Új feladat
          </button>
        </div>
      </div>

      <EmailModal 
        isOpen={isEmailModalOpen} 
        onClose={() => setIsEmailModalOpen(false)} 
        client={client} 
        onSent={fetchClient}
      />

      <AnimatePresence>
        {isTaskModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsTaskModalOpen(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md p-8"
            >
              <h3 className="text-2xl font-bold mb-6">Új feladat hozzáadása</h3>
              <form onSubmit={handleAddTask} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Feladat megnevezése</label>
                  <input 
                    required
                    type="text" 
                    value={newTask.title}
                    onChange={e => setNewTask({ ...newTask, title: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-100 border-none rounded-xl focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Típus</label>
                    <select 
                      value={newTask.type}
                      onChange={e => setNewTask({ ...newTask, type: e.target.value })}
                      className="w-full px-4 py-2 bg-slate-100 border-none rounded-xl focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="call">Hívás</option>
                      <option value="email">Email</option>
                      <option value="meeting">Találkozó</option>
                      <option value="admin">Admin</option>
                      <option value="other">Egyéb</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Prioritás</label>
                    <select 
                      value={newTask.priority}
                      onChange={e => setNewTask({ ...newTask, priority: e.target.value })}
                      className="w-full px-4 py-2 bg-slate-100 border-none rounded-xl focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="low">Alacsony</option>
                      <option value="medium">Közepes</option>
                      <option value="high">Magas</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Határidő</label>
                  <input 
                    required
                    type="date" 
                    value={newTask.due_date}
                    onChange={e => setNewTask({ ...newTask, due_date: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-100 border-none rounded-xl focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div className="pt-4 flex gap-3">
                  <button 
                    type="button"
                    onClick={() => setIsTaskModalOpen(false)}
                    className="flex-1 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-xl transition-colors"
                  >
                    Mégse
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl transition-all shadow-lg shadow-emerald-500/20"
                  >
                    Mentés
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* AI Suggestion Box */}
          <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl p-6 text-white shadow-xl shadow-indigo-500/20 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-10">
              <Sparkles className="w-32 h-32" />
            </div>
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="w-5 h-5" />
                <h3 className="font-bold uppercase tracking-wider text-xs opacity-80">AI Következő Lépés Javaslat</h3>
              </div>
              {aiSuggestion ? (
                <motion.p 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-lg font-medium leading-relaxed mb-4"
                >
                  "{aiSuggestion}"
                </motion.p>
              ) : (
                <p className="text-lg font-medium opacity-60 mb-4 italic">Kérj egy javaslatot a Gemini AI-tól az ügyfél előzményei alapján.</p>
              )}
              <button 
                onClick={handleGetAiSuggestion}
                disabled={loadingAi}
                className="bg-white text-indigo-600 px-6 py-2 rounded-full font-bold text-sm hover:bg-indigo-50 transition-all disabled:opacity-50"
              >
                {loadingAi ? 'Gondolkodom...' : 'Javaslat generálása'}
              </button>
            </div>
          </div>

          {/* Deals Section */}
          <div className="glass-card">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h3 className="font-bold text-lg">Folyamatban lévő ajánlatok</h3>
              <Plus className="w-5 h-5 text-slate-400 cursor-pointer hover:text-emerald-500" />
            </div>
            <div className="p-6 space-y-4">
              {client.deals.length > 0 ? client.deals.map(deal => (
                <div key={deal.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
                  <div>
                    <p className="font-bold text-slate-800">{deal.title}</p>
                    <p className="text-sm text-slate-500">{deal.value.toLocaleString()} Ft</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <span className={cn(
                        "text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider",
                        deal.status === 'won' ? "bg-emerald-100 text-emerald-700" :
                        deal.status === 'lost' ? "bg-red-100 text-red-700" :
                        "bg-blue-100 text-blue-700"
                      )}>
                        {deal.status === 'prospect' ? 'Érdeklődő' : 
                         deal.status === 'offer_sent' ? 'Ajánlat kiküldve' :
                         deal.status === 'won' ? 'Megnyert' : 'Elvesztett'}
                      </span>
                    </div>
                    {deal.status === 'won' && (
                      <div className="flex gap-2">
                        <button 
                          onClick={() => handleCreateInvoice(deal.id, 'Számlázz.hu')}
                          className="p-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-50"
                        >
                          Számlázz.hu
                        </button>
                        <button 
                          onClick={() => handleCreateInvoice(deal.id, 'Billingo')}
                          className="p-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-50"
                        >
                          Billingo
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )) : (
                <p className="text-center text-slate-400 py-4 italic">Nincs aktív ajánlat.</p>
              )}
            </div>
          </div>

          {/* Timeline Section */}
          <div className="glass-card">
            <div className="p-6 border-b border-slate-100">
              <h3 className="font-bold text-lg">Előzmények & Jegyzetek</h3>
            </div>
            <div className="p-6 space-y-6">
              <div className="flex gap-4">
                <input 
                  type="text" 
                  placeholder="Új jegyzet hozzáadása..." 
                  value={newNote}
                  onChange={e => setNewNote(e.target.value)}
                  className="flex-1 px-4 py-2 bg-slate-100 border-none rounded-xl focus:ring-2 focus:ring-emerald-500"
                />
                <button 
                  onClick={handleAddNote}
                  className="p-2 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-all"
                >
                  <Plus className="w-6 h-6" />
                </button>
              </div>
              <div className="space-y-6 relative before:absolute before:left-5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-100">
                {client.interactions.map(interaction => (
                  <div key={interaction.id} className="relative pl-12">
                    <div className="absolute left-0 top-1 w-10 h-10 bg-white border-2 border-slate-100 rounded-full flex items-center justify-center z-10">
                      {interaction.type === 'call' ? <Phone className="w-4 h-4 text-blue-500" /> :
                       interaction.type === 'email' ? <Mail className="w-4 h-4 text-amber-500" /> :
                       interaction.type === 'meeting' ? <Users className="w-4 h-4 text-purple-500" /> :
                       <MessageSquare className="w-4 h-4 text-slate-400" />}
                    </div>
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                      <div className="flex justify-between items-center mb-1">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                          {interaction.type === 'note' ? 'Jegyzet' : interaction.type}
                        </p>
                        <p className="text-[10px] text-slate-400">
                          {format(new Date(interaction.created_at), 'yyyy. MM. dd. HH:mm')}
                        </p>
                      </div>
                      <p className="text-slate-700">{interaction.content}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-8">
          {/* Contact Info */}
          <div className="glass-card p-6 space-y-4">
            <h3 className="font-bold text-lg mb-4">Kapcsolati adatok</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-slate-600">
                <Mail className="w-4 h-4 text-slate-400" />
                <span className="text-sm">{client.email}</span>
              </div>
              <div className="flex items-center gap-3 text-slate-600">
                <Phone className="w-4 h-4 text-slate-400" />
                <span className="text-sm">{client.phone}</span>
              </div>
              <div className="flex items-center gap-3 text-slate-600">
                <Building2 className="w-4 h-4 text-slate-400" />
                <span className="text-sm">{client.company || 'Nincs megadva'}</span>
              </div>
              <div className="flex items-center gap-3 text-slate-600">
                <FileText className="w-4 h-4 text-slate-400" />
                <span className="text-sm">{client.address || 'Nincs megadva'}</span>
              </div>
            </div>
          </div>

          {/* Documents Section */}
          <div className="glass-card p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-lg">Dokumentumok</h3>
              <button className="p-2 text-emerald-500 hover:bg-emerald-50 rounded-lg transition-colors">
                <FileUp className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-3">
              {documents.map(doc => (
                <div key={doc.id} className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800 flex items-center justify-between group">
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-slate-400" />
                    <div>
                      <p className="text-sm font-bold text-slate-700 dark:text-slate-300">{doc.name}</p>
                      <p className="text-[10px] text-slate-400">{doc.size} • {doc.date}</p>
                    </div>
                  </div>
                  <button className="p-2 text-slate-400 hover:text-emerald-500 opacity-0 group-hover:opacity-100 transition-all">
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Tasks Box */}
          <div className="glass-card">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
              <h3 className="font-bold text-lg dark:text-slate-100">Feladatok</h3>
              <Plus 
                onClick={() => setIsTaskModalOpen(true)}
                className="w-5 h-5 text-slate-400 cursor-pointer hover:text-emerald-500" 
              />
            </div>
            <div className="p-4 space-y-3">
              {client.tasks.map(task => (
                <div key={task.id} className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700 space-y-2">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-4 h-4 border-2 rounded flex items-center justify-center transition-all",
                      task.completed ? "bg-emerald-500 border-emerald-500 text-white" : "border-slate-200 dark:border-slate-600"
                    )}>
                      {task.completed && <CheckSquare className="w-3 h-3" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className={cn("text-sm font-bold text-slate-700 dark:text-slate-300 truncate", task.completed && "line-through opacity-50")}>{task.title}</p>
                        {task.priority === 'high' && <div className="w-2 h-2 rounded-full bg-red-500" />}
                      </div>
                      <p className="text-[10px] text-slate-400">{format(new Date(task.due_date), 'yyyy. MM. dd.')} • {task.type}</p>
                    </div>
                  </div>
                  {task.history && task.history.length > 0 && (
                    <div className="pl-7 space-y-1 border-l border-slate-100 dark:border-slate-800 ml-2">
                      {task.history.slice(-1).map((h, i) => (
                        <p key={i} className="text-[9px] text-slate-400 italic">
                          Utolsó: {h.action} ({format(new Date(h.time), 'HH:mm')})
                        </p>
                      ))}
                    </div>
                  )}
                  {task.attachments && task.attachments.length > 0 && (
                    <div className="flex flex-wrap gap-2 pl-7">
                      {task.attachments.map((a, i) => (
                        <div key={i} className="flex items-center gap-1 text-[10px] text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 px-1.5 py-0.5 rounded">
                          <Paperclip className="w-2.5 h-2.5" /> {a.name}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              {client.tasks.length === 0 && (
                <p className="text-center text-slate-400 py-4 text-sm italic">Nincs teendő.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const DealsPage = () => {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [view, setView] = useState<'kanban' | 'list'>('kanban');
  const { t } = React.useContext(LanguageContext);

  useEffect(() => {
    fetch('/api/deals').then(res => res.json()).then(setDeals);
  }, []);

  const columns = [
    { id: 'prospect', title: t('prospect') || 'Érdeklődő', color: 'bg-blue-500' },
    { id: 'offer_sent', title: t('offer_sent') || 'Ajánlat kiküldve', color: 'bg-amber-500' },
    { id: 'won', title: t('won') || 'Megnyert', color: 'bg-emerald-500' },
    { id: 'lost', title: t('lost') || 'Elvesztett', color: 'bg-rose-500' }
  ];

  const getColumnTotal = (status: string) => {
    return deals
      .filter(d => d.status === status)
      .reduce((sum, d) => sum + (d.value || 0), 0)
      .toLocaleString();
  };

  return (
    <div className="p-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
        <div>
          <h2 className="text-3xl font-bold text-slate-900">{t('deals')}</h2>
          <p className="text-slate-500">{t('dealsSub') || 'Kövesd nyomon az értékesítési tölcsért.'}</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="bg-slate-100 p-1 rounded-xl flex gap-1">
            <button 
              onClick={() => setView('kanban')}
              className={cn("px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2", view === 'kanban' ? "bg-white text-emerald-600 shadow-sm" : "text-slate-500 hover:text-slate-700")}
            >
              <Layout className="w-4 h-4" /> {t('kanbanView')}
            </button>
            <button 
              onClick={() => setView('list')}
              className={cn("px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2", view === 'list' ? "bg-white text-emerald-600 shadow-sm" : "text-slate-500 hover:text-slate-700")}
            >
              <List className="w-4 h-4" /> {t('listView')}
            </button>
          </div>
          <button className="bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-3 rounded-2xl flex items-center gap-2 font-bold transition-all shadow-xl shadow-emerald-500/20">
            <Plus className="w-5 h-5" /> {t('newDeal') || 'Új ajánlat'}
          </button>
        </div>
      </div>

      {view === 'kanban' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {columns.map(col => (
            <div key={col.id} className="flex flex-col h-full min-h-[600px]">
              <div className="flex items-center justify-between mb-6 px-2">
                <div className="flex items-center gap-3">
                  <div className={cn("w-2 h-2 rounded-full", col.color)} />
                  <h4 className="font-bold text-slate-900">{col.title}</h4>
                  <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                    {deals.filter(d => d.status === col.id).length}
                  </span>
                </div>
                <p className="text-xs font-bold text-slate-400">{getColumnTotal(col.id)} Ft</p>
              </div>
              <div className="flex-1 bg-slate-50/50 rounded-[32px] p-4 border border-dashed border-slate-200 space-y-4">
                {deals.filter(d => d.status === col.id).map(deal => (
                  <motion.div 
                    layoutId={String(deal.id)}
                    key={deal.id} 
                    className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all cursor-pointer group"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <p className="font-bold text-slate-800 group-hover:text-emerald-600 transition-colors leading-tight">{deal.title}</p>
                      <ArrowUpRight className="w-4 h-4 text-slate-300 group-hover:text-emerald-500 transition-colors" />
                    </div>
                    <p className="text-xs text-slate-500 mb-4">{deal.client_name}</p>
                    <div className="flex items-center justify-between mt-auto pt-3 border-t border-slate-50">
                      <p className="text-sm font-bold text-emerald-600">{(deal.value || 0).toLocaleString()} Ft</p>
                      <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center text-[10px] font-bold text-slate-500">
                        {deal.client_name?.split(' ').map(n => n[0]).join('')}
                      </div>
                    </div>
                  </motion.div>
                ))}
                <button className="w-full py-3 border-2 border-dashed border-slate-200 rounded-2xl text-slate-400 text-sm font-bold hover:border-emerald-200 hover:text-emerald-500 hover:bg-emerald-50/30 transition-all flex items-center justify-center gap-2">
                  <Plus className="w-4 h-4" /> {t('add')}
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="glass-card overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">{t('title') || 'Megnevezés'}</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">{t('client') || 'Ügyfél'}</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">{t('value') || 'Érték'}</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">{t('status') || 'Állapot'}</th>
                <th className="px-6 py-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {deals.map(deal => (
                <tr key={deal.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-6 py-4">
                    <p className="font-bold text-slate-800">{deal.title}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-slate-600">{deal.client_name}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm font-bold text-emerald-600">{(deal.value || 0).toLocaleString()} Ft</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className={cn(
                      "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
                      deal.status === 'won' ? "bg-emerald-100 text-emerald-600" :
                      deal.status === 'lost' ? "bg-rose-100 text-rose-600" :
                      deal.status === 'offer_sent' ? "bg-amber-100 text-amber-600" :
                      "bg-blue-100 text-blue-600"
                    )}>
                      {columns.find(c => c.id === deal.status)?.title}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="p-2 text-slate-400 hover:text-emerald-500 transition-colors">
                      <ArrowUpRight className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

const TasksPage = () => {
  const { t, lang } = React.useContext(LanguageContext);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [users, setUsers] = useState<UserType[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [newTask, setNewTask] = useState({ 
    client_id: '', 
    title: '', 
    due_date: format(new Date(), 'yyyy-MM-dd'), 
    assigned_to: '',
    type: 'other',
    priority: 'medium',
    status: 'new'
  });
  const [filters, setFilters] = useState({
    status: 'all',
    assignee: 'all',
    client: 'all',
    date: 'all'
  });

  useEffect(() => {
    fetch('/api/tasks').then(res => res.json()).then(data => {
      const enhancedTasks = data.map((t: Task) => ({
        ...t,
        type: t.type || ['call', 'email', 'meeting', 'admin'][Math.floor(Math.random() * 4)],
        priority: t.priority || ['low', 'medium', 'high'][Math.floor(Math.random() * 3)],
        status: t.status || ['new', 'in_progress', 'done', 'review'][Math.floor(Math.random() * 4)],
        history: [
          { user: 'Admin', action: 'Létrehozva', time: t.created_at },
          { user: 'Rendszer', action: 'Állapot módosítva: Új', time: t.created_at }
        ],
        attachments: []
      }));
      setTasks(enhancedTasks);
    });
    fetch('/api/users').then(res => res.json()).then(setUsers);
    fetch('/api/clients').then(res => res.json()).then(setClients);
  }, []);

  const handleToggleComplete = async (id: number, currentStatus: boolean) => {
    const res = await fetch(`/api/tasks/${id}/complete`, { method: 'PATCH' });
    if (res.ok) {
      setTasks(tasks.map(t => t.id === id ? { 
        ...t, 
        completed: !currentStatus, 
        status: !currentStatus ? 'done' : 'in_progress',
        history: [
          ...(t.history || []),
          { user: 'Admin', action: `Állapot módosítva: ${!currentStatus ? 'Kész' : 'Folyamatban'}`, time: new Date().toISOString() }
        ]
      } : t));
    }
  };

  const handleTaskAction = async (id: number, action: 'successful' | 'unsuccessful') => {
    // In a real app, this would be an API call
    setTasks(tasks.map(t => t.id === id ? { 
      ...t, 
      completed: true, 
      status: 'done',
      closure_type: action,
      history: [
        ...(t.history || []),
        { user: 'Admin', action: `Feladat lezárva: ${action === 'successful' ? 'Sikeres' : 'Sikertelen'}`, time: new Date().toISOString() }
      ]
    } : t));
    if (selectedTask?.id === id) {
      setSelectedTask(prev => prev ? { 
        ...prev, 
        completed: true, 
        status: 'done', 
        closure_type: action,
        history: [
          ...(prev.history || []),
          { user: 'Admin', action: `Feladat lezárva: ${action === 'successful' ? 'Sikeres' : 'Sikertelen'}`, time: new Date().toISOString() }
        ]
      } : null);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, taskId: number) => {
    const file = e.target.files?.[0];
    if (file) {
      const newAttachment = {
        name: file.name,
        url: '#',
        size: `${(file.size / 1024).toFixed(1)} KB`
      };
      setTasks(tasks.map(t => t.id === taskId ? {
        ...t,
        attachments: [...(t.attachments || []), newAttachment],
        history: [
          ...(t.history || []),
          { user: 'Admin', action: `Fájl csatolva: ${file.name}`, time: new Date().toISOString() }
        ]
      } : t));
      if (selectedTask?.id === taskId) {
        setSelectedTask(prev => prev ? {
          ...prev,
          attachments: [...(prev.attachments || []), newAttachment],
          history: [
            ...(prev.history || []),
            { user: 'Admin', action: `Fájl csatolva: ${file.name}`, time: new Date().toISOString() }
          ]
        } : null);
      }
    }
  };

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...newTask,
        client_id: Number(newTask.client_id),
        assigned_to: Number(newTask.assigned_to)
      })
    });
    if (res.ok) {
      const data = await res.json();
      const client = clients.find(c => c.id === Number(newTask.client_id));
      const user = users.find(u => u.id === Number(newTask.assigned_to));
      const task: Task = {
        id: data.id,
        client_id: Number(newTask.client_id),
        client_name: client?.name,
        assigned_to: Number(newTask.assigned_to),
        assignee_name: user?.name,
        title: newTask.title,
        due_date: newTask.due_date,
        completed: false,
        created_at: new Date().toISOString(),
        type: newTask.type as any,
        priority: newTask.priority as any,
        status: newTask.status as any,
        history: [{ user: 'Admin', action: 'Létrehozva', time: new Date().toISOString() }],
        attachments: []
      };
      setTasks([task, ...tasks]);
      setIsModalOpen(false);
      setNewTask({ 
        client_id: '', 
        title: '', 
        due_date: format(new Date(), 'yyyy-MM-dd'), 
        assigned_to: '',
        type: 'other',
        priority: 'medium',
        status: 'new'
      });
    }
  };

  const filteredTasks = tasks.filter(task => {
    if (filters.status !== 'all' && task.status !== filters.status) return false;
    if (filters.assignee !== 'all' && task.assigned_to?.toString() !== filters.assignee) return false;
    if (filters.client !== 'all' && task.client_id?.toString() !== filters.client) return false;
    return true;
  });

  const stats = {
    new: tasks.filter(t => t.status === 'new').length,
    in_progress: tasks.filter(t => t.status === 'in_progress').length,
    done: tasks.filter(t => t.status === 'done').length,
    review: tasks.filter(t => t.status === 'review').length,
  };

  const getPriorityColor = (p: string) => {
    switch(p) {
      case 'high': return 'bg-red-100 text-red-700';
      case 'medium': return 'bg-amber-100 text-amber-700';
      case 'low': return 'bg-emerald-100 text-emerald-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  return (
    <div className="p-8 space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">{t('tasks')}</h2>
          <p className="text-slate-500">{t('tasksSub')}</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-xl flex items-center gap-2 font-bold transition-all shadow-lg shadow-emerald-500/20"
        >
          <Plus className="w-5 h-5" /> {t('newTask')}
        </button>
      </div>

      {/* Status Tiles */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: t('statusNew'), count: stats.new, color: 'bg-blue-500', icon: Plus },
          { label: t('statusInProgress'), count: stats.in_progress, color: 'bg-amber-500', icon: Clock },
          { label: t('statusDone'), count: stats.done, color: 'bg-emerald-500', icon: CheckCircle2 },
          { label: t('statusReview'), count: stats.review, color: 'bg-purple-500', icon: ShieldCheck },
        ].map((tile, i) => (
          <div key={i} className="glass-card p-4 flex items-center gap-4">
            <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center text-white", tile.color)}>
              <tile.icon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{tile.label}</p>
              <p className="text-xl font-bold text-slate-800 dark:text-slate-100">{tile.count} db</p>
            </div>
          </div>
        ))}
      </div>

      <div className="glass-card overflow-hidden">
        <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-700 flex flex-wrap gap-4">
          <select 
            className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-emerald-500 dark:text-slate-200"
            value={filters.status}
            onChange={e => setFilters({...filters, status: e.target.value})}
          >
            <option value="all">{t('allStatuses')}</option>
            <option value="new">{t('statusNew')}</option>
            <option value="in_progress">{t('statusInProgress')}</option>
            <option value="done">{t('statusDone')}</option>
            <option value="review">{t('statusReview')}</option>
          </select>
          <select 
            className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-emerald-500 dark:text-slate-200"
            value={filters.assignee}
            onChange={e => setFilters({...filters, assignee: e.target.value})}
          >
            <option value="all">{t('allAssignees')}</option>
            {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
          </select>
        </div>
        <div className="divide-y divide-slate-50 dark:divide-slate-800">
          {filteredTasks.map(task => (
            <div key={task.id} className="p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors flex items-center gap-4 group">
              <button 
                onClick={() => handleToggleComplete(task.id, task.completed)}
                className={cn(
                  "w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all",
                  task.completed ? "bg-emerald-500 border-emerald-500 text-white" : "border-slate-200 dark:border-slate-700 text-transparent hover:border-emerald-500"
                )}
              >
                <CheckSquare className="w-4 h-4" />
              </button>
              <div className="flex-1 min-w-0 cursor-pointer" onClick={() => setSelectedTask(task)}>
                <div className="flex items-center gap-2 mb-1">
                  <span className={cn("text-[10px] font-bold uppercase px-1.5 py-0.5 rounded-md", getPriorityColor(task.priority || 'medium'))}>
                    {t(task.priority as any || 'medium')}
                  </span>
                  <span className="text-[10px] font-bold text-slate-400 uppercase bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded-md">
                    {t(task.type as any || 'other')}
                  </span>
                  <p className={cn("font-bold text-slate-800 dark:text-slate-200 truncate", task.completed && "line-through opacity-50")}>{task.title}</p>
                </div>
                <div className="flex items-center gap-4 text-xs text-slate-400">
                  <span className="flex items-center gap-1"><User className="w-3 h-3" /> {task.assignee_name}</span>
                  <span className="flex items-center gap-1"><Building2 className="w-3 h-3" /> {task.client_name}</span>
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {format(new Date(task.due_date), 'yyyy. MM. dd.')}</span>
                </div>
              </div>
              <button 
                onClick={() => setSelectedTask(task)}
                className="p-2 text-slate-300 hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 rounded-lg transition-all"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          ))}
          {filteredTasks.length === 0 && (
            <div className="p-12 text-center">
              <p className="text-slate-400 italic">{t('noTasksFound')}</p>
            </div>
          )}
        </div>
      </div>

      {/* Task Detail Sidebar/Modal */}
      <AnimatePresence>
        {selectedTask && (
          <div className="fixed inset-0 z-[100] flex justify-end">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedTask(null)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              className="relative w-full max-w-xl bg-white dark:bg-slate-900 h-full shadow-2xl flex flex-col"
            >
              <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
                <div className="flex items-center gap-3">
                  <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center text-white", getPriorityColor(selectedTask.priority || 'medium').split(' ')[0].replace('bg-', 'bg-').replace('-100', '-500'))}>
                    <CheckSquare className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg dark:text-slate-100">{selectedTask.title}</h3>
                    <p className="text-xs text-slate-500">#{selectedTask.id} • {t(selectedTask.type as any || 'other')}</p>
                  </div>
                </div>
                <button onClick={() => setSelectedTask(null)} className="text-slate-400 hover:text-slate-600">
                  <Plus className="w-6 h-6 rotate-45" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-8">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t('status')}</p>
                    <div className="flex items-center gap-2">
                      <div className={cn("w-2 h-2 rounded-full", 
                        selectedTask.status === 'new' ? 'bg-blue-500' :
                        selectedTask.status === 'in_progress' ? 'bg-amber-500' :
                        selectedTask.status === 'done' ? 'bg-emerald-500' : 'bg-purple-500'
                      )} />
                      <span className="font-bold text-slate-700 dark:text-slate-300">{t(selectedTask.status as any || 'new')}</span>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t('priority')}</p>
                    <span className={cn("px-2 py-0.5 rounded-md text-xs font-bold", getPriorityColor(selectedTask.priority || 'medium'))}>
                      {t(selectedTask.priority as any || 'medium')}
                    </span>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-bold text-sm flex items-center gap-2 dark:text-slate-200">
                    <History className="w-4 h-4 text-slate-400" /> {t('history')}
                  </h4>
                  <div className="space-y-4 relative before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-100 dark:before:bg-slate-800">
                    {selectedTask.history?.map((h, i) => (
                      <div key={i} className="relative pl-8">
                        <div className="absolute left-0 top-1.5 w-4 h-4 bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 rounded-full z-10" />
                        <p className="text-xs text-slate-600 dark:text-slate-400">
                          <span className="font-bold text-slate-800 dark:text-slate-200">{h.user}</span>: {h.action}
                        </p>
                        <p className="text-[10px] text-slate-400">{format(new Date(h.time), 'yyyy. MM. dd. HH:mm')}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h4 className="font-bold text-sm flex items-center gap-2 dark:text-slate-200">
                      <Paperclip className="w-4 h-4 text-slate-400" /> {t('attachments')}
                    </h4>
                    <label className="text-xs font-bold text-emerald-600 hover:underline flex items-center gap-1 cursor-pointer">
                      <Plus className="w-3 h-3" /> {t('upload')}
                      <input 
                        type="file" 
                        className="hidden" 
                        onChange={(e) => handleFileUpload(e, selectedTask.id)} 
                      />
                    </label>
                  </div>
                  <div className="grid grid-cols-1 gap-2">
                    {selectedTask.attachments?.length ? selectedTask.attachments.map((a, i) => (
                      <div key={i} className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700 flex items-center justify-between group">
                        <div className="flex items-center gap-3">
                          <FileText className="w-4 h-4 text-slate-400" />
                          <div>
                            <p className="text-xs font-bold text-slate-700 dark:text-slate-300">{a.name}</p>
                            <p className="text-[10px] text-slate-400">{a.size}</p>
                          </div>
                        </div>
                        <button className="p-1.5 text-slate-400 hover:text-emerald-500 opacity-0 group-hover:opacity-100 transition-all">
                          <Download className="w-4 h-4" />
                        </button>
                      </div>
                    )) : (
                      <p className="text-xs text-slate-400 italic text-center py-4 bg-slate-50 dark:bg-slate-800/30 rounded-xl border border-dashed border-slate-200 dark:border-slate-700">
                        {t('noAttachments')}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex gap-3">
                <button 
                  onClick={() => handleTaskAction(selectedTask.id, 'unsuccessful')}
                  className="flex-1 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-red-600 font-bold rounded-xl hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors flex items-center justify-center gap-2"
                >
                  <XCircle className="w-4 h-4" /> {t('unsuccessful')}
                </button>
                <button 
                  onClick={() => handleTaskAction(selectedTask.id, 'successful')}
                  className="flex-1 py-2.5 bg-emerald-500 text-white font-bold rounded-xl hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" /> {t('successful')}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-md p-8 overflow-hidden"
            >
              <h3 className="text-2xl font-bold mb-6 dark:text-slate-100">{t('newTask')}</h3>
              <form onSubmit={handleAddTask} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">{t('taskName')}</label>
                  <input 
                    required
                    type="text" 
                    value={newTask.title}
                    onChange={e => setNewTask({ ...newTask, title: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-100 dark:bg-slate-800 border-none rounded-xl focus:ring-2 focus:ring-emerald-500 dark:text-slate-200"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-1">{t('taskType')}</label>
                    <select 
                      value={newTask.type}
                      onChange={e => setNewTask({ ...newTask, type: e.target.value })}
                      className="w-full px-4 py-2 bg-slate-100 dark:bg-slate-800 border-none rounded-xl focus:ring-2 focus:ring-emerald-500 dark:text-slate-200"
                    >
                      <option value="call">{t('call')}</option>
                      <option value="email">{t('emailLabel')}</option>
                      <option value="meeting">{t('meeting')}</option>
                      <option value="admin">{t('adminLabel')}</option>
                      <option value="other">{t('other')}</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-1">{t('priority')}</label>
                    <select 
                      value={newTask.priority}
                      onChange={e => setNewTask({ ...newTask, priority: e.target.value })}
                      className="w-full px-4 py-2 bg-slate-100 dark:bg-slate-800 border-none rounded-xl focus:ring-2 focus:ring-emerald-500 dark:text-slate-200"
                    >
                      <option value="low">{t('low')}</option>
                      <option value="medium">{t('medium')}</option>
                      <option value="high">{t('high')}</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">{t('client')}</label>
                  <select 
                    required
                    value={newTask.client_id}
                    onChange={e => setNewTask({ ...newTask, client_id: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-100 dark:bg-slate-800 border-none rounded-xl focus:ring-2 focus:ring-emerald-500 dark:text-slate-200"
                  >
                    <option value="">{t('chooseClient')}</option>
                    {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-1">{t('assignee')}</label>
                    <select 
                      required
                      value={newTask.assigned_to}
                      onChange={e => setNewTask({ ...newTask, assigned_to: e.target.value })}
                      className="w-full px-4 py-2 bg-slate-100 dark:bg-slate-800 border-none rounded-xl focus:ring-2 focus:ring-emerald-500 dark:text-slate-200"
                    >
                      <option value="">{t('chooseAssignee')}</option>
                      {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-1">{t('deadline')}</label>
                    <input 
                      required
                      type="date" 
                      value={newTask.due_date}
                      onChange={e => setNewTask({ ...newTask, due_date: e.target.value })}
                      className="w-full px-4 py-2 bg-slate-100 dark:bg-slate-800 border-none rounded-xl focus:ring-2 focus:ring-emerald-500 dark:text-slate-200"
                    />
                  </div>
                </div>
                <button 
                  type="submit"
                  className="w-full bg-emerald-500 text-white py-3 rounded-xl font-bold hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20 mt-4"
                >
                  {t('saveTask')}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

const ProfilePage = () => {
  const [user, setUser] = useState<UserType | null>(null);

  useEffect(() => {
    fetch('/api/me').then(res => res.json()).then(setUser);
  }, []);

  if (!user) return <div className="p-8">Betöltés...</div>;

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="glass-card p-8 space-y-8">
        <div className="flex items-center gap-8">
          <div className="w-32 h-32 bg-slate-200 rounded-3xl overflow-hidden border-4 border-white shadow-xl">
            <img src={user.avatar} alt={user.name} referrerPolicy="no-referrer" />
          </div>
          <div>
            <h2 className="text-3xl font-bold text-slate-800">{user.name}</h2>
            <p className="text-slate-500 font-medium">{user.email}</p>
            <div className="mt-2 inline-block px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-bold uppercase tracking-wider">
              {user.role}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-8 border-t border-slate-100">
          <div className="space-y-4">
            <h3 className="font-bold text-lg">Személyes adatok</h3>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Teljes név</label>
              <input type="text" defaultValue={user.name} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Email cím</label>
              <input type="email" defaultValue={user.email} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl" />
            </div>
          </div>
          <div className="space-y-4">
            <h3 className="font-bold text-lg">Biztonság</h3>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Jelszó módosítása</label>
              <button className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl font-bold text-slate-600 hover:bg-slate-50 transition-colors text-left">
                Jelszó megváltoztatása...
              </button>
            </div>
            <div className="pt-4">
              <button className="w-full px-4 py-2 bg-red-50 text-red-600 border border-red-100 rounded-xl font-bold hover:bg-red-100 transition-colors flex items-center justify-center gap-2">
                <LogOut className="w-4 h-4" /> Kijelentkezés
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const TeamPage = () => {
  const [users, setUsers] = useState<UserType[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');

  useEffect(() => {
    fetch('/api/users').then(res => res.json()).then(setUsers);
    fetch('/api/invitations').then(res => res.json()).then(setInvitations);
  }, []);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/invitations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: inviteEmail, role: 'member' })
    });
    if (res.ok) {
      const data = await res.json();
      setInvitations([{ id: data.id, email: inviteEmail, role: 'member', status: 'pending', created_at: new Date().toISOString() }, ...invitations]);
      setIsModalOpen(false);
      setInviteEmail('');
    }
  };

  return (
    <div className="p-8 space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Csapat kezelése</h2>
          <p className="text-slate-500">Hívj meg munkatársakat és kezeld a jogosultságokat.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-emerald-500 text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-emerald-500/20"
        >
          <UserPlus className="w-5 h-5" /> Munkatárs invitálása
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-card overflow-hidden">
            <div className="p-6 border-b border-slate-100">
              <h3 className="font-bold text-lg">Aktív tagok</h3>
            </div>
            <div className="divide-y divide-slate-50">
              {users.map(u => (
                <div key={u.id} className="p-4 flex items-center gap-4">
                  <div className="w-10 h-10 bg-slate-200 rounded-full overflow-hidden">
                    <img src={u.avatar} alt={u.name} referrerPolicy="no-referrer" />
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-slate-800">{u.name}</p>
                    <p className="text-xs text-slate-500">{u.email}</p>
                  </div>
                  <div className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider shadow-sm" style={{
                    backgroundColor: u.role === 'admin' ? '#FEE2E2' : (u.role as string) === 'manager' ? '#FEF3C7' : '#D1FAE5',
                    color: u.role === 'admin' ? '#991B1B' : (u.role as string) === 'manager' ? '#92400E' : '#065F46'
                  }}>
                    {u.role}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="glass-card overflow-hidden">
            <div className="p-6 border-b border-slate-100">
              <h3 className="font-bold text-lg">Függőben lévő meghívók</h3>
            </div>
            <div className="divide-y divide-slate-50">
              {invitations.map(inv => (
                <div key={inv.id} className="p-4">
                  <p className="font-medium text-slate-800 text-sm">{inv.email}</p>
                  <div className="flex justify-between items-center mt-1">
                    <span className="text-[10px] text-amber-600 font-bold uppercase">Függőben</span>
                    <span className="text-[10px] text-slate-400">{format(new Date(inv.created_at), 'yyyy. MM. dd.')}</span>
                  </div>
                </div>
              ))}
              {invitations.length === 0 && (
                <p className="p-6 text-center text-slate-400 text-sm italic">Nincs függő meghívó.</p>
              )}
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsModalOpen(false)} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md p-8">
              <h3 className="text-2xl font-bold mb-6">Munkatárs invitálása</h3>
              <form onSubmit={handleInvite} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Email cím</label>
                  <input required type="email" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} className="w-full px-4 py-2 bg-slate-100 border-none rounded-xl focus:ring-2 focus:ring-emerald-500" />
                </div>
                <div className="pt-4 flex gap-3">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 px-4 py-2 bg-slate-100 text-slate-600 font-bold rounded-xl">Mégse</button>
                  <button type="submit" className="flex-1 px-4 py-2 bg-emerald-500 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/20">Küldés</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

const CalendarPage = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [tasks, setTasks] = useState<Task[]>([]);

  useEffect(() => {
    fetch('/api/tasks').then(res => res.json()).then(setTasks);
  }, []);

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const calendarDays = eachDayOfInterval({ start: startDate, end: endDate });

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));

  return (
    <div className="p-8 h-full flex flex-col">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Naptár</h2>
          <p className="text-slate-500">Kezeld a határidőket és találkozókat.</p>
        </div>
        <div className="flex items-center gap-4 bg-white p-2 rounded-2xl shadow-sm border border-slate-100">
          <button onClick={prevMonth} className="p-2 hover:bg-slate-50 rounded-xl transition-colors"><ChevronLeft className="w-5 h-5" /></button>
          <h3 className="font-bold text-lg min-w-[150px] text-center">{format(currentDate, 'yyyy. MMMM', { locale: hu })}</h3>
          <button onClick={nextMonth} className="p-2 hover:bg-slate-50 rounded-xl transition-colors"><ChevronRight className="w-5 h-5" /></button>
        </div>
      </div>

      <div className="flex-1 glass-card overflow-hidden flex flex-col">
        <div className="grid grid-cols-7 bg-slate-50 border-b border-slate-100">
          {['Hét', 'Ked', 'Sze', 'Csü', 'Pén', 'Szo', 'Vas'].map(day => (
            <div key={day} className="py-3 text-center text-xs font-bold text-slate-400 uppercase tracking-wider">{day}</div>
          ))}
        </div>
        <div className="flex-1 grid grid-cols-7">
          {calendarDays.map((day, idx) => {
            const dayTasks = tasks.filter(t => isSameDay(new Date(t.due_date), day));
            const isCurrentMonth = day.getMonth() === currentDate.getMonth();
            const isToday = isSameDay(day, new Date());

            return (
              <div key={idx} className={cn(
                "min-h-[120px] p-2 border-r border-b border-slate-50 flex flex-col gap-1",
                !isCurrentMonth && "bg-slate-50/50 opacity-40"
              )}>
                <div className="flex justify-between items-center mb-1">
                  <span className={cn(
                    "text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full",
                    isToday ? "bg-emerald-500 text-white" : "text-slate-500"
                  )}>
                    {format(day, 'd')}
                  </span>
                </div>
                <div className="flex-1 overflow-y-auto space-y-1">
                  {dayTasks.map(task => (
                    <div key={task.id} className="text-[10px] p-1 bg-blue-100 text-blue-700 rounded border border-blue-200 truncate font-medium" title={task.title}>
                      {task.title}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

const AttendancePage = () => {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [user, setUser] = useState<UserType | null>(null);
  const [activeRecord, setActiveRecord] = useState<AttendanceRecord | null>(null);

  const fetchRecords = () => {
    fetch('/api/attendance').then(res => res.json()).then(setRecords);
  };

  useEffect(() => {
    fetch('/api/me').then(res => res.json()).then(setUser);
    fetchRecords();
  }, []);

  useEffect(() => {
    if (user) {
      const today = new Date().toISOString().split('T')[0];
      const active = records.find(r => r.user_id === user.id && r.date === today && !r.clock_out);
      setActiveRecord(active || null);
    }
  }, [records, user]);

  const handleClockIn = async () => {
    if (!user) return;
    const res = await fetch('/api/attendance/clock-in', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: user.id })
    });
    if (res.ok) fetchRecords();
  };

  const handleClockOut = async () => {
    if (!activeRecord) return;
    const res = await fetch('/api/attendance/clock-out', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: activeRecord.id })
    });
    if (res.ok) fetchRecords();
  };

  const handleExportCSV = () => {
    const headers = ['Munkatárs', 'Dátum', 'Érkezés', 'Távozás', 'Időtartam'];
    const rows = records.map(r => [
      r.user_name,
      r.date,
      format(new Date(r.clock_in), 'HH:mm'),
      r.clock_out ? format(new Date(r.clock_out), 'HH:mm') : '-',
      r.clock_out ? `${Math.round((new Date(r.clock_out).getTime() - new Date(r.clock_in).getTime()) / 60000)} perc` : 'Folyamatban'
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `jelenleti_iv_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-8 space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Jelenléti ív</h2>
          <p className="text-slate-500">Kövesd nyomon a munkaidőt.</p>
        </div>
        <div className="flex gap-4">
          <button 
            onClick={handleExportCSV}
            className="bg-white border border-slate-200 text-slate-600 px-6 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-slate-50 transition-colors"
          >
            <FileText className="w-5 h-5" /> Exportálás CSV
          </button>
          {!activeRecord ? (
            <button 
              onClick={handleClockIn}
              className="bg-emerald-500 text-white px-6 py-2 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-emerald-500/20"
            >
              <Timer className="w-5 h-5" /> Munka megkezdése
            </button>
          ) : (
            <button 
              onClick={handleClockOut}
              className="bg-red-500 text-white px-6 py-2 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-red-500/20"
            >
              <LogOut className="w-5 h-5" /> Munka befejezése
            </button>
          )}
        </div>
      </div>

      {activeRecord && (
        <div className="bg-emerald-50 border border-emerald-100 p-6 rounded-3xl flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center animate-pulse">
              <Timer className="w-6 h-6" />
            </div>
            <div>
              <p className="text-emerald-800 font-bold text-lg">Jelenleg dolgozol</p>
              <p className="text-emerald-600 text-sm">Megkezdve: {format(new Date(activeRecord.clock_in), 'HH:mm')}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-2xl font-mono font-bold text-emerald-700">AKTÍV</p>
          </div>
        </div>
      )}

      <div className="glass-card overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100">
              <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Munkatárs</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Dátum</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Érkezés</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Távozás</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Időtartam</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {records.map(record => (
              <tr key={record.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4 font-bold text-slate-800">{record.user_name}</td>
                <td className="px-6 py-4 text-sm text-slate-600">{record.date}</td>
                <td className="px-6 py-4 text-sm text-slate-600">{format(new Date(record.clock_in), 'HH:mm')}</td>
                <td className="px-6 py-4 text-sm text-slate-600">
                  {record.clock_out ? format(new Date(record.clock_out), 'HH:mm') : '-'}
                </td>
                <td className="px-6 py-4 text-sm font-bold text-slate-700">
                  {record.clock_out ? (
                    `${Math.round((new Date(record.clock_out).getTime() - new Date(record.clock_in).getTime()) / 60000)} perc`
                  ) : 'Folyamatban'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const DocumentsPage = () => {
  const { t, lang } = React.useContext(LanguageContext);
  const [isSigning, setIsSigning] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<any>(null);
  const [signature, setSignature] = useState('');
  const docs = [
    { id: 1, name: 'Munkaszerződés - Kovács János', date: '2026.05.12', status: 'signed' },
    { id: 2, name: 'Titoktartási Nyilatkozat', date: '2026.05.14', status: 'pending' },
    { id: 3, name: 'Eszközátadási Jegyzőkönyv', date: '2026.05.15', status: 'draft' },
  ];

  const handleSign = (doc: any) => {
    setSelectedDoc(doc);
    setIsSigning(true);
  };

  const submitSignature = () => {
    if (!signature.trim()) return;
    alert(`${t('signedSuccessfully')} (${selectedDoc.name}): ${signature}`);
    setIsSigning(false);
    setSelectedDoc(null);
    setSignature('');
  };

  return (
    <div className="p-8 space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">{t('documents')}</h2>
          <p className="text-slate-500">{lang === 'hu' ? 'Kezeld a szerződéseket és írasd alá őket digitálisan.' : 'Manage contracts and sign them digitally.'}</p>
        </div>
        <button className="px-4 py-2 bg-emerald-500 text-white rounded-xl font-bold text-sm hover:bg-emerald-600 shadow-lg shadow-emerald-500/20 flex items-center gap-2">
          <Plus className="w-4 h-4" /> {lang === 'hu' ? 'Új dokumentum feltöltése' : 'Upload new document'}
        </button>
      </div>

      <div className="glass-card overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100">
              <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">{t('name')}</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">{lang === 'hu' ? 'Dátum' : 'Date'}</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">{lang === 'hu' ? 'Állapot' : 'Status'}</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">{lang === 'hu' ? 'Műveletek' : 'Actions'}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {docs.map(doc => (
              <tr key={doc.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-slate-400" />
                    <span className="font-bold text-slate-700">{doc.name}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-slate-500">{doc.date}</td>
                <td className="px-6 py-4">
                  <span className={cn(
                    "text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full",
                    doc.status === 'signed' ? "bg-emerald-100 text-emerald-700" :
                    doc.status === 'pending' ? "bg-amber-100 text-amber-700" :
                    "bg-slate-100 text-slate-500"
                  )}>
                    {doc.status === 'signed' ? (lang === 'hu' ? 'Aláírva' : 'Signed') : doc.status === 'pending' ? (lang === 'hu' ? 'Aláírásra vár' : 'Pending') : (lang === 'hu' ? 'Vázlat' : 'Draft')}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex gap-2">
                    {doc.status === 'pending' && (
                      <button 
                        onClick={() => handleSign(doc)}
                        className="p-2 hover:bg-emerald-50 text-emerald-600 rounded-lg transition-colors" 
                        title={t('signDocument')}
                      >
                        <PenTool className="w-4 h-4" />
                      </button>
                    )}
                    <button className="p-2 hover:bg-slate-100 text-slate-400 rounded-lg transition-colors" title={lang === 'hu' ? 'Letöltés' : 'Download'}>
                      <ArrowUpRight className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <AnimatePresence>
        {isSigning && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSigning(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md p-8"
            >
              <h3 className="text-2xl font-bold mb-2">{t('eSignature')}</h3>
              <p className="text-slate-500 text-sm mb-6">{t('document')}: <span className="font-bold text-slate-800">{selectedDoc?.name}</span></p>
              
              <div className="space-y-6">
                <div className="p-6 bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl h-40 flex items-center justify-center">
                  {signature ? (
                    <p className="text-3xl font-serif italic text-slate-800">{signature}</p>
                  ) : (
                    <p className="text-slate-400 text-sm italic">{t('signaturePlaceholder')}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">{t('name')}</label>
                  <input 
                    type="text" 
                    value={signature}
                    onChange={e => setSignature(e.target.value)}
                    placeholder="Pl: Kovács János"
                    className="w-full px-4 py-2 bg-slate-100 border-none rounded-xl focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div className="flex gap-3">
                  <button onClick={() => setIsSigning(false)} className="flex-1 px-4 py-2 bg-slate-100 text-slate-600 font-bold rounded-xl">{lang === 'hu' ? 'Mégse' : 'Cancel'}</button>
                  <button 
                    onClick={submitSignature}
                    disabled={!signature.trim()}
                    className="flex-1 px-4 py-2 bg-emerald-500 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/20 disabled:opacity-50"
                  >
                    {t('finalizeSignature')}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

const ForecastPage = () => {
  const data = [
    { name: 'Jan', revenue: 4500000, forecast: 4800000 },
    { name: 'Feb', revenue: 5200000, forecast: 5500000 },
    { name: 'Mar', revenue: 4800000, forecast: 6200000 },
    { name: 'Apr', revenue: 6100000, forecast: 6800000 },
    { name: 'May', revenue: 5900000, forecast: 7500000 },
    { name: 'Jun', revenue: 7200000, forecast: 8200000 },
  ];

  return (
    <div className="p-8 space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Forecast Riportok</h2>
          <p className="text-slate-500">Értékesítési előrejelzések és trendek.</p>
        </div>
        <div className="flex gap-3">
          <button className="px-4 py-2 bg-white border border-slate-200 rounded-xl font-bold text-sm text-slate-600 hover:bg-slate-50">
            Exportálás PDF
          </button>
          <button className="px-4 py-2 bg-emerald-500 text-white rounded-xl font-bold text-sm hover:bg-emerald-600 shadow-lg shadow-emerald-500/20">
            Új riport generálása
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="glass-card p-6">
          <h3 className="font-bold text-lg mb-6">Bevétel vs Előrejelzés</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Area type="monotone" dataKey="revenue" stroke="#10b981" fillOpacity={1} fill="url(#colorRev)" strokeWidth={3} />
                <Area type="monotone" dataKey="forecast" stroke="#94a3b8" fill="transparent" strokeDasharray="5 5" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-card p-6">
          <h3 className="font-bold text-lg mb-6">Pipeline Eloszlás</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="revenue" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

const BookingPage = () => {
  const timeSlots = ['09:00', '10:00', '11:00', '13:00', '14:00', '15:00', '16:00'];

  return (
    <div className="p-8 space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Online Időpontfoglaló</h2>
          <p className="text-slate-500">Kezeld az ügyfél találkozókat egy helyen.</p>
        </div>
        <button className="px-4 py-2 bg-emerald-500 text-white rounded-xl font-bold text-sm hover:bg-emerald-600 shadow-lg shadow-emerald-500/20 flex items-center gap-2">
          <Plus className="w-4 h-4" /> Foglalási link másolása
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 glass-card p-6">
          <div className="flex items-center justify-between mb-8">
            <h3 className="font-bold text-lg">Naptár nézet</h3>
            <div className="flex gap-2">
              <button className="p-2 hover:bg-slate-100 rounded-lg"><ChevronLeft className="w-5 h-5" /></button>
              <button className="p-2 hover:bg-slate-100 rounded-lg"><ChevronRight className="w-5 h-5" /></button>
            </div>
          </div>
          <div className="grid grid-cols-7 gap-px bg-slate-100 border border-slate-100 rounded-xl overflow-hidden">
            {['Hé', 'Ke', 'Sze', 'Csü', 'Pé', 'Szo', 'Va'].map(day => (
              <div key={day} className="bg-slate-50 p-4 text-center text-xs font-bold text-slate-400 uppercase">{day}</div>
            ))}
            {Array.from({length: 31}).map((_, i) => (
              <div key={i} className="bg-white p-4 min-h-[100px] hover:bg-slate-50 cursor-pointer transition-colors relative group">
                <span className="text-sm font-medium text-slate-600">{i + 1}</span>
                {i === 14 && (
                  <div className="mt-2 p-1 bg-emerald-100 text-emerald-700 text-[10px] font-bold rounded border border-emerald-200 truncate">
                    Ügyfél találkozó
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <div className="glass-card p-6">
            <h3 className="font-bold text-lg mb-4">Szabad időpontok</h3>
            <div className="space-y-2">
              {timeSlots.map(slot => (
                <button key={slot} className="w-full p-3 text-left border border-slate-100 rounded-xl hover:border-emerald-500 hover:bg-emerald-50 transition-all group flex justify-between items-center">
                  <span className="font-bold text-slate-700 group-hover:text-emerald-700">{slot}</span>
                  <Plus className="w-4 h-4 text-slate-300 group-hover:text-emerald-500" />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const FormsPage = () => {
  const forms = [
    { id: 1, name: 'Kapcsolati űrlap', responses: 45, status: 'active' },
    { id: 2, name: 'Ügyfél elégedettség', responses: 12, status: 'active' },
    { id: 3, name: 'Ajánlatkérés', responses: 89, status: 'draft' },
  ];

  return (
    <div className="p-8 space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Online Űrlapok</h2>
          <p className="text-slate-500">Hozz létre űrlapokat és gyűjts adatokat automatikusan.</p>
        </div>
        <button className="px-4 py-2 bg-emerald-500 text-white rounded-xl font-bold text-sm hover:bg-emerald-600 shadow-lg shadow-emerald-500/20 flex items-center gap-2">
          <Plus className="w-4 h-4" /> Új űrlap készítése
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {forms.map(form => (
          <div key={form.id} className="glass-card p-6 hover:shadow-lg transition-all group">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-slate-100 rounded-2xl group-hover:bg-emerald-100 transition-colors">
                <ClipboardList className="w-6 h-6 text-slate-500 group-hover:text-emerald-600" />
              </div>
              <span className={cn(
                "text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full",
                form.status === 'active' ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"
              )}>
                {form.status === 'active' ? 'Aktív' : 'Vázlat'}
              </span>
            </div>
            <h3 className="font-bold text-lg text-slate-800 mb-1">{form.name}</h3>
            <p className="text-sm text-slate-500 mb-6">{form.responses} beérkezett válasz</p>
            <div className="flex gap-2">
              <button className="flex-1 py-2 bg-slate-50 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-100 transition-colors">
                Szerkesztés
              </button>
              <button className="p-2 bg-slate-50 text-slate-600 rounded-xl hover:bg-slate-100 transition-colors">
                <ArrowUpRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const AccountingPage = () => {
  const { t } = React.useContext(LanguageContext);
  const [integrations, setIntegrations] = useState([
    { id: 'billingo', name: 'Billingo', icon: 'https://www.google.com/s2/favicons?domain=billingo.hu&sz=128', connected: false, desc: 'Automatikus számlázás és szinkronizáció.' },
    { id: 'szamlazz', name: 'Számlázz.hu', icon: 'https://www.google.com/s2/favicons?domain=szamlazz.hu&sz=128', connected: true, desc: 'Számlák generálása közvetlenül az ajánlatokból.' }
  ]);

  const toggleConnect = (id: string) => {
    setIntegrations(integrations.map(i => i.id === id ? { ...i, connected: !i.connected } : i));
  };

  return (
    <div className="p-8 space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">{t('accounting')}</h2>
        <p className="text-slate-500">{t('accountingSub')}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {integrations.map(item => (
          <div key={item.id} className="glass-card p-6 flex flex-col justify-between">
            <div className="flex items-start gap-4 mb-6">
              <div className="w-12 h-12 bg-white rounded-xl shadow-sm border border-slate-100 flex items-center justify-center overflow-hidden p-2 shrink-0">
                <img src={item.icon} alt={item.name} className="w-full h-full object-contain" referrerPolicy="no-referrer" />
              </div>
              <div>
                <h3 className="font-bold text-lg">{item.name}</h3>
                <p className="text-sm text-slate-500">{item.desc}</p>
              </div>
            </div>
            <div className="flex items-center justify-between pt-4 border-t border-slate-50">
              <div className="flex items-center gap-2">
                <div className={cn("w-2 h-2 rounded-full", item.connected ? "bg-emerald-500" : "bg-slate-300")} />
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  {item.connected ? t('connected') : 'Nincs kapcsolódva'}
                </span>
              </div>
              <button 
                onClick={() => toggleConnect(item.id)}
                className={cn(
                  "px-4 py-2 rounded-xl font-bold text-sm transition-all",
                  item.connected 
                    ? "bg-slate-100 text-slate-600 hover:bg-slate-200" 
                    : "bg-emerald-500 text-white hover:bg-emerald-600 shadow-lg shadow-emerald-500/20"
                )}
              >
                {item.connected ? 'Lecsatlakozás' : t('connect')}
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="glass-card p-8 bg-gradient-to-br from-slate-800 to-slate-900 text-white">
        <div className="flex items-center gap-3 mb-4">
          <Calculator className="w-6 h-6 text-emerald-400" />
          <h3 className="text-xl font-bold">Hogyan működik?</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-8">
          <div className="space-y-2">
            <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center font-bold text-emerald-400">1</div>
            <p className="font-bold">Kapcsold össze</p>
            <p className="text-sm text-slate-400">Add meg az API kulcsodat a kiválasztott könyvelőprogramhoz.</p>
          </div>
          <div className="space-y-2">
            <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center font-bold text-emerald-400">2</div>
            <p className="font-bold">Állítsd be</p>
            <p className="text-sm text-slate-400">Válaszd ki, melyik státusznál generálódjon automatikusan a számla.</p>
          </div>
          <div className="space-y-2">
            <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center font-bold text-emerald-400">3</div>
            <p className="font-bold">Automatizálj</p>
            <p className="text-sm text-slate-400">Élvezd, hogy a rendszer elvégzi helyetted a papírmunkát.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

const SecuritySettings = () => {
  return (
    <div className="p-8 space-y-8 max-w-4xl">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">Biztonsági Menedzsment</h2>
        <p className="text-slate-500">Kezeld a hozzáféréseket és a biztonsági szabályokat. (Dat-assist Kft. belső szabályzat alapján)</p>
      </div>

      <div className="space-y-6">
        <div className="glass-card p-6">
          <div className="flex items-center gap-3 mb-6">
            <Key className="w-5 h-5 text-emerald-500" />
            <h3 className="font-bold text-lg">Jelszó Szabályok</h3>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
              <div>
                <p className="font-bold text-slate-800">Kikényszerített jelszó-erősség</p>
                <p className="text-xs text-slate-500">Minimum 12 karakter, kis- és nagybetű, szám, speciális karakter.</p>
              </div>
              <div className="w-12 h-6 bg-emerald-500 rounded-full relative cursor-pointer">
                <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full shadow-sm"></div>
              </div>
            </div>
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
              <div>
                <p className="font-bold text-slate-800">Jelszó lejárati idő</p>
                <p className="text-xs text-slate-500">A felhasználóknak 90 naponta meg kell változtatniuk jelszavukat.</p>
              </div>
              <div className="w-12 h-6 bg-emerald-500 rounded-full relative cursor-pointer">
                <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full shadow-sm"></div>
              </div>
            </div>
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
              <div>
                <p className="font-bold text-slate-800">Előzmény nyilvántartás</p>
                <p className="text-xs text-slate-500">Az utolsó 5 jelszó nem használható újra.</p>
              </div>
              <div className="w-12 h-6 bg-emerald-500 rounded-full relative cursor-pointer">
                <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full shadow-sm"></div>
              </div>
            </div>
          </div>
        </div>

        <div className="glass-card p-6">
          <div className="flex items-center gap-3 mb-6">
            <Globe className="w-5 h-5 text-emerald-500" />
            <h3 className="font-bold text-lg">Hozzáférés Korlátozás</h3>
          </div>
          <div className="space-y-4">
            <div className="p-4 bg-slate-50 rounded-2xl">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="font-bold text-slate-800">IP alapú korlátozás</p>
                  <p className="text-xs text-slate-500">Csak a megadott IP címekről engedélyezett a belépés.</p>
                </div>
                <button className="text-emerald-600 text-xs font-bold hover:underline">+ Új IP hozzáadása</button>
              </div>
              <div className="flex flex-wrap gap-2">
                <span className="px-3 py-1 bg-white border border-slate-200 rounded-lg text-xs font-medium flex items-center gap-2">
                  192.168.1.1 <Plus className="w-3 h-3 rotate-45 cursor-pointer" />
                </span>
                <span className="px-3 py-1 bg-white border border-slate-200 rounded-lg text-xs font-medium flex items-center gap-2">
                  84.2.14.221 <Plus className="w-3 h-3 rotate-45 cursor-pointer" />
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
              <div>
                <p className="font-bold text-slate-800">Időalapú hozzáférés</p>
                <p className="text-xs text-slate-500">Belépés csak munkaidőben (H-P: 08:00 - 18:00).</p>
              </div>
              <div className="w-12 h-6 bg-slate-200 rounded-full relative cursor-pointer">
                <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full shadow-sm"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const FAQPage = () => {
  const { t, lang } = React.useContext(LanguageContext);
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const faqs = [
    {
      q: lang === 'hu' ? 'Milyen gyorsan lehet bevezetni a rendszert?' : 'How fast can the system be implemented?',
      a: lang === 'hu' ? 'Az alaprendszer azonnal használatba vehető. A testreszabás és az adatok importálása általában 3-5 munkanapot vesz igénybe.' : 'The basic system can be used immediately. Customization and data import usually take 3-5 business days.'
    },
    {
      q: lang === 'hu' ? 'Van lehetőség egyedi fejlesztésekre?' : 'Is there a possibility for custom development?',
      a: lang === 'hu' ? 'Igen, a Zenith-CRM moduláris felépítésű, így szinte bármilyen egyedi igényt ki tudunk szolgálni.' : 'Yes, Zenith-CRM is modular, so we can serve almost any custom need.'
    },
    {
      q: lang === 'hu' ? 'Biztonságban vannak az adataim?' : 'Is my data safe?',
      a: lang === 'hu' ? 'Adatait banki szintű titkosítással védjük, és napi rendszerességgel készítünk biztonsági mentéseket.' : 'Your data is protected with bank-level encryption, and we perform daily backups.'
    },
    {
      q: lang === 'hu' ? 'Milyen támogatást kapok?' : 'What support do I get?',
      a: lang === 'hu' ? 'Minden előfizetőnknek 24/7 email támogatást biztosítunk, a prémium csomagokhoz pedig dedikált kapcsolattartó jár.' : 'We provide 24/7 email support to all our subscribers, and premium plans include a dedicated account manager.'
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 p-8 md:p-20">
      <div className="max-w-3xl mx-auto">
        <Link to="/" className="inline-flex items-center gap-2 text-emerald-600 font-bold mb-12 hover:underline">
          <ChevronLeft className="w-4 h-4" /> {t('back')}
        </Link>
        <h1 className="text-4xl font-bold mb-12 text-slate-900">{t('faq')}</h1>
        <div className="space-y-4">
          {faqs.map((faq, i) => (
            <div key={i} className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
              <button 
                onClick={() => setOpenIndex(openIndex === i ? null : i)}
                className="w-full p-6 text-left flex items-center justify-between hover:bg-slate-50 transition-colors"
              >
                <span className="font-bold text-slate-800">{faq.q}</span>
                <Plus className={cn("w-5 h-5 text-emerald-500 transition-transform", openIndex === i && "rotate-45")} />
              </button>
              <AnimatePresence>
                {openIndex === i && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="px-6 pb-6 text-slate-600 leading-relaxed"
                  >
                    {faq.a}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const BlogPage = () => {
  const { t, lang } = React.useContext(LanguageContext);

  return (
    <div className="min-h-screen bg-white p-8 md:p-20">
      <div className="max-w-4xl mx-auto">
        <Link to="/" className="inline-flex items-center gap-2 text-emerald-600 font-bold mb-12 hover:underline">
          <ChevronLeft className="w-4 h-4" /> {t('back')}
        </Link>
        <article className="prose prose-slate max-w-none">
          <span className="text-emerald-600 font-bold uppercase tracking-widest text-xs">CRM Alapok • 2024. Február 24.</span>
          <h1 className="text-5xl font-bold mt-4 mb-8">Miért elengedhetetlen egy CRM rendszer a modern vállalkozások számára?</h1>
          
          <img 
            src="https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=1200&q=80" 
            alt="CRM Usage" 
            className="w-full h-[400px] object-cover rounded-[40px] mb-12"
            referrerPolicy="no-referrer"
          />

          <div className="text-xl text-slate-600 leading-relaxed space-y-6">
            <p>
              A mai felgyorsult üzleti világban az információ a legértékesebb valuta. Ha az ügyféladatok Excel táblákban, cetliken vagy a munkatársak fejében vannak, az hosszú távon fenntarthatatlan és kockázatos.
            </p>
            
            <h2 className="text-3xl font-bold text-slate-900 mt-12 mb-6">1. Minden adat egy helyen</h2>
            <p>
              A CRM (Customer Relationship Management) rendszer lényege, hogy minden interakciót rögzít. Legyen szó egy telefonhívásról, egy elküldött ajánlatról vagy egy panaszról, mindenki ugyanazt a naprakész információt látja.
            </p>

            <img 
              src="https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1200&q=80" 
              alt="Dashboard" 
              className="w-full h-[300px] object-cover rounded-3xl my-12"
              referrerPolicy="no-referrer"
            />

            <h2 className="text-3xl font-bold text-slate-900 mt-12 mb-6">2. Automatizált folyamatok</h2>
            <p>
              A Zenith-CRM segítségével az ismétlődő feladatok automatizálhatóak. A rendszer emlékeztet a határidőkre, kiküldi a hírleveleket, és segít az ajánlatok nyomon követésében. Ezzel rengeteg időt spórolhat meg, amit a valódi üzletépítésre fordíthat.
            </p>

            <h2 className="text-3xl font-bold text-slate-900 mt-12 mb-6">3. Pontos előrejelzések</h2>
            <p>
              Az adatok alapján a rendszer képes megmutatni, melyik értékesítési csatorna működik a legjobban, és mennyi bevétel várható a következő hónapokban. Ez a tudás elengedhetetlen a stratégiai döntésekhez.
            </p>
          </div>
        </article>
      </div>
    </div>
  );
};

const OnboardingModal = ({ onClose }: { onClose: () => void }) => {
  const { t, lang } = React.useContext(LanguageContext);
  const [step, setStep] = useState(1);

  const steps = [
    { title: t('onboardingWelcome'), desc: t('onboardingStep1'), icon: Sparkles },
    { title: lang === 'hu' ? 'Feladatok kezelése' : 'Task Management', desc: t('onboardingStep2'), icon: ListChecks },
    { title: lang === 'hu' ? 'Üzleti növekedés' : 'Business Growth', desc: t('onboardingStep3'), icon: TrendingUp },
  ];

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white w-full max-w-lg rounded-[40px] p-10 shadow-2xl text-center"
      >
        <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-3xl flex items-center justify-center mx-auto mb-8">
          {React.createElement(steps[step-1].icon, { className: "w-10 h-10" })}
        </div>
        <h2 className="text-3xl font-bold mb-4">{steps[step-1].title}</h2>
        <p className="text-slate-500 text-lg leading-relaxed mb-10">
          {steps[step-1].desc}
        </p>
        <div className="flex items-center justify-center gap-2 mb-10">
          {[1, 2, 3].map(i => (
            <div key={i} className={cn("h-2 rounded-full transition-all", step === i ? "w-8 bg-emerald-500" : "w-2 bg-slate-200")} />
          ))}
        </div>
        <button 
          onClick={() => step < 3 ? setStep(step + 1) : onClose()}
          className="w-full py-4 bg-emerald-500 text-white rounded-2xl font-bold text-lg hover:bg-emerald-600 transition-all shadow-xl shadow-emerald-500/20"
        >
          {step < 3 ? t('next') : t('finish')}
        </button>
      </motion.div>
    </div>
  );
};

const PrivacyPage = () => {
  const { t } = React.useContext(LanguageContext);
  return (
    <div className="min-h-screen bg-[#FFFBEB] p-8 md:p-20">
      <div className="max-w-3xl mx-auto bg-white p-12 rounded-3xl shadow-sm border border-slate-100">
        <Link to="/" className="inline-flex items-center gap-2 text-emerald-600 font-bold mb-12 hover:underline">
          <ChevronLeft className="w-4 h-4" /> {t('back')}
        </Link>
        <h1 className="text-4xl font-bold mb-8 text-slate-900">{t('privacyPolicy')}</h1>
        <div className="prose prose-slate max-w-none">
          <div className="text-lg leading-relaxed text-slate-600 whitespace-pre-wrap font-sans">
            {t('privacyDesc')}
          </div>
        </div>
        <div className="mt-12 pt-8 border-t border-slate-100">
          <p className="text-sm text-slate-400">
            {t('companyName')} • 8142 Úrhida, Avar utca 9. • {t('rightsReserved')}
          </p>
        </div>
      </div>
    </div>
  );
};

const TermsPage = () => {
  const { t } = React.useContext(LanguageContext);
  return (
    <div className="min-h-screen bg-[#FFFBEB] p-8 md:p-20">
      <div className="max-w-3xl mx-auto bg-white p-12 rounded-3xl shadow-sm border border-slate-100">
        <Link to="/" className="inline-flex items-center gap-2 text-emerald-600 font-bold mb-12 hover:underline">
          <ChevronLeft className="w-4 h-4" /> {t('back')}
        </Link>
        <h1 className="text-4xl font-bold mb-8 text-slate-900">{t('tos')}</h1>
        <div className="prose prose-slate max-w-none">
          <div className="text-lg leading-relaxed text-slate-600 whitespace-pre-wrap">
            {t('tosDesc')}
          </div>
        </div>
      </div>
    </div>
  );
};

const ChatBot = () => {
  const { lang, t } = React.useContext(LanguageContext);
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'bot', text: lang === 'hu' ? 'Szia! Én a Zenith AI asszisztens vagyok. Miben segíthetek ma?' : 'Hi! I am the Zenith AI assistant. How can I help you today?' }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSend = async () => {
    if (!input.trim() || isTyping) return;
    
    const userMessage = input.trim();
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setInput('');
    setIsTyping(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: userMessage,
        config: {
          systemInstruction: `You are Zenith AI, a helpful assistant for Zenith-CRM. 
          The user is currently using the Zenith-CRM application. 
          Respond in ${lang === 'hu' ? 'Hungarian' : 'English'}. 
          Be professional, concise, and helpful. 
          Zenith-CRM features: Client management, Deals tracking, Forecast reports, Appointment booking, Forms, Tasks, Team management, Attendance tracking, Document management with E-signature, and advanced Security settings.
          The company behind Zenith-CRM is Dat-assist Kft.`,
        },
      });

      const botText = response.text || (lang === 'hu' ? 'Elnézést, nem tudtam feldolgozni a kérést.' : 'Sorry, I could not process that request.');
      setMessages(prev => [...prev, { role: 'bot', text: botText }]);
    } catch (error) {
      console.error('ChatBot Error:', error);
      setMessages(prev => [...prev, { role: 'bot', text: lang === 'hu' ? 'Hiba történt a kommunikáció során.' : 'An error occurred during communication.' }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="fixed bottom-8 right-8 z-[100]">
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="absolute bottom-20 right-0 w-96 bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col h-[500px]"
          >
            <div className="p-4 bg-emerald-500 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                  <Bot className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-bold text-sm">Zenith AI</p>
                  <p className="text-[10px] opacity-80">{lang === 'hu' ? 'Online • Segítségre kész' : 'Online • Ready to help'}</p>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} className="hover:bg-white/20 p-1 rounded-lg transition-colors">
                <Plus className="w-5 h-5 rotate-45" />
              </button>
            </div>
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((m, i) => (
                <div key={i} className={cn(
                  "max-w-[80%] p-3 rounded-2xl text-sm",
                  m.role === 'bot' ? "bg-slate-100 text-slate-800 self-start rounded-tl-none" : "bg-emerald-500 text-white self-end ml-auto rounded-tr-none"
                )}>
                  {m.text}
                </div>
              ))}
              {isTyping && (
                <div className="bg-slate-100 text-slate-400 self-start p-3 rounded-2xl rounded-tl-none text-xs italic">
                  {lang === 'hu' ? 'Zenith AI gépel...' : 'Zenith AI is typing...'}
                </div>
              )}
            </div>
            <div className="p-4 border-t border-slate-50 flex gap-2">
              <input 
                type="text" 
                placeholder={lang === 'hu' ? 'Írj ide...' : 'Type here...'} 
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyPress={e => e.key === 'Enter' && handleSend()}
                className="flex-1 bg-slate-100 border-none rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-emerald-500"
              />
              <button 
                onClick={handleSend} 
                disabled={isTyping || !input.trim()}
                className="p-2 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-colors disabled:opacity-50"
              >
                <ArrowUpRight className="w-5 h-5" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <div className="flex items-center gap-4">
        {!isOpen && (
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white px-4 py-2 rounded-xl shadow-lg border border-slate-100 font-bold text-sm text-slate-700 hidden md:block"
          >
            {t('askZenith')}
          </motion.div>
        )}
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className="w-14 h-14 bg-emerald-500 text-white rounded-full shadow-xl shadow-emerald-500/40 flex items-center justify-center hover:scale-110 transition-transform"
        >
          <Bot className="w-7 h-7" />
        </button>
      </div>
    </div>
  );
};

const FeatureDetailModal = ({ feature, onClose, lang }: { feature: any, onClose: () => void, lang: string }) => {
  if (!feature) return null;
  const t = (key: string) => (translations as any)[lang][key] || key;

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 md:p-10 bg-slate-900/60 backdrop-blur-md"
      onClick={onClose}
    >
      <motion.div 
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        className="bg-white w-full max-w-5xl max-h-[90vh] rounded-[40px] overflow-hidden shadow-2xl flex flex-col md:flex-row"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex-1 bg-slate-50 p-8 md:p-12 flex flex-col justify-center">
          <div className="w-20 h-20 bg-emerald-500 text-white rounded-3xl flex items-center justify-center mb-8 shadow-lg shadow-emerald-500/20">
            <feature.icon className="w-10 h-10" />
          </div>
          <h2 className="text-4xl font-bold mb-6 text-slate-900">{feature.title}</h2>
          <p className="text-xl text-slate-500 leading-relaxed mb-8">
            {feature.longDesc || feature.desc}
          </p>
          <div className="space-y-4">
            {feature.features?.map((f: string, i: number) => (
              <div key={i} className="flex items-center gap-3 text-slate-700 font-medium">
                <div className="w-6 h-6 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center shrink-0">
                  <Plus className="w-4 h-4" />
                </div>
                {f}
              </div>
            ))}
          </div>
          <button 
            onClick={onClose}
            className="mt-12 px-8 py-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-all self-start"
          >
            {lang === 'hu' ? 'Bezárás' : 'Close'}
          </button>
        </div>
        <div className="flex-1 relative min-h-[300px] md:min-h-full">
          <img 
            src={feature.image} 
            alt={feature.title} 
            className="absolute inset-0 w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/40 to-transparent" />
        </div>
      </motion.div>
    </motion.div>
  );
};

const LandingPage = () => {
  const [lang, setLang] = useState<'hu' | 'en'>('hu');
  const [selectedFeature, setSelectedFeature] = useState<any>(null);
  const [isDark, setIsDark] = useState(false);
  const t = (key: keyof typeof translations['hu']) => translations[lang][key];

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  const features = [
    { 
      icon: Bot, 
      title: t('aiChatbot'), 
      desc: t('aiChatbotDesc'),
      longDesc: lang === 'hu' ? 'A Zenith-CRM AI asszisztense nem csak válaszol, de tanul is az ügyfélinterakciókból. Képes ajánlatokat generálni, időpontokat egyeztetni és előszűrni az érdeklődőket.' : 'Zenith-CRM\'s AI assistant doesn\'t just answer; it learns from customer interactions. It can generate offers, schedule appointments, and pre-screen leads.',
      image: 'https://images.unsplash.com/photo-1531746790731-6c087fecd05a?auto=format&fit=crop&w=800&q=80',
      features: lang === 'hu' ? ['24/7 elérhetőség', 'Többnyelvű támogatás', 'Értékesítési tölcsér integráció', 'Tanuló algoritmusok'] : ['24/7 availability', 'Multilingual support', 'Sales funnel integration', 'Learning algorithms']
    },
    { 
      icon: Calendar, 
      title: t('booking'), 
      desc: t('bookingDesc'),
      longDesc: lang === 'hu' ? 'Szüntesd meg az oda-vissza emailezést. Az ügyfeleid láthatják a szabad időpontjaidat és azonnal foglalhatnak, ami automatikusan bekerül a naptáradba.' : 'Eliminate back-and-forth emailing. Your clients can see your free slots and book instantly, which automatically appears in your calendar.',
      image: 'https://images.unsplash.com/photo-1506784365847-bbad939e9335?auto=format&fit=crop&w=800&q=80',
      features: lang === 'hu' ? ['Automatikus szinkronizálás', 'Emlékeztető üzenetek', 'Testreszabható foglalási ablak', 'Csapat naptár kezelés'] : ['Automatic synchronization', 'Reminder messages', 'Customizable booking window', 'Team calendar management']
    },
    { 
      icon: BarChart3, 
      title: t('forecast'), 
      desc: t('forecastDesc'),
      longDesc: lang === 'hu' ? 'Ne csak a múltba nézz, lásd a jövőt is. Intelligens algoritmusaink elemzik az értékesítési tölcséredet és pontos előrejelzést adnak a várható bevételeidről.' : 'Don\'t just look at the past; see the future. Our intelligent algorithms analyze your sales funnel and provide accurate forecasts of your expected revenue.',
      image: 'https://images.unsplash.com/photo-1551288049-bbda48658a7d?auto=format&fit=crop&w=800&q=80',
      features: lang === 'hu' ? ['Bevétel előrejelzés', 'Trend elemzés', 'KPI követés', 'Vizuális riportok'] : ['Revenue forecasting', 'Trend analysis', 'KPI tracking', 'Visual reports']
    },
    { 
      icon: ClipboardList, 
      title: t('forms'), 
      desc: t('formsDesc'),
      longDesc: lang === 'hu' ? 'Hozz létre professzionális űrlapokat percek alatt. Az adatok azonnal bekerülnek a CRM-be, így egyetlen érdeklődőt sem veszítesz el.' : 'Create professional forms in minutes. Data is instantly entered into the CRM, so you never lose a single lead.',
      image: 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?auto=format&fit=crop&w=800&q=80',
      features: lang === 'hu' ? ['Drag & drop építő', 'Weboldalba ágyazható', 'Automatikus válaszok', 'Fájlfeltöltés támogatás'] : ['Drag & drop builder', 'Embeddable in websites', 'Automatic responses', 'File upload support']
    },
    { 
      icon: PenTool, 
      title: lang === 'hu' ? 'Digitális Aláírás' : 'Digital Signature', 
      desc: t('eSignatureDesc'),
      longDesc: lang === 'hu' ? 'Zárd le az üzleteket gyorsabban. Küldj ki szerződéseket digitális aláírásra, amelyeket az ügyfelek bármilyen eszközről hitelesíthetnek.' : 'Close deals faster. Send contracts for digital signature, which clients can certify from any device.',
      image: 'https://images.unsplash.com/photo-1515378791036-0648a3ef77b2?auto=format&fit=crop&w=800&q=80',
      features: lang === 'hu' ? ['Jogilag hiteles', 'Audit napló', 'Több aláíró támogatása', 'Automatikus archiválás'] : ['Legally binding', 'Audit log', 'Multi-signer support', 'Automatic archiving']
    },
    { 
      icon: ShieldCheck, 
      title: t('securityTitle'), 
      desc: t('securityDesc'),
      longDesc: lang === 'hu' ? 'Adataid biztonsága az első. Kétszintű azonosítás, IP alapú korlátozás és folyamatos biztonsági mentések garantálják a védelmet.' : 'The security of your data is paramount. Two-factor authentication, IP-based restriction, and continuous backups guarantee protection.',
      image: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=800&q=80',
      features: lang === 'hu' ? ['2FA azonosítás', 'IP korlátozás', 'Adattitkosítás', 'Szerepkör alapú hozzáférés'] : ['2FA authentication', 'IP restriction', 'Data encryption', 'Role-based access']
    },
    { 
      icon: Mail, 
      title: t('marketingAutomation'), 
      desc: t('marketingAutomationDesc'),
      longDesc: lang === 'hu' ? 'Személyre szabott kommunikáció tömegesen. Állíts be automatikus hírlevél sorozatokat az ügyfél életútja alapján.' : 'Personalized communication at scale. Set up automatic newsletter series based on the customer lifecycle.',
      image: 'https://images.unsplash.com/photo-1563986768494-4dee2763ff3f?auto=format&fit=crop&w=800&q=80',
      features: lang === 'hu' ? ['Email kampányok', 'Szegmentálás', 'A/B tesztelés', 'Megnyitási statisztikák'] : ['Email campaigns', 'Segmentation', 'A/B testing', 'Open statistics']
    },
    { 
      icon: CheckSquare, 
      title: t('projectManagement'), 
      desc: t('projectManagementDesc'),
      longDesc: lang === 'hu' ? 'Lásd át a folyamatokat. Kanban táblák és mérföldkövek segítenek abban, hogy minden projekt a határidőn belül maradjon.' : 'Overview your processes. Kanban boards and milestones help ensure every project stays within deadline.',
      image: 'https://images.unsplash.com/photo-1507925921958-8a62f3d1a50d?auto=format&fit=crop&w=800&q=80',
      features: lang === 'hu' ? ['Kanban táblák', 'Mérföldkövek', 'Időmérés', 'Csapat együttműködés'] : ['Kanban boards', 'Milestones', 'Time tracking', 'Team collaboration']
    },
    { 
      icon: ListChecks, 
      title: t('taskManagement'), 
      desc: t('taskManagementDesc'),
      longDesc: lang === 'hu' ? 'Soha ne felejts el semmit. Delegálj feladatokat, állíts be prioritásokat és kövesd nyomon a teendők állapotát valós időben.' : 'Never forget anything. Delegate tasks, set priorities, and track task status in real-time.',
      image: 'https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?auto=format&fit=crop&w=800&q=80',
      features: lang === 'hu' ? ['Delegálás', 'Határidők', 'Prioritások', 'Automatikus emlékeztetők'] : ['Delegation', 'Deadlines', 'Priorities', 'Automatic reminders']
    },
  ];

  return (
    <div className="min-h-screen text-slate-900 font-sans selection:bg-emerald-100 selection:text-emerald-900">
      <AnimatePresence>
        {selectedFeature && (
          <FeatureDetailModal 
            feature={selectedFeature} 
            onClose={() => setSelectedFeature(null)} 
            lang={lang} 
          />
        )}
      </AnimatePresence>
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center">
              <Briefcase className="w-6 h-6 text-white" />
            </div>
            <span className="font-bold text-xl tracking-tight">{t('appName')}</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
            <a href="#features" className="hover:text-emerald-600 transition-colors">{t('features')}</a>
            <a href="#pricing" className="hover:text-emerald-600 transition-colors">{t('pricing')}</a>
            <a href="#integrations" className="hover:text-emerald-600 transition-colors">{t('integrations')}</a>
            <Link to="/faq" className="hover:text-emerald-600 transition-colors">{t('faq')}</Link>
            <Link to="/blog" className="hover:text-emerald-600 transition-colors">{t('blog')}</Link>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setIsDark(!isDark)}
                className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-200 transition-colors"
              >
                {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>
              <button 
                onClick={() => setLang(lang === 'hu' ? 'en' : 'hu')}
                className="flex items-center gap-2 px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg hover:bg-slate-200 transition-colors"
              >
                <Globe className="w-4 h-4" />
                <span className="uppercase font-bold text-[10px]">{lang}</span>
              </button>
            </div>
            <Link to="/dashboard" className="px-6 py-2.5 bg-emerald-500 text-white rounded-full font-bold hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20">
              {lang === 'hu' ? 'Belépés' : 'Login'}
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-40 pb-20 px-6">
        <div className="max-w-7xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-block px-4 py-1.5 bg-emerald-50 text-emerald-600 rounded-full text-xs font-bold uppercase tracking-widest mb-6">
              {t('heroBadge')}
            </span>
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-8 leading-[1.1]">
              {t('heroTitle').split('.')[0]}. <br />
              <span className="text-emerald-500">{t('tailored')}</span>
            </h1>
            <p className="text-lg text-slate-500 max-w-2xl mx-auto mb-12 leading-relaxed">
              {t('heroSub')}
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
              <Link to="/dashboard" className="neon-pulse w-full sm:w-auto px-10 py-4 bg-emerald-500 text-white rounded-full font-bold text-lg hover:bg-emerald-600 transition-all">
                {t('tryFree')}
              </Link>
              <Link to="/dashboard" className="w-full sm:w-auto px-10 py-4 bg-white text-slate-900 border border-slate-200 rounded-full font-bold text-lg hover:bg-slate-50 transition-all text-center">
                {t('demo')}
              </Link>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4, duration: 0.8 }}
            className="mt-20 relative"
          >
            <div className="absolute inset-0 bg-gradient-to-t from-[#FFFBEB] via-transparent to-transparent z-10" />
            <img 
              src="https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1920&q=80" 
              alt="Zenith-CRM Dashboard" 
              className="rounded-3xl shadow-2xl border border-slate-100"
              referrerPolicy="no-referrer"
            />
          </motion.div>
        </div>
      </section>

      {/* Customization Section */}
      <section className="py-24 bg-transparent">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center gap-16">
          <div className="flex-1">
            <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center mb-8">
              <Settings className="w-8 h-8" />
            </div>
            <h2 className="text-4xl font-bold mb-6">{t('customizable')}</h2>
            <p className="text-xl text-slate-500 leading-relaxed mb-8">
              {t('customizableDesc')}
            </p>
            <ul className="space-y-4">
              {[
                t('customFields'),
                t('personalizedWorkflows'),
                t('companySpecificReports'),
                t('modularStructure')
              ].map((item, i) => (
                <li key={i} className="flex items-center gap-3 font-medium text-slate-700">
                  <div className="w-6 h-6 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center shrink-0">
                    <Plus className="w-4 h-4" />
                  </div>
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="flex-1">
            <img 
              src="https://picsum.photos/seed/custom/800/600" 
              alt="Customization" 
              className="rounded-3xl shadow-xl border border-slate-100"
              referrerPolicy="no-referrer"
            />
          </div>
        </div>
      </section>

      {/* Growth & Savings Section */}
      <section className="py-24 bg-slate-900 text-white overflow-hidden">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-4xl md:text-5xl font-bold mb-8">{t('growthTitle')}</h2>
              <p className="text-xl text-slate-400 leading-relaxed mb-12">
                {t('growthDesc')}
              </p>
              <div className="space-y-8">
                <div className="bg-slate-800/50 p-6 rounded-3xl border border-slate-700">
                  <div className="flex justify-between mb-4">
                    <span className="font-bold">{lang === 'hu' ? 'Átlagos profitnövekedés' : 'Average profit growth'}</span>
                    <span className="text-emerald-400 font-bold">+30%</span>
                  </div>
                  <div className="h-4 bg-slate-700 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      whileInView={{ width: '30%' }}
                      transition={{ duration: 1.5, ease: "easeOut" }}
                      className="h-full bg-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.5)]"
                    />
                  </div>
                </div>
                <div className="bg-slate-800/50 p-6 rounded-3xl border border-slate-700">
                  <div className="flex justify-between mb-4">
                    <span className="font-bold">{lang === 'hu' ? 'Értékesítési hatékonyság' : 'Sales efficiency'}</span>
                    <span className="text-emerald-400 font-bold">+45%</span>
                  </div>
                  <div className="h-4 bg-slate-700 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      whileInView={{ width: '45%' }}
                      transition={{ duration: 1.5, delay: 0.2, ease: "easeOut" }}
                      className="h-full bg-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.5)]"
                    />
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div className="bg-emerald-500/10 absolute inset-0 blur-3xl rounded-full" />
              <div className="relative bg-slate-800/50 p-10 rounded-[40px] border border-slate-700 backdrop-blur-sm">
                <h3 className="text-3xl font-bold mb-6">{t('timeSavingTitle')}</h3>
                <p className="text-slate-400 mb-10 leading-relaxed">
                  {t('timeSavingDesc')}
                </p>
                <div className="h-64 w-full mt-8">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={[
                      { month: 'Jan', value: 100 },
                      { month: 'Feb', value: 120 },
                      { month: 'Mar', value: 150 },
                      { month: 'Apr', value: 190 },
                      { month: 'May', value: 240 },
                      { month: 'Jun', value: 310 },
                    ]}>
                      <defs>
                        <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                      <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis hide />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '12px', color: '#fff' }}
                        itemStyle={{ color: '#10b981' }}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="value" 
                        stroke="#10b981" 
                        strokeWidth={4}
                        fillOpacity={1} 
                        fill="url(#colorValue)" 
                        animationDuration={2000}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-6 flex justify-center gap-8 text-sm font-bold text-slate-400">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-emerald-500" />
                    {lang === 'hu' ? 'Ügyfél elégedettség' : 'Customer satisfaction'}
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-slate-700" />
                    {lang === 'hu' ? 'Manuális munka' : 'Manual work'}
                  </div>
                </div>
                <div className="mt-10 pt-10 border-t border-slate-700 flex items-center gap-6">
                  <div className="w-16 h-16 bg-emerald-500 rounded-2xl flex items-center justify-center shrink-0">
                    <Clock className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">15h</p>
                    <p className="text-sm text-slate-400">{lang === 'hu' ? 'Megspórolt idő hetente' : 'Time saved weekly'}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-24 bg-transparent">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-20">
            <h2 className="text-4xl font-bold mb-4">{t('everythingInOnePlace')}</h2>
            <p className="text-slate-500">{t('noMoreSeparateSoftware')}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((f, i) => (
              <motion.div 
                key={i} 
                whileHover={{ y: -10 }}
                onClick={() => setSelectedFeature(f)}
                className="bg-white p-10 rounded-[40px] border border-slate-100 shadow-sm hover:shadow-2xl transition-all group cursor-pointer"
              >
                <div className="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-3xl flex items-center justify-center mb-8 group-hover:bg-emerald-500 group-hover:text-white transition-all shadow-lg shadow-emerald-500/0 group-hover:shadow-emerald-500/20">
                  <f.icon className="w-10 h-10" />
                </div>
                <h3 className="text-2xl font-bold mb-4">{f.title}</h3>
                <p className="text-slate-500 leading-relaxed mb-6">{f.desc}</p>
                <div className="flex items-center gap-2 text-emerald-600 font-bold text-sm">
                  {lang === 'hu' ? 'Részletek megtekintése' : 'View details'}
                  <ArrowUpRight className="w-4 h-4" />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Integrations Section */}
      <section id="integrations" className="py-24 bg-transparent overflow-hidden">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-20">
            <h2 className="text-4xl font-bold mb-4">{t('integrations')}</h2>
            <p className="text-slate-500">{t('integrationsSub')}</p>
          </div>
          <div className="flex flex-wrap justify-center gap-12 opacity-70 grayscale hover:grayscale-0 transition-all mb-24">
            {[
              { name: 'Google Workspace', logo: 'https://www.google.com/s2/favicons?domain=google.com&sz=128' },
              { name: 'Slack', logo: 'https://www.google.com/s2/favicons?domain=slack.com&sz=128' },
              { name: 'Zapier', logo: 'https://www.google.com/s2/favicons?domain=zapier.com&sz=128' },
              { name: 'Mailchimp', logo: 'https://www.google.com/s2/favicons?domain=mailchimp.com&sz=128' },
              { name: 'Stripe', logo: 'https://www.google.com/s2/favicons?domain=stripe.com&sz=128' },
              { name: 'Microsoft 365', logo: 'https://www.google.com/s2/favicons?domain=microsoft.com&sz=128' },
              { name: 'Trello', logo: 'https://www.google.com/s2/favicons?domain=trello.com&sz=128' },
              { name: 'HubSpot', logo: 'https://www.google.com/s2/favicons?domain=hubspot.com&sz=128' },
              { name: 'Számlázz.hu', logo: 'https://www.google.com/s2/favicons?domain=szamlazz.hu&sz=128' },
              { name: 'Billingo', logo: 'https://www.google.com/s2/favicons?domain=billingo.hu&sz=128' },
              { name: 'Facebook', logo: 'https://www.google.com/s2/favicons?domain=facebook.com&sz=128' },
              { name: 'Instagram', logo: 'https://www.google.com/s2/favicons?domain=instagram.com&sz=128' },
            ].map((int, i) => (
              <div key={i} className="flex flex-col items-center gap-3 group">
                <div className="w-20 h-20 bg-white shadow-sm border border-slate-100 rounded-2xl flex items-center justify-center p-4 group-hover:shadow-md transition-all">
                  <img src={int.logo} alt={int.name} className="max-w-full max-h-full object-contain" referrerPolicy="no-referrer" />
                </div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{int.name}</span>
              </div>
            ))}
          </div>

          {/* Teamwork Section */}
          <div className="bg-emerald-50 rounded-[40px] p-12 md:p-20 flex flex-col md:flex-row items-center gap-16">
            <div className="flex-1">
              <h2 className="text-4xl font-bold mb-8 text-slate-900 leading-tight">{t('teamworkTitle')}</h2>
              <div className="space-y-6">
                {[t('teamworkBenefit1'), t('teamworkBenefit2'), t('teamworkBenefit3')].map((benefit, i) => (
                  <div key={i} className="flex items-start gap-4">
                    <div className="w-8 h-8 bg-emerald-500 text-white rounded-xl flex items-center justify-center shrink-0 shadow-lg shadow-emerald-500/20">
                      <Plus className="w-5 h-5" />
                    </div>
                    <p className="text-lg text-slate-700 font-medium leading-relaxed">{benefit}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex-1">
              <img 
                src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=800&q=80" 
                alt="Teamwork" 
                className="rounded-3xl shadow-2xl border border-white"
                referrerPolicy="no-referrer"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-24 bg-transparent">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-20">
            <h2 className="text-4xl font-bold mb-4">{t('pricing')}</h2>
            <p className="text-slate-500">{t('pricingSub')}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div className="bg-white p-10 rounded-3xl border border-slate-100 shadow-sm hover:border-emerald-500 transition-all">
              <h3 className="text-xl font-bold mb-2">{t('monthly')}</h3>
              <p className="text-slate-500 mb-8">{t('flexibleSolution')}</p>
              <div className="flex items-baseline gap-1 mb-8">
                <span className="text-5xl font-bold">3.490</span>
                <span className="text-slate-500 font-medium">{t('perPersonMonth')}</span>
              </div>
              <ul className="space-y-4 mb-10 text-slate-600">
                {[t('allPremium'), t('aiChatbot'), t('unlimitedClients'), t('support247')].map((item, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <div className="w-5 h-5 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center">
                      <Plus className="w-3 h-3" />
                    </div>
                    {item}
                  </li>
                ))}
              </ul>
              <Link to="/dashboard" className="block w-full py-4 bg-slate-900 text-white text-center rounded-2xl font-bold hover:bg-slate-800 transition-all">
                {t('startNow')}
              </Link>
            </div>
            <div className="bg-slate-900 p-10 rounded-3xl border border-slate-800 shadow-2xl relative overflow-hidden">
              <div className="absolute top-6 right-6 px-3 py-1 bg-emerald-500 text-white text-[10px] font-bold uppercase tracking-widest rounded-full">
                {t('bestValue')}
              </div>
              <h3 className="text-xl font-bold text-white mb-2">{t('annual')}</h3>
              <p className="text-slate-400 mb-8">{t('saveMore')}</p>
              <div className="flex items-baseline gap-1 mb-8">
                <span className="text-5xl font-bold text-white">34.900</span>
                <span className="text-slate-400 font-medium">{t('perPersonYear')}</span>
              </div>
              <ul className="space-y-4 mb-10 text-slate-300">
                {[t('allPremium'), t('aiChatbot'), t('unlimitedClients'), t('prioritySupport'), t('freeOnboarding')].map((item, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <div className="w-5 h-5 bg-emerald-500 text-white rounded-full flex items-center justify-center">
                      <Plus className="w-3 h-3" />
                    </div>
                    {item}
                  </li>
                ))}
              </ul>
              <Link to="/dashboard" className="block w-full py-4 bg-emerald-500 text-white text-center rounded-2xl font-bold hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20">
                {t('chooseAnnual')}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">{t('testimonialsTitle')}</h2>
            <div className="w-24 h-1 bg-emerald-500 mx-auto rounded-full" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {[
              { text: t('testimonial1'), author: t('testimonial1Author'), img: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=100&q=80' },
              { text: t('testimonial2'), author: t('testimonial2Author'), img: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=100&q=80' }
            ].map((test, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="bg-white p-10 rounded-[40px] shadow-sm border border-slate-100 relative"
              >
                <Quote className="absolute top-8 right-8 w-12 h-12 text-emerald-500/10" />
                <p className="text-xl text-slate-600 italic mb-8 leading-relaxed relative z-10">
                  {test.text}
                </p>
                <div className="flex items-center gap-4">
                  <img src={test.img} alt={test.author} className="w-12 h-12 rounded-full object-cover" referrerPolicy="no-referrer" />
                  <div>
                    <p className="font-bold text-slate-900">{test.author}</p>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map(star => (
                        <Star key={star} className="w-3 h-3 fill-amber-400 text-amber-400" />
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-24 bg-transparent">
        <div className="max-w-7xl mx-auto px-6">
          <div className="bg-slate-900 rounded-[40px] p-12 md:p-20 text-center text-white relative overflow-hidden mb-24">
            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,rgba(16,185,129,0.1),transparent)]" />
            <h2 className="text-4xl md:text-6xl font-bold mb-8 relative z-10">{t('haveQuestion')}</h2>
            <p className="text-xl text-slate-400 mb-12 max-w-2xl mx-auto relative z-10">{t('contactUs')}</p>
            <a href="#contact-form" className="inline-flex items-center gap-3 px-10 py-5 bg-emerald-500 text-white rounded-full font-bold text-xl hover:bg-emerald-600 transition-all shadow-xl shadow-emerald-500/20 relative z-10">
              {t('contact')}
              <ArrowUpRight className="w-6 h-6" />
            </a>
          </div>
          
          <div id="contact-form" className="grid grid-cols-1 lg:grid-cols-2 gap-20">
              <div>
                <h2 className="text-4xl md:text-5xl font-bold mb-6">{t('contact')}</h2>
                <p className="text-xl text-slate-500 mb-12 leading-relaxed">
                  {t('contactSub')}
                </p>
                
                <div className="space-y-8">
                  <div className="flex items-center gap-6">
                    <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center shrink-0">
                      <MessageSquare className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="font-bold text-slate-900">Chat-bot támogatás</p>
                      <p className="text-slate-500">Azonnali válaszok a nap 24 órájában.</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="w-14 h-14 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center shrink-0">
                      <Globe className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="font-bold text-slate-900">Globális elérhetőség</p>
                      <p className="text-slate-500">Bárhol, bármikor, bármilyen eszközről.</p>
                    </div>
                  </div>
                </div>
              </div>

              <form action="https://formspree.io/f/mojnklob" method="POST" className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">{t('name')}</label>
                    <input 
                      type="text" 
                      name="name" 
                      placeholder="Kovács János" 
                      required 
                      className="w-full px-6 py-4 bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Email</label>
                    <input 
                      type="email" 
                      name="email" 
                      placeholder="janos@pelda.hu" 
                      required 
                      className="w-full px-6 py-4 bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">{t('message')}</label>
                  <textarea 
                    name="message" 
                    placeholder="Miben segíthetünk?" 
                    rows={4} 
                    required 
                    className="w-full px-6 py-4 bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                  ></textarea>
                </div>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <input 
                      type="checkbox" 
                      id="privacy-accept"
                      required 
                      className="mt-1 w-4 h-4 text-emerald-500 border-slate-300 rounded focus:ring-emerald-500"
                    />
                    <label htmlFor="privacy-accept" className="text-sm text-slate-500 leading-tight">
                      {t('acceptPrivacy')} <Link to="/privacy" className="text-emerald-600 hover:underline font-bold">{t('privacyPolicy')}</Link>
                    </label>
                  </div>
                  <button type="submit" className="w-full py-5 bg-emerald-500 text-white rounded-2xl font-bold text-lg hover:bg-emerald-600 transition-all shadow-xl shadow-emerald-500/20 flex items-center justify-center gap-3">
                    {t('sendMessage')}
                    <ArrowUpRight className="w-5 h-5" />
                  </button>
                </div>
              </form>
            </div>
          </div>
      </section>

      {/* Footer */}
      <footer className="py-20 border-t border-slate-100 bg-transparent">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
              <Briefcase className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-lg">{t('appName')}</span>
          </div>
          <p className="text-slate-400 text-sm">© 2026 {t('companyName')} • {t('rightsReserved')}</p>
          <div className="flex gap-6 text-sm font-medium text-slate-500">
            <Link to="/privacy" className="hover:text-emerald-600">{t('privacy')}</Link>
            <Link to="/terms" className="hover:text-emerald-600">{t('tos')}</Link>
            <a href="#contact" className="hover:text-emerald-600">{t('contact')}</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

const MarketingPage = () => {
  const { t } = React.useContext(LanguageContext);
  return (
    <div className="p-8 space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">{t('marketing')}</h2>
        <p className="text-slate-500">{t('marketingSub')}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-card p-6 border-l-4 border-emerald-500">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center">
              <Mail className="w-5 h-5" />
            </div>
            <h3 className="font-bold dark:text-slate-100">{t('campaigns')}</h3>
          </div>
          <p className="text-sm text-slate-500 mb-6">{t('campaignsDesc')}</p>
          <button className="w-full py-2 bg-emerald-500 text-white rounded-xl font-bold hover:bg-emerald-600 transition-all">{t('newCampaign')}</button>
        </div>

        <div className="glass-card p-6 border-l-4 border-blue-500">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center">
              <Zap className="w-5 h-5" />
            </div>
            <h3 className="font-bold dark:text-slate-100">{t('automations')}</h3>
          </div>
          <p className="text-sm text-slate-500 mb-6">{t('automationsDesc')}</p>
          <button className="w-full py-2 bg-blue-500 text-white rounded-xl font-bold hover:bg-blue-600 transition-all">{t('manage')}</button>
        </div>

        <div className="glass-card p-6 border-l-4 border-amber-500">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-amber-100 text-amber-600 rounded-xl flex items-center justify-center">
              <BarChart3 className="w-5 h-5" />
            </div>
            <h3 className="font-bold dark:text-slate-100">{t('statistics')}</h3>
          </div>
          <p className="text-sm text-slate-500 mb-6">{t('statsDesc')}</p>
          <button className="w-full py-2 bg-amber-500 text-white rounded-xl font-bold hover:bg-amber-600 transition-all">{t('view')}</button>
        </div>
      </div>

      <div className="glass-card p-8">
        <h3 className="font-bold text-lg mb-6 dark:text-slate-100">{t('activeCampaigns')}</h3>
        <div className="space-y-4">
          {[
            { name: 'Tavaszi Akció 2026', status: t('running'), sent: 1250, open: '42%', click: '12%' },
            { name: 'Hírlevél - Február', status: t('sent'), sent: 3400, open: '38%', click: '8%' },
            { name: 'Új funkciók bemutatása', status: t('draft'), sent: 0, open: '-', click: '-' },
          ].map((c, i) => (
            <div key={i} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700">
              <div>
                <p className="font-bold text-slate-800 dark:text-slate-200">{c.name}</p>
                <p className="text-xs text-slate-500">{c.status}</p>
              </div>
              <div className="flex gap-8 text-center">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">{t('sent')}</p>
                  <p className="font-bold text-slate-700 dark:text-slate-300">{c.sent}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">{t('open')}</p>
                  <p className="font-bold text-slate-700 dark:text-slate-300">{c.open}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">{t('click')}</p>
                  <p className="font-bold text-slate-700 dark:text-slate-300">{c.click}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const SettingsPage = () => {
  const { t } = React.useContext(LanguageContext);
  const [activeTab, setActiveTab] = useState('general');

  return (
    <div className="p-8 space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">{t('settings')}</h2>
        <p className="text-slate-500">{t('settingsSub')}</p>
      </div>

      <div className="flex gap-4 border-b border-slate-100 dark:border-slate-800">
        {[
          { id: 'general', label: t('general'), icon: Settings },
          { id: 'system', label: t('system'), icon: Cpu },
          { id: 'security', label: t('security'), icon: Shield },
          { id: 'company', label: t('companyInfo'), icon: Building2 },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex items-center gap-2 px-6 py-3 font-bold text-sm transition-all border-b-2",
              activeTab === tab.id ? "border-emerald-500 text-emerald-600" : "border-transparent text-slate-400 hover:text-slate-600"
            )}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      <div className="glass-card p-8 max-w-2xl">
        {activeTab === 'general' && (
          <div className="space-y-6">
            <h3 className="font-bold text-lg mb-4 dark:text-slate-100">{t('generalSettings')}</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">{t('systemLanguage')}</label>
                <select className="w-full px-4 py-2 bg-slate-100 dark:bg-slate-800 border-none rounded-xl focus:ring-2 focus:ring-emerald-500 dark:text-slate-200">
                  <option>Magyar</option>
                  <option>English</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">{t('timezone')}</label>
                <select className="w-full px-4 py-2 bg-slate-100 dark:bg-slate-800 border-none rounded-xl focus:ring-2 focus:ring-emerald-500 dark:text-slate-200">
                  <option>(GMT+01:00) Budapest</option>
                  <option>(GMT+00:00) London</option>
                </select>
              </div>
              <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl">
                <div>
                  <p className="font-bold text-slate-800 dark:text-slate-200 text-sm">{t('enableNotifications')}</p>
                  <p className="text-xs text-slate-500">{t('notifDesc')}</p>
                </div>
                <div className="w-12 h-6 bg-emerald-500 rounded-full relative cursor-pointer">
                  <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full shadow-sm" />
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'company' && (
          <div className="space-y-6">
            <h3 className="font-bold text-lg mb-4 dark:text-slate-100">{t('companyInfo')}</h3>
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">{t('companyNameLabel')}</label>
                <input type="text" defaultValue="Dat-assist Kft." className="w-full px-4 py-2 bg-slate-100 dark:bg-slate-800 border-none rounded-xl focus:ring-2 focus:ring-emerald-500 dark:text-slate-200" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">{t('taxNumber')}</label>
                <input type="text" defaultValue="32963676-1-07" className="w-full px-4 py-2 bg-slate-100 dark:bg-slate-800 border-none rounded-xl focus:ring-2 focus:ring-emerald-500 dark:text-slate-200" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">{t('headquarters')}</label>
                <input type="text" defaultValue="8142 Úrhida, Avar utca 9." className="w-full px-4 py-2 bg-slate-100 dark:bg-slate-800 border-none rounded-xl focus:ring-2 focus:ring-emerald-500 dark:text-slate-200" />
              </div>
            </div>
          </div>
        )}

        <div className="mt-8 pt-8 border-t border-slate-100 dark:border-slate-800 flex justify-end">
          <button className="px-8 py-3 bg-emerald-500 text-white rounded-xl font-bold hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20">
            {t('saveSettings')}
          </button>
        </div>
      </div>
    </div>
  );
};

// --- Main App ---

export default function App() {
  const location = useLocation();
  const [lang, setLang] = useState<'hu' | 'en'>(() => {
    return (localStorage.getItem('lang') as 'hu' | 'en') || 'hu';
  });

  const t = (key: keyof typeof translations['hu']) => translations[lang][key];

  useEffect(() => {
    localStorage.setItem('lang', lang);
  }, [lang]);

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    return localStorage.getItem('sidebar_collapsed') === 'true';
  });

  const toggleSidebar = () => {
    const newState = !isSidebarCollapsed;
    setIsSidebarCollapsed(newState);
    localStorage.setItem('sidebar_collapsed', newState.toString());
  };

  const getTitle = () => {
    if (location.pathname === '/' || location.pathname === '/dashboard') return t('dashboard');
    if (location.pathname === '/clients') return t('clients');
    if (location.pathname.startsWith('/clients/')) return lang === 'hu' ? 'Ügyfél Adatlap' : 'Client Profile';
    if (location.pathname === '/deals') return t('deals');
    if (location.pathname === '/tasks') return t('tasks');
    if (location.pathname === '/profile') return t('profile');
    if (location.pathname === '/team') return t('team');
    if (location.pathname === '/calendar') return t('calendar');
    if (location.pathname === '/attendance') return t('attendance');
    if (location.pathname === '/documents') return t('documents');
    if (location.pathname === '/forecast') return t('forecast');
    if (location.pathname === '/booking') return t('booking');
    if (location.pathname === '/forms') return t('forms');
    if (location.pathname === '/security') return t('security');
    if (location.pathname === '/accounting') return t('accounting');
    if (location.pathname === '/marketing') return t('marketing');
    if (location.pathname === '/settings') return t('settings');
    return t('appName');
  };

  const isPublicPage = ['/', '/privacy', '/terms', '/faq', '/blog'].includes(location.pathname);

  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    if (location.pathname.startsWith('/dashboard') || location.pathname === '/clients' || location.pathname === '/deals' || location.pathname === '/tasks') {
      const hasSeenOnboarding = localStorage.getItem('zenith_onboarding_seen');
      if (!hasSeenOnboarding) {
        setShowOnboarding(true);
      }
    }
  }, [location.pathname]);

  const handleCloseOnboarding = () => {
    localStorage.setItem('zenith_onboarding_seen', 'true');
    setShowOnboarding(false);
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      <div className="min-h-screen flex selection:bg-emerald-100 selection:text-emerald-900">
        <AnimatePresence>
          {showOnboarding && <OnboardingModal onClose={handleCloseOnboarding} />}
        </AnimatePresence>
        {!isPublicPage && <Sidebar isCollapsed={isSidebarCollapsed} onToggle={toggleSidebar} />}
        <motion.main 
          animate={{ marginLeft: isPublicPage ? 0 : (isSidebarCollapsed ? 80 : 256) }}
          className="flex-1 min-h-screen flex flex-col"
        >
          {!isPublicPage && <Header title={getTitle()} />}
          <div className="flex-1">
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/privacy" element={<PrivacyPage />} />
              <Route path="/terms" element={<TermsPage />} />
              <Route path="/faq" element={<FAQPage />} />
              <Route path="/blog" element={<BlogPage />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/clients" element={<ClientList />} />
              <Route path="/clients/:id" element={<ClientDetailView />} />
              <Route path="/deals" element={<DealsPage />} />
              <Route path="/tasks" element={<TasksPage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/team" element={<TeamPage />} />
              <Route path="/calendar" element={<CalendarPage />} />
              <Route path="/attendance" element={<AttendancePage />} />
              <Route path="/documents" element={<DocumentsPage />} />
              <Route path="/forecast" element={<ForecastPage />} />
              <Route path="/booking" element={<BookingPage />} />
              <Route path="/forms" element={<FormsPage />} />
              <Route path="/security" element={<SecuritySettings />} />
              <Route path="/accounting" element={<AccountingPage />} />
              <Route path="/marketing" element={<MarketingPage />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Routes>
          </div>
          <ChatBot />
        </motion.main>
      </div>
    </LanguageContext.Provider>
  );
}
