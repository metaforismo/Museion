import type { DashboardSnapshot } from "@/lib/dashboard";
import { maiaNextStepReason } from "@/lib/maia/next-step";
import styles from "./maia-next-step.module.css";

export default function MaiaNextStep({ action, dailyMinutes }: {
  action: DashboardSnapshot["nextAction"];
  dailyMinutes?: 10 | 20 | 30;
}) {
  return <div className={styles.note}>
    <p className={styles.label}>A nudge from Maia</p>
    <p className={styles.reason}>{maiaNextStepReason(action)}</p>
    {dailyMinutes && <p className={styles.pace}>Your plan: {dailyMinutes} minutes a day. Take it one step at a time.</p>}
  </div>;
}
