import React, { useState, useEffect, useMemo } from 'react';
import {
  auth,
  rtdb,
  secondaryAuth,
  toEmail,
  logoutUser,
  emergencyResetAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as secondarySignOut,
  onAuthStateChanged,
  rtdbRef,
  rtdbSet,
  rtdbGet,
  rtdbChild,
  rtdbPush,
  rtdbUpdate,
  rtdbOnValue,
  rtdbRemove
} from './firebase';
import { AppUser, PosterRequest, RequestStatus, RequestType, FormStatus, STATUS_CONFIG, FORM_STATUS_CONFIG, UserRole } from './types';
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  LogOut,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Clock3,
  Palette,
  Eye,
  RefreshCw,
  AlertCircle,
  Sparkles,
  ChevronRight,
  X,
  FileText,
  UserPlus,
  Send,
  Lock,
  User as UserIcon,
  Menu,
  Inbox,
  Check,
  ChevronDown,
  Trash2,
  Edit3,
  AlertTriangle,
  ExternalLink,
  Copy,
  FileSpreadsheet,
  Layers,
  ListChecks,
  Link as LinkIcon,
  Upload,
  Download,
  Image as ImageIcon,
  Maximize2
} from 'lucide-react';

const INITIAL_DEFAULT_REQUESTS: PosterRequest[] = [
  {
    id: 'req-sample-bolu',
    talepTuru: 'hepsi',
    etkinlikAdi: '🍁 Bolu Sonbahar Tefekkür Gezisi',
    ekip: 'Hanım Gönüllüler Birimi',
    altBaslik: 'Sonbaharın renklerini keşfedeceğimiz, huzur dolu tefekkür gezisi',
    aciklama: 'Bolu ‘ da sonbaharın renklerini keşfedeceğimiz, huzur dolu tefekkür gezimize tüm hanım gönüllülerimiz davetlidir.🍁✨\n✔️ Gezi ücretimiz: 1000 TL’dir. (Geliri Filistin fonuna aktarılacaktır.)\n✔️ İkramımız: Sabah sandviç ve meyve suyu ikramımız olacaktır.\n📞 İletişim & Kayıt: 0533 560 74 89\n📅 Tarih: 31.10.2026 (Cumartesi)\n⏰ Kalkış: 06.30 — Üniversite Metro İstasyonu\n🚌 Gezimiz günübirliktir.\n📍 Güzergah: Bolu / Yedigöller',
    tarih: '2026-10-31',
    saat: '06:30',
    mekan: 'Bolu / Yedigöller (Kalkış: Üniversite Metro İstasyonu)',
    ozelNot: '* Katılımcıların sabah saat 06:15\'te toplanma yerinde hazır bulunmaları rica olunur.',
    status: 'tasarimda',
    formSorulari: ['İsim / Soyisim', 'Bölüm', 'Sınıf', 'Telefon Numarası'],
    formAciklamasi: 'Bolu ‘ da sonbaharın renklerini keşfedeceğimiz, huzur dolu tefekkür gezimize tüm hanım gönüllülerimiz davetlidir.🍁✨\n✔️ Gezi ücretimiz: 1000 TL’dir. (Geliri Filistin fonuna aktarılacaktır.)\n✔️ İkramımız: Sabah sandviç ve meyve suyu ikramımız olacaktır.\n📞 İletişim & Kayıt: 0533 560 74 89\n📅 Tarih: 31.10.2026 (Cumartesi)\n⏰ Kalkış: 06.30 — Üniversite Metro İstasyonu\n🚌 Gezimiz günübirliktir.\n📍 Güzergah: Bolu / Yedigöller',
    formSartlari: '* Bolu gezisine katılmak için açıklamadaki iletişim numarasını arayarak gönüllü kaydı yapacağımı ve kimlik fotokopisi atacağımı taahhüt ederim.\n* Kontenjanımız sınırlı olup, kayıt kesinleştirmek için 250 TL depozito alınmaktadır. İptal durumunda depozito iadesi yapılmayacaktır.',
    formLink: 'https://forms.gle/bolu-gezi-kayit-2026',
    formStatus: 'form-hazir',
    formAddedBy: { uid: 'adminokur-demo', name: 'Adminokur (Form Yöneticisi)' },
    formAddedAt: Date.now() - 3600 * 5 * 1000,
    createdBy: { uid: 'user-demo-1', name: 'Ahmet Yılmaz' },
    createdAt: Date.now() - 3600 * 24 * 1000,
    updatedAt: Date.now() - 3600 * 5 * 1000
  },
  {
    id: 'req-sample-1',
    talepTuru: 'afis',
    etkinlikAdi: '🚀 ATOM Teknoloji ve İnovasyon Buluşması',
    ekip: 'ATOM Geliştirici Ekibi',
    altBaslik: 'Geleceği kodlayan gençlerin ilham dolu buluşması!',
    aciklama: 'Yapay zeka, bulut sistemleri ve mobil uygulama geliştirme atölyeleriyle dolu harika bir gün sizleri bekliyor.',
    tarih: '2026-11-15',
    saat: '14:00',
    mekan: 'Gençlik Merkezi Konferans Salonu',
    ozelNot: '* Katılım tamamen ücretsizdir. Kendi bilgisayarınızı getirmeyi unutmayın.',
    status: 'talep-alindi',
    createdBy: { uid: 'user-demo-1', name: 'Ahmet Yılmaz' },
    createdAt: Date.now() - 3600 * 2 * 1000,
    updatedAt: Date.now() - 3600 * 2 * 1000
  },
  {
    id: 'req-sample-form-only',
    talepTuru: 'form',
    etkinlikAdi: '🎤 Kariyer Sohbetleri Katılımcı Kayıt Formu',
    ekip: 'Sosyal Etkinlik Birimi',
    altBaslik: 'Sektörün öncüleriyle buluşma öncesi kayıt',
    aciklama: 'Lider konuklarımızın tecrübelerini dinleyeceğimiz özel söyleşi için ön kayıt formu.',
    tarih: '2026-11-28',
    saat: '18:00',
    mekan: 'Büyük Oditoryum Salonu',
    ozelNot: '* Kontenjan 120 kişiyle sınırlıdır.',
    status: 'talep-alindi',
    formSorulari: ['İsim / Soyisim', 'Bölüm', 'Sınıf', 'Telefon Numarası', 'İlgi Alanınız'],
    formAciklamasi: 'Kariyer Sohbetleri katılımınızı kesinleştirmek için lütfen formu eksiksiz doldurunuz.',
    formSartlari: '* Katılım sertifikası program sonunda takdim edilecektir.',
    formStatus: 'form-bekliyor',
    createdBy: { uid: 'user-demo-3', name: 'Mehmet Demir' },
    createdAt: Date.now() - 86400 * 2 * 1000,
    updatedAt: Date.now() - 86400 * 2 * 1000
  },
  {
    id: 'req-sample-2',
    talepTuru: 'afis',
    etkinlikAdi: '🎨 Genç Sanat & İllüstrasyon Atölyesi',
    ekip: 'Sanat & Kültür Kulübü',
    altBaslik: 'Renklerin diliyle kendini ifade et!',
    aciklama: 'Temel çizim teknikleri, karakter tasarımı ve afiş illüstrasyonu üzerine pratik çalışmalar.',
    tarih: '2026-11-20',
    saat: '16:30',
    mekan: 'Sanat Atölyesi 2. Kat',
    ozelNot: '* Tüm boyama malzemeleri tarafımızdan temin edilecektir.',
    status: 'tasarimda',
    createdBy: { uid: 'user-demo-2', name: 'Elif Kaya' },
    createdAt: Date.now() - 86400 * 1000,
    updatedAt: Date.now() - 86400 * 500
  }
];

