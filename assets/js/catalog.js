/* ==========================================================================
   CodeArrive - Project catalogue
   Single source of truth for the marketplace. Adding a project here is all
   that is needed - the grid, filters, counts and detail dialog derive from it.
   ========================================================================== */

export const CATEGORIES = [
  'All',
  'Web Apps',
  'Mobile Apps',
  'Cloud / DevOps',
  'Automation Scripts',
  'AI / ML',
  'Embedded Systems',
]

export const PRICE_BANDS = [
  { id: 'any', label: 'Any price', test: () => true },
  { id: 'low', label: 'Under $150', test: (p) => p < 150 },
  { id: 'mid', label: '$150 – $250', test: (p) => p >= 150 && p <= 250 },
  { id: 'high', label: '$250+', test: (p) => p > 250 },
]

export const PROJECTS = [
  {
    id: 'campus-connect',
    title: 'CampusConnect — Student Community Platform',
    category: 'Web Apps',
    stack: ['React', 'Node.js', 'PostgreSQL', 'Tailwind'],
    price: 149,
    description:
      'A full-stack social platform for college campuses with event boards, clubs, and real-time chat.',
    features: [
      'JWT auth and role-based access',
      'Real-time chat over Socket.io',
      'Event and club management',
      'Admin analytics dashboard',
    ],
  },
  {
    id: 'fitmotion',
    title: 'FitMotion — Cross-Platform Fitness Tracker',
    category: 'Mobile Apps',
    stack: ['React Native', 'Firebase', 'Expo'],
    price: 199,
    description:
      'A mobile fitness tracker with workout plans, progress charts, and wearable sync.',
    features: [
      'Offline-first data sync',
      'Workout plan builder',
      'Progress charts and streaks',
      'Push notifications',
    ],
  },
  {
    id: 'deployforge',
    title: 'DeployForge — CI/CD Pipeline Toolkit',
    category: 'Cloud / DevOps',
    stack: ['Docker', 'GitHub Actions', 'AWS', 'Terraform'],
    price: 249,
    description:
      'An opinionated deployment toolkit: containerised builds, infrastructure as code, and one-command releases.',
    features: [
      'Multi-stage Docker builds',
      'Terraform modules for AWS',
      'Blue/green release workflow',
      'Rollback and health checks',
    ],
  },
  {
    id: 'ledgerloop',
    title: 'LedgerLoop — Invoice Automation Suite',
    category: 'Automation Scripts',
    stack: ['Python', 'Pandas', 'REST APIs', 'Cron'],
    price: 129,
    description:
      'Automates invoice ingestion, reconciliation, and reporting across accounting tools.',
    features: [
      'PDF and CSV invoice parsing',
      'Rule-based reconciliation',
      'Scheduled report delivery',
      'Error queue with retries',
    ],
  },
  {
    id: 'visionsort',
    title: 'VisionSort — Image Classification Pipeline',
    category: 'AI / ML',
    stack: ['PyTorch', 'FastAPI', 'Docker', 'OpenCV'],
    price: 279,
    description:
      'An end-to-end computer vision pipeline: dataset prep, training, evaluation, and a served inference API.',
    features: [
      'Transfer learning on ResNet',
      'Augmentation and eval notebooks',
      'FastAPI inference endpoint',
      'Confusion matrix reporting',
    ],
  },
  {
    id: 'smartgrid-node',
    title: 'SmartGrid Node — IoT Energy Monitor',
    category: 'Embedded Systems',
    stack: ['ESP32', 'C++', 'MQTT', 'InfluxDB'],
    price: 219,
    description:
      'A microcontroller energy monitor that streams live readings to a time-series dashboard.',
    features: [
      'Current and voltage sensing',
      'MQTT telemetry over Wi-Fi',
      'Grafana dashboard preset',
      'Over-the-air firmware updates',
    ],
  },
  {
    id: 'medisync',
    title: 'MediSync — Clinic Management System',
    category: 'Web Apps',
    stack: ['Next.js', 'Prisma', 'PostgreSQL', 'Stripe'],
    price: 259,
    description:
      'Appointment scheduling, patient records, and billing for small clinics, with role-scoped access.',
    features: [
      'Appointment calendar with conflicts',
      'Encrypted patient records',
      'Stripe billing and invoices',
      'Audit log for every change',
    ],
  },
  {
    id: 'routewise',
    title: 'RouteWise — Delivery Optimisation Engine',
    category: 'AI / ML',
    stack: ['Python', 'OR-Tools', 'Flask', 'Leaflet'],
    price: 239,
    description:
      'Solves vehicle routing with time windows and renders optimised routes on an interactive map.',
    features: [
      'Capacitated vehicle routing',
      'Time-window constraints',
      'Interactive map visualisation',
      'CSV import and export',
    ],
  },
  {
    id: 'shiftmate',
    title: 'ShiftMate — Workforce Scheduling App',
    category: 'Mobile Apps',
    stack: ['Flutter', 'Dart', 'Supabase'],
    price: 189,
    description:
      'Shift rostering with availability, swap requests, and manager approvals on Android and iOS.',
    features: [
      'Availability and swap requests',
      'Manager approval workflow',
      'Push reminders before shifts',
      'Exportable timesheets',
    ],
  },
  {
    id: 'sentryscan',
    title: 'SentryScan — Log Anomaly Detector',
    category: 'Automation Scripts',
    stack: ['Python', 'Elasticsearch', 'Slack API'],
    price: 145,
    description:
      'Watches application logs for anomalous patterns and raises structured alerts into Slack.',
    features: [
      'Baseline and deviation scoring',
      'Configurable alert rules',
      'Slack alert threading',
      'Daily digest summaries',
    ],
  },
  {
    id: 'cloudledger',
    title: 'CloudLedger — Multi-Cloud Cost Reporter',
    category: 'Cloud / DevOps',
    stack: ['Go', 'AWS SDK', 'Azure SDK', 'Grafana'],
    price: 295,
    description:
      'Pulls billing data from multiple cloud accounts into one normalised cost dashboard.',
    features: [
      'AWS and Azure billing ingest',
      'Per-team cost allocation',
      'Budget threshold alerts',
      'Exportable monthly reports',
    ],
  },
  {
    id: 'agridrone',
    title: 'AgriDrone — Field Survey Controller',
    category: 'Embedded Systems',
    stack: ['Raspberry Pi', 'Python', 'LoRa', 'OpenCV'],
    price: 265,
    description:
      'A flight-path controller and imaging rig for automated crop-health surveys.',
    features: [
      'Waypoint mission planning',
      'NDVI imaging capture',
      'LoRa telemetry link',
      'Ground station dashboard',
    ],
  },
]

/** Two-letter monogram used on the card plate. */
export function monogram(title) {
  const words = title.replace(/[^A-Za-z ]/g, ' ').trim().split(/\s+/)
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase()
  return (words[0][0] + words[1][0]).toUpperCase()
}
