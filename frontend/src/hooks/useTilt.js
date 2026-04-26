import { useEffect, useRef } from "react";

export default function useTilt(options = {}) {
    const ref = useRef(null);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;

        // Determine physics bounds
        const maxTilt = options.maxTilt || 10; // degrees
        const scale = options.scale || 1.02; // scalar

        // We want the element to be structurally ready for 3d
        el.style.transformStyle = "preserve-3d";

        let isMouseOver = false;

        const handleMouseMove = (e) => {
            if (!isMouseOver) return;

            requestAnimationFrame(() => {
                const rect = el.getBoundingClientRect();
                const absoluteX = e.clientX - rect.left; // x cursor relative to card
                const absoluteY = e.clientY - rect.top;  // y cursor relative to card

                const centerX = rect.width / 2;
                const centerY = rect.height / 2;

                // Ranges between -1 and 1
                const normalizedX = (absoluteX - centerX) / centerX;
                const normalizedY = (absoluteY - centerY) / centerY;

                // Multiply by maxTilt
                const rotateX = normalizedY * -maxTilt; // Invert Y axis
                const rotateY = normalizedX * maxTilt;

                el.style.transform = `perspective(1200px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(${scale}, ${scale}, ${scale})`;
            });
        };

        const handleMouseEnter = () => {
            isMouseOver = true;
            el.style.transition = "transform 0.1s cubic-bezier(0.2, 0.8, 0.2, 1)";
        };

        const handleMouseLeave = () => {
            isMouseOver = false;
            el.style.transition = "transform 0.5s cubic-bezier(0.2, 0.8, 0.2, 1)";
            el.style.transform = `perspective(1200px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)`;
        };

        el.addEventListener("mouseenter", handleMouseEnter);
        el.addEventListener("mousemove", handleMouseMove);
        el.addEventListener("mouseleave", handleMouseLeave);

        return () => {
            el.removeEventListener("mouseenter", handleMouseEnter);
            el.removeEventListener("mousemove", handleMouseMove);
            el.removeEventListener("mouseleave", handleMouseLeave);
        };
    }, [options.maxTilt, options.scale]);

    return ref;
}
