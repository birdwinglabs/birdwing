import path from 'path';

export class Summary {
  constructor(
    public readonly renderable: any,
    public readonly path: string,
    private links: any,
    private urls: Record<string, string>
  ) {}

  topic(pagePath: string) {
    const idx = this.links.findIndex((link: any) => link.href === pagePath);
    if (idx === -1) {
      return undefined;
    }
    return this.links[idx].topic;
  }

  next(pagePath: string) {
    const idx = this.links.findIndex((link: any) => link.href === pagePath);
    if (idx === -1 || idx === this.links.length - 1) {
      return undefined;
    }
    const { href, title } = this.links[idx + 1];
    return { href: this.urls[path.join(this.path, href)], title };
  }

  prev(pagePath: string) {
    const idx = this.links.findIndex((link: any) => link.href === pagePath);
    if (idx === -1 || idx === 0) {
      return undefined;
    }
    const { href, title } = this.links[idx - 1];
    return { href: this.urls[path.join(this.path, href)], title };
  }
}
