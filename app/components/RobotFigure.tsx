import type { MotionPose } from '../lib/motion';

type LimbProps = {
  mirrored?: boolean;
  primaryAngle: number;
  secondaryAngle: number;
};

function Arm({ mirrored = false, primaryAngle, secondaryAngle }: LimbProps) {
  const shoulder = mirrored ? -primaryAngle : primaryAngle;
  const elbow = mirrored ? -secondaryAngle : secondaryAngle;

  return (
    <g transform={mirrored ? 'translate(400 0) scale(-1 1)' : undefined}>
      <g className={`robot-vector-limb robot-arm-${mirrored ? 'right' : 'left'}`} transform={`rotate(${shoulder} 134 184)`}>
        <circle cx="134" cy="184" r="25" fill="url(#jointOuter)" stroke="#071013" strokeWidth="6" />
        <circle cx="134" cy="184" r="14" fill="url(#shellWhite)" stroke="#203039" strokeWidth="4" />
        <circle cx="134" cy="184" r="6" fill="#071216" stroke="#35ddff" strokeWidth="2" />
        <path d="M119 201C111 218 103 241 98 260L123 273C134 252 142 226 145 205Z" fill="url(#shellWhite)" stroke="#071013" strokeWidth="6" strokeLinejoin="round" />
        <path d="M124 209C117 226 112 241 108 254" fill="none" stroke="#31d9ff" strokeWidth="3" strokeLinecap="round" />

        <g className={`robot-vector-limb robot-elbow-${mirrored ? 'right' : 'left'}`} transform={`rotate(${elbow} 111 270)`}>
          <circle cx="111" cy="270" r="18" fill="url(#jointOuter)" stroke="#071013" strokeWidth="5" />
          <circle cx="111" cy="270" r="7" fill="#0a171c" stroke="#31d9ff" strokeWidth="2" />
          <path d="M96 283C90 302 85 328 84 350L111 360C121 337 127 306 126 284Z" fill="url(#shellWhite)" stroke="#071013" strokeWidth="6" strokeLinejoin="round" />
          <path d="M101 290C96 308 93 326 92 340" fill="none" stroke="#31d9ff" strokeWidth="3" strokeLinecap="round" />
          <g transform="translate(94 351)">
            <rect x="-13" y="-3" width="31" height="26" rx="10" fill="url(#jointOuter)" stroke="#071013" strokeWidth="5" />
            <path d="M-7 20L-10 38M1 21L0 41M9 19L12 36" fill="none" stroke="url(#shellWhite)" strokeWidth="7" strokeLinecap="round" />
            <path d="M-7 23L-9 34M1 24L1 37M9 22L11 32" fill="none" stroke="#31d9ff" strokeWidth="1.5" strokeLinecap="round" />
          </g>
        </g>
      </g>
    </g>
  );
}

function Leg({ mirrored = false, primaryAngle, secondaryAngle }: LimbProps) {
  const hip = mirrored ? -primaryAngle : primaryAngle;
  const knee = mirrored ? -secondaryAngle : secondaryAngle;

  return (
    <g transform={mirrored ? 'translate(400 0) scale(-1 1)' : undefined}>
      <g className={`robot-vector-limb robot-leg-${mirrored ? 'right' : 'left'}`} transform={`rotate(${hip} 171 310)`}>
        <circle cx="171" cy="310" r="23" fill="url(#jointOuter)" stroke="#071013" strokeWidth="6" />
        <path d="M151 318C148 339 149 375 155 395L187 397C195 370 196 340 190 318Z" fill="url(#shellWhite)" stroke="#071013" strokeWidth="6" strokeLinejoin="round" />
        <path d="M160 329L161 381" fill="none" stroke="#31d9ff" strokeWidth="3" strokeLinecap="round" />

        <g className={`robot-vector-limb robot-knee-${mirrored ? 'right' : 'left'}`} transform={`rotate(${knee} 171 399)`}>
          <circle cx="171" cy="399" r="19" fill="url(#jointOuter)" stroke="#071013" strokeWidth="6" />
          <circle cx="171" cy="399" r="7" fill="#0a171c" stroke="#31d9ff" strokeWidth="2" />
          <path d="M151 412C147 432 146 463 150 482L187 483C193 459 193 433 188 411Z" fill="url(#shellWhite)" stroke="#071013" strokeWidth="6" strokeLinejoin="round" />
          <path d="M159 423L158 469" fill="none" stroke="#31d9ff" strokeWidth="3" strokeLinecap="round" />
          <path d="M145 477C136 484 132 496 137 504H195C200 497 195 484 185 477Z" fill="url(#shellWhite)" stroke="#071013" strokeWidth="6" strokeLinejoin="round" />
          <path d="M143 497H190" fill="none" stroke="#31d9ff" strokeWidth="3" strokeLinecap="round" />
        </g>
      </g>
    </g>
  );
}

