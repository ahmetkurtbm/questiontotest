"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/", label: "Fotoğraftan Soru" },
  { href: "/pdf", label: "PDF'ten Aktar" },
  { href: "/sorular", label: "Soru Bankası" },
  { href: "/test", label: "Test Oluştur" },
];

export default function Header() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  const linkClass = (href) => (pathname === href ? "active" : undefined);

  return (
    <>
      <header className="header">
        <div className="header-inner">
          <span className="brand">
            <span className="brand-mark">Q2T</span>
            <span className="brand-name">
              Question<em>To</em>Test
            </span>
          </span>

          <nav className="nav">
            {LINKS.map((link) => (
              <Link key={link.href} href={link.href} className={linkClass(link.href)}>
                {link.label}
              </Link>
            ))}
            <a href="/api/auth/signout" className="nav-signout">
              Çıkış
            </a>
          </nav>

          <button
            type="button"
            className="nav-toggle"
            data-open={open}
            aria-label="Menü"
            aria-expanded={open}
            onClick={() => setOpen((value) => !value)}
          >
            <span />
            <span />
            <span />
          </button>
        </div>
      </header>

      {open && (
        <>
          <div className="nav-backdrop" onClick={() => setOpen(false)} />
          <nav className="nav-mobile">
            {LINKS.map((link) => (
              <Link key={link.href} href={link.href} className={linkClass(link.href)}>
                {link.label}
              </Link>
            ))}
            <a href="/api/auth/signout" className="nav-signout">
              Çıkış
            </a>
          </nav>
        </>
      )}
    </>
  );
}
