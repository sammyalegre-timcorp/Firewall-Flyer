import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import {
  getFirestore,
  doc,
  setDoc,
  getDocs,
  collection,
  onSnapshot,
  getDocFromServer,
  deleteDoc,
  increment,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { AttendeeRegistration, EventSession, ScoreEntry, GameSessionData, AppConfig } from '../types/game';

// Initialize Firebase App & Firestore with specific database ID
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Validation connection test on initial boot
export async function testConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'events', 'connection_probe'));
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firebase client is offline, working in local sync mode.');
    }
    return false;
  }
}

// -------------------------------------------------------------
// EVENT FIRESTORE SYNC
// -------------------------------------------------------------
export async function saveEventToFirestore(event: EventSession): Promise<void> {
  const path = `events/${event.id}`;
  try {
    await setDoc(doc(db, 'events', event.id), {
      id: event.id,
      name: event.name,
      code: event.code,
      description: event.description || '',
      createdAt: event.createdAt,
      isActive: event.isActive,
      highScore: event.highScore || 0,
    }, { merge: true });
  } catch (err) {
    console.warn(`[Firestore] Event save fallback:`, err);
  }
}

export async function fetchEventsFromFirestore(): Promise<EventSession[]> {
  try {
    const snap = await getDocs(collection(db, 'events'));
    const events: EventSession[] = [];
    snap.forEach((docSnap) => {
      if (docSnap.id !== 'connection_probe') {
        events.push(docSnap.data() as EventSession);
      }
    });
    return events;
  } catch (err) {
    console.warn(`[Firestore] fetchEvents error:`, err);
    return [];
  }
}

export function subscribeToEvents(onData: (events: EventSession[]) => void): () => void {
  const collRef = collection(db, 'events');
  return onSnapshot(
    collRef,
    (snapshot) => {
      const records: EventSession[] = [];
      snapshot.forEach((d) => {
        if (d.id !== 'connection_probe') {
          records.push(d.data() as EventSession);
        }
      });
      if (records.length > 0) {
        onData(records);
      }
    },
    (error) => {
      console.warn(`[Firestore] onSnapshot error for events:`, error);
    }
  );
}

// -------------------------------------------------------------
// ATTENDEE REGISTRATION & SCORES FIRESTORE SYNC
// -------------------------------------------------------------
export async function saveAttendeeToFirestore(attendee: AttendeeRegistration): Promise<void> {
  const eventId = attendee.eventId;
  const path = `events/${eventId}/attendees/${attendee.id}`;
  try {
    await setDoc(doc(db, 'events', eventId, 'attendees', attendee.id), {
      id: attendee.id,
      eventId: attendee.eventId,
      name: attendee.name,
      company: attendee.company || '',
      email: attendee.email,
      contactNumber: attendee.contactNumber || '',
      position: attendee.position || '',
      registeredAt: attendee.registeredAt,
      bestScore: attendee.bestScore || 0,
      coins: attendee.coins || 0,
      totalRuns: attendee.totalRuns || 0,
      lastPlayedAt: attendee.lastPlayedAt || null,
    }, { merge: true });
  } catch (err) {
    console.warn(`[Firestore] Attendee save fallback:`, err);
  }
}

export async function updateAttendeeScoreInFirestore(
  eventId: string,
  attendeeId: string,
  data: { bestScore: number; coins: number; totalRuns: number; lastPlayedAt: string }
): Promise<void> {
  const path = `events/${eventId}/attendees/${attendeeId}`;
  try {
    await setDoc(
      doc(db, 'events', eventId, 'attendees', attendeeId),
      {
        bestScore: data.bestScore,
        coins: data.coins,
        totalRuns: data.totalRuns,
        lastPlayedAt: data.lastPlayedAt,
      },
      { merge: true }
    );
  } catch (err) {
    console.warn(`[Firestore] Attendee score update fallback:`, err);
  }
}

export async function saveScoreEntryToFirestore(score: ScoreEntry): Promise<void> {
  const path = `scores/${score.id}`;
  try {
    await setDoc(doc(db, 'scores', score.id), {
      id: score.id,
      playerName: score.playerName,
      characterName: score.characterName,
      score: score.score,
      coins: score.coins,
      level: score.level,
      date: score.date,
      eventId: (score as any).eventId || null,
    });
  } catch (err) {
    console.warn(`[Firestore] Score entry save fallback:`, err);
  }
}

