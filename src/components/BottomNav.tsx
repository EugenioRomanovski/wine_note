import { Link } from 'react-router-dom'
import { BookIcon, PlusIcon, SparklesIcon } from './icons'
import { WineSlosh } from './WineSlosh'

export type NavTab = 'feed' | 'taste' | 'none'

export function BottomNav({ active }: { active: NavTab }) {
  return (
    <nav className="bottom-nav">
      <div className="bottom-nav-pill">
        <Link to="/" className={`nav-item ${active === 'feed' ? 'active' : ''}`}>
          <BookIcon size={22} />
          Лента
        </Link>
        <Link to="/new" className="nav-add" aria-label="Добавить запись">
          <WineSlosh />
          <PlusIcon size={26} className="nav-add-icon" />
        </Link>
        <Link to="/taste" className={`nav-item ${active === 'taste' ? 'active' : ''}`}>
          <SparklesIcon size={22} />
          Вкус
        </Link>
      </div>
    </nav>
  )
}
