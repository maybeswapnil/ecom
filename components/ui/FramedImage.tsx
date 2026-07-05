import Image from "next/image";

type FramedImageProps = {
  src: string;
  alt: string;
  ratio?: string;
  priority?: boolean;
  sizes?: string;
};

/** Echoes the site's literal product: a mat border + shadow around the photograph, like a framed print. */
export function FramedImage({ src, alt, ratio = "3/2", priority, sizes }: FramedImageProps) {
  return (
    <div className="bg-surface border border-hairline p-2.5 shadow-[0_22px_44px_-32px_rgba(28,25,21,0.45)]">
      <div className="relative w-full bg-image-placeholder" style={{ aspectRatio: ratio }}>
        <Image
          src={src}
          alt={alt}
          fill
          priority={priority}
          sizes={sizes ?? "(max-width: 768px) 100vw, 50vw"}
          className="object-cover"
        />
      </div>
    </div>
  );
}
