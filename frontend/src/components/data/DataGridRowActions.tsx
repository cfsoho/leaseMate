import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import {
  Ban,
  Edit2,
  EllipsisVertical,
  GitBranch,
  Globe2,
  RotateCcw,
  Trash2,
} from "lucide-react";

import { IconButton } from "../ui/IconButton";

type DataGridRowActionsProps<TRecord> = {
  children?: ReactNode;
  deleteRequiresInactive?: boolean;
  isActive?: boolean | null;
  labels: {
    activate?: string;
    child?: string;
    deactivate: string;
    delete: string;
    edit: string;
    translate?: string;
  };
  record: TRecord;
  supportsActiveState?: boolean;
  onActivate?: (record: TRecord) => void;
  onDeactivate?: (record: TRecord) => void;
  onDelete?: (record: TRecord) => void;
  onEdit?: (record: TRecord) => void;
  onChild?: (record: TRecord) => void;
  onTranslate?: (record: TRecord) => void;
};

export function DataGridRowActions<TRecord>({
  children,
  deleteRequiresInactive = true,
  isActive,
  labels,
  record,
  supportsActiveState = isActive !== undefined && isActive !== null,
  onActivate,
  onDeactivate,
  onDelete,
  onEdit,
  onChild,
  onTranslate,
}: DataGridRowActionsProps<TRecord>) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const isInactive = supportsActiveState && isActive === false;
  const canActivate = isInactive && Boolean(onActivate);
  const canDeactivate = supportsActiveState && !isInactive && Boolean(onDeactivate);
  const canDelete =
    Boolean(onDelete) && (!deleteRequiresInactive || isInactive || !supportsActiveState);
  const actionItems = [
    onEdit && !isInactive
      ? {
          icon: <Edit2 aria-hidden="true" size={16} />,
          label: labels.edit,
          onClick: () => onEdit(record),
        }
      : null,
    onChild && labels.child && !isInactive
      ? {
          icon: <GitBranch aria-hidden="true" size={16} />,
          label: labels.child,
          onClick: () => onChild(record),
        }
      : null,
    canActivate && labels.activate
      ? {
          icon: <RotateCcw aria-hidden="true" size={16} />,
          label: labels.activate,
          onClick: () => onActivate?.(record),
        }
      : null,
    canDeactivate
      ? {
          icon: <Ban aria-hidden="true" size={16} />,
          label: labels.deactivate,
          onClick: () => onDeactivate?.(record),
        }
      : null,
    canDelete
      ? {
          icon: <Trash2 aria-hidden="true" size={16} />,
          label: labels.delete,
          onClick: () => onDelete?.(record),
        }
      : null,
    onTranslate && labels.translate && !isInactive
      ? {
          icon: <Globe2 aria-hidden="true" size={16} />,
          label: labels.translate,
          onClick: () => onTranslate(record),
        }
      : null,
  ].filter(Boolean) as {
    icon: ReactNode;
    label: string;
    onClick: () => void;
  }[];

  useEffect(() => {
    if (!isMobileMenuOpen) {
      return undefined;
    }

    function handleDocumentClick(event: MouseEvent) {
      if (!menuRef.current?.contains(event.target as Node)) {
        setIsMobileMenuOpen(false);
      }
    }

    document.addEventListener("click", handleDocumentClick);
    return () => document.removeEventListener("click", handleDocumentClick);
  }, [isMobileMenuOpen]);

  return (
    <div
      className="flex justify-end gap-1"
      onClick={(event) => event.stopPropagation()}
    >
      <div className="hidden justify-end gap-1 md:flex">
        {onEdit && !isInactive && (
          <IconButton label={labels.edit} onClick={() => onEdit(record)}>
            <Edit2 aria-hidden="true" size={16} />
          </IconButton>
        )}
        {!isInactive && children}
        {onChild && labels.child && !isInactive && (
          <IconButton label={labels.child} onClick={() => onChild(record)}>
            <GitBranch aria-hidden="true" size={16} />
          </IconButton>
        )}
        {canActivate && labels.activate && (
          <IconButton label={labels.activate} onClick={() => onActivate?.(record)}>
            <RotateCcw aria-hidden="true" size={16} />
          </IconButton>
        )}
        {canDeactivate && (
          <IconButton label={labels.deactivate} onClick={() => onDeactivate?.(record)}>
            <Ban aria-hidden="true" size={16} />
          </IconButton>
        )}
        {canDelete && (
          <IconButton label={labels.delete} onClick={() => onDelete?.(record)}>
            <Trash2 aria-hidden="true" size={16} />
          </IconButton>
        )}
        {onTranslate && labels.translate && !isInactive && (
          <IconButton label={labels.translate} onClick={() => onTranslate(record)}>
            <Globe2 aria-hidden="true" size={16} />
          </IconButton>
        )}
      </div>
      <div ref={menuRef} className="relative md:hidden">
        <IconButton
          hideTooltip
          label="More"
          onClick={() => setIsMobileMenuOpen((current) => !current)}
        >
          <EllipsisVertical aria-hidden="true" size={16} />
        </IconButton>
        {isMobileMenuOpen && (
          <div className="absolute right-0 top-full z-40 mt-2 min-w-48 rounded-md border border-slate-200 bg-white py-1 text-sm shadow-lg">
            {actionItems.map((item) => (
              <button
                key={item.label}
                className="flex w-full items-center gap-2 whitespace-nowrap px-3 py-2 text-left font-normal text-slate-700 hover:bg-slate-100 hover:text-slate-950"
                type="button"
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  item.onClick();
                }}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
