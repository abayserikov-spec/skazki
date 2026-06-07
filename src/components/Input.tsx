import { clsx } from "clsx";
import { Eye, EyeClosed } from "lucide-react";
import { InputHTMLAttributes, useState } from "react";

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: React.ReactNode;
};

export default function Input({ label, className, type, ...props }: InputProps) {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === "password";

  return (
    <div className="flex flex-col gap-2">
      {!!label && (
        <label className="h-6 font-sans font-normal text-body leading-none text-black-secondary grow-0 basis-0">
          {label}
        </label>
      )}
      <div className="box-border flex flex-row items-center py-4 px-5 gap-2.5 h-14 border-2 border-grey-medium has-[input:not(:placeholder-shown)]:border-black-secondary rounded-2xl">
        <input
          type={isPassword ? (showPassword ? "text" : "password") : type}
          className={clsx(
            "grow min-w-0 h-6",
            "font-sans font-normal text-body leading-body",
            "text-grey-darkest not-placeholder-shown:text-black-prime placeholder:text-grey-darkest",
            "outline-none bg-transparent",
            className,
          )}
          {...props}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="shrink-0 text-grey-darkest hover:text-black-secondary transition-colors duration-200 cursor-pointer"
            tabIndex={-1}
          >
            {showPassword ? <Eye size={18} /> : <EyeClosed size={18} />}
          </button>
        )}
      </div>
    </div>
  );
}