export function RobotFigure({ pose, live }: { pose: MotionPose; live: boolean }) {
  const headScaleX = 1 - Math.abs(pose.headYaw) / 210;
  const headShiftX = pose.headYaw * 0.45;
  const headShiftY = pose.headPitch * 0.2;

  return (
    <div className={`robot-v2 ${live ? 'is-live' : ''}`} role="img" aria-label="Robô humanoide articulado controlado pelos dedos">
      <div className="robot-v2-halo" aria-hidden="true" />
      <svg viewBox="0 0 400 520" role="img" aria-hidden="true">
        <defs>
          <linearGradient id="shellWhite" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#ffffff" />
            <stop offset="0.45" stopColor="#dfe9ef" />
            <stop offset="0.72" stopColor="#93a8b4" />
            <stop offset="1" stopColor="#f7fbfd" />
          </linearGradient>
          <linearGradient id="jointOuter" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#25353d" />
            <stop offset="0.5" stopColor="#050a0d" />
            <stop offset="1" stopColor="#16262e" />
          </linearGradient>
          <linearGradient id="visor" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#17272f" />
            <stop offset="0.5" stopColor="#03070a" />
            <stop offset="1" stopColor="#101c22" />
          </linearGradient>
          <radialGradient id="core" cx="45%" cy="38%" r="60%">
            <stop offset="0" stopColor="#d7fbff" />
            <stop offset="0.35" stopColor="#38ddff" />
            <stop offset="1" stopColor="#08738f" />
          </radialGradient>
          <filter id="vectorGlow" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>

        <g className="robot-v2-body" transform={`rotate(${pose.torsoLean} 200 280)`}>
          <Leg primaryAngle={pose.leftHip} secondaryAngle={pose.leftKnee} />
          <Leg mirrored primaryAngle={pose.rightHip} secondaryAngle={pose.rightKnee} />
          <Arm primaryAngle={pose.leftShoulder} secondaryAngle={pose.leftElbow} />
          <Arm mirrored primaryAngle={pose.rightShoulder} secondaryAngle={pose.rightElbow} />

          <g className="robot-vector-torso">
            <path d="M158 280L149 310C161 328 180 337 200 337C220 337 239 328 251 310L242 280Z" fill="url(#shellWhite)" stroke="#071013" strokeWidth="7" strokeLinejoin="round" />
            <path d="M168 280H232L226 309C211 319 189 319 174 309Z" fill="url(#jointOuter)" stroke="#071013" strokeWidth="5" />
            <path d="M174 174C157 187 151 224 157 272L174 298H226L243 272C249 224 243 187 226 174Z" fill="url(#shellWhite)" stroke="#071013" strokeWidth="8" strokeLinejoin="round" />
            <path d="M184 273H216L224 292L215 311H185L176 292Z" fill="url(#jointOuter)" stroke="#071013" strokeWidth="5" />
            <path d="M183 286H217M181 294H219M185 302H215" fill="none" stroke="#3f5660" strokeWidth="2" />
            <path d="M175 190C166 212 166 244 172 265M225 190C234 212 234 244 228 265" fill="none" stroke="#31d9ff" strokeWidth="4" strokeLinecap="round" />
            <circle cx="200" cy="224" r="24" fill="url(#jointOuter)" stroke="#071013" strokeWidth="5" />
            <circle cx="200" cy="224" r="13" fill="url(#core)" stroke="#67ecff" strokeWidth="3" filter="url(#vectorGlow)" />
          </g>

          <rect x="183" y="135" width="34" height="42" rx="10" fill="url(#jointOuter)" stroke="#071013" strokeWidth="6" />
          <path d="M188 144H212M188 153H212M188 162H212" stroke="#536a75" strokeWidth="3" strokeLinecap="round" />

          <g
            className="robot-v2-head"
            transform={`translate(${headShiftX} ${headShiftY}) rotate(${pose.headRoll} 200 139) translate(${200 * (1 - headScaleX)} 0) scale(${headScaleX} 1)`}
          >
            <rect x="141" y="45" width="118" height="101" rx="40" fill="url(#shellWhite)" stroke="#071013" strokeWidth="8" />
            <rect x="151" y="59" width="98" height="69" rx="27" fill="url(#visor)" stroke="#1f343e" strokeWidth="4" />
            <path d="M160 55C178 42 221 42 241 57" fill="none" stroke="rgba(255,255,255,.75)" strokeWidth="4" strokeLinecap="round" />
            <circle cx="139" cy="95" r="13" fill="url(#shellWhite)" stroke="#071013" strokeWidth="5" />
            <circle cx="261" cy="95" r="13" fill="url(#shellWhite)" stroke="#071013" strokeWidth="5" />
            <path d="M138 86V105M262 86V105" stroke="#31d9ff" strokeWidth="4" strokeLinecap="round" />
            <g transform={`translate(${pose.headYaw * 0.15} ${pose.headPitch * 0.08})`}>
              <circle cx="178" cy="92" r="10" fill="#49e6ff" filter="url(#vectorGlow)" />
              <circle cx="222" cy="92" r="10" fill="#49e6ff" filter="url(#vectorGlow)" />
              <circle cx="178" cy="92" r="4" fill="#dcfbff" />
              <circle cx="222" cy="92" r="4" fill="#dcfbff" />
            </g>
          </g>

        </g>
      </svg>
      <div className="robot-v2-floor" aria-hidden="true" />
      <div className="head-vector" aria-hidden="true">
        <span style={{ transform: `translate(${pose.headYaw * 0.22}px, ${pose.headPitch * 0.12}px)` }} />
      </div>
    </div>
  );
}
