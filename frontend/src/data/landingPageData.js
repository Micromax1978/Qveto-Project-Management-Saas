export const NAV_LINKS = [
  { name: 'Features', href: '#features' },
  { name: 'How It Works', href: '#how-it-works' },
  { name: 'Solutions', href: '#solutions' },
  { name: 'About', href: '#about' },
];

export const VALUE_PROPOSITIONS = [
  {
    id: 'workspace',
    title: 'One Organized Workspace',
    description: 'Centralize roadmaps, sprints, and daily task lists in a unified, friction-free environment.',
    iconName: 'LayoutGrid',
  },
  {
    id: 'ownership',
    title: 'Clear Task Ownership',
    description: 'Eliminate ambiguity with designated owners, explicit priorities, and transparent timelines.',
    iconName: 'UserCheck',
  },
  {
    id: 'visibility',
    title: 'Real-Time Team Visibility',
    description: 'Keep stakeholders informed with live progress feeds and cross-functional project tracking.',
    iconName: 'Activity',
  },
  {
    id: 'progress',
    title: 'Measurable Project Progress',
    description: 'Track delivery velocity and milestone status with clear visual completion metrics.',
    iconName: 'TrendingUp',
  },
];

export const FEATURES = [
  {
    id: 'project-management',
    title: 'Project Management',
    description: 'Organize projects, define milestones, and keep every initiative moving toward its goals.',
    badge: 'Structure',
    iconName: 'FolderKanban',
  },
  {
    id: 'task-management',
    title: 'Smart Task Management',
    description: 'Assign responsibilities, set priorities, and keep individual tasks clear and actionable.',
    badge: 'Execution',
    iconName: 'CheckSquare',
  },
  {
    id: 'kanban-boards',
    title: 'Visual Kanban Boards',
    description: 'See work move from To Do to Done with a visual workflow that makes progress easy to understand.',
    badge: 'Workflow',
    iconName: 'Columns3',
  },
  {
    id: 'team-collaboration',
    title: 'Team Collaboration',
    description: 'Keep project discussions, updates, and task ownership connected to the work itself.',
    badge: 'Communication',
    iconName: 'Users',
  },
  {
    id: 'progress-tracking',
    title: 'Progress Tracking',
    description: 'Understand project status, completed work, and upcoming priorities at a glance.',
    badge: 'Visibility',
    iconName: 'BarChart2',
  },
  {
    id: 'productivity-analytics',
    title: 'Productivity Analytics',
    description: 'Identify bottlenecks and make better planning decisions using project progress and productivity insights.',
    badge: 'Insights',
    iconName: 'LineChart',
  },
];

export const WORKFLOW_STEPS = [
  {
    stepNumber: '01',
    title: 'Plan Your Projects',
    description: 'Create projects, organize work, and define the priorities that matter.',
    tag: 'Initiation',
    details: ['Structure milestones', 'Define backlog items', 'Establish timelines'],
  },
  {
    stepNumber: '02',
    title: 'Coordinate Your Team',
    description: 'Assign tasks, clarify ownership, and keep everyone aligned.',
    tag: 'Execution',
    details: ['Assign clear owners', 'Set priority levels', 'Foster contextual discussions'],
  },
  {
    stepNumber: '03',
    title: 'Track Your Progress',
    description: 'Monitor project status and understand what needs attention.',
    tag: 'Delivery',
    details: ['Visual board velocity', 'Identify blockers early', 'Celebrate completed milestones'],
  },
];

export const COLLABORATION_BENEFITS = [
  {
    title: 'Clear ownership for every task.',
    description: 'Every deliverable has an assigned owner, clear due dates, and explicit priority rankings to avoid ambiguity.',
  },
  {
    title: 'Shared visibility across projects.',
    description: 'All team members see where projects stand in real-time, removing the need for repetitive status meetings.',
  },
  {
    title: 'Organized collaboration around work.',
    description: 'Contextual comment threads, file attachments, and activity logs remain anchored directly to relevant tasks.',
  },
];

