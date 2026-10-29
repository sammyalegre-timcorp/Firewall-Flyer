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
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { AttendeeRegistration, EventSession, ScoreEntry } from '../types/game';

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
    });
  } catch (err) {
    console.warn(`[Firestore] Event save fallback:`, err);
  }
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
