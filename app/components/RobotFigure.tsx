import type { MotionPose } from '../lib/motion';

const SPRITE_WIDTH = 1168;
const SPRITE_HEIGHT = 1346;

function Sprite() {
  return (
    <image
      href="/gesturebot-robot-v2.png"
      width={SPRITE_WIDTH}
      height={SPRITE_HEIGHT}
      preserveAspectRatio="xMidYMid meet"
    />
  );
}

export function RobotFigure({ pose, live }: { pose: MotionPose; live: boolean }) {
  const headScaleX = 1 - Math.abs(pose.headYaw) / 260;
  const headShiftX = pose.headYaw * 0.72;
  const headShiftY = pose.headPitch * 0.34;

  return (
    <div className={`robot-v2 ${live ? 'is-live' : ''}`} role="img" aria-label="Robô humanoide articulado controlado pelos dedos">
      <div className="robot-v2-halo" aria-hidden="true" />
      <svg viewBox={`0 0 ${SPRITE_WIDTH} ${SPRITE_HEIGHT}`} role="img" aria-hidden="true">
        <defs>
          <clipPath id="gb-head"><rect x="382" y="0" width="405" height="310" rx="42" /></clipPath>
          <clipPath id="gb-body"><path d="M432 260H736L816 318L826 560L735 665L760 745L700 797H468L408 745L433 665L342 560L352 318Z" /></clipPath>
          <clipPath id="gb-left-upper"><path d="M244 277H455L470 535L308 590L244 463Z" /></clipPath>
          <clipPath id="gb-left-lower"><path d="M207 485H393L391 899H195Z" /></clipPath>
          <clipPath id="gb-right-upper"><path d="M713 277H924L924 463L860 590L698 535Z" /></clipPath>
          <clipPath id="gb-right-lower"><path d="M775 485H961L973 899H777Z" /></clipPath>
          <clipPath id="gb-left-thigh"><path d="M318 650H580L557 948H305Z" /></clipPath>
          <clipPath id="gb-left-calf"><path d="M279 865H552L562 1338H248Z" /></clipPath>
          <clipPath id="gb-right-thigh"><path d="M588 650H850L863 948H611Z" /></clipPath>
          <clipPath id="gb-right-calf"><path d="M616 865H889L920 1338H606Z" /></clipPath>
          <filter id="gb-cyan-glow" x="-80%" y="-80%" width="260%" height="260%">
            <feGaussianBlur stdDeviation="10" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>

        <g className="robot-v2-body" transform={`rotate(${pose.torsoLean} 584 690)`}>
          <g className="robot-v2-leg" transform={`rotate(${pose.leftHip} 455 706)`}>
            <g clipPath="url(#gb-left-thigh)"><Sprite /></g>
            <g transform={`rotate(${pose.leftKnee} 420 913)`}>
              <g clipPath="url(#gb-left-calf)"><Sprite /></g>
            </g>
          </g>
          <g className="robot-v2-leg" transform={`rotate(${pose.rightHip} 713 706)`}>
            <g clipPath="url(#gb-right-thigh)"><Sprite /></g>
            <g transform={`rotate(${pose.rightKnee} 748 913)`}>
              <g clipPath="url(#gb-right-calf)"><Sprite /></g>
            </g>
          </g>

          <g className="robot-v2-arm" transform={`rotate(${pose.leftShoulder} 371 354)`}>
            <g clipPath="url(#gb-left-upper)"><Sprite /></g>
            <g transform={`rotate(${pose.leftElbow} 325 535)`}>
              <g clipPath="url(#gb-left-lower)"><Sprite /></g>
            </g>
          </g>
          <g className="robot-v2-arm" transform={`rotate(${pose.rightShoulder} 797 354)`}>
            <g clipPath="url(#gb-right-upper)"><Sprite /></g>
            <g transform={`rotate(${pose.rightElbow} 843 535)`}>
              <g clipPath="url(#gb-right-lower)"><Sprite /></g>
            </g>
          </g>

          <g clipPath="url(#gb-body)"><Sprite /></g>

          <g
            className="robot-v2-head"
            transform={`translate(${headShiftX} ${headShiftY}) rotate(${pose.headRoll} 584 286) translate(${584 * (1 - headScaleX)} 0) scale(${headScaleX} 1)`}
          >
            <g clipPath="url(#gb-head)"><Sprite /></g>
          </g>

          <g className="motion-rig" filter="url(#gb-cyan-glow)">
            <circle cx="584" cy="286" r="13" />
            <circle cx="371" cy="354" r="12" /><circle cx="325" cy="535" r="10" />
            <circle cx="797" cy="354" r="12" /><circle cx="843" cy="535" r="10" />
            <circle cx="455" cy="706" r="12" /><circle cx="420" cy="913" r="10" />
            <circle cx="713" cy="706" r="12" /><circle cx="748" cy="913" r="10" />
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
