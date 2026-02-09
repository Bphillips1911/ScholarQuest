export const BRAND_NAME = "EduCAP™";
export const BRAND_NAME_PLAIN = "EduCAP";
export const PRODUCT_NAME = "EduCAP™ Adaptive Skills";
export const PRODUCT_NAME_PLAIN = "EduCAP Adaptive Skills";
export const TAGLINE = "Master the Standards. Earn the Growth.";
export const ADMIN_PORTAL = "EduCAP™ Admin Portal";
export const FORGE = "EduCAP Forge™";
export const DISCLAIMER_ADMIN = "EduCAP™ is a standards-aligned instructional platform. Not affiliated with Alabama State Dept of Education.";

export function getHeaderCopy(context: "admin" | "teacher" | "student" | "forge") {
  switch (context) {
    case "admin":
      return { title: ADMIN_PORTAL, subtitle: TAGLINE, showDisclaimer: true };
    case "teacher":
      return { title: BRAND_NAME_PLAIN + " Adaptive Skills", subtitle: TAGLINE, showDisclaimer: false };
    case "student":
      return { title: BRAND_NAME_PLAIN + " Adaptive Skills", subtitle: TAGLINE, showDisclaimer: false };
    case "forge":
      return { title: FORGE, subtitle: TAGLINE, showDisclaimer: true };
  }
}
