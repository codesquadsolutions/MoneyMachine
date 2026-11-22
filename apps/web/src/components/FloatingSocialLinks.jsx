const SOCIAL_LINKS = [
  {
    name: "Instagram",
    href: "https://www.instagram.com/flipurtrade",
    path: "M7 2h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5Zm0 2.2A2.8 2.8 0 0 0 4.2 7v10A2.8 2.8 0 0 0 7 19.8h10a2.8 2.8 0 0 0 2.8-2.8V7A2.8 2.8 0 0 0 17 4.2H7Zm5 2.3a5.5 5.5 0 1 1 0 11 5.5 5.5 0 0 1 0-11Zm0 2.2a3.3 3.3 0 1 0 0 6.6 3.3 3.3 0 0 0 0-6.6Zm5.8-3.2a1.3 1.3 0 1 1 0 2.6 1.3 1.3 0 0 1 0-2.6Z",
  },
  {
    name: "Telegram",
    href: "https://t.me/flipurtrade_bot",
    path: "M21.8 3.2 18.5 20c-.25 1.2-.95 1.5-1.95.95l-5.4-3.98-2.6 2.5c-.3.3-.55.55-1.1.55l.4-5.5 10-9.05c.45-.4-.1-.62-.7-.23L4.8 13.1.1 11.6c-1.02-.32-1.04-1.02.22-1.52L20.4 2.5c.9-.33 1.7.22 1.4.7Z",
  },
  {
    name: "Discord",
    href: "https://discord.gg/zrXgKGurS",
    path: "M19.7 5.2a18 18 0 0 0-4.4-1.35l-.55 1.12a16.7 16.7 0 0 0-5.5 0L8.7 3.85A18 18 0 0 0 4.3 5.2C1.5 9.35.75 13.4 1.12 17.4a18 18 0 0 0 5.4 2.75l1.17-1.9a11.7 11.7 0 0 1-1.84-.9l.45-.35a12.8 12.8 0 0 0 11.4 0l.45.35a11.7 11.7 0 0 1-1.84.9l1.17 1.9a18 18 0 0 0 5.4-2.75c.44-4.64-.75-8.65-3.18-12.2ZM8.3 14.7c-1.05 0-1.9-.97-1.9-2.17s.84-2.17 1.9-2.17c1.07 0 1.92.98 1.9 2.17 0 1.2-.84 2.17-1.9 2.17Zm7.4 0c-1.05 0-1.9-.97-1.9-2.17s.84-2.17 1.9-2.17c1.07 0 1.92.98 1.9 2.17 0 1.2-.83 2.17-1.9 2.17Z",
  },
];

export function FloatingSocialLinks() {
  return (
    <aside className="floating-socials" aria-label="Follow Flipur">
      {SOCIAL_LINKS.map(({ name, href, path }) => (
        <a key={name} href={href} target="_blank" rel="noopener noreferrer" aria-label={`Flipur on ${name}`} title={name}>
          <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <path d={path} />
          </svg>
        </a>
      ))}
    </aside>
  );
}
