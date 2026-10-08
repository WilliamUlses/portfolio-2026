import Image from "next/image";
import styles from "./MonogramFallback.module.css";

// Static WebP fallback for the 3D optical crystal monogram on mobile devices & reduced motion.
// Renders dual images styled via CSS to switch immediately with dark/light theme without heavy WebGL.
export function MonogramFallback({
  priority = false,
  sizes = "(min-width: 768px) 40vw, 90vw",
}: {
  priority?: boolean;
  sizes?: string;
}) {
  return (
    <>
      <Image
        src="/images/monogramme-verre-light.webp"
        alt=""
        fill
        sizes={sizes}
        priority={priority}
        className={styles.monogramLight}
      />
      <Image
        src="/images/monogramme-verre-dark.png"
        alt=""
        fill
        sizes={sizes}
        priority={priority}
        className={styles.monogramDark}
      />
    </>
  );
}
