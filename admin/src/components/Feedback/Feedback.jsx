import PropTypes from 'prop-types';

/* Small, dependency-free UI feedback primitives (skeletons, empty state, loaders). */

export const Spinner = ({ large = false, label }) => (
  <span
    className={`spinner${large ? ' spinner-lg' : ''}`}
    role="status"
    aria-label={label || 'Loading'}
  />
);
Spinner.propTypes = {
  large: PropTypes.bool,
  label: PropTypes.string,
};

export const Skeleton = ({ width, height, radius, className = '' }) => (
  <span
    className={`skeleton ${className}`}
    style={{ width, height, borderRadius: radius }}
    aria-hidden="true"
  />
);
Skeleton.propTypes = {
  width: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  height: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  radius: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  className: PropTypes.string,
};

/**
 * Table-shaped skeleton. `columns` is a CSS grid-template-columns string so the
 * placeholder lines up with the real table it stands in for.
 */
export const TableSkeleton = ({ rows = 6, columns = '64px 2fr 1fr 2fr 1fr 96px', avatar = true }) => {
  const count = columns.split(' ').length;
  return (
    <div className="card skeleton-table" aria-busy="true" aria-live="polite">
      <div className="skeleton-row skeleton-head" style={{ gridTemplateColumns: columns }}>
        {Array.from({ length: count }).map((_, i) => (
          <Skeleton key={i} />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, r) => (
        <div
          key={r}
          className="skeleton-row"
          style={{ gridTemplateColumns: columns, animationDelay: `${r * 40}ms` }}
        >
          {Array.from({ length: count }).map((_, c) =>
            c === 0 && avatar ? (
              <Skeleton key={c} className="skeleton-avatar" />
            ) : (
              <Skeleton key={c} height={12} width={`${55 + ((r * 7 + c * 13) % 40)}%`} />
            )
          )}
        </div>
      ))}
    </div>
  );
};
TableSkeleton.propTypes = {
  rows: PropTypes.number,
  columns: PropTypes.string,
  avatar: PropTypes.bool,
};

export const CardSkeleton = ({ count = 3, minWidth = 280 }) => (
  <div
    className="skeleton-cards"
    style={{ gridTemplateColumns: `repeat(auto-fill, minmax(min(${minWidth}px, 100%), 1fr))` }}
    aria-busy="true"
    aria-live="polite"
  >
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="card card-pad" style={{ display: 'grid', gap: 12 }}>
        <Skeleton height={16} width="45%" />
        <div style={{ display: 'flex', gap: 10 }}>
          <Skeleton className="skeleton-avatar" />
          <Skeleton className="skeleton-avatar" />
          <Skeleton className="skeleton-avatar" />
        </div>
        <Skeleton height={12} width="80%" />
        <Skeleton height={12} width="60%" />
      </div>
    ))}
  </div>
);
CardSkeleton.propTypes = {
  count: PropTypes.number,
  minWidth: PropTypes.number,
};

export const EmptyState = ({ icon, title, text, action, error = false }) => (
  <div className={`empty-state${error ? ' is-error' : ''}`} role={error ? 'alert' : undefined}>
    {icon && <div className="empty-state-icon">{icon}</div>}
    {title && <p className="empty-state-title">{title}</p>}
    {text && <p className="empty-state-text">{text}</p>}
    {action}
  </div>
);
EmptyState.propTypes = {
  icon: PropTypes.node,
  title: PropTypes.node,
  text: PropTypes.node,
  action: PropTypes.node,
  error: PropTypes.bool,
};

export const RouteLoader = ({ full = false }) => (
  <div className={`route-loader${full ? ' full' : ''}`}>
    <Spinner large label="Loading page" />
  </div>
);
RouteLoader.propTypes = {
  full: PropTypes.bool,
};