export const SAMPLE_KANBAN_DATA = {
  todo: [
    {
      id: 'tsk-101',
      title: 'Design landing page wireframes',
      category: 'Design',
      priority: 'High',
      priorityColor: 'text-amber-700 bg-amber-50 border-amber-200',
      assignee: { name: 'Elena Chen', initials: 'EC', bg: 'bg-indigo-600' },
      dueDate: 'Oct 18',
      comments: 3,
      checklist: '4/4',
    },
    {
      id: 'tsk-102',
      title: 'Review typography and accessibility contrast',
      category: 'UX Audit',
      priority: 'Medium',
      priorityColor: 'text-blue-700 bg-blue-50 border-blue-200',
      assignee: { name: 'Sarah Lin', initials: 'SL', bg: 'bg-emerald-600' },
      dueDate: 'Oct 20',
      comments: 1,
      checklist: '2/3',
    },
  ],
  inProgress: [
    {
      id: 'tsk-103',
      title: 'Build navigation and responsive menu',
      category: 'Engineering',
      priority: 'Urgent',
      priorityColor: 'text-rose-700 bg-rose-50 border-rose-200',
      assignee: { name: 'David Kim', initials: 'DK', bg: 'bg-blue-600' },
      dueDate: 'Tomorrow',
      comments: 6,
      checklist: '5/6',
    },
    {
      id: 'tsk-104',
      title: 'Create reusable UI component library',
      category: 'Frontend',
      priority: 'High',
      priorityColor: 'text-amber-700 bg-amber-50 border-amber-200',
      assignee: { name: 'Marcus Ray', initials: 'MR', bg: 'bg-purple-600' },
      dueDate: 'In 2 days',
      comments: 4,
      checklist: '7/8',
    },
  ],
  inReview: [
    {
      id: 'tsk-105',
      title: 'Review components with design system',
      category: 'Quality',
      priority: 'Medium',
      priorityColor: 'text-blue-700 bg-blue-50 border-blue-200',
      assignee: { name: 'Elena Chen', initials: 'EC', bg: 'bg-indigo-600' },
      dueDate: 'Oct 16',
      comments: 8,
      checklist: '3/3',
    },
  ],
  done: [
    {
      id: 'tsk-106',
      title: 'Finalize responsive layout breakpoints',
      category: 'Engineering',
      priority: 'High',
      priorityColor: 'text-emerald-700 bg-emerald-50 border-emerald-200',
      assignee: { name: 'David Kim', initials: 'DK', bg: 'bg-blue-600' },
      dueDate: 'Yesterday',
      comments: 2,
      checklist: '6/6',
    },
    {
      id: 'tsk-107',
      title: 'Setup production bundle optimization',
      category: 'DevOps',
      priority: 'Normal',
      priorityColor: 'text-slate-700 bg-slate-50 border-slate-200',
      assignee: { name: 'Sarah Lin', initials: 'SL', bg: 'bg-emerald-600' },
      dueDate: 'Oct 12',
      comments: 0,
      checklist: '2/2',
    },
  ],
};

export const SAMPLE_ANALYTICS = {
  metrics: [
    { label: 'Project Completion', value: '74%', change: '+12% this week', positive: true },
    { label: 'Tasks Completed', value: '48', change: '14 tasks closed', positive: true },
    { label: 'Tasks In Progress', value: '16', change: 'Active sprint', positive: null },
    { label: 'Overdue Tasks', value: '2', change: 'Requires attention', positive: false },
  ],
  weeklyActivity: [
    { day: 'Mon', completed: 6, planned: 8 },
    { day: 'Tue', completed: 9, planned: 10 },
    { day: 'Wed', completed: 12, planned: 11 },
    { day: 'Thu', completed: 8, planned: 9 },
    { day: 'Fri', completed: 11, planned: 10 },
    { day: 'Sat', completed: 2, planned: 2 },
    { day: 'Sun', completed: 0, planned: 0 },
  ],
  projects: [
    { name: 'Website Redesign', progress: 74, status: 'On Track', due: 'Nov 4', color: 'bg-blue-600' },
    { name: 'Mobile App v2.0', progress: 58, status: 'In Review', due: 'Nov 18', color: 'bg-indigo-600' },
    { name: 'Design System Guidelines', progress: 92, status: 'Near Completion', due: 'Oct 28', color: 'bg-emerald-600' },
    { name: 'Product Analytics Integration', progress: 35, status: 'In Progress', due: 'Dec 02', color: 'bg-amber-500' },
  ],
};
