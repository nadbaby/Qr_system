import { dbFirestore, isFirebaseConfigured } from './firebaseClient';
import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  setDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  limit 
} from 'firebase/firestore';

export interface Employee {
  id: string;
  name: string;
  email: string;
  passcode: string;
  active: boolean;
  created_at?: string;
}

export interface Counter {
  id: string;
  name: string;
  employee_id: string | null;
  active: boolean;
  created_at?: string;
  employee?: Employee | null;
}

export interface QRSession {
  id: string;
  counter_id: string;
  employee_id: string | null;
  scanned_at: string;
  ip_address?: string;
  user_agent?: string;
}

export interface ReviewClick {
  id: string;
  qr_session_id: string | null;
  counter_id: string;
  employee_id: string | null;
  clicked_at: string;
}

export interface ReviewConfirmation {
  id: string;
  qr_session_id: string | null;
  counter_id: string;
  employee_id: string | null;
  customer_name: string;
  confirmed_at: string;
}

export interface MonthlyTarget {
  id: string;
  employee_id: string;
  counter_id: string;
  target_month: string; // YYYY-MM
  target_reviews: number;
  created_at?: string;
}

// Default Seed Data for Mock Storage
const DEFAULT_EMPLOYEES: Employee[] = [
  { id: 'e1111111-1111-1111-1111-111111111111', name: 'Amit Sharma', email: 'amit@finebearing.com', passcode: '1001', active: true },
  { id: 'e2222222-2222-2222-2222-222222222222', name: 'Priya Patel', email: 'priya@finebearing.com', passcode: '1002', active: true },
  { id: 'e3333333-3333-3333-3333-333333333333', name: 'Rahul Verma', email: 'rahul@finebearing.com', passcode: '1003', active: true },
  { id: 'e4444444-4444-4444-4444-444444444444', name: 'Vikram Singh', email: 'vikram@finebearing.com', passcode: '1004', active: true },
  { id: 'e5555555-5555-5555-5555-555555555555', name: 'Neha Gupta', email: 'neha@finebearing.com', passcode: '1005', active: true },
];

const DEFAULT_COUNTERS: Counter[] = [
  { id: 'counter-1', name: 'Main Billing Counter', employee_id: 'e1111111-1111-1111-1111-111111111111', active: true },
  { id: 'counter-2', name: 'Oil Seals Section', employee_id: 'e2222222-2222-2222-2222-222222222222', active: true },
  { id: 'counter-3', name: 'Ball Bearings Desk', employee_id: 'e3333333-3333-3333-3333-333333333333', active: true },
  { id: 'counter-4', name: 'Heavy Bearings Counter', employee_id: 'e4444444-4444-4444-4444-444444444444', active: true },
  { id: 'counter-5', name: 'Express Pickup Window', employee_id: 'e5555555-5555-5555-5555-555555555555', active: true },
];

const DEFAULT_SETTINGS = {
  GOOGLE_REVIEW_URL: 'https://g.page/r/CRugrGmMaUE2EAE/review',
};

const DEFAULT_TARGETS: MonthlyTarget[] = [
  { id: 't1', employee_id: 'e1111111-1111-1111-1111-111111111111', counter_id: 'counter-1', target_month: '2026-06', target_reviews: 50 },
  { id: 't2', employee_id: 'e2222222-2222-2222-2222-222222222222', counter_id: 'counter-2', target_month: '2026-06', target_reviews: 30 },
  { id: 't3', employee_id: 'e3333333-3333-3333-3333-333333333333', counter_id: 'counter-3', target_month: '2026-06', target_reviews: 40 },
  { id: 't4', employee_id: 'e4444444-4444-4444-4444-444444444444', counter_id: 'counter-4', target_month: '2026-06', target_reviews: 25 },
  { id: 't5', employee_id: 'e5555555-5555-5555-5555-555555555555', counter_id: 'counter-5', target_month: '2026-06', target_reviews: 35 },
];

