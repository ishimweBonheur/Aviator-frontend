import { useEffect, useRef, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
export function Modal({
  modal,
  onClose,
  children,
}: {
  modal: string | null;
  onClose: () => void;
  children: ReactNode;
}) {
  const closeRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!modal) return;
    const active = document.activeElement as HTMLElement;
    closeRef.current?.focus();
    const handler = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (event.key === "Tab") {
        const elements = Array.from(
          document.querySelectorAll<HTMLElement>(
            ".modal button, .modal input, .modal select, .modal textarea, .modal a[href]",
          ),
        ).filter((el) => !el.hasAttribute("disabled"));
        const first = elements[0],
          last = elements[elements.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last?.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first?.focus();
        }
      }
    };
    document.addEventListener("keydown", handler);
    return () => {
      document.removeEventListener("keydown", handler);
      active?.focus();
    };
  }, [modal, onClose]);

  return (
    <AnimatePresence>
      {modal && (
        <motion.div
          className="modal-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => onClose()}
        >
          <motion.section
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
            className="modal"
            initial={{ y: 20, scale: 0.97 }}
            animate={{ y: 0, scale: 1 }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              ref={closeRef}
              className="modal-close icon-button"
              aria-label="Close dialog"
              onClick={() => onClose()}
            >
              <X size={20} />
            </button>
            {children}
          </motion.section>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
