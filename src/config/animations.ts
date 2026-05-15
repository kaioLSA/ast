export const animationConfig = {
  durations: {
    fast: 0.15,
    normal: 0.3,
    slow: 0.5,
    verySlow: 0.8,
  },
  easings: {
    default: [0.4, 0, 0.2, 1],
    in: [0.4, 0, 1, 1],
    out: [0, 0, 0.2, 1],
    bounce: [0.34, 1.56, 0.64, 1],
    spring: { type: 'spring', stiffness: 300, damping: 30 },
  },
  variants: {
    fadeIn: {
      initial: { opacity: 0, y: 8 },
      animate: { opacity: 1, y: 0 },
      exit: { opacity: 0, y: -8 },
    },
    slideInRight: {
      initial: { opacity: 0, x: 20 },
      animate: { opacity: 1, x: 0 },
      exit: { opacity: 0, x: 20 },
    },
    slideInLeft: {
      initial: { opacity: 0, x: -20 },
      animate: { opacity: 1, x: 0 },
      exit: { opacity: 0, x: -20 },
    },
    scaleIn: {
      initial: { opacity: 0, scale: 0.95 },
      animate: { opacity: 1, scale: 1 },
      exit: { opacity: 0, scale: 0.95 },
    },
    stagger: {
      animate: { transition: { staggerChildren: 0.07 } },
    },
  },
  gsap: {
    defaults: {
      duration: 0.3,
      ease: 'power2.out',
    },
    scroll: {
      trigger: { start: 'top 85%', toggleActions: 'play none none none' },
    },
  },
}
