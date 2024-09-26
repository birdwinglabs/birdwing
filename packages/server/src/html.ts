import { JSDOM } from 'jsdom';
import fs from 'fs';

export class HtmlBuilder {
  private dom: JSDOM;

  static fromFile(path: string) {
    return new HtmlBuilder(fs.readFileSync(path).toString());
  }

  constructor(html: string) {
    this.dom = new JSDOM(html);
  }

  title(title: string) {
    this.dom.window.document.title = title;
    return this;
  }

  script(src: string, type?: string | undefined) {
    const elem = this.dom.window.document.createElement('script');
    if (type) {
      elem.setAttribute('type', type);
    }
    elem.setAttribute('src', src);
    this.dom.window.document.body.appendChild(elem);
    return this;
  }

  app(html: string) {
    const app = this.dom.window.document.getElementById('app');
    if (app) {
      app.innerHTML = html;
    }
    return this;
  }

  serialize(): string {
    return this.dom.serialize();
  }
}
