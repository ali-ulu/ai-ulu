import PictureRailGallery from "@/components/ui/picture-rail-gallery";
import type { PictureRailGalleryLabels, PictureRailItem } from "@/components/ui/picture-rail-gallery";
import { ArrowLeft, ArrowUpRight, Maximize2, X } from "lucide-react";
import { useState } from "react";

const img = (name: string) => `${import.meta.env.BASE_URL}stiller/${name}.webp`;
// Two smaller encodings of each 1400px original. The rail draws frames ~150px
// wide and the full-screen view ~1400px, so the browser picks per device.
const srcSet = (name: string) => `${import.meta.env.BASE_URL}stiller/${name}-480.webp 480w, ${import.meta.env.BASE_URL}stiller/${name}-960.webp 960w, ${img(name)} 1400w`;
// Rail frames are small; the full-screen view is the only place the 1400px file is needed.
const RAIL_SIZES = "(max-width: 640px) 45vw, 220px";

// Style references we can build in; shown as "örnek tasarım", never as ai-ulu client work.
const STILLER: PictureRailItem[] = [
  { id: "ic-mimarlik", title: "İç Mimarlık Stüdyosu", artist: "Sade, fotoğraf odaklı", image: img("interiia"), srcSet: srcSet("interiia"), sizes: RAIL_SIZES, imageWidth: 1400, imageHeight: 1050, aspect: 4 / 3, frame: "black", mat: true, drop: 0.04, tag: "Örnek tasarım", details: ["Proje galerisi", "Hizmetler ve süreç", "Keşif randevusu formu"] },
  { id: "ajans", title: "Dijital Ajans", artist: "Cesur tipografi", image: img("rekolet"), srcSet: srcSet("rekolet"), sizes: RAIL_SIZES, imageWidth: 1400, imageHeight: 1050, aspect: 4 / 3, frame: "white", mat: true, drop: 0.12, tag: "Örnek tasarım", details: ["Vaka çalışmaları", "Hizmet paketleri", "Teklif formu"] },
  { id: "kuafor", title: "Kuaför ve Berber", artist: "Sıcak, samimi", image: img("scissor"), srcSet: srcSet("scissor"), sizes: RAIL_SIZES, imageWidth: 1400, imageHeight: 1050, aspect: 4 / 3, frame: "oak", drop: -0.02, tag: "Örnek tasarım", details: ["Hizmet ve fiyat listesi", "Ekip tanıtımı", "WhatsApp randevu"] },
  { id: "hukuk", title: "Hukuk Bürosu", artist: "Ciddi, güven veren", image: img("kafka"), srcSet: srcSet("kafka"), sizes: RAIL_SIZES, imageWidth: 1400, imageHeight: 1050, aspect: 4 / 3, frame: "black", mat: true, drop: 0.16, tag: "Örnek tasarım", details: ["Uzmanlık alanları", "Avukat profilleri", "Ön görüşme formu"] },
  { id: "spor", title: "Spor Salonu", artist: "Enerjik, koyu tema", image: img("flexfitness"), srcSet: srcSet("flexfitness"), sizes: RAIL_SIZES, imageWidth: 1400, imageHeight: 950, aspect: 1400 / 950, frame: "oak", drop: 0.06, tag: "Örnek tasarım", details: ["Ders programı", "Üyelik paketleri", "Deneme dersi kaydı"] },
  { id: "dis", title: "Diş Kliniği", artist: "Temiz, ferah", image: img("eviadental"), srcSet: srcSet("eviadental"), sizes: RAIL_SIZES, imageWidth: 1400, imageHeight: 1050, aspect: 4 / 3, frame: "white", mat: true, drop: 0, tag: "Örnek tasarım", details: ["Tedaviler", "Hekim kadrosu", "Online randevu"] },
  { id: "konaklama", title: "Butik Konaklama", artist: "İskandinav sadeliği", image: img("skandic"), srcSet: srcSet("skandic"), sizes: RAIL_SIZES, imageWidth: 1400, imageHeight: 1050, aspect: 4 / 3, frame: "black", drop: 0.1, tag: "Örnek tasarım", details: ["Oda galerisi", "Müsaitlik ve fiyat", "Rezervasyon talebi"] },
  { id: "restoran", title: "Restoran", artist: "Atmosferik, iştah açan", image: img("tallow"), srcSet: srcSet("tallow"), sizes: RAIL_SIZES, imageWidth: 1400, imageHeight: 1050, aspect: 4 / 3, frame: "oak", mat: true, drop: 0.03, tag: "Örnek tasarım", details: ["Menü", "Şef ve hikâye", "Masa rezervasyonu"] },
];

