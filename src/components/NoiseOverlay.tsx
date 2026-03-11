"use client";

export default function NoiseOverlay() {
  return (
    <div className="awwwards-noise">
      <style dangerouslySetInnerHTML={{ __html: `
        .awwwards-noise {
          position: fixed;
          top: -50%;
          left: -50%;
          right: -50%;
          bottom: -50%;
          width: 200%;
          height: 200vh;
          background: transparent url('https://upload.wikimedia.org/wikipedia/commons/7/76/1k_Dissolve_Noise_Texture.png') repeat 0 0;
          animation: noise-anim .2s infinite;
          opacity: 0.04; /* Extremely subtle */
          pointer-events: none; /* Lets clicks pass through to your buttons */
          z-index: 9999; /* Sits on top of everything */
        }
        @keyframes noise-anim {
            0% { transform: translate(0,0) }
            10% { transform: translate(-5%,-5%) }
            20% { transform: translate(-10%,5%) }
            30% { transform: translate(5%,-10%) }
            40% { transform: translate(-5%,15%) }
            50% { transform: translate(-10%,5%) }
            60% { transform: translate(15%,0) }
            70% { transform: translate(0,15%) }
            80% { transform: translate(3%,35%) }
            90% { transform: translate(-10%,10%) }
        }
      `}} />
    </div>
  );
}
