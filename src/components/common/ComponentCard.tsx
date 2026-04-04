import React from "react";

interface ComponentCardProps {
  title: string;
  children: React.ReactNode;
  className?: string; // Additional custom classes for styling
  subtitle?: string; // Description/subtitle text
  desc?: string; // Description text (legacy)
  actionButton?: {
    label: string;
    onClick: () => void;
    variant?: "primary" | "secondary";
  };
}

const ComponentCard: React.FC<ComponentCardProps> = ({
  title,
  children,
  className = "",
  subtitle = "",
  desc = "",
  actionButton,
}) => {
  const description = subtitle || desc;

  return (
    <div
      className={`rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] ${className}`}
    >
      {/* Card Header */}
      <div className="px-6 py-5 flex justify-between items-start">
        <div>
          <h3 className="text-base font-medium text-gray-800 dark:text-white/90">
            {title}
          </h3>
          {description && (
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {description}
            </p>
          )}
        </div>
        {actionButton && (
          <button
            onClick={actionButton.onClick}
            className={`px-4 py-2 rounded-lg font-medium transition-colors text-sm whitespace-nowrap ml-4 ${
              actionButton.variant === "secondary"
                ? "border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                : "bg-brand-500 text-white hover:bg-brand-600"
            }`}
          >
            {actionButton.label}
          </button>
        )}
      </div>

      {/* Card Body */}
      <div className="p-4 border-t border-gray-100 dark:border-gray-800 sm:p-6">
        <div className="space-y-6">{children}</div>
      </div>
    </div>
  );
};

export default ComponentCard;
