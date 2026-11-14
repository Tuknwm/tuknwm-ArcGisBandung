const PINES = [
  [18, 196, 1], [40, 202, 0.8], [62, 192, 1.15], [300, 198, 0.9], [322, 190, 1.2],
  [346, 200, 0.85], [372, 194, 1.05], [120, 206, 0.7], [138, 203, 0.85], [252, 207, 0.7],
]

function Pine({ x, y, s }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <rect x="-1.6" y="-4" width="3.2" height="8" fill="#5B4632" />
      <path d="M0-40 L11-18 H5 L14-6 H-14 L-5-18 H-11Z" fill="#2F5E35" />
      <path d="M0-40 L11-18 H5 L14-6 H0Z" fill="#244B2A" />
    </g>
  )
}

import InfoPanel from './InfoPanel'

export default function Scenery() {
  return (
    <div className="scenery-wrap">
    <svg className="scenery" viewBox="0 0 400 220" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
      <circle cx="300" cy="62" r="22" fill="#FFFFFF" opacity="0.9" />
      <g className="cloud cloud-a" fill="#FFFFFF">
        <ellipse cx="80" cy="54" rx="26" ry="9" />
        <ellipse cx="96" cy="48" rx="15" ry="10" />
      </g>
      <g className="cloud cloud-b" fill="#FFFFFF" opacity="0.8">
        <ellipse cx="220" cy="34" rx="20" ry="7" />
        <ellipse cx="232" cy="29" rx="11" ry="7" />
      </g>
      <path d="M0 150 L58 96 L92 118 L150 58 L196 104 L232 84 L288 120 L340 74 L400 112 V220 H0Z" fill="#D6E9C8" />
      <path d="M150 58 L162 70 L156 72 L168 80 L150 76 L140 70Z" fill="#FFFFFF" opacity="0.75" />
      <path d="M340 74 L350 84 L344 85 L354 92 L338 88 L330 84Z" fill="#FFFFFF" opacity="0.75" />
      <path d="M0 176 L44 136 L88 160 L142 118 L204 158 L262 126 L318 156 L372 130 L400 146 V220 H0Z" fill="#B3D89C" />
      <path d="M0 204 Q90 168 196 192 T400 186 V220 H0Z" fill="#8DBF73" />
      {PINES.map(([x, y, s]) => (
        <Pine key={`${x}-${y}`} x={x} y={y} s={s} />
      ))}
      <path d="M0 214 Q120 200 220 212 T400 210 V220 H0Z" fill="#6FA35A" />
    </svg>
    <InfoPanel />
    </div>
  )
}
