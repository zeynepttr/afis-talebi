import React, { useState, useEffect, useMemo } from 'react';
import {
  PlannerCard,
  PlannerColumn,
  ContentType,
  ContentStatus,
  CONTENT_TYPE_CONFIG,
  CONTENT_STATUS_CONFIG,
  PosterRequest,
  AppUser
} from './types';
import {
  rtdb,
  rtdbRef,
  rtdbSet,
  rtdbUpdate,
  rtdbOnValue,
  rtdbRemove
} from './firebase';
import {
  Plus,
  Calendar,
  CheckCircle2,
  Circle,
  Trash2,
  MoveRight,
  Filter,
  Download,
  X,
  Edit2,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Layers,
  Sparkles
} from 'lucide-react';

interface PlannerBoardProps {
  currentUser: AppUser;
  requests: PosterRequest[];
  showToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

// ─────────────────────────────────────────────────────────────
// INITIAL SEED DATA
// ─────────────────────────────────────────────────────────────
const INITIAL_COLUMNS: PlannerColumn[] = [
  { id: 'col_pool', title: 'Paylaşılacaklar', isPool: true, order: 0 },
  { id: 'col_1', title: '1.11.2026 - Pazar', date: '2026-11-01', order: 1 },
  { id: 'col_2', title: '2.11.2026 - Pazartesi', date: '2026-11-02', order: 2 },
  { id: 'col_3', title: '3.11.2026 - Çarşamba', date: '2026-11-03', order: 3 }
];

const INITIAL_CARDS: PlannerCard[] = [
  // Paylaşılacaklar
  {
    id: 'card_1',
    columnId: 'col_pool',
    title: 'Gemlik İhh - Afis - Hazır',
    unit: 'Gemlik İhh',
    contentType: 'afis',
    status: 'hazir',
    isCompleted: false,
    order: 0,
    createdAt: Date.now() - 3600000 * 5
  },
  {
    id: 'card_2',
    columnId: 'col_pool',
    title: 'Atom Tanışma - Reels - Hazır',
    unit: 'Atom Tanışma',
    contentType: 'reels',
    status: 'hazir',
    isCompleted: false,
    order: 1,
    createdAt: Date.now() - 3600000 * 4
  },
  // 1.11.2026 - Pazar
  {
    id: 'card_3',
    columnId: 'col_1',
    title: 'Speaking - Afiş - Hazır',
    unit: 'Speaking',
    contentType: 'afis',
    status: 'hazir',
    isCompleted: true, // Üzeri çizili
    order: 0,
    createdAt: Date.now() - 3600000 * 3
  },
  {
    id: 'card_4',
    columnId: 'col_1',
    title: 'Aile Okulu - Afiş - Hazır',
    unit: 'Aile Okulu',
    contentType: 'afis',
    status: 'hazir',
    isCompleted: false,
    order: 1,
    createdAt: Date.now() - 3600000 * 2
  },
  {
    id: 'card_5',
    columnId: 'col_1',
    title: 'Kış çayı - Reels - Hazır',
    unit: 'Kış çayı',
    contentType: 'reels',
    status: 'hazir',
    isCompleted: false,
    order: 2,
    createdAt: Date.now() - 3600000 * 1
  },
  // 2.11.2026 - Pazartesi
  {
    id: 'card_6',
    columnId: 'col_2',
    title: '3D Kalem - Afiş - Hazır',
    unit: '3D Kalem',
    contentType: 'afis',
    status: 'hazir',
    isCompleted: false,
    order: 0,
    createdAt: Date.now() - 3600000 * 3
  },
  {
    id: 'card_7',
    columnId: 'col_2',
    title: 'Bolu - Reels - Hazır',
    unit: 'Bolu',
    contentType: 'reels',
    status: 'hazir',
    isCompleted: false,
    order: 1,
    createdAt: Date.now() - 3600000 * 2
  },
  {
    id: 'card_8',
    columnId: 'col_2',
    title: 'Bolu - Hikaye - Tasarımda',
    unit: 'Bolu',
    contentType: 'hikaye',
    status: 'tasarimda',
    isCompleted: false,
    order: 2,
    createdAt: Date.now() - 3600000 * 1
  },
  // 3.11.2026 - Çarşamba
  {
    id: 'card_9',
    columnId: 'col_3',
    title: 'Genç İhh da Bu hafta - Post - Tasarımda',
    unit: 'Genç İhh da Bu hafta',
    contentType: 'post',
    status: 'tasarimda',
    isCompleted: false,
    order: 0,
    createdAt: Date.now() - 3600000 * 2
  },
  {
    id: 'card_10',
    columnId: 'col_3',
    title: 'Gemlik İhh - Reels - Hazır',
    unit: 'Gemlik İhh',
    contentType: 'reels',
    status: 'hazir',
    isCompleted: false,
    order: 1,
    createdAt: Date.now() - 3600000 * 1
  }
];

export const PlannerBoard: React.FC<PlannerBoardProps> = ({
  currentUser,
  requests,
  showToast
}) => {
  const [columns, setColumns] = useState<PlannerColumn[]>([]);
  const [cards, setCards] = useState<PlannerCard[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [typeFilter, setTypeFilter] = useState<'all' | ContentType>('all');
  const [showOnlyIncomplete, setShowOnlyIncomplete] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Mobile View Mode ('focused' = one day/column at a time full width, 'kanban' = horizontal snap track)
  const [mobileActiveColId, setMobileActiveColId] = useState<string>('col_pool');
  const [mobileViewMode, setMobileViewMode] = useState<'focused' | 'kanban'>('focused');

  // Drag state (Desktop)
  const [draggingCardId, setDraggingCardId] = useState<string | null>(null);
  const [dragOverColId, setDragOverColId] = useState<string | null>(null);

  // Modal: Add / Edit Card
  const [showAddCardModal, setShowAddCardModal] = useState(false);
  const [targetColumnId, setTargetColumnId] = useState<string>('col_pool');
  const [cardTitle, setCardTitle] = useState('');
  const [cardContentType, setCardContentType] = useState<ContentType>('afis');
  const [cardStatus, setCardStatus] = useState<ContentStatus>('hazir');
  const [cardNotes, setCardNotes] = useState('');
  const [editingCard, setEditingCard] = useState<PlannerCard | null>(null);

  // Quick In-line card creation per column
  const [inlineColId, setInlineColId] = useState<string | null>(null);
  const [inlineTitle, setInlineTitle] = useState('');

  // Modal: Add Date Column
  const [showAddColModal, setShowAddColModal] = useState(false);
  const [newColDate, setNewColDate] = useState('');
  const [newColTitle, setNewColTitle] = useState('');

  // Modal: Move card (Mobile friendly Bottom Sheet)
  const [movingCard, setMovingCard] = useState<PlannerCard | null>(null);

  // Modal: Import from Requests
  const [showImportModal, setShowImportModal] = useState(false);

  // ─────────────────────────────────────────────────────────────
  // 1. REALTIME DATABASE SUBSCRIPTION
  // ─────────────────────────────────────────────────────────────
  useEffect(() => {
    const boardRef = rtdbRef(rtdb, 'planner_board');

    const unsubscribe = rtdbOnValue(boardRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        if (data.columns) {
          const colList: PlannerColumn[] = Object.keys(data.columns).map(k => ({
            id: k,
            ...data.columns[k]
          }));
          colList.sort((a, b) => a.order - b.order);
          setColumns(colList);
          // Set active mobile column if current not found
          if (!colList.some(c => c.id === mobileActiveColId)) {
            setMobileActiveColId(colList[0]?.id || 'col_pool');
          }
        } else {
          setColumns(INITIAL_COLUMNS);
        }

        if (data.cards) {
          const cardList: PlannerCard[] = Object.keys(data.cards).map(k => ({
            id: k,
            ...data.cards[k]
          }));
          cardList.sort((a, b) => a.order - b.order);
          setCards(cardList);
        } else {
          setCards(INITIAL_CARDS);
        }
      } else {
        seedInitialData();
      }
      setLoading(false);
    }, (err) => {
      console.warn("RTDB board fetch warning, using defaults:", err);
      setColumns(INITIAL_COLUMNS);
      setCards(INITIAL_CARDS);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const seedInitialData = async () => {
    try {
      const colMap: Record<string, PlannerColumn> = {};
      INITIAL_COLUMNS.forEach(c => { colMap[c.id] = c; });

      const cardMap: Record<string, PlannerCard> = {};
      INITIAL_CARDS.forEach(c => { cardMap[c.id] = c; });

      await rtdbSet(rtdbRef(rtdb, 'planner_board'), {
        columns: colMap,
        cards: cardMap,
        updatedAt: Date.now()
      });
      setColumns(INITIAL_COLUMNS);
      setCards(INITIAL_CARDS);
    } catch (err) {
      console.error("Seed error:", err);
    }
  };

  const handleResetToScreenshot = async () => {
    if (!window.confirm("Tüm panoyu örnek şablon durumuna sıfırlamak istiyor musunuz?")) return;
    try {
      await seedInitialData();
      showToast("Pano örnek şablona sıfırlandı! 📋", "info");
    } catch {
      showToast("Sıfırlanamadı", "error");
    }
  };

  // ─────────────────────────────────────────────────────────────
  // 2. TOGGLE CARD COMPLETION (ÜZERİ ÇİZİLSİN / PAYLAŞILDI)
  // ─────────────────────────────────────────────────────────────
  const handleToggleComplete = async (card: PlannerCard) => {
    const nextState = !card.isCompleted;
    try {
      setCards(prev => prev.map(c => c.id === card.id ? { ...c, isCompleted: nextState } : c));
      await rtdbUpdate(rtdbRef(rtdb, `planner_board/cards/${card.id}`), {
        isCompleted: nextState,
        status: nextState ? 'paylasildi' : (card.status === 'paylasildi' ? 'hazir' : card.status),
        updatedAt: Date.now()
      });
      showToast(nextState ? `"${card.title}" paylaşıldı olarak işaretlendi! ✅` : `Paylaşım işareti kaldırıldı 🔄`, 'success');
    } catch (err) {
      console.error("Toggle error:", err);
      showToast("Durum güncellenemedi", "error");
    }
  };

  // ─────────────────────────────────────────────────────────────
  // 3. MOVE CARD TO COLUMN
  // ─────────────────────────────────────────────────────────────
  const handleMoveCard = async (cardId: string, destColId: string) => {
    const targetCard = cards.find(c => c.id === cardId);
    if (!targetCard || targetCard.columnId === destColId) return;

    try {
      setCards(prev => prev.map(c => c.id === cardId ? { ...c, columnId: destColId } : c));
      await rtdbUpdate(rtdbRef(rtdb, `planner_board/cards/${cardId}`), {
        columnId: destColId,
        updatedAt: Date.now()
      });
      const destCol = columns.find(c => c.id === destColId);
      showToast(`Kart "${destCol?.title}" listesine taşındı 📌`, 'info');
    } catch (err) {
      console.error("Move error:", err);
      showToast("Taşınamadı", "error");
    }
  };

  // Drag & Drop handlers (Desktop)
  const onDragStart = (e: React.DragEvent, cardId: string) => {
    e.dataTransfer.setData('text/plain', cardId);
    setDraggingCardId(cardId);
  };

  const onDragOver = (e: React.DragEvent, colId: string) => {
    e.preventDefault();
    if (dragOverColId !== colId) {
      setDragOverColId(colId);
    }
  };

  const onDragLeave = () => {
    setDragOverColId(null);
  };

  const onDrop = (e: React.DragEvent, destColId: string) => {
    e.preventDefault();
    setDragOverColId(null);
    const cardId = e.dataTransfer.getData('text/plain') || draggingCardId;
    if (cardId) {
      handleMoveCard(cardId, destColId);
    }
    setDraggingCardId(null);
  };

  // ─────────────────────────────────────────────────────────────
  // 4. CREATE / EDIT CARD
  // ─────────────────────────────────────────────────────────────
  const handleSaveCard = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanTitle = cardTitle.trim();
    if (!cleanTitle) return;

    try {
      if (editingCard) {
        const updates: Partial<PlannerCard> = {
          title: cleanTitle,
          contentType: cardContentType,
          status: cardStatus,
          notes: cardNotes.trim(),
          columnId: targetColumnId,
          updatedAt: Date.now()
        };
        await rtdbUpdate(rtdbRef(rtdb, `planner_board/cards/${editingCard.id}`), updates);
        setCards(prev => prev.map(c => c.id === editingCard.id ? { ...c, ...updates } : c));
        showToast("Kart güncellendi! ✨", "success");
      } else {
        const newId = `card_${Date.now()}`;
        const newCard: PlannerCard = {
          id: newId,
          title: cleanTitle,
          contentType: cardContentType,
          status: cardStatus,
          notes: cardNotes.trim(),
          columnId: targetColumnId,
          isCompleted: false,
          order: cards.filter(c => c.columnId === targetColumnId).length,
          createdAt: Date.now()
        };
        await rtdbSet(rtdbRef(rtdb, `planner_board/cards/${newId}`), newCard);
        setCards(prev => [...prev, newCard]);
        showToast("Yeni kart eklendi! 📋", "success");
      }

      setShowAddCardModal(false);
      setEditingCard(null);
      setCardTitle('');
      setCardNotes('');
    } catch (err: any) {
      console.error("Save card error:", err);
      showToast("Kart kaydedilemedi: " + err.message, "error");
    }
  };

  const handleQuickInlineAdd = async (colId: string) => {
    const clean = inlineTitle.trim();
    if (!clean) {
      setInlineColId(null);
      return;
    }

    let autoType: ContentType = 'afis';
    const lower = clean.toLowerCase();
    if (lower.includes('reels') || lower.includes('video')) autoType = 'reels';
    else if (lower.includes('hikaye') || lower.includes('story')) autoType = 'hikaye';
    else if (lower.includes('post') || lower.includes('gönderi')) autoType = 'post';
    else if (lower.includes('kaydırmalı') || lower.includes('carousel')) autoType = 'carousel';
    else if (lower.includes('duyuru')) autoType = 'duyuru';

    let autoStatus: ContentStatus = 'hazir';
    if (lower.includes('tasarımda') || lower.includes('tasarimda')) autoStatus = 'tasarimda';
    else if (lower.includes('metin') || lower.includes('yazı')) autoStatus = 'metin-bekliyor';

    const newId = `card_${Date.now()}`;
    const newCard: PlannerCard = {
      id: newId,
      title: clean,
      contentType: autoType,
      status: autoStatus,
      columnId: colId,
      isCompleted: false,
      order: cards.filter(c => c.columnId === colId).length,
      createdAt: Date.now()
    };

    try {
      setCards(prev => [...prev, newCard]);
      await rtdbSet(rtdbRef(rtdb, `planner_board/cards/${newId}`), newCard);
      setInlineTitle('');
      setInlineColId(null);
      showToast("Kart eklendi! ➕", "success");
    } catch {
      showToast("Eklenemedi", "error");
    }
  };

  const handleDeleteCard = async (cardId: string) => {
    if (!window.confirm("Bu kartı silmek istediğinize emin misiniz?")) return;
    try {
      setCards(prev => prev.filter(c => c.id !== cardId));
      await rtdbRemove(rtdbRef(rtdb, `planner_board/cards/${cardId}`));
      showToast("Kart silindi 🗑️", "info");
    } catch {
      showToast("Kart silinemedi", "error");
    }
  };

  // ─────────────────────────────────────────────────────────────
  // 5. CREATE DATE COLUMN / LIST
  // ─────────────────────────────────────────────────────────────
  const handleAddColumn = async (e: React.FormEvent) => {
    e.preventDefault();
    let colTitle = newColTitle.trim();

    if (!colTitle && newColDate) {
      try {
        const [y, m, d] = newColDate.split('-');
        const dateObj = new Date(parseInt(y), parseInt(m) - 1, parseInt(d));
        const dayNames = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
        const dayName = dayNames[dateObj.getDay()];
        colTitle = `${parseInt(d)}.${parseInt(m)}.${y} - ${dayName}`;
      } catch {
        colTitle = newColDate;
      }
    }

    if (!colTitle) return;

    const newColId = `col_${Date.now()}`;
    const newCol: PlannerColumn = {
      id: newColId,
      title: colTitle,
      date: newColDate || undefined,
      order: columns.length
    };

    try {
      setColumns(prev => [...prev, newCol]);
      await rtdbSet(rtdbRef(rtdb, `planner_board/columns/${newColId}`), newCol);
      setMobileActiveColId(newColId);
      setShowAddColModal(false);
      setNewColDate('');
      setNewColTitle('');
      showToast(`"${colTitle}" listesi eklendi! 📅`, "success");
    } catch (err: any) {
      showToast("Liste eklenemedi: " + err.message, "error");
    }
  };

  const handleDeleteColumn = async (colId: string) => {
    if (colId === 'col_pool') {
      showToast("Ana 'Paylaşılacaklar' havuzu silinemez.", "error");
      return;
    }
    const cardsInCol = cards.filter(c => c.columnId === colId);
    if (!window.confirm(`Bu listeyi silmek istediğinize emin misiniz? (${cardsInCol.length} kart havuza taşınacak)`)) return;

    try {
      for (const c of cardsInCol) {
        await rtdbUpdate(rtdbRef(rtdb, `planner_board/cards/${c.id}`), { columnId: 'col_pool' });
      }
      setCards(prev => prev.map(c => c.columnId === colId ? { ...c, columnId: 'col_pool' } : c));
      setColumns(prev => prev.filter(c => c.id !== colId));
      await rtdbRemove(rtdbRef(rtdb, `planner_board/columns/${colId}`));
      setMobileActiveColId('col_pool');
      showToast("Liste silindi ve kartlar havuza aktarıldı 🗑️", "info");
    } catch {
      showToast("Silinemedi", "error");
    }
  };

  // ─────────────────────────────────────────────────────────────
  // 6. IMPORT READY POSTER REQUESTS TO POOL
  // ─────────────────────────────────────────────────────────────
  const handleImportRequestToPool = async (req: PosterRequest) => {
    const titleText = `${req.etkinlikAdi} - Afiş - ${req.status === 'yayinlandi' ? 'Hazır' : 'Tasarımda'}`;
    const newId = `card_req_${req.id}_${Date.now()}`;

    const newCard: PlannerCard = {
      id: newId,
      title: titleText,
      unit: req.ekip || req.etkinlikAdi,
      contentType: 'afis',
      status: req.status === 'yayinlandi' ? 'hazir' : 'tasarimda',
      isCompleted: false,
      columnId: 'col_pool',
      sourceRequestId: req.id,
      notes: `${req.tarih ? `Tarih: ${req.tarih} ${req.saat || ''}` : ''} Mekan: ${req.mekan || ''}`,
      order: cards.filter(c => c.columnId === 'col_pool').length,
      createdAt: Date.now()
    };

    try {
      setCards(prev => [...prev, newCard]);
      await rtdbSet(rtdbRef(rtdb, `planner_board/cards/${newId}`), newCard);
      showToast(`"${req.etkinlikAdi}" Paylaşılacaklar havuzuna eklendi! 📥`, 'success');
    } catch {
      showToast("Aktarılamadı", "error");
    }
  };

  // ─────────────────────────────────────────────────────────────
  // 7. FILTERED CARDS & STATS
  // ─────────────────────────────────────────────────────────────
  const filteredCards = useMemo(() => {
    return cards.filter(c => {
      if (typeFilter !== 'all' && c.contentType !== typeFilter) return false;
      if (showOnlyIncomplete && c.isCompleted) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return c.title.toLowerCase().includes(q) || (c.unit && c.unit.toLowerCase().includes(q));
      }
      return true;
    });
  }, [cards, typeFilter, showOnlyIncomplete, searchQuery]);

  const poolCount = cards.filter(c => c.columnId === 'col_pool').length;
  const completedCount = cards.filter(c => c.isCompleted).length;
  const totalCount = cards.length;

  const activeMobileCol = useMemo(() => {
    return columns.find(c => c.id === mobileActiveColId) || columns[0] || INITIAL_COLUMNS[0];
  }, [columns, mobileActiveColId]);

  const activeMobileColIndex = useMemo(() => {
    return columns.findIndex(c => c.id === activeMobileCol?.id);
  }, [columns, activeMobileCol]);

  // ─────────────────────────────────────────────────────────────
  // 8. REUSABLE COLUMN RENDERER (SHARED FOR MOBILE FOCUSED & KANBAN)
  // ─────────────────────────────────────────────────────────────
  const renderSingleColumn = (col: PlannerColumn, isMobileFullWidth = false) => {
    const isPool = col.isPool;
    const colCards = filteredCards.filter(c => c.columnId === col.id);
    const isDragTarget = dragOverColId === col.id;

    return (
      <div
        id={`kanban_col_${col.id}`}
        key={col.id}
        onDragOver={(e) => onDragOver(e, col.id)}
        onDragLeave={onDragLeave}
        onDrop={(e) => onDrop(e, col.id)}
        className={`${
          isMobileFullWidth
            ? 'w-full'
            : 'w-[85vw] max-w-[340px] shrink-0 snap-center sm:w-80 sm:shrink-0'
        } rounded-2xl flex flex-col transition-all border ${
          isPool
            ? 'bg-gradient-to-b from-violet-50/80 to-indigo-50/50 border-violet-200 shadow-xs ring-1 ring-violet-200/60'
            : 'bg-slate-50/90 text-slate-800 border-slate-200/80 shadow-2xs'
        } ${isDragTarget ? 'ring-2 ring-violet-500 scale-[1.01]' : ''}`}
      >
        {/* Column Header */}
        <div
          className={`p-3.5 flex items-center justify-between border-b ${
            isPool
              ? 'border-violet-100 text-violet-950'
              : 'border-slate-200/80 text-slate-900'
          }`}
        >
          <div className="flex items-center gap-2 min-w-0">
            {isPool ? (
              <span className="w-2.5 h-2.5 rounded-full bg-violet-600 animate-pulse shrink-0" />
            ) : (
              <Calendar size={15} className="text-violet-600 shrink-0" />
            )}
            <h3 className="font-extrabold text-xs sm:text-sm truncate text-slate-900">
              {col.title}
            </h3>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <span
              className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                isPool
                  ? 'bg-violet-100 text-violet-700 border border-violet-200'
                  : 'bg-white text-slate-700 border border-slate-200'
              }`}
            >
              {colCards.length}
            </span>

            {!isPool && (
              <button
                type="button"
                onClick={() => handleDeleteColumn(col.id)}
                className="p-1.5 text-slate-400 hover:text-red-600 transition-colors rounded-lg hover:bg-slate-200/80 min-w-[32px] min-h-[32px] flex items-center justify-center"
                title="Kolonu Sil (İçindeki kartlar havuza taşınır)"
              >
                <Trash2 size={13} />
              </button>
            )}
          </div>
        </div>

        {/* PROMINENT "PAYLAŞILACAK İÇERİK EKLE" BANNER FOR POOL */}
        {isPool && (
          <div className="p-3 border-b border-violet-100 bg-violet-100/50">
            <button
              type="button"
              onClick={() => {
                setTargetColumnId('col_pool');
                setEditingCard(null);
                setCardTitle('');
                setCardNotes('');
                setCardContentType('afis');
                setCardStatus('hazir');
                setShowAddCardModal(true);
              }}
              className="w-full min-h-[44px] py-2.5 px-3 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-violet-200 flex items-center justify-center gap-1.5 active:scale-95"
            >
              <Plus size={16} />
              <span>+ Paylaşılacak İçerik Ekle</span>
            </button>
            <p className="text-[10px] text-violet-700/80 text-center mt-1.5 font-medium">
              Planlanacak içerikleri buraya ekleyip günlere çekebilirsiniz.
            </p>
          </div>
        )}

        {/* Cards List Container */}
        <div className={`p-2.5 space-y-2.5 overflow-y-auto flex-1 ${isMobileFullWidth ? 'min-h-[160px]' : 'min-h-[140px]'}`}>
          {colCards.length === 0 ? (
            <div
              className={`py-8 text-center text-xs rounded-xl border border-dashed flex flex-col items-center justify-center gap-1.5 ${
                isPool
                  ? 'border-violet-200 text-violet-400 bg-white/50'
                  : 'border-slate-300 text-slate-400 bg-white/50'
              }`}
            >
              <span className="text-base">📌</span>
              <span>Bu gün için planlanan içerik yok</span>
              <span className="text-[10px] opacity-75">Kart sürükleyebilir veya ekleyebilirsiniz</span>
            </div>
          ) : (
            colCards.map((card) => {
              const typeCfg = CONTENT_TYPE_CONFIG[card.contentType] || CONTENT_TYPE_CONFIG.afis;
              const statusCfg = CONTENT_STATUS_CONFIG[card.status] || CONTENT_STATUS_CONFIG.hazir;
              const isCompleted = Boolean(card.isCompleted);

              return (
                <div
                  key={card.id}
                  draggable
                  onDragStart={(e) => onDragStart(e, card.id)}
                  className={`group rounded-xl p-3 transition-all relative border cursor-grab active:cursor-grabbing shadow-2xs ${
                    isCompleted
                      ? 'bg-emerald-50/70 border-emerald-200 text-slate-600'
                      : 'bg-white hover:bg-slate-50/80 border-slate-200/90 hover:border-violet-300 text-slate-900 shadow-xs'
                  }`}
                >
                  {/* Card Content Row */}
                  <div className="flex items-start gap-2">
                    {/* Checkmark Button (Üzeri Çizilme & Tamamlanma Tetikleyicisi) - Enlarged Tap Target */}
                    <button
                      type="button"
                      onClick={() => handleToggleComplete(card)}
                      className={`-ml-1.5 -mt-1 p-2 rounded-xl transition-transform active:scale-90 shrink-0 min-w-[40px] min-h-[40px] flex items-center justify-center ${
                        isCompleted
                          ? 'text-emerald-600 hover:text-emerald-700'
                          : 'text-slate-300 hover:text-emerald-600'
                      }`}
                      title={isCompleted ? "Tamamlandı (Paylaşıldı) - Tekrar tıkla ve geri al" : "Paylaşıldı olarak işaretle (üzeri çizilir)"}
                      aria-label="Tamamlandı olarak işaretle"
                    >
                      {isCompleted ? (
                        <CheckCircle2 size={20} className="fill-emerald-100 text-emerald-600" />
                      ) : (
                        <Circle size={20} />
                      )}
                    </button>

                    {/* Card Title & Strikethrough Logic */}
                    <div className="flex-1 min-w-0 pt-0.5">
                      <p
                        className={`text-xs sm:text-sm leading-snug transition-all ${
                          isCompleted
                            ? 'line-through text-slate-400 italic font-medium'
                            : 'text-slate-800 font-semibold'
                        }`}
                      >
                        {isCompleted && <span className="inline-block mr-1 not-italic">🟢</span>}
                        {card.title}
                      </p>

                      {card.notes && (
                        <p className="text-[10px] mt-1 text-slate-500 line-clamp-2 leading-relaxed">
                          {card.notes}
                        </p>
                      )}

                      {/* Badges: Content Type & Status */}
                      <div className="flex flex-wrap items-center gap-1.5 mt-2">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold border ${typeCfg.badgeBg}`}
                        >
                          <span>{typeCfg.icon}</span>
                          <span>{typeCfg.label}</span>
                        </span>

                        <span
                          className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-bold border ${
                            isCompleted
                              ? 'bg-emerald-600 text-white border-emerald-700'
                              : statusCfg.badgeBg
                          }`}
                        >
                          <span>{isCompleted ? '✓ Paylaşıldı' : statusCfg.label}</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Quick Actions (Large Touch Friendly) */}
                  <div className="flex items-center justify-between gap-1 pt-2 mt-2.5 border-t border-slate-100">
                    {/* Mobile move button */}
                    <button
                      type="button"
                      onClick={() => setMovingCard(card)}
                      className="min-h-[36px] text-xs font-bold px-3 py-1.5 rounded-xl border bg-slate-50 hover:bg-violet-50 hover:border-violet-200 text-slate-700 transition-all flex items-center gap-1.5 active:scale-95 shadow-2xs"
                      title="Başka bir güne veya havuza taşı"
                    >
                      <MoveRight size={13} className="text-violet-600" />
                      <span>Taşı</span>
                    </button>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingCard(card);
                          setCardTitle(card.title);
                          setCardContentType(card.contentType);
                          setCardStatus(card.status);
                          setCardNotes(card.notes || '');
                          setTargetColumnId(card.columnId);
                          setShowAddCardModal(true);
                        }}
                        className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors min-w-[36px] min-h-[36px] flex items-center justify-center active:scale-95"
                        title="Kartı Düzenle"
                      >
                        <Edit2 size={13} />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteCard(card.id)}
                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors min-w-[36px] min-h-[36px] flex items-center justify-center active:scale-95"
                        title="Kartı Sil"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Inline Add Card Button / Input at Bottom of Column */}
        <div className="p-2.5 border-t border-slate-200/80 bg-white/60 rounded-b-2xl">
          {inlineColId === col.id ? (
            <div className="space-y-2 animate-scale-in">
              <input
                type="text"
                autoFocus
                value={inlineTitle}
                onChange={e => setInlineTitle(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') handleQuickInlineAdd(col.id);
                  if (e.key === 'Escape') setInlineColId(null);
                }}
                placeholder="Örn: Bolu - Reels - Hazır"
                className="w-full min-h-[44px] px-3.5 py-2 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 bg-white text-slate-900 border border-violet-400 focus:ring-violet-500/20"
              />
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleQuickInlineAdd(col.id)}
                  className="flex-1 min-h-[38px] py-2 px-3 bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold rounded-xl transition-all shadow-xs"
                >
                  Ekle
                </button>
                <button
                  type="button"
                  onClick={() => setInlineColId(null)}
                  className="min-h-[38px] py-2 px-3 text-xs text-slate-500 hover:text-slate-800 rounded-xl hover:bg-slate-100"
                >
                  İptal
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => {
                setInlineColId(col.id);
                setInlineTitle('');
              }}
              className="w-full min-h-[40px] py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-start gap-1.5 text-slate-600 hover:bg-slate-200/70 hover:text-slate-900 active:scale-98"
            >
              <Plus size={15} className="text-violet-600" />
              <span>+ Kart Ekle</span>
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="w-full flex flex-col bg-white border border-slate-200/80 rounded-2xl sm:rounded-3xl shadow-sm p-3.5 sm:p-6 lg:p-7 text-slate-800 select-none">
      {/* ════ BOARD HEADER ════ */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3.5 mb-4 sm:mb-5 pb-4 sm:pb-5 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-600 text-white flex items-center justify-center text-xl shadow-md shadow-violet-200 shrink-0">
            📅
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base sm:text-xl font-black text-slate-900 tracking-tight truncate">
                İçerik &amp; Sosyal Medya Planlama
              </h2>
              <span className="px-2 py-0.5 rounded-full bg-violet-50 text-violet-700 border border-violet-200 text-[10px] font-bold shrink-0">
                Yayın Takvimi
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5 truncate sm:whitespace-normal">
              Paylaşılacaklar havuzundan günlere sürükleyin, afiş, reels ve hikayeleri planlayın.
            </p>
          </div>
        </div>

        {/* Action Controls (Responsive on Mobile) */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Quick Stats Pill */}
          <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 rounded-xl border border-slate-200 text-xs w-full sm:w-auto justify-between sm:justify-start">
            <span className="text-violet-700 font-bold">📦 Havuz: {poolCount}</span>
            <span className="text-slate-300">•</span>
            <span className="text-emerald-700 font-bold">✓ Paylaşılan: {completedCount} / {totalCount}</span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {/* Import from Requests Button */}
            <button
              type="button"
              onClick={() => setShowImportModal(true)}
              className="flex-1 sm:flex-initial min-h-[40px] px-3.5 py-1.5 bg-white hover:bg-slate-50 active:scale-95 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 transition-all flex items-center justify-center gap-1.5 shadow-2xs"
              title="Afiş ve Form taleplerinden içerik çek"
            >
              <Download size={14} className="text-violet-600" />
              <span>Taleplerden Aktar</span>
            </button>

            {/* Add Date Column Button */}
            <button
              type="button"
              onClick={() => {
                setNewColTitle('');
                setNewColDate('');
                setShowAddColModal(true);
              }}
              className="flex-1 sm:flex-initial min-h-[40px] px-4 py-1.5 bg-violet-600 hover:bg-violet-700 active:scale-95 text-white text-xs font-bold rounded-xl shadow-md shadow-violet-200 hover:shadow-violet-300 transition-all flex items-center justify-center gap-1.5"
            >
              <Calendar size={14} />
              <span>+ Gün Ekle</span>
            </button>

            {/* Reset Template Button */}
            <button
              type="button"
              onClick={handleResetToScreenshot}
              className="min-h-[40px] min-w-[40px] p-2 bg-slate-50 hover:bg-slate-100 active:scale-95 text-slate-400 hover:text-slate-700 text-xs rounded-xl border border-slate-200 transition-all flex items-center justify-center shrink-0"
              title="Örnek planlama kartlarını sıfırla / yeniden yükle"
            >
              <RefreshCw size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* ════ FILTER BAR ════ */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 mb-4">
        {/* Type Badges Filter (Horizontal Scroll on Mobile) */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 no-scrollbar -mx-1 px-1">
          <span className="text-slate-400 text-[11px] font-bold mr-1 flex items-center gap-1 shrink-0">
            <Filter size={12} /> Filtre:
          </span>
          <button
            type="button"
            onClick={() => setTypeFilter('all')}
            className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all shrink-0 ${
              typeFilter === 'all'
                ? 'bg-violet-600 text-white shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200/80 text-slate-600'
            }`}
          >
            Tümü ({cards.length})
          </button>
          {(['afis', 'reels', 'hikaye', 'post'] as ContentType[]).map(t => {
            const cfg = CONTENT_TYPE_CONFIG[t];
            const count = cards.filter(c => c.contentType === t).length;
            return (
              <button
                key={t}
                type="button"
                onClick={() => setTypeFilter(t)}
                className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all flex items-center gap-1.5 shrink-0 ${
                  typeFilter === t
                    ? 'bg-violet-600 text-white shadow-xs'
                    : 'bg-slate-100 hover:bg-slate-200/80 text-slate-600'
                }`}
              >
                <span>{cfg.icon}</span>
                <span>{cfg.label}</span>
                <span className="text-[10px] opacity-75">({count})</span>
              </button>
            );
          })}
        </div>

        {/* Only Incomplete Checkbox */}
        <div className="flex items-center justify-end">
          <label className="flex items-center gap-1.5 text-xs text-slate-600 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={showOnlyIncomplete}
              onChange={e => setShowOnlyIncomplete(e.target.checked)}
              className="rounded text-violet-600 focus:ring-0"
            />
            <span className="font-semibold">Yalnızca Bekleyenler</span>
          </label>
        </div>
      </div>

      {/* ════ MOBILE DAY SELECTOR STRIP (< sm) ════ */}
      <div className="sm:hidden mb-3.5 bg-slate-50 p-2.5 rounded-2xl border border-slate-200/70">
        <div className="flex items-center justify-between gap-2 mb-2 px-0.5">
          <span className="text-[11px] font-black text-slate-600 uppercase tracking-wider flex items-center gap-1">
            <span>📅</span> Gün Seçici:
          </span>
          {/* Mobile View Mode Switcher */}
          <div className="flex items-center bg-white p-0.5 rounded-lg border border-slate-200 shadow-2xs">
            <button
              type="button"
              onClick={() => setMobileViewMode('focused')}
              className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition-all ${
                mobileViewMode === 'focused'
                  ? 'bg-violet-600 text-white shadow-2xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              📱 Tek Gün
            </button>
            <button
              type="button"
              onClick={() => setMobileViewMode('kanban')}
              className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition-all ${
                mobileViewMode === 'kanban'
                  ? 'bg-violet-600 text-white shadow-2xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              ↔️ Tüm Pano
            </button>
          </div>
        </div>

        {/* Horizontal Scrolling Pill Strip */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          {columns.map(col => {
            const isSelected = mobileActiveColId === col.id;
            const count = filteredCards.filter(c => c.columnId === col.id).length;
            return (
              <button
                key={col.id}
                type="button"
                onClick={() => {
                  setMobileActiveColId(col.id);
                  if (mobileViewMode === 'kanban') {
                    const el = document.getElementById(`kanban_col_${col.id}`);
                    el?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
                  }
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 shrink-0 active:scale-95 ${
                  isSelected
                    ? 'bg-violet-600 text-white shadow-xs'
                    : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200/80'
                }`}
              >
                {col.isPool ? (
                  <span>📦 Havuz</span>
                ) : (
                  <span>📅 {col.title.split(' - ')[0] || col.title}</span>
                )}
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${
                  isSelected ? 'bg-white/25 text-white' : 'bg-slate-100 text-slate-600'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}

          <button
            type="button"
            onClick={() => {
              setNewColTitle('');
              setNewColDate('');
              setShowAddColModal(true);
            }}
            className="px-2.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1 shrink-0 bg-violet-50 hover:bg-violet-100 text-violet-700 border border-violet-200 active:scale-95"
          >
            <Plus size={13} />
            <span>Gün Ekle</span>
          </button>
        </div>
      </div>

      {/* ════ MOBILE SINGLE COLUMN FOCUSED VIEW (< sm) ════ */}
      {mobileViewMode === 'focused' && (
        <div className="sm:hidden mb-4">
          <div className="flex items-center justify-between gap-2 pb-2.5 mb-2.5 border-b border-slate-100">
            <button
              type="button"
              disabled={activeMobileColIndex <= 0}
              onClick={() => {
                if (activeMobileColIndex > 0) {
                  setMobileActiveColId(columns[activeMobileColIndex - 1].id);
                }
              }}
              className="min-h-[36px] px-2.5 py-1 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-30 disabled:pointer-events-none flex items-center gap-1 active:scale-95"
            >
              <ChevronLeft size={15} />
              <span>Önceki Gün</span>
            </button>

            <span className="text-xs font-black text-slate-800 truncate px-1 text-center">
              {activeMobileCol?.title}
            </span>

            <button
              type="button"
              disabled={activeMobileColIndex >= columns.length - 1}
              onClick={() => {
                if (activeMobileColIndex < columns.length - 1) {
                  setMobileActiveColId(columns[activeMobileColIndex + 1].id);
                }
              }}
              className="min-h-[36px] px-2.5 py-1 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-30 disabled:pointer-events-none flex items-center gap-1 active:scale-95"
            >
              <span>Sonraki Gün</span>
              <ChevronRight size={15} />
            </button>
          </div>

          {activeMobileCol && renderSingleColumn(activeMobileCol, true)}
        </div>
      )}

      {/* ════ HORIZONTAL KANBAN TRACK (DESKTOP & MOBILE KANBAN MODE) ════ */}
      <div
        className={`${
          mobileViewMode === 'focused' ? 'hidden sm:block' : 'block'
        } overflow-x-auto pb-4 pt-1 snap-x snap-mandatory sm:snap-none -webkit-overflow-scrolling-touch`}
      >
        <div className="flex gap-3 sm:gap-4 items-start min-w-max pb-2">
          {columns.map((col) => renderSingleColumn(col, false))}

          {/* "+ Yeni Gün / Liste Ekle" Column Button */}
          <div className="w-[85vw] max-w-[340px] shrink-0 snap-center sm:w-80 sm:shrink-0">
            <button
              type="button"
              onClick={() => {
                setNewColTitle('');
                setNewColDate('');
                setShowAddColModal(true);
              }}
              className="w-full min-h-[58px] p-4 bg-slate-50 hover:bg-slate-100 active:scale-98 text-slate-600 hover:text-slate-900 rounded-2xl text-xs font-bold transition-all flex items-center justify-center gap-2 border-2 border-dashed border-slate-200 hover:border-violet-300"
            >
              <Plus size={16} className="text-violet-600" />
              <span>+ Yeni Gün / Liste Ekle</span>
            </button>
          </div>
        </div>
      </div>

      {/* ════ MODAL: ADD / EDIT CARD (MOBILE BOTTOM SHEET & DESKTOP DIALOG) ════ */}
      {showAddCardModal && (
        <div
          onClick={() => setShowAddCardModal(false)}
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-y-auto"
        >
          <div
            onClick={e => e.stopPropagation()}
            className="bg-white rounded-t-3xl sm:rounded-3xl max-w-md w-full p-5 sm:p-6 shadow-2xl border border-slate-200 animate-sheet-up sm:animate-scale-in text-slate-800 max-h-[92vh] flex flex-col"
          >
            {/* Mobile Drag Indicator */}
            <div className="w-12 h-1.5 bg-slate-300 rounded-full mx-auto mb-2.5 sm:hidden shrink-0" />

            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100 shrink-0">
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <span>{editingCard ? '✏️ Kartı Düzenle' : '➕ Yeni Planlama Kartı Ekle'}</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowAddCardModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center min-w-[36px] min-h-[36px]"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveCard} className="space-y-3.5 overflow-y-auto flex-1 pr-1 pb-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  İçerik Başlığı <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={cardTitle}
                  onChange={e => setCardTitle(e.target.value)}
                  placeholder="Örn: Speaking - Afiş - Hazır"
                  className="w-full min-h-[44px] px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-600"
                />
              </div>

              {/* Target Column */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Ekleneceği Kolon / Tarih <span className="text-red-500">*</span>
                </label>
                <select
                  value={targetColumnId}
                  onChange={e => setTargetColumnId(e.target.value)}
                  className="w-full min-h-[44px] px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-600"
                >
                  {columns.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.title} {c.isPool ? '(İçerik Havuzu)' : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Content Type Picker */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  İçerik Türü <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['afis', 'reels', 'hikaye', 'post', 'carousel', 'duyuru'] as ContentType[]).map(t => {
                    const cfg = CONTENT_TYPE_CONFIG[t];
                    const isSelected = cardContentType === t;
                    return (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setCardContentType(t)}
                        className={`min-h-[50px] p-2 rounded-xl border text-xs font-bold flex flex-col items-center justify-center gap-1 transition-all active:scale-95 ${
                          isSelected
                            ? 'bg-violet-600 text-white border-violet-600 shadow-md shadow-violet-200'
                            : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                        }`}
                      >
                        <span className="text-base">{cfg.icon}</span>
                        <span className="text-[11px]">{cfg.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Status Picker */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Hazırlık Durumu
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['hazir', 'tasarimda', 'metin-bekliyor'] as ContentStatus[]).map(s => {
                    const cfg = CONTENT_STATUS_CONFIG[s];
                    const isSelected = cardStatus === s;
                    return (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setCardStatus(s)}
                        className={`min-h-[44px] p-2 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all active:scale-95 ${
                          isSelected
                            ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                            : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                        }`}
                      >
                        <span>{cfg.icon}</span>
                        <span>{cfg.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Özel Not / Açıklama (İsteğe Bağlı)
                </label>
                <textarea
                  rows={2}
                  value={cardNotes}
                  onChange={e => setCardNotes(e.target.value)}
                  placeholder="Yayın saati, etiketler veya detaylar…"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-600"
                />
              </div>

              <div className="pt-2 flex items-center gap-2 shrink-0 pb-safe">
                <button
                  type="button"
                  onClick={() => setShowAddCardModal(false)}
                  className="flex-1 min-h-[44px] py-2 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors"
                >
                  Vazgeç
                </button>
                <button
                  type="submit"
                  className="flex-1 min-h-[44px] py-2 px-4 bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold rounded-xl shadow-md shadow-violet-200 transition-all active:scale-95"
                >
                  {editingCard ? 'Değişiklikleri Kaydet' : 'Kartı Ekle'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ════ MODAL: ADD DATE COLUMN ════ */}
      {showAddColModal && (
        <div
          onClick={() => setShowAddColModal(false)}
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-y-auto"
        >
          <div
            onClick={e => e.stopPropagation()}
            className="bg-white rounded-t-3xl sm:rounded-3xl max-w-sm w-full p-5 sm:p-6 shadow-2xl border border-slate-200 animate-sheet-up sm:animate-scale-in text-slate-800"
          >
            {/* Mobile Drag Indicator */}
            <div className="w-12 h-1.5 bg-slate-300 rounded-full mx-auto mb-2.5 sm:hidden shrink-0" />

            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <Calendar size={18} className="text-violet-600" />
                <span>Yeni Gün / Tarih Kolonu</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowAddColModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center min-w-[36px] min-h-[36px]"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleAddColumn} className="space-y-4 pb-safe">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Tarih Seçin (Otomatik Gün Adı Eklenir)
                </label>
                <input
                  type="date"
                  value={newColDate}
                  onChange={e => setNewColDate(e.target.value)}
                  className="w-full min-h-[44px] px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Veya Özel Liste Başlığı Yazın
                </label>
                <input
                  type="text"
                  value={newColTitle}
                  onChange={e => setNewColTitle(e.target.value)}
                  placeholder="Örn: 4.11.2026 - Perşembe veya Gelecek Hafta"
                  className="w-full min-h-[44px] px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-600"
                />
              </div>

              <div className="pt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddColModal(false)}
                  className="flex-1 min-h-[44px] py-2 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="flex-1 min-h-[44px] py-2 px-4 bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold rounded-xl shadow-md shadow-violet-200 transition-all active:scale-95"
                >
                  Kolonu Ekle
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ════ MODAL: QUICK MOVE (MOBILE BOTTOM SHEET) ════ */}
      {movingCard && (
        <div
          onClick={() => setMovingCard(null)}
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-y-auto"
        >
          <div
            onClick={e => e.stopPropagation()}
            className="bg-white rounded-t-3xl sm:rounded-3xl max-w-sm w-full p-5 sm:p-6 shadow-2xl border border-slate-200 animate-sheet-up sm:animate-scale-in text-slate-800 flex flex-col max-h-[85vh]"
          >
            {/* Mobile Drag Indicator */}
            <div className="w-12 h-1.5 bg-slate-300 rounded-full mx-auto mb-2.5 sm:hidden shrink-0" />

            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100 shrink-0">
              <h3 className="text-sm font-black text-slate-900 truncate pr-2">
                "{movingCard.title}" Taşı
              </h3>
              <button
                type="button"
                onClick={() => setMovingCard(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center min-w-[36px] min-h-[36px] shrink-0"
              >
                <X size={16} />
              </button>
            </div>

            <p className="text-xs text-slate-500 mb-3 shrink-0">
              Taşımak istediğiniz hedef günü veya havuzu seçin:
            </p>

            <div className="space-y-2 overflow-y-auto flex-1 pr-0.5 pb-safe">
              {columns.map(c => {
                const isCurrent = movingCard.columnId === c.id;
                return (
                  <button
                    key={c.id}
                    type="button"
                    disabled={isCurrent}
                    onClick={() => {
                      handleMoveCard(movingCard.id, c.id);
                      setMovingCard(null);
                    }}
                    className={`w-full min-h-[48px] p-3 rounded-xl border text-left text-xs font-bold transition-all flex items-center justify-between ${
                      isCurrent
                        ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-default'
                        : 'bg-slate-50 hover:bg-violet-50 hover:border-violet-300 text-slate-700 active:scale-98'
                    }`}
                  >
                    <span>{c.title} {c.isPool ? '(İçerik Havuzu)' : ''}</span>
                    {isCurrent ? (
                      <span className="text-[10px] text-slate-400">Şu an burada</span>
                    ) : (
                      <MoveRight size={15} className="text-violet-600" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ════ MODAL: IMPORT FROM POSTER REQUESTS (BOTTOM SHEET ON MOBILE) ════ */}
      {showImportModal && (
        <div
          onClick={() => setShowImportModal(false)}
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-y-auto"
        >
          <div
            onClick={e => e.stopPropagation()}
            className="bg-white rounded-t-3xl sm:rounded-3xl max-w-lg w-full p-5 sm:p-6 shadow-2xl border border-slate-200 animate-sheet-up sm:animate-scale-in text-slate-800 max-h-[88vh] flex flex-col"
          >
            {/* Mobile Drag Indicator */}
            <div className="w-12 h-1.5 bg-slate-300 rounded-full mx-auto mb-2.5 sm:hidden shrink-0" />

            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100 shrink-0">
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <Download size={18} className="text-violet-600" />
                <span>Afiş Taleplerinden Havuza Aktar</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowImportModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center min-w-[36px] min-h-[36px]"
              >
                <X size={16} />
              </button>
            </div>

            <p className="text-xs text-slate-500 mb-3 shrink-0">
              Afiş portalındaki talepleri tek tıkla "Paylaşılacaklar" havuzuna kart olarak ekleyebilirsiniz.
            </p>

            <div className="space-y-2 overflow-y-auto flex-1 pr-1 pb-safe">
              {requests.length === 0 ? (
                <div className="py-8 text-center text-slate-400 text-xs">
                  Henüz afiş talebi bulunmuyor.
                </div>
              ) : (
                requests.map(r => (
                  <div
                    key={r.id}
                    className="p-3 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between gap-3 hover:border-violet-300 transition-colors"
                  >
                    <div className="min-w-0">
                      <p className="font-bold text-xs text-slate-800 truncate">{r.etkinlikAdi}</p>
                      <p className="text-[11px] text-slate-500 truncate">{r.ekip} • {r.tarih || 'Tarih yok'}</p>
                      <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-[9px] font-bold bg-slate-200 text-slate-700">
                        {r.status}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleImportRequestToPool(r)}
                      className="min-h-[38px] px-3.5 py-1.5 bg-violet-600 hover:bg-violet-700 active:scale-95 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1 shrink-0 shadow-xs"
                    >
                      <Plus size={14} />
                      <span>Havuza Ekle</span>
                    </button>
                  </div>
                ))
              )}
            </div>

            <div className="pt-3 mt-3 border-t border-slate-100 text-right shrink-0 pb-safe">
              <button
                type="button"
                onClick={() => setShowImportModal(false)}
                className="min-h-[40px] py-2 px-5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl"
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
