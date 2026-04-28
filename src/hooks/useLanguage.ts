import { useState, useEffect, createContext, useContext, ReactNode } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export const SUPPORTED_LANGUAGES = [
  { code: "en", name: "English", native: "English" },
  { code: "hi", name: "Hindi", native: "हिन्दी" },
  { code: "ta", name: "Tamil", native: "தமிழ்" },
  { code: "te", name: "Telugu", native: "తెలుగు" },
  { code: "bn", name: "Bengali", native: "বাংলা" },
  { code: "mr", name: "Marathi", native: "मराठी" },
  { code: "gu", name: "Gujarati", native: "ગુજરાતી" },
  { code: "kn", name: "Kannada", native: "ಕನ್ನಡ" },
  { code: "ml", name: "Malayalam", native: "മലയാളം" },
  { code: "pa", name: "Punjabi", native: "ਪੰਜਾਬੀ" },
] as const;

export type LanguageCode = typeof SUPPORTED_LANGUAGES[number]["code"];

// Translation keys and their values
type TranslationKey = 
  | "welcome" | "signIn" | "signUp" | "email" | "password" | "submit"
  | "jobs" | "internships" | "events" | "courses" | "assessments" | "resume"
  | "profile" | "settings" | "messages" | "notifications" | "search"
  | "save" | "cancel" | "delete" | "edit" | "view" | "apply" | "register"
  | "dashboard" | "home" | "network" | "companies" | "mentorship" | "blogs"
  | "loading" | "error" | "success" | "noResults" | "seeAll";

