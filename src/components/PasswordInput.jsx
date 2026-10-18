import { useState } from 'react'
import { Eye, EyeOff, Lock } from 'lucide-react'

/**
 * Password box with a lock icon and an eye button that shows or hides the text.
 * Pass the `cls` string from <Field> as `className`; every other prop goes to the <input>.
 */
export default function PasswordInput({ id, className = '', ...props }) {
  const [visible, setVisible] = useState(false)

  return (
    <div className="relative">
      <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
      <input id={id} type={visible ? 'text' : 'password'} className={`${className} pl-9 pr-11`} {...props} />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? 'Hide password' : 'Show password'}
        aria-pressed={visible}
        className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-slate-500 hover:text-brand-700 focus-visible:outline-2 focus-visible:outline-brand-600"
      >
        {visible ? <EyeOff className="h-4 w-4" aria-hidden="true" /> : <Eye className="h-4 w-4" aria-hidden="true" />}
      </button>
    </div>
  )
}