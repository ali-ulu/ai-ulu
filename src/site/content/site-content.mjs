// Copy shared by more than one output (page markup, JSON-LD, llms.txt) lives here.

export const nav = [
  { href: "/#nasil", label: "Nasıl çalışır" },
  { href: "/calismalar/", label: "Çalışmalar", keep: true },
  { href: "/sablonlar/", label: "Örnek tasarımlar", keep: true },
  { href: "/#paketler", label: "Paketler" },
  { href: "/blog/", label: "Blog", keep: true },
  { href: "/#sss", label: "SSS" },
];

// tab: the subject on the card's staggered tab (the FAQ drawer's filing label).
export const faq = {
  items: [
    {
      tab: "Süre",
      q: "Bir site ne kadar sürede hazır olur?",
      a: "Odaklı bir tanıtım sitesi ilk görüşmeden yayına genelde iki ile dört hafta sürer. Büyük siteler ve uygulamalar daha uzun sürer; takvim teklifte yazılıdır.",
    },
    {
      tab: "Fiyat",
      q: "Fiyatı ne belirler?",
      a: "Sayfa sayısı, içerik hazırlığı ve ek özellikler (form, randevu, çoklu dil, uygulama). Ücretsiz görüşmeden sonra 24 saat içinde yazılı teklif gönderilir.",
    },
    {
      tab: "Sahiplik",
      q: "Site ve kodlar bana mı ait olur?",
      a: "Evet. Tasarım, kod ve içerik sizindir; yayında her şey size teslim edilir.",
    },
    {
      tab: "Destek",
      q: "Yayından sonra da çalışıyor musunuz?",
      a: "Evet. Hataları düzeltir, değişiklikleri yapar, isterseniz siteyi sürekli bakımda tutarız.",
    },
    {
      tab: "Görünürlük",
      q: "Site yapay zekâ aramalarında nasıl görünür?",
      a: "Her site, yapay zekâ asistanlarının okuduğu yapıyla gelir: temiz HTML, yapılandırılmış veri, llms.txt özeti, site haritası ve yapay zekâ tarayıcılarına açık erişim. Belirli bir sıralama garanti edilemez.",
    },
    {
      tab: "Yenileme",
      q: "Mevcut sitemi yenileyebilir misiniz?",
      a: "Evet. İşe yarayanı korur; yapıyı, hızı ve içeriği müşteri getirecek şekilde yeniden kurarız.",
    },
    {
      tab: "İletişim",
      q: "Siteme WhatsApp butonu ve form nasıl eklenir?",
      a: "Her sayfaya tek dokunuşla açılan WhatsApp bağlantısı ve size düşen bir iletişim formu kurarız. Ziyaretçi ayrı bir uygulama indirmez; yazar, mesaj doğrudan telefonunuza gelir.",
    },
    {
      tab: "Randevu",
      q: "Siteme online randevu sistemi ekleyebilir misiniz?",
      a: "Evet. Takviminize bağlı randevu, sipariş veya başvuru formu kurarız; talepler size düşer, isterseniz otomatik onay da eklenir. Bu, özel web uygulaması paketinin kapsamındadır.",
    },
  ],
};

// The form's topic stamps reuse these labels; `glyph` is the symbol on the stamp.
export const projectTypes = [
  { value: "site", label: "Tanıtım sitesi", glyph: "⌂" },
  { value: "app", label: "Web uygulaması", glyph: "▤" },
  { value: "both", label: "Site + uygulama", glyph: "✦" },
  { value: "unsure", label: "Emin değilim", glyph: "◌" },
];

// The form asks for a range, never an exact number: business owners answer
// ranges more readily, and it lets us route the lead. Edit the brackets to
// match real pricing before this goes live.
export const budgets = [
  { value: "", label: "Belirtmek istemiyorum" },
  { value: "0-25", label: "25.000 ₺ altı" },
  { value: "25-50", label: "25.000 – 50.000 ₺" },
  { value: "50-100", label: "50.000 – 100.000 ₺" },
  { value: "100+", label: "100.000 ₺ üzeri" },
];

export const footerLinks = [
  { href: "/calismalar/", label: "Çalışmalar" },
  { href: "/sablonlar/", label: "Örnek tasarımlar" },
  { href: "/blog/", label: "Blog" },
  { href: "/#iletisim", label: "İletişim" },
  { href: "/gizlilik/", label: "Gizlilik ve KVKK" },
  { href: "/kullanim-sartlari/", label: "Kullanım şartları" },
];

// Profile links shown as icons in the footer. Kept in one place so the footer
// and the JSON-LD sameAs stay in step. Only profiles the owner actually owns
// belong here: a link to someone else's work under our name misleads visitors.
export const socials = [
  { href: "https://www.linkedin.com/in/aliulu777/", label: "LinkedIn", icon: "linkedin" },
];
