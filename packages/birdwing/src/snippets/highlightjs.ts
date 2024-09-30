import { CodeSnippet } from "../interfaces.js";

export class HighlightJsSnippet implements CodeSnippet {
  constructor(private languages: string[] | undefined = undefined) {}

  get head() {
    if (this.languages) {
      return `
        import hljs from 'highlight.js/lib/core';
        ${this.languages.map(lang => `import ${lang} from 'highlight.js/lib/languages/${lang}';`).join('\n')}
      `
    }
    return `import hljs from 'highlight.js';`
  }

  get body() {
    const body = `
      function highlight(content, language) {
        return hljs.highlight(content.trim(), { language }).value ;
      }
    `;

    if (this.languages) {
      return `
        ${this.languages.map(lang => `hljs.registerLanguage('${lang}', ${lang})`).join('\n')}

        ${body}
      `;
    }
    return body;
  }
}
