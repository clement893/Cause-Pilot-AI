"use client";

import { forwardRef, ButtonHTMLAttributes, InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";

// Button Component
interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = "", variant = "primary", size = "md", loading, children, disabled, ...props }, ref) => {
    const baseStyles = "inline-flex items-center justify-center font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:opacity-50 disabled:cursor-not-allowed";
    
    const variants = {
      primary: "bg-indigo-600 text-white hover:bg-indigo-700 focus:ring-indigo-500",
      secondary: "bg-slate-700 text-gray-100 hover:bg-slate-600 focus:ring-slate-500",
      outline: "border border-slate-600 text-gray-200 hover:bg-slate-800 focus:ring-indigo-500",
      ghost: "text-gray-300 hover:bg-slate-800 focus:ring-slate-500",
      danger: "bg-red-600 text-white hover:bg-red-700 focus:ring-red-500",
    };
    
    const sizes = {
      sm: "px-3 py-1.5 text-sm",
      md: "px-4 py-2 text-sm",
      lg: "px-6 py-3 text-base",
    };
    
    return (
      <button
        ref={ref}
        className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
        disabled={disabled || loading}
        {...props}
      >
        {loading && (
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        )}
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";

// Input Component
interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  variant?: "light" | "dark";
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className = "", label, error, helperText, id, variant = "dark", ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s/g, "-");
    
    const labelClass = variant === "dark" ? "text-gray-300" : "text-gray-700";
    const inputClass = variant === "dark" 
      ? "bg-slate-800 border-slate-600 text-white placeholder-gray-400"
      : "bg-white border-gray-300 text-gray-900";
    const helperClass = variant === "dark" ? "text-gray-400" : "text-gray-500";
    
    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className={`block text-sm font-medium ${labelClass} mb-1`}>
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={`block w-full px-3 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${inputClass} ${
            error ? "border-red-500" : ""
          } ${className}`}
          {...props}
        />
        {error && <p className="mt-1 text-sm text-red-400">{error}</p>}
        {helperText && !error && <p className={`mt-1 text-sm ${helperClass}`}>{helperText}</p>}
      </div>
    );
  }
);
Input.displayName = "Input";

// Select Component
interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: Array<{ value: string; label: string }>;
  variant?: "light" | "dark";
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className = "", label, error, options, id, variant = "dark", ...props }, ref) => {
    const selectId = id || label?.toLowerCase().replace(/\s/g, "-");
    
    const labelClass = variant === "dark" ? "text-gray-300" : "text-gray-700";
    const selectClass = variant === "dark" 
      ? "bg-slate-800 border-slate-600 text-white"
      : "bg-white border-gray-300 text-gray-900";
    
    return (
      <div className="w-full">
        {label && (
          <label htmlFor={selectId} className={`block text-sm font-medium ${labelClass} mb-1`}>
            {label}
          </label>
        )}
        <select
          ref={ref}
          id={selectId}
          className={`block w-full px-3 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${selectClass} ${
            error ? "border-red-500" : ""
          } ${className}`}
          {...props}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {error && <p className="mt-1 text-sm text-red-400">{error}</p>}
      </div>
    );
  }
);
Select.displayName = "Select";

// Textarea Component
interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  variant?: "light" | "dark";
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className = "", label, error, id, variant = "dark", ...props }, ref) => {
    const textareaId = id || label?.toLowerCase().replace(/\s/g, "-");
    
    const labelClass = variant === "dark" ? "text-gray-300" : "text-gray-700";
    const textareaClass = variant === "dark" 
      ? "bg-slate-800 border-slate-600 text-white placeholder-gray-400"
      : "bg-white border-gray-300 text-gray-900";
    
    return (
      <div className="w-full">
        {label && (
          <label htmlFor={textareaId} className={`block text-sm font-medium ${labelClass} mb-1`}>
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={textareaId}
          className={`block w-full px-3 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${textareaClass} ${
            error ? "border-red-500" : ""
          } ${className}`}
          {...props}
        />
        {error && <p className="mt-1 text-sm text-red-400">{error}</p>}
      </div>
    );
  }
);
Textarea.displayName = "Textarea";

// Checkbox Component
interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  label: string;
  variant?: "light" | "dark";
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className = "", label, id, variant = "dark", ...props }, ref) => {
    const checkboxId = id || label.toLowerCase().replace(/\s/g, "-");
    
    const labelClass = variant === "dark" ? "text-gray-300" : "text-gray-700";
    
    return (
      <div className="flex items-center">
        <input
          ref={ref}
          id={checkboxId}
          type="checkbox"
          className={`h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-slate-600 rounded bg-slate-800 ${className}`}
          {...props}
        />
        <label htmlFor={checkboxId} className={`ml-2 block text-sm ${labelClass}`}>
          {label}
        </label>
      </div>
    );
  }
);
Checkbox.displayName = "Checkbox";

// Card Component
interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: "none" | "sm" | "md" | "lg";
  variant?: "light" | "dark";
}

export function Card({ children, className = "", padding = "md", variant = "dark" }: CardProps) {
  const paddings = {
    none: "",
    sm: "p-4",
    md: "p-6",
    lg: "p-8",
  };
  
  // Allow className to override default background
  const hasCustomBg = className.includes('bg-');
  const defaultBg = variant === "dark" ? "bg-slate-900" : "bg-white";
  const bgClass = hasCustomBg ? '' : defaultBg;
  const borderClass = variant === "dark" ? "border-slate-700" : "border-gray-200";
  
  return (
    <div className={`${bgClass} rounded-xl shadow-sm border ${borderClass} ${paddings[padding]} ${className}`}>
      {children}
    </div>
  );
}

