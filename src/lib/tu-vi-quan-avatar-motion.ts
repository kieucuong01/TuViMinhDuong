import type { Group, Sprite } from "three";

type QuanAvatarRig = { body: Group; torso: Group; head: Group; badge: Sprite; legs: Group[]; knees: Group[]; arms: Group[]; elbows: Group[]; bowStarted?: number };

export function poseQuanAvatar(visitor: QuanAvatarRig, action: string, seconds: number, walking: boolean, reduced: boolean) {
    const sitting = action === "meditate" || action === "seated";
    const bowing = action === "bow";
    if (bowing) visitor.bowStarted ??= seconds;
    const fold = bowing ? (reduced ? 1.0 : .15 + Math.sin((seconds - (visitor.bowStarted ?? seconds)) * Math.PI / 4) ** 2 * 1.35) : 0;
    const stride = walking && !reduced ? Math.sin(seconds * 9) * .36 : 0;
    visitor.body.position.y = bowing ? -.30 : sitting ? -.18 : Math.abs(stride) * .025;
    visitor.body.rotation.x = 0;
    visitor.torso.rotation.x = bowing ? fold : action === "greet" ? .08 : 0;
    visitor.head.rotation.x = bowing ? .18 * fold : 0;
    visitor.badge.position.y = sitting || bowing ? 1.73 : 1.98;
    visitor.legs.forEach((leg, i) => {
      leg.rotation.set(bowing ? -1.25 : sitting ? -1.1 : stride * (i === 0 ? 1 : -1), 0, sitting ? (i === 0 ? -.22 : .22) : 0);
      visitor.knees[i].rotation.x = bowing ? 2.2 : sitting ? 1.9 : Math.max(0, -stride * (i === 0 ? 1 : -1)) * .7;
    });
    visitor.arms.forEach((arm, i) => {
      const praying = action === "greet" || action === "incense" || bowing;
      arm.rotation.set(praying ? -1.0 : sitting ? -.35 : -stride * (i === 0 ? 1 : -1), 0, praying ? (i === 0 ? .40 : -.40) : 0);
      visitor.elbows[i].rotation.x = praying ? -1.25 : sitting ? -.85 : -.12;
    });
  }
