/* ============================================================
   VENTURE CONNECT  Production Data Models
   All data structures for the Venture Connect platform.
   ============================================================ */

const GATE_STAGES = [
  { key: "idea-submitted",  name: "Idea Submitted",          sub: "Entry",              icon: "spark",   desc: "Your idea was submitted and accepted into the Venture Connect pipeline." },
  { key: "workspace",       name: "Idea Workspace Completed",sub: "Build",              icon: "edit",    desc: "All ten sections of your Idea Workspace were completed with real substance." },
  { key: "auto-check",      name: "Automated Quality Check", sub: "Quality check",      icon: "scan",    desc: "Rule-based and meaning-based checks confirmed your application is complete and coherent." },
  { key: "vc-review",       name: "Venture Connect Review",  sub: "Venture Connect",    icon: "shield",  desc: "A Venture Connect analyst reviewed your application for viability and clarity." },
  { key: "pitch-review",    name: "Pitch Review",            sub: "Venture Connect",    icon: "present", desc: "Your pitch materials were reviewed by an investment committee." },
  { key: "interview",       name: "Founder Interview",       sub: "Venture Connect",    icon: "users",   desc: "A structured interview covering your problem, market, and execution plan." },
  { key: "validation",      name: "Evidence / Validation Verification", sub: "Verify",  icon: "verify",  desc: "Customer interviews, pilots, surveys, and traction evidence are verified." },
  { key: "gate-passed",     name: "Venture Connect Quality Gate Passed", sub: "Quality gate", icon: "trophy", desc: "Your startup has officially passed the Venture Connect Quality Gate." },
  { key: "investor-access", name: "Investor / Incubator Access", sub: "Access",        icon: "eye",     desc: "Your startup is now visible to participating investors and incubators." }
];

const WORKSPACE_SECTIONS = [
  { key: "problem",        label: "Problem",            q: "What problem are you solving?",                        hint: "Describe the problem in real-world terms. Who feels it, how often, and how painful is it?" },
  { key: "solution",       label: "Solution",           q: "How does your product solve this problem?",            hint: "Explain your product, how it works, and why it removes the pain." },
  { key: "targetCustomer", label: "Target Customer",    q: "Who specifically experiences this problem?",           hint: "Name the exact segment  not 'everyone'. Include who, where, and how they behave." },
  { key: "market",         label: "Market",             q: "What market are you targeting?",                       hint: "Sizing, geography, and growth of the market you plan to serve." },
  { key: "businessModel",  label: "Business Model",     q: "How will your startup make money?",                    hint: "Pricing, revenue streams, and unit economics at a high level." },
  { key: "validation",     label: "Validation",         q: "What evidence do you have that this problem exists?",  hint: "Interviews, surveys, pilots, waitlists, letters of intent, or early revenue." },
  { key: "competition",    label: "Competition",        q: "Who already solves this problem?",                     hint: "Direct competitors, indirect alternatives, and the status quo." },
  { key: "advantage",      label: "Competitive Advantage", q: "Why is your solution different?",                   hint: "What defensible edge do you have  technology, access, data, or distribution?" },
  { key: "funding",        label: "Funding",            q: "How much funding are you seeking?",                    hint: "Amount and instrument, e.g. $150K pre-seed SAFE." },
  { key: "useOfFunds",     label: "Use of Funds",       q: "How will you use the funding?",                        hint: "Break down allocation: team, product, pilots, go-to-market, buffer." }
];

/* ============================================================
   AUTHENTICATION OPTIONS
   ============================================================ */

const FOUNDER_TYPES = ["Student Founder", "Student Team", "Early-stage Founder"];
const INDUSTRIES = ["AI", "AgriTech", "FinTech", "HealthTech", "EdTech", "ClimateTech", "SaaS", "DeepTech", "Hardware", "Other"];
const STARTUP_STAGES = ["Idea Stage", "Prototype", "MVP", "Early Revenue"];
const INVESTOR_SECTORS = ["AI", "FinTech", "AgriTech", "HealthTech", "EdTech", "ClimateTech", "DeepTech", "SaaS", "Consumer", "Hardware", "Robotics", "Other"];
const INVESTOR_STAGES = ["Idea Stage", "Pre-Seed", "Seed", "Series A", "Series B+", "MVP Stage", "Early Revenue"];
const TICKET_SIZES = ["$1K$10K", "$10K$50K", "$50K$100K", "$100K+", "Custom"];
const GEOGRAPHIES = ["India", "Andhra Pradesh", "South India", "India + Global", "Global"];
const INCUBATOR_ORG_TYPES = ["College Incubator", "Government Incubator", "Private Incubator", "University Incubator", "Corporate Incubator", "Independent Incubator"];
const INCUBATOR_SECTORS = ["AI", "AgriTech", "FinTech", "HealthTech", "Health", "EdTech", "ClimateTech", "DeepTech", "SaaS", "Hardware", "Other"];
const INCUBATOR_STAGES = ["Idea Stage", "Pre-Seed", "MVP", "Early Revenue"];
const SUPPORT_TYPES = ["Mentorship", "Funding", "Workspace", "Technical Support", "Business Development", "Market Access", "Networking", "Prototype Support", "Other"];
const ORGANIZER_TYPES = ["College", "University", "Company", "Startup", "Community", "Government Organization", "NGO", "Independent Organizer"];
const HACKATHON_DOMAINS = ["AI", "Web Development", "Hardware", "Robotics", "FinTech", "AgriTech", "ClimateTech", "HealthTech", "Other"];
const AUTH_LOCATIONS = ["India", "Global", "Other"];

const OPP_CATEGORIES = ["Incubators", "Accelerators", "Investors", "Hackathons", "Competitions", "Grants", "Startup Programs"];
const OPP_TYPES = [
  ["Incubators", "Incubator"],
  ["Accelerators", "Accelerator"],
  ["Investors", "Investor"],
  ["Hackathons", "Hackathon"],
  ["Competitions", "Competition"],
  ["Grants", "Grant"],
  ["Startup Programs", "Startup Program"]
];

/* ============================================================
   INTERNAL VENTURE CONNECT REVIEW SYSTEM
   ============================================================ */

const INTERNAL_STAGES = [
  { key: "submitted", name: "Application Submitted", icon: "send", group: "Pipeline" },
  { key: "auto-check", name: "Automated Quality Check", icon: "scan", group: "Quality control" },
  { key: "vc-review", name: "Venture Connect Review", icon: "shield", group: "Review" },
  { key: "pitch-review", name: "Pitch Review", icon: "present", group: "Review" },
  { key: "interview", name: "Founder Interview", icon: "users", group: "Review" },
  { key: "validation", name: "Evidence / Validation Verification", icon: "verify", group: "Verification" },
  { key: "gate", name: "Quality Gate Decision", icon: "trophy", group: "Decision" },
  { key: "unlocked", name: "Unlocked for Investor / Incubator Review", icon: "eye", group: "Access" }
];

const INTERNAL_USER = {
  name: "Venture Connect Review",
  org: "Venture Connect",
  role: "Quality Control",
  bio: "Internal quality-control team. Reviews every application before it reaches investors and incubators."
};
