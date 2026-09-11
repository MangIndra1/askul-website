import Image from 'next/image'

export function BackgroundImage() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden bg-[var(--dk-bg-0)]">
      <Image
        src="/images/background.jpg"
        alt=""
        fill
        priority
        quality={55}
        className="object-cover"
        style={{ filter: 'brightness(0.45) saturate(1.1)' }}
      />
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(1000px 700px at 20% 0%, rgba(139,77,235,0.20), transparent 60%), ' +
            'radial-gradient(800px 600px at 90% 10%, rgba(236,60,145,0.13), transparent 55%), ' +
            'linear-gradient(180deg, rgba(2,2,14,0.40) 0%, rgba(2,2,14,0.72) 100%)',
        }}
      />
    </div>
  )
}