// Comprehensive bilingual translation system for parent portal

export interface Translation {
  en: string;
  es: string;
}

export const translations = {
  // Header and Navigation
  welcomeBack: { en: "Welcome Back", es: "Bienvenido de Vuelta" },
  parentPortal: { en: "Parent Portal", es: "Portal de Padres" },
  logout: { en: "Logout", es: "Cerrar Sesión" },
  
  // Tabs
  myScholars: { en: "My Scholars", es: "Mis Estudiantes" },
  houseStandings: { en: "House Standings", es: "Clasificaciones de Casas" },
  messaging: { en: "Messaging", es: "Mensajes" },
  resources: { en: "Resources", es: "Recursos" },
  
  // Scholar Information
  scholar: { en: "Scholar", es: "Estudiante" },
  house: { en: "House", es: "Casa" },
  grade: { en: "Grade", es: "Grado" },
  totalPoints: { en: "Total Points", es: "Puntos Totales" },
  academicPoints: { en: "Academic Points", es: "Puntos Académicos" },
  attendancePoints: { en: "Attendance Points", es: "Puntos de Asistencia" },
  behaviorPoints: { en: "Behavior Points", es: "Puntos de Comportamiento" },
  
  // Recent Activity
  recentActivity: { en: "Recent Activity", es: "Actividad Reciente" },
  noActivity: { en: "No recent activity", es: "Sin actividad reciente" },
  pointsEarned: { en: "points earned", es: "puntos ganados" },
  pointsDeducted: { en: "points deducted", es: "puntos deducidos" },
  
  // House Information
  members: { en: "members", es: "miembros" },
  rank: { en: "Rank", es: "Rango" },
  
  // Messaging
  sendMessage: { en: "Send Message", es: "Enviar Mensaje" },
  messageSubject: { en: "Message Subject", es: "Asunto del Mensaje" },
  messageContent: { en: "Message Content", es: "Contenido del Mensaje" },
  selectRecipient: { en: "Select Recipient", es: "Seleccionar Destinatario" },
  teacher: { en: "Teacher", es: "Maestro" },
  administration: { en: "Administration", es: "Administración" },
  
  // Actions
  addScholar: { en: "Add Scholar", es: "Agregar Estudiante" },
  addPhone: { en: "Add Phone", es: "Agregar Teléfono" },
  save: { en: "Save", es: "Guardar" },
  cancel: { en: "Cancel", es: "Cancelar" },
  close: { en: "Close", es: "Cerrar" },
  send: { en: "Send", es: "Enviar" },
  
  // Form Labels
  username: { en: "Username", es: "Nombre de Usuario" },
  password: { en: "Password", es: "Contraseña" },
  phoneNumber: { en: "Phone Number", es: "Número de Teléfono" },
  enterCredentials: { en: "Enter your scholar's login credentials", es: "Ingrese las credenciales de acceso de su estudiante" },
  
  // Messages and Notifications
  scholarAdded: { en: "Scholar added successfully!", es: "¡Estudiante agregado exitosamente!" },
  phoneAdded: { en: "Phone number added successfully!", es: "¡Número de teléfono agregado exitosamente!" },
  messageSent: { en: "Message sent successfully!", es: "¡Mensaje enviado exitosamente!" },
  errorOccurred: { en: "An error occurred", es: "Ocurrió un error" },
  
  // Status and States
  loading: { en: "Loading...", es: "Cargando..." },
  noScholars: { en: "No scholars added yet", es: "Aún no se han agregado estudiantes" },
  noMessages: { en: "No messages found", es: "No se encontraron mensajes" },
  
  // Time and Dates
  today: { en: "Today", es: "Hoy" },
  yesterday: { en: "Yesterday", es: "Ayer" },
  minutesAgo: { en: "minutes ago", es: "minutos atrás" },
  hoursAgo: { en: "hours ago", es: "horas atrás" },
  daysAgo: { en: "days ago", es: "días atrás" },
  
  // PBIS and Rewards
  mustangTrait: { en: "MUSTANG Trait", es: "Rasgo MUSTANG" },
  motivated: { en: "Motivated", es: "Motivado" },
  understanding: { en: "Understanding", es: "Comprensivo" },
  safe: { en: "Safe", es: "Seguro" },
  teamwork: { en: "Teamwork", es: "Trabajo en Equipo" },
  accountable: { en: "Accountable", es: "Responsable" },
  noble: { en: "Noble", es: "Noble" },
  growth: { en: "Growth", es: "Crecimiento" },
  
  // Reflections
  reflections: { en: "Reflections", es: "Reflexiones" },
  pending: { en: "Pending", es: "Pendiente" },
  submitted: { en: "Submitted", es: "Enviado" },
  approved: { en: "Approved", es: "Aprobado" },
  rejected: { en: "Rejected", es: "Rechazado" },
  noReflections: { en: "No reflections assigned", es: "No hay reflexiones asignadas" },
  
  // Categories
  academic: { en: "Academic", es: "Académico" },
  attendance: { en: "Attendance", es: "Asistencia" },
  behavior: { en: "Behavior", es: "Comportamiento" },
  
  // Common phrases
  and: { en: "and", es: "y" },
  for: { en: "for", es: "por" },
  by: { en: "by", es: "por" },
  from: { en: "from", es: "de" },
  to: { en: "to", es: "a" },
  in: { en: "in", es: "en" },
  at: { en: "at", es: "a las" },
  
  // House names (keep English names but add descriptions in Spanish)
  franklin: { en: "Franklin - Innovation Through Discovery", es: "Franklin - Innovación a Través del Descubrimiento" },
  tesla: { en: "Tesla - Electrifying Excellence", es: "Tesla - Excelencia Electrizante" },
  curie: { en: "Curie - Pioneering Progress", es: "Curie - Progreso Pionero" },
  nobel: { en: "Nobel - Excellence in Achievement", es: "Nobel - Excelencia en Logros" },
  lovelace: { en: "Lovelace - Coding the Future", es: "Lovelace - Codificando el Futuro" },
  
  // Errors and Validation
  missingInformation: { en: "Missing Information", es: "Información Faltante" },
  invalidCredentials: { en: "Invalid credentials", es: "Credenciales inválidas" },
  networkError: { en: "Network error occurred", es: "Ocurrió un error de red" },
  requiredField: { en: "This field is required", es: "Este campo es obligatorio" },
  
  // Dashboard specific
  overview: { en: "Overview", es: "Resumen" },
  quickActions: { en: "Quick Actions", es: "Acciones Rápidas" },
  recentMessages: { en: "Recent Messages", es: "Mensajes Recientes" },
  viewAll: { en: "View All", es: "Ver Todo" },
  
  // School specific
  bushHillsSTEAM: { en: "Bush Hills STEAM Academy", es: "Academia STEAM Bush Hills" },
  mustangSpirit: { en: "MUSTANG Spirit", es: "Espíritu MUSTANG" },
  parentCommunity: { en: "Parent Community", es: "Comunidad de Padres" }
};

