import { appBrand } from "../../config/appBrand";

type BrandMarkProps = {
  className?: string;
  size?: "sm" | "md" | "lg";
};

const sizeClasses = {
  sm: "size-9 rounded-lg text-sm",
  md: "size-11 rounded-lg text-base",
  lg: "size-12 rounded-xl text-base",
};

export function BrandMark({ className = "", size = "md" }: BrandMarkProps) {
  return (
    <span
      className={[
        "brand-mark grid shrink-0 place-items-center font-bold",
        sizeClasses[size],
        className,
      ].join(" ")}
    >
      {appBrand.initials}
    </span>
  );
}
