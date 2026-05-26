import type { ReactNode } from "react";
import { X } from "lucide-react";

type DrawerProps = {
  children: ReactNode;
  isOpen: boolean;
  closeOnOverlayClick?: boolean;
  title: string;
  onClose: () => void;
};

export function Drawer({
  children,
  isOpen,
  closeOnOverlayClick = true,
  title,
  onClose,
}: DrawerProps) {
  return (
    <div
      className={[
        "fixed inset-0 z-40 transition",
        isOpen ? "pointer-events-auto" : "pointer-events-none",
      ].join(" ")}
      aria-hidden={!isOpen}
    >
      <button
        aria-label="Close drawer overlay"
        className={[
          "absolute inset-0 bg-slate-950/30 transition-opacity",
          isOpen ? "opacity-100" : "opacity-0",
        ].join(" ")}
        type="button"
        onClick={() => {
          if (closeOnOverlayClick) {
            onClose();
          }
        }}
      />
      <aside
        className={[
          "absolute right-0 top-0 flex h-full w-full max-w-[560px] flex-col border-l border-slate-200 bg-white shadow-2xl transition-transform duration-200 ease-out lg:w-1/2 lg:max-w-none",
          isOpen ? "translate-x-0" : "translate-x-full",
        ].join(" ")}
        aria-label={title}
        role="dialog"
      >
        <header className="flex min-h-16 items-center justify-between gap-3 border-b border-slate-200 px-5">
          <h2 className="text-lg font-bold text-slate-950">{title}</h2>
          <button
            aria-label="Close drawer"
            className="grid size-8 place-items-center rounded-md border border-slate-300 bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-950"
            type="button"
            onClick={onClose}
          >
            <X aria-hidden="true" size={16} />
          </button>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto p-5">{children}</div>
      </aside>
    </div>
  );
}
