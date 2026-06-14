"use client"

import { useEffect } from "react"

/**
 * Hook that adds scroll-triggered animations using Intersection Observer.
 * Call this once in your layout or page component to enable scroll animations
 * for all elements with the `.animate-on-scroll` class.
 */
export function useScrollAnimations() {
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible")
          }
        })
      },
      {
        threshold: 0.1,
        rootMargin: "0px 0px -50px 0px",
      }
    )

    const elements = document.querySelectorAll(".animate-on-scroll")
    elements.forEach((el) => observer.observe(el))

    return () => observer.disconnect()
  }, [])
}
