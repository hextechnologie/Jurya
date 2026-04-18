// ============================================================
// Structured Coach Profile Types
// ============================================================

export type EmploymentType = 'Full-time' | 'Part-time' | 'Freelance' | 'Internship' | 'Contract' | 'Self-employed'

export type EducationType = 'University' | 'Certification' | 'High School' | 'Online Course' | 'Vocational' | 'Other'

export type SkillCategory = 'Technical' | 'Soft Skills' | 'Languages' | 'Tools'

export type AchievementType = 'Professional Achievement' | 'Project' | 'Public Speaking' | 'Publication' | 'Award' | 'Other'

export interface CoachExperience {
  id: string
  coach_id: string
  job_title: string
  company_name: string
  employment_type?: EmploymentType
  location?: string
  start_month?: number
  start_year: number
  end_month?: number
  end_year?: number
  is_current: boolean
  description?: string
  order_index: number
  created_at: string
  updated_at: string
}

export interface CoachEducation {
  id: string
  coach_id: string
  education_type: EducationType
  institution_name: string
  degree?: string
  field_of_study?: string
  start_year?: number
  end_year?: number
  is_ongoing: boolean
  grade?: string
  specialization?: string
  platform?: string
  credential_id?: string
  credential_url?: string
  issue_month?: number
  issue_year?: number
  expiry_month?: number
  expiry_year?: number
  no_expiry: boolean
  description?: string
  order_index: number
  created_at: string
  updated_at: string
}

export interface CoachSkill {
  id: string
  coach_id: string
  skill_name: string
  skill_category: SkillCategory
  order_index: number
  created_at: string
}

export interface CoachAchievement {
  id: string
  coach_id: string
  achievement_type?: AchievementType
  title: string
  description?: string
  achievement_month?: number
  achievement_year?: number
  url?: string
  order_index: number
  created_at: string
  updated_at: string
}

// Form data types (without server-generated fields)
export type ExperienceFormData = Omit<CoachExperience, 'id' | 'coach_id' | 'created_at' | 'updated_at' | 'order_index'>

export type EducationFormData = Omit<CoachEducation, 'id' | 'coach_id' | 'created_at' | 'updated_at' | 'order_index'>

export type SkillFormData = Omit<CoachSkill, 'id' | 'coach_id' | 'created_at' | 'order_index'>

export type AchievementFormData = Omit<CoachAchievement, 'id' | 'coach_id' | 'created_at' | 'updated_at' | 'order_index'>

// Month names for date dropdowns
export const MONTHS = [
  { value: 1, label: 'January' },
  { value: 2, label: 'February' },
  { value: 3, label: 'March' },
  { value: 4, label: 'April' },
  { value: 5, label: 'May' },
  { value: 6, label: 'June' },
  { value: 7, label: 'July' },
  { value: 8, label: 'August' },
  { value: 9, label: 'September' },
  { value: 10, label: 'October' },
  { value: 11, label: 'November' },
  { value: 12, label: 'December' },
]

// Generate years array (2000-2028)
export const YEARS = Array.from({ length: 29 }, (_, i) => 2000 + i)

// Employment types
export const EMPLOYMENT_TYPES: EmploymentType[] = [
  'Full-time',
  'Part-time',
  'Freelance',
  'Internship',
  'Contract',
  'Self-employed',
]

// Education types
export const EDUCATION_TYPES: Array<{ value: EducationType; label: string; icon: string }> = [
  { value: 'University', label: 'University / College', icon: '🎓' },
  { value: 'Certification', label: 'Professional Certification', icon: '📜' },
  { value: 'High School', label: 'High School / Baccalaureate', icon: '🏫' },
  { value: 'Online Course', label: 'Online Course / Bootcamp', icon: '💻' },
  { value: 'Vocational', label: 'Vocational Training', icon: '🔧' },
  { value: 'Other', label: 'Other', icon: '📚' },
]

