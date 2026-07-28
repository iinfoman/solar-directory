type BadgeVariant = 'verified' | 'province' | 'service' | 'size'

interface BadgeProps {
  children: React.ReactNode
  variant?: BadgeVariant
}

const styles: Record<BadgeVariant, React.CSSProperties> = {
  verified: {
    background: '#ECFDF5',
    color: '#047857',
    border: '1px solid #A7F3D0',
    fontWeight: 600,
  },
  province: {
    background: '#FEF3C7',
    color: '#92400E',
    border: '1px solid #FDE68A',
    fontWeight: 500,
  },
  service: {
    background: '#F8F6F2',
    color: '#57534E',
    border: '1px solid #E5DFD5',
    fontWeight: 500,
  },
  size: {
    background: '#F8F6F2',
    color: '#78716C',
    border: '1px solid #E5DFD5',
    fontWeight: 500,
  },
}

export function Badge({ children, variant = 'service' }: BadgeProps) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        padding: '3px 10px',
        borderRadius: '9999px',
        fontSize: '12px',
        lineHeight: 1.5,
        whiteSpace: 'nowrap',
        ...styles[variant],
      }}
    >
      {variant === 'verified' && (
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
          <path
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            stroke="#047857"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
      {children}
    </span>
  )
}
