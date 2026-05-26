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
      className="modal-backdrop fixed inset-0 z-50 grid place-items-center bg-slate-950/45 p-4"
      role="dialog"
    >
      <section className="modal-panel w-full max-w-md rounded-lg border border-slate-200 bg-white p-5 shadow-xl">
        <h2 id="modal-title" className="text-lg font-bold text-slate-950">
          {title}
        </h2>
        {children}
      </section>
    </div>
  );
}