export async function fetchAttendeesForEvent(eventId: string): Promise<AttendeeRegistration[]> {
  try {
    const snap = await getDocs(collection(db, 'events', eventId, 'attendees'));
    const records: AttendeeRegistration[] = [];
    snap.forEach((d) => {
      records.push(d.data() as AttendeeRegistration);
    });
    return records;
  } catch (err) {
    console.warn(`[Firestore] fetchAttendees error for event ${eventId}:`, err);
    return [];
  }
}

export function subscribeToEventAttendees(
  eventId: string,
  onData: (attendees: AttendeeRegistration[]) => void
): () => void {
  const collRef = collection(db, 'events', eventId, 'attendees');
  return onSnapshot(
    collRef,
    (snapshot) => {
      const records: AttendeeRegistration[] = [];
      snapshot.forEach((d) => {
        records.push(d.data() as AttendeeRegistration);
      });
      onData(records);
    },
    (error) => {
      console.warn(`[Firestore] onSnapshot error for event ${eventId}:`, error);
    }
  );
}

export async function deleteAttendeeFromFirestore(eventId: string, attendeeId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'events', eventId, 'attendees', attendeeId));
  } catch (err) {
    console.warn(`[Firestore] Delete error:`, err);
  }
}

// -------------------------------------------------------------
// CROSS-DEVICE APP SETTINGS & CONFIGURATION SYNC
// -------------------------------------------------------------
export async function saveAppSettingsToFirestore(config: AppConfig): Promise<void> {
  try {
    await setDoc(
      doc(db, 'app_settings', 'global_config'),
      {
        id: 'global_config',
        updatedAt: new Date().toISOString(),
        config: JSON.parse(JSON.stringify(config)),
      },
      { merge: true }
    );
  } catch (err) {
    console.warn(`[Firestore] saveAppSettings fallback:`, err);
  }
}

export async function fetchAppSettingsFromFirestore(): Promise<AppConfig | null> {
  try {
    const snap = await getDocFromServer(doc(db, 'app_settings', 'global_config'));
    if (snap.exists()) {
      const data = snap.data();
      if (data?.config) {
        return data.config as AppConfig;
      }
    }
    return null;
  } catch (err) {
    console.warn(`[Firestore] fetchAppSettings fallback:`, err);
    return null;
  }
}

export function subscribeToAppSettings(onData: (config: AppConfig) => void): () => void {
  return onSnapshot(
    doc(db, 'app_settings', 'global_config'),
    (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        if (data?.config) {
          onData(data.config as AppConfig);
        }
      }
    },
    (error) => {
      console.warn(`[Firestore] subscribeToAppSettings error:`, error);
    }
  );
}

// -------------------------------------------------------------
// REAL-TIME MOBILE CONTROLLER & GAME SESSION SYNC
// -------------------------------------------------------------
export async function updateGameSession(sessionId: string, data: Partial<GameSessionData>): Promise<void> {
  try {
    await setDoc(doc(db, 'game_sessions', sessionId), {
      ...data,
      sessionId,
      updatedAt: new Date().toISOString(),
    }, { merge: true });
  } catch (err) {
    console.warn(`[Firestore] GameSession update fallback:`, err);
  }
}

export async function sendControllerFlap(sessionId: string): Promise<void> {
  try {
    await setDoc(doc(db, 'game_sessions', sessionId), {
      flapTrigger: increment(1),
      lastFlapAt: Date.now(),
      updatedAt: new Date().toISOString(),
    }, { merge: true });
  } catch (err) {
    console.warn(`[Firestore] sendControllerFlap fallback:`, err);
  }
}

export function subscribeToGameSession(
  sessionId: string,
  onUpdate: (session: GameSessionData | null) => void
): () => void {
  const sessionDocRef = doc(db, 'game_sessions', sessionId);
  return onSnapshot(
    sessionDocRef,
    (snapshot) => {
      if (snapshot.exists()) {
        onUpdate(snapshot.data() as GameSessionData);
      } else {
        onUpdate(null);
      }
    },
    (error) => {
      console.warn(`[Firestore] subscribeToGameSession error:`, error);
    }
  );
}
