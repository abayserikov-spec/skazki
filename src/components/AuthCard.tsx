import { clsx } from "clsx";
import { AnimIn } from "components/AnimIn";

export default function AuthCard({ children }: { children: React.ReactNode }) {
  return (
    <AnimIn delay={0.05}>
      <div
        className={clsx(
          // sizing
          "min-h-106 w-107.5 max-w-[90vw]",
          // spacing
          "px-[5vw] sm:px-15 py-15",
          // background & shape
          "bg-white rounded-3xl",
          // shadow
          "shadow-card",
        )}
      >
        {children}
      </div>
    </AnimIn>
  );
}
