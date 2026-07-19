import type { ReactNode } from "react";

type ModalProps = {
  children: ReactNode;
  title: string;
};

export function Modal({ children, title }: ModalProps) {
  return (
    <div
      aria-labelledby="modal-title"
      aria-modal="true"
      className="modal-backdrop lm-modal-backdrop"
      role="dialog"
    >
      <section className="modal-panel lm-modal-panel">
        <h2 id="modal-title" className="lm-modal-title">
          {title}
        </h2>
        {children}
      </section>
    </div>
  );
}
