/**
 * Export tasks array to CSV format and trigger browser file download.
 */
export function exportTasksToCSV(tasks, filenamePrefix = 'taskflow_tasks') {
  if (!tasks || tasks.length === 0) return;

  const headers = [
    'Task Key',
    'Title',
    'Project',
    'Status',
    'Priority',
    'Assignee Name',
    'Assignee Email',
    'Created At',
    'Due Date',
  ];

  const escapeCSV = (field) => {
    if (field === null || field === undefined) return '""';
    const str = String(field).replace(/"/g, '""');
    return `"${str}"`;
  };

  const rows = tasks.map((t) => [
    escapeCSV(`${t.project?.key || 'TASK'}-${t.id.slice(0, 4)}`),
    escapeCSV(t.title),
    escapeCSV(t.project?.name || ''),
    escapeCSV(t.status),
    escapeCSV(t.priority),
    escapeCSV(t.assignee?.name || 'Unassigned'),
    escapeCSV(t.assignee?.email || ''),
    escapeCSV(t.createdAt ? new Date(t.createdAt).toLocaleString() : ''),
    escapeCSV(t.dueDate ? new Date(t.dueDate).toLocaleDateString() : 'No Due Date'),
  ]);

  const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  const dateStr = new Date().toISOString().split('T')[0];
  link.setAttribute('href', url);
  link.setAttribute('download', `${filenamePrefix}_${dateStr}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Export tasks array to JSON format and trigger browser file download.
 */
export function exportTasksToJSON(tasks, filenamePrefix = 'taskflow_tasks') {
  if (!tasks || tasks.length === 0) return;

  const exportData = tasks.map((t) => ({
    key: `${t.project?.key || 'TASK'}-${t.id.slice(0, 4)}`,
    title: t.title,
    description: t.description || '',
    project: t.project?.name || '',
    status: t.status,
    priority: t.priority,
    assignee: t.assignee ? { name: t.assignee.name, email: t.assignee.email } : null,
    createdAt: t.createdAt,
    dueDate: t.dueDate,
  }));

  const jsonContent = JSON.stringify(exportData, null, 2);
  const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  const dateStr = new Date().toISOString().split('T')[0];
  link.setAttribute('href', url);
  link.setAttribute('download', `${filenamePrefix}_${dateStr}.json`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