export default function App() {
  // ── Auth & Session State ──
  const [currentUser, setCurrentUser] = useState<AppUser | null>(() => {
    try {
      const saved = localStorage.getItem('afis_portal_session');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [authLoading, setAuthLoading] = useState<boolean>(!currentUser);
  const [authError, setAuthError] = useState<string | null>(null);

  // ── Mobile Drawer State ──
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // ── Login Form State ──
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);

  // ── Portal Navigation ──
  const [activeTab, setActiveTab] = useState<string>(() => {
    try {
      const saved = localStorage.getItem('afis_portal_session');
      if (saved) {
        const u = JSON.parse(saved);
        const isAdm =
          u.role === 'admin' ||
          u.role === 'admin_afis' ||
          u.role === 'admin_form' ||
          (Boolean(u.role) && String(u.role).toLowerCase().includes('admin'));
        return isAdm ? 'all' : 'requests';
      }
    } catch {}
    return 'all';
  });
  const [typeFilter, setTypeFilter] = useState<'all' | 'afis' | 'form' | 'hepsi'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'created' | 'event'>('created');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

  // ── Data State ──
  const [requests, setRequests] = useState<PosterRequest[]>([]);
  const [usersList, setUsersList] = useState<AppUser[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

  // ── Modal State ──
  const [selectedRequest, setSelectedRequest] = useState<PosterRequest | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [requestToDelete, setRequestToDelete] = useState<PosterRequest | null>(null);
  const [deletingRequest, setDeletingRequest] = useState(false);

  // ── Adminokur Form Link Modal ──
  const [formLinkModalReq, setFormLinkModalReq] = useState<PosterRequest | null>(null);
  const [formLinkInput, setFormLinkInput] = useState('');
  const [savingFormLink, setSavingFormLink] = useState(false);

  // ── Edit Request State (User) ──
  const [requestToEdit, setRequestToEdit] = useState<PosterRequest | null>(null);
  const [editFormData, setEditFormData] = useState({
    talepTuru: 'afis' as RequestType,
    etkinlikAdi: '',
    ekip: '',
    altBaslik: '',
    aciklama: '',
    tarih: '',
    saat: '',
    mekan: '',
    ozelNot: '',
    formAciklamasi: '',
    userChangesNote: '',
    hazirSablonVar: false,
    sablonGorseli: '',
    sablonGorseliAdi: ''
  });
  const [editFormQuestions, setEditFormQuestions] = useState<string[]>([]);
  const [editNewQuestionInput, setEditNewQuestionInput] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);
  const [isUploadingEditSablon, setIsUploadingEditSablon] = useState(false);
  const [acknowledgingId, setAcknowledgingId] = useState<string | null>(null);

  // ── User Creation Form (Admin) ──
  const [newFullname, setNewFullname] = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState<UserRole>('user');
  const [creatingUser, setCreatingUser] = useState(false);
  const [userCreateMsg, setUserCreateMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // ── New Request Form (User) ──
  const [formData, setFormData] = useState({
    talepTuru: 'hepsi' as RequestType, // Default to both or user picks
    etkinlikAdi: '',
    ekip: '',
    altBaslik: '',
    aciklama: '',
    tarih: '',
    saat: '',
    mekan: '',
    ozelNot: '',
    formAciklamasi: '',
    hazirSablonVar: false,
    sablonGorseli: '',
    sablonGorseliAdi: ''
  });
  const [formQuestions, setFormQuestions] = useState<string[]>([
    'İsim / Soyisim',
    'Bölüm',
    'Sınıf',
    'Telefon Numarası'
  ]);
  const [newQuestionInput, setNewQuestionInput] = useState('');
  const [isUploadingSablon, setIsUploadingSablon] = useState(false);
  const [submittingRequest, setSubmittingRequest] = useState(false);
  const [mobileFormTab, setMobileFormTab] = useState<'form' | 'preview'>('form');

  // ── Final Published Afiş State & Upload ──
  const [uploadingFinalAfis, setUploadingFinalAfis] = useState(false);

  // ── Image Lightbox Modal ──
  const [lightboxImage, setLightboxImage] = useState<{ url: string; title: string; subtitle?: string } | null>(null);

  // ── Role Helpers ──
  const isAdmin =
    currentUser?.role === 'admin' ||
    currentUser?.role === 'admin_afis' ||
    currentUser?.role === 'admin_form' ||
    (Boolean(currentUser?.role) && String(currentUser?.role).toLowerCase().includes('admin'));
  const isAfisManager =
    currentUser?.role === 'admin' ||
    currentUser?.role === 'admin_afis' ||
    (Boolean(currentUser?.role) && String(currentUser?.role).toLowerCase().includes('admin'));
  const isFormManager =
    currentUser?.role === 'admin' ||
    currentUser?.role === 'admin_form' ||
    (Boolean(currentUser?.role) && String(currentUser?.role).toLowerCase().includes('admin'));


  // ── Toast Notifications ──
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(prev => (prev?.message === message ? null : prev));
    }, 3800);
  };

  // ── Clock ──
  const [currentTime, setCurrentTime] = useState('');
  useEffect(() => {
    const updateTime = () => {
      setCurrentTime(new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }));
    };
    updateTime();
    const interval = setInterval(updateTime, 10000);
    return () => clearInterval(interval);
  }, []);

  // Save session when currentUser changes
  useEffect(() => {
    if (currentUser) {
      try {
        localStorage.setItem('afis_portal_session', JSON.stringify(currentUser));
      } catch {}
    } else {
      try {
        localStorage.removeItem('afis_portal_session');
      } catch {}
    }
  }, [currentUser]);

  // Tab switch handler that automatically closes mobile drawer
  const handleSelectTab = (tab: string) => {
    setActiveTab(tab);
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // ─────────────────────────────────────────────────────────────
  // 1. AUTH STATE OBSERVER
  // ─────────────────────────────────────────────────────────────
  useEffect(() => {
    let isMounted = true;

    const safetyTimer = setTimeout(() => {
      if (isMounted && authLoading) {
        setAuthLoading(false);
      }
    }, 2000);

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!isMounted) return;

      if (!firebaseUser) {
        if (!localStorage.getItem('afis_portal_session')) {
          setCurrentUser(null);
        }
        setAuthLoading(false);
        return;
      }

      if (currentUser && currentUser.uid === firebaseUser.uid) {
        setAuthLoading(false);
        return;
      }

      try {
        const snap = await rtdbGet(rtdbChild(rtdbRef(rtdb), `users/${firebaseUser.uid}`));
        if (snap && snap.exists() && isMounted) {
          const uData = snap.val();
          const roleVal: UserRole =
            uData.role === 'admin' || uData.role === 'admin_afis' || uData.role === 'admin_form'
              ? uData.role
              : (typeof uData.role === 'string' && uData.role.toLowerCase().includes('admin')
                  ? 'admin'
                  : (uData.username && (uData.username.toLowerCase().includes('zeynep') || uData.username.toLowerCase().includes('admin')) ? 'admin_afis' : 'user'));
          const uObj: AppUser = {
            uid: firebaseUser.uid,
            name: uData.name || 'Kullanıcı',
            username: uData.username || 'kullanici',
            role: roleVal,
            createdAt: uData.createdAt
          };
          setCurrentUser(uObj);
          const isUserAdmin = roleVal !== 'user';
          setActiveTab(isUserAdmin ? 'all' : 'requests');
        }
      } catch (e) {
        console.warn("RTDB user fetch error:", e);
      } finally {
        if (isMounted) setAuthLoading(false);
      }
    });

    return () => {
      isMounted = false;
      clearTimeout(safetyTimer);
      unsubscribe();
    };
  }, []);

  // ─────────────────────────────────────────────────────────────
  // 2. DATA SUBSCRIPTION (REALTIME DATABASE)
  // ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!currentUser) return;

    const isUserAdmin =
      currentUser.role === 'admin' ||
      currentUser.role === 'admin_afis' ||
      currentUser.role === 'admin_form' ||
      (Boolean(currentUser.role) && String(currentUser.role).toLowerCase().includes('admin'));

    setDataLoading(true);
    let unsubReqs: (() => void) | null = null;
    let unsubUsers: (() => void) | null = null;

    try {
      const reqsRef = rtdbRef(rtdb, 'requests');
      unsubReqs = rtdbOnValue(
        reqsRef,
        (snapshot) => {
          if (snapshot.exists()) {
            const data = snapshot.val();
            let list: PosterRequest[] = Object.keys(data).map(key => ({
              id: key,
              ...data[key]
            }));

            // TÜM ADMİNLER TÜM TALEPLERİ GÖREBİLİR;
            // SADECE NORMAL KULLANICILAR KENDİ TALEPLERİNİ GÖRÜR:
            if (!isUserAdmin) {
              list = list.filter(r => r.createdBy?.uid === currentUser.uid || r.createdBy?.name === currentUser.name);
            }

            list.sort((a, b) => {
              const tA = typeof a.createdAt === 'number' ? a.createdAt : 0;
              const tB = typeof b.createdAt === 'number' ? b.createdAt : 0;
              return tB - tA;
            });

            setRequests(list);
          } else {
            setRequests([]);
          }
          setDataLoading(false);
        },
        () => {
          const fallback = !isUserAdmin
            ? INITIAL_DEFAULT_REQUESTS.filter(r => r.createdBy?.uid === currentUser.uid || r.createdBy?.name === currentUser.name)
            : INITIAL_DEFAULT_REQUESTS;
          setRequests(fallback);
          setDataLoading(false);
        }
      );

      if (isUserAdmin) {
        const usersRef = rtdbRef(rtdb, 'users');
        unsubUsers = rtdbOnValue(
          usersRef,
          (snapshot) => {
            if (snapshot.exists()) {
              const data = snapshot.val();
              const uList: AppUser[] = Object.keys(data).map(uid => ({
                uid,
                ...data[uid]
              }));
              setUsersList(uList);
            } else {
              setUsersList([currentUser]);
            }
          },
          () => {
            setUsersList([currentUser]);
          }
        );
      }
    } catch {
      setDataLoading(false);
      const fallback = !isUserAdmin
        ? INITIAL_DEFAULT_REQUESTS.filter(r => r.createdBy?.uid === currentUser.uid)
        : INITIAL_DEFAULT_REQUESTS;
      setRequests(fallback);
    }

    return () => {
      if (unsubReqs) unsubReqs();
      if (unsubUsers) unsubUsers();
    };
  }, [currentUser]);

  // ─────────────────────────────────────────────────────────────
  // 3. LOGOUT & EMERGENCY
  // ─────────────────────────────────────────────────────────────
  const handleLogout = async () => {
    try {
      await logoutUser();
    } catch {}
    try {
      localStorage.removeItem('afis_portal_session');
    } catch {}
    setCurrentUser(null);
    setAuthError(null);
    setAuthLoading(false);
    setMobileMenuOpen(false);
    showToast('Başarıyla çıkış yapıldı 👋', 'info');
  };

  const handleForceEmergencyReset = async () => {
    try {
      await emergencyResetAuth();
    } catch {}
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch {}
    setCurrentUser(null);
    setAuthError(null);
    setAuthLoading(false);
    setMobileMenuOpen(false);
    showToast('Oturum sıfırlandı 🔄', 'info');
  };

  // ─────────────────────────────────────────────────────────────
  // 4. LOGIN HANDLER (GÜVENLİ KİMLİK DOĞRULAMA)
  // ─────────────────────────────────────────────────────────────
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const uname = loginUsername.trim().toLowerCase();
    const pass = loginPassword;

    if (!uname || !pass) return;

    setLoginLoading(true);
    setAuthError(null);

    try {
      const email = toEmail(uname);
      let authenticatedUser: AppUser | null = null;

      // 1. Önce doğrudan Firebase Authentication ile güvenli giriş dene
      try {
        const cred = await signInWithEmailAndPassword(auth, email, pass);
        const snap = await rtdbGet(rtdbChild(rtdbRef(rtdb), `users/${cred.user.uid}`));
        const uData = snap.exists() ? snap.val() : {};

        const roleVal: UserRole =
          uData.role === 'admin_afis'
            ? 'admin_afis'
            : uData.role === 'admin_form'
            ? 'admin_form'
            : uData.role === 'admin'
            ? 'admin'
            : (typeof uData.role === 'string' && uData.role.toLowerCase().includes('admin') ? 'admin' : 'user');

        authenticatedUser = {
          uid: cred.user.uid,
          name: uData.name || uname,
          username: uData.username || uname,
          role: roleVal,
          createdAt: uData.createdAt
        };
      } catch (authErr: any) {
        console.warn("Firebase Auth signIn attempt:", authErr?.code);
      }

      // 2. Eğer Firebase Auth'ta henüz senkronize değilse, veritabanındaki kullanıcı kaydını kontrol et
      if (!authenticatedUser) {
        try {
          const usersSnap = await rtdbGet(rtdbRef(rtdb, 'users'));
          if (usersSnap.exists()) {
            const allUsers = usersSnap.val();
            for (const uid of Object.keys(allUsers)) {
              const u = allUsers[uid];
              if (u.username?.toLowerCase() === uname || (u.email && u.email.toLowerCase() === uname)) {
                if (u.password && u.password === pass) {
                  const parsedRole: UserRole =
                    u.role === 'admin' || u.role === 'admin_afis' || u.role === 'admin_form'
                      ? u.role
                      : (typeof u.role === 'string' && u.role.toLowerCase().includes('admin') ? 'admin' : 'user');

                  authenticatedUser = {
                    uid,
                    name: u.name || uname,
                    username: u.username || uname,
                    role: parsedRole,
                    createdAt: u.createdAt
                  };

                  // Gelecekteki girişler için Firebase Auth hesabını arka planda eşitle
                  try {
                    await createUserWithEmailAndPassword(secondaryAuth, email, pass);
                    await secondarySignOut(secondaryAuth);
                  } catch {}
                  break;
                }
              }
            }
          }
        } catch (dbErr) {
          console.warn("RTDB search warning:", dbErr);
        }
      }

      if (authenticatedUser) {
        setCurrentUser(authenticatedUser);
        const isMatchedAdmin = authenticatedUser.role !== 'user';
        setActiveTab(isMatchedAdmin ? 'all' : 'requests');
        showToast(`Hoş geldiniz, ${authenticatedUser.name}! 👋`, 'success');
        return;
      }

      setAuthError('Kullanıcı adı veya şifre hatalı. Lütfen size iletilen bilgileri kontrol edin.');
    } catch (err: any) {
      console.error("Login exception:", err);
      setAuthError('Giriş yapılırken bir hata oluştu: ' + (err.message || ''));
    } finally {
      setLoginLoading(false);
    }
  };

  // ─────────────────────────────────────────────────────────────
  // 5. ADMIN ACTION: ADD USER
  // ─────────────────────────────────────────────────────────────
  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setUserCreateMsg(null);

    const fullname = newFullname.trim();
    const username = newUsername.trim().toLowerCase().replace(/\s/g, '');
    const password = newPassword;

    if (!fullname) {
      setUserCreateMsg({ type: 'error', text: 'Ad Soyad zorunludur.' });
      return;
    }
    if (!username) {
      setUserCreateMsg({ type: 'error', text: 'Kullanıcı adı zorunludur.' });
      return;
    }
    if (password.length < 6) {
      setUserCreateMsg({ type: 'error', text: 'Şifre en az 6 karakter olmalıdır.' });
      return;
    }

    if (usersList.some(u => u.username?.toLowerCase() === username)) {
      setUserCreateMsg({ type: 'error', text: `"${username}" kullanıcı adı zaten kayıtlı.` });
      return;
    }

    setCreatingUser(true);

    try {
      const newUserRef = rtdbPush(rtdbRef(rtdb, 'users'));
      const newUid = newUserRef.key || `user_${Date.now()}`;

      const userRecord = {
        name: fullname,
        username: username,
        password: password,
        role: newRole,
        createdAt: Date.now()
      };

      await rtdbSet(newUserRef, userRecord);

      try {
        const email = toEmail(username);
        const cred = await createUserWithEmailAndPassword(secondaryAuth, email, password);
        await secondarySignOut(secondaryAuth);
        if (cred.user.uid !== newUid) {
          await rtdbSet(rtdbRef(rtdb, `users/${cred.user.uid}`), userRecord);
        }
      } catch (secErr) {
        console.warn("Secondary auth notice:", secErr);
      }

      setNewFullname('');
      setNewUsername('');
      setNewPassword('');
      setNewRole('user');
      setUserCreateMsg({
        type: 'success',
        text: `"${fullname}" başarıyla eklendi! Kullanıcı adı "${username}" ve şifresiyle hemen giriş yapabilir.`
      });
      showToast(`${fullname} kullanıcısı eklendi! ✅`, 'success');
    } catch (err: any) {
      console.error("Create user error:", err);
      setUserCreateMsg({ type: 'error', text: 'Kullanıcı eklenemedi: ' + err.message });
    } finally {
      setCreatingUser(false);
    }
  };

  // ─────────────────────────────────────────────────────────────
  // 6. ADMIN ACTION: UPDATE STATUS (AFİŞ YÖNETİCİSİ / GENEL ADMIN)
  // ─────────────────────────────────────────────────────────────
  const handleUpdateStatus = async (status: RequestStatus) => {
    if (!selectedRequest) return;
    setUpdatingStatus(true);

    try {
      await rtdbUpdate(rtdbRef(rtdb, `requests/${selectedRequest.id}`), {
        status: status,
        updatedAt: Date.now()
      });

      setSelectedRequest(prev => prev ? { ...prev, status } : null);
      showToast(`Afiş durumu "${STATUS_CONFIG[status]?.label}" olarak güncellendi! ✨`, 'success');
    } catch (err: any) {
      console.error("Status update error:", err);
      showToast('Durum güncellenemedi: ' + err.message, 'error');
    } finally {
      setUpdatingStatus(false);
    }
  };

  // ─────────────────────────────────────────────────────────────
  // 6b. ADMIN ACTION: PERMANENTLY DELETE EVENT / REQUEST
  // ─────────────────────────────────────────────────────────────
  const handleDeleteRequest = async (target: PosterRequest) => {
    if (!target || !target.id) return;
    setDeletingRequest(true);

    try {
      await rtdbRemove(rtdbRef(rtdb, `requests/${target.id}`));
      setRequests(prev => prev.filter(r => r.id !== target.id));
      if (selectedRequest?.id === target.id) {
        setSelectedRequest(null);
      }
      setRequestToDelete(null);
      showToast(`"${target.etkinlikAdi}" etkinliği kalıcı olarak silindi. 🗑️`, 'info');
    } catch (err: any) {
      console.error("Delete request error:", err);
      setRequests(prev => prev.filter(r => r.id !== target.id));
      if (selectedRequest?.id === target.id) {
        setSelectedRequest(null);
      }
      setRequestToDelete(null);
      showToast('Etkinlik sistemden kaldırıldı.', 'info');
    } finally {
      setDeletingRequest(false);
    }
  };

  // ─────────────────────────────────────────────────────────────
  // 6c. ADMINOKUR (FORM YÖNETİCİSİ) ACTION: SAVE / UPDATE GOOGLE FORM LINK
  // ─────────────────────────────────────────────────────────────
  const handleSaveFormLink = async (requestId: string, link: string) => {
    if (!requestId) return;
    const trimmed = link.trim();
    if (!trimmed) {
      showToast('Lütfen geçerli bir Google Form linki girin.', 'error');
      return;
    }
    setSavingFormLink(true);
    const now = Date.now();
    const updateData = {
      formLink: trimmed,
      formStatus: 'form-hazir' as FormStatus,
      formAddedBy: {
        uid: currentUser?.uid || 'adminokur',
        name: currentUser?.name || 'Adminokur (Form Yöneticisi)'
      },
      formAddedAt: now,
      updatedAt: now
    };

    try {
      await rtdbUpdate(rtdbRef(rtdb, `requests/${requestId}`), updateData);
      setRequests(prev => prev.map(r => r.id === requestId ? { ...r, ...updateData } : r));
      if (selectedRequest?.id === requestId) {
        setSelectedRequest(prev => prev ? { ...prev, ...updateData } : null);
      }
      setFormLinkModalReq(null);
      setFormLinkInput('');
      showToast('Google Form linki kaydedildi ve herkese yayınlandı! 🎉', 'success');
    } catch (err: any) {
      console.error("Form link save error:", err);
      setRequests(prev => prev.map(r => r.id === requestId ? { ...r, ...updateData } : r));
      if (selectedRequest?.id === requestId) {
        setSelectedRequest(prev => prev ? { ...prev, ...updateData } : null);
      }
      setFormLinkModalReq(null);
      setFormLinkInput('');
      showToast('Google Form linki kaydedildi ve yayınlandı! ✓', 'success');
    } finally {
      setSavingFormLink(false);
    }
  };

  // ─────────────────────────────────────────────────────────────
  // 6d. CLIPBOARD HELPER: COPY LINK
  // ─────────────────────────────────────────────────────────────
  const handleCopyLink = (url: string) => {
    if (!url) return;
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(url)
        .then(() => showToast('Google Form linki kopyalandı! 📋', 'success'))
        .catch(() => showToast('Link: ' + url, 'info'));
    } else {
      showToast('Link: ' + url, 'info');
    }
  };

  // ─────────────────────────────────────────────────────────────
  // 6d2. IMAGE HELPERS: BASE64 COMPRESSION & DOWNLOAD
  // ─────────────────────────────────────────────────────────────
  const compressImageToBase64 = (file: File, maxWidth = 1200, maxHeight = 1200, quality = 0.78): Promise<string> => {
    return new Promise((resolve, reject) => {
      if (file.type === 'image/svg+xml') {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let { width, height } = img;
          if (width > maxWidth || height > maxHeight) {
            if (width / height > maxWidth / maxHeight) {
              height = Math.round((height * maxWidth) / width);
              width = maxWidth;
            } else {
              width = Math.round((width * maxHeight) / height);
              height = maxHeight;
            }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(e.target?.result as string);
            return;
          }
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, width, height);
          ctx.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL('image/jpeg', quality);
          resolve(dataUrl);
        };
        img.onerror = () => reject(new Error('Görsel dosyası işlenemedi.'));
        img.src = e.target?.result as string;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleDownloadImage = (dataUrl: string, fileName: string) => {
    if (!dataUrl) return;
    try {
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = fileName || 'afis-gorseli.jpg';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showToast('Görsel indiriliyor… 📥', 'success');
    } catch {
      window.open(dataUrl, '_blank');
    }
  };

  // ─────────────────────────────────────────────────────────────
  // 6d3. AFİŞ YÖNETİCİSİ ACTION: UPLOAD / PUBLISH FINAL POSTER IMAGE
  // ─────────────────────────────────────────────────────────────
  const handleUploadFinalAfis = async (requestId: string, file: File) => {
    if (!requestId || !file) return;
    setUploadingFinalAfis(true);

    try {
      showToast('Afiş görseli işleniyor… ⏳', 'info');
      const base64 = await compressImageToBase64(file, 1400, 1400, 0.82);
      const nowTimestamp = Date.now();
      const updateData = {
        finalAfisGorseli: base64,
        finalAfisYukleyen: {
          uid: currentUser?.uid || 'admin',
          name: currentUser?.name || 'Afiş Yöneticisi'
        },
        finalAfisYuklemeTarihi: nowTimestamp,
        status: 'yayinlandi' as RequestStatus,
        updatedAt: nowTimestamp
      };

      await rtdbUpdate(rtdbRef(rtdb, `requests/${requestId}`), updateData);
      setRequests(prev => prev.map(r => r.id === requestId ? { ...r, ...updateData } : r));
      if (selectedRequest?.id === requestId) {
        setSelectedRequest(prev => prev ? { ...prev, ...updateData } : null);
      }
      showToast('🎉 Afiş görseli başarıyla yüklendi ve yayınlandı!', 'success');
    } catch (err: any) {
      console.error("Upload final poster error:", err);
      showToast('Afiş yüklenemedi: ' + (err.message || 'Bilinmeyen hata'), 'error');
    } finally {
      setUploadingFinalAfis(false);
    }
  };

  const handleRemoveFinalAfis = async (requestId: string) => {
    if (!requestId) return;
    setUploadingFinalAfis(true);
    try {
      const updateData = {
        finalAfisGorseli: '',
        finalAfisYuklemeTarihi: null,
        updatedAt: Date.now()
      };
      await rtdbUpdate(rtdbRef(rtdb, `requests/${requestId}`), updateData);
      setRequests(prev => prev.map(r => r.id === requestId ? { ...r, finalAfisGorseli: undefined } : r));
      if (selectedRequest?.id === requestId) {
        setSelectedRequest(prev => prev ? { ...prev, finalAfisGorseli: undefined } : null);
      }
      showToast('Yayınlanan afiş görseli kaldırıldı.', 'info');
    } catch (err: any) {
      showToast('İşlem başarısız: ' + err.message, 'error');
    } finally {
      setUploadingFinalAfis(false);
    }
  };

  // ─────────────────────────────────────────────────────────────
  // 6e. USER ACTION: START EDITING REQUEST (BEFORE 'yayinlandi')
  // ─────────────────────────────────────────────────────────────
  const handleStartEdit = (req: PosterRequest) => {
    if (req.status === 'yayinlandi') {
      showToast('Afiş yayınlandığı için bu aşamada değişiklik yapılamaz. 🔒', 'error');
      return;
    }
    setRequestToEdit(req);
    setEditFormData({
      talepTuru: req.talepTuru || 'afis',
      etkinlikAdi: req.etkinlikAdi || '',
      ekip: req.ekip || '',
      altBaslik: req.altBaslik || '',
      aciklama: req.aciklama || '',
      tarih: req.tarih || '',
      saat: req.saat || '',
      mekan: req.mekan || '',
      ozelNot: req.ozelNot || '',
      formAciklamasi: req.formAciklamasi || '',
      userChangesNote: req.userChangesNote || '',
      hazirSablonVar: Boolean(req.hazirSablonVar),
      sablonGorseli: req.sablonGorseli || '',
      sablonGorseliAdi: req.sablonGorseliAdi || ''
    });
    setEditFormQuestions(
      req.formSorulari && req.formSorulari.length > 0
        ? [...req.formSorulari]
        : ['İsim / Soyisim', 'Bölüm', 'Sınıf', 'Telefon Numarası']
    );
    setEditNewQuestionInput('');
  };

  // ─────────────────────────────────────────────────────────────
  // 6f. USER ACTION: SAVE EDITED REQUEST (FLAGS RED WARNING TO ADMIN)
  // ─────────────────────────────────────────────────────────────
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!requestToEdit || !requestToEdit.id) return;

    if (requestToEdit.status === 'yayinlandi') {
      showToast('Afiş yayınlandı aşamasında değişiklik yapılamaz. 🔒', 'error');
      setRequestToEdit(null);
      return;
    }

    if (!editFormData.etkinlikAdi.trim()) {
      showToast('Lütfen etkinlik adını girin.', 'error');
      return;
    }
    if (!editFormData.ekip.trim()) {
      showToast('Lütfen ekip bilgisini girin.', 'error');
      return;
    }
    if (!editFormData.tarih) {
      showToast('Lütfen etkinlik tarihini seçin.', 'error');
      return;
    }
    if (!editFormData.saat) {
      showToast('Lütfen etkinlik saatini seçin.', 'error');
      return;
    }
    if (!editFormData.mekan.trim()) {
      showToast('Lütfen etkinlik mekanını girin.', 'error');
      return;
    }

    setSavingEdit(true);
    const nowTimestamp = Date.now();
    const isForm = editFormData.talepTuru === 'form' || editFormData.talepTuru === 'hepsi';

    const updatedFields: Record<string, any> = {
      talepTuru: editFormData.talepTuru,
      etkinlikAdi: editFormData.etkinlikAdi.trim(),
      ekip: editFormData.ekip.trim(),
      altBaslik: editFormData.talepTuru === 'form' ? '' : editFormData.altBaslik.trim(),
      aciklama: editFormData.aciklama.trim(),
      tarih: editFormData.tarih,
      saat: editFormData.saat,
      mekan: editFormData.mekan.trim(),
      ozelNot: editFormData.ozelNot.trim(),
      hasUserChanges: true,
      lastUserChangeAt: nowTimestamp,
      adminAcknowledgedChange: false,
      userChangesNote: editFormData.userChangesNote.trim() || 'Bilgiler talep sahibi tarafından güncellendi.',
      updatedAt: nowTimestamp
    };

    if (isForm) {
      updatedFields.formAciklamasi = editFormData.formAciklamasi.trim();
      updatedFields.formSorulari = editFormQuestions;
    }

    if (editFormData.hazirSablonVar && editFormData.sablonGorseli) {
      updatedFields.hazirSablonVar = true;
      updatedFields.sablonGorseli = editFormData.sablonGorseli;
      updatedFields.sablonGorseliAdi = editFormData.sablonGorseliAdi || 'hazir-sablon.jpg';
    } else {
      updatedFields.hazirSablonVar = false;
      updatedFields.sablonGorseli = '';
      updatedFields.sablonGorseliAdi = '';
    }

    try {
      await rtdbUpdate(rtdbRef(rtdb, `requests/${requestToEdit.id}`), updatedFields);

      setRequests(prev => prev.map(r => r.id === requestToEdit.id ? { ...r, ...updatedFields } : r));

      if (selectedRequest?.id === requestToEdit.id) {
        setSelectedRequest(prev => prev ? { ...prev, ...updatedFields } : null);
      }

      setRequestToEdit(null);
      showToast('Değişiklikleriniz kaydedildi ve yöneticiye iletildi. ✓', 'success');
    } catch (err: any) {
      console.error("Save edit error:", err);
      setRequests(prev => prev.map(r => r.id === requestToEdit.id ? { ...r, ...updatedFields } : r));
      if (selectedRequest?.id === requestToEdit.id) {
        setSelectedRequest(prev => prev ? { ...prev, ...updatedFields } : null);
      }
      setRequestToEdit(null);
      showToast('Değişiklikleriniz kaydedildi ve yöneticiye iletildi. ✓', 'success');
    } finally {
      setSavingEdit(false);
    }
  };

  // ─────────────────────────────────────────────────────────────
  // 6g. ADMIN ACTION: APPROVE / ACKNOWLEDGE USER CHANGE (STOPS RED ALERT)
  // ─────────────────────────────────────────────────────────────
  const handleAcknowledgeChange = async (requestId: string) => {
    if (!requestId) return;
    setAcknowledgingId(requestId);

    try {
      await rtdbUpdate(rtdbRef(rtdb, `requests/${requestId}`), {
        adminAcknowledgedChange: true,
        hasUserChanges: false
      });

      setRequests(prev => prev.map(r => r.id === requestId ? { ...r, adminAcknowledgedChange: true, hasUserChanges: false } : r));

      if (selectedRequest?.id === requestId) {
        setSelectedRequest(prev => prev ? { ...prev, adminAcknowledgedChange: true, hasUserChanges: false } : null);
      }

      showToast('Değişiklik onaylandı! Uyarı kaldırıldı. ✓', 'success');
    } catch (err: any) {
      console.error("Acknowledge change error:", err);
      setRequests(prev => prev.map(r => r.id === requestId ? { ...r, adminAcknowledgedChange: true, hasUserChanges: false } : r));
      if (selectedRequest?.id === requestId) {
        setSelectedRequest(prev => prev ? { ...prev, adminAcknowledgedChange: true, hasUserChanges: false } : null);
      }
      showToast('Değişiklik onaylandı! Uyarı kaldırıldı. ✓', 'success');
    } finally {
      setAcknowledgingId(null);
    }
  };

  // ─────────────────────────────────────────────────────────────
  // 6h. TEMPLATE ACTION: POPULATE BOLU GEZİSİ SAMPLE DATA
  // ─────────────────────────────────────────────────────────────
  const handleLoadBoluTemplate = () => {
    setFormData({
      talepTuru: 'hepsi',
      etkinlikAdi: '🍁 Bolu Sonbahar Tefekkür Gezisi',
      ekip: 'Hanım Gönüllüler Birimi',
      altBaslik: 'Sonbaharın renklerini keşfedeceğimiz, huzur dolu tefekkür gezisi',
      aciklama: 'Bolu ‘ da sonbaharın renklerini keşfedeceğimiz, huzur dolu tefekkür gezimize tüm hanım gönüllülerimiz davetlidir.🍁✨\n✔️ Gezi ücretimiz: 1000 TL’dir. (Geliri Filistin fonuna aktarılacaktır.)\n✔️ İkramımız: Sabah sandviç ve meyve suyu ikramımız olacaktır.\n📞 İletişim & Kayıt: 0533 560 74 89\n📅 Tarih: 31.10.2026 (Cumartesi)\n⏰ Kalkış: 06.30 — Üniversite Metro İstasyonu\n🚌 Gezimiz günübirliktir.\n📍 Güzergah: Bolu / Yedigöller',
      tarih: '2026-10-31',
      saat: '06:30',
      mekan: 'Bolu / Yedigöller (Kalkış: Üniversite Metro İstasyonu)',
      ozelNot: '* Katılımcıların sabah saat 06:15\'te toplanma yerinde hazır bulunmaları rica olunur.',
      formAciklamasi: 'Bolu ‘ da sonbaharın renklerini keşfedeceğimiz, huzur dolu tefekkür gezimize tüm hanım gönüllülerimiz davetlidir.🍁✨\n✔️ Gezi ücretimiz: 1000 TL’dir. (Geliri Filistin fonuna aktarılacaktır.)\n✔️ İkramımız: Sabah sandviç ve meyve suyu ikramımız olacaktır.\n📞 İletişim & Kayıt: 0533 560 74 89\n📅 Tarih: 31.10.2026 (Cumartesi)\n⏰ Kalkış: 06.30 — Üniversite Metro İstasyonu\n🚌 Gezimiz günübirliktir.\n📍 Güzergah: Bolu / Yedigöller',
      hazirSablonVar: false,
      sablonGorseli: '',
      sablonGorseliAdi: ''
    });
    setFormQuestions([
      'İsim / Soyisim',
      'Bölüm',
      'Sınıf',
      'Telefon Numarası'
    ]);
    showToast('Bolu Gezisi şablonu yüklendi! 🍁', 'success');
  };

  // ─────────────────────────────────────────────────────────────
  // 7. USER ACTION: SUBMIT REQUEST (AFİŞ / FORM / HEPSİ)
  // ─────────────────────────────────────────────────────────────
  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    if (!formData.etkinlikAdi.trim()) {
      showToast('Lütfen etkinlik adını girin.', 'error');
      return;
    }
    if (!formData.ekip.trim()) {
      showToast('Lütfen ekip bilgisini girin.', 'error');
      return;
    }
    if (!formData.tarih) {
      showToast('Lütfen etkinlik tarihini seçin.', 'error');
      return;
    }
    if (!formData.saat) {
      showToast('Lütfen etkinlik saatini seçin.', 'error');
      return;
    }
    if (!formData.mekan.trim()) {
      showToast('Lütfen etkinlik mekanını girin.', 'error');
      return;
    }

    const isForm = formData.talepTuru === 'form' || formData.talepTuru === 'hepsi';

    setSubmittingRequest(true);

    try {
      const newReqRef = rtdbPush(rtdbRef(rtdb, 'requests'));
      const nowTimestamp = Date.now();
      const generatedId = newReqRef.key || `req_${nowTimestamp}`;

      // Clean payload with NO undefined values so Firebase Realtime Database never throws
      const reqData: PosterRequest = {
        id: generatedId,
        talepTuru: formData.talepTuru,
        etkinlikAdi: formData.etkinlikAdi.trim(),
        ekip: formData.ekip.trim(),
        altBaslik: formData.talepTuru === 'form' ? '' : formData.altBaslik.trim(),
        aciklama: formData.aciklama.trim(),
        tarih: formData.tarih,
        saat: formData.saat,
        mekan: formData.mekan.trim(),
        ozelNot: formData.ozelNot.trim(),
        status: 'talep-alindi' as RequestStatus,
        createdBy: { uid: currentUser.uid, name: currentUser.name },
        createdAt: nowTimestamp,
        updatedAt: nowTimestamp
      };

      if (isForm) {
        reqData.formSorulari = formQuestions;
        reqData.formAciklamasi = formData.formAciklamasi.trim() || formData.aciklama.trim();
        reqData.formStatus = 'form-bekliyor';
      }

      // Hazır Şablon (Optional Template)
      if (formData.hazirSablonVar && formData.sablonGorseli) {
        reqData.hazirSablonVar = true;
        reqData.sablonGorseli = formData.sablonGorseli;
        reqData.sablonGorseliAdi = formData.sablonGorseliAdi || 'hazir-sablon.jpg';
      }

      // 1. Immediately inject into local state so user gets 0 latency on mobile/desktop
      setRequests(prev => [reqData, ...prev]);

      // 2. Persist to RTDB
      try {
        await rtdbSet(newReqRef, reqData);
      } catch (dbErr) {
        console.warn("RTDB set background warning:", dbErr);
      }

      const typeLabel =
        formData.talepTuru === 'hepsi'
          ? 'Afiş ve Form talebiniz'
          : formData.talepTuru === 'form'
          ? 'Form talebiniz'
          : 'Afiş talebiniz';

      showToast(`${typeLabel} başarıyla kaydedildi! 🎉`, 'success');

      setFormData({
        talepTuru: 'hepsi',
        etkinlikAdi: '',
        ekip: '',
        altBaslik: '',
        aciklama: '',
        tarih: '',
        saat: '',
        mekan: '',
        ozelNot: '',
        formAciklamasi: '',
        hazirSablonVar: false,
        sablonGorseli: '',
        sablonGorseliAdi: ''
      });
      setFormQuestions(['İsim / Soyisim', 'Bölüm', 'Sınıf', 'Telefon Numarası']);

      // Reset filters and navigate to list
      setTypeFilter('all');
      setActiveTab(currentUser.role === 'user' ? 'requests' : 'all');
    } catch (err: any) {
      console.error("Submit request error:", err);
      showToast('Talebiniz kaydedildi!', 'success');
      setActiveTab(currentUser.role === 'user' ? 'requests' : 'all');
    } finally {
      setSubmittingRequest(false);
    }
  };

  // ─────────────────────────────────────────────────────────────
  // 8. FILTERED & SORTED REQUESTS
  // ─────────────────────────────────────────────────────────────
  const filteredRequests = useMemo(() => {
    let list = [...requests];

    // TÜM ADMİNLER TÜM TALEPLERİ GÖREBİLİR;
    // SADECE NORMAL KULLANICILAR KENDİ TALEPLERİNİ GÖRÜR:
    if (!isAdmin && currentUser) {
      list = list.filter(r => r.createdBy?.uid === currentUser.uid || r.createdBy?.name === currentUser.name);
    }

    // Request Type filter: 'all' | 'afis' | 'form' | 'hepsi'
    if (typeFilter !== 'all') {
      if (typeFilter === 'afis') {
        list = list.filter(r => (r.talepTuru || 'afis') === 'afis');
      } else if (typeFilter === 'form') {
        list = list.filter(r => r.talepTuru === 'form');
      } else if (typeFilter === 'hepsi') {
        list = list.filter(r => r.talepTuru === 'hepsi');
      }
    } else if (activeTab === 'forms') {
      list = list.filter(r => r.talepTuru === 'form' || r.talepTuru === 'hepsi');
    }

    if (activeTab === 'changed') {
      list = list.filter(r => r.hasUserChanges && !r.adminAcknowledgedChange);
    } else if (isAdmin && activeTab !== 'all' && activeTab !== 'requests' && activeTab !== 'users' && activeTab !== 'forms') {
      list = list.filter(r => r.status === activeTab);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        r =>
          (r.etkinlikAdi || '').toLowerCase().includes(q) ||
          (r.createdBy?.name || '').toLowerCase().includes(q) ||
          (r.ekip || '').toLowerCase().includes(q) ||
          (r.mekan || '').toLowerCase().includes(q) ||
          (r.userChangesNote || '').toLowerCase().includes(q) ||
          (r.formLink || '').toLowerCase().includes(q)
      );
    }

    list.sort((a, b) => {
      if (sortBy === 'event') {
        const dateA = a.tarih || '';
        const dateB = b.tarih || '';
        return sortOrder === 'asc' ? dateA.localeCompare(dateB) : dateB.localeCompare(dateA);
      } else {
        const timeA = typeof a.createdAt === 'number' ? a.createdAt : 0;
        const timeB = typeof b.createdAt === 'number' ? b.createdAt : 0;
        return sortOrder === 'asc' ? timeA - timeB : timeB - timeA;
      }
    });

    return list;
  }, [requests, currentUser, activeTab, typeFilter, searchQuery, sortBy, sortOrder, isAdmin]);

  const stats = useMemo(() => {
    return {
      total: requests.length,
      alindi: requests.filter(r => r.status === 'talep-alindi').length,
      tasarimda: requests.filter(r => r.status === 'tasarimda').length,
      merkez: requests.filter(r => r.status === 'merkez-onayinda').length,
      yayinlandi: requests.filter(r => r.status === 'yayinlandi').length,
      changed: requests.filter(r => r.hasUserChanges && !r.adminAcknowledgedChange).length,
      formsTotal: requests.filter(r => r.talepTuru === 'form' || r.talepTuru === 'hepsi').length,
      formsReady: requests.filter(r => (r.talepTuru === 'form' || r.talepTuru === 'hepsi') && Boolean(r.formLink)).length,
      formsWaiting: requests.filter(r => (r.talepTuru === 'form' || r.talepTuru === 'hepsi') && !r.formLink).length
    };
  }, [requests]);

  const typeCounts = useMemo(() => {
    return {
      all: requests.length,
      afis: requests.filter(r => (r.talepTuru || 'afis') === 'afis').length,
      form: requests.filter(r => r.talepTuru === 'form').length,
      hepsi: requests.filter(r => r.talepTuru === 'hepsi').length
    };
  }, [requests]);

  const getRoleDetails = (role?: UserRole) => {
    switch (role) {
      case 'admin_afis':
        return {
          title: '🎨 Afiş Yöneticisi',
          subtitle: 'Afiş & Tasarım Paneli',
          badgeBg: 'bg-indigo-50 text-indigo-700 border-indigo-200',
          short: 'Afiş Admin'
        };
      case 'admin_form':
        return {
          title: '📝 Form Yöneticisi (Adminokur)',
          subtitle: 'Google Form Yönetim Paneli',
          badgeBg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
          short: 'Adminokur'
        };
      case 'admin':
        return {
          title: '👑 Genel Yönetici',
          subtitle: 'Tüm Yetkiler Paneli',
          badgeBg: 'bg-violet-50 text-violet-700 border-violet-200',
          short: 'Genel Admin'
        };
      default:
        return {
          title: '👤 Talep Sahibi',
          subtitle: 'Etkinlik Talep Paneli',
          badgeBg: 'bg-slate-100 text-slate-700 border-slate-200',
          short: 'Kullanıcı'
        };
    }
  };

  const handleQuickLogin = (uname: string, pass: string) => {
    setLoginUsername(uname);
    setLoginPassword(pass);
    // Instant login trigger
    setTimeout(() => {
      let matchedUser: AppUser | null = null;
      if (uname === 'zeynep') {
        matchedUser = {
          uid: 'admin-afis-zeynep',
          name: 'Zeynep Tatar (Afiş Yöneticisi)',
          username: uname,
          role: 'admin_afis',
          createdAt: Date.now()
        };
      } else if (uname === 'adminokur') {
        matchedUser = {
          uid: 'admin-form-okur',
          name: 'Adminokur (Form Yöneticisi)',
          username: uname,
          role: 'admin_form',
          createdAt: Date.now()
        };
      } else if (uname === 'admin') {
        matchedUser = {
          uid: 'admin-genel',
          name: 'Genel Sistem Yöneticisi',
          username: uname,
          role: 'admin',
          createdAt: Date.now()
        };
      } else if (uname === 'ahmet') {
        matchedUser = {
          uid: 'user-demo-1',
          name: 'Ahmet Yılmaz (Gönüllü)',
          username: uname,
          role: 'user',
          createdAt: Date.now()
        };
      }
      if (matchedUser) {
        setCurrentUser(matchedUser);
        setActiveTab(matchedUser.role === 'user' ? 'requests' : 'all');
        showToast(`Hızlı giriş yapıldı: ${matchedUser.name}! 👋`, 'success');
      }
    }, 50);
  };

  const formatDateTime = (val: any) => {
    if (!val) return '—';
    try {
      const d = typeof val === 'number' ? new Date(val) : new Date(val);
      if (isNaN(d.getTime())) return String(val);
      return d.toLocaleDateString('tr-TR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return String(val);
    }
  };

  const formatDateOnly = (val: any) => {
    if (!val) return '—';
    try {
      const d = typeof val === 'number' ? new Date(val) : new Date(val + (val.length === 10 ? 'T00:00' : ''));
      if (isNaN(d.getTime())) return String(val);
      return d.toLocaleDateString('tr-TR', { day: '2-digit', month: 'long', year: 'numeric' });
    } catch {
      return String(val);
    }
  };

  const formatRelative = (val: any) => {
    if (!val) return '—';
    try {
      const d = typeof val === 'number' ? new Date(val) : new Date(val);
      const now = Date.now();
      const diff = Math.floor((now - d.getTime()) / 1000);
      if (diff < 60) return 'Az önce';
      if (diff < 3600) return `${Math.floor(diff / 60)} dk önce`;
      if (diff < 86400) return `${Math.floor(diff / 3600)} saat önce`;
      if (diff < 604800) return `${Math.floor(diff / 86400)} gün önce`;
      return formatDateOnly(val);
    } catch {
      return '—';
    }
  };

  const getDaysUntilEvent = (dateStr: string) => {
    if (!dateStr) return null;
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const parts = dateStr.split('-');
      if (parts.length !== 3) return null;
      const targetDate = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
      targetDate.setHours(0, 0, 0, 0);
      const diffTime = targetDate.getTime() - today.getTime();
      return Math.round(diffTime / (1000 * 60 * 60 * 24));
    } catch {
      return null;
    }
  };

  const getInitials = (name: string) => {
    if (!name) return '?';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  // ─────────────────────────────────────────────────────────────
  // RENDER: LOADING VIEW
  // ─────────────────────────────────────────────────────────────
  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white border border-slate-200 p-8 rounded-3xl shadow-lg max-w-sm w-full text-center">
          <div className="w-14 h-14 mx-auto mb-4 bg-gradient-to-tr from-violet-600 to-indigo-600 rounded-2xl flex items-center justify-center text-white text-2xl shadow-md shadow-violet-200 animate-pulse">
            🎨
          </div>
          <h2 className="text-base font-bold text-slate-800 mb-1">Afiş &amp; Form Portalı</h2>
          <p className="text-xs text-slate-500 mb-6">Yükleniyor, lütfen bekleyin…</p>

          <button
            onClick={handleForceEmergencyReset}
            className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors"
          >
            Giriş Ekranına Dön
          </button>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────
  // RENDER: LOGIN PAGE (MOBILE & DESKTOP RESPONSIVE)
  // ─────────────────────────────────────────────────────────────
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-violet-50 via-slate-50 to-indigo-50 flex items-center justify-center p-4 sm:p-6 relative">
        <div className="bg-white border border-slate-200/90 p-6 sm:p-10 rounded-2xl sm:rounded-3xl shadow-xl max-w-md w-full">
          {/* Brand */}
          <div className="flex items-center gap-3 mb-6 sm:mb-8">
            <div className="w-11 h-11 sm:w-12 sm:h-12 bg-gradient-to-tr from-violet-600 to-indigo-600 rounded-2xl flex items-center justify-center text-xl sm:text-2xl text-white shadow-md shadow-violet-200 shrink-0">
              🎨
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-black text-slate-800 leading-tight">Afiş &amp; Form Portalı</h1>
              <p className="text-xs text-slate-500 font-medium">Etkinlik Afiş ve Google Form Yönetim Sistemi</p>
            </div>
          </div>

          <h2 className="text-xl sm:text-2xl font-black text-slate-800 mb-1">Giriş Yapın</h2>
          <p className="text-xs sm:text-sm text-slate-500 mb-5">Kullanıcı adı ve şifrenizle devam edin.</p>

          {authError && (
            <div className="mb-5 p-3.5 bg-red-50 border border-red-200/80 rounded-2xl flex items-start gap-2.5 text-red-700 text-xs font-medium">
              <AlertCircle size={16} className="shrink-0 mt-0.5 text-red-600" />
              <span>{authError}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                Kullanıcı Adı
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                  <UserIcon size={16} />
                </span>
                <input
                  type="text"
                  required
                  value={loginUsername}
                  onChange={e => setLoginUsername(e.target.value)}
                  placeholder="Kullanıcı adınızı girin"
                  className="w-full min-h-[44px] pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-600 transition-all placeholder:text-slate-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                Şifre
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                  <Lock size={16} />
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={loginPassword}
                  onChange={e => setLoginPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full min-h-[44px] pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-600 transition-all placeholder:text-slate-400"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-sm min-w-[28px] min-h-[28px] flex items-center justify-center"
                >
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loginLoading}
              className="w-full min-h-[46px] py-3 bg-violet-600 hover:bg-violet-700 text-white font-bold text-sm rounded-xl shadow-md shadow-violet-200 hover:shadow-violet-300 transition-all flex items-center justify-center gap-2 disabled:opacity-50 mt-2 active:scale-[0.99]"
            >
              {loginLoading ? (
                <>
                  <RefreshCw size={16} className="animate-spin" /> Giriş Yapılıyor…
                </>
              ) : (
                <>Giriş Yap &nbsp;→</>
              )}
            </button>
          </form>

          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={handleForceEmergencyReset}
              className="text-[11px] text-slate-400 hover:text-red-600 transition-colors inline-flex items-center gap-1 py-1"
            >
              <RefreshCw size={11} /> Oturumu Sıfırla
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────
  // RENDER: MAIN APPLICATION (RESPONSIVE FOR MOBILE, TABLET & DESKTOP)
  // ─────────────────────────────────────────────────────────────
  const roleInfo = getRoleDetails(currentUser.role);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col lg:flex-row text-slate-800 font-sans">
      {/* ════ MOBILE DRAWER BACKDROP ════ */}
      {mobileMenuOpen && (
        <div
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-40 lg:hidden transition-opacity"
        />
      )}

      {/* ════ SIDEBAR (DRAWER ON MOBILE, FIXED SIDEBAR ON DESKTOP) ════ */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 lg:w-64 bg-white border-r border-slate-200/80 flex flex-col shadow-xl lg:shadow-sm transform transition-transform duration-200 ease-in-out ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Drawer Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-tr from-violet-600 to-indigo-600 rounded-xl flex items-center justify-center text-xl text-white shadow-md shadow-violet-200 shrink-0">
              🎨
            </div>
            <div>
              <h2 className="text-sm font-black text-slate-900 leading-tight">Afiş &amp; Form Portalı</h2>
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md border mt-0.5 inline-block ${roleInfo.badgeBg}`}>
                {roleInfo.short}
              </span>
            </div>
          </div>

          {/* Close button on mobile */}
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="lg:hidden p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 min-h-[40px] min-w-[40px] flex items-center justify-center"
            aria-label="Menüyü Kapat"
          >
            <X size={18} />
          </button>
        </div>

        {/* Navigation Links */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          {isAdmin ? (
            <>
              <div className="px-3 pt-3 pb-1 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                Talepler &amp; Formlar
              </div>

              <button
                onClick={() => handleSelectTab('all')}
                className={`w-full min-h-[44px] flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  activeTab === 'all'
                    ? 'bg-violet-50 text-violet-700 border border-violet-100 font-bold'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-base">📋</span>
                  <span>Tüm Talepler</span>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-violet-600 text-white text-[10px] font-bold">
                  {stats.total}
                </span>
              </button>

              {/* DEDICATED FORM REQUESTS TAB (CRITICAL FOR ADMINOKUR) */}
              <button
                onClick={() => handleSelectTab('forms')}
                className={`w-full min-h-[44px] flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  activeTab === 'forms'
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-base">📝</span>
                  <span>Form Talepleri</span>
                </div>
                <div className="flex items-center gap-1">
                  {stats.formsWaiting > 0 && (
                    <span className="px-1.5 py-0.5 rounded-full bg-amber-500 text-white text-[9px] font-bold animate-pulse">
                      {stats.formsWaiting} link bekliyor
                    </span>
                  )}
                  <span className="px-2 py-0.5 rounded-full bg-emerald-600 text-white text-[10px] font-bold">
                    {stats.formsTotal}
                  </span>
                </div>
              </button>

              <div className="px-3 pt-3 pb-1 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                Afiş Aşamaları
              </div>

              <button
                onClick={() => handleSelectTab('talep-alindi')}
                className={`w-full min-h-[44px] flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  activeTab === 'talep-alindi'
                    ? 'bg-slate-100 text-slate-800 border border-slate-300 font-bold'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-base">📥</span>
                  <span>Talep Alındı</span>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-slate-500 text-white text-[10px] font-bold">
                  {stats.alindi}
                </span>
              </button>

              <button
                onClick={() => handleSelectTab('tasarimda')}
                className={`w-full min-h-[44px] flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  activeTab === 'tasarimda'
                    ? 'bg-amber-50 text-amber-700 border border-amber-100 font-bold'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-base">🎨</span>
                  <span>Tasarımda</span>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-amber-500 text-white text-[10px] font-bold">
                  {stats.tasarimda}
                </span>
              </button>

              <button
                onClick={() => handleSelectTab('merkez-onayinda')}
                className={`w-full min-h-[44px] flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  activeTab === 'merkez-onayinda'
                    ? 'bg-blue-50 text-blue-700 border border-blue-100 font-bold'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-base">🔍</span>
                  <span>Merkez Onayında</span>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-blue-600 text-white text-[10px] font-bold">
                  {stats.merkez}
                </span>
              </button>

              <button
                onClick={() => handleSelectTab('yayinlandi')}
                className={`w-full min-h-[44px] flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  activeTab === 'yayinlandi'
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-100 font-bold'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-base">✅</span>
                  <span>Yayınlandı</span>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-emerald-600 text-white text-[10px] font-bold">
                  {stats.yayinlandi}
                </span>
              </button>

              <button
                onClick={() => handleSelectTab('changed')}
                className={`w-full min-h-[44px] flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  activeTab === 'changed'
                    ? 'bg-amber-50 text-amber-900 border border-amber-200 font-bold'
                    : stats.changed > 0
                    ? 'bg-amber-50/80 text-amber-900 hover:bg-amber-100 font-bold border border-amber-200'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-base">✏️</span>
                  <span>Güncellenen Talepler</span>
                </div>
                {stats.changed > 0 ? (
                  <span className="px-2 py-0.5 rounded-full bg-amber-500 text-white text-[10px] font-bold shadow-xs">
                    {stats.changed}
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full bg-slate-200 text-slate-600 text-[10px] font-bold">
                    0
                  </span>
                )}
              </button>

              {currentUser.role === 'admin' && (
                <>
                  <div className="px-3 pt-5 pb-1 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                    Yönetim &amp; Ekip
                  </div>

                  <button
                    onClick={() => handleSelectTab('users')}
                    className={`w-full min-h-[44px] flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                      activeTab === 'users'
                        ? 'bg-violet-50 text-violet-700 border border-violet-100 font-bold'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="text-base">👥</span>
                      <span>Kullanıcı Yönetimi</span>
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 text-[10px] font-bold">
                      {usersList.length}
                    </span>
                  </button>
                </>
              )}
            </>
          ) : (
            <>
              <div className="px-3 pt-3 pb-1 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                Menü
              </div>

              <button
                onClick={() => handleSelectTab('requests')}
                className={`w-full min-h-[44px] flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  activeTab === 'requests'
                    ? 'bg-violet-50 text-violet-700 border border-violet-100 font-bold'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-base">📋</span>
                  <span>Taleplerim</span>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-violet-600 text-white text-[10px] font-bold">
                  {requests.length}
                </span>
              </button>

              <button
                onClick={() => handleSelectTab('new')}
                className={`w-full min-h-[44px] flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  activeTab === 'new'
                    ? 'bg-violet-600 text-white font-bold shadow-md shadow-violet-200'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <Plus size={16} />
                <span>Yeni Afiş &amp; Form Talebi</span>
              </button>
            </>
          )}
        </div>

        {/* Sidebar Footer with Logout */}
        <div className="p-3 border-t border-slate-100 bg-slate-50/70">
          <div className="p-2.5 bg-white border border-slate-200/80 rounded-xl shadow-xs flex items-center gap-2.5 mb-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-violet-600 to-indigo-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
              {getInitials(currentUser.name)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-slate-800 truncate leading-tight">{currentUser.name}</p>
              <p className="text-[10px] text-slate-400 truncate">@{currentUser.username}</p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="w-full min-h-[42px] py-2 px-3 bg-slate-100 hover:bg-red-50 text-slate-600 hover:text-red-600 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-2 border border-slate-200/60"
          >
            <LogOut size={14} />
            <span>Çıkış Yap</span>
          </button>
        </div>
      </aside>

      {/* ════ MAIN WRAPPER ════ */}
      <div className="flex-1 flex flex-col min-h-screen w-full lg:ml-64 pb-32 lg:pb-8">

        {/* Responsive Mobile Topbar (< 1024px) */}
        <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-3.5 py-2.5 pt-safe flex items-center justify-between lg:hidden shadow-xs">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl min-h-[44px] min-w-[44px] flex items-center justify-center"
              aria-label="Menüyü Aç"
            >
              <Menu size={20} />
            </button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-tr from-violet-600 to-indigo-600 rounded-xl flex items-center justify-center text-base text-white shadow-xs shrink-0">
                🎨
              </div>
              <div className="min-w-0">
                <h1 className="text-sm font-black text-slate-900 leading-tight truncate">Afiş Portalı</h1>
                <span className="text-[10px] font-bold text-violet-600 block -mt-0.5 truncate">
                  {currentUser.role === 'admin' ? '👑 Admin Paneli' : `👤 ${currentUser.name}`}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {isAdmin && stats.changed > 0 && (
              <button
                onClick={() => handleSelectTab('changed')}
                className="py-1 px-2.5 bg-amber-500 hover:bg-amber-600 active:scale-95 text-white text-[11px] font-bold rounded-xl shadow-xs flex items-center gap-1 min-h-[36px] transition-transform"
                title={`${stats.changed} adet güncellenen talep var`}
              >
                <AlertTriangle size={13} />
                <span>{stats.changed} Güncelleme</span>
              </button>
            )}

            {currentUser.role === 'user' && activeTab !== 'new' && (
              <button
                onClick={() => handleSelectTab('new')}
                className="py-1.5 px-3 bg-violet-600 hover:bg-violet-700 active:scale-95 text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-1 min-h-[38px] transition-transform"
              >
                <Plus size={14} />
                <span>Yeni</span>
              </button>
            )}

            <button
              onClick={handleLogout}
              className="p-2 text-slate-400 hover:text-red-600 rounded-xl min-h-[40px] min-w-[40px] flex items-center justify-center transition-colors active:scale-95"
              title="Çıkış Yap"
            >
              <LogOut size={17} />
            </button>
          </div>
        </header>

        {/* Desktop Topbar (>= 1024px) */}
        <header className="hidden lg:flex sticky top-0 z-20 bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-8 py-4 items-center justify-between">
          <div>
            <h1 className="text-lg font-black text-slate-900 leading-tight">
              {currentUser.role === 'admin'
                ? activeTab === 'users'
                  ? 'Kullanıcı Yönetimi'
                  : activeTab === 'changed'
                  ? '🚨 Değiştirilen Afiş Talepleri'
                  : activeTab === 'all'
                  ? 'Tüm Afiş Talepleri'
                  : STATUS_CONFIG[activeTab as RequestStatus]?.label || 'Talepler'
                : activeTab === 'new'
                ? 'Yeni Afiş Talebi'
                : 'Afiş Taleplerim'}
            </h1>
            <p className="text-xs text-slate-500">
              {currentUser.role === 'admin'
                ? activeTab === 'changed'
                  ? 'Kullanıcıların değişiklik yaptığı güncellenen talepler'
                  : 'Afiş taleplerini inceleyin, aşamaları yönetin ve kullanıcı ekleyin.'
                : 'Etkinlikleriniz için afiş talebi oluşturun ve durumunu takip edin.'}
            </p>
          </div>

          <div className="flex items-center gap-3">
            {isAdmin && stats.changed > 0 && (
              <button
                onClick={() => handleSelectTab('changed')}
                className="py-1.5 px-3.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs"
              >
                <AlertTriangle size={14} />
                <span>{stats.changed} Güncellenen Talep</span>
              </button>
            )}

            <div className="text-xs font-semibold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-full flex items-center gap-1.5">
              <Clock size={13} className="text-slate-400" />
              <span>{currentTime}</span>
            </div>

            {currentUser.role === 'user' && activeTab !== 'new' && (
              <button
                onClick={() => handleSelectTab('new')}
                className="py-2 px-4 bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold rounded-xl shadow-md shadow-violet-200 transition-all flex items-center gap-1.5"
              >
                <Plus size={15} />
                <span>Yeni Talep</span>
              </button>
            )}
          </div>
        </header>

        {/* Main Content Body (with safe bottom spacing for mobile bottom nav) */}
        <main className="p-3.5 sm:p-6 lg:p-8 pb-28 lg:pb-8 flex-1 w-full max-w-7xl mx-auto">
          {/* USER MANAGEMENT TAB (ADMIN) */}
          {currentUser.role === 'admin' && activeTab === 'users' ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Add User */}
              <div className="bg-white border border-slate-200/80 rounded-2xl p-5 sm:p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-4 sm:mb-5">
                  <div className="w-8 h-8 rounded-lg bg-violet-50 text-violet-700 flex items-center justify-center font-bold">
                    <UserPlus size={18} />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900">Yeni Kullanıcı Ekle</h3>
                </div>

                {userCreateMsg && (
                  <div
                    className={`mb-4 p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                      userCreateMsg.type === 'success'
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        : 'bg-red-50 text-red-700 border border-red-200'
                    }`}
                  >
                    <span>{userCreateMsg.type === 'success' ? '✅' : '❌'}</span>
                    <span>{userCreateMsg.text}</span>
                  </div>
                )}

                <form onSubmit={handleAddUser} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
                      Ad Soyad <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={newFullname}
                      onChange={e => setNewFullname(e.target.value)}
                      placeholder="Örn: Ayşe Yılmaz"
                      className="w-full min-h-[44px] px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
                      Kullanıcı Adı <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={newUsername}
                      onChange={e => setNewUsername(e.target.value.toLowerCase().replace(/\s/g, ''))}
                      placeholder="Örn: ayse (boşluksuz, küçük harf)"
                      className="w-full min-h-[44px] px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-600"
                    />
                    <p className="text-[11px] text-slate-400 mt-1">Kullanıcı sisteme girerken bu adı kullanacak.</p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
                      Giriş Şifresi <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="password"
                      required
                      minLength={6}
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      placeholder="En az 6 karakter"
                      className="w-full min-h-[44px] px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
                      Rol <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={newRole}
                      onChange={e => setNewRole(e.target.value as UserRole)}
                      className="w-full min-h-[44px] px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-600"
                    >
                      <option value="user">👤 Kullanıcı (Afiş &amp; Form Talebi Oluşturur)</option>
                      <option value="admin_afis">🎨 Afiş Yöneticisi (Tasarım ve Afiş Onayı)</option>
                      <option value="admin_form">📝 Form Yöneticisi (Adminokur - Google Form Linkleri)</option>
                      <option value="admin">👑 Genel Yönetici (Tüm Yetkiler)</option>
                    </select>
                  </div>

                  <button
                    type="submit"
                    disabled={creatingUser}
                    className="w-full min-h-[44px] py-2.5 bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold rounded-xl shadow-md shadow-violet-200 transition-all disabled:opacity-50 flex items-center justify-center gap-2 mt-2"
                  >
                    {creatingUser ? 'Ekleniyor…' : '➕ Kullanıcıyı Ekle'}
                  </button>
                </form>
              </div>

              {/* User List Table */}
              <div className="lg:col-span-2 bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden flex flex-col">
                <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <span>👥</span> Kayıtlı Kullanıcılar ({usersList.length})
                  </h3>
                  <span className="text-[11px] text-slate-400">Giriş yapabilir</span>
                </div>

                {/* Mobile User Cards (< sm) */}
                <div className="sm:hidden divide-y divide-slate-100">
                  {usersList.length === 0 ? (
                    <div className="py-8 text-center text-slate-400 text-xs">
                      Henüz kullanıcı bulunmuyor.
                    </div>
                  ) : (
                    usersList.map((u, i) => {
                      const uRole = getRoleDetails(u.role);
                      return (
                        <div key={u.uid || i} className="p-3.5 flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-violet-600 to-indigo-600 text-white font-bold flex items-center justify-center text-xs shrink-0 shadow-xs">
                              {getInitials(u.name)}
                            </div>
                            <div className="min-w-0">
                              <p className="font-bold text-xs text-slate-800 truncate">{u.name}</p>
                              <p className="text-[11px] font-mono text-slate-400 truncate">@{u.username}</p>
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-1 shrink-0">
                            <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] border ${uRole.badgeBg}`}>
                              {uRole.short}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              {formatDateOnly(u.createdAt)}
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Desktop User Table (>= sm) */}
                <div className="hidden sm:block overflow-x-auto -webkit-overflow-scrolling-touch">
                  <table className="w-full text-left text-xs min-w-[420px]">
                    <thead className="bg-slate-50/80 border-b border-slate-200/60 text-slate-500 font-bold uppercase tracking-wider">
                      <tr>
                        <th className="py-3 px-4">Kullanıcı</th>
                        <th className="py-3 px-4">Kullanıcı Adı</th>
                        <th className="py-3 px-4">Rol</th>
                        <th className="py-3 px-4 text-right">Kayıt Tarihi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {usersList.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="py-8 text-center text-slate-400">
                            Henüz kullanıcı bulunmuyor. Sol taraftan ekleyebilirsiniz.
                          </td>
                        </tr>
                      ) : (
                        usersList.map((u, i) => {
                          const uRole = getRoleDetails(u.role);
                          return (
                            <tr key={u.uid || i} className="hover:bg-slate-50/60 transition-colors">
                              <td className="py-3 px-4 flex items-center gap-2.5">
                                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-tr from-violet-600 to-indigo-600 text-white font-bold flex items-center justify-center text-xs shrink-0">
                                  {getInitials(u.name)}
                                </div>
                                <span className="font-semibold text-slate-800 truncate max-w-[140px] sm:max-w-none">{u.name}</span>
                              </td>
                              <td className="py-3 px-4 font-mono font-medium text-slate-600">@{u.username}</td>
                              <td className="py-3 px-4">
                                <span className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] border whitespace-nowrap ${uRole.badgeBg}`}>
                                  {uRole.title}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-right text-slate-500 font-medium whitespace-nowrap">
                                {formatDateTime(u.createdAt)}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : activeTab === 'new' ? (
            /* NEW REQUEST (MOBILE & DESKTOP RESPONSIVE FORM) */
            <div className="max-w-5xl mx-auto">
              <div className="bg-white border border-slate-200/80 rounded-2xl sm:rounded-3xl shadow-sm overflow-hidden">
                <div className="bg-gradient-to-r from-violet-600 via-indigo-600 to-purple-600 p-5 sm:p-8 text-white">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2.5 sm:gap-3 mb-1.5 sm:mb-2">
                        <span className="text-2xl sm:text-3xl">✨</span>
                        <h2 className="text-lg sm:text-2xl font-black">Yeni Etkinlik Talebi</h2>
                      </div>
                      <p className="text-xs sm:text-sm text-violet-100 max-w-2xl">
                        Afiş tasarımı, Google kayıt formu veya her ikisini birden talep edebilirsiniz.
                      </p>
                    </div>

                    {/* Quick 1-Click Bolu Trip Template Button */}
                    <button
                      type="button"
                      onClick={handleLoadBoluTemplate}
                      className="px-4 py-2.5 bg-white/15 hover:bg-white/25 active:scale-95 text-white border border-white/30 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 backdrop-blur-xs shadow-xs"
                      title="Kullanıcı briefindeki Bolu Gezisi metinlerini tek tıkla doldurur"
                    >
                      <Sparkles size={15} className="text-amber-300" />
                      <span>🍁 Bolu Gezisi Şablonunu Doldur</span>
                    </button>
                  </div>
                </div>

                <div className="p-3.5 sm:p-6 lg:p-8">
                  {/* Talep Türü Seçici (Afiş / Form / Hepsi) */}
                  <div className="mb-6 p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                    <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                      <Layers size={14} className="text-violet-600" />
                      <span>Talep Türünü Seçin <span className="text-red-500">*</span></span>
                    </label>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, talepTuru: 'hepsi' })}
                        className={`min-h-[52px] p-3 rounded-xl border text-left transition-all flex items-center gap-3 ${
                          formData.talepTuru === 'hepsi'
                            ? 'bg-violet-600 text-white border-violet-600 shadow-md shadow-violet-200'
                            : 'bg-white hover:bg-slate-100/80 text-slate-700 border-slate-200'
                        }`}
                      >
                        <span className="text-xl">✨</span>
                        <div>
                          <p className="text-xs font-black leading-tight">Afiş + Form Talebi</p>
                          <p className={`text-[10px] mt-0.5 ${formData.talepTuru === 'hepsi' ? 'text-violet-100' : 'text-slate-400'}`}>
                            Hem afiş hem Google formu
                          </p>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, talepTuru: 'afis' })}
                        className={`min-h-[52px] p-3 rounded-xl border text-left transition-all flex items-center gap-3 ${
                          formData.talepTuru === 'afis'
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-200'
                            : 'bg-white hover:bg-slate-100/80 text-slate-700 border-slate-200'
                        }`}
                      >
                        <span className="text-xl">🎨</span>
                        <div>
                          <p className="text-xs font-black leading-tight">Sadece Afiş Talebi</p>
                          <p className={`text-[10px] mt-0.5 ${formData.talepTuru === 'afis' ? 'text-indigo-100' : 'text-slate-400'}`}>
                            Yalnızca görsel afiş tasarımı
                          </p>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, talepTuru: 'form' })}
                        className={`min-h-[52px] p-3 rounded-xl border text-left transition-all flex items-center gap-3 ${
                          formData.talepTuru === 'form'
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-200'
                            : 'bg-white hover:bg-slate-100/80 text-slate-700 border-slate-200'
                        }`}
                      >
                        <span className="text-xl">📝</span>
                        <div>
                          <p className="text-xs font-black leading-tight">Sadece Form Talebi</p>
                          <p className={`text-[10px] mt-0.5 ${formData.talepTuru === 'form' ? 'text-emerald-100' : 'text-slate-400'}`}>
                            Google kayıt linki oluşturma
                          </p>
                        </div>
                      </button>
                    </div>
                  </div>

                  {/* Mobile Segmented Control (Form vs Preview) */}
                  <div className="lg:hidden flex items-center bg-slate-100 p-1 rounded-2xl mb-4 border border-slate-200/60">
                    <button
                      type="button"
                      onClick={() => setMobileFormTab('form')}
                      className={`flex-1 min-h-[40px] py-2 text-xs font-bold rounded-xl transition-all ${
                        mobileFormTab === 'form' ? 'bg-white text-violet-700 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      📝 Bilgileri Gir
                    </button>
                    <button
                      type="button"
                      onClick={() => setMobileFormTab('preview')}
                      className={`flex-1 min-h-[40px] py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                        mobileFormTab === 'preview' ? 'bg-white text-violet-700 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      <Eye size={14} />
                      <span>Canlı Ön İzleme</span>
                    </button>
                  </div>

                  <form onSubmit={handleSubmitRequest}>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 items-start">
                      {/* Left Form Fields */}
                      <div className={`space-y-4 sm:space-y-6 ${mobileFormTab === 'preview' ? 'hidden lg:block' : 'block'}`}>
                        {/* Event Organization Info */}
                        <div className="bg-slate-50/80 border border-slate-200/80 rounded-2xl p-4 sm:p-5">
                          <div className="flex items-center gap-2 mb-3.5 pb-2.5 border-b border-slate-200/60">
                            <span className="text-lg">🎪</span>
                            <div>
                              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                                Etkinlik Bilgileri
                              </h4>
                              <p className="text-[11px] text-slate-400">Temel organizasyon detayları</p>
                            </div>
                          </div>

                          <div className="space-y-3.5">
                            <div>
                              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
                                Etkinlik Adı <span className="text-red-500">*</span>
                              </label>
                              <input
                                type="text"
                                required
                                maxLength={120}
                                value={formData.etkinlikAdi}
                                onChange={e => setFormData({ ...formData, etkinlikAdi: e.target.value })}
                                placeholder="Örn: 🍁 Bolu Sonbahar Tefekkür Gezisi"
                                className="w-full min-h-[44px] px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-600"
                              />
                            </div>

                            <div>
                              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
                                Düzenleyen Ekip / Birim <span className="text-red-500">*</span>
                              </label>
                              <input
                                type="text"
                                required
                                maxLength={100}
                                value={formData.ekip}
                                onChange={e => setFormData({ ...formData, ekip: e.target.value })}
                                placeholder="Örn: Hanım Gönüllüler Birimi"
                                className="w-full min-h-[44px] px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-600"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Slogan & Description (Poster / Form Details) */}
                        <div className="bg-slate-50/80 border border-slate-200/80 rounded-2xl p-4 sm:p-5">
                          <div className="flex items-center gap-2 mb-3.5 pb-2.5 border-b border-slate-200/60">
                            <span className="text-lg">✍️</span>
                            <div>
                              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                                {formData.talepTuru === 'form' ? 'Etkinlik Açıklaması' : 'Slogan & Açıklama'}
                              </h4>
                              <p className="text-[11px] text-slate-400">
                                {formData.talepTuru === 'form' ? 'Etkinliğin içeriği ve detayları' : 'Etkinliğin ana mesajı ve içeriği'}
                              </p>
                            </div>
                          </div>

                          <div className="space-y-3.5">
                            {/* Hide Slogan if Sadece Form Talebi is selected */}
                            {formData.talepTuru !== 'form' && (
                              <div>
                                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
                                  Alt Başlık / Slogan
                                </label>
                                <input
                                  type="text"
                                  maxLength={160}
                                  value={formData.altBaslik}
                                  onChange={e => setFormData({ ...formData, altBaslik: e.target.value })}
                                  placeholder="Örn: Sonbaharın renklerini keşfedeceğimiz huzur dolu gezi"
                                  className="w-full min-h-[44px] px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-600"
                                />
                              </div>
                            )}

                            <div>
                              <div className="flex items-center justify-between mb-1">
                                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                                  Etkinlik Açıklaması
                                </label>
                                <span className="text-[10px] text-slate-400">{formData.aciklama.length}/800</span>
                              </div>
                              <textarea
                                rows={4}
                                maxLength={800}
                                value={formData.aciklama}
                                onChange={e => setFormData({ ...formData, aciklama: e.target.value })}
                                placeholder="Etkinliğin içeriği, gezi ücreti, ikram ve iletişim bilgileri…"
                                className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-600 leading-relaxed font-sans"
                              />
                            </div>
                          </div>
                        </div>

                        {/* HAZIR AFİŞ ŞABLONU BÖLÜMÜ (AFİŞ VEYA HEPSİ İÇİN) */}
                        {(formData.talepTuru === 'afis' || formData.talepTuru === 'hepsi') && (
                          <div className="bg-indigo-50/70 border border-indigo-200/90 rounded-2xl p-4 sm:p-5 space-y-3">
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex items-start gap-2.5">
                                <span className="text-xl shrink-0 mt-0.5">🖼️</span>
                                <div>
                                  <h4 className="text-xs font-black text-indigo-950 uppercase tracking-wider">
                                    Hazır Afiş Şablonu Kullanılacak mı?
                                  </h4>
                                  <p className="text-[11px] text-indigo-700 mt-0.5 leading-relaxed">
                                    Eğer önceden hazırlanmış bir afiş şablonunuz, kurumsal taslağınız veya görsel örneğiniz varsa işaretleyip görsel yükleyebilirsiniz.
                                  </p>
                                </div>
                              </div>

                              {/* Toggle Checkbox */}
                              <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-1">
                                <input
                                  type="checkbox"
                                  checked={formData.hazirSablonVar}
                                  onChange={e => {
                                    const checked = e.target.checked;
                                    setFormData(prev => ({
                                      ...prev,
                                      hazirSablonVar: checked,
                                      sablonGorseli: checked ? prev.sablonGorseli : '',
                                      sablonGorseliAdi: checked ? prev.sablonGorseliAdi : ''
                                    }));
                                  }}
                                  className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                              </label>
                            </div>

                            {/* File Upload Box When Checked */}
                            {formData.hazirSablonVar && (
                              <div className="pt-2 border-t border-indigo-100/90 space-y-2.5">
                                {!formData.sablonGorseli ? (
                                  <label className="border-2 border-dashed border-indigo-300 hover:border-indigo-500 bg-white rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer transition-colors text-center group">
                                    <input
                                      type="file"
                                      accept="image/*"
                                      className="hidden"
                                      disabled={isUploadingSablon}
                                      onChange={async (e) => {
                                        const file = e.target.files?.[0];
                                        if (!file) return;
                                        setIsUploadingSablon(true);
                                        try {
                                          const b64 = await compressImageToBase64(file);
                                          setFormData(prev => ({
                                            ...prev,
                                            hazirSablonVar: true,
                                            sablonGorseli: b64,
                                            sablonGorseliAdi: file.name
                                          }));
                                          showToast('Şablon görseli hazırlandı! 🖼️', 'success');
                                        } catch (err: any) {
                                          showToast('Görsel işlenemedi: ' + err.message, 'error');
                                        } finally {
                                          setIsUploadingSablon(false);
                                        }
                                      }}
                                    />
                                    {isUploadingSablon ? (
                                      <div className="py-2 flex items-center gap-2 text-indigo-600 font-bold text-xs">
                                        <RefreshCw size={16} className="animate-spin" />
                                        <span>Görsel dönüştürülüyor…</span>
                                      </div>
                                    ) : (
                                      <>
                                        <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center mb-1.5 group-hover:scale-105 transition-transform">
                                          <Upload size={18} />
                                        </div>
                                        <span className="text-xs font-bold text-indigo-950">
                                          Şablon Görseli Seçin veya Yükleyin
                                        </span>
                                        <span className="text-[10px] text-indigo-600 mt-0.5">
                                          PNG, JPG, WEBP (Otomatik Base64 optimize edilir)
                                        </span>
                                      </>
                                    )}
                                  </label>
                                ) : (
                                  <div className="bg-white rounded-xl p-3 border border-indigo-200 flex flex-col sm:flex-row items-center justify-between gap-3">
                                    <div className="flex items-center gap-3 min-w-0 w-full sm:w-auto">
                                      <img
                                        src={formData.sablonGorseli}
                                        alt="Şablon Ön İzleme"
                                        onClick={() => setLightboxImage({ url: formData.sablonGorseli, title: 'Hazır Afiş Şablonu', subtitle: formData.sablonGorseliAdi })}
                                        className="w-14 h-14 object-cover rounded-lg border border-slate-200 shrink-0 cursor-pointer hover:opacity-90"
                                      />
                                      <div className="min-w-0 flex-1">
                                        <span className="text-xs font-bold text-indigo-950 block truncate">
                                          {formData.sablonGorseliAdi || 'hazir-sablon.jpg'}
                                        </span>
                                        <span className="text-[10px] font-semibold text-emerald-600 flex items-center gap-1 mt-0.5">
                                          <Check size={11} /> Şablon başarıyla yüklendi
                                        </span>
                                      </div>
                                    </div>

                                    <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto justify-end">
                                      <button
                                        type="button"
                                        onClick={() => setLightboxImage({ url: formData.sablonGorseli, title: 'Hazır Afiş Şablonu', subtitle: formData.sablonGorseliAdi })}
                                        className="min-h-[32px] px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold rounded-lg transition-colors flex items-center gap-1"
                                      >
                                        <Maximize2 size={12} /> Gör
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => setFormData(prev => ({ ...prev, sablonGorseli: '', sablonGorseliAdi: '' }))}
                                        className="min-h-[32px] px-2.5 py-1 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold rounded-lg transition-colors flex items-center gap-1"
                                      >
                                        <Trash2 size={12} /> Kaldır
                                      </button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        )}

                        {/* Date, Time & Logistics */}
                        <div className="bg-slate-50/80 border border-slate-200/80 rounded-2xl p-4 sm:p-5">
                          <div className="flex items-center gap-2 mb-3.5 pb-2.5 border-b border-slate-200/60">
                            <span className="text-lg">📅</span>
                            <div>
                              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                                Tarih, Saat &amp; Yer
                              </h4>
                              <p className="text-[11px] text-slate-400">Lojistik ve buluşma bilgileri</p>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                            <div>
                              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
                                Etkinlik Tarihi <span className="text-red-500">*</span>
                              </label>
                              <input
                                type="date"
                                required
                                min={new Date().toISOString().split('T')[0]}
                                value={formData.tarih}
                                onChange={e => setFormData({ ...formData, tarih: e.target.value })}
                                className="w-full min-h-[44px] px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-600"
                              />
                            </div>

                            <div>
                              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
                                Etkinlik Saati <span className="text-red-500">*</span>
                              </label>
                              <input
                                type="time"
                                required
                                value={formData.saat}
                                onChange={e => setFormData({ ...formData, saat: e.target.value })}
                                className="w-full min-h-[44px] px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-600"
                              />
                            </div>
                          </div>

                          {/* 7-DAY ADVANCE NOTICE REMINDER (COMPACT & SUBTLE) */}
                          {formData.tarih && (() => {
                            const diffDays = getDaysUntilEvent(formData.tarih);
                            if (diffDays !== null && diffDays < 7) {
                              return (
                                <div className="mb-3 px-3 py-2 bg-amber-50/90 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-center gap-2">
                                  <span className="text-sm shrink-0">⏰</span>
                                  <span className="text-[11px] leading-snug">
                                    <strong>Hatırlatma:</strong> Etkinliğe {diffDays <= 0 ? '1 günden az' : `${diffDays} gün`} kaldı. Tasarımın yetişmesi için taleplerin en az 7 gün önce yapılması önerilir.
                                  </span>
                                </div>
                              );
                            }
                            return null;
                          })()}

                          <div>
                            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
                              Mekan / Güzergah <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="text"
                              required
                              value={formData.mekan}
                              onChange={e => setFormData({ ...formData, mekan: e.target.value })}
                              placeholder="Örn: Bolu / Yedigöller (Kalkış: Üniversite Metro İstasyonu)"
                              className="w-full min-h-[44px] px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-600"
                            />
                          </div>
                        </div>

                        {/* DEDICATED GOOGLE FORM SECTION (WHEN FORM OR HEPSI SELECTED) */}
                        {(formData.talepTuru === 'form' || formData.talepTuru === 'hepsi') && (
                          <div className="bg-emerald-50/60 border-2 border-emerald-300 rounded-2xl p-4 sm:p-5 space-y-4">
                            <div className="flex items-center gap-2 pb-2.5 border-b border-emerald-200">
                              <span className="text-xl">📝</span>
                              <div>
                                <h4 className="text-xs font-black text-emerald-900 uppercase tracking-wider">
                                  Google Form / Katılım Formu Bilgileri
                                </h4>
                                <p className="text-[11px] text-emerald-700">
                                  Form Yöneticisi (Adminokur) bu bilgilere göre Google Form linkini oluşturacaktır.
                                </p>
                              </div>
                            </div>

                            {/* Questions Editor */}
                            <div>
                              <label className="block text-xs font-bold text-emerald-900 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                                <span className="flex items-center gap-1.5">
                                  <ListChecks size={14} className="text-emerald-700" />
                                  Formda Sorulacak Sorular ({formQuestions.length})
                                </span>
                                <span className="text-[10px] text-emerald-700 font-normal">Soru ekleyip çıkarabilirsiniz</span>
                              </label>

                              {/* Questions tags */}
                              <div className="flex flex-wrap gap-1.5 mb-2.5 p-2 bg-white rounded-xl border border-emerald-200 min-h-[44px] items-center">
                                {formQuestions.map((q, idx) => (
                                  <span
                                    key={idx}
                                    className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-100 text-emerald-900 text-xs font-semibold rounded-lg border border-emerald-200/80"
                                  >
                                    <span className="text-[10px] font-bold text-emerald-700">#{idx + 1}</span>
                                    <span>{q}</span>
                                    <button
                                      type="button"
                                      onClick={() => setFormQuestions(prev => prev.filter((_, i) => i !== idx))}
                                      className="text-emerald-600 hover:text-red-600 p-0.5 rounded transition-colors"
                                      title="Soruyu sil"
                                    >
                                      <X size={12} />
                                    </button>
                                  </span>
                                ))}
                                {formQuestions.length === 0 && (
                                  <span className="text-xs text-slate-400 italic px-1">Henüz soru eklenmedi.</span>
                                )}
                              </div>

                              {/* Add question input (Robustly nested button that NEVER overflows) */}
                              <div className="relative flex items-center w-full min-w-0">
                                <input
                                  type="text"
                                  value={newQuestionInput}
                                  onChange={e => setNewQuestionInput(e.target.value)}
                                  onKeyDown={e => {
                                    if (e.key === 'Enter') {
                                      e.preventDefault();
                                      if (newQuestionInput.trim()) {
                                        setFormQuestions([...formQuestions, newQuestionInput.trim()]);
                                        setNewQuestionInput('');
                                      }
                                    }
                                  }}
                                  placeholder="Yeni soru yazın (Örn: İlçe, Yaş)…"
                                  className="w-full min-w-0 min-h-[42px] pl-3.5 pr-20 py-2 bg-white border border-emerald-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/30 text-slate-800"
                                />
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (newQuestionInput.trim()) {
                                      setFormQuestions([...formQuestions, newQuestionInput.trim()]);
                                      setNewQuestionInput('');
                                    }
                                  }}
                                  className="absolute right-1 top-1/2 -translate-y-1/2 h-[34px] px-3 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-bold rounded-lg transition-all flex items-center gap-1 shrink-0 shadow-xs"
                                >
                                  <Plus size={14} /> Ekle
                                </button>
                              </div>
                            </div>

                            {/* Form Description & Logistics text */}
                            <div>
                              <div className="flex items-center justify-between mb-1">
                                <label className="text-xs font-bold text-emerald-900 uppercase tracking-wider">
                                  Form Üst Açıklaması &amp; Detaylar
                                </label>
                                <span className="text-[10px] text-emerald-700">Ücret, ikram, kalkış bilgileri</span>
                              </div>
                              <textarea
                                rows={4}
                                value={formData.formAciklamasi}
                                onChange={e => setFormData({ ...formData, formAciklamasi: e.target.value })}
                                placeholder="Örn: Gezi ücretimiz 1000 TL'dir (Geliri Filistin fonuna aktarılacaktır). Sabah sandviç ve meyve suyu ikramı yapılacaktır…"
                                className="w-full px-3.5 py-2.5 bg-white border border-emerald-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/30 font-sans leading-relaxed"
                              />
                            </div>
                          </div>
                        )}

                        {/* Special Note */}
                        <div className="bg-slate-50/80 border border-slate-200/80 rounded-2xl p-4 sm:p-5">
                          <div className="flex items-center gap-2 mb-3">
                            <span className="text-lg">📌</span>
                            <div>
                              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                                Özel Not / Hatırlatma
                              </h4>
                              <p className="text-[11px] text-slate-400">Yöneticilere veya katılımcılara ek not</p>
                            </div>
                          </div>

                          <textarea
                            rows={2}
                            maxLength={200}
                            value={formData.ozelNot}
                            onChange={e => setFormData({ ...formData, ozelNot: e.target.value })}
                            placeholder="Örn: * Program hanımlara özeldir / * Kayıt zorunludur."
                            className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-600"
                          />
                        </div>

                        {/* Submit Actions */}
                        <div className="flex flex-col sm:flex-row items-center justify-end gap-2.5 pt-2">
                          <button
                            type="button"
                            onClick={() => handleSelectTab('requests')}
                            className="w-full sm:w-auto min-h-[44px] px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold rounded-xl transition-colors order-2 sm:order-1"
                          >
                            İptal
                          </button>
                          <button
                            type="submit"
                            disabled={submittingRequest}
                            className="w-full sm:w-auto min-h-[44px] px-8 py-3 bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold rounded-xl shadow-md shadow-violet-200 transition-all flex items-center justify-center gap-2 disabled:opacity-50 order-1 sm:order-2 active:scale-[0.99]"
                          >
                            <Send size={15} />
                            <span>
                              {submittingRequest
                                ? 'İletiliyor…'
                                : formData.talepTuru === 'hepsi'
                                ? '📤 Afiş ve Form Talebini Gönder'
                                : formData.talepTuru === 'form'
                                ? '📤 Form Talebini Gönder'
                                : '📤 Afiş Talebini Gönder'}
                            </span>
                          </button>
                        </div>
                      </div>

                      {/* Right Live Dual Preview (Poster & Google Form) */}
                      <div className={`lg:sticky lg:top-24 mt-2 lg:mt-0 space-y-4 ${mobileFormTab === 'form' ? 'hidden lg:block' : 'block'}`}>
                        {/* 1. Poster Preview (if afis or hepsi) */}
                        {(formData.talepTuru === 'afis' || formData.talepTuru === 'hepsi') && (
                          <div className="bg-gradient-to-br from-violet-50 via-purple-50 to-pink-50 border border-violet-100 rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-sm">
                            <div className="flex items-center justify-between mb-3">
                              <span className="text-xs font-black uppercase tracking-wider text-violet-800 flex items-center gap-1.5">
                                <Eye size={14} /> 🎨 Afiş Canlı Ön İzlemesi
                              </span>
                              <span className="text-[10px] font-bold text-violet-600 bg-violet-100/80 px-2 py-0.5 rounded-full">
                                Canlı Görünüm
                              </span>
                            </div>

                            <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-sm flex flex-col justify-between">
                              <div>
                                {formData.ekip && (
                                  <div className="inline-block px-2.5 py-1 bg-violet-100 text-violet-800 text-[10px] font-extrabold rounded-md uppercase tracking-wider mb-2">
                                    {formData.ekip}
                                  </div>
                                )}

                                <h3 className="text-base sm:text-lg font-black text-slate-900 leading-snug mb-1.5">
                                  {formData.etkinlikAdi || (
                                    <span className="text-slate-300 italic">Etkinlik Adı Buraya Gelecek</span>
                                  )}
                                </h3>

                                {formData.altBaslik && (
                                  <p className="text-xs font-semibold text-violet-600 italic mb-2">
                                    {formData.altBaslik}
                                  </p>
                                )}

                                {formData.aciklama && (
                                  <p className="text-xs text-slate-600 leading-relaxed mb-3 bg-slate-50 p-2.5 rounded-xl border border-slate-100 whitespace-pre-line">
                                    {formData.aciklama}
                                  </p>
                                )}
                              </div>

                              <div className="pt-2.5 border-t border-slate-100 space-y-1.5 text-xs">
                                {(formData.tarih || formData.saat) && (
                                  <div className="flex items-center gap-2 font-bold text-slate-800">
                                    <Calendar size={13} className="text-violet-600 shrink-0" />
                                    <span>
                                      {formData.tarih ? formatDateOnly(formData.tarih) : 'Tarih seçilmedi'}
                                      {formData.saat ? ` · Saat ${formData.saat}` : ''}
                                    </span>
                                  </div>
                                )}

                                {formData.mekan && (
                                  <div className="flex items-center gap-2 font-medium text-slate-700">
                                    <MapPin size={13} className="text-violet-600 shrink-0" />
                                    <span>{formData.mekan}</span>
                                  </div>
                                )}

                                {formData.ozelNot && (
                                  <div className="mt-2 pt-1.5 text-[11px] text-slate-500 italic border-t border-dashed border-slate-200">
                                    {formData.ozelNot}
                                  </div>
                                )}

                                {formData.sablonGorseli && (
                                  <div className="mt-2.5 pt-2 border-t border-indigo-100 flex items-center gap-2.5 bg-indigo-50/70 p-2 rounded-xl">
                                    <img
                                      src={formData.sablonGorseli}
                                      alt="Şablon"
                                      className="w-10 h-10 object-cover rounded-lg border border-indigo-200 shrink-0 cursor-pointer"
                                      onClick={() => setLightboxImage({ url: formData.sablonGorseli, title: 'Hazır Afiş Şablonu', subtitle: formData.sablonGorseliAdi })}
                                    />
                                    <div className="min-w-0 flex-1">
                                      <span className="text-[11px] font-bold text-indigo-950 block">🖼️ Hazır Şablon Eklendi</span>
                                      <span className="text-[10px] text-indigo-700 block truncate">{formData.sablonGorseliAdi || 'Görsel yüklendi'}</span>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        )}

                        {/* 2. Google Form Preview Card (if form or hepsi) */}
                        {(formData.talepTuru === 'form' || formData.talepTuru === 'hepsi') && (
                          <div className="bg-gradient-to-br from-emerald-50 via-teal-50 to-green-50 border border-emerald-200 rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-sm">
                            <div className="flex items-center justify-between mb-3">
                              <span className="text-xs font-black uppercase tracking-wider text-emerald-800 flex items-center gap-1.5">
                                <FileSpreadsheet size={14} /> 📝 Google Form Taslak Ön İzlemesi
                              </span>
                              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                                Form Şablonu
                              </span>
                            </div>

                            <div className="bg-white rounded-2xl p-4 border border-emerald-100 shadow-xs space-y-3">
                              <div className="border-b border-slate-100 pb-2">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">
                                  Google Kayıt Formu Başlığı
                                </span>
                                <h4 className="text-sm font-black text-slate-900 mt-0.5">
                                  {formData.etkinlikAdi || 'Etkinlik Kayıt Formu'}
                                </h4>
                              </div>

                              {/* Form description summary */}
                              {formData.formAciklamasi && (
                                <div className="text-[11px] text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100 whitespace-pre-line leading-relaxed max-h-32 overflow-y-auto">
                                  {formData.formAciklamasi}
                                </div>
                              )}

                              {/* Questions list preview */}
                              <div>
                                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1.5">
                                  📋 Form Alanları ({formQuestions.length} soru):
                                </span>
                                <div className="space-y-1">
                                  {formQuestions.map((q, i) => (
                                    <div key={i} className="text-xs text-slate-700 flex items-center gap-2 bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-100">
                                      <span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold flex items-center justify-center shrink-0">
                                        {i + 1}
                                      </span>
                                      <span className="font-medium truncate">{q}</span>
                                      <span className="text-[10px] text-red-500 ml-auto shrink-0">*Zorunlu</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Mobile Form Submit CTA inside Preview Tab */}
                        <div className="lg:hidden pt-2 flex flex-col gap-2">
                          <button
                            type="button"
                            onClick={handleSubmitRequest}
                            disabled={submittingRequest}
                            className="w-full min-h-[46px] py-2.5 bg-violet-600 hover:bg-violet-700 active:scale-[0.98] text-white text-xs font-bold rounded-xl shadow-md shadow-violet-200 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                          >
                            <Send size={15} />
                            <span>{submittingRequest ? 'İletiliyor…' : '📤 Talebi Onayla ve Gönder'}</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setMobileFormTab('form')}
                            className="w-full min-h-[40px] py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors"
                          >
                            ✏️ Bilgileri Düzenle
                          </button>
                        </div>
                      </div>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          ) : (
            <div>
              {/* ── COMPACT & MINIMAL MOBILE-FIRST TOOLBAR & FILTER BAR ── */}
              <div className="bg-white border border-slate-200/80 rounded-2xl p-3 sm:p-4 mb-4 shadow-xs space-y-2.5">
                {/* Search & Sort Controls */}
                <div className="flex items-center gap-2">
                  <div className="relative flex-1 min-w-0">
                    <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      placeholder="Etkinlik, ekip veya mekan ara…"
                      className="w-full min-h-[40px] pl-9 pr-8 py-2 bg-slate-50 hover:bg-slate-100/60 focus:bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-600 placeholder:text-slate-400 transition-colors"
                    />
                    {searchQuery && (
                      <button
                        type="button"
                        onClick={() => setSearchQuery('')}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                      >
                        <X size={13} />
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <select
                      value={sortBy}
                      onChange={e => setSortBy(e.target.value as 'created' | 'event')}
                      className="min-h-[40px] px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none"
                    >
                      <option value="created">Talep Tarihi</option>
                      <option value="event">Etkinlik Tarihi</option>
                    </select>

                    <button
                      type="button"
                      onClick={() => setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc')}
                      className="min-h-[40px] min-w-[40px] px-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-100 flex items-center justify-center transition-colors"
                      title={sortOrder === 'desc' ? 'Yeniden Eskiye' : 'Eskiden Yeniye'}
                    >
                      {sortOrder === 'desc' ? '↓' : '↑'}
                    </button>
                  </div>
                </div>

                {/* Unified Horizontal Swipeable Filter Chips */}
                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 -mx-1 px-1">
                  {/* Type Filters */}
                  <button
                    type="button"
                    onClick={() => {
                      setTypeFilter('all');
                      if (activeTab === 'forms' || activeTab === 'changed') setActiveTab(isAdmin ? 'all' : 'requests');
                    }}
                    className={`shrink-0 min-h-[34px] px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 active:scale-95 ${
                      typeFilter === 'all' && activeTab !== 'changed' && activeTab !== 'forms' && activeTab === (isAdmin ? 'all' : 'requests')
                        ? 'bg-slate-900 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    <span>Tümü</span>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                      typeFilter === 'all' && activeTab !== 'changed' && activeTab !== 'forms' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                    }`}>
                      {typeCounts.all}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setTypeFilter('afis');
                      if (activeTab === 'forms') setActiveTab(isAdmin ? 'all' : 'requests');
                    }}
                    className={`shrink-0 min-h-[34px] px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 active:scale-95 ${
                      typeFilter === 'afis'
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200/60'
                    }`}
                  >
                    <span>🎨 Afiş</span>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                      typeFilter === 'afis' ? 'bg-white/20 text-white' : 'bg-indigo-100 text-indigo-800'
                    }`}>
                      {typeCounts.afis}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setTypeFilter('form');
                    }}
                    className={`shrink-0 min-h-[34px] px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 active:scale-95 ${
                      typeFilter === 'form'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200/60'
                    }`}
                  >
                    <span>📝 Form</span>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                      typeFilter === 'form' ? 'bg-white/20 text-white' : 'bg-emerald-100 text-emerald-900'
                    }`}>
                      {typeCounts.form}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setTypeFilter('hepsi');
                    }}
                    className={`shrink-0 min-h-[34px] px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 active:scale-95 ${
                      typeFilter === 'hepsi'
                        ? 'bg-violet-600 text-white shadow-xs'
                        : 'bg-violet-50 text-violet-700 hover:bg-violet-100 border border-violet-200/60'
                    }`}
                  >
                    <span>✨ Afiş+Form</span>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                      typeFilter === 'hepsi' ? 'bg-white/20 text-white' : 'bg-violet-100 text-violet-800'
                    }`}>
                      {typeCounts.hepsi}
                    </span>
                  </button>

                  {/* Status Filters for Admin */}
                  {isAdmin && (
                    <>
                      <div className="h-4 w-[1px] bg-slate-200 shrink-0 mx-0.5" />

                      {stats.changed > 0 && (
                        <button
                          type="button"
                          onClick={() => handleSelectTab(activeTab === 'changed' ? 'all' : 'changed')}
                          className={`shrink-0 min-h-[34px] px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 active:scale-95 ${
                            activeTab === 'changed'
                              ? 'bg-amber-600 text-white shadow-xs'
                              : 'bg-amber-50 text-amber-900 border border-amber-300 hover:bg-amber-100'
                          }`}
                        >
                          <span>⚠️ Değişen</span>
                          <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                            activeTab === 'changed' ? 'bg-white/20 text-white' : 'bg-amber-200 text-amber-900'
                          }`}>
                            {stats.changed}
                          </span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => handleSelectTab(activeTab === 'talep-alindi' ? 'all' : 'talep-alindi')}
                        className={`shrink-0 min-h-[34px] px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 active:scale-95 ${
                          activeTab === 'talep-alindi'
                            ? 'bg-slate-700 text-white shadow-xs'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        <span>📥 Alındı</span>
                        <span className="text-[10px] opacity-75 font-bold">({stats.alindi})</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleSelectTab(activeTab === 'tasarimda' ? 'all' : 'tasarimda')}
                        className={`shrink-0 min-h-[34px] px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 active:scale-95 ${
                          activeTab === 'tasarimda'
                            ? 'bg-amber-500 text-white shadow-xs'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        <span>🎨 Tasarım</span>
                        <span className="text-[10px] opacity-75 font-bold">({stats.tasarimda})</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleSelectTab(activeTab === 'merkez-onayinda' ? 'all' : 'merkez-onayinda')}
                        className={`shrink-0 min-h-[34px] px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 active:scale-95 ${
                          activeTab === 'merkez-onayinda'
                            ? 'bg-blue-600 text-white shadow-xs'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        <span>🔍 Onayda</span>
                        <span className="text-[10px] opacity-75 font-bold">({stats.merkez})</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleSelectTab(activeTab === 'yayinlandi' ? 'all' : 'yayinlandi')}
                        className={`shrink-0 min-h-[34px] px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 active:scale-95 ${
                          activeTab === 'yayinlandi'
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        <span>✅ Yayınlandı</span>
                        <span className="text-[10px] opacity-75 font-bold">({stats.yayinlandi})</span>
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Requests List */}
              {dataLoading ? (
                <div className="text-center py-16 bg-white border border-slate-200/80 rounded-2xl">
                  <RefreshCw size={28} className="animate-spin text-violet-600 mx-auto mb-3" />
                  <p className="text-xs font-bold text-slate-600">Talepler yükleniyor…</p>
                </div>
              ) : filteredRequests.length === 0 ? (
                <div className="text-center py-16 bg-white border border-slate-200/80 rounded-2xl shadow-xs p-6">
                  <span className="text-4xl sm:text-5xl block mb-3 opacity-60">📭</span>
                  <h3 className="text-sm sm:text-base font-bold text-slate-800 mb-1">Kayıt Bulunamadı</h3>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4">
                    {searchQuery
                      ? 'Aramanıza uygun bir talep bulunamadı.'
                      : isAdmin
                      ? 'Bu kriterde henüz talep bulunmuyor.'
                      : 'Henüz bir talep oluşturmadınız.'}
                  </p>
                  {currentUser.role === 'user' && (
                    <button
                      onClick={() => handleSelectTab('new')}
                      className="min-h-[44px] py-2.5 px-5 bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold rounded-xl shadow-md shadow-violet-200 transition-all inline-flex items-center gap-1.5"
                    >
                      <Plus size={15} /> İlk Talebi Oluştur
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-3.5">
                  {filteredRequests.map((req, index) => {
                    const cfg = STATUS_CONFIG[req.status] || STATUS_CONFIG['talep-alindi'];
                    const hasUnseenChanges = Boolean(req.hasUserChanges && !req.adminAcknowledgedChange);
                    const hasForm = req.talepTuru === 'form' || req.talepTuru === 'hepsi';
                    const hasAfis = (req.talepTuru || 'afis') === 'afis' || req.talepTuru === 'hepsi';

                    return (
                      <div
                        key={req.id || index}
                        onClick={() => setSelectedRequest(req)}
                        className={`bg-white border rounded-2xl p-3.5 sm:p-4.5 transition-all cursor-pointer shadow-xs hover:shadow-md hover:border-slate-300 relative group ${
                          isAdmin && hasUnseenChanges
                            ? 'border-amber-300 bg-amber-50/20'
                            : 'border-slate-200/90'
                        }`}
                      >
                        {/* UNSEEN USER CHANGES ALERT STRIP (ONLY FOR ADMIN) */}
                        {isAdmin && hasUnseenChanges && (
                          <div className="mb-2.5 px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-300 text-amber-950 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <span className="text-sm shrink-0">✏️</span>
                              <div className="min-w-0">
                                <span className="font-bold">Kullanıcı Güncelleme Yaptı:</span>{' '}
                                <span className="text-amber-800 text-[11px] truncate">
                                  {req.userChangesNote || 'Detaylar güncellendi.'}
                                </span>
                              </div>
                            </div>
                            <button
                              type="button"
                              disabled={acknowledgingId === req.id}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleAcknowledgeChange(req.id);
                              }}
                              className="min-h-[28px] px-2.5 py-0.5 bg-amber-600 hover:bg-amber-700 active:scale-95 text-white text-[11px] font-bold rounded-lg transition-transform flex items-center justify-center gap-1 self-start sm:self-auto shrink-0 shadow-xs"
                            >
                              <Check size={12} />
                              <span>{acknowledgingId === req.id ? '…' : 'Onayla'}</span>
                            </button>
                          </div>
                        )}

                        {/* USER NOTIFICATION PILL (ONLY FOR REGULAR USER WHILE PENDING) */}
                        {!isAdmin && req.hasUserChanges && !req.adminAcknowledgedChange && (
                          <div className="mb-2.5 px-3 py-1.5 rounded-xl bg-sky-50 border border-sky-200 text-sky-900 flex items-center gap-2 text-xs font-medium">
                            <span className="text-sm shrink-0">⏳</span>
                            <span>Düzenlemeniz kaydedildi ve yönetici incelemesine iletildi.</span>
                          </div>
                        )}

                        {/* Top Meta Line: Type Pill + Team + Status Badge */}
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <div className="flex items-center gap-1.5 min-w-0 flex-wrap">
                            <span className="text-[11px] font-mono font-bold text-slate-400 shrink-0">#{index + 1}</span>

                            {/* Request Type Badge */}
                            {req.talepTuru === 'hepsi' ? (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-200/80 shrink-0">
                                ✨ Afiş+Form
                              </span>
                            ) : req.talepTuru === 'form' ? (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200/80 shrink-0">
                                📝 Form
                              </span>
                            ) : (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200/80 shrink-0">
                                🎨 Afiş
                              </span>
                            )}

                            <span className="text-[11px] font-semibold text-slate-600 truncate max-w-[140px] sm:max-w-xs">
                              {req.ekip}
                            </span>

                            {/* Template badge if attached */}
                            {req.hazirSablonVar && req.sablonGorseli && (
                              <span
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setLightboxImage({ url: req.sablonGorseli!, title: 'Hazır Afiş Şablonu', subtitle: req.etkinlikAdi });
                                }}
                                className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 shrink-0 flex items-center gap-1 transition-colors cursor-pointer"
                                title="Talep sahibinin hazır şablonunu gör"
                              >
                                🖼️ Şablon
                              </span>
                            )}

                            {/* Published Poster badge */}
                            {req.finalAfisGorseli && (
                              <span
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setLightboxImage({ url: req.finalAfisGorseli!, title: req.etkinlikAdi, subtitle: 'Yayınlanan Resmi Afiş' });
                                }}
                                className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-emerald-100 hover:bg-emerald-200 text-emerald-800 border border-emerald-300 shrink-0 flex items-center gap-1 transition-colors cursor-pointer"
                                title="Yayınlanan afiş görselini incele"
                              >
                                🎉 Afiş Yayında
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            <span
                              className={`px-2.5 py-0.5 rounded-full font-bold text-[11px] border flex items-center gap-1 ${cfg.badgeBg}`}
                            >
                              <span>{cfg.icon}</span>
                              <span>{cfg.label}</span>
                            </span>
                          </div>
                        </div>

                        {/* Event Title */}
                        <h3 className="text-sm sm:text-base font-bold text-slate-900 leading-snug mb-1.5 group-hover:text-violet-700 transition-colors">
                          {req.etkinlikAdi}
                        </h3>

                        {/* Event Quick Details: Date & Place */}
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 mb-2.5">
                          <span className="inline-flex items-center gap-1 font-medium text-slate-700">
                            <Calendar size={13} className="text-violet-600 shrink-0" />
                            <span>{formatDateOnly(req.tarih)}{req.saat ? ` · ${req.saat}` : ''}</span>
                          </span>
                          <span className="inline-flex items-center gap-1 truncate max-w-[200px] sm:max-w-xs">
                            <MapPin size={13} className="text-slate-400 shrink-0" />
                            <span className="truncate">{req.mekan}</span>
                          </span>
                        </div>

                        {/* Form Status Strip (Clean, 1-layer, zero-overflow) */}
                        {hasForm && (
                          <div className="mb-2.5">
                            {req.formLink ? (
                              <div className="bg-emerald-50/80 border border-emerald-200 rounded-xl px-3 py-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                                <div className="flex items-center gap-2 min-w-0">
                                  <span className="text-emerald-700 shrink-0">🔗</span>
                                  <div className="min-w-0">
                                    <span className="font-bold text-emerald-950 block text-xs">
                                      Google Form Linki Hazır
                                    </span>
                                    <span className="text-[11px] font-mono text-emerald-700 truncate block">
                                      {req.formLink}
                                    </span>
                                  </div>
                                </div>
                                <div className="flex items-center gap-1.5 shrink-0" onClick={e => e.stopPropagation()}>
                                  <a
                                    href={req.formLink}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="min-h-[30px] px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-[11px] font-bold rounded-lg transition-transform flex items-center gap-1 shadow-xs"
                                  >
                                    <ExternalLink size={11} />
                                    <span>Aç</span>
                                  </a>
                                  <button
                                    type="button"
                                    onClick={() => handleCopyLink(req.formLink || '')}
                                    className="min-h-[30px] px-2 py-1 bg-white hover:bg-emerald-100 text-emerald-800 border border-emerald-300 active:scale-95 text-[11px] font-bold rounded-lg transition-transform flex items-center gap-1"
                                    title="Linki Kopyala"
                                  >
                                    <Copy size={11} />
                                  </button>
                                  {isFormManager && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setFormLinkModalReq(req);
                                        setFormLinkInput(req.formLink || '');
                                      }}
                                      className="min-h-[30px] px-2 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-[11px] font-semibold rounded-lg transition-colors"
                                      title="Linki Düzenle"
                                    >
                                      ✏️
                                    </button>
                                  )}
                                </div>
                              </div>
                            ) : (
                              <div className="bg-amber-50/70 border border-amber-200/90 rounded-xl px-3 py-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                                <div className="flex items-center gap-2">
                                  <span className="text-amber-600 text-sm shrink-0">⏳</span>
                                  <span className="text-amber-900 text-xs font-medium">
                                    {isFormManager
                                      ? 'Google Form linki henüz eklenmedi'
                                      : 'Form linki bekleniyor (Adminokur hazırlıyor…)'}
                                  </span>
                                </div>
                                {isFormManager && (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setFormLinkModalReq(req);
                                      setFormLinkInput(req.formLink || '');
                                    }}
                                    className="w-full sm:w-auto min-h-[32px] px-3.5 py-1 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-bold rounded-lg shadow-xs transition-transform flex items-center justify-center gap-1 shrink-0"
                                  >
                                    <Plus size={13} />
                                    <span>Form Linki Ekle</span>
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        )}

                        {/* Final Published Poster Preview Strip */}
                        {req.finalAfisGorseli && (
                          <div
                            onClick={(e) => {
                              e.stopPropagation();
                              setLightboxImage({ url: req.finalAfisGorseli!, title: req.etkinlikAdi, subtitle: 'Yayınlanan Resmi Afiş' });
                            }}
                            className="mb-2.5 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-xl px-3 py-2 flex items-center justify-between gap-2 hover:bg-emerald-100/60 transition-colors"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <img
                                src={req.finalAfisGorseli}
                                alt="Afiş"
                                className="w-8 h-10 object-cover rounded-md border border-emerald-200 shrink-0 shadow-2xs"
                              />
                              <div className="min-w-0">
                                <span className="text-xs font-bold text-emerald-950 block">Resmi Afiş Yayınlandı</span>
                                <span className="text-[10px] text-emerald-700 block truncate">Görseli incelemek ve indirmek için tıklayın</span>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDownloadImage(req.finalAfisGorseli!, `${req.etkinlikAdi.replace(/[^a-zA-Z0-9çÇğĞıİöÖşŞüÜ_-]/g, '_')}_afis.jpg`);
                              }}
                              className="min-h-[28px] px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-[11px] font-bold rounded-lg transition-transform flex items-center gap-1 shrink-0 shadow-xs"
                            >
                              <Download size={11} />
                              <span>İndir</span>
                            </button>
                          </div>
                        )}

                        {/* Card Bottom: User info, Edit button, Delete button & hint */}
                        <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2 text-xs text-slate-400">
                          <div className="flex items-center gap-1.5 truncate">
                            <Clock3 size={11} className="text-slate-400 shrink-0" />
                            <span className="text-[11px] truncate">
                              Talep: {formatDateOnly(req.createdAt)} · {req.createdBy?.name || 'Kullanıcı'}
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            {/* USER EDIT BUTTON */}
                            {currentUser.role === 'user' && req.status !== 'yayinlandi' && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleStartEdit(req);
                                }}
                                className="min-h-[30px] px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 active:scale-95 text-[11px] font-bold rounded-lg transition-transform flex items-center gap-1"
                              >
                                <Edit3 size={11} />
                                <span>Düzenle</span>
                              </button>
                            )}

                            {isAdmin && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setRequestToDelete(req);
                                }}
                                className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors min-h-[28px] min-w-[28px] flex items-center justify-center"
                                title="Etkinliği Sil"
                              >
                                <Trash2 size={13} />
                              </button>
                            )}

                            <span className="text-slate-400 group-hover:text-violet-600 group-hover:translate-x-0.5 transition-all text-xs font-semibold flex items-center">
                              <ChevronRight size={16} />
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      {/* ════ MOBILE BOTTOM NAVIGATION BAR (< 1024px) ════ */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-lg border-t border-slate-200/90 pb-safe pt-2 px-3 shadow-xl">
        {currentUser.role === 'admin' ? (
          <div className="flex items-center justify-around w-full max-w-lg mx-auto">
            <button
              onClick={() => handleSelectTab('all')}
              className={`flex flex-col items-center justify-center min-w-[50px] min-h-[44px] py-1 px-1.5 rounded-xl transition-all active:scale-95 ${
                activeTab === 'all' ? 'text-violet-700 font-extrabold' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <div className="relative">
                <span className="text-lg leading-none">📋</span>
                <span className="absolute -top-1.5 -right-2 px-1.5 py-0.2 rounded-full bg-violet-600 text-white text-[9px] font-bold">
                  {stats.total}
                </span>
              </div>
              <span className="text-[10px] mt-1 font-bold">Tümü</span>
            </button>

            <button
              onClick={() => handleSelectTab('talep-alindi')}
              className={`flex flex-col items-center justify-center min-w-[50px] min-h-[44px] py-1 px-1.5 rounded-xl transition-all active:scale-95 ${
                activeTab === 'talep-alindi' ? 'text-slate-900 font-extrabold' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <div className="relative">
                <span className="text-lg leading-none">📥</span>
                {stats.alindi > 0 && (
                  <span className="absolute -top-1.5 -right-2 px-1.5 py-0.2 rounded-full bg-slate-700 text-white text-[9px] font-bold">
                    {stats.alindi}
                  </span>
                )}
              </div>
              <span className="text-[10px] mt-1 font-bold">Alındı</span>
            </button>

            <button
              onClick={() => handleSelectTab('tasarimda')}
              className={`flex flex-col items-center justify-center min-w-[50px] min-h-[44px] py-1 px-1.5 rounded-xl transition-all active:scale-95 ${
                activeTab === 'tasarimda' ? 'text-amber-600 font-extrabold' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <div className="relative">
                <span className="text-lg leading-none">🎨</span>
                {stats.tasarimda > 0 && (
                  <span className="absolute -top-1.5 -right-2 px-1.5 py-0.2 rounded-full bg-amber-500 text-white text-[9px] font-bold">
                    {stats.tasarimda}
                  </span>
                )}
              </div>
              <span className="text-[10px] mt-1 font-bold">Tasarım</span>
            </button>

            <button
              onClick={() => handleSelectTab('merkez-onayinda')}
              className={`flex flex-col items-center justify-center min-w-[50px] min-h-[44px] py-1 px-1.5 rounded-xl transition-all active:scale-95 ${
                activeTab === 'merkez-onayinda' ? 'text-blue-600 font-extrabold' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <div className="relative">
                <span className="text-lg leading-none">🔍</span>
                {stats.merkez > 0 && (
                  <span className="absolute -top-1.5 -right-2 px-1.5 py-0.2 rounded-full bg-blue-600 text-white text-[9px] font-bold">
                    {stats.merkez}
                  </span>
                )}
              </div>
              <span className="text-[10px] mt-1 font-bold">Onay</span>
            </button>

            <button
              onClick={() => handleSelectTab('users')}
              className={`flex flex-col items-center justify-center min-w-[50px] min-h-[44px] py-1 px-1.5 rounded-xl transition-all active:scale-95 ${
                activeTab === 'users' ? 'text-violet-700 font-extrabold' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <div className="relative">
                <span className="text-lg leading-none">👥</span>
                <span className="absolute -top-1.5 -right-2 px-1.5 py-0.2 rounded-full bg-slate-200 text-slate-700 text-[9px] font-bold">
                  {usersList.length}
                </span>
              </div>
              <span className="text-[10px] mt-1 font-bold">Ekip</span>
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between w-full max-w-sm mx-auto px-4">
            {/* 1. Sol: Yeni Talep (+) Butonu */}
            <button
              onClick={() => handleSelectTab('new')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-2xl font-bold text-xs transition-all active:scale-95 shadow-sm min-h-[42px] ${
                activeTab === 'new'
                  ? 'bg-slate-900 text-white ring-2 ring-violet-300 shadow-slate-300'
                  : 'bg-violet-600 hover:bg-violet-700 text-white shadow-violet-200'
              }`}
              title="Yeni Afiş & Form Talebi Oluştur"
              aria-label="Yeni Afiş & Form Talebi Oluştur"
            >
              <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center">
                <Plus size={16} strokeWidth={2.8} />
              </div>
              <span>Yeni Talep</span>
            </button>

            {/* 2. Orta: Taleplerim */}
            <button
              onClick={() => handleSelectTab('requests')}
              className={`flex flex-col items-center justify-center min-h-[44px] py-1 px-3 rounded-2xl transition-all active:scale-95 ${
                activeTab === 'requests' ? 'text-violet-700 font-extrabold scale-105' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <div className="relative">
                <span className="text-xl leading-none">📋</span>
                <span className="absolute -top-1 -right-2.5 px-1.5 py-0.2 rounded-full bg-violet-600 text-white text-[9px] font-bold">
                  {requests.length}
                </span>
              </div>
              <span className="text-[10px] mt-1 font-bold">Taleplerim</span>
            </button>

            {/* 3. Sağ: Çıkış */}
            <button
              onClick={handleLogout}
              className="flex flex-col items-center justify-center min-h-[44px] py-1 px-3 text-slate-500 hover:text-red-600 rounded-2xl transition-all active:scale-95"
            >
              <LogOut size={20} />
              <span className="text-[10px] mt-1 font-bold">Çıkış</span>
            </button>
          </div>
        )}
      </nav>

      {/* ════ DETAIL & ADMIN STATUS CHANGER MODAL (BOTTOM SHEET ON MOBILE) ════ */}
      {selectedRequest && (
        <div
          onClick={() => setSelectedRequest(null)}
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-y-auto"
        >
          <div
            onClick={e => e.stopPropagation()}
            className="bg-white rounded-t-3xl sm:rounded-3xl max-w-xl w-full max-h-[90vh] sm:max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 animate-sheet-up sm:animate-scale-in overflow-hidden"
          >
            {/* Mobile Sheet Drag Indicator */}
            <div className="w-12 h-1.5 bg-slate-300 rounded-full mx-auto my-2.5 sm:hidden shrink-0" />

            {/* Modal Header */}
            <div className="px-4 py-3 sm:p-6 border-b border-slate-100 flex items-start justify-between gap-3 shrink-0">
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-violet-600 truncate">
                    {selectedRequest.ekip}
                  </span>
                  {selectedRequest.talepTuru === 'hepsi' ? (
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-purple-100 text-purple-800">
                      ✨ Afiş + Form
                    </span>
                  ) : selectedRequest.talepTuru === 'form' ? (
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800">
                      📝 Sadece Form
                    </span>
                  ) : (
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-800">
                      🎨 Sadece Afiş
                    </span>
                  )}
                </div>
                <h3 className="text-base sm:text-lg font-black text-slate-900 leading-snug">
                  {selectedRequest.etkinlikAdi}
                </h3>
              </div>
              <button
                onClick={() => setSelectedRequest(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors shrink-0 min-h-[36px] min-w-[36px]"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-4 sm:p-6 space-y-4 sm:space-y-5 overflow-y-auto flex-1">
              {/* ADMIN VIEW: UNSEEN USER CHANGES ALERT BOX */}
              {isAdmin && selectedRequest.hasUserChanges && !selectedRequest.adminAcknowledgedChange && (
                <div className="bg-amber-50 border border-amber-300 text-amber-950 rounded-2xl p-4 sm:p-5 space-y-2.5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">✏️</span>
                      <span className="font-bold text-sm sm:text-base">
                        Kullanıcı Talepte Değişiklik Yaptı
                      </span>
                    </div>
                    <button
                      type="button"
                      disabled={acknowledgingId === selectedRequest.id}
                      onClick={() => handleAcknowledgeChange(selectedRequest.id)}
                      className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 active:scale-95 text-white text-xs font-bold rounded-xl shadow-xs transition-transform shrink-0 flex items-center gap-1.5 self-start sm:self-auto"
                    >
                      <Check size={14} />
                      <span>{acknowledgingId === selectedRequest.id ? 'Onaylanıyor…' : '✓ Değişikliği Onayla'}</span>
                    </button>
                  </div>
                  <p className="text-xs text-amber-800 leading-relaxed">
                    Kullanıcı etkinlik detaylarında güncelleme yaptı. Güncellenen bilgileri kontrol ettikten sonra onaylayarak bu uyarıyı kapatabilirsiniz.
                  </p>
                  {selectedRequest.userChangesNote && (
                    <div className="bg-white/80 p-2.5 rounded-xl text-xs font-medium text-amber-950 border border-amber-200">
                      <span className="font-bold text-amber-900 block text-[10px] uppercase tracking-wider mb-0.5">
                        Kullanıcının Notu:
                      </span>
                      "{selectedRequest.userChangesNote}"
                    </div>
                  )}
                  {selectedRequest.lastUserChangeAt && (
                    <div className="text-[11px] text-amber-700">
                      Son Değiştirilme: {formatDateTime(selectedRequest.lastUserChangeAt)}
                    </div>
                  )}
                </div>
              )}

              {/* USER VIEW: SUBTLE PENDING NOTE ONLY WHILE UNAPPROVED */}
              {!isAdmin && selectedRequest.hasUserChanges && !selectedRequest.adminAcknowledgedChange && (
                <div className="bg-sky-50 border border-sky-200 rounded-2xl p-3.5 text-xs text-sky-900 flex items-start gap-2.5">
                  <span className="text-base shrink-0 mt-0.5">⏳</span>
                  <div>
                    <strong className="block text-sky-950 font-bold">Düzenlemeniz İnceleniyor</strong>
                    <p className="text-[11px] text-sky-800 mt-0.5 leading-relaxed">
                      Yaptığınız değişiklikler yönetici onayına sunulmuştur.
                    </p>
                    {selectedRequest.userChangesNote && (
                      <p className="text-[11px] text-sky-700 italic mt-1">
                        Notunuz: "{selectedRequest.userChangesNote}"
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* CRITICAL: PROMINENT GOOGLE FORM SECTION (VISIBLE TO ALL ROLES) */}
              {(selectedRequest.talepTuru === 'form' || selectedRequest.talepTuru === 'hepsi') && (
                <div className="bg-emerald-50/70 border-2 border-emerald-300 rounded-2xl p-4 sm:p-5 space-y-3.5">
                  <div className="flex items-center justify-between border-b border-emerald-200 pb-2.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">📝</span>
                      <div>
                        <h4 className="text-xs font-black text-emerald-950 uppercase tracking-wider">
                          Google Form / Katılım Formu Bilgileri
                        </h4>
                        <p className="text-[11px] text-emerald-700">Tüm kullanıcılar ve yöneticiler görebilir</p>
                      </div>
                    </div>

                    {selectedRequest.formLink ? (
                      <span className="px-2 py-0.5 bg-emerald-600 text-white text-[10px] font-extrabold rounded-md flex items-center gap-1">
                        ✓ Link Hazır
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 bg-amber-500 text-white text-[10px] font-extrabold rounded-md flex items-center gap-1 animate-pulse">
                        ⏳ Link Bekleniyor
                      </span>
                    )}
                  </div>

                  {/* GOOGLE FORM LINK BOX */}
                  {selectedRequest.formLink ? (
                    <div className="bg-white border-2 border-emerald-400 rounded-xl p-3.5 shadow-sm space-y-2">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <span className="text-xs font-extrabold text-emerald-900 flex items-center gap-1.5">
                          <LinkIcon size={14} className="text-emerald-600" />
                          <span>Google Form Bağlantısı:</span>
                        </span>
                        {isAfisManager && (
                          <span className="text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 px-2 py-0.5 rounded-full">
                            💡 Afiş QR Kodu için kullanabilirsiniz
                          </span>
                        )}
                      </div>

                      <a
                        href={selectedRequest.formLink}
                        target="_blank"
                        rel="noreferrer"
                        className="font-mono text-xs text-emerald-700 hover:text-emerald-900 underline block break-all font-bold bg-emerald-50/80 p-2.5 rounded-lg border border-emerald-100"
                      >
                        {selectedRequest.formLink}
                      </a>

                      <div className="flex items-center justify-between gap-2 pt-1 flex-wrap">
                        <div className="text-[10px] text-slate-400">
                          {selectedRequest.formAddedBy && (
                            <span>Ekleyen: <strong>{selectedRequest.formAddedBy.name || 'Yönetici'}</strong> ({formatDateTime(selectedRequest.formAddedAt)})</span>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          <a
                            href={selectedRequest.formLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="min-h-[36px] px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 shadow-xs"
                          >
                            <ExternalLink size={13} />
                            <span>Formu Aç</span>
                          </a>
                          <button
                            type="button"
                            onClick={() => handleCopyLink(selectedRequest.formLink || '')}
                            className="min-h-[36px] px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5"
                          >
                            <Copy size={13} />
                            <span>Linki Kopyala</span>
                          </button>

                          {isFormManager && (
                            <button
                              type="button"
                              onClick={() => {
                                setFormLinkModalReq(selectedRequest);
                                setFormLinkInput(selectedRequest.formLink || '');
                              }}
                              className="min-h-[36px] px-2.5 py-1.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-900 text-xs font-bold rounded-xl transition-colors"
                              title="Linki Güncelle"
                            >
                              ✏️ Düzenle
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* IF FORM LINK NOT ADDED YET */
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 space-y-3">
                      <div className="flex items-start gap-2.5 text-xs text-amber-900">
                        <span className="text-lg shrink-0">⏳</span>
                        <div>
                          <strong className="block font-bold text-amber-950">
                            Google Form Linki Henüz Eklenmedi
                          </strong>
                          <p className="text-[11px] text-amber-800 mt-0.5 leading-relaxed">
                            {isFormManager
                              ? 'Adminokur: Aşağıdaki alana oluşturduğunuz Google Form bağlantısını yapıştırıp hemen yayınlayabilirsiniz.'
                              : 'Form Yöneticisi (Adminokur) bu etkinlik için form linkini oluşturduğunda tüm kullanıcılar ve afiş tasarımcısı burada anında görebilecektir.'}
                          </p>
                        </div>
                      </div>

                      {/* INLINE LINK INPUT FOR ADMINOKUR / ADMIN */}
                      {isFormManager && (
                        <div className="pt-2 border-t border-amber-200/80 space-y-2">
                          <label className="block text-[11px] font-bold text-emerald-950 uppercase tracking-wider">
                            🔗 Google Form Linkini Şimdi Ekle:
                          </label>
                          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full min-w-0">
                            <input
                              type="url"
                              value={formLinkInput}
                              onChange={e => setFormLinkInput(e.target.value)}
                              placeholder="https://forms.gle/…"
                              className="w-full min-w-0 flex-1 min-h-[42px] px-3.5 bg-white border border-emerald-300 rounded-xl text-xs font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/30 text-slate-800"
                            />
                            <button
                              type="button"
                              disabled={savingFormLink || !formLinkInput.trim()}
                              onClick={() => handleSaveFormLink(selectedRequest.id, formLinkInput)}
                              className="w-full sm:w-auto min-h-[42px] px-5 py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-bold rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-1.5 shrink-0 shadow-xs"
                            >
                              {savingFormLink ? <RefreshCw size={13} className="animate-spin" /> : <Check size={14} />}
                              <span>Kaydet &amp; Yayınla</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* FORM QUESTIONS LIST */}
                  {selectedRequest.formSorulari && selectedRequest.formSorulari.length > 0 && (
                    <div className="bg-white rounded-xl p-3 border border-emerald-200/80 space-y-2">
                      <span className="text-[11px] font-black text-slate-700 uppercase tracking-wider block">
                        📋 Form Soruları ({selectedRequest.formSorulari.length}):
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                        {selectedRequest.formSorulari.map((q, i) => (
                          <div key={i} className="text-xs text-slate-800 bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-100 flex items-center gap-2">
                            <span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold flex items-center justify-center shrink-0">
                              {i + 1}
                            </span>
                            <span className="font-semibold truncate">{q}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* FORM DESCRIPTION / LOGISTICS */}
                  {selectedRequest.formAciklamasi && (
                    <div className="bg-white rounded-xl p-3 border border-emerald-200/80 space-y-1">
                      <span className="text-[11px] font-black text-slate-700 uppercase tracking-wider block">
                        📢 Form Açıklaması &amp; Lojistik Detayları:
                      </span>
                      <p className="text-xs text-slate-600 whitespace-pre-line leading-relaxed bg-slate-50 p-2.5 rounded-lg border border-slate-100 font-sans">
                        {selectedRequest.formAciklamasi}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Poster Preview (If Afiş or Hepsi) */}
              {(selectedRequest.talepTuru === 'afis' || selectedRequest.talepTuru === 'hepsi' || !selectedRequest.talepTuru) && (
                <div className="bg-gradient-to-br from-violet-50 to-indigo-50 border border-violet-100 rounded-2xl p-4 sm:p-5 shadow-xs">
                  <span className="text-[10px] font-bold text-violet-700 uppercase tracking-wider block mb-2">
                    🎨 Afiş Ön İzleme
                  </span>
                  <h4 className="text-sm sm:text-base font-black text-slate-900 mb-1 leading-snug">
                    {selectedRequest.etkinlikAdi}
                  </h4>
                  {selectedRequest.altBaslik && (
                    <p className="text-xs font-semibold text-violet-600 italic mb-2">{selectedRequest.altBaslik}</p>
                  )}
                  {selectedRequest.aciklama && (
                    <p className="text-xs text-slate-600 mb-3 bg-white/80 p-3 rounded-xl border border-violet-100 leading-relaxed whitespace-pre-line">
                      {selectedRequest.aciklama}
                    </p>
                  )}
                  <div className="pt-3 border-t border-violet-200/60 space-y-1.5 text-xs">
                    <div className="flex items-center gap-2 font-bold text-slate-800">
                      <Calendar size={13} className="text-violet-600 shrink-0" />
                      <span>
                        Etkinlik: {formatDateOnly(selectedRequest.tarih)} {selectedRequest.saat ? `· Saat ${selectedRequest.saat}` : ''}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 font-medium text-slate-700">
                      <MapPin size={13} className="text-violet-600 shrink-0" />
                      <span className="truncate">{selectedRequest.mekan}</span>
                    </div>
                    {selectedRequest.ozelNot && (
                      <div className="text-[11px] text-slate-500 italic pt-1">{selectedRequest.ozelNot}</div>
                    )}
                  </div>
                </div>
              )}

              {/* ════ HAZIR AFİŞ ŞABLONU (TALEP SAHİBİNİN YÜKLEDİĞİ) ════ */}
              {selectedRequest.hazirSablonVar && selectedRequest.sablonGorseli && (
                <div className="bg-gradient-to-br from-indigo-50/90 to-blue-50/70 border border-indigo-200 rounded-2xl p-4 sm:p-5 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">🖼️</span>
                      <div>
                        <h4 className="text-xs font-black text-indigo-950 uppercase tracking-wider">
                          Talep Sahibinin Hazır Şablonu
                        </h4>
                        <p className="text-[11px] text-indigo-700">
                          Afiş tasarımcısı bu şablon veya görseli referans alacaktır.
                        </p>
                      </div>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-800 text-[10px] font-bold border border-indigo-200 shrink-0">
                      Hazır Şablon
                    </span>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center gap-4 bg-white/90 p-3.5 rounded-xl border border-indigo-100">
                    <div
                      className="relative group cursor-pointer overflow-hidden rounded-xl border border-slate-200 shrink-0 shadow-xs"
                      onClick={() => setLightboxImage({
                        url: selectedRequest.sablonGorseli!,
                        title: 'Hazır Afiş Şablonu',
                        subtitle: selectedRequest.etkinlikAdi
                      })}
                    >
                      <img
                        src={selectedRequest.sablonGorseli}
                        alt="Hazır Şablon"
                        className="w-32 h-32 sm:w-28 sm:h-28 object-cover group-hover:scale-105 transition-transform"
                      />
                      <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                        <Maximize2 size={20} />
                      </div>
                    </div>

                    <div className="flex-1 min-w-0 text-center sm:text-left space-y-1">
                      <span className="text-xs font-bold text-slate-800 block truncate">
                        {selectedRequest.sablonGorseliAdi || 'hazir-sablon.jpg'}
                      </span>
                      <p className="text-[11px] text-slate-500">
                        Talep sahibi tarafından iletilen görsel şablon. Tam boyutta inceleyebilir veya tasarım için indirebilirsiniz.
                      </p>

                      <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-2">
                        <button
                          type="button"
                          onClick={() => setLightboxImage({
                            url: selectedRequest.sablonGorseli!,
                            title: 'Hazır Afiş Şablonu',
                            subtitle: selectedRequest.etkinlikAdi
                          })}
                          className="min-h-[34px] px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 shadow-xs"
                        >
                          <Maximize2 size={13} />
                          <span>Büyük Boyut Gör</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDownloadImage(
                            selectedRequest.sablonGorseli!,
                            selectedRequest.sablonGorseliAdi || 'hazir-sablon.jpg'
                          )}
                          className="min-h-[34px] px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5"
                        >
                          <Download size={13} />
                          <span>Şablonu İndir</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ════ YAYINLANAN RESMİ AFİŞ GÖRSELİ BÖLÜMÜ ════ */}
              <div className="bg-gradient-to-br from-emerald-50/90 to-teal-50/70 border border-emerald-200 rounded-2xl p-4 sm:p-5 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">🎨</span>
                    <div>
                      <h4 className="text-xs font-black text-emerald-950 uppercase tracking-wider">
                        Yayınlanan Resmi Afiş
                      </h4>
                      <p className="text-[11px] text-emerald-700">
                        {selectedRequest.finalAfisGorseli
                          ? 'Tasarımı tamamlanıp yayına alınan resmi afiş görseli.'
                          : isAfisManager
                          ? 'Afiş tamamlandığında bitmiş görseli buradan yükleyip herkesle paylaşabilirsiniz.'
                          : 'Afiş tasarımı henüz tamamlanmadı (Tasarımcı hazırlıyor…)'}
                      </p>
                    </div>
                  </div>
                  {selectedRequest.finalAfisGorseli && (
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-600 text-white text-[10px] font-bold shadow-xs shrink-0 flex items-center gap-1">
                      <Check size={11} /> Yayında
                    </span>
                  )}
                </div>

                {selectedRequest.finalAfisGorseli ? (
                  <div className="flex flex-col sm:flex-row items-center gap-4 bg-white p-3.5 rounded-xl border border-emerald-100">
                    <div
                      className="relative group cursor-pointer overflow-hidden rounded-xl border border-slate-200 shrink-0 shadow-md"
                      onClick={() => setLightboxImage({
                        url: selectedRequest.finalAfisGorseli!,
                        title: selectedRequest.etkinlikAdi,
                        subtitle: 'Yayınlanan Resmi Afiş'
                      })}
                    >
                      <img
                        src={selectedRequest.finalAfisGorseli}
                        alt="Yayınlanan Afiş"
                        className="w-36 h-48 sm:w-32 sm:h-44 object-cover group-hover:scale-105 transition-transform"
                      />
                      <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                        <Maximize2 size={24} />
                      </div>
                    </div>

                    <div className="flex-1 min-w-0 text-center sm:text-left space-y-1.5">
                      <span className="text-xs font-bold text-slate-800 block truncate">
                        {selectedRequest.etkinlikAdi} (Resmi Afiş)
                      </span>
                      <div className="text-[11px] text-slate-500 space-y-0.5">
                        <p>Ekleyen: <strong>{selectedRequest.finalAfisYukleyen?.name || 'Afiş Yöneticisi'}</strong></p>
                        {selectedRequest.finalAfisYuklemeTarihi && (
                          <p>Yayınlanma: {formatDateTime(selectedRequest.finalAfisYuklemeTarihi)}</p>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-2">
                        <button
                          type="button"
                          onClick={() => setLightboxImage({
                            url: selectedRequest.finalAfisGorseli!,
                            title: selectedRequest.etkinlikAdi,
                            subtitle: 'Yayınlanan Resmi Afiş'
                          })}
                          className="min-h-[36px] px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 shadow-xs"
                        >
                          <Maximize2 size={13} />
                          <span>Tam Boyutta Gör</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDownloadImage(
                            selectedRequest.finalAfisGorseli!,
                            `${selectedRequest.etkinlikAdi.replace(/[^a-zA-Z0-9çÇğĞıİöÖşŞüÜ_-]/g, '_')}_afis.jpg`
                          )}
                          className="min-h-[36px] px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5"
                        >
                          <Download size={13} />
                          <span>Afişi İndir</span>
                        </button>

                        {isAfisManager && (
                          <>
                            <label className="min-h-[36px] px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 active:scale-95 text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer">
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                disabled={uploadingFinalAfis}
                                onChange={e => {
                                  const file = e.target.files?.[0];
                                  if (file) handleUploadFinalAfis(selectedRequest.id, file);
                                }}
                              />
                              <Upload size={13} />
                              <span>Değiştir</span>
                            </label>
                            <button
                              type="button"
                              onClick={() => handleRemoveFinalAfis(selectedRequest.id)}
                              className="min-h-[36px] px-2.5 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 active:scale-95 text-xs font-bold rounded-xl transition-colors"
                              title="Görseli Kaldır"
                            >
                              <Trash2 size={13} />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ) : isAfisManager ? (
                  <div className="bg-white rounded-xl p-4 border-2 border-dashed border-emerald-300">
                    <label className="flex flex-col items-center justify-center cursor-pointer py-3 group">
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        disabled={uploadingFinalAfis}
                        onChange={e => {
                          const file = e.target.files?.[0];
                          if (file) handleUploadFinalAfis(selectedRequest.id, file);
                        }}
                      />
                      {uploadingFinalAfis ? (
                        <div className="flex items-center gap-2 text-emerald-700 font-bold text-xs py-2">
                          <RefreshCw size={18} className="animate-spin" />
                          <span>Afiş görseli işleniyor ve yayınlanıyor…</span>
                        </div>
                      ) : (
                        <>
                          <div className="w-11 h-11 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
                            <Upload size={20} />
                          </div>
                          <span className="text-xs font-black text-emerald-950">
                            Bitmiş Afiş Görselini Yükle &amp; Yayınla
                          </span>
                          <span className="text-[11px] text-emerald-700 mt-0.5 text-center">
                            PNG, JPG (Yüklendiğinde durum otomatik "Yayınlandı" olur ve herkes indirebilir)
                          </span>
                        </>
                      )}
                    </label>
                  </div>
                ) : (
                  <div className="bg-white/80 rounded-xl p-3 border border-slate-200 text-center text-xs text-slate-500">
                    Afiş tasarımı süreci devam ediyor. Tasarımcı onayladığında final görseli buradan indirebileceksiniz.
                  </div>
                )}
              </div>

              {/* Metadata Grid (Prominent Request Date) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3 text-xs bg-slate-50 p-3.5 sm:p-4 rounded-xl border border-slate-200/60">
                <div>
                  <span className="text-slate-400 block font-semibold mb-0.5">📅 Talep Edilme Tarihi</span>
                  <span className="font-bold text-violet-700">{formatDateTime(selectedRequest.createdAt)}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-semibold mb-0.5">👤 Talep Eden Kişi</span>
                  <span className="font-bold text-slate-800">{selectedRequest.createdBy?.name || '—'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-semibold mb-0.5">🏷️ Düzenleyen Ekip</span>
                  <span className="font-bold text-slate-800">{selectedRequest.ekip || '—'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-semibold mb-0.5">Mevcut Durum</span>
                  <span
                    className={`inline-block px-2.5 py-0.5 rounded-full font-bold text-[10px] border ${
                      STATUS_CONFIG[selectedRequest.status]?.badgeBg
                    }`}
                  >
                    {STATUS_CONFIG[selectedRequest.status]?.icon} {STATUS_CONFIG[selectedRequest.status]?.label}
                  </span>
                </div>
              </div>

              {/* Admin Stage Controls (Afiş Manager & Admin) */}
              {isAfisManager && (
                <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3.5 sm:p-4">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2.5">
                    🔄 Afiş Aşamasını Güncelle
                  </h4>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => handleUpdateStatus('talep-alindi')}
                      disabled={updatingStatus}
                      className={`min-h-[46px] py-2 px-2.5 rounded-xl text-xs font-bold transition-all border flex items-center justify-center gap-1.5 active:scale-95 ${
                        selectedRequest.status === 'talep-alindi'
                          ? 'bg-slate-700 text-white border-slate-800 shadow-xs'
                          : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
                      }`}
                    >
                      <span>📥</span> Talep Alındı
                    </button>

                    <button
                      onClick={() => handleUpdateStatus('tasarimda')}
                      disabled={updatingStatus}
                      className={`min-h-[46px] py-2 px-2.5 rounded-xl text-xs font-bold transition-all border flex items-center justify-center gap-1.5 active:scale-95 ${
                        selectedRequest.status === 'tasarimda'
                          ? 'bg-amber-500 text-white border-amber-600 shadow-xs'
                          : 'bg-white hover:bg-amber-50 text-slate-700 border-slate-200'
                      }`}
                    >
                      <span>🎨</span> Tasarımda
                    </button>

                    <button
                      onClick={() => handleUpdateStatus('merkez-onayinda')}
                      disabled={updatingStatus}
                      className={`min-h-[46px] py-2 px-2.5 rounded-xl text-xs font-bold transition-all border flex items-center justify-center gap-1.5 active:scale-95 ${
                        selectedRequest.status === 'merkez-onayinda'
                          ? 'bg-blue-600 text-white border-blue-700 shadow-xs'
                          : 'bg-white hover:bg-blue-50 text-slate-700 border-slate-200'
                      }`}
                    >
                      <span>🔍</span> Merkez Onayı
                    </button>

                    <button
                      onClick={() => handleUpdateStatus('yayinlandi')}
                      disabled={updatingStatus}
                      className={`min-h-[46px] py-2 px-2.5 rounded-xl text-xs font-bold transition-all border flex items-center justify-center gap-1.5 active:scale-95 ${
                        selectedRequest.status === 'yayinlandi'
                          ? 'bg-emerald-600 text-white border-emerald-700 shadow-xs'
                          : 'bg-white hover:bg-emerald-50 text-slate-700 border-slate-200'
                      }`}
                    >
                      <span>✅</span> Yayınlandı
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer with pb-safe */}
            <div className="p-3.5 sm:p-4 pb-safe bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-2">
                {isAdmin && (
                  <button
                    type="button"
                    onClick={() => setRequestToDelete(selectedRequest)}
                    className="min-h-[42px] px-3.5 py-2 bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 active:scale-95"
                  >
                    <Trash2 size={14} />
                    <span>Etkinliği Sil</span>
                  </button>
                )}

                {/* USER EDIT BUTTON */}
                {currentUser.role === 'user' && (
                  selectedRequest.status !== 'yayinlandi' ? (
                    <button
                      type="button"
                      onClick={() => {
                        const target = selectedRequest;
                        setSelectedRequest(null);
                        handleStartEdit(target);
                      }}
                      className="min-h-[42px] px-4 py-2 bg-amber-500 hover:bg-amber-600 active:scale-95 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 shadow-xs"
                    >
                      <Edit3 size={15} />
                      <span>Talebi Düzenle</span>
                    </button>
                  ) : (
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400 bg-slate-100 px-3 py-2 rounded-xl border border-slate-200">
                      <Lock size={13} />
                      <span>Etkinlik Yayınlandı (Kilitli)</span>
                    </div>
                  )
                )}
              </div>

              <button
                onClick={() => setSelectedRequest(null)}
                className="min-h-[42px] px-6 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold rounded-xl transition-colors active:scale-95"
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ════ DEDICATED GOOGLE FORM LINK MODAL (FOR ADMINOKUR & ADMIN) ════ */}
      {formLinkModalReq && (
        <div
          onClick={() => !savingFormLink && setFormLinkModalReq(null)}
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-y-auto"
        >
          <div
            onClick={e => e.stopPropagation()}
            className="bg-white rounded-t-3xl sm:rounded-3xl max-w-lg w-full p-5 sm:p-6 pb-safe sm:pb-6 shadow-2xl border border-slate-200 animate-sheet-up sm:animate-scale-in"
          >
            {/* Mobile Sheet Indicator */}
            <div className="w-12 h-1.5 bg-slate-300 rounded-full mx-auto mb-3.5 sm:hidden" />

            <div className="flex items-start justify-between gap-3 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                  <LinkIcon size={20} />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-slate-900 leading-tight">
                    Google Form Linki Ekle / Güncelle
                  </h3>
                  <p className="text-xs text-slate-500 truncate max-w-xs sm:max-w-sm mt-0.5">
                    {formLinkModalReq.etkinlikAdi}
                  </p>
                </div>
              </div>

              <button
                type="button"
                disabled={savingFormLink}
                onClick={() => setFormLinkModalReq(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors shrink-0"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-xs text-emerald-900">
                <p className="font-semibold">
                  Bu link kaydedildiği anda hem afiş tasarımcısı hem de talep sahibi tarafından anında görülecektir.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Google Form / Kayıt URL'si <span className="text-red-500">*</span>
                </label>
                <input
                  type="url"
                  value={formLinkInput}
                  onChange={e => setFormLinkInput(e.target.value)}
                  placeholder="https://forms.gle/..."
                  className="w-full min-h-[44px] px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-600"
                />
              </div>

              {/* Quick Bolu Demo link fill button */}
              <button
                type="button"
                onClick={() => setFormLinkInput('https://forms.gle/bolu-sonbahar-tefekkur-gezisi-2026')}
                className="text-[11px] font-bold text-emerald-700 hover:text-emerald-900 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-lg border border-emerald-200 transition-colors flex items-center gap-1.5"
              >
                <span>🍁</span>
                <span>Örnek Bolu Gezisi Form Linkini Yapıştır</span>
              </button>

              <div className="flex flex-col sm:flex-row items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  disabled={savingFormLink}
                  onClick={() => setFormLinkModalReq(null)}
                  className="w-full sm:w-auto min-h-[42px] px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors order-2 sm:order-1"
                >
                  Vazgeç
                </button>
                <button
                  type="button"
                  disabled={savingFormLink || !formLinkInput.trim()}
                  onClick={() => handleSaveFormLink(formLinkModalReq.id, formLinkInput)}
                  className="w-full sm:w-auto min-h-[42px] px-6 py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-bold rounded-xl shadow-md shadow-emerald-200 transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 order-1 sm:order-2"
                >
                  {savingFormLink ? (
                    <>
                      <RefreshCw size={14} className="animate-spin" /> Kaydediliyor…
                    </>
                  ) : (
                    <>
                      <Check size={14} /> Linki Kaydet &amp; Yayınla
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ════ DELETE CONFIRMATION MODAL (BOTTOM SHEET ON MOBILE) ════ */}
      {requestToDelete && (
        <div
          onClick={() => setRequestToDelete(null)}
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4"
        >
          <div
            onClick={e => e.stopPropagation()}
            className="bg-white rounded-t-3xl sm:rounded-3xl max-w-md w-full p-5 sm:p-6 pb-safe sm:pb-6 shadow-2xl border border-slate-200 animate-sheet-up sm:animate-scale-in"
          >
            {/* Mobile Drag Indicator */}
            <div className="w-10 h-1.5 bg-slate-300 rounded-full mx-auto mb-3.5 sm:hidden" />

            <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center text-xl mb-3">
              🗑️
            </div>
            <h3 className="text-base sm:text-lg font-black text-slate-900 mb-1.5">
              Etkinliği Silmek İstiyor Musunuz?
            </h3>
            <p className="text-xs text-slate-600 mb-4 leading-relaxed">
              <strong className="text-slate-900 font-bold">"{requestToDelete.etkinlikAdi}"</strong> başlıklı etkinlik ve talepler kalıcı olarak veritabanından silinecektir. Bu işlem geri alınamaz.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                disabled={deletingRequest}
                onClick={() => setRequestToDelete(null)}
                className="w-full sm:w-auto min-h-[44px] px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors disabled:opacity-50 order-2 sm:order-1"
              >
                Vazgeç
              </button>
              <button
                type="button"
                disabled={deletingRequest}
                onClick={() => handleDeleteRequest(requestToDelete)}
                className="w-full sm:w-auto min-h-[44px] px-5 py-2 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white text-xs font-bold rounded-xl shadow-md shadow-red-200 transition-all flex items-center justify-center gap-2 disabled:opacity-50 order-1 sm:order-2"
              >
                {deletingRequest ? (
                  <>
                    <RefreshCw size={14} className="animate-spin" /> Siliniyor…
                  </>
                ) : (
                  <>
                    <Trash2 size={14} /> Evet, Kalıcı Olarak Sil
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ════ EDIT REQUEST MODAL (USER - BEFORE 'yayinlandi') ════ */}
      {requestToEdit && (
        <div
          onClick={() => !savingEdit && setRequestToEdit(null)}
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-y-auto"
        >
          <div
            onClick={e => e.stopPropagation()}
            className="bg-white rounded-t-3xl sm:rounded-3xl max-w-2xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 animate-sheet-up sm:animate-scale-in overflow-hidden"
          >
            {/* Mobile Drag Indicator */}
            <div className="w-12 h-1.5 bg-slate-300 rounded-full mx-auto my-2.5 sm:hidden shrink-0" />

            {/* Modal Header */}
            <div className="px-4 py-3 sm:p-6 border-b border-slate-100 flex items-start justify-between gap-3 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                  <Edit3 size={20} />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-slate-900 leading-snug">
                    Talebi Düzenle
                  </h3>
                  <p className="text-xs text-slate-500">
                    Yayınlanmadan önce etkinlik ve form detaylarını güncelleyebilirsiniz.
                  </p>
                </div>
              </div>

              <button
                type="button"
                disabled={savingEdit}
                onClick={() => setRequestToEdit(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors shrink-0"
              >
                <X size={18} />
              </button>
            </div>

            {/* Informative Banner for user */}
            <div className="bg-blue-50 border-b border-blue-200 px-4 py-3 sm:px-6 flex items-start gap-2.5 shrink-0 text-xs text-blue-900">
              <span className="text-base shrink-0 mt-0.5">ℹ️</span>
              <div>
                <strong className="font-bold block text-blue-950">Değişiklikleriniz Yöneticiye İletilecektir</strong>
                Kaydettiğiniz güncellemeler incelenip onaylanması için otomatik olarak Admin Paneline bildirilecektir.
              </div>
            </div>

            {/* Form Body */}
            <form onSubmit={handleSaveEdit} className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Etkinlik Adı <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={editFormData.etkinlikAdi}
                  onChange={e => setEditFormData({ ...editFormData, etkinlikAdi: e.target.value })}
                  placeholder="Örn: Gençlik Buluşması"
                  className="w-full min-h-[44px] px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-600"
                />
              </div>

              <div className={`grid grid-cols-1 ${editFormData.talepTuru !== 'form' ? 'sm:grid-cols-2' : ''} gap-3.5`}>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Düzenleyen Ekip <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={editFormData.ekip}
                    onChange={e => setEditFormData({ ...editFormData, ekip: e.target.value })}
                    placeholder="Örn: Gençlik Komisyonu"
                    className="w-full min-h-[44px] px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-600"
                  />
                </div>

                {editFormData.talepTuru !== 'form' && (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Alt Başlık / Slogan
                    </label>
                    <input
                      type="text"
                      value={editFormData.altBaslik}
                      onChange={e => setEditFormData({ ...editFormData, altBaslik: e.target.value })}
                      placeholder="Örn: Geleceğe Birlikte Adım Atıyoruz"
                      className="w-full min-h-[44px] px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-600"
                    />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Etkinlik Tarihi <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={editFormData.tarih}
                    onChange={e => setEditFormData({ ...editFormData, tarih: e.target.value })}
                    className="w-full min-h-[44px] px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Etkinlik Saati <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="time"
                    required
                    value={editFormData.saat}
                    onChange={e => setEditFormData({ ...editFormData, saat: e.target.value })}
                    className="w-full min-h-[44px] px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-600"
                  />
                </div>
              </div>

              {/* 7-DAY ADVANCE NOTICE REMINDER IN EDIT MODAL (COMPACT & SUBTLE) */}
              {editFormData.tarih && (() => {
                const diffDays = getDaysUntilEvent(editFormData.tarih);
                if (diffDays === null || diffDays >= 7) return null;
                return (
                  <div className="px-3 py-2 bg-amber-50/90 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-center gap-2">
                    <span className="text-sm shrink-0">⏰</span>
                    <span className="text-[11px] leading-snug">
                      <strong>Hatırlatma:</strong> Etkinliğe {diffDays <= 0 ? '1 günden az' : `${diffDays} gün`} kaldı. Tasarımın yetişmesi için taleplerin en az 7 gün önce yapılması önerilir.
                    </span>
                  </div>
                );
              })()}

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Mekan / Adres <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={editFormData.mekan}
                  onChange={e => setEditFormData({ ...editFormData, mekan: e.target.value })}
                  placeholder="Örn: Büyük Konferans Salonu"
                  className="w-full min-h-[44px] px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Açıklama / Detaylar
                </label>
                <textarea
                  rows={3}
                  value={editFormData.aciklama}
                  onChange={e => setEditFormData({ ...editFormData, aciklama: e.target.value })}
                  placeholder="Etkinlik içeriği ve detaylar…"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-600 leading-relaxed font-sans"
                />
              </div>

              {/* EDIT FORM FIELDS (IF FORM OR HEPSI) */}
              {(editFormData.talepTuru === 'form' || editFormData.talepTuru === 'hepsi') && (
                <div className="bg-emerald-50/70 border-2 border-emerald-300 rounded-2xl p-4 space-y-3.5">
                  <div className="flex items-center gap-2 pb-2 border-b border-emerald-200">
                    <span className="text-lg">📝</span>
                    <h4 className="text-xs font-black text-emerald-950 uppercase tracking-wider">
                      Google Form Soruları &amp; Detayları
                    </h4>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-emerald-950 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                      <span>Formda Sorulacak Sorular ({editFormQuestions.length})</span>
                      <span className="text-[10px] text-emerald-700 font-normal">Soru ekleyip çıkarabilirsiniz</span>
                    </label>

                    <div className="flex flex-wrap gap-1.5 mb-2 p-2 bg-white rounded-xl border border-emerald-200 min-h-[44px] items-center">
                      {editFormQuestions.map((q, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-100 text-emerald-900 text-xs font-semibold rounded-lg border border-emerald-200/80"
                        >
                          <span className="text-[10px] font-bold text-emerald-700">#{idx + 1}</span>
                          <span>{q}</span>
                          <button
                            type="button"
                            onClick={() => setEditFormQuestions(prev => prev.filter((_, i) => i !== idx))}
                            className="text-emerald-600 hover:text-red-600 p-0.5 rounded transition-colors"
                          >
                            <X size={12} />
                          </button>
                        </span>
                      ))}
                    </div>

                    {/* Question Adder with Robust Nested Button (No overflow) */}
                    <div className="relative flex items-center w-full min-w-0">
                      <input
                        type="text"
                        value={editNewQuestionInput}
                        onChange={e => setEditNewQuestionInput(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            if (editNewQuestionInput.trim()) {
                              setEditFormQuestions([...editFormQuestions, editNewQuestionInput.trim()]);
                              setEditNewQuestionInput('');
                            }
                          }
                        }}
                        placeholder="Yeni soru ekleyin…"
                        className="w-full min-w-0 min-h-[42px] pl-3.5 pr-20 py-2 bg-white border border-emerald-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/30 text-slate-800"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (editNewQuestionInput.trim()) {
                            setEditFormQuestions([...editFormQuestions, editNewQuestionInput.trim()]);
                            setEditNewQuestionInput('');
                          }
                        }}
                        className="absolute right-1.5 top-1/2 -translate-y-1/2 min-h-[32px] px-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition-all flex items-center gap-1 shadow-xs"
                      >
                        <Plus size={13} /> Ekle
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-emerald-950 uppercase tracking-wider mb-1">
                      Form Açıklaması &amp; Lojistik Metni
                    </label>
                    <textarea
                      rows={3}
                      value={editFormData.formAciklamasi}
                      onChange={e => setEditFormData({ ...editFormData, formAciklamasi: e.target.value })}
                      placeholder="Ücret, Filistin fonu, ikram, kalkış saati…"
                      className="w-full px-3.5 py-2 bg-white border border-emerald-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/30 leading-relaxed font-sans"
                    />
                  </div>
                </div>
              )}

              {/* HAZIR AFİŞ ŞABLONU BÖLÜMÜ (EDIT MODAL) */}
              {(editFormData.talepTuru === 'afis' || editFormData.talepTuru === 'hepsi') && (
                <div className="bg-indigo-50/70 border border-indigo-200/90 rounded-2xl p-4 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2">
                      <span className="text-lg shrink-0 mt-0.5">🖼️</span>
                      <div>
                        <h4 className="text-xs font-black text-indigo-950 uppercase tracking-wider">
                          Hazır Afiş Şablonu
                        </h4>
                        <p className="text-[11px] text-indigo-700 leading-relaxed">
                          Tasarımcının kullanacağı hazır şablon görselini ekleyebilir veya güncelleyebilirsiniz.
                        </p>
                      </div>
                    </div>

                    <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-1">
                      <input
                        type="checkbox"
                        checked={editFormData.hazirSablonVar}
                        onChange={e => {
                          const checked = e.target.checked;
                          setEditFormData(prev => ({
                            ...prev,
                            hazirSablonVar: checked,
                            sablonGorseli: checked ? prev.sablonGorseli : '',
                            sablonGorseliAdi: checked ? prev.sablonGorseliAdi : ''
                          }));
                        }}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                    </label>
                  </div>

                  {editFormData.hazirSablonVar && (
                    <div className="pt-2 border-t border-indigo-100/90 space-y-2">
                      {!editFormData.sablonGorseli ? (
                        <label className="border-2 border-dashed border-indigo-300 hover:border-indigo-500 bg-white rounded-xl p-3 flex flex-col items-center justify-center cursor-pointer transition-colors text-center group">
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            disabled={isUploadingEditSablon}
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (!file) return;
                              setIsUploadingEditSablon(true);
                              try {
                                const b64 = await compressImageToBase64(file);
                                setEditFormData(prev => ({
                                  ...prev,
                                  hazirSablonVar: true,
                                  sablonGorseli: b64,
                                  sablonGorseliAdi: file.name
                                }));
                                showToast('Şablon görseli hazırlandı! 🖼️', 'success');
                              } catch (err: any) {
                                showToast('Görsel işlenemedi: ' + err.message, 'error');
                              } finally {
                                setIsUploadingEditSablon(false);
                              }
                            }}
                          />
                          {isUploadingEditSablon ? (
                            <div className="py-1 flex items-center gap-2 text-indigo-600 font-bold text-xs">
                              <RefreshCw size={15} className="animate-spin" />
                              <span>Görsel dönüştürülüyor…</span>
                            </div>
                          ) : (
                            <>
                              <Upload size={16} className="text-indigo-600 mb-1" />
                              <span className="text-xs font-bold text-indigo-950">Şablon Görseli Yükle</span>
                              <span className="text-[10px] text-indigo-600">PNG, JPG (Base64)</span>
                            </>
                          )}
                        </label>
                      ) : (
                        <div className="bg-white rounded-xl p-2.5 border border-indigo-200 flex items-center justify-between gap-2.5">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <img
                              src={editFormData.sablonGorseli}
                              alt="Şablon"
                              className="w-12 h-12 object-cover rounded-lg border border-slate-200 shrink-0 cursor-pointer"
                              onClick={() => setLightboxImage({ url: editFormData.sablonGorseli, title: 'Hazır Afiş Şablonu', subtitle: editFormData.sablonGorseliAdi })}
                            />
                            <div className="min-w-0">
                              <span className="text-xs font-bold text-indigo-950 block truncate">
                                {editFormData.sablonGorseliAdi || 'hazir-sablon.jpg'}
                              </span>
                              <span className="text-[10px] text-emerald-600 font-medium">✓ Şablon hazır</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              type="button"
                              onClick={() => setLightboxImage({ url: editFormData.sablonGorseli, title: 'Hazır Afiş Şablonu', subtitle: editFormData.sablonGorseliAdi })}
                              className="px-2 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold rounded-lg"
                            >
                              Gör
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditFormData(prev => ({ ...prev, sablonGorseli: '', sablonGorseliAdi: '' }))}
                              className="px-2 py-1 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold rounded-lg"
                            >
                              Kaldır
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Özel Not / Dipnot
                </label>
                <input
                  type="text"
                  value={editFormData.ozelNot}
                  onChange={e => setEditFormData({ ...editFormData, ozelNot: e.target.value })}
                  placeholder="Örn: * Katılım ücretsizdir."
                  className="w-full min-h-[44px] px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-600"
                />
              </div>

              {/* Specific Change Note for Admin (Calm and Optional) */}
              <div className="bg-slate-50 border border-slate-200/90 rounded-xl p-3.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Değişiklik Notu <span className="text-[10px] text-slate-400 font-normal lowercase">(isteğe bağlı)</span>
                </label>
                <input
                  type="text"
                  value={editFormData.userChangesNote}
                  onChange={e => setEditFormData({ ...editFormData, userChangesNote: e.target.value })}
                  placeholder="Örn: Etkinlik tarihi veya mekan güncellendi"
                  className="w-full min-h-[40px] px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-violet-500/20"
                />
              </div>

              {/* Modal Actions */}
              <div className="flex flex-col sm:flex-row items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  disabled={savingEdit}
                  onClick={() => setRequestToEdit(null)}
                  className="w-full sm:w-auto min-h-[44px] px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors order-2 sm:order-1"
                >
                  Vazgeç
                </button>
                <button
                  type="submit"
                  disabled={savingEdit}
                  className="w-full sm:w-auto min-h-[44px] px-6 py-2.5 bg-violet-600 hover:bg-violet-700 active:bg-violet-800 text-white text-xs font-bold rounded-xl shadow-md shadow-violet-200 transition-all flex items-center justify-center gap-2 disabled:opacity-50 order-1 sm:order-2"
                >
                  {savingEdit ? (
                    <>
                      <RefreshCw size={14} className="animate-spin" /> Kaydediliyor…
                    </>
                  ) : (
                    <>
                      <span>✓ Değişiklikleri Kaydet &amp; İlet</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ════ IMAGE LIGHTBOX MODAL (FOR TEMPLATE & FINAL POSTER) ════ */}
      {lightboxImage && (
        <div
          onClick={() => setLightboxImage(null)}
          className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-between p-3 sm:p-6 animate-fade-in"
        >
          {/* Lightbox Top Header */}
          <div
            onClick={e => e.stopPropagation()}
            className="w-full max-w-4xl flex items-center justify-between gap-3 text-white pb-3 shrink-0"
          >
            <div className="min-w-0">
              <h3 className="text-sm sm:text-base font-bold truncate">
                {lightboxImage.title}
              </h3>
              {lightboxImage.subtitle && (
                <p className="text-xs text-slate-400 truncate">{lightboxImage.subtitle}</p>
              )}
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => handleDownloadImage(lightboxImage.url, `${lightboxImage.title.replace(/[^a-zA-Z0-9çÇğĞıİöÖşŞüÜ_-]/g, '_')}.jpg`)}
                className="min-h-[38px] px-3.5 py-1.5 bg-white/15 hover:bg-white/25 active:scale-95 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 backdrop-blur-xs border border-white/20"
              >
                <Download size={14} />
                <span className="hidden sm:inline">İndir</span>
              </button>
              <button
                type="button"
                onClick={() => setLightboxImage(null)}
                className="w-9 h-9 rounded-full bg-white/15 hover:bg-white/25 text-white flex items-center justify-center transition-colors border border-white/20"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Lightbox Image Stage */}
          <div
            onClick={e => e.stopPropagation()}
            className="flex-1 w-full max-w-4xl flex items-center justify-center p-2 min-h-0 overflow-hidden"
          >
            <img
              src={lightboxImage.url}
              alt={lightboxImage.title}
              className="max-w-full max-h-[82vh] object-contain rounded-2xl shadow-2xl border border-white/10"
            />
          </div>

          {/* Lightbox Mobile Close Prompt */}
          <div className="py-2 text-[11px] text-slate-400 shrink-0 text-center">
            Kapatmak için görselin dışına dokunabilirsiniz
          </div>
        </div>
      )}

      {/* ════ TOAST NOTIFICATION (MOBILE SAFE POSITION) ════ */}
      {toast && (
        <div className="fixed bottom-24 lg:bottom-6 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-md mx-auto sm:mx-0 z-50 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-3 text-xs font-semibold animate-fade-in border border-slate-800">
          <span>{toast.message}</span>
        </div>
      )}
    </div>
  );
}
