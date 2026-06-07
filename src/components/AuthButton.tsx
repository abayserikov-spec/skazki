import { clsx } from "clsx";
import { AnimIn } from "components/AnimIn";

type AuthButtonProps = {
  children: React.ReactNode;
  delay?: number;
  onClick?: () => void;
  type?: "button" | "submit";
  disabled?: boolean;
  className?: string;
} & (
  | { variant?: "outline"; icon: React.ComponentType<React.SVGProps<SVGSVGElement>> }
  | { variant: "primary"; icon?: never }
);

export default function AuthButton({
  icon: Icon,
  children,
  delay = 0,
  onClick,
  type = "button",
  disabled,
  className,
  variant = "outline",
}: AuthButtonProps) {
  return (
    <AnimIn delay={delay}>
      <button
        type={type}
        disabled={disabled}
        onClick={onClick}
        className={clsx(
          "flex flex-row justify-center items-center",
          "w-full h-14 rounded-full",
          "font-sans font-bold text-button-sm sm:text-button leading-none",
          "cursor-pointer select-none transition-all duration-200",
          "active:scale-[0.98]",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
          variant === "outline" && [
            "py-5 sm:pr-10 sm:pl-5 gap-5 pr-5 pl-2.5",
            "border-2 border-grey-medium",
            "text-black-secondary",
            "shrink-0 self-stretch",
            "hover:border-black-secondary/30 hover:bg-black-secondary/3 hover:shadow-sm",
            "active:bg-black-secondary/6",
            "focus-visible:ring-black-secondary/40",
          ],
          variant === "primary" && [
            "bg-accent-green text-white",
            "hover:bg-accent-green/85",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            "focus-visible:ring-accent-green/40",
          ],
          className,
        )}
      >
        {Icon && <Icon className="w-6 h-6 shrink-0" />}
        <span>{children}</span>
      </button>
    </AnimIn>
  );
}
