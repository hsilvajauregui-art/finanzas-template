const SWATCHES = [
  '#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444',
  '#06b6d4', '#ec4899', '#f97316', '#84cc16', '#6366f1',
]

export default function ColorPicker({ value, onChange }) {
  return (
    <div className="flex gap-2 flex-wrap">
      {SWATCHES.map(color => (
        <button
          key={color}
          type="button"
          onClick={() => onChange(color)}
          title={color}
          className={`w-6 h-6 rounded-full transition-transform hover:scale-110 ${
            value === color ? 'scale-125 ring-2 ring-offset-2 ring-gray-400 dark:ring-offset-gray-900' : ''
          }`}
          style={{ backgroundColor: color }}
        />
      ))}
    </div>
  )
}
