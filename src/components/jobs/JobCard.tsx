import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';

interface JobCardProps {
  title: string;
  company: string;
  location?: string;
  url: string;
  source: string;
  roleSlug?: string;
  postedAt?: string;
  isNew?: boolean;
  salary?: string;
  jobType?: string;
}

export function JobCard({
  title,
  company,
  location,
  url,
  source,
  roleSlug,
  postedAt,
  isNew,
  salary,
  jobType,
}: JobCardProps) {
  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } catch {
      return dateString;
    }
  };

  const getRoleBadgeVariant = (role?: string) => {
    if (!role) return 'primary';
    if (role.includes('embedded')) return 'primary';
    if (role.includes('firmware')) return 'success';
    if (role.includes('hardware')) return 'warning';
    return 'primary';
  };

  return (
    <Card hover>
      <div className="p-6 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-lg font-semibold text-white hover:text-cyan-400 transition-colors line-clamp-2"
            >
              {title}
            </a>
            <p className="text-gray-400 mt-1">{company}</p>
          </div>
          {isNew && (
            <Badge variant="success">New</Badge>
          )}
        </div>

        {/* Details */}
        <div className="flex flex-wrap gap-2 text-sm text-gray-400">
          {location && (
            <div className="flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span>{location}</span>
            </div>
          )}
          {postedAt && (
            <div className="flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{formatDate(postedAt)}</span>
            </div>
          )}
          {salary && (
            <div className="flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{salary}</span>
            </div>
          )}
          {jobType && (
            <div className="flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <span>{jobType}</span>
            </div>
          )}
        </div>

        {/* Footer Badges */}
        <div className="flex flex-wrap gap-2 pt-2">
          <Badge variant="primary">{source}</Badge>
          {roleSlug && roleSlug !== 'other' && (
            <Badge variant={getRoleBadgeVariant(roleSlug)}>
              {roleSlug.replace('-', ' ')}
            </Badge>
          )}
        </div>
      </div>
    </Card>
  );
}