// Degree types
export const DEGREE_TYPES = [
  "Bachelor's (Licence)",
  "Master's",
  "PhD",
  "Engineer Diploma",
  "DUT",
  "BTS",
  "Other",
]

// Grade options
export const GRADES = [
  'Excellent (Très bien)',
  'Very Good (Bien)',
  'Good (Assez bien)',
  'Pass (Passable)',
]

// Baccalaureate specializations
export const BAC_SPECIALIZATIONS = [
  'Sciences',
  'Mathematics',
  'Literature',
  'Economics',
  'Technology',
  'Other',
]

// Online course platforms
export const COURSE_PLATFORMS = [
  'Coursera',
  'Udemy',
  'edX',
  'Le Wagon',
  'Simplon',
  'OpenClassrooms',
  'YouTube',
  'LinkedIn Learning',
  'Udacity',
  'Other',
]

// Popular skill suggestions by category
export const SKILL_SUGGESTIONS: Record<SkillCategory, string[]> = {
  Technical: [
    // Programming Languages
    'JavaScript', 'TypeScript', 'Python', 'Java', 'C++', 'C#', 'PHP', 'Ruby', 'Go', 'Rust',
    'Swift', 'Kotlin', 'Scala', 'R', 'Perl', 'Bash', 'Shell Scripting', 'PowerShell',
    'Dart', 'Elixir', 'Clojure', 'Haskell', 'Lua', 'Assembly', 'COBOL', 'Fortran',
    // Web Development
    'React', 'Vue', 'Angular', 'Next.js', 'Nuxt.js', 'Svelte', 'Node.js', 'Express.js',
    'Django', 'Flask', 'FastAPI', 'Spring Boot', 'Laravel', 'Ruby on Rails', 'ASP.NET',
    'HTML', 'CSS', 'Tailwind CSS', 'Bootstrap', 'SASS', 'LESS', 'jQuery', 'Redux',
    'GraphQL', 'REST API', 'WebSockets', 'Webpack', 'Vite', 'Babel',
    // Databases
    'SQL', 'PostgreSQL', 'MongoDB', 'Redis', 'MySQL', 'Oracle Database', 'Microsoft SQL Server',
    'Cassandra', 'DynamoDB', 'Elasticsearch', 'MariaDB', 'SQLite', 'CouchDB', 'Neo4j',
    // Cloud & DevOps
    'AWS', 'Azure', 'Google Cloud', 'Docker', 'Kubernetes', 'Terraform', 'Ansible',
    'Jenkins', 'GitLab CI', 'GitHub Actions', 'CircleCI', 'Travis CI', 'Nginx', 'Apache',
    'Linux', 'Unix', 'Windows Server', 'CloudFormation', 'Serverless', 'Microservices',
    // AI & Data Science
    'Machine Learning', 'Data Science', 'AI', 'Deep Learning', 'Neural Networks',
    'TensorFlow', 'PyTorch', 'Keras', 'Scikit-learn', 'Pandas', 'NumPy', 'NLP',
    'Computer Vision', 'Big Data', 'Hadoop', 'Spark', 'Kafka', 'ETL', 'Data Mining',
    'Statistical Analysis', 'Predictive Modeling', 'Time Series Analysis',
    // Mobile Development
    'iOS Development', 'Android Development', 'React Native', 'Flutter', 'Xamarin',
    'SwiftUI', 'Jetpack Compose', 'Mobile UI/UX', 'App Store Optimization',
    // Hardware & Embedded
    'VHDL', 'Verilog', 'SystemVerilog', 'FPGA', 'ASIC Design', 'RTL Design',
    'Embedded Systems', 'Microcontrollers', 'ARM', 'RISC-V', 'Arduino', 'Raspberry Pi',
    'Circuit Design', 'PCB Design', 'Analog Design', 'Digital Signal Processing',
    'IoT', 'Sensor Integration', 'Real-Time Systems', 'Firmware Development',
    // Security & Networking
    'Cybersecurity', 'Penetration Testing', 'Ethical Hacking', 'Network Security',
    'Cryptography', 'SSL/TLS', 'Firewall Configuration', 'SIEM', 'ISO 27001',
    'TCP/IP', 'DNS', 'VPN', 'Load Balancing', 'Network Architecture',
    // Quality & Testing
    'Test Automation', 'Selenium', 'Jest', 'Cypress', 'JUnit', 'PyTest',
    'Unit Testing', 'Integration Testing', 'QA', 'Performance Testing', 'Load Testing',
    // Gaming & Graphics
    'Unity', 'Unreal Engine', 'Game Development', '3D Modeling', 'Blender',
    'OpenGL', 'DirectX', 'Shader Programming', 'Animation',
    // Blockchain & Web3
    'Blockchain', 'Smart Contracts', 'Solidity', 'Ethereum', 'Web3',
    'Cryptocurrency', 'DeFi', 'NFT', 'Hyperledger',
    // Healthcare Tech
    'HL7', 'FHIR', 'DICOM', 'Medical Imaging', 'EMR Systems', 'Healthcare IT',
    'Telemedicine', 'Medical Device Software', 'HIPAA Compliance',
    // Finance Tech
    'Financial Modeling', 'Quantitative Analysis', 'Algorithmic Trading',
    'Risk Management Systems', 'Bloomberg Terminal', 'Trading Systems',
    // Manufacturing & Industrial
    'CAD', 'CAM', 'SolidWorks', 'AutoCAD', 'CATIA', 'Inventor', 'Fusion 360',
    'PLC Programming', 'SCADA', 'Industrial Automation', 'Robotics',
    'Manufacturing Process', 'Quality Control', 'Six Sigma', 'Lean Manufacturing',
    // Scientific Computing
    'Computational Physics', 'Bioinformatics', 'Molecular Modeling',
    'Finite Element Analysis', 'CFD', 'Scientific Visualization',
    // GIS & Mapping
    'GIS', 'ArcGIS', 'QGIS', 'Geospatial Analysis', 'Remote Sensing',
    'Cartography', 'GPS Technology', 'Spatial Databases',
  ],
  'Soft Skills': [
    // Leadership & Management
    'Leadership', 'Team Leadership', 'People Management', 'Executive Leadership',
    'Change Management', 'Organizational Leadership', 'Servant Leadership',
    'Coaching', 'Mentoring', 'Employee Development', 'Performance Management',
    'Stakeholder Management', 'Cross-functional Team Leadership',
    // Communication
    'Communication', 'Written Communication', 'Verbal Communication', 'Presentation Skills',
    'Public Speaking', 'Active Listening', 'Interpersonal Skills', 'Business Communication',
    'Report Writing', 'Technical Writing', 'Storytelling', 'Persuasion',
    // Project & Product Management
    'Project Management', 'Agile', 'Scrum', 'Kanban', 'Waterfall', 'PRINCE2',
    'Product Management', 'Product Strategy', 'Roadmap Planning', 'Backlog Management',
    'Sprint Planning', 'Release Management', 'Risk Management', 'Resource Allocation',
    // Strategic & Business
    'Strategic Planning', 'Strategic Thinking', 'Business Strategy', 'Business Development',
    'Business Analysis', 'Market Research', 'Competitive Analysis', 'SWOT Analysis',
    'Business Intelligence', 'KPI Development', 'Metrics & Analytics', 'ROI Analysis',
    'Budgeting', 'Financial Planning', 'P&L Management', 'Cost Management',
    // Problem Solving & Analysis
    'Problem Solving', 'Critical Thinking', 'Analytical Thinking', 'Root Cause Analysis',
    'Decision Making', 'Data-Driven Decision Making', 'Creative Problem Solving',
    'Systems Thinking', 'Design Thinking', 'Process Improvement', 'Troubleshooting',
    // Personal Effectiveness
    'Time Management', 'Organization', 'Attention to Detail', 'Multitasking',
    'Prioritization', 'Self-Motivation', 'Self-Management', 'Work-Life Balance',
    'Stress Management', 'Resilience', 'Adaptability', 'Flexibility',
    // Collaboration & Teamwork
    'Teamwork', 'Collaboration', 'Team Building', 'Cross-functional Collaboration',
    'Remote Collaboration', 'Consensus Building', 'Facilitation', 'Workshop Facilitation',
    // Conflict & Negotiation
    'Conflict Resolution', 'Negotiation', 'Mediation', 'Dispute Resolution',
    'Diplomacy', 'Influence', 'Relationship Building', 'Stakeholder Engagement',
    // Innovation & Creativity
    'Creativity', 'Innovation', 'Creative Thinking', 'Brainstorming',
    'Ideation', 'Product Innovation', 'Service Design', 'User Research',
    // Customer & Sales
    'Customer Service', 'Customer Experience', 'Customer Success', 'Client Relations',
    'Account Management', 'Sales', 'Sales Strategy', 'Consultative Selling',
    'Relationship Management', 'Business Networking', 'Cold Calling', 'Lead Generation',
    // Healthcare Soft Skills
    'Patient Care', 'Bedside Manner', 'Clinical Documentation', 'Medical Ethics',
    'Patient Education', 'Empathy', 'Compassion', 'Crisis Management',
    // Legal & Compliance
    'Legal Research', 'Contract Negotiation', 'Regulatory Compliance', 'Policy Development',
    'Risk Assessment', 'Audit', 'Compliance Management', 'Corporate Governance',
    // Education & Training
    'Teaching', 'Curriculum Development', 'Instructional Design', 'Training Delivery',
    'E-Learning', 'Student Assessment', 'Classroom Management', 'Educational Technology',
    // Creative Industries
    'Creative Direction', 'Art Direction', 'Copywriting', 'Content Strategy',
    'Brand Strategy', 'Brand Management', 'Visual Communication', 'Editorial',
    // Operations & Logistics
    'Operations Management', 'Supply Chain Management', 'Inventory Management',
    'Logistics', 'Process Optimization', 'Vendor Management', 'Procurement',
    'Quality Assurance', 'Continuous Improvement', 'Kaizen', 'Operational Excellence',
    // HR & Recruitment
    'Recruitment', 'Talent Acquisition', 'Interviewing', 'Onboarding',
    'Employee Relations', 'HR Policies', 'Compensation & Benefits', 'Diversity & Inclusion',
    // Safety & Emergency
    'Safety Management', 'Emergency Response', 'First Aid', 'CPR',
    'OSHA Compliance', 'Environmental Health & Safety', 'Incident Investigation',
  ],
  Languages: [
    // Major World Languages
    'English', 'Spanish', 'French', 'German', 'Italian', 'Portuguese', 'Dutch',
    'Russian', 'Polish', 'Ukrainian', 'Czech', 'Romanian', 'Hungarian', 'Swedish',
    'Norwegian', 'Danish', 'Finnish', 'Greek', 'Turkish',
    // Asian Languages
    'Chinese (Mandarin)', 'Chinese (Cantonese)', 'Japanese', 'Korean', 'Vietnamese',
    'Thai', 'Indonesian', 'Malay', 'Tagalog', 'Hindi', 'Urdu', 'Bengali', 'Tamil',
    'Telugu', 'Punjabi', 'Gujarati', 'Marathi', 'Kannada', 'Malayalam',
    // Middle Eastern & African Languages
    'Arabic', 'Hebrew', 'Persian (Farsi)', 'Kurdish', 'Pashto',
    'Swahili', 'Amharic', 'Yoruba', 'Igbo', 'Zulu', 'Afrikaans',
    // Other Languages
    'Latin', 'Classical Greek', 'Sanskrit',
    'Sign Language (ASL)', 'Sign Language (BSL)', 'Sign Language (Other)',
  ],
  Tools: [
    // Development & Version Control
    'Git', 'GitHub', 'GitLab', 'Bitbucket', 'SVN', 'Mercurial',
    'VS Code', 'IntelliJ IDEA', 'PyCharm', 'WebStorm', 'Eclipse', 'Vim', 'Emacs',
    'Xcode', 'Android Studio', 'Visual Studio', 'Sublime Text', 'Atom',
    // Project Management & Collaboration
    'Jira', 'Trello', 'Asana', 'Monday.com', 'ClickUp', 'Basecamp', 'Notion',
    'Confluence', 'Microsoft Project', 'Smartsheet', 'Airtable', 'Wrike',
    'Slack', 'Microsoft Teams', 'Discord', 'Zoom', 'Google Meet',
    // Design & Creative
    'Figma', 'Adobe XD', 'Sketch', 'InVision', 'Framer', 'Principle',
    'Photoshop', 'Illustrator', 'InDesign', 'After Effects', 'Premiere Pro',
    'Lightroom', 'CorelDRAW', 'Affinity Designer', 'Canva', 'Procreate',
    'Blender', 'Maya', 'Cinema 4D', 'ZBrush', '3ds Max',
    // Business & CRM
    'Salesforce', 'HubSpot', 'Zoho CRM', 'Microsoft Dynamics', 'Pipedrive',
    'SAP', 'Oracle ERP', 'NetSuite', 'Workday', 'Odoo', 'QuickBooks',
    'Zendesk', 'Intercom', 'Freshdesk', 'ServiceNow',
    // Analytics & BI
    'Tableau', 'Power BI', 'Looker', 'Google Analytics', 'Mixpanel', 'Amplitude',
    'Qlik', 'Sisense', 'Metabase', 'Grafana', 'Kibana', 'Splunk',
    // Marketing & SEO
    'Google Ads', 'Facebook Ads', 'LinkedIn Ads', 'HubSpot Marketing',
    'Mailchimp', 'SendGrid', 'Marketo', 'Pardot', 'Hootsuite', 'Buffer',
    'SEMrush', 'Ahrefs', 'Moz', 'Google Search Console', 'Hotjar',
    'WordPress', 'Drupal', 'Squarespace', 'Wix', 'Webflow',
    // Office & Productivity
    'Microsoft Office', 'Excel', 'Word', 'PowerPoint', 'Outlook',
    'Google Workspace', 'Google Sheets', 'Google Docs', 'Google Slides',
    'LibreOffice', 'OpenOffice', 'OneDrive', 'Dropbox', 'Box',
    // Hardware & Engineering
    'Xilinx Vivado', 'Intel Quartus', 'ModelSim', 'Cadence', 'Synopsys',
    'Altium Designer', 'Eagle', 'KiCad', 'OrCAD', 'LTspice', 'Multisim',
    'MATLAB', 'Simulink', 'LabVIEW', 'Mathematica', 'Octave',
    'SolidWorks', 'AutoCAD', 'CATIA', 'Inventor', 'Fusion 360', 'Revit',
    'SketchUp', 'Rhino', 'Grasshopper',
    // Scientific & Research
    'SPSS', 'SAS', 'Stata', 'R Studio', 'Jupyter Notebook', 'Origin',
    'GraphPad Prism', 'EndNote', 'Zotero', 'Mendeley', 'LaTeX', 'Overleaf',
    // Medical & Healthcare
    'Epic', 'Cerner', 'Meditech', 'Allscripts', 'eClinicalWorks',
    '3D Slicer', 'OsiriX', 'ImageJ', 'Horos', 'PACS',
    // GIS & Mapping
    'ArcGIS', 'QGIS', 'Google Earth Pro', 'MapInfo', 'GRASS GIS',
    'PostGIS', 'Mapbox', 'Leaflet', 'OpenStreetMap',
    // Testing & QA
    'Selenium', 'Cypress', 'Playwright', 'Jest', 'Mocha', 'Chai',
    'TestRail', 'Postman', 'SoapUI', 'JMeter', 'LoadRunner',
    // Security Tools
    'Wireshark', 'Nmap', 'Metasploit', 'Burp Suite', 'Kali Linux',
    'Nessus', 'Splunk', 'CrowdStrike', 'Palo Alto Networks',
    // HR & Recruitment
    'Workday', 'BambooHR', 'Greenhouse', 'Lever', 'LinkedIn Recruiter',
    'ATS Systems', 'Taleo', 'iCIMS', 'SuccessFactors',
    // E-Commerce
    'Shopify', 'WooCommerce', 'Magento', 'BigCommerce', 'PrestaShop',
    'Amazon Seller Central', 'eBay', 'Etsy',
    // Accounting & Finance
    'QuickBooks', 'Xero', 'Sage', 'FreshBooks', 'Wave',
    'Bloomberg Terminal', 'Reuters Eikon', 'FactSet', 'Morningstar',
    // Video & Audio
    'Final Cut Pro', 'DaVinci Resolve', 'Avid Media Composer',
    'Pro Tools', 'Logic Pro', 'Ableton Live', 'FL Studio', 'Audacity',
    // Construction & Architecture
    'Revit', 'AutoCAD Civil 3D', 'Tekla Structures', 'Primavera',
    'Procore', 'BIM 360', 'Navisworks', 'BIM', 'ArchiCAD',
  ],
}

