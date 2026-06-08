import React from 'react';

const STATUS_STYLES = {
  PENDING:    'bg-amber-100 text-amber-700',
  APPROVED:   'bg-blue-100 text-blue-700',
  REJECTED:   'bg-red-100 text-red-700',
  ISSUED:     'bg-violet-100 text-violet-700',
  RETURNED:   'bg-emerald-100 text-emerald-700',
  OVERDUE:    'bg-red-200 text-red-800',
  ACTIVE:     'bg-emerald-100 text-emerald-700',
  MAINTENANCE:'bg-amber-100 text-amber-700',
  RETIRED:    'bg-gray-100 text-gray-600',
  EXCELLENT:  'bg-emerald-100 text-emerald-700',
  GOOD:       'bg-blue-100 text-blue-700',
  FAIR:       'bg-amber-100 text-amber-700',
  POOR:       'bg-red-100 text-red-700',
};

export default function StatusBadge({ status }) {
  return (
    <span className={`badge ${STATUS_STYLES[status] || 'bg-gray-100 text-gray-600'}`}>
      {status}
    </span>
  );
}