import React from 'react';
import * as SliderPrimitive from '@radix-ui/react-slider';
import * as SwitchPrimitive from '@radix-ui/react-switch';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import * as TabsPrimitive from '@radix-ui/react-tabs';
import { X } from 'lucide-react';

/* =========================================================
   CalmSlider — Minimal accessible Radix Slider
   ========================================================= */
interface CalmSliderProps {
  value: number;
  min?: number;
  max?: number;
  step?: number;
  onChange: (value: number) => void;
  ariaLabel?: string;
  className?: string;
}

export const CalmSlider: React.FC<CalmSliderProps> = ({
  value,
  min = 0,
  max = 1,
  step = 0.02,
  onChange,
  ariaLabel = 'Volume',
  className = '',
}) => {
  return (
    <SliderPrimitive.Root
      className={`relative flex items-center select-none touch-none h-5 w-full cursor-pointer group ${className}`}
      value={[value]}
      min={min}
      max={max}
      step={step}
      onValueChange={(vals) => {
        if (vals.length > 0) onChange(vals[0]);
      }}
      aria-label={ariaLabel}
    >
      <SliderPrimitive.Track className="bg-[var(--border-hairline)] relative grow rounded-full h-[4px] overflow-hidden">
        <SliderPrimitive.Range className="absolute bg-[var(--accent-main)] rounded-full h-full transition-colors" />
      </SliderPrimitive.Track>
      <SliderPrimitive.Thumb
        className="block w-3.5 h-3.5 rounded-full bg-[var(--accent-main)] shadow-sm transition-transform group-hover:scale-125 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-main)]/40"
        aria-label={ariaLabel}
      />
    </SliderPrimitive.Root>
  );
};

/* =========================================================
   CalmSwitch — Minimal accessible Radix Switch
   ========================================================= */
interface CalmSwitchProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  id?: string;
  label?: string;
}

export const CalmSwitch: React.FC<CalmSwitchProps> = ({ checked, onCheckedChange, id, label }) => {
  return (
    <div className="inline-flex items-center gap-2">
      <SwitchPrimitive.Root
        id={id}
        checked={checked}
        onCheckedChange={onCheckedChange}
        className={`w-9 h-[20px] rounded-full relative transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-main)]/40 ${
          checked ? 'bg-[var(--accent-main)]' : 'bg-[var(--ink-wash-strong)]'
        }`}
      >
        <SwitchPrimitive.Thumb
          className={`block w-4 h-4 rounded-full transition-transform duration-200 translate-x-[2px] will-change-transform ${
            checked
              ? 'translate-x-[18px] bg-[var(--accent-fg)]'
              : 'bg-[var(--text-muted)]'
          }`}
        />
      </SwitchPrimitive.Root>
      {label && (
        <label htmlFor={id} className="text-xs font-medium text-[var(--text-muted)] cursor-pointer select-none">
          {label}
        </label>
      )}
    </div>
  );
};

/* =========================================================
   CalmDialog — Accessible Radix Modal Dialog
   ========================================================= */
interface CalmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  maxWidthClassName?: string;
  children: React.ReactNode;
}

export const CalmDialog: React.FC<CalmDialogProps> = ({
  open,
  onOpenChange,
  title,
  description,
  maxWidthClassName = 'max-w-2xl',
  children,
}) => {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-md transition-opacity" />
        <DialogPrimitive.Content
          className={`fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] ${maxWidthClassName} -translate-x-1/2 -translate-y-1/2 rounded-3xl bg-[var(--bg-elevated)] border border-[var(--border-hairline)] p-7 sm:p-9 shadow-2xl focus:outline-none max-h-[88vh] overflow-y-auto`}
        >
          <div className="flex items-start justify-between gap-4 mb-6">
            <div>
              <DialogPrimitive.Title className="text-base font-semibold tracking-tight text-[var(--text-main)]">
                {title}
              </DialogPrimitive.Title>
              {description && (
                <DialogPrimitive.Description className="text-xs text-[var(--text-muted)] mt-1">
                  {description}
                </DialogPrimitive.Description>
              )}
            </div>
            <DialogPrimitive.Close
              className="p-2 -mr-2 -mt-1.5 rounded-full text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--ink-wash)] transition-colors"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </DialogPrimitive.Close>
          </div>
          {children}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
};

export { TabsPrimitive as CalmTabs };
