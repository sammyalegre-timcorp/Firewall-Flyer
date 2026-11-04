import { AttendeeRegistration, EventSession, EventLeaderboardEntry } from '../types/game';
import {
  saveAttendeeToFirestore,
  updateAttendeeScoreInFirestore,
  saveEventToFirestore,
  deleteAttendeeFromFirestore,
  subscribeToEventAttendees,
  fetchEventsFromFirestore,
  fetchAttendeesForEvent,
  subscribeToEvents,
} from '../lib/firebase';

const EVENTS_KEY = 'tim_events_list_v1';
const ACTIVE_EVENT_KEY = 'tim_active_event_id_v1';
const REGISTRATIONS_KEY = 'tim_attendee_registrations_v1';
const CURRENT_ATTENDEE_SESSION_KEY = 'tim_current_session_attendee_v1';

export const DATA_SYNC_EVENT = 'tim_cross_device_data_synced';

export function onDataSync(callback: () => void): () => void {
  if (typeof window === 'undefined') return () => {};
  window.addEventListener(DATA_SYNC_EVENT, callback);
  return () => {
    window.removeEventListener(DATA_SYNC_EVENT, callback);
  };
}

export function notifyDataSynced(): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(DATA_SYNC_EVENT));
}

export const DEFAULT_EVENT: EventSession = {
  id: 'tim_summit_2026',
  name: 'TIM Technology Summit 2026',
  code: 'TIM-TECH-26',
  description: 'Annual Innovation & Tech Showcase',
  createdAt: '2026-01-01T00:00:00.000Z',
  isActive: true,
};

