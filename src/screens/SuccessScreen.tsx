import { useNavigate, useParams } from 'react-router-dom'
import { CheckIcon } from '../components/icons'

export default function SuccessScreen() {
  const { id } = useParams()
  const navigate = useNavigate()

  return (
    <>
      <div className="sheet-overlay" />
      <div className="toast">
        <span className="toast-check">
          <CheckIcon size={16} />
        </span>
        Запись сохранена
      </div>
      <div className="sheet">
        <div className="sheet-handle" />
        <div className="sheet-title">Отличное пополнение!</div>
        <p className="sheet-sub">Вино успешно отправлено в вашу личную ленту воспоминаний.</p>
        <button className="btn-accent" onClick={() => navigate(`/note/${id}`, { replace: true })}>
          Открыть запись
        </button>
        <button className="btn-outline" onClick={() => navigate(`/note/${id}/edit`, { replace: true })}>
          Добавить детали
        </button>
        <button className="btn-text" onClick={() => navigate('/', { replace: true })}>
          Вернуться в ленту
        </button>
      </div>
    </>
  )
}
