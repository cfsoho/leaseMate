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
        "lm-drawer-shell",
        isOpen ? "lm-drawer-shell-open" : "lm-drawer-shell-closed",
      ].join(" ")}
      aria-hidden={!isOpen}
    >
      <button
        aria-label="Close drawer overlay"
        className={[
          "lm-drawer-backdrop",
          isOpen ? "lm-drawer-backdrop-open" : "lm-drawer-backdrop-closed",
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
          "lm-drawer-panel",
          isOpen ? "lm-drawer-panel-open" : "lm-drawer-panel-closed",
        ].join(" ")}
        aria-label={title}
        role="dialog"
      >
        <header className="lm-drawer-header">
          <h2 className="lm-drawer-title">{title}</h2>
          <button
            aria-label="Close drawer"
            className="lm-icon-button lm-icon-button-secondary"
            type="button"
            onClick={onClose}
          >
            <X aria-hidden="true" size={16} />
          </button>
        </header>
        <div className="lm-drawer-body">{children}</div>
      </aside>
    </div>
  );
}