export function getEvents(): EventSession[] {
  try {
    const raw = localStorage.getItem(EVENTS_KEY);
    if (!raw) {
      saveEvents([DEFAULT_EVENT]);
      return [DEFAULT_EVENT];
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : [DEFAULT_EVENT];
  } catch {
    return [DEFAULT_EVENT];
  }
}

export function mergeRemoteEvents(remoteEvents: EventSession[]): EventSession[] {
  if (!remoteEvents || !Array.isArray(remoteEvents) || remoteEvents.length === 0) {
    return getEvents();
  }
  const current = getEvents();
  const map = new Map<string, EventSession>();

  // Add current local
  current.forEach((item) => {
    map.set(item.id, item);
  });

  // Merge remote items, preserving existing without deleting any data
  remoteEvents.forEach((rem) => {
    if (!rem || !rem.id) return;
    const loc = map.get(rem.id);
    if (!loc) {
      map.set(rem.id, rem);
    } else {
      map.set(rem.id, {
        ...loc,
        ...rem,
        name: rem.name || loc.name,
        code: rem.code || loc.code,
        description: rem.description || loc.description,
        highScore: Math.max(loc.highScore || 0, rem.highScore || 0),
      });
    }
  });

  const merged = Array.from(map.values());
  try {
    localStorage.setItem(EVENTS_KEY, JSON.stringify(merged));
  } catch {}
  notifyDataSynced();
  return merged;
}

export function saveEvents(events: EventSession[]): void {
  try {
    localStorage.setItem(EVENTS_KEY, JSON.stringify(events));
  } catch (err) {
    console.error('Failed to save events locally', err);
  }

  // Sync to Firebase Firestore in background so other devices see it
  events.forEach((ev) => {
    saveEventToFirestore(ev).catch(() => {});
  });
  notifyDataSynced();
}

export function getActiveEventId(): string {
  try {
    const active = localStorage.getItem(ACTIVE_EVENT_KEY);
    if (active) return active;
    const events = getEvents();
    const activeEv = events.find((e) => e.isActive) || events[0] || DEFAULT_EVENT;
    localStorage.setItem(ACTIVE_EVENT_KEY, activeEv.id);
    return activeEv.id;
  } catch {
    return DEFAULT_EVENT.id;
  }
}

export function setActiveEventId(id: string): void {
  try {
    localStorage.setItem(ACTIVE_EVENT_KEY, id);
    const events = getEvents().map((ev) => ({
      ...ev,
      isActive: ev.id === id,
    }));
    saveEvents(events);
  } catch (err) {
    console.error('Failed to set active event', err);
  }
}

export function getActiveEvent(): EventSession {
  const activeId = getActiveEventId();
  const events = getEvents();
  return events.find((e) => e.id === activeId) || events[0] || DEFAULT_EVENT;
}

export function getAllRegistrations(): AttendeeRegistration[] {
  try {
    const raw = localStorage.getItem(REGISTRATIONS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function getRegistrationsForEvent(eventId: string): AttendeeRegistration[] {
  const all = getAllRegistrations();
  return all.filter((r) => r.eventId === eventId);
}

// Check for existing attendee registration in active event
export function checkAttendeeExists(
  eventId: string,
  email?: string,
  name?: string
): AttendeeRegistration | null {
  const attendees = getRegistrationsForEvent(eventId);
  const cleanEmail = (email || '').trim().toLowerCase();
  const cleanName = (name || '').trim().toLowerCase();

  if (cleanEmail) {
    const found = attendees.find(
      (a) => (a.email || '').trim().toLowerCase() === cleanEmail
    );
    if (found) return found;
  }

  if (cleanName) {
    const found = attendees.find(
      (a) => (a.name || '').trim().toLowerCase() === cleanName
    );
    if (found) return found;
  }

  return null;
}

// Get top leaderboard for specific event
export function getEventLeaderboard(eventId: string): EventLeaderboardEntry[] {
  const attendees = getRegistrationsForEvent(eventId);
  const sorted = attendees
    .filter((a) => (a.bestScore || 0) > 0)
    .sort((a, b) => (b.bestScore || 0) - (a.bestScore || 0));

  return sorted.map((a, idx) => ({
    rank: idx + 1,
    attendeeId: a.id,
    name: a.name,
    company: a.company || 'Attendee',
    position: a.position || '',
    score: a.bestScore,
    date: a.lastPlayedAt || a.registeredAt,
  }));
}

// Get highscore to beat for specific event
export function getEventHighScore(eventId: string): { score: number; holderName: string } {
  const lb = getEventLeaderboard(eventId);
  if (lb.length > 0 && lb[0].score > 0) {
    return { score: lb[0].score, holderName: lb[0].name };
  }
  return { score: 0, holderName: 'None' };
}

export function mergeRemoteAttendees(remoteAttendees: AttendeeRegistration[]): AttendeeRegistration[] {
  if (!remoteAttendees || !Array.isArray(remoteAttendees)) return getAllRegistrations();
  
  const current = getAllRegistrations();
  const map = new Map<string, AttendeeRegistration>();

  // Add current local
  current.forEach((item) => {
    map.set(item.id, item);
  });

  // Merge remote items, preferring highest score and run counts
  remoteAttendees.forEach((rem) => {
    if (!rem || !rem.id) return;
    const loc = map.get(rem.id);
    if (!loc) {
      map.set(rem.id, rem);
    } else {
      map.set(rem.id, {
        ...loc,
        ...rem,
        bestScore: Math.max(loc.bestScore || 0, rem.bestScore || 0),
        coins: Math.max(loc.coins || 0, rem.coins || 0),
        totalRuns: Math.max(loc.totalRuns || 0, rem.totalRuns || 0),
        lastPlayedAt: rem.lastPlayedAt || loc.lastPlayedAt,
      });
    }
  });

  const merged = Array.from(map.values());
  try {
    localStorage.setItem(REGISTRATIONS_KEY, JSON.stringify(merged));
  } catch {}
  notifyDataSynced();
  return merged;
}

export async function syncEventsAndAttendeesWithFirestore(): Promise<void> {
  try {
    // 1. Fetch all remote events and merge without deleting local events
    const remoteEvents = await fetchEventsFromFirestore();
    if (remoteEvents && remoteEvents.length > 0) {
      mergeRemoteEvents(remoteEvents);
    }

    // 2. Upload any local events that are not yet in Firestore
    const localEvents = getEvents();
    localEvents.forEach((ev) => {
      saveEventToFirestore(ev).catch(() => {});
    });

    // 3. For each event, fetch all remote attendees and merge without deleting
    for (const ev of localEvents) {
      const remoteAttendees = await fetchAttendeesForEvent(ev.id);
      if (remoteAttendees && remoteAttendees.length > 0) {
        mergeRemoteAttendees(remoteAttendees);
      }
    }

    // 4. Upload any local registrations to Firestore so all devices see them
    const allLocalRegs = getAllRegistrations();
    allLocalRegs.forEach((reg) => {
      saveAttendeeToFirestore(reg).catch(() => {});
    });

    notifyDataSynced();
  } catch (err) {
    console.warn('[Sync] Cross-device sync error:', err);
  }
}

export function initGlobalCrossDeviceSync(): () => void {
  const unsubscribers: (() => void)[] = [];

  // Run initial comprehensive bidirectional sync
  syncEventsAndAttendeesWithFirestore().catch(() => {});

  // Subscribe to real-time events collection updates
  try {
    const unsubEvents = subscribeToEvents((remoteEvents) => {
      mergeRemoteEvents(remoteEvents);
      notifyDataSynced();

      // Listen for attendees on any newly discovered events
      remoteEvents.forEach((ev) => {
        try {
          const unsubAtt = subscribeToEventAttendees(ev.id, (remoteAtts) => {
            mergeRemoteAttendees(remoteAtts);
          });
          unsubscribers.push(unsubAtt);
        } catch {}
      });
    });
    unsubscribers.push(unsubEvents);
  } catch (err) {
    console.warn('[Sync] subscribeToEvents failed:', err);
  }

  // Subscribe to real-time attendee updates for all known events
  const currentEvents = getEvents();
  currentEvents.forEach((ev) => {
    try {
      const unsubAtt = subscribeToEventAttendees(ev.id, (remoteAtts) => {
        mergeRemoteAttendees(remoteAtts);
      });
      unsubscribers.push(unsubAtt);
    } catch {}
  });

  return () => {
    unsubscribers.forEach((fn) => {
      try {
        fn();
      } catch {}
    });
  };
}

export function saveRegistration(data: {
  name: string;
  company: string;
  email: string;
  contactNumber: string;
  position: string;
  eventId?: string;
}): AttendeeRegistration {
  const all = getAllRegistrations();
  const activeId = data.eventId || getActiveEventId();

  // Check if already registered by email in this event
  const cleanEmail = data.email.trim().toLowerCase();
  const cleanName = data.name.trim().toLowerCase();

  const existingIndex = all.findIndex(
    (r) =>
      r.eventId === activeId &&
      ((cleanEmail && r.email.trim().toLowerCase() === cleanEmail) ||
        (cleanName && r.name.trim().toLowerCase() === cleanName))
  );

  let registration: AttendeeRegistration;

  if (existingIndex >= 0) {
    // Update existing attendee info
    all[existingIndex] = {
      ...all[existingIndex],
      name: data.name.trim(),
      company: data.company.trim(),
      email: data.email.trim() || all[existingIndex].email,
      contactNumber: data.contactNumber.trim() || all[existingIndex].contactNumber,
      position: data.position.trim() || all[existingIndex].position,
    };
    registration = all[existingIndex];
  } else {
    registration = {
      id: `reg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      eventId: activeId,
      name: data.name.trim(),
      company: data.company.trim(),
      email: data.email.trim(),
      contactNumber: data.contactNumber.trim(),
      position: data.position.trim(),
      registeredAt: new Date().toISOString(),
      bestScore: 0,
      coins: 0,
      totalRuns: 0,
    };
    all.unshift(registration);
  }

  try {
    localStorage.setItem(REGISTRATIONS_KEY, JSON.stringify(all));
    sessionStorage.setItem(CURRENT_ATTENDEE_SESSION_KEY, JSON.stringify(registration));
  } catch (err) {
    console.error('Failed to save registration locally', err);
  }
  notifyDataSynced();

  // Persist to Firebase Firestore
  saveAttendeeToFirestore(registration).catch((err) => {
    console.warn('Firebase sync delayed/queued:', err);
  });

  return registration;
}

export function setCurrentSessionAttendee(attendee: AttendeeRegistration): void {
  try {
    sessionStorage.setItem(CURRENT_ATTENDEE_SESSION_KEY, JSON.stringify(attendee));
  } catch (err) {
    console.error('Failed to set session attendee', err);
  }
}

export function getCurrentSessionAttendee(): AttendeeRegistration | null {
  try {
    const raw = sessionStorage.getItem(CURRENT_ATTENDEE_SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function clearCurrentSessionAttendee(): void {
  try {
    sessionStorage.removeItem(CURRENT_ATTENDEE_SESSION_KEY);
  } catch {}
}

export function updateAttendeeScore(attendeeId: string, coins: number): AttendeeRegistration | null {
  const all = getAllRegistrations();
  const index = all.findIndex((r) => r.id === attendeeId);
  if (index === -1) return null;

  const current = all[index];
  const newBest = Math.max(current.bestScore, coins);
  const now = new Date().toISOString();
  const updated: AttendeeRegistration = {
    ...current,
    bestScore: newBest,
    coins: newBest,
    totalRuns: (current.totalRuns || 0) + 1,
    lastPlayedAt: now,
  };

  all[index] = updated;

  try {
    localStorage.setItem(REGISTRATIONS_KEY, JSON.stringify(all));
    sessionStorage.setItem(CURRENT_ATTENDEE_SESSION_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error('Failed to update attendee score locally', err);
  }
  notifyDataSynced();

  // Persist directly to Firebase Firestore
  updateAttendeeScoreInFirestore(updated.eventId, updated.id, {
    bestScore: updated.bestScore,
    coins: updated.coins,
    totalRuns: updated.totalRuns,
    lastPlayedAt: now,
  }).catch((err) => {
    console.warn('Firebase score update deferred:', err);
  });

  return updated;
}

export function deleteRegistration(eventId: string, regId: string): void {
  const all = getAllRegistrations().filter((r) => r.id !== regId);
  try {
    localStorage.setItem(REGISTRATIONS_KEY, JSON.stringify(all));
  } catch (err) {
    console.error(err);
  }
  notifyDataSynced();

  // Delete from Firestore
  deleteAttendeeFromFirestore(eventId, regId).catch(() => {});
}

export function clearRegistrationsForEvent(eventId: string): void {
  const currentEventAttendees = getAllRegistrations().filter((r) => r.eventId === eventId);
  const remaining = getAllRegistrations().filter((r) => r.eventId !== eventId);
  try {
    localStorage.setItem(REGISTRATIONS_KEY, JSON.stringify(remaining));
  } catch (err) {
    console.error(err);
  }

  currentEventAttendees.forEach((attendee) => {
    deleteAttendeeFromFirestore(eventId, attendee.id).catch(() => {});
  });
}

// -------------------------------------------------------------
// EXPORT HELPERS: DOWNLOAD DATA/SCORES PER EVENT FILE
// -------------------------------------------------------------
export function exportEventToCSV(eventId: string, eventName?: string): void {
  const records = getRegistrationsForEvent(eventId);
  const safeName = (eventName || eventId).replace(/[^a-zA-Z0-9_-]/g, '_');
  const filename = `${safeName}_Registers_${new Date().toISOString().split('T')[0]}.csv`;

  const headers = [
    'Registration ID',
    'Event ID',
    'Name',
    'Company',
    'Position',
    'Email',
    'Contact Number',
    'Best Score (Coins)',
    'Total Flight Runs',
    'Registration Date',
    'Last Played Date',
  ];

  const rows = records.map((r) => [
    `"${r.id}"`,
    `"${r.eventId}"`,
    `"${(r.name || '').replace(/"/g, '""')}"`,
    `"${(r.company || '').replace(/"/g, '""')}"`,
    `"${(r.position || '').replace(/"/g, '""')}"`,
    `"${(r.email || '').replace(/"/g, '""')}"`,
    `"${(r.contactNumber || '').replace(/"/g, '""')}"`,
    r.bestScore,
    r.totalRuns,
    `"${r.registeredAt}"`,
    `"${r.lastPlayedAt || ''}"`,
  ]);

  const csvContent = [headers.join(','), ...rows.map((e) => e.join(','))].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function exportEventToJSON(eventId: string, eventName?: string): void {
  const records = getRegistrationsForEvent(eventId);
  const safeName = (eventName || eventId).replace(/[^a-zA-Z0-9_-]/g, '_');
  const filename = `${safeName}_Registers_${new Date().toISOString().split('T')[0]}.json`;

  const payload = {
    exportedAt: new Date().toISOString(),
    eventId,
    eventName: eventName || eventId,
    totalRegistered: records.length,
    records,
  };

  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
