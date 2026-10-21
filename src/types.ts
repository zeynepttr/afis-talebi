export type UserRole = 'admin' | 'user';

export interface AppUser {
  uid: string;
  name: string;
  username: string;
  password?: string;
  role: UserRole;
  createdAt?: any;
}

export type RequestStatus = 'talep-alindi' | 'tasarimda' | 'merkez-onayinda' | 'yayinlandi';

export interface PosterRequest {
  id: string;
  etkinlikAdi: string;
  ekip: string;
  altBaslik?: string;
  aciklama?: string;
  tarih: string;
  saat: string;
  mekan: string;
  ozelNot?: string;
  status: RequestStatus;
  createdBy: {
    uid: string;
    name: string;
  };
  createdAt?: any;
  updatedAt?: any;
}

export const STATUS_CONFIG: Record<
  RequestStatus,
  { label: string; icon: string; step: number; color: string; badgeBg: string; badgeText: string; borderColor: string }
> = {
  'talep-alindi': {
    label: 'Talep Alındı',
    icon: '📥',
    step: 1,
    color: '#64748b',
    badgeBg: 'bg-slate-100 text-slate-700 border-slate-200',
    badgeText: 'text-slate-700',
    borderColor: 'border-l-slate-400'
  },
  tasarimda: {
    label: 'Tasarımda',
    icon: '🎨',
    step: 2,
    color: '#d97706',
    badgeBg: 'bg-amber-50 text-amber-700 border-amber-200',
    badgeText: 'text-amber-700',
    borderColor: 'border-l-amber-500'
  },
  'merkez-onayinda': {
    label: 'Merkez Onayında',
    icon: '🔍',
    step: 3,
    color: '#2563eb',
    badgeBg: 'bg-blue-50 text-blue-700 border-blue-200',
    badgeText: 'text-blue-700',
    borderColor: 'border-l-blue-500'
  },
  yayinlandi: {
    label: 'Yayınlandı',
    icon: '✅',
    step: 4,
    color: '#059669',
    badgeBg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    badgeText: 'text-emerald-700',
    borderColor: 'border-l-emerald-500'
  }
};