// Achievement icons
export const ACHIEVEMENT_ICONS: Record<AchievementType, string> = {
  'Professional Achievement': '🏆',
  'Project': '💻',
  'Public Speaking': '📣',
  'Publication': '📝',
  'Award': '🥇',
  'Other': '⭐',
}

// Popular job titles for autocomplete
export const JOB_TITLES = [
  'Software Engineer',
  'Senior Software Engineer',
  'Lead Software Engineer',
  'Principal Engineer',
  'Tech Lead',
  'Engineering Manager',
  'CTO',
  'Product Manager',
  'Senior Product Manager',
  'Product Owner',
  'Data Scientist',
  'Data Analyst',
  'Machine Learning Engineer',
  'DevOps Engineer',
  'Site Reliability Engineer',
  'Frontend Developer',
  'Backend Developer',
  'Full Stack Developer',
  'Mobile Developer',
  'UX Designer',
  'UI Designer',
  'Product Designer',
  'Graphic Designer',
  'Business Analyst',
  'Project Manager',
  'Scrum Master',
  'QA Engineer',
  'Test Engineer',
]

// Popular companies
export const COMPANIES = [
  'Google', 'Amazon', 'Microsoft', 'Apple', 'Meta', 'Netflix', 'Tesla',
  'IBM', 'Oracle', 'SAP', 'Adobe', 'Salesforce', 'Intel', 'NVIDIA',
  'McKinsey', 'Boston Consulting Group', 'Bain & Company', 'Deloitte',
  'PwC', 'EY', 'KPMG', 'Accenture', 'Capgemini',
  'Goldman Sachs', 'Morgan Stanley', 'JP Morgan', 'Citibank', 'Bank of America',
  'Airbnb', 'Uber', 'Lyft', 'Spotify', 'Twitter', 'LinkedIn', 'Snapchat',
]

// Popular certification names
export const CERTIFICATIONS = [
  'AWS Certified Solutions Architect',
  'AWS Certified Developer',
  'Google Cloud Professional',
  'Azure Fundamentals',
  'Azure Administrator',
  'PMP - Project Management Professional',
  'CISSP',
  'Scrum Master (CSM)',
  'Product Owner (CSPO)',
  'CFA - Chartered Financial Analyst',
  'IELTS',
  'TOEFL',
  'DELF/DALF',
  'Six Sigma Green Belt',
  'Six Sigma Black Belt',
  'ITIL Certification',
]
