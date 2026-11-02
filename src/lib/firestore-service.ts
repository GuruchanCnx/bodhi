import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  limit,
  orderBy,
  query,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import {
  firestore,
  handleFirestoreError,
  OperationType,
} from "./firebase";

export interface MeditationSessionDoc {
  id: string;
  technique: string;
  title: string;
  durationSeconds: number;
  completed: boolean;
  moodBefore: number | null;
  moodAfter: number | null;
  notes: string | null;
  createdAt: string;
  userId?: string | null;
}

export interface JournalEntryDoc {
  id: string;
  title: string;
  content: string;
  mood: string | null;
  prompt: string | null;
  gratitude: string | null;
  createdAt: string;
  updatedAt: string;
  userId?: string | null;
}

export interface HabitDoc {
  id: string;
  title: string;
  targetMinutes: number;
  frequency: string;
  streak: number;
  completedDates: string[]; // ['2026-11-02', ...]
  active: boolean;
  createdAt: string;
  updatedAt: string;
  userId?: string | null;
}

export interface PracticePlanDoc {
  id: string;
  title: string;
  goal: string;
  minutesPerDay: number;
  level: string;
  days: { day: number; slug: string; name: string; minutes: number; focus: string }[];
  active: boolean;
  createdAt: string;
  userId?: string | null;
}

const SESSIONS_PATH = "meditation_sessions";
const JOURNAL_PATH = "journal_entries";
const HABITS_PATH = "habits";
const PLANS_PATH = "practice_plans";

// =================== SESSIONS ===================

export async function addSessionToFirestore(
  data: Omit<MeditationSessionDoc, "id"> & { id?: string }
): Promise<MeditationSessionDoc> {
  const id = data.id || `sess_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const record: MeditationSessionDoc = {
    id,
    technique: data.technique,
    title: data.title,
    durationSeconds: data.durationSeconds,
    completed: data.completed ?? true,
    moodBefore: data.moodBefore ?? null,
    moodAfter: data.moodAfter ?? null,
    notes: data.notes ?? null,
    createdAt: data.createdAt || new Date().toISOString(),
    userId: data.userId ?? null,
  };

  try {
    const docRef = doc(firestore, SESSIONS_PATH, id);
    await setDoc(docRef, record);
    return record;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `${SESSIONS_PATH}/${id}`);
  }
}

export async function getSessionsFromFirestore(
  limitCount = 60
): Promise<MeditationSessionDoc[]> {
  try {
    const colRef = collection(firestore, SESSIONS_PATH);
    const q = query(colRef, orderBy("createdAt", "desc"), limit(limitCount));
    const snapshot = await getDocs(q);
    const results: MeditationSessionDoc[] = [];
    snapshot.forEach((snap) => {
      results.push(snap.data() as MeditationSessionDoc);
    });
    return results;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, SESSIONS_PATH);
  }
}

export async function deleteSessionFromFirestore(id: string): Promise<void> {
  try {
    const docRef = doc(firestore, SESSIONS_PATH, id);
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${SESSIONS_PATH}/${id}`);
  }
}

// =================== JOURNAL ===================

export async function addJournalToFirestore(
  data: Omit<JournalEntryDoc, "id" | "updatedAt"> & { id?: string }
): Promise<JournalEntryDoc> {
  const id = data.id || `jrnl_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const now = new Date().toISOString();
  const record: JournalEntryDoc = {
    id,
    title: data.title,
    content: data.content,
    mood: data.mood ?? null,
    prompt: data.prompt ?? null,
    gratitude: data.gratitude ?? null,
    createdAt: data.createdAt || now,
    updatedAt: now,
    userId: data.userId ?? null,
  };

  try {
    const docRef = doc(firestore, JOURNAL_PATH, id);
    await setDoc(docRef, record);
    return record;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `${JOURNAL_PATH}/${id}`);
  }
}

export async function updateJournalInFirestore(
  id: string,
  updates: Partial<Omit<JournalEntryDoc, "id" | "createdAt">>
): Promise<JournalEntryDoc | null> {
  try {
    const docRef = doc(firestore, JOURNAL_PATH, id);
    const now = new Date().toISOString();
    await updateDoc(docRef, {
      ...updates,
      updatedAt: now,
    });
    return {
      id,
      ...updates,
      updatedAt: now,
    } as JournalEntryDoc;
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${JOURNAL_PATH}/${id}`);
  }
}

export async function getJournalsFromFirestore(
  limitCount = 100
): Promise<JournalEntryDoc[]> {
  try {
    const colRef = collection(firestore, JOURNAL_PATH);
    const q = query(colRef, orderBy("createdAt", "desc"), limit(limitCount));
    const snapshot = await getDocs(q);
    const results: JournalEntryDoc[] = [];
    snapshot.forEach((snap) => {
      results.push(snap.data() as JournalEntryDoc);
    });
    return results;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, JOURNAL_PATH);
  }
}

export async function deleteJournalFromFirestore(id: string): Promise<void> {
  try {
    const docRef = doc(firestore, JOURNAL_PATH, id);
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${JOURNAL_PATH}/${id}`);
  }
}

// =================== HABITS ===================

export async function getHabitsFromFirestore(): Promise<HabitDoc[]> {
  try {
    const colRef = collection(firestore, HABITS_PATH);
    const q = query(colRef, orderBy("createdAt", "desc"), limit(20));
    const snapshot = await getDocs(q);
    const results: HabitDoc[] = [];
    snapshot.forEach((snap) => {
      const data = snap.data();
      results.push({
        ...data,
        completedDates: typeof data.completedDates === "string" ? JSON.parse(data.completedDates) : (data.completedDates || []),
      } as HabitDoc);
    });
    return results;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, HABITS_PATH);
  }
}

export async function saveHabitToFirestore(
  title: string,
  targetMinutes: number,
  frequency = "daily"
): Promise<HabitDoc> {
  const id = `habit_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const now = new Date().toISOString();
  const habit: HabitDoc = {
    id,
    title,
    targetMinutes,
    frequency,
    streak: 0,
    completedDates: [],
    active: true,
    createdAt: now,
    updatedAt: now,
  };

  try {
    const docRef = doc(firestore, HABITS_PATH, id);
    await setDoc(docRef, {
      ...habit,
      completedDates: JSON.stringify(habit.completedDates),
    });
    return habit;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `${HABITS_PATH}/${id}`);
  }
}

export async function toggleHabitDateInFirestore(
  habitId: string,
  dateStr: string,
  currentDates: string[]
): Promise<{ completed: boolean; streak: number; dates: string[] }> {
  const has = currentDates.includes(dateStr);
  const updated = has
    ? currentDates.filter((d) => d !== dateStr)
    : [...currentDates, dateStr].sort();

  // Calculate streak from sorted dates
  let streak = 0;
  const cursor = new Date();
  const fmt = (d: Date) => d.toISOString().slice(0, 10);
  const set = new Set(updated);
  if (!set.has(fmt(cursor))) {
    cursor.setDate(cursor.getDate() - 1);
  }
  while (set.has(fmt(cursor))) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }

  try {
    const docRef = doc(firestore, HABITS_PATH, habitId);
    await updateDoc(docRef, {
      completedDates: JSON.stringify(updated),
      streak,
      updatedAt: new Date().toISOString(),
    });
    return { completed: !has, streak, dates: updated };
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${HABITS_PATH}/${habitId}`);
  }
}

export async function deleteHabitFromFirestore(habitId: string): Promise<void> {
  try {
    const docRef = doc(firestore, HABITS_PATH, habitId);
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${HABITS_PATH}/${habitId}`);
  }
}
