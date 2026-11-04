import React, { useState, useEffect, useRef } from 'react';
import { AppConfig, AttendeeRegistration, GameSessionData } from '../types/game';
import { DEFAULT_REGISTRATION_FIELDS, DEFAULT_BRAND_LOGO } from '../utils/defaultConfig';
import { 
  saveRegistration, 
  getCurrentSessionAttendee,
  setCurrentSessionAttendee,
  clearCurrentSessionAttendee
} from '../utils/eventStorage';
import { 
  updateGameSession, 
  setThrustState, 
  claimDeviceSlot,
  releaseDeviceSlot,
  subscribeToGameSession 
} from '../lib/firebase';
import { 
  User, 
  Building, 
  Mail, 
  Phone, 
  Briefcase, 
  Flame, 
  Sparkles, 
  Zap, 
  Trophy, 
  AlertCircle,
  Wifi,
  LogOut,
  ChevronRight,
  Lock,
  Smartphone,
  Radio,
  Clock
} from 'lucide-react';

interface MobileControllerProps {
  config: AppConfig;
  eventId: string;
}

export const MobileController: React.FC<MobileControllerProps> = ({ config, eventId }) => {
  const isMagic = config.theme === 'magic_academy';
  const sessionId = eventId; // Use active event ID as the default session ID for the arcade booth

  // Persistent Unique Device ID for single-device lock enforcement
  const [deviceId] = useState<string>(() => {
    let id = sessionStorage.getItem('flight_controller_device_id');
    if (!id) {
      id = 'dev_' + Math.random().toString(36).substring(2, 9) + '_' + Date.now().toString(36);
      sessionStorage.setItem('flight_controller_device_id', id);
    }
    return id;
  });

  const [attendee, setAttendee] = useState<AttendeeRegistration | null>(() => getCurrentSessionAttendee());
  const [sessionData, setSessionData] = useState<GameSessionData | null>(null);
  const [isPressing, setIsPressing] = useState(false);
  const [tapCounter, setTapCounter] = useState(0);
  const [disconnectCountdown, setDisconnectCountdown] = useState<number | null>(null);

  // Form Fields
  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [email, setEmail] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [position, setPosition] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Audio Context Ref for tactile hold sound
  const audioCtxRef = useRef<AudioContext | null>(null);
  const oscRef = useRef<OscillatorNode | null>(null);
  const gainRef = useRef<GainNode | null>(null);
  const buttonRef = useRef<HTMLButtonElement | null>(null);

  // Zero-delay native touch handlers for instantaneous mobile response
  useEffect(() => {
    const btn = buttonRef.current;
    if (!btn) return;

    const onTouchStart = (e: TouchEvent) => {
      e.preventDefault();
      handleThrustStart();
    };

    const onTouchEnd = (e: TouchEvent) => {
      e.preventDefault();
      handleThrustEnd();
    };

    const onPointerDown = (e: PointerEvent) => {
      e.preventDefault();
      handleThrustStart();
    };

    const onPointerUp = (e: PointerEvent) => {
      e.preventDefault();
      handleThrustEnd();
    };

    btn.addEventListener('touchstart', onTouchStart, { passive: false });
    btn.addEventListener('touchend', onTouchEnd, { passive: false });
    btn.addEventListener('touchcancel', onTouchEnd, { passive: false });
    btn.addEventListener('pointerdown', onPointerDown, { passive: false });
    btn.addEventListener('pointerup', onPointerUp, { passive: false });
    btn.addEventListener('pointerleave', onPointerUp, { passive: false });

    return () => {
      btn.removeEventListener('touchstart', onTouchStart);
      btn.removeEventListener('touchend', onTouchEnd);
      btn.removeEventListener('touchcancel', onTouchEnd);
      btn.removeEventListener('pointerdown', onPointerDown);
      btn.removeEventListener('pointerup', onPointerUp);
      btn.removeEventListener('pointerleave', onPointerUp);
    };
  }, [sessionId]);

  // Subscribe to live game session from arcade screen
  useEffect(() => {
    const unsub = subscribeToGameSession(sessionId, (data) => {
      setSessionData(data);
    });
    return () => unsub();
  }, [sessionId]);

  // Audio synthesizer for controller tactile feedback & sustained thrust tone
  const startThrustAudio = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      if (!audioCtxRef.current) {
        audioCtxRef.current = new AudioCtx();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }
      if (oscRef.current) {
        try { oscRef.current.stop(); } catch {}
        oscRef.current.disconnect();
      }
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = isMagic ? 'sine' : 'sawtooth';
      const baseFreq = isMagic ? 440 : 140;
      osc.frequency.setValueAtTime(baseFreq, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(baseFreq * 1.5, ctx.currentTime + 0.3);
      gain.gain.setValueAtTime(0.18, ctx.currentTime);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      oscRef.current = osc;
      gainRef.current = gain;
    } catch {}
  };

  const stopThrustAudio = () => {
    try {
      if (gainRef.current && audioCtxRef.current) {
        gainRef.current.gain.linearRampToValueAtTime(0.001, audioCtxRef.current.currentTime + 0.05);
        setTimeout(() => {
          if (oscRef.current) {
            try { oscRef.current.stop(); } catch {}
            oscRef.current.disconnect();
            oscRef.current = null;
          }
        }, 55);
      }
    } catch {}
  };

  // -------------------------------------------------------------
  // LONG PRESS / CONTINUOUS THRUST HANDLERS
  // -------------------------------------------------------------
  const handleThrustStart = (e?: React.SyntheticEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setIsPressing(true);
    setTapCounter((prev) => prev + 1);

    // Haptic vibration feedback
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try {
        navigator.vibrate(35);
      } catch {}
    }

    startThrustAudio();
    // Transmit sustained thrust and immediate flap impulse to game screen
    updateGameSession(sessionId, {
      isThrusting: true,
      flapTrigger: Date.now(),
    });
  };

  const handleThrustEnd = (e?: React.SyntheticEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setIsPressing(false);
    stopThrustAudio();
    // Cease thrust
    setThrustState(sessionId, false);
  };

  // -------------------------------------------------------------
  // REGISTRATION & CLAIMING CONTROLLER SLOT (ONLY ONE DEVICE)
  // -------------------------------------------------------------
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    const regFields = config.settings.registrationFields || DEFAULT_REGISTRATION_FIELDS;

    if (!name.trim()) {
      setErrorMsg('Full Name is required.');
      return;
    }
    if (regFields.company.show && regFields.company.required && !company.trim()) {
      setErrorMsg('Company is required.');
      return;
    }
    if (regFields.email.show && regFields.email.required && !email.trim()) {
      setErrorMsg('Email Address is required.');
      return;
    }
    if (regFields.contactNumber.show && regFields.contactNumber.required && !contactNumber.trim()) {
      setErrorMsg('Contact Number is required.');
      return;
    }
    if (regFields.position.show && regFields.position.required && !position.trim()) {
      setErrorMsg('Position is required.');
      return;
    }

    const newAttendee = saveRegistration({
      name: name.trim(),
      company: company.trim() || 'Attendee',
      email: email.trim() || `${name.trim().toLowerCase().replace(/\s+/g, '.')}@mobile.event`,
      contactNumber: contactNumber.trim() || '—',
      position: position.trim() || 'Guest',
      eventId: config.settings.activeEventId,
    });

    // Attempt to claim the exclusive single device slot
    const claimResult = await claimDeviceSlot(sessionId, deviceId, name.trim(), newAttendee);
    if (!claimResult.success) {
      setErrorMsg(claimResult.message || 'Cockpit is occupied by another device. Only 1 device allowed.');
      return;
    }

    setErrorMsg(null);
    setCurrentSessionAttendee(newAttendee);
    setAttendee(newAttendee);
  };

  // Disconnect & Reset Controller
  const handleSwitchPilot = async () => {
    setIsPressing(false);
    stopThrustAudio();
    clearCurrentSessionAttendee();
    setAttendee(null);
    setName('');
    setCompany('');
    setEmail('');
    setContactNumber('');
    setPosition('');
    setErrorMsg(null);
    setDisconnectCountdown(null);

    // Release slot if this device holds it
    if (sessionData?.connectedDeviceId === deviceId) {
      await releaseDeviceSlot(sessionId);
    }
  };

  // -------------------------------------------------------------
  // GAME OVER: CONTROLLER STAYS CONNECTED (NO AUTO-RETURN TO REGISTRATION)
  // -------------------------------------------------------------
  useEffect(() => {
    setDisconnectCountdown(null);
  }, [sessionData?.status, sessionData?.gameOver]);

  // When arcade screen clears the slot, auto-disconnect this device
  useEffect(() => {
    if (attendee && sessionData && sessionData.connectedDeviceId === null && sessionData.status === 'ready') {
      handleSwitchPilot();
    }
  }, [sessionData?.connectedDeviceId, sessionData?.status, attendee]);

  // Check if another device has claimed the single device slot
  const isAnotherDeviceConnected = Boolean(
    sessionData?.connectedDeviceId &&
    sessionData.connectedDeviceId !== deviceId &&
    sessionData.status !== 'game_over'
  );

  return (
    <div className="min-h-screen w-full bg-[#040612] text-white flex flex-col justify-between p-4 sm:p-6 select-none font-sans overflow-x-hidden">
      {/* Top Mobile Header */}
      <header className="flex items-center justify-between pb-3 border-b border-slate-800/80">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-white p-1 border border-slate-700 flex items-center justify-center shrink-0 shadow-md">
            <img
              src={config.branding.customLogoDataUrl || config.branding.logoUrl || DEFAULT_BRAND_LOGO}
              alt="Brand Logo"
              className="w-full h-full object-contain"
            />
          </div>
          <div>
            <h1 className="text-xs font-black uppercase tracking-wider text-white leading-tight">
              {config.branding.brandName || 'TIM'} Flight Controller
            </h1>
            <span className="text-[10px] font-mono text-cyan-400">
              {config.settings.activeEventName || 'Event Session'}
            </span>
          </div>
        </div>

        {/* Live Controller Connection Status */}
        {attendee && sessionData?.connectedDeviceId === deviceId ? (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-950/80 border border-emerald-500/50 text-[10px] font-bold text-emerald-300 shadow-sm shadow-emerald-500/20">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <Radio className="w-3 h-3 text-emerald-400" />
            <span>Connected (Slot 1)</span>
          </div>
        ) : isAnotherDeviceConnected ? (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-950/80 border border-amber-500/50 text-[10px] font-bold text-amber-300">
            <Lock className="w-3 h-3 text-amber-400" />
            <span>Cockpit Busy</span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900 border border-slate-700 text-[10px] font-semibold text-slate-300">
            <Wifi className="w-3 h-3 text-slate-400" />
            <span>Ready to Connect</span>
          </div>
        )}
      </header>

      {/* Main Content Area */}
      {isAnotherDeviceConnected ? (
        /* SINGLE DEVICE LOCK ENFORCEMENT: COCKPIT OCCUPIED */
        <main className="my-auto py-6 max-w-sm mx-auto w-full text-center">
          <div className="bg-slate-900/95 border-2 border-amber-500/50 rounded-3xl p-6 shadow-2xl backdrop-blur-md">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center justify-center mx-auto mb-3 shadow-inner">
              <Lock className="w-7 h-7" />
            </div>

            <span className="text-[10px] font-mono font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-amber-950 text-amber-300 border border-amber-500/40 mb-2 inline-block">
              Single Device Lock
            </span>

            <h2 className="text-lg font-black uppercase tracking-wide text-white mb-1">
              Cockpit Occupied
            </h2>

            <p className="text-xs text-slate-300 leading-relaxed mb-4">
              Another pilot is currently piloting the flight controls:
            </p>

            <div className="p-3 rounded-2xl bg-slate-950/90 border border-slate-800 text-left mb-4">
              <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
                Current Connected Pilot
              </div>
              <div className="text-sm font-bold text-cyan-300 truncate">
                {sessionData?.connectedDeviceName || 'Active Pilot'}
              </div>
              <div className="flex items-center gap-1.5 mt-1 text-[11px] text-amber-400 font-mono">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                <span>Flight in progress on main screen</span>
              </div>
            </div>

            <p className="text-[11px] text-slate-400 leading-tight">
              Only <strong>ONE device</strong> can be connected at a time. This screen will automatically become available as soon as the current flight finishes!
            </p>
          </div>
        </main>
      ) : !attendee ? (
        /* REGISTRATION FORM (MOBILE OPTIMIZED) */
        <main className="my-auto py-4 max-w-sm mx-auto w-full">
          <div className="bg-slate-900/90 border border-purple-500/40 rounded-3xl p-5 shadow-2xl backdrop-blur-md">
            <div className="text-center mb-4">
              <div className="w-10 h-10 rounded-2xl bg-purple-500/20 text-purple-400 border border-purple-500/30 flex items-center justify-center mx-auto mb-2">
                <Zap className="w-5 h-5" />
              </div>
              <h2 className="text-base font-black uppercase tracking-wide text-white">
                Pilot Registration
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Register to take control of the arcade screen flight!
              </p>
            </div>

            {errorMsg && (
              <div className="mb-3 p-2.5 rounded-xl bg-rose-950/70 border border-rose-500/50 text-[11px] text-rose-300 flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleRegister} className="space-y-3">
              {/* Full Name (Mandatory) */}
              <div>
                <label className="text-[11px] font-bold text-slate-300 block mb-1 flex items-center gap-1">
                  <User className="w-3 h-3 text-cyan-400" />
                  <span>Full Name *</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your full name"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                />
              </div>

              {/* Company */}
              {(config.settings.registrationFields?.company.show ?? true) && (
                <div>
                  <label className="text-[11px] font-bold text-slate-300 block mb-1 flex items-center gap-1">
                    <Building className="w-3 h-3 text-purple-400" />
                    <span>Company {config.settings.registrationFields?.company.required ? '*' : ''}</span>
                  </label>
                  <input
                    type="text"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    placeholder="Enter company or school"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-400"
                  />
                </div>
              )}

              {/* Email */}
              {(config.settings.registrationFields?.email.show ?? true) && (
                <div>
                  <label className="text-[11px] font-bold text-slate-300 block mb-1 flex items-center gap-1">
                    <Mail className="w-3 h-3 text-emerald-400" />
                    <span>Email {config.settings.registrationFields?.email.required ? '*' : ''}</span>
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@company.com"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-400"
                  />
                </div>
              )}

              {/* Contact Number */}
              {(config.settings.registrationFields?.contactNumber.show ?? true) && (
                <div>
                  <label className="text-[11px] font-bold text-slate-300 block mb-1 flex items-center gap-1">
                    <Phone className="w-3 h-3 text-amber-400" />
                    <span>Contact Number {config.settings.registrationFields?.contactNumber.required ? '*' : ''}</span>
                  </label>
                  <input
                    type="tel"
                    value={contactNumber}
                    onChange={(e) => setContactNumber(e.target.value)}
                    placeholder="+63 900 000 0000"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                  />
                </div>
              )}

              {/* Position */}
              {(config.settings.registrationFields?.position.show ?? true) && (
                <div>
                  <label className="text-[11px] font-bold text-slate-300 block mb-1 flex items-center gap-1">
                    <Briefcase className="w-3 h-3 text-pink-400" />
                    <span>Position / Job Title {config.settings.registrationFields?.position.required ? '*' : ''}</span>
                  </label>
                  <input
                    type="text"
                    value={position}
                    onChange={(e) => setPosition(e.target.value)}
                    placeholder="e.g. IT Director, Developer"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-pink-400"
                  />
                </div>
              )}

              <button
                type="submit"
                className="w-full mt-4 py-3 rounded-2xl bg-gradient-to-r from-cyan-400 via-sky-400 to-purple-500 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg shadow-cyan-500/20 hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Connect &amp; Start Flight</span>
                <ChevronRight className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={async () => {
                  const adminAttendee: AttendeeRegistration = {
                    id: `admin_mob_${Date.now()}`,
                    name: 'Admin Pilot (Mobile)',
                    company: 'Event Administration',
                    email: 'admin@event.local',
                    contactNumber: '—',
                    position: 'Administrator',
                    eventId: config.settings.activeEventId,
                    bestScore: 0,
                    coins: 0,
                    totalRuns: 0,
                    registeredAt: new Date().toISOString(),
                  };
                  const claimResult = await claimDeviceSlot(sessionId, deviceId, adminAttendee.name, adminAttendee);
                  if (!claimResult.success) {
                    setErrorMsg(claimResult.message || 'Cockpit is occupied.');
                    return;
                  }
                  setCurrentSessionAttendee(adminAttendee);
                  setAttendee(adminAttendee);
                }}
                className="w-full mt-2.5 py-2.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>Play as Admin</span>
              </button>
            </form>
          </div>
        </main>
      ) : (
        /* ACTIVE CONTROLLER VIEW (GIANT TACTILE BUTTON WITH LONG-PRESS SUSTAINED FLIGHT) */
        <main className="flex-1 flex flex-col items-center justify-between py-3 max-w-sm mx-auto w-full">
          {/* Pilot Info Badge */}
          <div className="w-full bg-slate-900/90 border border-slate-800 rounded-2xl p-3 flex items-center justify-between">
            <div className="min-w-0">
              <span className="text-[10px] text-slate-400 block uppercase font-mono tracking-wider flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Connected Controller</span>
              </span>
              <strong className="text-sm font-bold text-white truncate block">
                {attendee.name}
              </strong>
              {attendee.company && (
                <span className="text-[11px] text-purple-300 truncate block">
                  {attendee.company}
                </span>
              )}
            </div>

            <button
              onClick={handleSwitchPilot}
              className="px-2.5 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-semibold flex items-center gap-1 transition-colors cursor-pointer border border-slate-700"
              title="Disconnect Controller"
            >
              <LogOut className="w-3 h-3" />
              <span>Disconnect</span>
            </button>
          </div>

          {/* Live Arcade Status Banner */}
          <div className="w-full my-2">
            {sessionData?.status === 'playing' ? (
              <div className="p-3 rounded-2xl bg-gradient-to-r from-cyan-950/80 via-blue-950/60 to-slate-900 border border-cyan-500/50 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <Flame className="w-4 h-4 text-cyan-400 animate-bounce" />
                  <div>
                    <span className="font-black text-cyan-200 uppercase tracking-wider block">
                      In Flight!
                    </span>
                    <span className="text-[10px] text-cyan-300/80">
                      Hold down button to rise
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-mono font-bold text-amber-300">
                    Score: {sessionData?.currentScore ?? 0}
                  </span>
                  {sessionData?.timeRemaining !== undefined && (
                    <span className="font-mono text-slate-300">
                      {sessionData.timeRemaining}s
                    </span>
                  )}
                </div>
              </div>
            ) : sessionData?.status === 'game_over' || Boolean(sessionData?.gameOver) ? (
              <div className="p-3.5 rounded-2xl bg-rose-950/90 border border-rose-500/60 text-center space-y-1.5 shadow-xl animate-fadeIn">
                <div className="text-xs font-bold text-rose-300 uppercase tracking-wider flex items-center justify-center gap-1">
                  <span>Flight Concluded!</span>
                </div>
                <div className="text-base font-black text-white">
                  Score: {sessionData?.currentScore ?? 0} {isMagic ? 'snitches' : 'coins'}
                </div>
                {sessionData?.prizeWon && (
                  <div className="text-xs font-bold text-amber-300 flex items-center justify-center gap-1 mt-1">
                    <Trophy className="w-3.5 h-3.5 text-amber-400" />
                    <span>Won: {sessionData.prizeWon}</span>
                  </div>
                )}
                {disconnectCountdown !== null && (
                  <div className="mt-2 pt-2 border-t border-rose-500/30 flex items-center justify-center gap-1.5 text-[11px] font-mono text-rose-200">
                    <Clock className="w-3 h-3 text-amber-400 animate-spin" />
                    <span>Auto-disconnecting in {disconnectCountdown}s...</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-3 rounded-2xl bg-amber-950/50 border border-amber-500/40 text-center">
                <div className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center justify-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>Arcade Screen Ready</span>
                </div>
                <p className="text-[11px] text-slate-300 mt-0.5">
                  Press &amp; hold the button below to launch into flight!
                </p>
              </div>
            )}
          </div>

          {/* GIANT TACTILE ARCADE BUTTON (PRESS & HOLD / LONG PRESS SUPPORT) */}
          <div className="flex-1 flex items-center justify-center w-full py-2">
            <button
              ref={buttonRef}
              type="button"
              onPointerDown={handleThrustStart}
              onPointerUp={handleThrustEnd}
              onPointerLeave={handleThrustEnd}
              onPointerCancel={handleThrustEnd}
              onTouchStart={handleThrustStart}
              onTouchEnd={handleThrustEnd}
              onTouchCancel={handleThrustEnd}
              onContextMenu={(e) => e.preventDefault()}
              className={`relative w-64 h-64 sm:w-72 sm:h-72 rounded-full border-4 flex flex-col items-center justify-center transition-all duration-75 select-none touch-none shadow-2xl cursor-pointer ${
                isPressing
                  ? 'scale-95 border-amber-300 bg-gradient-to-b from-amber-500 to-yellow-600 shadow-amber-400/90 ring-8 ring-amber-400/40'
                  : 'border-cyan-400 bg-gradient-to-b from-cyan-600 via-sky-700 to-blue-900 shadow-cyan-500/50 ring-4 ring-cyan-500/20 active:scale-95'
              }`}
            >
              {/* Outer Pulse Glow Ring */}
              <div className="absolute inset-0 rounded-full animate-ping opacity-20 bg-cyan-400 pointer-events-none" />

              {/* Icon */}
              <div className={`p-4 rounded-full mb-2 transition-transform duration-75 ${
                isPressing ? 'scale-110 bg-amber-600/40 text-slate-950' : 'bg-cyan-500/30 text-white'
              }`}>
                {isMagic ? (
                  <Sparkles className="w-12 h-12" />
                ) : (
                  <Flame className="w-12 h-12" />
                )}
              </div>

              {/* Text Label */}
              <span className={`text-xl sm:text-2xl font-black uppercase tracking-wider leading-none text-center ${
                isPressing ? 'text-slate-950' : 'text-white'
              }`}>
                {isPressing ? 'THRUSTING...' : 'HOLD TO FLY'}
              </span>

              <span className={`text-[10px] sm:text-xs font-mono font-bold uppercase tracking-widest mt-1.5 ${
                isPressing ? 'text-amber-950' : 'text-cyan-200/80'
              }`}>
                Press &amp; Hold to rise &bull; Release to fall
              </span>

              {/* Tap Counter Chip */}
              <span className={`absolute bottom-4 text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full ${
                isPressing ? 'bg-amber-900 text-amber-200' : 'bg-slate-950/70 text-cyan-300'
              }`}>
                Thrust pulses: {tapCounter}
              </span>
            </button>
          </div>

          <div className="text-center text-[11px] text-slate-400">
            Keep phone awake &bull; Look up at the arcade screen to pilot your flight!
          </div>
        </main>
      )}

      {/* Footer Tag */}
      <footer className="pt-3 border-t border-slate-800/80 text-center">
        <span className="text-[10px] font-bold tracking-wider text-slate-500 uppercase">
          {config.settings.popupFooterText || 'Presented by TIM'}
        </span>
      </footer>
    </div>
  );
};
