/**
 * Rankan som växer i bakgrunden.
 *
 * En förgätmigej som slingrar sig upp genom sidan: stjälken ritas fram med
 * stroke-dashoffset, blad vecklar ut sig, blommor slår ut i tur och ordning.
 *
 * TVÅ SAKER DEN INTE GÖR
 *
 * 1. Inga nya färgvärden. Allt hämtas ur `@theme` i globals.css via var(--color-*),
 *    så palettregel 1 håller — rankan kan inte glida isär från resten.
 * 2. Ingen rosa. En riktig Myosotis har rosa knoppar innan den slår ut, och de hade
 *    suttit vackert här. Men palettregel 3 ger `--color-bud` exakt en betydelse i
 *    produkten, utgången spärr, och en dekorativ knopp hade blivit en andra. Blomman
 *    får gå från grön knopp till blå. Det är botaniskt fattigare och regelmässigt rätt.
 *
 * Rankan är dekor: aria-hidden, pointer-events-none, och den ligger bakom allt med låg
 * opacitet så att brödtextens kontrast mot bottenfärgen inte påverkas.
 * Vid prefers-reduced-motion ritas den färdig direkt i stället för att animeras.
 */
export function VineBackground() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden select-none"
    >
      <svg
        className="vine absolute top-0 left-1/2 h-[200vh] min-w-[1200px] w-full -translate-x-1/2 opacity-[0.85]"
        viewBox="0 0 1600 1900"
        fill="none"
        preserveAspectRatio="xMidYMin slice"
      >
        <defs>
          {/* Blomman: fem kronblad, vit krage, gult öga. Regel 4 — gult möter blått
              bara med ringen emellan. */}
          <g id="fmn-bloom">
            <g fill="var(--color-blue)">
              <ellipse cx="0" cy="-13" rx="9.5" ry="11" />
              <ellipse cx="12.4" cy="-4" rx="9.5" ry="11" transform="rotate(72)" />
              <ellipse cx="7.6" cy="10.5" rx="9.5" ry="11" transform="rotate(144)" />
              <ellipse cx="-7.6" cy="10.5" rx="9.5" ry="11" transform="rotate(216)" />
              <ellipse cx="-12.4" cy="-4" rx="9.5" ry="11" transform="rotate(288)" />
            </g>
            <circle r="7.5" fill="var(--color-ring)" />
            <circle r="4.2" fill="var(--color-eye)" />
          </g>

          <g id="fmn-leaf">
            <path
              d="M0 0 C 16 -9, 38 -6, 50 8 C 34 20, 12 16, 0 0 Z"
              fill="var(--color-leaf)"
              opacity="0.62"
            />
            <path d="M0 0 C 18 -1, 36 3, 50 8" stroke="var(--color-stem)" strokeWidth="1.2" opacity="0.4" />
          </g>
        </defs>

        {/* Huvudstjälken. Slingrar sig uppåt genom hela sidan. */}
        <path
          id="stem-main"
          className="stem draw"
          d="M 760 1900
             C 700 1740, 880 1660, 830 1500
             C 780 1340, 610 1300, 690 1140
             C 770 980, 950 960, 880 800
             C 815 650, 640 620, 720 470
             C 790 340, 930 320, 880 190
             C 850 110, 800 70, 790 20"
          stroke="var(--color-stem)"
          strokeWidth="4.5"
          strokeLinecap="round"
          opacity="0.55"
        />

        {/* Sidoskott, växer ut efter huvudstjälken. */}
        <path
          className="stem draw delay-1"
          d="M 838 1420 C 700 1390, 620 1300, 470 1330"
          stroke="var(--color-stem)"
          strokeWidth="3"
          strokeLinecap="round"
          opacity="0.42"
        />
        <path
          className="stem draw delay-2"
          d="M 700 1080 C 840 1040, 960 1090, 1090 1020"
          stroke="var(--color-stem)"
          strokeWidth="3"
          strokeLinecap="round"
          opacity="0.42"
        />
        <path
          className="stem draw delay-3"
          d="M 862 700 C 720 660, 610 690, 500 630"
          stroke="var(--color-stem)"
          strokeWidth="3"
          strokeLinecap="round"
          opacity="0.42"
        />
        <path
          className="stem draw delay-4"
          d="M 742 390 C 880 350, 980 400, 1120 340"
          stroke="var(--color-stem)"
          strokeWidth="3"
          strokeLinecap="round"
          opacity="0.42"
        />

        {/* Blad */}
        <use href="#fmn-leaf" className="sprout delay-2" transform="translate(838 1420) rotate(196) scale(1.15)" />
        <use href="#fmn-leaf" className="sprout delay-3" transform="translate(700 1080) rotate(-14) scale(1.05)" />
        <use href="#fmn-leaf" className="sprout delay-4" transform="translate(862 700) rotate(198) scale(1.1)" />
        <use href="#fmn-leaf" className="sprout delay-5" transform="translate(742 390) rotate(-18)" />
        <use href="#fmn-leaf" className="sprout delay-3" transform="translate(806 1240) rotate(150) scale(0.85)" />
        <use href="#fmn-leaf" className="sprout delay-5" transform="translate(890 560) rotate(-52) scale(0.8)" />

        {/* Blommorna slår ut sist, nedifrån och upp. */}
        <use href="#fmn-bloom" className="bloom delay-3" transform="translate(470 1330) scale(1.25)" />
        <use href="#fmn-bloom" className="bloom delay-4" transform="translate(524 1286) scale(0.85)" />
        <use href="#fmn-bloom" className="bloom delay-4" transform="translate(1090 1020) scale(1.2)" />
        <use href="#fmn-bloom" className="bloom delay-5" transform="translate(1040 966) scale(0.8)" />
        <use href="#fmn-bloom" className="bloom delay-5" transform="translate(500 630) scale(1.3)" />
        <use href="#fmn-bloom" className="bloom delay-6" transform="translate(556 580) scale(0.9)" />
        <use href="#fmn-bloom" className="bloom delay-6" transform="translate(1120 340) scale(1.2)" />
        <use href="#fmn-bloom" className="bloom delay-7" transform="translate(1064 292) scale(0.85)" />
        <use href="#fmn-bloom" className="bloom delay-7" transform="translate(790 20) scale(1.1)" />
      </svg>
    </div>
  );
}