// Helper to seed local storage mock database
const initMockDB = () => {
  if (typeof window === 'undefined') return;

  if (!localStorage.getItem('fb_employees')) {
    localStorage.setItem('fb_employees', JSON.stringify(DEFAULT_EMPLOYEES));
  }
  if (!localStorage.getItem('fb_counters')) {
    localStorage.setItem('fb_counters', JSON.stringify(DEFAULT_COUNTERS));
  }
  if (!localStorage.getItem('fb_targets')) {
    localStorage.setItem('fb_targets', JSON.stringify(DEFAULT_TARGETS));
  }
  if (!localStorage.getItem('fb_settings')) {
    localStorage.setItem('fb_settings', JSON.stringify(DEFAULT_SETTINGS));
  } else {
    // If setting is old placeholder, upgrade it
    try {
      const parsed = JSON.parse(localStorage.getItem('fb_settings')!);
      if (parsed.GOOGLE_REVIEW_URL === 'https://search.google.com/local/writereview?placeid=ChIJN1t_tDeuEmsRUsoyG83A14g') {
        parsed.GOOGLE_REVIEW_URL = 'https://g.page/r/CRugrGmMaUE2EAE/review';
        localStorage.setItem('fb_settings', JSON.stringify(parsed));
      }
    } catch (e) {}
  }
  if (!localStorage.getItem('fb_admin_users')) {
    localStorage.setItem('fb_admin_users', JSON.stringify([{ email: 'admin@finebearing.com', password: 'admin123' }]));
  }

  // Pre-seed some activities for demo graphs and leaderboards
  if (!localStorage.getItem('fb_qr_sessions')) {
    const sessions: QRSession[] = [];
    const clicks: ReviewClick[] = [];
    const confirmations: ReviewConfirmation[] = [];

    // Let's create dates spread across today, yesterday, and this week
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    
    const dOffset = (offsetDays: number, hour: number) => {
      const d = new Date();
      d.setDate(now.getDate() - offsetDays);
      d.setHours(hour, 0, 0, 0);
      return d.toISOString();
    };

    // Pre-populate scans, clicks, confirmations
    const mockEvents = [
      // Amit (Counter 1) - Today
      { counterId: 'counter-1', empId: 'e1111111-1111-1111-1111-111111111111', offset: 0, hr: 9, click: true, conf: true, name: 'Rahul Sharma' },
      { counterId: 'counter-1', empId: 'e1111111-1111-1111-1111-111111111111', offset: 0, hr: 10, click: true, conf: false },
      { counterId: 'counter-1', empId: 'e1111111-1111-1111-1111-111111111111', offset: 0, hr: 11, click: false, conf: false },
      // Amit (Counter 1) - Yesterday
      { counterId: 'counter-1', empId: 'e1111111-1111-1111-1111-111111111111', offset: 1, hr: 14, click: true, conf: true, name: 'Sanjay Gupta' },
      { counterId: 'counter-1', empId: 'e1111111-1111-1111-1111-111111111111', offset: 1, hr: 16, click: true, conf: false },
      // Priya (Counter 2) - Today
      { counterId: 'counter-2', empId: 'e2222222-2222-2222-2222-222222222222', offset: 0, hr: 9, click: true, conf: true, name: 'Anita Patel' },
      { counterId: 'counter-2', empId: 'e2222222-2222-2222-2222-222222222222', offset: 0, hr: 10, click: false, conf: false },
      // Priya (Counter 2) - Yesterday
      { counterId: 'counter-2', empId: 'e2222222-2222-2222-2222-222222222222', offset: 1, hr: 11, click: true, conf: true, name: 'John Doe' },
      // Rahul (Counter 3) - Today
      { counterId: 'counter-3', empId: 'e3333333-3333-3333-3333-333333333333', offset: 0, hr: 8, click: true, conf: false },
      { counterId: 'counter-3', empId: 'e3333333-3333-3333-3333-333333333333', offset: 1, hr: 15, click: true, conf: true, name: 'Sunil Kumar' },
      // Vikram (Counter 4) - Today
      { counterId: 'counter-4', empId: 'e4444444-4444-4444-4444-444444444444', offset: 0, hr: 14, click: true, conf: true, name: 'Karan Singh' },
      // Neha (Counter 5) - Today
      { counterId: 'counter-5', empId: 'e5555555-5555-5555-5555-555555555555', offset: 0, hr: 15, click: true, conf: true, name: 'Swati Sen' },
    ];

    mockEvents.forEach((ev, index) => {
      const sId = `session-${index}`;
      const time = dOffset(ev.offset, ev.hr);

      sessions.push({
        id: sId,
        counter_id: ev.counterId,
        employee_id: ev.empId,
        scanned_at: time,
      });

      if (ev.click) {
        clicks.push({
          id: `click-${index}`,
          qr_session_id: sId,
          counter_id: ev.counterId,
          employee_id: ev.empId,
          clicked_at: time,
        });
      }

      if (ev.conf) {
        confirmations.push({
          id: `conf-${index}`,
          qr_session_id: sId,
          counter_id: ev.counterId,
          employee_id: ev.empId,
          customer_name: ev.name || 'Anonymous Customer',
          confirmed_at: time,
        });
      }
    });

    localStorage.setItem('fb_qr_sessions', JSON.stringify(sessions));
    localStorage.setItem('fb_review_clicks', JSON.stringify(clicks));
    localStorage.setItem('fb_review_confirmations', JSON.stringify(confirmations));
  }
};

// Initialize
initMockDB();

// Mock storage getters and setters
const getMockData = <T>(key: string): T[] => {
  if (typeof window === 'undefined') return [];
  return JSON.parse(localStorage.getItem(key) || '[]');
};

const setMockData = <T>(key: string, data: T[]) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(key, JSON.stringify(data));
};

let firebaseSeeded = false;

