import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { TextPlugin } from 'gsap/TextPlugin'

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger, TextPlugin)
}

export { gsap, ScrollTrigger, TextPlugin }

export function animateCounter(
  element: HTMLElement,
  from: number,
  to: number,
  duration = 1.5,
  prefix = '',
  suffix = '',
) {
  const obj = { val: from }
  gsap.to(obj, {
    val: to,
    duration,
    ease: 'power2.out',
    onUpdate: () => {
      element.textContent = `${prefix}${Math.round(obj.val).toLocaleString('pt-BR')}${suffix}`
    },
  })
}

export function animateIn(
  targets: gsap.TweenTarget,
  options: gsap.TweenVars = {},
) {
  return gsap.fromTo(
    targets,
    { opacity: 0, y: 16 },
    { opacity: 1, y: 0, duration: 0.4, ease: 'power2.out', ...options },
  )
}

export function staggerIn(
  targets: gsap.TweenTarget,
  stagger = 0.07,
  options: gsap.TweenVars = {},
) {
  return gsap.fromTo(
    targets,
    { opacity: 0, y: 12 },
    { opacity: 1, y: 0, stagger, duration: 0.35, ease: 'power2.out', ...options },
  )
}