export type Language = "en" | "es";

export function translate(key: keyof typeof translations, language: Language): string {
  const translation = translations[key];
  if (!translation) {
    console.warn(`Translation missing for key: ${key}`);
    return key;
  }
  return translation[language] || translation.en;
}

// Helper function for getting current language from parent data
export function getParentLanguage(): Language {
  try {
    const parentData = localStorage.getItem("parentData");
    if (parentData) {
      const parent = JSON.parse(parentData);
      return parent.preferredLanguage === "es" ? "es" : "en";
    }
  } catch (error) {
    console.warn("Could not parse parent language preference");
  }
  return "en";
}

// Helper function for formatting dates in the appropriate language
export function formatDateInLanguage(date: Date, language: Language): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 60) {
    return `${diffMins} ${translate("minutesAgo", language)}`;
  } else if (diffHours < 24) {
    return `${diffHours} ${translate("hoursAgo", language)}`;
  } else if (diffDays === 1) {
    return translate("yesterday", language);
  } else if (diffDays < 7) {
    return `${diffDays} ${translate("daysAgo", language)}`;
  } else {
    // For older dates, show the actual date
    return date.toLocaleDateString(language === "es" ? "es-ES" : "en-US");
  }
}

// Helper function for MUSTANG trait translation
export function translateMustangTrait(trait: string, language: Language): string {
  const traitKey = trait.toLowerCase() as keyof typeof translations;
  return translate(traitKey, language);
}