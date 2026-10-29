/** Вино внутри кнопки «+»: спокойно покачивается и плещется (чистый CSS, без гироскопа). */
export function WineSlosh() {
  // Волна шириной в два периода (96) — сдвиг на один период (48) зациклен без шва
  const wave = 'M0 20 Q12 13 24 20 T48 20 T72 20 T96 20 V60 H0 Z'
  return (
    <span className="wine-slosh" aria-hidden="true">
      <span className="wine-slosh-tilt">
        <svg className="wine-slosh-wave wine-slosh-back" viewBox="0 0 96 60" preserveAspectRatio="none">
          <path d={wave} />
        </svg>
        <svg className="wine-slosh-wave wine-slosh-front" viewBox="0 0 96 60" preserveAspectRatio="none">
          <path d={wave} />
        </svg>
      </span>
    </span>
  )
}
