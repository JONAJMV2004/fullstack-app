export default function Alert({ message, type = 'error' }) {
  if (!message) return null
  return (
    <div className={`ch-alert ${type}`} role="alert">
      {message}
    </div>
  )
}