// Badge Component
interface BadgeProps {
  children: React.ReactNode;
  variant?: "default" | "success" | "warning" | "danger" | "info";
  size?: "sm" | "md";
}

export function Badge({ children, variant = "default", size = "sm" }: BadgeProps) {
  const variants = {
    default: "bg-slate-700 text-gray-200",
    success: "bg-green-900/50 text-green-300",
    warning: "bg-yellow-900/50 text-yellow-300",
    danger: "bg-red-900/50 text-red-300",
    info: "bg-blue-900/50 text-blue-300",
  };
  
  const sizes = {
    sm: "px-2 py-0.5 text-xs",
    md: "px-2.5 py-1 text-sm",
  };
  
  return (
    <span className={`inline-flex items-center font-medium rounded-full ${variants[variant]} ${sizes[size]}`}>
      {children}
    </span>
  );
}

// Loading Spinner
export function Spinner({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const sizes = {
    sm: "h-4 w-4",
    md: "h-8 w-8",
    lg: "h-12 w-12",
  };
  
  return (
    <svg className={`animate-spin ${sizes[size]} text-indigo-500`} fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
    </svg>
  );
}

// Empty State
interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  variant?: "light" | "dark";
}

export function EmptyState({ title, description, icon, action, variant = "dark" }: EmptyStateProps) {
  const titleClass = variant === "dark" ? "text-white" : "text-gray-900";
  const descClass = variant === "dark" ? "text-gray-400" : "text-gray-500";
  const iconClass = variant === "dark" ? "text-gray-500" : "text-gray-400";
  
  return (
    <div className="text-center py-12">
      {icon && <div className={`mx-auto h-12 w-12 ${iconClass}`}>{icon}</div>}
      <h3 className={`mt-2 text-sm font-semibold ${titleClass}`}>{title}</h3>
      {description && <p className={`mt-1 text-sm ${descClass}`}>{description}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

// Modal Component
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
  variant?: "light" | "dark";
}

export function Modal({ isOpen, onClose, title, children, size = "md", variant = "dark" }: ModalProps) {
  if (!isOpen) return null;
  
  const sizes = {
    sm: "max-w-md",
    md: "max-w-lg",
    lg: "max-w-2xl",
    xl: "max-w-4xl",
  };
  
  const bgClass = variant === "dark" ? "bg-slate-900" : "bg-white";
  const borderClass = variant === "dark" ? "border-slate-700" : "border-gray-200";
  const titleClass = variant === "dark" ? "text-white" : "text-gray-900";
  
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
        <div className="fixed inset-0 bg-black bg-opacity-75 transition-opacity" onClick={onClose} />
        <div className={`relative transform overflow-hidden rounded-lg ${bgClass} text-left shadow-xl transition-all sm:my-8 w-full ${sizes[size]}`}>
          {title && (
            <div className={`border-b ${borderClass} px-6 py-4`}>
              <h3 className={`text-lg font-semibold ${titleClass}`}>{title}</h3>
            </div>
          )}
          <div className="px-6 py-4">{children}</div>
        </div>
      </div>
    </div>
  );
}

// Table Component for dark theme
interface TableProps {
  children: React.ReactNode;
  className?: string;
}

export function Table({ children, className = "" }: TableProps) {
  return (
    <div className={`overflow-x-auto ${className}`}>
      <table className="min-w-full divide-y divide-slate-700">
        {children}
      </table>
    </div>
  );
}

export function TableHeader({ children }: { children: React.ReactNode }) {
  return (
    <thead className="bg-slate-800">
      {children}
    </thead>
  );
}

export function TableBody({ children }: { children: React.ReactNode }) {
  return (
    <tbody className="divide-y divide-slate-700 bg-slate-900">
      {children}
    </tbody>
  );
}

export function TableRow({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <tr className={`hover:bg-slate-800 transition-colors ${className}`}>
      {children}
    </tr>
  );
}

export function TableHead({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <th className={`px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider ${className}`}>
      {children}
    </th>
  );
}

export function TableCell({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <td className={`px-6 py-4 whitespace-nowrap text-sm text-gray-300 ${className}`}>
      {children}
    </td>
  );
}

// Stats Card Component
interface StatsCardProps {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  change?: {
    value: number;
    type: "increase" | "decrease";
  };
  className?: string;
}

export function StatsCard({ title, value, icon, change, className = "" }: StatsCardProps) {
  return (
    <Card className={`bg-slate-900 border-slate-700 ${className}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-gray-400 uppercase tracking-wide">{title}</p>
          <p className="text-2xl font-bold text-white mt-1">{value}</p>
          {change && (
            <p className={`text-xs mt-1 ${change.type === "increase" ? "text-green-400" : "text-red-400"}`}>
              {change.type === "increase" ? "↑" : "↓"} {Math.abs(change.value)}%
            </p>
          )}
        </div>
        {icon && (
          <div className="p-3 bg-slate-800 rounded-lg text-indigo-400">
            {icon}
          </div>
        )}
      </div>
    </Card>
  );
}
