import { CodeSnippet } from "../interfaces.js";
import { Theme } from "../theme.js";

export class ThemeSnippet implements CodeSnippet {
  constructor(private theme: Theme) {}

  get head() {
    return this.theme.componentNames.map(c => `import ${c} from './tags/${c}.jsx';`).join('\n');
  }

  get body() {
    return `const components = { ${this.theme.componentNames.map(c => `${c}: new ${c}()`).join(', ')} };`
  }
}
