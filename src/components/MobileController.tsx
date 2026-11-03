import React, { useState, useEffect, useRef } from 'react';
import { AppConfig, AttendeeRegistration, GameSessionData } from '../types/game';
import { DEFAULT_REGISTRATION_FIELDS, DEFAULT_BRAND_LOGO } from '../utils/defaultConfig';
import { 
  saveRegistration, 
  checkAttendeeExists, 
  getCurrentSessionAttendee,
  setCurrentSessionAttendee,
  clearCurrentSessionAttendee
} from '../utils/eventStorage';
import { 
  updateGameSession, 
  sendControllerFlap, 
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
  Clock, 
  CheckCircle2, 
  AlertCircle,
  Wifi,
  LogOut,
  ChevronRight
} from 'lucide-react';

interface MobileControllerProps {
  config: AppConfig;
  eventId: string;
}

export const MobileController: React.FC<MobileControllerProps> = ({ config, eventId }) => {
  const isMagic = config.theme === 'magic_academy';
  const sessionId = eventId; // Use active event ID as the default session ID for the arcade booth

  const [attendee, setAttendee] = useState<AttendeeRegistration | null>(() => getCurrentSessionAttendee());
  const [sessionData, setSessionData] = useState<GameSessionData | null>(null);
  const [isPressing, setIsPressing] = useState(false);
  const [tapCounter, setTapCounter] = useState(0);

  // Form Fields
  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [email, setEmail] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [position, setPosition] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Subscribe to live game session from arcade screen
  useEffect(() => {
    const unsub = subscribeToGameSession(sessionId, (data) => {
      setSessionData(data);
    });
    return () => unsub();
  }, [sessionId]);

  // Audio synthesizer for controller tactile feedback
  const playTapAudio = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = isMagic ? 'sine' : 'sawtooth';
      osc.frequency.setValueAtTime(isMagic ? 440 : 160, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(isMagic ? 880 : 380, ctx.currentTime + 0.08);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.08);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.09);
    } catch {}
  };

  const handleFlapPress = () => {
    setIsPressing(true);
    setTapCounter((prev) => prev + 1);

    // Haptic vibration feedback
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try {
        navigator.vibrate(25);
      } catch {}
    }

    playTapAudio();
    sendControllerFlap(sessionId);
  };

  const handleFlapRelease = () => {
    setIsPressing(false);
  };

  const handleRegister = (e: React.FormEvent) => {
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

    setCurrentSessionAttendee(newAttendee);
    setAttendee(newAttendee);

    // Broadcast attendee to the arcade screen session
    updateGameSession(sessionId, {
      activeAttendee: newAttendee,
      status: 'ready',
    });
  };

  const handleSwitchPilot = () => {
    clearCurrentSessionAttendee();
    setAttendee(null);
    setName('');
    setCompany('');
    setEmail('');
    setContactNumber('');
    setPosition('');
  };

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

        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-950/80 border border-emerald-500/40 text-[10px] font-semibold text-emerald-300">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <Wifi className="w-3 h-3 text-emerald-400" />
          <span>Live Sync</span>
        </div>
      </header>

      {/* Main Content Area */}
      {!attendee ? (
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
              <div className="mb-3 p-2 rounded-xl bg-rose-950/70 border border-rose-500/50 text-[11px] text-rose-300 flex items-center gap-1.5">
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
                <span>Connect & Start Flight</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </form>
          </div>
        </main>
      ) : (
        /* ACTIVE CONTROLLER VIEW (GIANT TACTILE BUTTON) */
        <main className="flex-1 flex flex-col items-center justify-between py-4 max-w-sm mx-auto w-full">
          {/* Pilot Info Badge */}
          <div className="w-full bg-slate-900/90 border border-slate-800 rounded-2xl p-3 flex items-center justify-between">
            <div className="min-w-0">
              <span className="text-[10px] text-slate-400 block uppercase font-mono tracking-wider">
                Active Pilot
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
              title="Switch Pilot"
            >
              <LogOut className="w-3 h-3" />
              <span>Switch</span>
            </button>
          </div>

          {/* Live Arcade Status Banner */}
          <div className="w-full my-3">
            {sessionData?.status === 'playing' ? (
              <div className="p-3 rounded-2xl bg-gradient-to-r from-cyan-950/80 via-blue-950/60 to-slate-900 border border-cyan-500/50 flex items-center justify-between text-xs animate-pulse">
                <div className="flex items-center gap-2">
                  <Flame className="w-4 h-4 text-cyan-400" />
                  <span className="font-extrabold text-cyan-200 uppercase tracking-wider">
                    In Flight! Tap to Ascend
                  </span>
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
            ) : sessionData?.status === 'game_over' ? (
              <div className="p-3 rounded-2xl bg-rose-950/80 border border-rose-500/50 text-center space-y-1">
                <div className="text-xs font-bold text-rose-300 uppercase tracking-wider">
                  Flight Finished!
                </div>
                <div className="text-sm font-black text-white">
                  Score: {sessionData?.currentScore ?? 0} {isMagic ? 'snitches' : 'coins'}
                </div>
                {sessionData?.prizeWon && (
                  <div className="text-xs font-bold text-amber-300 flex items-center justify-center gap-1 mt-1">
                    <Trophy className="w-3.5 h-3.5 text-amber-400" />
                    <span>Won: {sessionData.prizeWon}</span>
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
                  Tap the button below to launch into flight!
                </p>
              </div>
            )}
          </div>

          {/* GIANT TACTILE ARCADE BUTTON */}
          <div className="flex-1 flex items-center justify-center w-full py-4">
            <button
              type="button"
              onPointerDown={handleFlapPress}
              onPointerUp={handleFlapRelease}
              onPointerLeave={handleFlapRelease}
              className={`relative w-64 h-64 sm:w-72 sm:h-72 rounded-full border-4 flex flex-col items-center justify-center transition-all duration-75 select-none touch-none shadow-2xl cursor-pointer ${
                isPressing
                  ? 'scale-95 border-amber-300 bg-gradient-to-b from-amber-500 to-yellow-600 shadow-amber-400/80 ring-8 ring-amber-400/40'
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
                TAP TO FLY
              </span>

              <span className={`text-[10px] sm:text-xs font-mono font-bold uppercase tracking-widest mt-1.5 ${
                isPressing ? 'text-amber-950' : 'text-cyan-200/80'
              }`}>
                Tap repeatedly to flap
              </span>

              {/* Tap Counter Chip */}
              <span className={`absolute bottom-4 text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full ${
                isPressing ? 'bg-amber-900 text-amber-200' : 'bg-slate-950/70 text-cyan-300'
              }`}>
                Taps: {tapCounter}
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
