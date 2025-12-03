// SnowOverlay.jsx
"use client";
export default function SnowOverlay() {
  const flakes = Array.from({ length: 40 });

  return (
    <>
      {/* Falling snow layer */}
      <div className="pointer-events-none fixed inset-0 z-30 overflow-hidden">
        {flakes.map((_, i) => {
          const left = (i * 17) % 100;
          const startOffset = -((i * 7) % 25);
          const size = 10 + ((i * 3) % 18);
          const delay = (i * 1.1) % 10;
          const duration = 10 + ((i * 1.3) % 12);

          return (
            <span
              key={i}
              className="absolute text-white/80 select-none snowflake"
              style={{
                left: `${left}%`,
                top: `${startOffset}vh`,
                fontSize: `${size}px`,
                animationDelay: `${delay}s`,
                animationDuration: `${duration}s`,
              }}
            >
              ❄️
            </span>
          );
        })}
      </div>

      {/* Snow pile at bottom */}
      <div className="pointer-events-none fixed bottom-0 left-0 right-0 z-25">
        <div className="h-16 md:h-24 bg-gradient-to-t from-white to-white/0 opacity-90" />
        <div className="absolute -top-6 inset-x-0 flex justify-around opacity-80">
          <div className="w-24 h-10 md:w-32 md:h-12 bg-white rounded-full blur-[2px]" />
          <div className="w-32 h-12 md:w-40 md:h-14 bg-white rounded-full blur-[2px]" />
          <div className="w-20 h-9 md:w-28 md:h-11 bg-white rounded-full blur-[2px]" />
        </div>
      </div>

      <style jsx>{`
        @media (prefers-reduced-motion: no-preference) {
          @keyframes snowfallHome {
            0% {
              transform: translate3d(0, -10vh, 0);
              opacity: 0;
            }
            10% {
              opacity: 1;
            }
            100% {
              transform: translate3d(10px, 110vh, 0);
              opacity: 0.3;
            }
          }

          .snowflake {
            animation-name: snowfallHome;
            animation-timing-function: linear;
            animation-iteration-count: infinite;
          }
        }
      `}</style>
    </>
  );
}