const LABELS: PictureRailGalleryLabels = { front: "Ön yüz", back: "Arka yüz", close: "Kapat", open: "Büyütmek için tıklayın" };

// Single source for the WhatsApp handoff; the message names the style the
// visitor is looking at, so the conversation starts with context.
const WHATSAPP = "905079581642";
const waLink = (text: string) => `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(text)}`;

// Full-size view on top of the gallery's own detail dialog. Key events stop here so the dialog behind stays open.
function FullView({ item, onClose }: { item: PictureRailItem; onClose: () => void }) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`${item.title} — tam ekran`}
      className="fixed inset-0 z-[70] flex items-center justify-center bg-background/95 p-4 backdrop-blur-sm"
      onClick={onClose}
      onKeyDown={(event) => {
        if (event.key === "Escape") { event.stopPropagation(); onClose(); }
        if (event.key === "Tab") { event.stopPropagation(); event.preventDefault(); }
      }}
    >
      <img
        src={item.image}
        srcSet={item.srcSet}
        sizes="100vw"
        alt={`${item.title} örnek tasarımı`}
        width={item.imageWidth}
        height={item.imageHeight}
        className="max-h-[92svh] max-w-full rounded-lg object-contain shadow-2xl"
      />
      <button
        type="button"
        autoFocus
        onClick={onClose}
        className="absolute right-5 top-5 inline-flex min-h-11 items-center gap-2 rounded-full bg-card px-4 text-sm text-card-foreground focus-visible:ring-2 focus-visible:ring-ring"
      >
        Kapat <X className="size-4" aria-hidden="true" />
      </button>
    </div>
  );
}

export default function App() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [isFull, setIsFull] = useState(false);
  const openItem = openIndex === null ? null : STILLER[openIndex];

  return (
    <main id="main" className="flex min-h-svh flex-col bg-background text-foreground">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[80] focus:rounded-md focus:bg-card focus:px-4 focus:py-2 focus:text-card-foreground focus:ring-2 focus:ring-ring"
      >
        İçeriğe geç
      </a>
      <nav className="flex items-center justify-between px-6 py-5 sm:px-10">
        <a href="/" className="inline-flex min-h-11 items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground">
          <ArrowLeft className="size-4" aria-hidden="true" /> ai-ulu
        </a>
        <span className="font-serif text-xl">ai-ulu</span>
      </nav>

      <div className="flex flex-1 items-center">
        <PictureRailGallery
          items={STILLER}
          labels={LABELS}
          eyebrow="Örnek tasarımlar · Sektöre göre"
          heading="Hangi tarz sizin işinize uyar?"
          headingAs="h1"
          caption="Çerçevelerin üzerinde gezinin, birine tıklayıp yakından bakın, arkasını çevirip içeriği görün."
          autoplay
          onOpenChange={(index) => { setOpenIndex(index); if (index === null) setIsFull(false); }}
          action={
            <a
              href={waLink(openItem ? `${openItem.title} tarzında bir site istiyorum.` : "Örnek tasarımlarınızı gördüm, bir site istiyorum.")}
              rel="noopener"
              className="inline-flex min-h-11 items-center gap-2 rounded-full bg-foreground px-5 py-2.5 text-sm font-medium text-background shadow-sm transition-transform hover:-translate-y-px focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background motion-reduce:transition-none"
            >
              Bu tarzda bir site istiyorum <ArrowUpRight className="size-4" aria-hidden="true" />
            </a>
          }
        />
      </div>

      <p className="px-6 pb-6 text-center text-xs text-muted-foreground">
        Görseller tarz örneğidir; siteniz markanıza ve içeriğinize göre sıfırdan tasarlanır.
      </p>

      {openItem && !isFull && (
        <button
          type="button"
          onClick={() => setIsFull(true)}
          className="fixed bottom-6 left-1/2 z-[60] inline-flex min-h-11 -translate-x-1/2 items-center gap-2 rounded-full bg-foreground px-5 text-sm font-medium text-background shadow-lg focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          <Maximize2 className="size-4" aria-hidden="true" /> Tam ekran gör
        </button>
      )}
      {openItem && isFull && <FullView item={openItem} onClose={() => setIsFull(false)} />}
    </main>
  );
}
