import { clsx } from "clsx";
import { AnimIn } from "components/AnimIn";
import { motion } from "motion/react";

export default function AuthCard({
  children,
  padding,
}: {
  children: React.ReactNode;
  padding?: string;
}) {
  return (
    <AnimIn delay={0.05}>
      <motion.div
        layout
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        className={clsx(
          // sizing
          "min-h-50 w-107.5 max-w-[90vw]",
          // background & shape
          "bg-white rounded-3xl",
          // shadow
          "shadow-card",
          // flex
          "flex flex-col items-stretch justify-center",
          padding,
          {
            "px-[5vw] sm:px-15 py-15": !padding,
          },
        )}
      >
        {children}
      </motion.div>
    </AnimIn>
  );
}
