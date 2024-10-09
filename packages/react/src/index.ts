export { Page, PageContext } from './Page.js';
export { CodeBlock } from './CodeBlock.js';
export { Content } from './Content.js';
export { Renderer } from './renderer.js';

export * from './interfaces.js';

export { Template, match, matchProp, replaceWith, replaceProps, assignProps } from './Template.js';

import { HeadingConfig, HeadingProps, LinkProps } from './interfaces.js';
import { assignProps, match, matchProp } from './Template.js';

export interface NavLinkConfig {
  end: boolean;
  active: string;
  inactive: string;
}

class NodeUtil<T> {
  assignProps = assignProps<T>;
  match = match<T>;
  matchProp = matchProp<T>;
}

class LinkUtil extends NodeUtil<LinkProps> {
  nav({ end, active, inactive }: NavLinkConfig) {
    return assignProps<LinkProps>({
      nav: true,
      end,
      className: ({ isActive }: any) => isActive ? active : inactive 
    });
  }
}

class HeadingUtil extends NodeUtil<HeadingProps> {
  levels(config: HeadingConfig) {
    return matchProp('level', [
      [1, config.h1],
      [2, config.h2],
      [3, config.h3],
      [4, config.h4],
      [5, config.h5],
      [6, config.h6],
    ]);
  }
}


export const Link = new LinkUtil();
export const Heading = new HeadingUtil();
