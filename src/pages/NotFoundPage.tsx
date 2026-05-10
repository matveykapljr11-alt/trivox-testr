import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

export default function NotFoundPage() {
  const navigate = useNavigate()

  useEffect(() => {
    // Generate rain drops
    const rain = document.getElementById('rain-container')
    if (!rain) return
    rain.innerHTML = ''
    for (let i = 0; i < 85; i++) {
      const d = document.createElement('div')
      const h = 14 + Math.random() * 26
      d.style.cssText = `
        position: absolute;
        width: 1px;
        left: ${Math.random() * 100}%;
        top: ${Math.random() * 100}%;
        height: ${h}px;
        background: linear-gradient(to bottom, transparent, rgba(180,200,220,0.22));
        animation: fall ${0.38 + Math.random() * 0.58}s linear ${Math.random() * 1.2}s infinite;
        opacity: ${0.18 + Math.random() * 0.38};
      `
      rain.appendChild(d)
    }
  }, [])

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@300;400;700;800;900&family=JetBrains+Mono:wght@300;400&display=swap');

        .page-404 {
          position: fixed;
          inset: 0;
          background: #050608;
          color: #f4f4f4;
          font-family: 'Barlow Condensed', sans-serif;
          overflow: hidden;
        }

        .page-404::before {
          content: '';
          position: fixed;
          inset: 0;
          background: repeating-linear-gradient(45deg, transparent, transparent 1px, rgba(255,255,255,0.012) 1px, rgba(255,255,255,0.012) 2px);
          pointer-events: none;
          z-index: 0;
        }

        .nav-404 {
          position: fixed;
          top: 0; left: 0; right: 0;
          height: 52px;
          background: rgba(5,6,8,0.92);
          backdrop-filter: blur(20px);
          border-bottom: 1px solid rgba(200,200,200,0.08);
          display: flex;
          align-items: center;
          padding: 0 24px;
          z-index: 100;
        }

        .nav-logo-404 {
          font-weight: 900;
          font-size: 19px;
          letter-spacing: 0.14em;
          background: linear-gradient(135deg, #c8c8c8 0%, #888 40%, #c0c0c0 60%, #707070 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          text-decoration: none;
          cursor: pointer;
        }

        .rain-404 {
          position: fixed;
          inset: 0;
          z-index: 2;
          pointer-events: none;
          overflow: hidden;
        }

        @keyframes fall {
          0% { transform: translateY(-20px) rotate(10deg); opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 0.3; }
          100% { transform: translateY(100vh) rotate(10deg); opacity: 0; }
        }

        .scene-404 {
          position: fixed;
          inset: 0;
          z-index: 1;
        }

        .scene-404 svg {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .overlay-404 {
          position: fixed;
          inset: 0;
          z-index: 10;
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          justify-content: flex-end;
          padding: 0 0 44px 36px;
          background: linear-gradient(to top, rgba(5,6,8,0.97) 0%, rgba(5,6,8,0.5) 30%, transparent 60%);
        }

        .num-404 {
          font-size: clamp(88px, 17vw, 190px);
          font-weight: 900;
          line-height: 0.85;
          letter-spacing: -0.04em;
          background: linear-gradient(135deg, #c8c8c8 0%, #888 40%, #c0c0c0 60%, #707070 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: glitch 5s infinite;
        }

        @keyframes glitch {
          0%,90%,100% { transform: none; filter: none; }
          91% { transform: translate(-4px,0); filter: hue-rotate(60deg) brightness(1.2); }
          92% { transform: translate(4px,0); filter: hue-rotate(-60deg); }
          93% { transform: none; filter: none; }
          94% { transform: translate(-2px,1px); }
          95% { transform: none; }
        }

        .label-404 {
          font-family: 'JetBrains Mono', monospace;
          font-size: clamp(10px, 1.4vw, 13px);
          color: rgba(200,200,200,0.4);
          letter-spacing: 0.28em;
          text-transform: uppercase;
          margin-top: 6px;
          margin-bottom: 20px;
        }

        .msg-404 {
          font-size: clamp(14px, 2.2vw, 19px);
          color: rgba(200,200,200,0.5);
          font-weight: 300;
          letter-spacing: 0.04em;
          margin-bottom: 24px;
        }

        .msg-404 span {
          background: linear-gradient(135deg, #c8c8c8, #888);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          font-weight: 700;
        }

        .btn-back-404 {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          padding: 12px 30px;
          background: #f4f4f4;
          color: #060606;
          font-family: 'Barlow Condensed', sans-serif;
          font-weight: 800;
          font-size: 14px;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          text-decoration: none;
          border-radius: 2px;
          border: none;
          cursor: pointer;
          transition: all 0.15s;
        }

        .btn-back-404:hover {
          background: #c8c8c8;
          transform: translateY(-1px);
        }
      `}</style>

      <div className="page-404">
        {/* Nav */}
        <nav className="nav-404">
          <span className="nav-logo-404" onClick={() => navigate('/')}>TRIVOX</span>
        </nav>

        {/* Rain */}
        <div className="rain-404">
          <div id="rain-container" style={{ position: 'absolute', inset: 0 }} />
        </div>

        {/* Scene SVG */}
        <div className="scene-404">
          <svg viewBox="0 0 1000 660" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="sky" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#020305"/>
                <stop offset="55%" stopColor="#050810"/>
                <stop offset="100%" stopColor="#0a0d18"/>
              </linearGradient>
              <linearGradient id="roadG" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#0c0f16"/>
                <stop offset="100%" stopColor="#14171f"/>
              </linearGradient>
              <linearGradient id="bodyG" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#585c65"/>
                <stop offset="30%" stopColor="#3c3f48"/>
                <stop offset="60%" stopColor="#282b32"/>
                <stop offset="100%" stopColor="#1e2025"/>
              </linearGradient>
              <linearGradient id="roofG" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#464a52"/>
                <stop offset="50%" stopColor="#2a2d34"/>
                <stop offset="100%" stopColor="#191c22"/>
              </linearGradient>
              <linearGradient id="crumpleG" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#3a3d45"/>
                <stop offset="40%" stopColor="#252830"/>
                <stop offset="100%" stopColor="#1a1820"/>
              </linearGradient>
              <radialGradient id="rimG" cx="38%" cy="35%" r="65%">
                <stop offset="0%" stopColor="#909090"/>
                <stop offset="35%" stopColor="#555"/>
                <stop offset="75%" stopColor="#2a2a2a"/>
                <stop offset="100%" stopColor="#111"/>
              </radialGradient>
              <radialGradient id="tyreG" cx="40%" cy="38%" r="62%">
                <stop offset="0%" stopColor="#252525"/>
                <stop offset="100%" stopColor="#080808"/>
              </radialGradient>
              <linearGradient id="brakeR" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#d41c1c"/>
                <stop offset="100%" stopColor="#7a0808"/>
              </linearGradient>
              <linearGradient id="windG" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="rgba(25,55,45,0.72)"/>
                <stop offset="100%" stopColor="rgba(10,22,18,0.58)"/>
              </linearGradient>
              <radialGradient id="lglow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="rgba(225,205,140,0.95)"/>
                <stop offset="35%" stopColor="rgba(200,175,100,0.4)"/>
                <stop offset="100%" stopColor="transparent"/>
              </radialGradient>
              <radialGradient id="lglow2" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="rgba(220,200,140,0.8)"/>
                <stop offset="100%" stopColor="transparent"/>
              </radialGradient>
              <radialGradient id="vignette" cx="50%" cy="50%" r="72%">
                <stop offset="0%" stopColor="transparent"/>
                <stop offset="100%" stopColor="rgba(0,0,0,0.68)"/>
              </radialGradient>
              <filter id="glow"><feGaussianBlur stdDeviation="4" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
              <filter id="sglow"><feGaussianBlur stdDeviation="10" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
              <filter id="dshadow"><feDropShadow dx="1" dy="3" stdDeviation="3" floodColor="rgba(0,0,0,0.85)"/></filter>
              <pattern id="carbon" x="0" y="0" width="6" height="6" patternUnits="userSpaceOnUse">
                <rect width="6" height="6" fill="#1a1d22"/>
                <rect x="0" y="0" width="3" height="3" fill="#1e2128" opacity="0.85"/>
                <rect x="3" y="3" width="3" height="3" fill="#1e2128" opacity="0.85"/>
                <line x1="0" y1="3" x2="3" y2="0" stroke="#24272e" strokeWidth="0.35"/>
                <line x1="3" y1="6" x2="6" y2="3" stroke="#24272e" strokeWidth="0.35"/>
              </pattern>
              <pattern id="wet" x="0" y="0" width="50" height="50" patternUnits="userSpaceOnUse">
                <rect width="50" height="50" fill="transparent"/>
                <ellipse cx="12" cy="18" rx="8" ry="3" fill="rgba(80,100,140,0.07)"/>
                <ellipse cx="38" cy="36" rx="6" ry="2.5" fill="rgba(80,100,140,0.05)"/>
              </pattern>
            </defs>

            {/* Sky */}
            <rect width="1000" height="660" fill="url(#sky)"/>

            {/* Distant city lights */}
            <rect x="0" y="180" width="1000" height="2" fill="rgba(60,80,120,0.12)"/>
            <g opacity="0.18">
              <rect x="120" y="155" width="18" height="85" fill="#1a2035"/>
              <rect x="148" y="170" width="12" height="70" fill="#151a2a"/>
              <rect x="168" y="145" width="22" height="95" fill="#1a2035"/>
              <rect x="200" y="162" width="14" height="78" fill="#151a2a"/>
              <rect x="224" y="150" width="20" height="90" fill="#1a2035"/>
              <rect x="254" y="168" width="10" height="72" fill="#151a2a"/>
              <rect x="272" y="140" width="24" height="100" fill="#1a2035"/>
              <rect x="306" y="158" width="16" height="82" fill="#151a2a"/>
              <rect x="850" y="158" width="16" height="82" fill="#151a2a"/>
              <rect x="876" y="145" width="20" height="95" fill="#1a2035"/>
              <rect x="906" y="162" width="14" height="78" fill="#151a2a"/>
              <rect x="930" y="148" width="22" height="92" fill="#1a2035"/>
              <rect x="962" y="170" width="12" height="70" fill="#151a2a"/>
            </g>

            {/* City glow */}
            <ellipse cx="200" cy="240" rx="240" ry="40" fill="rgba(40,60,110,0.13)"/>
            <ellipse cx="800" cy="240" rx="200" ry="35" fill="rgba(40,60,110,0.10)"/>

            {/* Road */}
            <path d="M0 540 Q500 500 1000 520 L1000 660 L0 660 Z" fill="url(#roadG)"/>
            <path d="M0 540 Q500 500 1000 520 L1000 660 L0 660 Z" fill="url(#wet)" opacity="0.6"/>
            <path d="M0 545 Q500 505 1000 525" fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="1.5"/>

            {/* Road markings */}
            <g stroke="rgba(220,210,160,0.18)" strokeWidth="3" strokeDasharray="48,36">
              <path d="M0 590 Q500 555 1000 572"/>
            </g>
            <g stroke="rgba(255,255,255,0.22)" strokeWidth="2.5">
              <path d="M0 548 Q500 510 1000 528"/>
            </g>

            {/* Light poles */}
            <g>
              <line x1="500" y1="240" x2="500" y2="510" stroke="#1e2230" strokeWidth="3.5"/>
              <path d="M500 240 Q520 235 530 248" fill="none" stroke="#1e2230" strokeWidth="3"/>
              <ellipse cx="531" cy="252" rx="14" ry="5" fill="rgba(215,195,140,0.82)" filter="url(#lglow)"/>
              <path d="M510 260 L550 260 L545 510 L515 510 Z" fill="rgba(200,180,120,0.04)"/>
            </g>
            <g>
              <line x1="298" y1="260" x2="298" y2="516" stroke="#1e2230" strokeWidth="3.5"/>
              <path d="M298 260 Q318 255 328 268" fill="none" stroke="#1e2230" strokeWidth="3"/>
              <ellipse cx="329" cy="272" rx="12" ry="4.5" fill="rgba(205,185,130,0.72)" filter="url(#lglow2)"/>
            </g>
            <g>
              <line x1="702" y1="248" x2="702" y2="512" stroke="#1e2230" strokeWidth="3.5"/>
              <path d="M702 248 Q722 243 732 256" fill="none" stroke="#1e2230" strokeWidth="3"/>
              <ellipse cx="733" cy="260" rx="12" ry="4.5" fill="rgba(205,185,130,0.62)" filter="url(#lglow2)"/>
            </g>

            {/* Crashed car */}
            <g filter="url(#dshadow)">
              {/* Shadow */}
              <ellipse cx="430" cy="534" rx="220" ry="16" fill="rgba(0,0,0,0.62)"/>

              {/* Main body */}
              <path d="M80 478 Q90 430 160 412 L580 390 Q640 388 680 400 Q720 412 740 445 L760 485 L80 510 Z" fill="url(#bodyG)"/>

              {/* Roof */}
              <path d="M218 412 Q240 352 310 335 L480 322 Q540 318 580 340 Q610 358 618 390 L580 390 L218 412 Z" fill="url(#roofG)"/>

              {/* Roof highlight */}
              <path d="M230 405 Q252 348 318 332 L475 320 Q534 316 572 337 Q598 353 608 382 L575 383 L230 405 Z" fill="rgba(255,255,255,0.035)"/>

              {/* Crumple zone (front impact) */}
              <path d="M690 400 Q740 388 790 395 Q830 400 850 420 Q860 435 845 455 Q825 475 790 480 L760 485 L740 445 Q720 412 690 400 Z" fill="url(#crumpleG)"/>
              <path d="M730 398 Q762 390 795 396 Q825 402 840 420" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="1.5"/>
              <path d="M740 412 Q768 406 800 412 Q820 418 832 430" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="1"/>

              {/* Crash damage lines */}
              <path d="M758 440 L790 432 M762 452 L800 446 M748 460 L785 455" stroke="rgba(0,0,0,0.45)" strokeWidth="1.5"/>
              <path d="M760 438 L792 430" stroke="rgba(255,255,255,0.06)" strokeWidth="0.8"/>

              {/* Windshield */}
              <path d="M222 410 Q244 354 310 338 L478 325 Q536 321 578 342 Q606 358 616 388 L580 390 L222 412 Z" fill="url(#windG)" opacity="0.9"/>
              <path d="M238 406 Q258 353 320 338 L472 326 Q528 322 568 342 Q592 357 608 384 L578 385 L238 408 Z" fill="rgba(255,255,255,0.025)"/>

              {/* Windshield cracks from impact */}
              <g stroke="rgba(200,215,230,0.28)" strokeWidth="0.9" fill="none">
                <path d="M555 360 L530 380 L545 395 L510 415 M555 360 L575 385 L555 405"/>
                <path d="M530 380 L500 370 M545 395 L520 400"/>
              </g>

              {/* A-pillars */}
              <path d="M218 412 L230 406 L240 412 L228 418 Z" fill="#22252c"/>
              <path d="M616 390 L608 384 L618 380 L626 386 Z" fill="#1e2128"/>

              {/* Door lines */}
              <path d="M285 412 L282 500" stroke="rgba(0,0,0,0.4)" strokeWidth="1.5"/>
              <path d="M430 400 L428 492" stroke="rgba(0,0,0,0.35)" strokeWidth="1.5"/>
              <path d="M565 392 L563 484" stroke="rgba(0,0,0,0.3)" strokeWidth="1.2"/>

              {/* Door handles */}
              <rect x="340" y="445" width="22" height="5" rx="2.5" fill="#1a1d24" stroke="#0e1016" strokeWidth="0.6"/>
              <rect x="490" y="438" width="20" height="5" rx="2.5" fill="#1a1d24" stroke="#0e1016" strokeWidth="0.6"/>

              {/* Body highlight top */}
              <path d="M82 478 Q92 434 160 416 L578 394 L618 394 L620 400 L580 400 L162 422 Q92 440 84 484 Z" fill="rgba(255,255,255,0.04)"/>

              {/* Rear tail lights */}
              <path d="M82 478 L82 510 L100 508 L100 476 Z" fill="#c01818" opacity="0.9" filter="url(#glow)"/>
              <path d="M102 476 L102 508 L118 506 L118 474 Z" fill="rgba(180,20,20,0.7)"/>
              <path d="M82 478 L118 474 L118 478 L82 482 Z" fill="rgba(255,40,40,0.5)"/>

              {/* Rear reflectors */}
              <rect x="82" y="494" width="36" height="6" rx="1" fill="rgba(255,200,50,0.3)"/>

              {/* Front headlights (wrecked side) */}
              <path d="M748 448 Q762 440 780 446 Q792 450 794 460 Q790 470 778 474 Q762 476 750 468 Z" fill="rgba(200,190,140,0.25)"/>
              <path d="M752 451 Q764 444 779 449 Q788 453 790 461 Q786 469 775 472 Q761 473 752 466 Z" fill="rgba(215,205,155,0.15)"/>

              {/* Front wheel arch */}
              <path d="M622 436 Q638 410 668 402 Q700 396 728 408 Q754 420 760 448 Q764 468 752 486 Q736 502 710 506 Q680 510 660 496 Q636 480 630 456 Z" fill="#090b10" stroke="#10121a" strokeWidth="0.8"/>

              {/* Front wheel */}
              <circle cx="692" cy="468" r="57" fill="url(#tyreG)" stroke="#0c0e14" strokeWidth="1.5"/>
              <circle cx="692" cy="468" r="49" fill="#111"/>
              <circle cx="692" cy="468" r="43" fill="url(#rimG)" opacity="0.85"/>
              <g opacity="0.8">
                <path d="M692 411 L699 417 L697 468 L687 468 L685 417 Z" fill="#787878"/>
                <path d="M743 442 L739 451 L700 468 L695 459 L738 436 Z" fill="#787878"/>
                <path d="M722 518 L714 515 L689 469 L697 464 L725 513 Z" fill="#686868"/>
                <path d="M662 516 L660 507 L685 465 L693 469 L666 512 Z" fill="#686868"/>
                <path d="M643 442 L650 436 L685 461 L680 468 L645 451 Z" fill="#686868"/>
              </g>
              <circle cx="692" cy="468" r="17" fill="#0c0c0c"/>
              <circle cx="692" cy="468" r="11" fill="#111"/>
              <circle cx="692" cy="468" r="7" fill="#1a1a1a" stroke="#222" strokeWidth="0.8"/>

              {/* Red caliper right */}
              <path d="M694 411 Q719 415 727 434 Q731 447 725 458 L720 457 Q724 447 720 435 Q713 416 694 415 Z" fill="url(#brakeR)" filter="url(#glow)"/>

              {/* Side skirt */}
              <path d="M215 498 L622 477 L622 502 L215 523 Z" fill="#101215" stroke="#0d0f12" strokeWidth="0.8"/>
              <path d="M215 498 L622 477 L622 485 L215 506 Z" fill="rgba(255,255,255,0.03)"/>
              <path d="M215 498 L622 477 L622 502 L215 523 Z" fill="url(#carbon)" opacity="0.5"/>

              {/* Underbody rear */}
              <path d="M80 508 L215 498 L215 523 L80 532 Z" fill="#0c0e12" stroke="#090b0f" strokeWidth="0.5"/>

              {/* Rear wheel arch */}
              <path d="M80 502 Q88 478 108 467 Q133 462 153 472 Q173 482 178 506 Q183 526 173 544 Q160 560 138 563 Q113 566 97 554 Q80 540 80 520 Z" fill="#090b10" stroke="#10121a" strokeWidth="0.8"/>

              {/* Rear wheel */}
              <circle cx="131" cy="516" r="59" fill="url(#tyreG)" stroke="#0c0e14" strokeWidth="1.5"/>
              <circle cx="131" cy="516" r="51" fill="#111"/>
              <circle cx="131" cy="516" r="45" fill="url(#rimG)" opacity="0.85"/>
              <g opacity="0.8">
                <path d="M131 457 L138 463 L136 516 L126 516 L124 463 Z" fill="#787878"/>
                <path d="M174 490 L170 499 L135 516 L130 507 L167 484 Z" fill="#787878"/>
                <path d="M156 558 L148 555 L129 517 L137 512 L161 553 Z" fill="#686868"/>
                <path d="M106 558 L104 549 L126 512 L134 517 L109 554 Z" fill="#686868"/>
                <path d="M88 490 L95 484 L126 507 L121 516 L92 499 Z" fill="#686868"/>
              </g>
              <circle cx="131" cy="516" r="19" fill="#0c0c0c"/>
              <circle cx="131" cy="516" r="13" fill="#111"/>
              <circle cx="131" cy="516" r="9" fill="#1a1a1a" stroke="#222" strokeWidth="0.7"/>
              {/* Red caliper rear */}
              <path d="M132 458 Q157 462 165 479 Q168 491 163 501 L158 499 Q162 490 159 479 Q152 464 132 462 Z" fill="url(#brakeR)" filter="url(#glow)"/>

              {/* Exhausts */}
              <ellipse cx="164" cy="528" rx="10" ry="6.5" fill="#090909" stroke="#202020" strokeWidth="1" transform="rotate(-5,164,528)"/>
              <ellipse cx="164" cy="528" rx="7" ry="4.2" fill="#050505" transform="rotate(-5,164,528)"/>
              <ellipse cx="180" cy="530" rx="10" ry="6.5" fill="#090909" stroke="#202020" strokeWidth="1" transform="rotate(-5,180,530)"/>
              <ellipse cx="180" cy="530" rx="7" ry="4.2" fill="#050505" transform="rotate(-5,180,530)"/>

              {/* Front bumper */}
              <path d="M622 488 L683 476 L688 497 L688 516 L622 528 Z" fill="url(#bodyG)" stroke="#10121a" strokeWidth="0.8"/>
              <path d="M625 490 L681 478 L685 493 L625 504 Z" fill="rgba(255,255,255,0.04)"/>
            </g>

            {/* Debris */}
            <g filter="url(#dshadow)">
              <path d="M750 578 L795 570 L800 582 L754 590 Z" fill="#1d2025" stroke="#10121a" strokeWidth="0.5" transform="rotate(-8,775,580)"/>
              <path d="M822 568 L861 562 L864 574 L823 580 Z" fill="#191d22" stroke="#0d0f12" strokeWidth="0.5" transform="rotate(5,843,572)"/>
              <path d="M872 582 L896 577 L898 587 L874 591 Z" fill="#1d2025" transform="rotate(-3,885,584)"/>
              <path d="M702 588 L721 584 L723 592 L703 596 Z" fill="#242830" transform="rotate(15,712,590)"/>
              <path d="M742 598 L759 594 L761 602 L743 606 Z" fill="#1d2025" transform="rotate(-5,751,600)"/>
              <path d="M902 572 L919 568 L920 576 L903 580 Z" fill="#191d22" transform="rotate(8,911,574)"/>
              <path d="M682 608 L697 604 L698 611 L683 615 Z" fill="#242830" transform="rotate(-12,690,609)"/>
              <rect x="712" y="602" width="8" height="4" rx="1" fill="#191d22" transform="rotate(25,716,604)"/>
              <rect x="762" y="608" width="6" height="3" rx="1" fill="#242830" transform="rotate(-15,765,609)"/>
              <rect x="812" y="598" width="9" height="3" rx="1" fill="#1d2025" transform="rotate(10,816,599)"/>
              <rect x="852" y="608" width="7" height="4" rx="1" fill="#191d22" transform="rotate(-8,855,610)"/>
              <rect x="882" y="588" width="5" height="3" rx="1" fill="#242830" transform="rotate(20,884,589)"/>
              <rect x="922" y="578" width="8" height="3" rx="1" fill="#1d2025" transform="rotate(-5,926,579)"/>
              <circle cx="718" cy="610" r="2" fill="#333"/>
              <circle cx="748" cy="604" r="1.5" fill="#2a2a2a"/>
              <circle cx="778" cy="598" r="2" fill="#333"/>
              <circle cx="802" cy="604" r="1.5" fill="#2a2a2a"/>
              <circle cx="842" cy="601" r="2" fill="#333"/>
              <circle cx="866" cy="595" r="1.5" fill="#2a2a2a"/>
              <circle cx="898" cy="584" r="2" fill="#333"/>
              <circle cx="916" cy="591" r="1.5" fill="#2a2a2a"/>
              <path d="M722 602 L728 599 L725 605 Z" fill="rgba(175,195,218,0.32)"/>
              <path d="M782 592 L788 589 L785 596 Z" fill="rgba(175,195,218,0.26)"/>
              <path d="M842 595 L847 592 L844 598 Z" fill="rgba(175,195,218,0.22)"/>
              <path d="M907 582 L912 580 L909 586 Z" fill="rgba(175,195,218,0.26)"/>
              <path d="M660 606 Q700 600 730 604 Q720 608 680 614 Z" fill="#0f0f0f" stroke="#090909" strokeWidth="0.5"/>
              <ellipse cx="782" cy="606" rx="32" ry="9" fill="rgba(12,15,22,0.62)" transform="rotate(-5,782,606)"/>
              <ellipse cx="840" cy="598" rx="20" ry="6" fill="rgba(12,15,22,0.45)" transform="rotate(3,840,598)"/>
            </g>

            {/* Steam */}
            <g opacity="0.55">
              <ellipse cx="793" cy="428" rx="20" ry="9" fill="rgba(115,125,138,0.32)" filter="url(#sglow)"/>
              <ellipse cx="804" cy="408" rx="15" ry="7" fill="rgba(95,105,118,0.22)" filter="url(#sglow)"/>
              <ellipse cx="812" cy="392" rx="11" ry="5.5" fill="rgba(75,85,98,0.16)" filter="url(#sglow)"/>
            </g>

            {/* Wet road reflections */}
            <path d="M102 578 Q408 552 705 545" fill="none" stroke="rgba(75,88,112,0.14)" strokeWidth="4.5"/>
            <ellipse cx="405" cy="578" rx="286" ry="13" fill="rgba(55,68,98,0.06)"/>
            <path d="M700 574 L697 660 L703 660 Z" fill="rgba(195,195,195,0.06)"/>
            <path d="M502 588 L499 660 L505 660 Z" fill="rgba(155,165,135,0.05)"/>
            <ellipse cx="295" cy="598" rx="16" ry="4.5" fill="none" stroke="rgba(145,165,200,0.08)" strokeWidth="0.9"/>
            <ellipse cx="548" cy="582" rx="13" ry="3.5" fill="none" stroke="rgba(145,165,200,0.07)" strokeWidth="0.8"/>
            <ellipse cx="825" cy="586" rx="11" ry="3" fill="none" stroke="rgba(145,165,200,0.07)" strokeWidth="0.75"/>
            <ellipse cx="178" cy="610" rx="19" ry="5.5" fill="none" stroke="rgba(145,165,200,0.06)" strokeWidth="0.9"/>

            {/* Hazard triangle */}
            <path d="M952 300 L964 280 L976 300 Z" fill="none" stroke="rgba(215,95,28,0.82)" strokeWidth="2.5" strokeLinejoin="round"/>
            <text x="964" y="297" fill="rgba(215,95,28,0.82)" fontSize="8" textAnchor="middle" fontFamily="sans-serif" fontWeight="bold">!</text>

            {/* Emergency lights */}
            <ellipse cx="645" cy="266" rx="5.5" ry="3" fill="rgba(28,75,255,0.82)" filter="url(#glow)">
              <animate attributeName="opacity" values="0.82;0.15;0.82" dur="0.75s" repeatCount="indefinite"/>
            </ellipse>
            <ellipse cx="658" cy="266" rx="5.5" ry="3" fill="rgba(255,28,28,0.82)" filter="url(#glow)">
              <animate attributeName="opacity" values="0.15;0.82;0.15" dur="0.75s" repeatCount="indefinite"/>
            </ellipse>

            {/* Vignette */}
            <rect width="1000" height="660" fill="url(#vignette)"/>
            <rect width="1000" height="660" fill="rgba(8,12,28,0.11)"/>
          </svg>
        </div>

        {/* Overlay text */}
        <div className="overlay-404">
          <div className="num-404">404</div>
          <div className="label-404">Страница не найдена</div>
          <div className="msg-404">Похоже, эта страница <span>не пережила краш.</span></div>
          <button className="btn-back-404" onClick={() => navigate('/')}>← Назад в TRIVOX</button>
        </div>
      </div>
    </>
  )
}
