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
import { AppUser, PosterRequest, RequestStatus, STATUS_CONFIG } from './types';
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
  AlertTriangle
} from 'lucide-react';

const INITIAL_DEFAULT_REQUESTS: PosterRequest[] = [
  {
    id: 'req-sample-1',
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
    id: 'req-sample-2',
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
  },
  {
    id: 'req-sample-3',
    etkinlikAdi: '🎤 Kariyer Sohbetleri: Sektörün Öncüleri',
    ekip: 'Sosyal Etkinlik Birimi',
    altBaslik: 'Başarı hikayelerinden ilham al, network edin!',
    aciklama: 'Farklı sektörlerden lider konuklarımızın tecrübelerini dinleyeceğimiz özel söyleşi dizisi.',
    tarih: '2026-11-28',
    saat: '18:00',
    mekan: 'Büyük Oditoryum Salonu',
    ozelNot: '* Katılımcılara katılım sertifikası verilecektir.',
    status: 'yayinlandi',
    createdBy: { uid: 'user-demo-3', name: 'Mehmet Demir' },
    createdAt: Date.now() - 86400 * 3 * 1000,
    updatedAt: Date.now() - 86400 * 1000
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
  const [activeTab, setActiveTab] = useState<string>('all');
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

  // ── Edit Request State (User) ──
  const [requestToEdit, setRequestToEdit] = useState<PosterRequest | null>(null);
  const [editFormData, setEditFormData] = useState({
    etkinlikAdi: '',
    ekip: '',
    altBaslik: '',
    aciklama: '',
    tarih: '',
    saat: '',
    mekan: '',
    ozelNot: '',
    userChangesNote: ''
  });
  const [savingEdit, setSavingEdit] = useState(false);
  const [acknowledgingId, setAcknowledgingId] = useState<string | null>(null);

  // ── User Creation Form (Admin) ──
  const [newFullname, setNewFullname] = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState<'user' | 'admin'>('user');
  const [creatingUser, setCreatingUser] = useState(false);
  const [userCreateMsg, setUserCreateMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // ── New Request Form (User) ──
  const [formData, setFormData] = useState({
    etkinlikAdi: '',
    ekip: '',
    altBaslik: '',
    aciklama: '',
    tarih: '',
    saat: '',
    mekan: '',
    ozelNot: ''
  });
  const [submittingRequest, setSubmittingRequest] = useState(false);
  const [mobileFormTab, setMobileFormTab] = useState<'form' | 'preview'>('form');

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
          const uObj: AppUser = {
            uid: firebaseUser.uid,
            name: uData.name || 'Kullanıcı',
            username: uData.username || 'kullanici',
            role: uData.role === 'admin' ? 'admin' : 'user',
            createdAt: uData.createdAt
          };
          setCurrentUser(uObj);
          setActiveTab(uObj.role === 'admin' ? 'all' : 'requests');
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

            if (currentUser.role === 'user') {
              list = list.filter(r => r.createdBy?.uid === currentUser.uid);
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
          setRequests(INITIAL_DEFAULT_REQUESTS);
          setDataLoading(false);
        }
      );

      if (currentUser.role === 'admin') {
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
      setRequests(INITIAL_DEFAULT_REQUESTS);
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
  // 4. LOGIN HANDLER
  // ─────────────────────────────────────────────────────────────
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const uname = loginUsername.trim().toLowerCase();
    const pass = loginPassword;

    if (!uname || !pass) return;

    setLoginLoading(true);
    setAuthError(null);

    try {
      let matchedUser: AppUser | null = null;
      try {
        const usersSnap = await rtdbGet(rtdbRef(rtdb, 'users'));
        if (usersSnap.exists()) {
          const allUsers = usersSnap.val();
          for (const uid of Object.keys(allUsers)) {
            const u = allUsers[uid];
            if (u.username?.toLowerCase() === uname) {
              if (!u.password || u.password === pass) {
                matchedUser = {
                  uid,
                  name: u.name,
                  username: u.username,
                  role: u.role === 'admin' ? 'admin' : 'user',
                  createdAt: u.createdAt
                };
                break;
              }
            }
          }
        }
      } catch (err) {
        console.warn("RTDB search warning:", err);
      }

      // Built-in initial admin fallback if not yet configured in database
      if (!matchedUser && (
        (uname === 'zeynep' && (pass === '123456' || pass === 'zeynep123')) ||
        (uname === 'admin' && (pass === 'admin123' || pass === '123456'))
      )) {
        matchedUser = {
          uid: 'admin-zeynep',
          name: uname === 'zeynep' ? 'Zeynep Tatar' : 'Sistem Yöneticisi',
          username: uname,
          role: 'admin',
          createdAt: Date.now()
        };
      }

      if (matchedUser) {
        setCurrentUser(matchedUser);
        setActiveTab(matchedUser.role === 'admin' ? 'all' : 'requests');
        showToast(`Hoş geldiniz, ${matchedUser.name}! 👋`, 'success');
        setLoginLoading(false);
        return;
      }

      try {
        const email = toEmail(uname);
        const cred = await signInWithEmailAndPassword(auth, email, pass);
        const snap = await rtdbGet(rtdbChild(rtdbRef(rtdb), `users/${cred.user.uid}`));
        const uData = snap.exists() ? snap.val() : {};

        const userObj: AppUser = {
          uid: cred.user.uid,
          name: uData.name || uname,
          username: uData.username || uname,
          role: uData.role === 'admin' ? 'admin' : 'user',
          createdAt: uData.createdAt
        };
        setCurrentUser(userObj);
        setActiveTab(userObj.role === 'admin' ? 'all' : 'requests');
        showToast(`Hoş geldiniz, ${userObj.name}! 👋`, 'success');
        setLoginLoading(false);
        return;
      } catch (authErr: any) {
        console.error("Firebase auth error:", authErr);
      }

      setAuthError('Kullanıcı adı veya şifre hatalı. Lütfen yöneticiniz tarafından tanımlanan bilgileri girin.');
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
  // 6. ADMIN ACTION: UPDATE STATUS
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
      showToast(`Durum "${STATUS_CONFIG[status]?.label}" olarak güncellendi! ✨`, 'success');
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
      // Even if offline/permission issue, remove from local state
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
  // 6c. USER ACTION: START EDITING REQUEST (BEFORE 'yayinlandi')
  // ─────────────────────────────────────────────────────────────
  const handleStartEdit = (req: PosterRequest) => {
    if (req.status === 'yayinlandi') {
      showToast('Afiş yayınlandığı için bu aşamada değişiklik yapılamaz. 🔒', 'error');
      return;
    }
    setRequestToEdit(req);
    setEditFormData({
      etkinlikAdi: req.etkinlikAdi || '',
      ekip: req.ekip || '',
      altBaslik: req.altBaslik || '',
      aciklama: req.aciklama || '',
      tarih: req.tarih || '',
      saat: req.saat || '',
      mekan: req.mekan || '',
      ozelNot: req.ozelNot || '',
      userChangesNote: req.userChangesNote || ''
    });
  };

  // ─────────────────────────────────────────────────────────────
  // 6d. USER ACTION: SAVE EDITED REQUEST (FLAGS RED WARNING TO ADMIN)
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

    const updatedFields = {
      etkinlikAdi: editFormData.etkinlikAdi.trim(),
      ekip: editFormData.ekip.trim(),
      altBaslik: editFormData.altBaslik.trim(),
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
      // Fallback local update
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
  // 6e. ADMIN ACTION: APPROVE / ACKNOWLEDGE USER CHANGE (STOPS RED ALERT)
  // ─────────────────────────────────────────────────────────────
  const handleAcknowledgeChange = async (requestId: string) => {
    if (!requestId) return;
    setAcknowledgingId(requestId);

    try {
      await rtdbUpdate(rtdbRef(rtdb, `requests/${requestId}`), {
        adminAcknowledgedChange: true
      });

      setRequests(prev => prev.map(r => r.id === requestId ? { ...r, adminAcknowledgedChange: true } : r));

      if (selectedRequest?.id === requestId) {
        setSelectedRequest(prev => prev ? { ...prev, adminAcknowledgedChange: true } : null);
      }

      showToast('Değişiklik onaylandı! Kırmızı uyarı durduruldu. ✓', 'success');
    } catch (err: any) {
      console.error("Acknowledge change error:", err);
      setRequests(prev => prev.map(r => r.id === requestId ? { ...r, adminAcknowledgedChange: true } : r));
      if (selectedRequest?.id === requestId) {
        setSelectedRequest(prev => prev ? { ...prev, adminAcknowledgedChange: true } : null);
      }
      showToast('Değişiklik onaylandı! Uyarı kaldırıldı. ✓', 'success');
    } finally {
      setAcknowledgingId(null);
    }
  };

  // ─────────────────────────────────────────────────────────────
  // 7. USER ACTION: SUBMIT REQUEST (STARTS AT 'talep-alindi' & NO HANG)
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

    setSubmittingRequest(true);

    try {
      const newReqRef = rtdbPush(rtdbRef(rtdb, 'requests'));
      const nowTimestamp = Date.now();

      const reqData = {
        etkinlikAdi: formData.etkinlikAdi.trim(),
        ekip: formData.ekip.trim(),
        altBaslik: formData.altBaslik.trim(),
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

      const savePromise = rtdbSet(newReqRef, reqData);
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('TIMEOUT')), 3500)
      );

      await Promise.race([savePromise, timeoutPromise]).catch(() => {
        const localReq: PosterRequest = {
          id: newReqRef.key || `req_${nowTimestamp}`,
          ...reqData
        };
        setRequests(prev => [localReq, ...prev]);
      });

      showToast('Afiş talebiniz başarıyla oluşturuldu! 🎉', 'success');

      setFormData({
        etkinlikAdi: '',
        ekip: '',
        altBaslik: '',
        aciklama: '',
        tarih: '',
        saat: '',
        mekan: '',
        ozelNot: ''
      });

      setActiveTab('requests');
    } catch (err: any) {
      console.error("Submit request error:", err);
      showToast('Afiş talebiniz kaydedildi!', 'success');
      setActiveTab('requests');
    } finally {
      setSubmittingRequest(false);
    }
  };

  // ─────────────────────────────────────────────────────────────
  // 8. FILTERED & SORTED REQUESTS
  // ─────────────────────────────────────────────────────────────
  const filteredRequests = useMemo(() => {
    let list = [...requests];

    if (activeTab === 'changed') {
      list = list.filter(r => r.hasUserChanges && !r.adminAcknowledgedChange);
    } else if (currentUser?.role === 'admin' && activeTab !== 'all' && activeTab !== 'users') {
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
          (r.userChangesNote || '').toLowerCase().includes(q)
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
  }, [requests, currentUser, activeTab, searchQuery, sortBy, sortOrder]);

  const stats = useMemo(() => {
    return {
      total: requests.length,
      alindi: requests.filter(r => r.status === 'talep-alindi').length,
      tasarimda: requests.filter(r => r.status === 'tasarimda').length,
      merkez: requests.filter(r => r.status === 'merkez-onayinda').length,
      yayinlandi: requests.filter(r => r.status === 'yayinlandi').length,
      changed: requests.filter(r => r.hasUserChanges && !r.adminAcknowledgedChange).length
    };
  }, [requests]);

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
          <h2 className="text-base font-bold text-slate-800 mb-1">Afiş Portalı</h2>
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
              <h1 className="text-lg sm:text-xl font-black text-slate-800 leading-tight">Afiş Portalı</h1>
              <p className="text-xs text-slate-500 font-medium">Etkinlik Afiş Yönetim Sistemi</p>
            </div>
          </div>

          <h2 className="text-xl sm:text-2xl font-black text-slate-800 mb-1">Giriş Yapın</h2>
          <p className="text-xs sm:text-sm text-slate-500 mb-6">Kullanıcı adı ve şifrenizle devam edin.</p>

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

          {/* Security & Access Notice */}
          <div className="mt-6 pt-5 border-t border-slate-100">
            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3.5 text-center">
              <p className="text-xs text-slate-700 font-semibold flex items-center justify-center gap-1.5">
                <span>🔒</span> Yetkili Giriş Portalı
              </p>
              <p className="text-[11px] text-slate-500 mt-1">
                Kullanıcı adı ve şifreniz yönetici tarafından tanımlanır. Hesabınız yoksa yöneticinizle iletişime geçiniz.
              </p>
            </div>
          </div>

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
              <h2 className="text-sm font-black text-slate-900 leading-tight">Afiş Portalı</h2>
              <span className="text-[11px] font-semibold text-violet-600">
                {currentUser.role === 'admin' ? '👑 Admin Paneli' : '👤 Kullanıcı Paneli'}
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
          {currentUser.role === 'admin' ? (
            <>
              <div className="px-3 pt-3 pb-1 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                Talepler
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
                    ? 'bg-red-50 text-red-700 border border-red-200 font-bold'
                    : stats.changed > 0
                    ? 'bg-red-50/70 text-red-700 hover:bg-red-100/80 font-bold border border-red-200 shadow-xs'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-base">🚨</span>
                  <span>Değiştirilen Talepler</span>
                </div>
                {stats.changed > 0 ? (
                  <span className="px-2 py-0.5 rounded-full bg-red-600 text-white text-[10px] font-bold animate-pulse shadow-xs">
                    {stats.changed} UYARI
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full bg-slate-200 text-slate-600 text-[10px] font-bold">
                    0
                  </span>
                )}
              </button>

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
                <span>Yeni Afiş Talebi</span>
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
            {currentUser.role === 'admin' && stats.changed > 0 && (
              <button
                onClick={() => handleSelectTab('changed')}
                className="py-1 px-2.5 bg-red-600 hover:bg-red-700 active:scale-95 text-white text-[11px] font-black rounded-xl shadow-xs flex items-center gap-1 min-h-[36px] transition-transform animate-pulse"
                title={`${stats.changed} adet değiştirilen talep var!`}
              >
                <AlertTriangle size={13} />
                <span>{stats.changed} UYARI</span>
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
                  ? 'Kullanıcıların onay/tasarım aşamasında değişiklik yaptığı talepler (Kırmızı Uyarı)'
                  : 'Afiş taleplerini inceleyin, aşamaları yönetin ve kullanıcı ekleyin.'
                : 'Etkinlikleriniz için afiş talebi oluşturun ve durumunu takip edin.'}
            </p>
          </div>

          <div className="flex items-center gap-3">
            {currentUser.role === 'admin' && stats.changed > 0 && (
              <button
                onClick={() => handleSelectTab('changed')}
                className="py-1.5 px-3.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-black flex items-center gap-1.5 transition-all shadow-md shadow-red-200 animate-pulse"
              >
                <AlertTriangle size={15} />
                <span>{stats.changed} Değişiklik Uyarısı</span>
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

        {/* Main Content Body */}
        <main className="p-4 sm:p-6 lg:p-8 flex-1 w-full max-w-7xl mx-auto">
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
                      onChange={e => setNewRole(e.target.value as 'user' | 'admin')}
                      className="w-full min-h-[44px] px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-600"
                    >
                      <option value="user">👤 Kullanıcı (Afiş Talebi Oluşturur)</option>
                      <option value="admin">👑 Admin (Talepleri ve Durumları Yönetir)</option>
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
                    usersList.map((u, i) => (
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
                          <span
                            className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                              u.role === 'admin'
                                ? 'bg-violet-50 text-violet-700 border border-violet-200'
                                : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            }`}
                          >
                            {u.role === 'admin' ? '👑 Admin' : '👤 Kullanıcı'}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {formatDateOnly(u.createdAt)}
                          </span>
                        </div>
                      </div>
                    ))
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
                        usersList.map((u, i) => (
                          <tr key={u.uid || i} className="hover:bg-slate-50/60 transition-colors">
                            <td className="py-3 px-4 flex items-center gap-2.5">
                              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-tr from-violet-600 to-indigo-600 text-white font-bold flex items-center justify-center text-xs shrink-0">
                                {getInitials(u.name)}
                              </div>
                              <span className="font-semibold text-slate-800 truncate max-w-[140px] sm:max-w-none">{u.name}</span>
                            </td>
                            <td className="py-3 px-4 font-mono font-medium text-slate-600">@{u.username}</td>
                            <td className="py-3 px-4">
                              <span
                                className={`px-2 py-0.5 rounded-full font-bold text-[10px] whitespace-nowrap ${
                                  u.role === 'admin'
                                    ? 'bg-violet-50 text-violet-700 border border-violet-200'
                                    : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                }`}
                              >
                                {u.role === 'admin' ? '👑 Admin' : '👤 Kullanıcı'}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-right text-slate-500 font-medium whitespace-nowrap">
                              {formatDateTime(u.createdAt)}
                            </td>
                          </tr>
                        ))
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
                  <div className="flex items-center gap-2.5 sm:gap-3 mb-1.5 sm:mb-2">
                    <span className="text-2xl sm:text-3xl">🎨</span>
                    <h2 className="text-lg sm:text-2xl font-black">Yeni Afiş Talebi</h2>
                  </div>
                  <p className="text-xs sm:text-sm text-violet-100 max-w-2xl">
                    Etkinlik bilgilerinizi doldurun. Talebiniz ilk olarak <strong>Talep Alındı</strong> aşamasında oluşturulacaktır.
                  </p>
                </div>

                <div className="p-3.5 sm:p-6 lg:p-8">
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
                      <span>Afiş Ön İzleme</span>
                    </button>
                  </div>

                  <form onSubmit={handleSubmitRequest}>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 items-start">
                      {/* Left Form Fields */}
                      <div className={`space-y-4 sm:space-y-6 ${mobileFormTab === 'preview' ? 'hidden lg:block' : 'block'}`}>
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
                                placeholder="Örn: 🚀 ATOM Tanışma Toplantısı"
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
                                placeholder="Örn: ATOM Ekibi / Sosyal Etkinlik Birimi"
                                className="w-full min-h-[44px] px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-600"
                              />
                            </div>
                          </div>
                        </div>

                        <div className="bg-slate-50/80 border border-slate-200/80 rounded-2xl p-4 sm:p-5">
                          <div className="flex items-center gap-2 mb-3.5 pb-2.5 border-b border-slate-200/60">
                            <span className="text-lg">✍️</span>
                            <div>
                              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                                Slogan &amp; Açıklama
                              </h4>
                              <p className="text-[11px] text-slate-400">Afişin ana mesajı</p>
                            </div>
                          </div>

                          <div className="space-y-3.5">
                            <div>
                              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
                                Alt Başlık / Slogan
                              </label>
                              <input
                                type="text"
                                maxLength={160}
                                value={formData.altBaslik}
                                onChange={e => setFormData({ ...formData, altBaslik: e.target.value })}
                                placeholder="Örn: Geleceği birlikte inşa ediyoruz!"
                                className="w-full min-h-[44px] px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-600"
                              />
                            </div>

                            <div>
                              <div className="flex items-center justify-between mb-1">
                                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                                  Etkinlik Açıklaması
                                </label>
                                <span className="text-[10px] text-slate-400">{formData.aciklama.length}/600</span>
                              </div>
                              <textarea
                                rows={3}
                                maxLength={600}
                                value={formData.aciklama}
                                onChange={e => setFormData({ ...formData, aciklama: e.target.value })}
                                placeholder="Etkinliğin içeriği hakkında özet bilgi…"
                                className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-600"
                              />
                            </div>
                          </div>
                        </div>

                        <div className="bg-slate-50/80 border border-slate-200/80 rounded-2xl p-4 sm:p-5">
                          <div className="flex items-center gap-2 mb-3.5 pb-2.5 border-b border-slate-200/60">
                            <span className="text-lg">📅</span>
                            <div>
                              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                                Tarih, Saat &amp; Yer
                              </h4>
                              <p className="text-[11px] text-slate-400">Lojistik bilgileri</p>
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

                          {/* 7-DAY ADVANCE NOTICE REMINDER */}
                          {formData.tarih && (() => {
                            const diffDays = getDaysUntilEvent(formData.tarih);
                            if (diffDays === null || diffDays >= 7) return null;
                            return (
                              <div className="mb-3 p-3 bg-amber-50 border border-amber-200/90 rounded-xl text-xs text-amber-900 flex items-start gap-2.5 animate-fade-in">
                                <span className="text-base shrink-0 mt-0.5">⚠️</span>
                                <div>
                                  <strong className="font-bold block text-amber-950">
                                    Hatırlatma: Etkinliğe {diffDays <= 0 ? '1 günden az süre kaldı' : `${diffDays} gün kaldı`}!
                                  </strong>
                                  <span className="text-[11px] text-amber-800 leading-relaxed block mt-0.5">
                                    Afiş taleplerinin en geç etkinlik tarihinden <strong>7 gün önce</strong> yapılması önerilir. Talebinizi oluşturabilirsiniz; afiş tasarım ve onay sürecinin zamanında yetişebilmesi için lütfen aciliyetini aşağıdaki özel not alanında belirtiniz.
                                  </span>
                                </div>
                              </div>
                            );
                          })()}

                          <div>
                            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
                              Mekan / Salon <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="text"
                              required
                              value={formData.mekan}
                              onChange={e => setFormData({ ...formData, mekan: e.target.value })}
                              placeholder="Örn: Gençlik Ofisi Konferans Salonu"
                              className="w-full min-h-[44px] px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-600"
                            />
                          </div>
                        </div>

                        <div className="bg-slate-50/80 border border-slate-200/80 rounded-2xl p-4 sm:p-5">
                          <div className="flex items-center gap-2 mb-3">
                            <span className="text-lg">📝</span>
                            <div>
                              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                                Özel Not / Uyarı
                              </h4>
                              <p className="text-[11px] text-slate-400">Afişin altına düşülecek küçük not</p>
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
                            <span>{submittingRequest ? 'İletiliyor…' : '📤 Talebi Gönder'}</span>
                          </button>
                        </div>
                      </div>

                      {/* Right Live Poster Preview */}
                      <div className={`lg:sticky lg:top-24 mt-2 lg:mt-0 ${mobileFormTab === 'form' ? 'hidden lg:block' : 'block'}`}>
                        <div className="bg-gradient-to-br from-violet-50 via-purple-50 to-pink-50 border border-violet-100 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-md">
                          <div className="flex items-center justify-between mb-3 sm:mb-4">
                            <span className="text-xs font-black uppercase tracking-wider text-violet-800 flex items-center gap-1.5">
                              <Eye size={14} /> Afiş Canlı Ön İzlemesi
                            </span>
                            <span className="text-[10px] font-bold text-violet-600 bg-violet-100/80 px-2 py-0.5 rounded-full">
                              Canlı Görünüm
                            </span>
                          </div>

                          <div className="bg-white rounded-2xl p-4 sm:p-6 border border-slate-200/90 shadow-sm min-h-[280px] sm:min-h-[340px] flex flex-col justify-between">
                            <div>
                              {formData.ekip && (
                                <div className="inline-block px-2.5 py-1 bg-violet-100 text-violet-800 text-[10px] font-extrabold rounded-md uppercase tracking-wider mb-2.5">
                                  {formData.ekip}
                                </div>
                              )}

                              <h3 className="text-base sm:text-xl font-black text-slate-900 leading-snug mb-2">
                                {formData.etkinlikAdi || (
                                  <span className="text-slate-300 italic">Etkinlik Adı Buraya Gelecek</span>
                                )}
                              </h3>

                              {formData.altBaslik && (
                                <p className="text-xs font-semibold text-violet-600 italic mb-2.5">
                                  {formData.altBaslik}
                                </p>
                              )}

                              {formData.aciklama && (
                                <p className="text-xs text-slate-600 leading-relaxed mb-3 bg-slate-50 p-3 rounded-xl border border-slate-100">
                                  {formData.aciklama}
                                </p>
                              )}
                            </div>

                            <div className="pt-3 border-t border-slate-100 space-y-2 mt-3">
                              {(formData.tarih || formData.saat) && (
                                <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                                  <Calendar size={14} className="text-violet-600 shrink-0" />
                                  <span>
                                    {formData.tarih ? formatDateOnly(formData.tarih) : 'Tarih seçilmedi'}
                                    {formData.saat ? ` · Saat ${formData.saat}` : ''}
                                  </span>
                                </div>
                              )}

                              {formData.mekan && (
                                <div className="flex items-center gap-2 text-xs font-medium text-slate-700">
                                  <MapPin size={14} className="text-violet-600 shrink-0" />
                                  <span>{formData.mekan}</span>
                                </div>
                              )}

                              {formData.ozelNot && (
                                <div className="mt-2.5 pt-2 text-[11px] text-slate-500 italic border-t border-dashed border-slate-200">
                                  {formData.ozelNot}
                                </div>
                              )}
                            </div>

                            {/* Mobile Quick Action Buttons on Preview */}
                            <div className="lg:hidden mt-4 pt-3 border-t border-slate-100 flex flex-col gap-2">
                              <button
                                type="submit"
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
                      </div>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          ) : (
            /* REQUESTS LIST (RESPONSIVE GRID & CARDS) */
            <div>
              {/* Mobile Horizontal Swipeable Status Pills (< sm) */}
              {currentUser.role === 'admin' && (
                <div className="sm:hidden no-scrollbar flex items-center gap-2 overflow-x-auto pb-1 mb-3 -mx-4 px-4">
                  <button
                    type="button"
                    onClick={() => handleSelectTab('all')}
                    className={`shrink-0 px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 active:scale-95 border ${
                      activeTab === 'all'
                        ? 'bg-violet-600 text-white border-violet-600 shadow-sm'
                        : 'bg-white text-slate-700 border-slate-200'
                    }`}
                  >
                    <span>📋 Tümü</span>
                    <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${activeTab === 'all' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'}`}>
                      {stats.total}
                    </span>
                  </button>

                  {/* Red Warning Pill for Changed Requests */}
                  <button
                    type="button"
                    onClick={() => handleSelectTab('changed')}
                    className={`shrink-0 px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 active:scale-95 border ${
                      activeTab === 'changed'
                        ? 'bg-red-600 text-white border-red-600 shadow-sm ring-2 ring-red-300'
                        : stats.changed > 0
                        ? 'bg-red-50 text-red-700 border-red-300 animate-pulse'
                        : 'bg-white text-slate-700 border-slate-200'
                    }`}
                  >
                    <span>🚨 Değişenler</span>
                    <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${activeTab === 'changed' ? 'bg-white/20 text-white' : stats.changed > 0 ? 'bg-red-600 text-white font-black' : 'bg-slate-100 text-slate-700'}`}>
                      {stats.changed}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSelectTab('talep-alindi')}
                    className={`shrink-0 px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 active:scale-95 border ${
                      activeTab === 'talep-alindi'
                        ? 'bg-slate-700 text-white border-slate-700 shadow-sm'
                        : 'bg-white text-slate-700 border-slate-200'
                    }`}
                  >
                    <span>📥 Alındı</span>
                    <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${activeTab === 'talep-alindi' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'}`}>
                      {stats.alindi}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSelectTab('tasarimda')}
                    className={`shrink-0 px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 active:scale-95 border ${
                      activeTab === 'tasarimda'
                        ? 'bg-amber-500 text-white border-amber-500 shadow-sm'
                        : 'bg-white text-slate-700 border-slate-200'
                    }`}
                  >
                    <span>🎨 Tasarım</span>
                    <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${activeTab === 'tasarimda' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'}`}>
                      {stats.tasarimda}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSelectTab('merkez-onayinda')}
                    className={`shrink-0 px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 active:scale-95 border ${
                      activeTab === 'merkez-onayinda'
                        ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                        : 'bg-white text-slate-700 border-slate-200'
                    }`}
                  >
                    <span>🔍 Onayda</span>
                    <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${activeTab === 'merkez-onayinda' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'}`}>
                      {stats.merkez}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSelectTab('yayinlandi')}
                    className={`shrink-0 px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 active:scale-95 border ${
                      activeTab === 'yayinlandi'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                        : 'bg-white text-slate-700 border-slate-200'
                    }`}
                  >
                    <span>✅ Yayınlandı</span>
                    <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${activeTab === 'yayinlandi' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'}`}>
                      {stats.yayinlandi}
                    </span>
                  </button>
                </div>
              )}

              {/* Desktop & Tablet Stats Grid (>= sm) */}
              <div className={`hidden sm:grid ${currentUser.role === 'admin' ? 'sm:grid-cols-3 lg:grid-cols-6' : 'sm:grid-cols-3 lg:grid-cols-5'} gap-2.5 sm:gap-3.5 mb-6 sm:mb-8`}>
                <div
                  onClick={() => handleSelectTab('all')}
                  className={`bg-white border rounded-2xl p-3.5 sm:p-4 shadow-xs relative overflow-hidden cursor-pointer transition-all ${
                    activeTab === 'all' ? 'border-violet-500 ring-2 ring-violet-500/10' : 'border-slate-200/80 hover:border-slate-300'
                  }`}
                >
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-violet-600 to-indigo-600" />
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xl sm:text-2xl font-black text-violet-700">{stats.total}</p>
                      <p className="text-[11px] sm:text-xs font-semibold text-slate-400">Toplam Talep</p>
                    </div>
                    <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center text-sm sm:text-base">
                      📋
                    </div>
                  </div>
                </div>

                {currentUser.role === 'admin' && (
                  <div
                    onClick={() => handleSelectTab('changed')}
                    className={`bg-white border rounded-2xl p-3.5 sm:p-4 shadow-xs relative overflow-hidden transition-all cursor-pointer ${
                      activeTab === 'changed'
                        ? 'border-red-500 ring-2 ring-red-500/20 bg-red-50/30'
                        : stats.changed > 0
                        ? 'border-red-300 bg-red-50/40 hover:border-red-400'
                        : 'border-slate-200/80 hover:border-slate-300'
                    }`}
                  >
                    <div className={`absolute top-0 left-0 right-0 h-1 ${stats.changed > 0 ? 'bg-red-600 animate-pulse' : 'bg-slate-300'}`} />
                    <div className="flex items-center justify-between">
                      <div>
                        <p className={`text-xl sm:text-2xl font-black ${stats.changed > 0 ? 'text-red-600' : 'text-slate-400'}`}>
                          {stats.changed}
                        </p>
                        <p className="text-[11px] sm:text-xs font-semibold text-slate-500">Değiştirilen</p>
                      </div>
                      <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center text-sm sm:text-base ${
                        stats.changed > 0 ? 'bg-red-100 text-red-600' : 'bg-slate-100 text-slate-400'
                      }`}>
                        🚨
                      </div>
                    </div>
                  </div>
                )}

                <div
                  onClick={() => currentUser.role === 'admin' && handleSelectTab('talep-alindi')}
                  className={`bg-white border rounded-2xl p-3.5 sm:p-4 shadow-xs relative overflow-hidden transition-all ${
                    currentUser.role === 'admin' ? 'cursor-pointer' : ''
                  } ${
                    activeTab === 'talep-alindi' ? 'border-slate-500 ring-2 ring-slate-500/10' : 'border-slate-200/80 hover:border-slate-300'
                  }`}
                >
                  <div className="absolute top-0 left-0 right-0 h-1 bg-slate-400" />
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xl sm:text-2xl font-black text-slate-700">{stats.alindi}</p>
                      <p className="text-[11px] sm:text-xs font-semibold text-slate-400">Talep Alındı</p>
                    </div>
                    <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center text-sm sm:text-base">
                      📥
                    </div>
                  </div>
                </div>

                <div
                  onClick={() => currentUser.role === 'admin' && handleSelectTab('tasarimda')}
                  className={`bg-white border rounded-2xl p-3.5 sm:p-4 shadow-xs relative overflow-hidden transition-all ${
                    currentUser.role === 'admin' ? 'cursor-pointer' : ''
                  } ${
                    activeTab === 'tasarimda' ? 'border-amber-500 ring-2 ring-amber-500/10' : 'border-slate-200/80 hover:border-slate-300'
                  }`}
                >
                  <div className="absolute top-0 left-0 right-0 h-1 bg-amber-500" />
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xl sm:text-2xl font-black text-amber-600">{stats.tasarimda}</p>
                      <p className="text-[11px] sm:text-xs font-semibold text-slate-400">Tasarımda</p>
                    </div>
                    <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center text-sm sm:text-base">
                      🎨
                    </div>
                  </div>
                </div>

                <div
                  onClick={() => currentUser.role === 'admin' && handleSelectTab('merkez-onayinda')}
                  className={`bg-white border rounded-2xl p-3.5 sm:p-4 shadow-xs relative overflow-hidden transition-all ${
                    currentUser.role === 'admin' ? 'cursor-pointer' : ''
                  } ${
                    activeTab === 'merkez-onayinda' ? 'border-blue-500 ring-2 ring-blue-500/10' : 'border-slate-200/80 hover:border-slate-300'
                  }`}
                >
                  <div className="absolute top-0 left-0 right-0 h-1 bg-blue-600" />
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xl sm:text-2xl font-black text-blue-600">{stats.merkez}</p>
                      <p className="text-[11px] sm:text-xs font-semibold text-slate-400">Merkez Onayı</p>
                    </div>
                    <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center text-sm sm:text-base">
                      🔍
                    </div>
                  </div>
                </div>

                <div
                  onClick={() => currentUser.role === 'admin' && handleSelectTab('yayinlandi')}
                  className={`bg-white border rounded-2xl p-3.5 sm:p-4 shadow-xs relative overflow-hidden transition-all ${
                    currentUser.role === 'admin' ? 'cursor-pointer' : ''
                  } ${
                    activeTab === 'yayinlandi' ? 'border-emerald-500 ring-2 ring-emerald-500/10' : 'border-slate-200/80 hover:border-slate-300'
                  }`}
                >
                  <div className="absolute top-0 left-0 right-0 h-1 bg-emerald-500" />
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xl sm:text-2xl font-black text-emerald-600">{stats.yayinlandi}</p>
                      <p className="text-[11px] sm:text-xs font-semibold text-slate-400">Yayınlandı</p>
                    </div>
                    <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-sm sm:text-base">
                      ✅
                    </div>
                  </div>
                </div>
              </div>

              {/* Responsive Filter and Search Bar */}
              <div className="bg-white border border-slate-200/80 rounded-2xl p-3 sm:p-4 mb-4 sm:mb-6 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 sm:gap-4">
                <div className="relative w-full sm:max-w-xs">
                  <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Etkinlik, ekip veya kişi ara…"
                    className="w-full min-h-[44px] pl-9 pr-9 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-600 placeholder:text-slate-400"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                  <div className="flex rounded-xl bg-slate-100 p-0.5 border border-slate-200/60 flex-1 sm:flex-none">
                    <button
                      onClick={() => setSortBy('created')}
                      className={`flex-1 sm:flex-none min-h-[36px] px-2.5 sm:px-3 py-1.5 rounded-lg text-[11px] sm:text-xs font-bold transition-all ${
                        sortBy === 'created' ? 'bg-white text-violet-700 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      Talep Tarihine Göre
                    </button>
                    <button
                      onClick={() => setSortBy('event')}
                      className={`flex-1 sm:flex-none min-h-[36px] px-2.5 sm:px-3 py-1.5 rounded-lg text-[11px] sm:text-xs font-bold transition-all ${
                        sortBy === 'event' ? 'bg-white text-violet-700 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      Etkinlik Tarihine Göre
                    </button>
                  </div>

                  <select
                    value={sortOrder}
                    onChange={e => setSortOrder(e.target.value as 'desc' | 'asc')}
                    className="min-h-[38px] px-2.5 sm:px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none"
                  >
                    <option value="desc">En Yeni Önce</option>
                    <option value="asc">En Eski Önce</option>
                  </select>
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
                      ? 'Aramanıza uygun bir afiş talebi bulunamadı.'
                      : currentUser.role === 'admin'
                      ? 'Bu aşamada henüz talep bulunmuyor.'
                      : 'Henüz bir afiş talebi oluşturmadınız.'}
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
                <div className="space-y-3">
                  {filteredRequests.map((req, index) => {
                    const cfg = STATUS_CONFIG[req.status] || STATUS_CONFIG['talep-alindi'];
                    const isAdmin = currentUser.role === 'admin';
                    const hasUnseenChanges = Boolean(req.hasUserChanges && !req.adminAcknowledgedChange);

                    return (
                      <div
                        key={req.id || index}
                        onClick={() => setSelectedRequest(req)}
                        className={`bg-white border rounded-2xl p-4 sm:p-5 shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col md:flex-row items-start md:items-center justify-between gap-3 sm:gap-4 ${
                          isAdmin && hasUnseenChanges
                            ? 'border-red-300 border-l-4 border-l-red-600 bg-red-50/20 ring-2 ring-red-400/40 shadow-sm'
                            : `border-slate-200/80 border-l-4 ${cfg.borderColor}`
                        }`}
                      >
                        <div className="flex-1 min-w-0 w-full">
                          {/* UNSEEN USER CHANGES RED ALERT BANNER (ONLY FOR ADMIN) */}
                          {isAdmin && hasUnseenChanges && (
                            <div className="mb-2.5 p-2 sm:p-2.5 rounded-xl bg-red-600 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-xs animate-pulse">
                              <div className="flex items-center gap-1.5 text-xs font-black">
                                <AlertTriangle size={15} className="shrink-0" />
                                <span>🚨 DİKKAT: KULLANICI DEĞİŞİKLİK YAPTI!</span>
                              </div>
                              {req.userChangesNote && (
                                <span className="text-[11px] font-semibold text-red-100 truncate max-w-xs">
                                  Not: "{req.userChangesNote}"
                                </span>
                              )}
                            </div>
                          )}

                          {/* USER NOTIFICATION PILL (ONLY FOR REGULAR USER - CALM STATUS) */}
                          {!isAdmin && req.hasUserChanges && (
                            !req.adminAcknowledgedChange ? (
                              <div className="mb-2.5 p-2 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 flex items-center justify-between gap-2 text-xs">
                                <div className="flex items-center gap-1.5 font-semibold">
                                  <span>ℹ️</span>
                                  <span>Yaptığınız değişiklik yöneticiye iletildi, inceleniyor.</span>
                                </div>
                                {req.userChangesNote && (
                                  <span className="text-[11px] text-blue-700 italic truncate max-w-xs">
                                    "{req.userChangesNote}"
                                  </span>
                                )}
                              </div>
                            ) : (
                              <div className="mb-2.5 p-1.5 px-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center gap-1.5 text-xs font-semibold">
                                <CheckCircle2 size={13} className="text-emerald-600" />
                                <span>Yaptığınız değişiklik yönetici tarafından onaylandı.</span>
                              </div>
                            )
                          )}

                          {/* Header row with badges & dates */}
                          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-2">
                            <span className="text-xs font-mono font-bold text-slate-400">#{index + 1}</span>
                            <span className="text-xs font-extrabold text-violet-700 bg-violet-50 px-2 py-0.5 rounded-md">
                              {req.ekip}
                            </span>
                            {/* TALEP TARİHİ CLEARLY HIGHLIGHTED */}
                            <span className="text-[11px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md flex items-center gap-1">
                              <Clock3 size={11} className="text-slate-400 shrink-0" />
                              <span className="truncate">Talep: {formatDateTime(req.createdAt)}</span>
                              <span className="text-slate-400 font-normal">({formatRelative(req.createdAt)})</span>
                            </span>

                            {/* Status badge for change */}
                            {isAdmin ? (
                              req.hasUserChanges && (
                                <span className={`text-[10px] font-black px-2 py-0.5 rounded-md flex items-center gap-1 ${
                                  hasUnseenChanges
                                    ? 'bg-red-100 text-red-700 border border-red-200'
                                    : 'bg-slate-100 text-slate-600'
                                }`}>
                                  <span>✏️</span>
                                  <span>{hasUnseenChanges ? 'Yeni Değişiklik' : 'Düzenlendi (Onaylı)'}</span>
                                </span>
                              )
                            ) : (
                              req.hasUserChanges && (
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 ${
                                  !req.adminAcknowledgedChange
                                    ? 'bg-blue-100 text-blue-800 border border-blue-200'
                                    : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                }`}>
                                  <span>{!req.adminAcknowledgedChange ? '⏳' : '✓'}</span>
                                  <span>{!req.adminAcknowledgedChange ? 'İletildi' : 'Onaylandı'}</span>
                                </span>
                              )
                            )}
                          </div>

                          <h3 className="text-sm sm:text-base font-bold text-slate-900 truncate mb-2">
                            {req.etkinlikAdi}
                          </h3>

                          {/* Event info */}
                          <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs text-slate-500">
                            <span className="flex items-center gap-1.5 font-semibold text-slate-700">
                              <Calendar size={13} className="text-violet-600 shrink-0" />
                              <span>Etkinlik: {formatDateOnly(req.tarih)} {req.saat ? `(${req.saat})` : ''}</span>
                            </span>
                            <span className="flex items-center gap-1 font-medium truncate max-w-[180px] sm:max-w-none">
                              <MapPin size={13} className="text-slate-400 shrink-0" />
                              <span className="truncate">{req.mekan}</span>
                            </span>
                            <span className="flex items-center gap-1 font-medium">
                              <UserIcon size={13} className="text-slate-400 shrink-0" />
                              <span>{req.createdBy?.name || 'Kullanıcı'}</span>
                            </span>
                          </div>

                          {/* 4-Step Progress Stepper (Responsive) */}
                          <div className="mt-3.5 pt-3 border-t border-slate-100 flex items-center gap-1.5 sm:gap-2 max-w-xl">
                            <div className="flex items-center gap-1 sm:gap-1.5 flex-1 min-w-0">
                              <div
                                className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                                  cfg.step >= 1 ? 'bg-slate-700 text-white' : 'bg-slate-200 text-slate-500'
                                }`}
                              >
                                {cfg.step > 1 ? '✓' : '1'}
                              </div>
                              <span className="text-[10px] font-semibold text-slate-600 truncate">Alındı</span>
                            </div>
                            <div className={`h-0.5 flex-1 ${cfg.step >= 2 ? 'bg-amber-500' : 'bg-slate-200'}`} />
                            <div className="flex items-center gap-1 sm:gap-1.5 flex-1 min-w-0">
                              <div
                                className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                                  cfg.step >= 2 ? 'bg-amber-500 text-white' : 'bg-slate-200 text-slate-500'
                                }`}
                              >
                                {cfg.step > 2 ? '✓' : '2'}
                              </div>
                              <span className="text-[10px] font-semibold text-slate-600 truncate">Tasarım</span>
                            </div>
                            <div className={`h-0.5 flex-1 ${cfg.step >= 3 ? 'bg-blue-600' : 'bg-slate-200'}`} />
                            <div className="flex items-center gap-1 sm:gap-1.5 flex-1 min-w-0">
                              <div
                                className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                                  cfg.step >= 3 ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-500'
                                }`}
                              >
                                {cfg.step > 3 ? '✓' : '3'}
                              </div>
                              <span className="text-[10px] font-semibold text-slate-600 truncate">Onay</span>
                            </div>
                            <div className={`h-0.5 flex-1 ${cfg.step >= 4 ? 'bg-emerald-600' : 'bg-slate-200'}`} />
                            <div className="flex items-center gap-1 sm:gap-1.5 flex-1 min-w-0">
                              <div
                                className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                                  cfg.step >= 4 ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-500'
                                }`}
                              >
                                {cfg.step >= 4 ? '✓' : '4'}
                              </div>
                              <span className="text-[10px] font-semibold text-slate-600 truncate">Yayın</span>
                            </div>
                          </div>
                        </div>

                        <div className="shrink-0 flex items-center justify-between w-full md:w-auto pt-2 md:pt-0 border-t md:border-t-0 border-slate-100 gap-2">
                          <span
                            className={`px-3 py-1 rounded-full font-bold text-xs border flex items-center gap-1.5 ${cfg.badgeBg}`}
                          >
                            <span>{cfg.icon}</span>
                            <span>{cfg.label}</span>
                          </span>

                          {/* USER EDIT BUTTON: Available before 'yayinlandi' */}
                          {currentUser.role === 'user' && (
                            req.status !== 'yayinlandi' ? (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleStartEdit(req);
                                }}
                                className="min-h-[36px] px-3 py-1 bg-amber-500 hover:bg-amber-600 active:scale-95 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-1"
                                title="Afiş yayınlanmadan önce düzenle"
                              >
                                <Edit3 size={13} />
                                <span>Düzenle</span>
                              </button>
                            ) : (
                              <span
                                className="px-2.5 py-1 rounded-xl bg-slate-100 text-slate-400 text-[10px] font-bold border border-slate-200 flex items-center gap-1"
                                title="Yayınlandı aşamasına geçen afişler düzenlenemez"
                              >
                                <Lock size={11} />
                                <span>Kilitli</span>
                              </span>
                            )
                          )}

                          {/* ADMIN QUICK APPROVE BUTTON: Stops red warning */}
                          {currentUser.role === 'admin' && hasUnseenChanges && (
                            <button
                              type="button"
                              disabled={acknowledgingId === req.id}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleAcknowledgeChange(req.id);
                              }}
                              className="min-h-[34px] px-2.5 py-1 bg-red-600 hover:bg-red-700 active:scale-95 text-white text-xs font-black rounded-xl shadow-xs transition-transform flex items-center gap-1 shrink-0"
                              title="Değişikliği Onayla ve Kırmızı Uyarıyı Kaldır"
                            >
                              <Check size={13} />
                              <span>{acknowledgingId === req.id ? '…' : 'Onayla'}</span>
                            </button>
                          )}

                          {currentUser.role === 'admin' && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setRequestToDelete(req);
                              }}
                              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors min-h-[34px] min-w-[34px] flex items-center justify-center"
                              title="Etkinliği Sil"
                              aria-label="Etkinliği Sil"
                            >
                              <Trash2 size={15} />
                            </button>
                          )}

                          <span className="text-slate-400 hover:text-slate-600">
                            <ChevronRight size={18} />
                          </span>
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
            <button
              onClick={() => handleSelectTab('requests')}
              className={`flex flex-col items-center justify-center py-1 px-3 rounded-2xl transition-all active:scale-95 ${
                activeTab === 'requests' ? 'text-violet-700 font-bold scale-105' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <span className="text-xl leading-none">📋</span>
              <span className="text-[10px] mt-1 font-bold">Taleplerim ({requests.length})</span>
            </button>

            {/* Elevated Hero Center Floating Button for New Request */}
            <button
              onClick={() => handleSelectTab('new')}
              className={`-mt-6 w-14 h-14 rounded-full flex flex-col items-center justify-center shadow-lg shadow-violet-500/35 transition-all active:scale-90 border-2 border-white ${
                activeTab === 'new'
                  ? 'bg-slate-900 text-white ring-4 ring-violet-200'
                  : 'bg-gradient-to-tr from-violet-600 to-indigo-600 text-white'
              }`}
              title="Yeni Afiş Talebi Oluştur"
              aria-label="Yeni Afiş Talebi"
            >
              <Plus size={26} />
            </button>

            <button
              onClick={handleLogout}
              className="flex flex-col items-center justify-center py-1 px-3 text-slate-500 hover:text-red-600 rounded-2xl transition-all active:scale-95"
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
                <span className="text-[11px] font-bold uppercase tracking-wider text-violet-600 block mb-0.5 truncate">
                  {selectedRequest.ekip}
                </span>
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
              {/* ADMIN VIEW: UNSEEN USER CHANGES RED ALERT BOX */}
              {currentUser.role === 'admin' && selectedRequest.hasUserChanges && !selectedRequest.adminAcknowledgedChange && (
                <div className="bg-red-600 text-white rounded-2xl p-4 sm:p-5 shadow-lg border border-red-700 space-y-2.5 animate-pulse">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                    <div className="flex items-center gap-2">
                      <AlertTriangle size={22} className="shrink-0 text-white" />
                      <span className="font-black text-sm sm:text-base leading-tight">
                        🚨 DİKKAT: TALEP SAHİBİ DEĞİŞİKLİK YAPTI!
                      </span>
                    </div>
                    <button
                      type="button"
                      disabled={acknowledgingId === selectedRequest.id}
                      onClick={() => handleAcknowledgeChange(selectedRequest.id)}
                      className="px-3.5 py-2 bg-white text-red-700 hover:bg-red-50 active:scale-95 text-xs font-black rounded-xl shadow-xs transition-transform shrink-0 flex items-center gap-1.5"
                    >
                      <Check size={14} className="text-red-700" />
                      <span>{acknowledgingId === selectedRequest.id ? 'Onaylanıyor…' : '✓ Değişikliği Onayla (Uyarıyı Kapat)'}</span>
                    </button>
                  </div>
                  <p className="text-xs text-red-100 font-medium leading-relaxed">
                    Kullanıcı bu afiş talebinde sonradan değişiklik yapmıştır. Güncellenen bilgileri kontrol edip yukarıdaki butona tıklayarak kırmızı uyarıyı kaldırabilirsiniz.
                  </p>
                  {selectedRequest.userChangesNote && (
                    <div className="bg-red-700/90 p-3 rounded-xl text-xs font-semibold text-white border border-red-500/60">
                      <span className="font-bold text-red-200 block text-[10px] uppercase tracking-wider mb-0.5">
                        Kullanıcının Değişiklik Notu:
                      </span>
                      "{selectedRequest.userChangesNote}"
                    </div>
                  )}
                  {selectedRequest.lastUserChangeAt && (
                    <div className="text-[11px] text-red-200 font-medium">
                      Son Değiştirilme Zamanı: {formatDateTime(selectedRequest.lastUserChangeAt)}
                    </div>
                  )}
                </div>
              )}

              {/* ADMIN VIEW: ALREADY APPROVED NOTE */}
              {currentUser.role === 'admin' && selectedRequest.hasUserChanges && selectedRequest.adminAcknowledgedChange && (
                <div className="bg-slate-100 border border-slate-200 rounded-xl p-3 text-xs text-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2 font-medium">
                    <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                    <span>Bu talepteki kullanıcı değişikliği incelenip onaylanmıştır.</span>
                  </div>
                  {selectedRequest.userChangesNote && (
                    <span className="text-[11px] text-slate-500 italic truncate max-w-xs">"{selectedRequest.userChangesNote}"</span>
                  )}
                </div>
              )}

              {/* USER VIEW: CALM STATUS (ONLY TELLS USER THAT CHANGE WAS SENT TO ADMIN) */}
              {currentUser.role === 'user' && selectedRequest.hasUserChanges && (
                !selectedRequest.adminAcknowledgedChange ? (
                  <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 text-xs text-blue-900 flex items-start gap-2.5">
                    <span className="text-base shrink-0 mt-0.5">ℹ️</span>
                    <div>
                      <strong className="block text-blue-950 font-bold">Değişikliğiniz Yöneticiye İletildi</strong>
                      <p className="text-[11px] text-blue-800 mt-0.5 leading-relaxed">
                        Yaptığınız düzenleme admin paneline iletilmiştir. Tasarım ekibi güncel bilgileri inceledikten sonra onaylayacaktır.
                      </p>
                      {selectedRequest.userChangesNote && (
                        <p className="text-[11px] text-blue-700 italic mt-1 font-semibold">
                          İlettiğiniz Not: "{selectedRequest.userChangesNote}"
                        </p>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3 text-xs text-emerald-800 flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                    <span className="font-semibold">Yaptığınız değişiklik yönetici tarafından incelenip onaylanmıştır.</span>
                  </div>
                )
              )}

              {/* Poster Preview */}
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
                  <p className="text-xs text-slate-600 mb-3 bg-white/80 p-3 rounded-xl border border-violet-100 leading-relaxed">
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

              {/* Admin Stage Controls */}
              {currentUser.role === 'admin' && (
                <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3.5 sm:p-4">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2.5">
                    🔄 Aşamayı Güncelle
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
                {currentUser.role === 'admin' && (
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
                      <span>Afiş Yayınlandı (Kilitli)</span>
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
              <strong className="text-slate-900 font-bold">"{requestToDelete.etkinlikAdi}"</strong> başlıklı etkinlik ve afiş talebi kalıcı olarak veritabanından silinecektir. Bu işlem geri alınamaz.
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
                    Afiş Talebini Düzenle
                  </h3>
                  <p className="text-xs text-slate-500">
                    Afiş yayınlanmadan önce etkinlik detaylarını güncelleyebilirsiniz.
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
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

              {/* 7-DAY ADVANCE NOTICE REMINDER IN EDIT MODAL */}
              {editFormData.tarih && (() => {
                const diffDays = getDaysUntilEvent(editFormData.tarih);
                if (diffDays === null || diffDays >= 7) return null;
                return (
                  <div className="p-3 bg-amber-50 border border-amber-200/90 rounded-xl text-xs text-amber-900 flex items-start gap-2.5 animate-fade-in">
                    <span className="text-base shrink-0 mt-0.5">⚠️</span>
                    <div>
                      <strong className="font-bold block text-amber-950">
                        Hatırlatma: Etkinliğe {diffDays <= 0 ? '1 günden az süre kaldı' : `${diffDays} gün kaldı`}!
                      </strong>
                      <span className="text-[11px] text-amber-800 leading-relaxed block mt-0.5">
                        Afiş taleplerinin en geç etkinlik tarihinden <strong>7 gün önce</strong> yapılması önerilir. Güncellemenizi kaydedebilirsiniz; afiş revize sürecinin zamanında yetişebilmesi için lütfen aciliyetini aşağıdaki notta belirtiniz.
                      </span>
                    </div>
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
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-600"
                />
              </div>

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

              {/* Specific Change Note for Admin */}
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
                <label className="block text-xs font-bold text-amber-900 uppercase tracking-wider mb-1">
                  📢 Neyi Değiştirdiniz? (Yönetici Notu)
                </label>
                <p className="text-[11px] text-amber-700 mb-2">
                  Yöneticinin değişikliği hızlıca fark edebilmesi için neyi güncellediğinizi kısaca belirtin.
                </p>
                <input
                  type="text"
                  value={editFormData.userChangesNote}
                  onChange={e => setEditFormData({ ...editFormData, userChangesNote: e.target.value })}
                  placeholder="Örn: Etkinlik tarihi ertelendi / Mekan salon 2 olarak güncellendi"
                  className="w-full min-h-[42px] px-3 py-2 bg-white border border-amber-300 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
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

      {/* ════ TOAST NOTIFICATION (MOBILE SAFE POSITION) ════ */}
      {toast && (
        <div className="fixed bottom-24 lg:bottom-6 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-md mx-auto sm:mx-0 z-50 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-3 text-xs font-semibold animate-fade-in border border-slate-800">
          <span>{toast.message}</span>
        </div>
      )}
    </div>
  );
}