const ensureFirebaseSeeded = async () => {
  if (firebaseSeeded) return;
  if (!isFirebaseConfigured || !dbFirestore) return;

  try {
    const settingsCol = collection(dbFirestore, 'settings');
    const settingsSnap = await getDocs(settingsCol);
    
    if (settingsSnap.empty) {
      console.log('Firestore is empty. Seeding default data...');
      
      // 1. Seed Settings
      await setDoc(doc(dbFirestore, 'settings', 'GOOGLE_REVIEW_URL'), {
        value: 'https://g.page/r/CRugrGmMaUE2EAE/review',
        updated_at: new Date().toISOString()
      });

      // 2. Seed Admin User
      await setDoc(doc(dbFirestore, 'admin_users', 'default-admin'), {
        email: 'admin@finebearing.com',
        password: 'admin123',
        created_at: new Date().toISOString()
      });

      // 3. Seed Employees
      for (const emp of DEFAULT_EMPLOYEES) {
        await setDoc(doc(dbFirestore, 'employees', emp.id), {
          name: emp.name,
          email: emp.email,
          passcode: emp.passcode,
          active: emp.active,
          created_at: new Date().toISOString()
        });
      }

      // 4. Seed Counters
      for (const ctr of DEFAULT_COUNTERS) {
        await setDoc(doc(dbFirestore, 'counters', ctr.id), {
          name: ctr.name,
          employee_id: ctr.employee_id,
          active: ctr.active,
          created_at: new Date().toISOString()
        });
      }

      // 5. Seed Monthly Targets
      for (const t of DEFAULT_TARGETS) {
        await setDoc(doc(dbFirestore, 'monthly_targets', t.id), {
          employee_id: t.employee_id,
          counter_id: t.counter_id,
          target_month: t.target_month,
          target_reviews: t.target_reviews,
          created_at: new Date().toISOString()
        });
      }

      console.log('Firestore seeding completed successfully.');
    }
    firebaseSeeded = true;
  } catch (err) {
    console.error('Error during Firestore seeding:', err);
    // Mark as true so we don't lock future calls in loops
    firebaseSeeded = true;
  }
};

