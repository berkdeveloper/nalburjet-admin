import Link from "next/link";

const navigationItems = [
  { label: "Dashboard", href: "/" },
  { label: "Siparişler", href: "/siparisler" },
  { label: "Bildirimler", href: "/bildirimler" },
  { label: "Ürünler", href: "/urunler" },
  { label: "Kategoriler", href: "/kategoriler" },
  { label: "Vitrin Ürünleri", href: "/vitrin-urunleri" },
  { label: "Kullanıcılar", href: "/kullanicilar" },
  { label: "Roller", href: "/roller" },
  { label: "Sepetler", href: "/sepetler" },
  { label: "Kargo Yöntemleri", href: "/kargo-yontemleri" },
  { label: "Bülten Aboneleri", href: "/bulten-aboneleri" },
];

export default function AdminSidebar() {
  return (
    <aside className="fixed inset-y-0 left-0 z-30 flex w-64 flex-col border-r border-border bg-white">
      <div className="flex h-16 items-center border-b border-border px-6">
        <Link href="/" className="text-xl font-bold tracking-tight text-primary">
          NalburJet
        </Link>
      </div>

      <nav className="flex-1 overflow-y-auto p-4">
        <div className="space-y-1">
          {navigationItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="block rounded-lg px-3 py-2.5 text-sm font-medium text-text-primary transition-colors hover:bg-background-soft hover:text-primary"
            >
              {item.label}
            </Link>
          ))}
        </div>
      </nav>
    </aside>
  );
}