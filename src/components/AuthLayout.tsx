import BgAuthBlue from "assets/image/bg-auth-blue.png";
import BgAuthDot from "assets/image/bg-auth-dot.png";
import { clsx } from "clsx";
import AuthCard from "components/AuthCard";
import { Feather } from "lucide-react";
import { motion } from "motion/react";

export default function AuthLayout({
  children,
  padding,
}: {
  children: React.ReactNode;
  padding?: string;
}) {
  return (
    <div
      className="min-h-screen flex flex-col"
      style={
        {
          "--bg-auth-blue": `url(${BgAuthBlue})`,
          "--bg-auth-dot": `url(${BgAuthDot})`,
        } as React.CSSProperties
      }
    >
      {/* navbar */}
      <div className="h-27 flex items-center justify-center">
        <div className="h-9 w-9 flex items-center justify-center">
          <Feather className="h-7 w-7" />
        </div>
      </div>

      {/* background */}
      <div className={clsx("flex-1 relative", "bg-cream")}>
        <motion.div
          className={clsx(
            // position
            "absolute inset-0 z-0",
            // background
            "bg-(image:--bg-auth-blue) bg-no-repeat bg-center",
            // opacity
            "opacity-36",
          )}
          initial={{ backgroundSize: "max(40%, 40rem)" }}
          animate={{ backgroundSize: "max(50%, 50rem)" }}
          transition={{ duration: 5, ease: [0.22, 1, 0.36, 1] }}
        />
        <div
          className={clsx(
            // position
            "absolute inset-0 z-0",
            // background
            "bg-(image:--bg-auth-dot) bg-repeat bg-top-left bg-size-[1.5rem_1.5rem]",
            // opacity
            "opacity-15",
          )}
        />
      </div>

      {/* card */}
      <div
        className={clsx(
          "absolute inset-0 z-10",
          "flex items-center justify-center",
        )}
      >
        <AuthCard padding={padding}>{children}</AuthCard>
      </div>
    </div>
  );
}
