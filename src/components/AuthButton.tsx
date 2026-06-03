import { clsx } from "clsx";
import { AnimIn } from "components/AnimIn";

export default function AuthButton({
  icon: Icon,
  children,
  delay = 0,
  onClick,
}: {
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  children: React.ReactNode;
  delay?: number;
  onClick?: () => void;
}) {
  return (
    <AnimIn delay={delay}>
      <button
        onClick={onClick}
        className={clsx(
          // layout
          "flex flex-row justify-center items-center",
          // spacing
          "py-5 sm:pr-10 sm:pl-5 gap-5 pr-5 pl-2.5",
          // sizing
          "w-full h-16",
          // border & shape
          "border-2 border-grey-medium rounded-full",
          // flex behavior
          "shrink-0 self-stretch",
          // base behavior
          "cursor-pointer select-none",
          // transition
          "transition-all duration-200",
          // hover
          "hover:border-black-secondary/30 hover:bg-black-secondary/3 hover:shadow-sm",
          // active
          "active:scale-[0.98] active:bg-black-secondary/6",
          // focus
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black-secondary/40 focus-visible:ring-offset-2",
        )}
      >
        <Icon className="w-6 h-6 shrink-0" />
        <span className="font-bold text-button leading-none text-black-secondary font-figtree">
          {children}
        </span>
      </button>
    </AnimIn>
  );
}