// DATABASE API
export const db = {
  // SETTINGS
  getSettings: async () => {
    await ensureFirebaseSeeded();
    if (isFirebaseConfigured && dbFirestore) {
      try {
        const snap = await getDocs(collection(dbFirestore, 'settings'));
        const settingsMap: Record<string, string> = {};
        snap.forEach((d) => {
          settingsMap[d.id] = d.data().value;
        });
        if (!settingsMap['GOOGLE_REVIEW_URL']) {
          settingsMap['GOOGLE_REVIEW_URL'] = DEFAULT_SETTINGS.GOOGLE_REVIEW_URL;
        }
        return settingsMap;
      } catch (err) {
        console.warn('Error fetching settings from Firestore, using default config:', err);
        return DEFAULT_SETTINGS;
      }
    } else {
      return getMockData<any>('fb_settings').reduce((acc: any, curr: any) => {
        return { ...acc, ...curr };
      }, DEFAULT_SETTINGS);
    }
  },

  getGoogleReviewUrl: async () => {
    await ensureFirebaseSeeded();
    if (isFirebaseConfigured && dbFirestore) {
      try {
        const docRef = doc(dbFirestore, 'settings', 'GOOGLE_REVIEW_URL');
        const docSnap = await getDoc(docRef);
        return docSnap.exists() ? docSnap.data().value : DEFAULT_SETTINGS.GOOGLE_REVIEW_URL;
      } catch (err) {
        console.warn('Error fetching GOOGLE_REVIEW_URL from Firestore, using default review link:', err);
        return DEFAULT_SETTINGS.GOOGLE_REVIEW_URL;
      }
    } else {
      const settings = localStorage.getItem('fb_settings') 
        ? JSON.parse(localStorage.getItem('fb_settings')!) 
        : DEFAULT_SETTINGS;
      return settings.GOOGLE_REVIEW_URL || DEFAULT_SETTINGS.GOOGLE_REVIEW_URL;
    }
  },

  updateSetting: async (key: string, value: string) => {
    if (isFirebaseConfigured && dbFirestore) {
      try {
        const docRef = doc(dbFirestore, 'settings', key);
        await setDoc(docRef, { value, updated_at: new Date().toISOString() });
      } catch (err) {
        console.error(`Error updating setting ${key} in Firestore:`, err);
      }
    } else {
      const settings = localStorage.getItem('fb_settings') 
        ? JSON.parse(localStorage.getItem('fb_settings')!) 
        : { ...DEFAULT_SETTINGS };
      settings[key] = value;
      localStorage.setItem('fb_settings', JSON.stringify(settings));
    }
  },

  // AUTH
  adminLogin: async (email: string, password_raw: string) => {
    await ensureFirebaseSeeded();
    if (isFirebaseConfigured && dbFirestore) {
      const q = query(
        collection(dbFirestore, 'admin_users'),
        where('email', '==', email),
        where('password', '==', password_raw),
        limit(1)
      );
      const snap = await getDocs(q);
      if (!snap.empty) {
        const data = snap.docs[0].data();
        return { role: 'admin', email: data.email };
      }
      return null;
    } else {
      const admins = getMockData<any>('fb_admin_users');
      const admin = admins.find((a: any) => a.email === email && a.password === password_raw);
      return admin ? { role: 'admin', email: admin.email } : null;
    }
  },

  employeeLogin: async (passcode: string) => {
    await ensureFirebaseSeeded();
    if (isFirebaseConfigured && dbFirestore) {
      const q = query(
        collection(dbFirestore, 'employees'),
        where('passcode', '==', passcode),
        where('active', '==', true),
        limit(1)
      );
      const snap = await getDocs(q);
      if (!snap.empty) {
        const d = snap.docs[0];
        const data = d.data();
        return { role: 'employee', id: d.id, name: data.name, email: data.email };
      }
      return null;
    } else {
      const employees = getMockData<Employee>('fb_employees');
      const emp = employees.find((e) => e.passcode === passcode && e.active);
      return emp ? { role: 'employee', id: emp.id, name: emp.name, email: emp.email } : null;
    }
  },

  // EMPLOYEES
  getEmployees: async (): Promise<Employee[]> => {
    await ensureFirebaseSeeded();
    if (isFirebaseConfigured && dbFirestore) {
      const snap = await getDocs(collection(dbFirestore, 'employees'));
      const list: Employee[] = [];
      snap.forEach((d) => {
        const data = d.data();
        list.push({
          id: d.id,
          name: data.name,
          email: data.email,
          passcode: data.passcode,
          active: data.active,
          created_at: data.created_at
        });
      });
      return list.sort((a, b) => a.name.localeCompare(b.name));
    } else {
      return getMockData<Employee>('fb_employees').sort((a, b) => a.name.localeCompare(b.name));
    }
  },

  addEmployee: async (employee: Omit<Employee, 'id'>) => {
    if (isFirebaseConfigured && dbFirestore) {
      const ref = collection(dbFirestore, 'employees');
      const newEmp = {
        ...employee,
        created_at: new Date().toISOString()
      };
      const docRef = await addDoc(ref, newEmp);
      return { id: docRef.id, ...newEmp };
    } else {
      const employees = getMockData<Employee>('fb_employees');
      const newEmp = { ...employee, id: crypto.randomUUID(), created_at: new Date().toISOString() };
      employees.push(newEmp);
      setMockData('fb_employees', employees);
      return newEmp;
    }
  },

  updateEmployee: async (id: string, updates: Partial<Employee>) => {
    if (isFirebaseConfigured && dbFirestore) {
      const docRef = doc(dbFirestore, 'employees', id);
      await updateDoc(docRef, updates);
      const updated = await getDoc(docRef);
      return { id: updated.id, ...updated.data() } as Employee;
    } else {
      const employees = getMockData<Employee>('fb_employees');
      const idx = employees.findIndex((e) => e.id === id);
      if (idx === -1) throw new Error('Employee not found');
      employees[idx] = { ...employees[idx], ...updates };
      setMockData('fb_employees', employees);
      return employees[idx];
    }
  },

  deleteEmployee: async (id: string) => {
    if (isFirebaseConfigured && dbFirestore) {
      const docRef = doc(dbFirestore, 'employees', id);
      await deleteDoc(docRef);
      // Nullify employee on counters too
      const q = query(collection(dbFirestore, 'counters'), where('employee_id', '==', id));
      const snap = await getDocs(q);
      for (const d of snap.docs) {
        await updateDoc(doc(dbFirestore, 'counters', d.id), { employee_id: null });
      }
    } else {
      const employees = getMockData<Employee>('fb_employees');
      const filtered = employees.filter((e) => e.id !== id);
      setMockData('fb_employees', filtered);

      // Nullify employee on counters
      const counters = getMockData<Counter>('fb_counters');
      const updatedCounters = counters.map(c => c.employee_id === id ? { ...c, employee_id: null } : c);
      setMockData('fb_counters', updatedCounters);
    }
  },

  // COUNTERS
  getCounters: async (): Promise<Counter[]> => {
    await ensureFirebaseSeeded();
    if (isFirebaseConfigured && dbFirestore) {
      const cSnap = await getDocs(collection(dbFirestore, 'counters'));
      const eSnap = await getDocs(collection(dbFirestore, 'employees'));
      const emps: Employee[] = [];
      eSnap.forEach(d => emps.push({ id: d.id, ...d.data() } as any));

      const list: Counter[] = [];
      cSnap.forEach((d) => {
        const data = d.data();
        list.push({
          id: d.id,
          name: data.name,
          employee_id: data.employee_id || null,
          active: data.active,
          created_at: data.created_at,
          employee: emps.find(e => e.id === data.employee_id) || null
        });
      });
      return list.sort((a, b) => a.id.localeCompare(b.id));
    } else {
      const counters = getMockData<Counter>('fb_counters');
      const employees = getMockData<Employee>('fb_employees');
      return counters.map((c) => ({
        ...c,
        employee: employees.find((e) => e.id === c.employee_id) || null
      })).sort((a, b) => a.id.localeCompare(b.id));
    }
  },

  addCounter: async (counter: Omit<Counter, 'employee' | 'created_at'>) => {
    if (isFirebaseConfigured && dbFirestore) {
      const docRef = doc(dbFirestore, 'counters', counter.id);
      const snap = await getDoc(docRef);
      if (snap.exists()) throw new Error('Counter ID already exists');
      const newCounter = {
        name: counter.name,
        employee_id: counter.employee_id,
        active: counter.active,
        created_at: new Date().toISOString()
      };
      await setDoc(docRef, newCounter);
      return { id: counter.id, ...newCounter };
    } else {
      const counters = getMockData<Counter>('fb_counters');
      if (counters.some(c => c.id === counter.id)) throw new Error('Counter ID already exists');
      const newCounter = { ...counter, created_at: new Date().toISOString() };
      counters.push(newCounter);
      setMockData('fb_counters', counters);
      return newCounter;
    }
  },

  updateCounter: async (id: string, updates: Partial<Counter>) => {
    const cleanUpdates = { ...updates };
    delete (cleanUpdates as any).employee;

    if (isFirebaseConfigured && dbFirestore) {
      const docRef = doc(dbFirestore, 'counters', id);
      await updateDoc(docRef, cleanUpdates);
      const updated = await getDoc(docRef);
      return { id: updated.id, ...updated.data() } as Counter;
    } else {
      const counters = getMockData<Counter>('fb_counters');
      const idx = counters.findIndex((c) => c.id === id);
      if (idx === -1) throw new Error('Counter not found');
      counters[idx] = { ...counters[idx], ...cleanUpdates };
      setMockData('fb_counters', counters);
      return counters[idx];
    }
  },

  deleteCounter: async (id: string) => {
    if (isFirebaseConfigured && dbFirestore) {
      const docRef = doc(dbFirestore, 'counters', id);
      await deleteDoc(docRef);
    } else {
      const counters = getMockData<Counter>('fb_counters');
      const filtered = counters.filter((c) => c.id !== id);
      setMockData('fb_counters', filtered);
    }
  },

  // SCANS, CLICKS, CONFIRMATIONS
  recordScan: async (counterId: string, employeeId: string | null): Promise<string> => {
    await ensureFirebaseSeeded();
    const scannedAt = new Date().toISOString();
    
    if (isFirebaseConfigured && dbFirestore) {
      const ref = collection(dbFirestore, 'qr_sessions');
      const docRef = await addDoc(ref, {
        counter_id: counterId,
        employee_id: employeeId,
        scanned_at: scannedAt,
        user_agent: typeof window !== 'undefined' ? window.navigator.userAgent : null
      });
      return docRef.id;
    } else {
      const sessionId = crypto.randomUUID();
      const sessions = getMockData<QRSession>('fb_qr_sessions');
      sessions.push({
        id: sessionId,
        counter_id: counterId,
        employee_id: employeeId,
        scanned_at: scannedAt,
        user_agent: typeof window !== 'undefined' ? window.navigator.userAgent : undefined
      });
      setMockData('fb_qr_sessions', sessions);
      return sessionId;
    }
  },

  recordClick: async (qrSessionId: string | null, counterId: string, employeeId: string | null) => {
    const clickedAt = new Date().toISOString();
    if (isFirebaseConfigured && dbFirestore) {
      const ref = collection(dbFirestore, 'review_clicks');
      await addDoc(ref, {
        qr_session_id: qrSessionId,
        counter_id: counterId,
        employee_id: employeeId,
        clicked_at: clickedAt,
      });
    } else {
      const clicks = getMockData<ReviewClick>('fb_review_clicks');
      clicks.push({
        id: crypto.randomUUID(),
        qr_session_id: qrSessionId,
        counter_id: counterId,
        employee_id: employeeId,
        clicked_at: clickedAt,
      });
      setMockData('fb_review_clicks', clicks);
    }
  },

  recordConfirmation: async (qrSessionId: string | null, counterId: string, employeeId: string | null, customerName: string) => {
    const confirmedAt = new Date().toISOString();
    if (isFirebaseConfigured && dbFirestore) {
      const ref = collection(dbFirestore, 'review_confirmations');
      await addDoc(ref, {
        qr_session_id: qrSessionId,
        counter_id: counterId,
        employee_id: employeeId,
        customer_name: customerName || 'Anonymous Customer',
        confirmed_at: confirmedAt,
      });
    } else {
      const confirmations = getMockData<ReviewConfirmation>('fb_review_confirmations');
      confirmations.push({
        id: crypto.randomUUID(),
        qr_session_id: qrSessionId,
        counter_id: counterId,
        employee_id: employeeId,
        customer_name: customerName || 'Anonymous Customer',
        confirmed_at: confirmedAt,
      });
      setMockData('fb_review_confirmations', confirmations);
    }
  },

  // MONTHLY TARGETS
  getTargets: async (month?: string): Promise<MonthlyTarget[]> => {
    if (isFirebaseConfigured && dbFirestore) {
      let q = query(collection(dbFirestore, 'monthly_targets'));
      if (month) {
        q = query(q, where('target_month', '==', month));
      }
      const snap = await getDocs(q);
      const list: MonthlyTarget[] = [];
      snap.forEach((d) => {
        list.push({ id: d.id, ...d.data() } as MonthlyTarget);
      });
      return list;
    } else {
      const targets = getMockData<MonthlyTarget>('fb_targets');
      if (month) {
        return targets.filter((t) => t.target_month === month);
      }
      return targets;
    }
  },

  saveTarget: async (target: Omit<MonthlyTarget, 'id'>) => {
    if (isFirebaseConfigured && dbFirestore) {
      const q = query(
        collection(dbFirestore, 'monthly_targets'),
        where('employee_id', '==', target.employee_id),
        where('counter_id', '==', target.counter_id),
        where('target_month', '==', target.target_month)
      );
      const snap = await getDocs(q);
      if (!snap.empty) {
        const docRef = doc(dbFirestore, 'monthly_targets', snap.docs[0].id);
        await updateDoc(docRef, { target_reviews: target.target_reviews });
      } else {
        await addDoc(collection(dbFirestore, 'monthly_targets'), {
          ...target,
          created_at: new Date().toISOString()
        });
      }
    } else {
      const targets = getMockData<MonthlyTarget>('fb_targets');
      const idx = targets.findIndex(
        (t) => t.employee_id === target.employee_id && 
               t.counter_id === target.counter_id && 
               t.target_month === target.target_month
      );

      if (idx !== -1) {
        targets[idx].target_reviews = target.target_reviews;
      } else {
        targets.push({
          id: crypto.randomUUID(),
          ...target,
        });
      }
      setMockData('fb_targets', targets);
    }
  },

  // ANALYTICS & REPORTS
  getAnalytics: async (dateRange: { start: Date; end: Date; custom: boolean }) => {
    // 1. Get raw records
    let rawScans: QRSession[] = [];
    let rawClicks: ReviewClick[] = [];
    let rawConfs: ReviewConfirmation[] = [];
    let employees: Employee[] = [];
    let counters: Counter[] = [];
    let targets: MonthlyTarget[] = [];
    let rawAdjustments: any[] = [];

    const startStr = dateRange.start.toISOString();
    const endStr = dateRange.end.toISOString();

    if (isFirebaseConfigured && dbFirestore) {
      // Fetch employees & counters
      const empSnap = await getDocs(collection(dbFirestore, 'employees'));
      const ctrSnap = await getDocs(collection(dbFirestore, 'counters'));
      employees = empSnap.docs.map(d => ({ id: d.id, ...d.data() } as any));
      counters = ctrSnap.docs.map(d => ({ id: d.id, ...d.data() } as any));

      // Fetch within range
      const sSnap = await getDocs(query(
        collection(dbFirestore, 'qr_sessions'),
        where('scanned_at', '>=', startStr),
        where('scanned_at', '<=', endStr)
      ));
      rawScans = sSnap.docs.map(d => ({ id: d.id, ...d.data() } as any));

      const cSnap = await getDocs(query(
        collection(dbFirestore, 'review_clicks'),
        where('clicked_at', '>=', startStr),
        where('clicked_at', '<=', endStr)
      ));
      rawClicks = cSnap.docs.map(d => ({ id: d.id, ...d.data() } as any));

      const cfSnap = await getDocs(query(
        collection(dbFirestore, 'review_confirmations'),
        where('confirmed_at', '>=', startStr),
        where('confirmed_at', '<=', endStr)
      ));
      rawConfs = cfSnap.docs.map(d => ({ id: d.id, ...d.data() } as any));

      const currentMonth = new Date().toISOString().substring(0, 7);
      const tSnap = await getDocs(query(
        collection(dbFirestore, 'monthly_targets'),
        where('target_month', '==', currentMonth)
      ));
      targets = tSnap.docs.map(d => ({ id: d.id, ...d.data() } as any));

      try {
        const adjSnap = await getDocs(collection(dbFirestore, 'score_adjustments'));
        rawAdjustments = adjSnap.docs.map(d => ({ id: d.id, ...d.data() } as any));
      } catch (err) {
        console.warn('Could not fetch score_adjustments, using empty adjustments.', err);
      }
    } else {
      employees = getMockData<Employee>('fb_employees');
      counters = getMockData<Counter>('fb_counters');
      targets = getMockData<MonthlyTarget>('fb_targets');
      rawAdjustments = getMockData<any>('fb_score_adjustments');

      const allScans = getMockData<QRSession>('fb_qr_sessions');
      const allClicks = getMockData<ReviewClick>('fb_review_clicks');
      const allConfs = getMockData<ReviewConfirmation>('fb_review_confirmations');

      const sTime = dateRange.start.getTime();
      const eTime = dateRange.end.getTime();

      rawScans = allScans.filter((s) => { const t = new Date(s.scanned_at).getTime(); return t >= sTime && t <= eTime; });
      rawClicks = allClicks.filter((c) => { const t = new Date(c.clicked_at).getTime(); return t >= sTime && t <= eTime; });
      rawConfs = allConfs.filter((cf) => { const t = new Date(cf.confirmed_at).getTime(); return t >= sTime && t <= eTime; });
    }

    // 2. Compute metrics
    const totalScans = rawScans.length;
    const totalClicks = rawClicks.length;
    const totalConfirmations = rawConfs.length;
    const conversionRate = totalScans > 0 ? parseFloat(((totalClicks / totalScans) * 100).toFixed(1)) : 0;

    // 3. Counter-wise Leaderboard
    const counterLeaderboard = counters.map((ctr) => {
      const scans = rawScans.filter((s) => s.counter_id === ctr.id).length;
      const clicks = rawClicks.filter((c) => c.counter_id === ctr.id).length;
      const confs = rawConfs.filter((cf) => cf.counter_id === ctr.id).length;
      
      const empId = ctr.employee_id;
      const adjustmentsSum = empId
        ? rawAdjustments.filter((a) => a.employee_id === empId).reduce((sum, current) => sum + current.points, 0)
        : 0;

      // Fair score calculation: Scan = 1 pt, Click = 2 pts, Confirmed = 5 pts
      const baseScore = (scans * 1) + (clicks * 2) + (confs * 5);
      const score = Math.max(0, baseScore + adjustmentsSum);
      const rate = scans > 0 ? parseFloat(((clicks / scans) * 100).toFixed(1)) : 0;
      
      // Get currently assigned employee
      const emp = employees.find((e) => e.id === ctr.employee_id);

      return {
        counterId: ctr.id,
        counterName: ctr.name,
        employeeName: emp ? emp.name : 'Unassigned',
        scans,
        clicks,
        confs,
        score,
        conversionRate: rate,
      };
    }).sort((a, b) => b.score - a.score);

    // 4. Employee-wise Leaderboard
    const employeeLeaderboard = employees.map((emp) => {
      const scans = rawScans.filter((s) => s.employee_id === emp.id).length;
      const clicks = rawClicks.filter((c) => c.employee_id === emp.id).length;
      const confs = rawConfs.filter((cf) => cf.employee_id === emp.id).length;
      
      const adjustmentsSum = rawAdjustments
        .filter((a) => a.employee_id === emp.id)
        .reduce((sum, current) => sum + current.points, 0);

      const baseScore = (scans * 1) + (clicks * 2) + (confs * 5);
      const score = Math.max(0, baseScore + adjustmentsSum);
      const rate = scans > 0 ? parseFloat(((clicks / scans) * 100).toFixed(1)) : 0;

      // Find monthly target
      const empTargetObj = targets.find((t) => t.employee_id === emp.id);
      const target = empTargetObj ? empTargetObj.target_reviews : 20;
      const progress = target > 0 ? parseFloat(((confs / target) * 100).toFixed(1)) : 0;

      return {
        employeeId: emp.id,
        employeeName: emp.name,
        email: emp.email,
        scans,
        clicks,
        confs,
        score,
        conversionRate: rate,
        target,
        progress,
        active: emp.active,
      };
    }).sort((a, b) => b.score - a.score);

    // 5. Highlights
    const topCounter = counterLeaderboard.length > 0 && counterLeaderboard[0].score > 0 
      ? counterLeaderboard[0] 
      : null;
      
    const topEmployee = employeeLeaderboard.length > 0 && employeeLeaderboard[0].score > 0 
      ? employeeLeaderboard[0] 
      : null;

    // Champion represents employee with most confirmed reviews
    const championEmployee = [...employeeLeaderboard].sort((a, b) => b.confs - a.confs);
    const monthlyChamp = championEmployee.length > 0 && championEmployee[0].confs > 0
      ? championEmployee[0]
      : null;

    // Best conversion rate among counters/employees with at least 3 scans (to make it fair and avoid 100% on 1 scan)
    const candidatesForBestRate = employeeLeaderboard.filter((e) => e.scans >= 3);
    const bestConversionEmp = candidatesForBestRate.length > 0 
      ? [...candidatesForBestRate].sort((a, b) => b.conversionRate - a.conversionRate)[0]
      : (employeeLeaderboard.length > 0 ? [...employeeLeaderboard].sort((a, b) => b.conversionRate - a.conversionRate)[0] : null);

    // 6. Time series data for charts (by day or by hour depending on date range duration)
    const scanTimeline: Record<string, { date: string; scans: number; clicks: number; confs: number }> = {};
    
    // Helper to format date label
    const getTimelineLabel = (dateStr: string) => {
      const d = new Date(dateStr);
      if (totalScans > 0) {
        const diffMs = dateRange.end.getTime() - dateRange.start.getTime();
        const diffDays = diffMs / (1000 * 60 * 60 * 24);
        if (diffDays <= 2) {
          // If range is within 2 days, group by hour
          return `${d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} ${String(d.getHours()).padStart(2, '0')}:00`;
        }
      }
      return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    };

    // Initialize all days in range to 0
    let temp = new Date(dateRange.start);
    while (temp <= dateRange.end) {
      const label = getTimelineLabel(temp.toISOString());
      scanTimeline[label] = { date: label, scans: 0, clicks: 0, confs: 0 };
      
      const diffMs = dateRange.end.getTime() - dateRange.start.getTime();
      const diffDays = diffMs / (1000 * 60 * 60 * 24);
      if (diffDays <= 2) {
        temp.setHours(temp.getHours() + 1);
      } else {
        temp.setDate(temp.getDate() + 1);
      }
    }

    rawScans.forEach((s) => {
      const label = getTimelineLabel(s.scanned_at);
      if (scanTimeline[label]) scanTimeline[label].scans++;
    });
    rawClicks.forEach((c) => {
      const label = getTimelineLabel(c.clicked_at);
      if (scanTimeline[label]) scanTimeline[label].clicks++;
    });
    rawConfs.forEach((cf) => {
      const label = getTimelineLabel(cf.confirmed_at);
      if (scanTimeline[label]) scanTimeline[label].confs++;
    });

    const timelineData = Object.values(scanTimeline);

    // 7. Recent Activity logs
    const activities = [
      ...rawScans.map((s) => ({
        id: s.id,
        type: 'scan',
        time: s.scanned_at,
        counterId: s.counter_id,
        counterName: counters.find((ctr) => ctr.id === s.counter_id)?.name || s.counter_id,
        employeeName: employees.find((e) => e.id === s.employee_id)?.name || 'Unassigned',
        detail: 'QR Code Scanned',
      })),
      ...rawClicks.map((c) => ({
        id: c.id,
        type: 'click',
        time: c.clicked_at,
        counterId: c.counter_id,
        counterName: counters.find((ctr) => ctr.id === c.counter_id)?.name || c.counter_id,
        employeeName: employees.find((e) => e.id === c.employee_id)?.name || 'Unassigned',
        detail: 'Clicked "Write a Google Review"',
      })),
      ...rawConfs.map((cf) => ({
        id: cf.id,
        type: 'confirmation',
        time: cf.confirmed_at,
        counterId: cf.counter_id,
        counterName: counters.find((ctr) => ctr.id === cf.counter_id)?.name || cf.counter_id,
        employeeName: employees.find((e) => e.id === cf.employee_id)?.name || 'Unassigned',
        detail: `Confirmed review submission (${cf.customer_name || 'Anonymous'})`,
      })),
    ].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()).slice(0, 15);

    return {
      metrics: {
        totalScans,
        totalClicks,
        totalConfirmations,
        conversionRate,
      },
      counterLeaderboard,
      employeeLeaderboard,
      timelineData,
      activities,
      highlights: {
        topCounterName: topCounter ? topCounter.counterName : 'None',
        topCounterScore: topCounter ? topCounter.score : 0,
        topEmployeeName: topEmployee ? topEmployee.employeeName : 'None',
        topEmployeeScore: topEmployee ? topEmployee.score : 0,
        bestConversionName: bestConversionEmp ? bestConversionEmp.employeeName : 'None',
        bestConversionRate: bestConversionEmp ? bestConversionEmp.conversionRate : 0,
        monthlyChampName: monthlyChamp ? monthlyChamp.employeeName : 'None',
        monthlyChampCount: monthlyChamp ? monthlyChamp.confs : 0,
      }
    };
  },

  // SCORE ADJUSTMENTS API
  adjustScore: async (employeeId: string, points: number, reason: string) => {
    if (isFirebaseConfigured && dbFirestore) {
      const ref = collection(dbFirestore, 'score_adjustments');
      await addDoc(ref, {
        employee_id: employeeId,
        points: Number(points),
        reason: reason || 'Manual adjustment',
        created_at: new Date().toISOString()
      });
    } else {
      const adjustments = getMockData<any>('fb_score_adjustments');
      adjustments.push({
        id: crypto.randomUUID(),
        employee_id: employeeId,
        points: Number(points),
        reason: reason || 'Manual adjustment',
        created_at: new Date().toISOString()
      });
      setMockData('fb_score_adjustments', adjustments);
    }
  },

  resetScore: async (employeeId: string, currentScore: number) => {
    // Offset current score to bring it to 0
    await db.adjustScore(employeeId, -currentScore, 'Reset score to zero');
  }
};