const translations: Record<LanguageCode, Record<TranslationKey, string>> = {
  en: {
    welcome: "Welcome",
    signIn: "Sign In",
    signUp: "Sign Up",
    email: "Email",
    password: "Password",
    submit: "Submit",
    jobs: "Jobs",
    internships: "Internships",
    events: "Events",
    courses: "Courses",
    assessments: "Assessments",
    resume: "Resume",
    profile: "Profile",
    settings: "Settings",
    messages: "Messages",
    notifications: "Notifications",
    search: "Search",
    save: "Save",
    cancel: "Cancel",
    delete: "Delete",
    edit: "Edit",
    view: "View",
    apply: "Apply",
    register: "Register",
    dashboard: "Dashboard",
    home: "Home",
    network: "Network",
    companies: "Companies",
    mentorship: "Mentorship",
    blogs: "Blogs",
    loading: "Loading...",
    error: "An error occurred",
    success: "Success!",
    noResults: "No results found",
    seeAll: "See All",
  },
  hi: {
    welcome: "स्वागत है",
    signIn: "साइन इन करें",
    signUp: "साइन अप करें",
    email: "ईमेल",
    password: "पासवर्ड",
    submit: "जमा करें",
    jobs: "नौकरियां",
    internships: "इंटर्नशिप",
    events: "कार्यक्रम",
    courses: "पाठ्यक्रम",
    assessments: "मूल्यांकन",
    resume: "रिज्यूमे",
    profile: "प्रोफ़ाइल",
    settings: "सेटिंग्स",
    messages: "संदेश",
    notifications: "सूचनाएं",
    search: "खोजें",
    save: "सहेजें",
    cancel: "रद्द करें",
    delete: "हटाएं",
    edit: "संपादित करें",
    view: "देखें",
    apply: "आवेदन करें",
    register: "पंजीकरण करें",
    dashboard: "डैशबोर्ड",
    home: "होम",
    network: "नेटवर्क",
    companies: "कंपनियां",
    mentorship: "मेंटरशिप",
    blogs: "ब्लॉग",
    loading: "लोड हो रहा है...",
    error: "एक त्रुटि हुई",
    success: "सफलता!",
    noResults: "कोई परिणाम नहीं मिला",
    seeAll: "सभी देखें",
  },
  ta: {
    welcome: "வரவேற்கிறோம்",
    signIn: "உள்நுழைக",
    signUp: "பதிவு செய்க",
    email: "மின்னஞ்சல்",
    password: "கடவுச்சொல்",
    submit: "சமர்ப்பிக்க",
    jobs: "வேலைகள்",
    internships: "இன்டர்ன்ஷிப்",
    events: "நிகழ்வுகள்",
    courses: "பாடநெறிகள்",
    assessments: "மதிப்பீடுகள்",
    resume: "ரெஸ்யூம்",
    profile: "சுயவிவரம்",
    settings: "அமைப்புகள்",
    messages: "செய்திகள்",
    notifications: "அறிவிப்புகள்",
    search: "தேடு",
    save: "சேமி",
    cancel: "ரத்து",
    delete: "நீக்கு",
    edit: "திருத்து",
    view: "பார்",
    apply: "விண்ணப்பி",
    register: "பதிவு",
    dashboard: "டாஷ்போர்டு",
    home: "முகப்பு",
    network: "நெட்வொர்க்",
    companies: "நிறுவனங்கள்",
    mentorship: "மென்டர்ஷிப்",
    blogs: "ப்ளாக்ஸ்",
    loading: "ஏற்றுகிறது...",
    error: "பிழை ஏற்பட்டது",
    success: "வெற்றி!",
    noResults: "முடிவுகள் இல்லை",
    seeAll: "அனைத்தையும் பார்",
  },
  te: {
    welcome: "స్వాగతం",
    signIn: "సైన్ ఇన్",
    signUp: "సైన్ అప్",
    email: "ఇమెయిల్",
    password: "పాస్‌వర్డ్",
    submit: "సమర్పించు",
    jobs: "ఉద్యోగాలు",
    internships: "ఇంటర్న్‌షిప్‌లు",
    events: "ఈవెంట్‌లు",
    courses: "కోర్సులు",
    assessments: "అసెస్‌మెంట్‌లు",
    resume: "రెజ్యూమే",
    profile: "ప్రొఫైల్",
    settings: "సెట్టింగ్‌లు",
    messages: "సందేశాలు",
    notifications: "నోటిఫికేషన్‌లు",
    search: "శోధన",
    save: "సేవ్",
    cancel: "రద్దు",
    delete: "తొలగించు",
    edit: "సవరించు",
    view: "చూడండి",
    apply: "దరఖాస్తు",
    register: "నమోదు",
    dashboard: "డాష్‌బోర్డ్",
    home: "హోమ్",
    network: "నెట్‌వర్క్",
    companies: "కంపెనీలు",
    mentorship: "మెంటార్‌షిప్",
    blogs: "బ్లాగ్‌లు",
    loading: "లోడ్ అవుతోంది...",
    error: "లోపం సంభవించింది",
    success: "విజయం!",
    noResults: "ఫలితాలు లేవు",
    seeAll: "అన్నీ చూడండి",
  },
  bn: {
    welcome: "স্বাগতম",
    signIn: "সাইন ইন",
    signUp: "সাইন আপ",
    email: "ইমেইল",
    password: "পাসওয়ার্ড",
    submit: "জমা দিন",
    jobs: "চাকরি",
    internships: "ইন্টার্নশিপ",
    events: "ইভেন্ট",
    courses: "কোর্স",
    assessments: "মূল্যায়ন",
    resume: "জীবনবৃত্তান্ত",
    profile: "প্রোফাইল",
    settings: "সেটিংস",
    messages: "বার্তা",
    notifications: "বিজ্ঞপ্তি",
    search: "অনুসন্ধান",
    save: "সংরক্ষণ",
    cancel: "বাতিল",
    delete: "মুছুন",
    edit: "সম্পাদনা",
    view: "দেখুন",
    apply: "আবেদন",
    register: "নিবন্ধন",
    dashboard: "ড্যাশবোর্ড",
    home: "হোম",
    network: "নেটওয়ার্ক",
    companies: "কোম্পানি",
    mentorship: "মেন্টরশিপ",
    blogs: "ব্লগ",
    loading: "লোড হচ্ছে...",
    error: "একটি ত্রুটি ঘটেছে",
    success: "সফল!",
    noResults: "কোন ফলাফল নেই",
    seeAll: "সব দেখুন",
  },
  mr: {
    welcome: "स्वागत आहे",
    signIn: "साइन इन",
    signUp: "साइन अप",
    email: "ईमेल",
    password: "पासवर्ड",
    submit: "सबमिट करा",
    jobs: "नोकऱ्या",
    internships: "इंटर्नशिप",
    events: "कार्यक्रम",
    courses: "अभ्यासक्रम",
    assessments: "मूल्यांकन",
    resume: "रेझ्युमे",
    profile: "प्रोफाइल",
    settings: "सेटिंग्ज",
    messages: "संदेश",
    notifications: "सूचना",
    search: "शोधा",
    save: "जतन करा",
    cancel: "रद्द करा",
    delete: "हटवा",
    edit: "संपादित करा",
    view: "पहा",
    apply: "अर्ज करा",
    register: "नोंदणी",
    dashboard: "डॅशबोर्ड",
    home: "होम",
    network: "नेटवर्क",
    companies: "कंपन्या",
    mentorship: "मेंटरशिप",
    blogs: "ब्लॉग",
    loading: "लोड होत आहे...",
    error: "त्रुटी आली",
    success: "यश!",
    noResults: "परिणाम नाहीत",
    seeAll: "सर्व पहा",
  },
  gu: {
    welcome: "સ્વાગત છે",
    signIn: "સાઇન ઇન",
    signUp: "સાઇન અપ",
    email: "ઇમેઇલ",
    password: "પાસવર્ડ",
    submit: "સબમિટ",
    jobs: "નોકરીઓ",
    internships: "ઇન્ટર્નશિપ",
    events: "ઇવેન્ટ્સ",
    courses: "અભ્યાસક્રમો",
    assessments: "મૂલ્યાંકન",
    resume: "રેઝ્યુમે",
    profile: "પ્રોફાઇલ",
    settings: "સેટિંગ્સ",
    messages: "સંદેશાઓ",
    notifications: "સૂચનાઓ",
    search: "શોધો",
    save: "સેવ",
    cancel: "રદ",
    delete: "કાઢી નાખો",
    edit: "સંપાદિત",
    view: "જુઓ",
    apply: "અરજી",
    register: "નોંધણી",
    dashboard: "ડેશબોર્ડ",
    home: "હોમ",
    network: "નેટવર્ક",
    companies: "કંપનીઓ",
    mentorship: "મેન્ટરશિપ",
    blogs: "બ્લોગ્સ",
    loading: "લોડ થઈ રહ્યું છે...",
    error: "ભૂલ થઈ",
    success: "સફળતા!",
    noResults: "કોઈ પરિણામો નથી",
    seeAll: "બધું જુઓ",
  },
  kn: {
    welcome: "ಸ್ವಾಗತ",
    signIn: "ಸೈನ್ ಇನ್",
    signUp: "ಸೈನ್ ಅಪ್",
    email: "ಇಮೇಲ್",
    password: "ಪಾಸ್‌ವರ್ಡ್",
    submit: "ಸಲ್ಲಿಸಿ",
    jobs: "ಉದ್ಯೋಗಗಳು",
    internships: "ಇಂಟರ್ನ್‌ಶಿಪ್",
    events: "ಈವೆಂಟ್‌ಗಳು",
    courses: "ಕೋರ್ಸ್‌ಗಳು",
    assessments: "ಮೌಲ್ಯಮಾಪನ",
    resume: "ರೆಸ್ಯೂಮ್",
    profile: "ಪ್ರೊಫೈಲ್",
    settings: "ಸೆಟ್ಟಿಂಗ್‌ಗಳು",
    messages: "ಸಂದೇಶಗಳು",
    notifications: "ಅಧಿಸೂಚನೆಗಳು",
    search: "ಹುಡುಕಿ",
    save: "ಉಳಿಸಿ",
    cancel: "ರದ್ದು",
    delete: "ಅಳಿಸಿ",
    edit: "ಸಂಪಾದಿಸಿ",
    view: "ನೋಡಿ",
    apply: "ಅರ್ಜಿ",
    register: "ನೋಂದಣಿ",
    dashboard: "ಡ್ಯಾಶ್‌ಬೋರ್ಡ್",
    home: "ಹೋಮ್",
    network: "ನೆಟ್‌ವರ್ಕ್",
    companies: "ಕಂಪನಿಗಳು",
    mentorship: "ಮೆಂಟರ್‌ಶಿಪ್",
    blogs: "ಬ್ಲಾಗ್‌ಗಳು",
    loading: "ಲೋಡ್ ಆಗುತ್ತಿದೆ...",
    error: "ದೋಷ ಸಂಭವಿಸಿದೆ",
    success: "ಯಶಸ್ಸು!",
    noResults: "ಫಲಿತಾಂಶಗಳಿಲ್ಲ",
    seeAll: "ಎಲ್ಲಾ ನೋಡಿ",
  },
  ml: {
    welcome: "സ്വാഗതം",
    signIn: "സൈൻ ഇൻ",
    signUp: "സൈൻ അപ്പ്",
    email: "ഇമെയിൽ",
    password: "പാസ്‌വേഡ്",
    submit: "സമർപ്പിക്കുക",
    jobs: "ജോലികൾ",
    internships: "ഇന്റേൺഷിപ്പ്",
    events: "ഇവന്റുകൾ",
    courses: "കോഴ്‌സുകൾ",
    assessments: "മൂല്യനിർണ്ണയം",
    resume: "റെസ്യൂമെ",
    profile: "പ്രൊഫൈൽ",
    settings: "ക്രമീകരണങ്ങൾ",
    messages: "സന്ദേശങ്ങൾ",
    notifications: "അറിയിപ്പുകൾ",
    search: "തിരയുക",
    save: "സേവ്",
    cancel: "റദ്ദാക്കുക",
    delete: "ഇല്ലാതാക്കുക",
    edit: "എഡിറ്റ്",
    view: "കാണുക",
    apply: "അപേക്ഷിക്കുക",
    register: "രജിസ്റ്റർ",
    dashboard: "ഡാഷ്‌ബോർഡ്",
    home: "ഹോം",
    network: "നെറ്റ്‌വർക്ക്",
    companies: "കമ്പനികൾ",
    mentorship: "മെന്റർഷിപ്പ്",
    blogs: "ബ്ലോഗുകൾ",
    loading: "ലോഡ് ചെയ്യുന്നു...",
    error: "പിശക് സംഭവിച്ചു",
    success: "വിജയം!",
    noResults: "ഫലങ്ങളില്ല",
    seeAll: "എല്ലാം കാണുക",
  },
  pa: {
    welcome: "ਜੀ ਆਇਆਂ ਨੂੰ",
    signIn: "ਸਾਈਨ ਇਨ",
    signUp: "ਸਾਈਨ ਅੱਪ",
    email: "ਈਮੇਲ",
    password: "ਪਾਸਵਰਡ",
    submit: "ਜਮ੍ਹਾਂ ਕਰੋ",
    jobs: "ਨੌਕਰੀਆਂ",
    internships: "ਇੰਟਰਨਸ਼ਿਪ",
    events: "ਇਵੈਂਟ",
    courses: "ਕੋਰਸ",
    assessments: "ਮੁਲਾਂਕਣ",
    resume: "ਰਿਜ਼ਿਊਮੇ",
    profile: "ਪ੍ਰੋਫਾਈਲ",
    settings: "ਸੈਟਿੰਗਾਂ",
    messages: "ਸੁਨੇਹੇ",
    notifications: "ਸੂਚਨਾਵਾਂ",
    search: "ਖੋਜੋ",
    save: "ਸੇਵ",
    cancel: "ਰੱਦ",
    delete: "ਮਿਟਾਓ",
    edit: "ਸੰਪਾਦਿਤ",
    view: "ਵੇਖੋ",
    apply: "ਅਰਜ਼ੀ",
    register: "ਰਜਿਸਟਰ",
    dashboard: "ਡੈਸ਼ਬੋਰਡ",
    home: "ਹੋਮ",
    network: "ਨੈੱਟਵਰਕ",
    companies: "ਕੰਪਨੀਆਂ",
    mentorship: "ਮੈਂਟਰਸ਼ਿਪ",
    blogs: "ਬਲੌਗ",
    loading: "ਲੋਡ ਹੋ ਰਿਹਾ ਹੈ...",
    error: "ਗਲਤੀ ਹੋਈ",
    success: "ਸਫਲਤਾ!",
    noResults: "ਕੋਈ ਨਤੀਜੇ ਨਹੀਂ",
    seeAll: "ਸਭ ਵੇਖੋ",
  },
};

