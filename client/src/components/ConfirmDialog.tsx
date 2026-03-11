"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";

interface ConfirmDialogProps {
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    onCancel: () => void;
    confirmText?: string;
    cancelText?: string;
    confirmButtonClass?: string;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
    isOpen,
    title,
    message,
    onConfirm,
    onCancel,
    confirmText = "Confirm",
    cancelText = "Cancel",
    confirmButtonClass = "bg-primary text-primary-foreground hover:bg-primary/90",
}) => {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        if (isOpen) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "unset";
        }
        return () => {
            document.body.style.overflow = "unset";
        };
    }, [isOpen]);

    if (!mounted || !isOpen) return null;

    // Use portal to render significantly above other z-indices
    return createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 transition-all duration-200">
            <div
                className="w-full max-w-sm rounded-lg bg-card p-6 shadow-lg border animate-in zoom-in-95 duration-200"
                role="dialog"
                aria-modal="true"
                aria-labelledby="dialog-title"
                aria-describedby="dialog-desc"
            >
                <h2 id="dialog-title" className="text-xl font-bold mb-2 text-foreground">
                    {title}
                </h2>
                <p id="dialog-desc" className="text-muted-foreground mb-6 leading-relaxed text-sm">
                    {message}
                </p>
                <div className="flex justify-end gap-3">
                    <button
                        onClick={onCancel}
                        className="rounded-md px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted transition-colors border"
                    >
                        {cancelText}
                    </button>
                    <button
                        onClick={onConfirm}
                        className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${confirmButtonClass}`}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
};
