import type { NormalizedLandmark } from '@mediapipe/tasks-vision';

export type MotionPose = {
  headYaw: number;
  headPitch: number;
  headRoll: number;
  torsoLean: number;
  leftShoulder: number;
  leftElbow: number;
  rightShoulder: number;
  rightElbow: number;
  leftHip: number;
  leftKnee: number;
  rightHip: number;
  rightKnee: number;
};

export const NEUTRAL_POSE: MotionPose = {
  headYaw: 0,
  headPitch: 0,
  headRoll: 0,
  torsoLean: 0,
  leftShoulder: 2,
  leftElbow: 0,
  rightShoulder: -2,
  rightElbow: 0,
  leftHip: 0,
  leftKnee: 0,
  rightHip: 0,
  rightKnee: 0,
};

const FINGER_JOINTS = [
  [1, 2, 3, 4],
  [5, 6, 7, 8],
  [9, 10, 11, 12],
  [13, 14, 15, 16],
  [17, 18, 19, 20],
] as const;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function distance(a: NormalizedLandmark, b: NormalizedLandmark) {
  return Math.hypot(a.x - b.x, a.y - b.y, (a.z ?? 0) - (b.z ?? 0));
}

function angle(a: NormalizedLandmark, b: NormalizedLandmark, c: NormalizedLandmark) {
  const ab = { x: a.x - b.x, y: a.y - b.y, z: (a.z ?? 0) - (b.z ?? 0) };
  const cb = { x: c.x - b.x, y: c.y - b.y, z: (c.z ?? 0) - (b.z ?? 0) };
  const dot = ab.x * cb.x + ab.y * cb.y + ab.z * cb.z;
  const magA = Math.hypot(ab.x, ab.y, ab.z);
  const magC = Math.hypot(cb.x, cb.y, cb.z);
  return Math.acos(clamp(dot / Math.max(magA * magC, 0.00001), -1, 1)) * (180 / Math.PI);
}

function smoothStep(value: number) {
  const normalized = clamp((value - 0.06) / 0.88, 0, 1);
  return normalized * normalized * (3 - 2 * normalized);
}

export function fingerCurls(landmarks: NormalizedLandmark[]) {
  return FINGER_JOINTS.map(([mcp, pip, dip, tip], index) => {
    const firstJoint = angle(landmarks[mcp], landmarks[pip], landmarks[dip]);
    const secondJoint = angle(landmarks[pip], landmarks[dip], landmarks[tip]);
    const angleCurl = clamp((170 - (firstJoint * 0.58 + secondJoint * 0.42)) / 108, 0, 1);
    const fullLength = distance(landmarks[mcp], landmarks[pip])
      + distance(landmarks[pip], landmarks[dip])
      + distance(landmarks[dip], landmarks[tip]);
    const reach = distance(landmarks[mcp], landmarks[tip]) / Math.max(fullLength, 0.00001);
    const reachCurl = clamp((0.93 - reach) / (index === 0 ? 0.36 : 0.5), 0, 1);
    return smoothStep(angleCurl * 0.74 + reachCurl * 0.26);
  });
}

export function poseFromHand(landmarks: NormalizedLandmark[], curls: number[]): MotionPose {
  const palmWidth = Math.max(distance(landmarks[5], landmarks[17]), 0.045);
  const middleLateral = (landmarks[12].x - landmarks[9].x) / palmWidth;
  const middleVertical = (landmarks[12].y - landmarks[9].y) / palmWidth;
  const palmRoll = Math.atan2(
    landmarks[9].x - landmarks[0].x,
    landmarks[0].y - landmarks[9].y,
  ) * (180 / Math.PI);

  const thumb = curls[0];
  const index = curls[1];
  const middle = curls[2];
  const ring = curls[3];
  const pinky = curls[4];

  return {
    headYaw: clamp(-middleLateral * 48, -34, 34),
    headPitch: clamp((middle - 0.42) * 46 + (middleVertical + 1.55) * 5, -19, 24),
    headRoll: clamp(palmRoll * 0.28, -13, 13),
    torsoLean: clamp(palmRoll * 0.12, -6, 6),
    leftShoulder: 2 + index * 72,
    leftElbow: -index * 82,
    rightShoulder: -2 - ring * 72,
    rightElbow: ring * 82,
    leftHip: thumb * 22,
    leftKnee: -thumb * 58,
    rightHip: -pinky * 22,
    rightKnee: pinky * 58,
  };
}

export function smoothPose(current: MotionPose, target: MotionPose) {
  let largestDelta = 0;
  for (const key of Object.keys(target) as (keyof MotionPose)[]) {
    largestDelta = Math.max(largestDelta, Math.abs(target[key] - current[key]));
  }

  const blend = clamp(0.14 + largestDelta / 170, 0.14, 0.38);
  const next = { ...current };
  for (const key of Object.keys(target) as (keyof MotionPose)[]) {
    next[key] += (target[key] - next[key]) * blend;
    if (Math.abs(next[key]) < 0.06) next[key] = 0;
  }
  return next;
}