interface LanguageContextType {
  language: LanguageCode;
  setLanguage: (lang: LanguageCode) => void;
  t: (key: TranslationKey) => string;
}

const LanguageContext = createContext<LanguageContextType | null>(null);

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    // Return a default implementation if not in provider
    return {
      language: "en" as LanguageCode,
      setLanguage: () => {},
      t: (key: TranslationKey) => translations.en[key] || key,
    };
  }
  return context;
}

export function useLanguageProvider() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [language, setLanguageState] = useState<LanguageCode>("en");

  // Fetch user preference from DB
  const { data: preference } = useQuery({
    queryKey: ["language-preference", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data } = await supabase
        .from("user_language_preferences")
        .select("preferred_language")
        .eq("user_id", user.id)
        .maybeSingle();
      return data?.preferred_language as LanguageCode | null;
    },
    enabled: !!user?.id,
  });

  // Update language mutation
  const updateLanguage = useMutation({
    mutationFn: async (lang: LanguageCode) => {
      if (!user?.id) {
        localStorage.setItem("preferred_language", lang);
        return;
      }

      const { error } = await supabase
        .from("user_language_preferences")
        .upsert({ user_id: user.id, preferred_language: lang });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["language-preference"] });
    },
  });

  useEffect(() => {
    if (preference) {
      setLanguageState(preference);
    } else {
      const stored = localStorage.getItem("preferred_language") as LanguageCode;
      if (stored && SUPPORTED_LANGUAGES.some((l) => l.code === stored)) {
        setLanguageState(stored);
      }
    }
  }, [preference]);

  const setLanguage = (lang: LanguageCode) => {
    setLanguageState(lang);
    updateLanguage.mutate(lang);
  };

  const t = (key: TranslationKey): string => {
    return translations[language]?.[key] || translations.en[key] || key;
  };

  return {
    language,
    setLanguage,
    t,
    LanguageContext,
  };
}

export { LanguageContext };
