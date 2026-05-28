"use client"

import { X } from "lucide-react"

export function Dialog({ open, onOpenChange, children }) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50" onClick={() => onOpenChange(false)} />
      <div className="relative z-50 w-full max-w-4xl max-h-[90vh] overflow-hidden">{children}</div>
    </div>
  )
}

export function DialogContent({ children, className = "" }) {
  return <div className={`bg-white rounded-lg shadow-xl ${className}`}>{children}</div>
}

export function DialogHeader({ children, className = "" }) {
  return <div className={`px-6 py-4 border-b ${className}`}>{children}</div>
}

export function DialogTitle({ children, className = "" }) {
  return <h2 className={`text-xl font-semibold ${className}`}>{children}</h2>
}

export function DialogClose({ onOpenChange }) {
  return (
    <button
      onClick={() => onOpenChange(false)}
      className="absolute right-4 top-4 rounded-sm opacity-70 hover:opacity-100 transition-opacity"
    >
      <X className="h-5 w-5" />
      <span className="sr-only">Close</span>
    </button>
  )
}

