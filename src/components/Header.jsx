import { useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { LogOut, Menu, X } from 'lucide-react'
import Logo from './Logo'
import { useAuth } from '../context/auth'
import { buttonClasses } from '../lib/helpers'

const navClass = ({ isActive }) =>
  `rounded-md px-3 py-2 text-sm font-medium transition-colors ${
    isActive ? 'bg-brand-50 text-brand-700' : 'text-slate-700 hover:bg-slate-100'
  }`

export default function Header() {
  const { user, isAdmin, logout } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const close = () => setOpen(false)
  const dashboardPath = isAdmin ? '/admin' : '/dashboard'

  const handleLogout = async () => {
    await logout()
    close()
    navigate('/')
  }

  return (
    <header className="sticky top-0 z-40 bg-white shadow-sm">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
        <Logo />

        <nav className="hidden items-center gap-1 md:flex" aria-label="Main">
          <NavLink to="/" end className={navClass}>Home</NavLink>
          <NavLink to="/report-crime" className={navClass}>Report a Crime</NavLink>
          {user && <NavLink to={dashboardPath} className={navClass}>{isAdmin ? 'Admin Dashboard' : 'My Requests'}</NavLink>}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          {user ? (
            <>
              <span className="text-sm text-slate-600">
                Hi, <strong className="text-slate-900">{user.fullName.split(' ')[0]}</strong>
              </span>
              <button onClick={handleLogout} className={buttonClasses({ variant: 'outline', size: 'sm' })}>
                <LogOut className="h-4 w-4" aria-hidden="true" /> Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className={buttonClasses({ variant: 'outline', size: 'sm' })}>Login</Link>
              <Link to="/signup" className={buttonClasses({ size: 'sm' })}>Sign Up</Link>
            </>
          )}
        </div>

        <button
          className="rounded-md p-2 text-slate-700 hover:bg-slate-100 md:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-label="Toggle menu"
          aria-expanded={open}
        >
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {open && (
        <div className="border-t border-slate-200 bg-white px-4 pb-4 pt-2 md:hidden">
          <nav className="flex flex-col gap-1" aria-label="Mobile">
            <NavLink to="/" end className={navClass} onClick={close}>Home</NavLink>
            <NavLink to="/report-crime" className={navClass} onClick={close}>Report a Crime</NavLink>
            {user && (
              <NavLink to={dashboardPath} className={navClass} onClick={close}>
                {isAdmin ? 'Admin Dashboard' : 'My Requests'}
              </NavLink>
            )}
          </nav>
          <div className="mt-3 flex gap-2">
            {user ? (
              <button onClick={handleLogout} className={buttonClasses({ variant: 'outline', className: 'w-full' })}>
                <LogOut className="h-4 w-4" aria-hidden="true" /> Logout
              </button>
            ) : (
              <>
                <Link to="/login" onClick={close} className={buttonClasses({ variant: 'outline', className: 'flex-1' })}>Login</Link>
                <Link to="/signup" onClick={close} className={buttonClasses({ className: 'flex-1' })}>Sign Up</Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  )
}