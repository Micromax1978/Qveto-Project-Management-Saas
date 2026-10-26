import React from 'react';

export default function Avatar({
  user,
  name,
  avatarUrl,
  size = 'md',
  className = '',
  showTooltip = true,
}) {
  const userName = user?.name || name || 'User';
  const photo = user?.avatar || avatarUrl;

  const initials = userName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0].toUpperCase())
    .join('');

  const sizeClasses = {
    xs: 'w-5 h-5 text-[10px]',
    sm: 'w-6 h-6 text-xs',
    md: 'w-8 h-8 text-xs',
    lg: 'w-10 h-10 text-sm font-semibold',
  }[size] || 'w-8 h-8 text-xs';

  return (
    <div
      title={showTooltip ? `${userName} (${user?.role || 'Member'})` : undefined}
      className={`relative inline-flex items-center justify-center shrink-0 rounded-full font-medium ring-2 ring-white select-none ${sizeClasses} ${className}`}
    >
      {photo ? (
        <img
          src={photo}
          alt={userName}
          className="w-full h-full object-cover rounded-full"
          onError={(e) => {
            // Fallback to initials if image link breaks
            e.currentTarget.style.display = 'none';
          }}
        />
      ) : null}

      <div
        className={`w-full h-full flex items-center justify-center rounded-full bg-linear-to-br from-blue-500 to-indigo-600 text-white ${
          photo ? 'absolute inset-0 -z-10' : ''
        }`}
      >
        {initials || 'U'}
      </div>
    </div>
  );
}
