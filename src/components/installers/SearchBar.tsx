import type { InstallerFilters, Province, SystemSizeCategory } from '../../lib/types'

const PROVINCES: Province[] = [
  'Western Cape',
  'Gauteng',
  'KwaZulu-Natal',
  'Eastern Cape',
  'Limpopo',
  'Mpumalanga',
  'North West',
  'Free State',
  'Northern Cape',
]

const SYSTEM_SIZES: { value: SystemSizeCategory; label: string }[] = [
  { value: 'small', label: 'Small (< 100 kW)' },
  { value: 'medium', label: 'Medium (100 kW – 500 kW)' },
  { value: 'large', label: 'Large C&I (500 kW – 5 MW)' },
  { value: 'utility', label: 'Utility-scale (5 MW+)' },
]

interface SearchBarProps {
  filters: InstallerFilters
  onChange: (filters: InstallerFilters) => void
  totalCount: number
  filteredCount: number
}

const selectStyle: React.CSSProperties = {
  padding: '10px 36px 10px 14px',
  borderRadius: '10px',
  border: '1.5px solid #E5DFD5',
  background: '#FFFFFF',
  color: '#1C1917',
  fontSize: '14px',
  fontFamily: 'inherit',
  fontWeight: 500,
  appearance: 'none',
  backgroundImage: `url("data:image/svg+xml,%3Csvg width='16' height='16' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M6 9l6 6 6-6' stroke='%2378716C' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
  backgroundRepeat: 'no-repeat',
  backgroundPosition: 'right 10px center',
  cursor: 'pointer',
  width: '100%',
  outline: 'none',
  transition: 'border-color 0.15s',
}

export function SearchBar({ filters, onChange, totalCount, filteredCount }: SearchBarProps) {
  function handleSearch(e: React.ChangeEvent<HTMLInputElement>) {
    onChange({ ...filters, search: e.target.value })
  }

  function handleProvince(e: React.ChangeEvent<HTMLSelectElement>) {
    onChange({ ...filters, province: e.target.value as Province | '' })
  }

  function handleSystemSize(e: React.ChangeEvent<HTMLSelectElement>) {
    onChange({ ...filters, systemSize: e.target.value as SystemSizeCategory | '' })
  }

  function handleReset() {
    onChange({ province: '', systemSize: '', search: '' })
  }

  const hasFilters = filters.province || filters.systemSize || filters.search

  return (
    <div
      style={{
        background: '#FFFFFF',
        border: '1px solid #E5DFD5',
        borderRadius: '16px',
        padding: '20px 24px',
        boxShadow: '0 1px 4px rgba(28,25,23,0.06)',
      }}
    >
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '12px',
          alignItems: 'center',
        }}
      >
        {/* Search input */}
        <div style={{ position: 'relative', gridColumn: 'span 1' }}>
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            style={{
              position: 'absolute',
              left: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#A8A29E',
              pointerEvents: 'none',
            }}
          >
            <path
              d="M21 21l-4.35-4.35M17 11A6 6 0 111 11a6 6 0 0116 0z"
              stroke="#A8A29E"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <input
            type="text"
            placeholder="Search installers or city…"
            value={filters.search}
            onChange={handleSearch}
            style={{
              ...selectStyle,
              paddingLeft: '38px',
              paddingRight: '14px',
              backgroundImage: 'none',
            }}
          />
        </div>

        {/* Province filter */}
        <div style={{ position: 'relative' }}>
          <select value={filters.province} onChange={handleProvince} style={selectStyle}>
            <option value="">All Provinces</option>
            {PROVINCES.map(p => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </div>

        {/* System size filter */}
        <div style={{ position: 'relative' }}>
          <select value={filters.systemSize} onChange={handleSystemSize} style={selectStyle}>
            <option value="">All System Sizes</option>
            {SYSTEM_SIZES.map(s => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </div>

        {/* Reset */}
        {hasFilters && (
          <button
            onClick={handleReset}
            style={{
              padding: '10px 16px',
              borderRadius: '10px',
              border: '1.5px solid #E5DFD5',
              background: 'transparent',
              color: '#78716C',
              fontSize: '14px',
              fontFamily: 'inherit',
              fontWeight: 500,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'border-color 0.15s, color 0.15s',
            }}
            onMouseEnter={e => {
              ;(e.target as HTMLElement).style.borderColor = '#D97706'
              ;(e.target as HTMLElement).style.color = '#D97706'
            }}
            onMouseLeave={e => {
              ;(e.target as HTMLElement).style.borderColor = '#E5DFD5'
              ;(e.target as HTMLElement).style.color = '#78716C'
            }}
          >
            Clear filters
          </button>
        )}
      </div>

      <div style={{ marginTop: '12px', fontSize: '13px', color: '#A8A29E' }}>
        {hasFilters
          ? `${filteredCount} of ${totalCount} installers match your filters`
          : `${totalCount} vetted installers listed`}
      </div>
    </div>
  )
}
