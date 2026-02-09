import { getHeaderCopy, DISCLAIMER_ADMIN } from "@/lib/educapBrand";

interface EduCapPageHeaderProps {
  context: "admin" | "teacher" | "student" | "forge";
  rightSlot?: React.ReactNode;
  showLogo?: boolean;
}

export default function EduCapPageHeader({ context, rightSlot, showLogo = true }: EduCapPageHeaderProps) {
  const { title, subtitle, showDisclaimer } = getHeaderCopy(context);

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          {showLogo && (
            <img
              src="/branding/educap-logo.png"
              alt="EduCAP Logo"
              className="h-12 w-auto object-contain"
            />
          )}
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
            <p className="text-sm text-gray-500 italic">{subtitle}</p>
          </div>
        </div>
        {rightSlot && <div>{rightSlot}</div>}
      </div>
      {showDisclaimer && (
        <p className="text-[11px] text-gray-400 mt-2">{DISCLAIMER_ADMIN}</p>
      )}
    </div>
  );
}
