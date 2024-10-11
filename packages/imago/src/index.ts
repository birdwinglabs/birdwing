export * from './interfaces.js';

export { Imago, Ordering, OrderingContext } from './Imago.js';

import { HeadingConfig, HeadingProps, LinkProps } from './interfaces.js';
import { assignProps, match, matchProp, assign, replace, replaceProps } from './middleware.js';

export interface NavLinkConfig {
  end: boolean;
  active: string;
  inactive: string;
}

class TagUtil<T> {
  match = match<T>;
  matchProp = matchProp<T>;
  assign = assign;
  assignProps = assignProps<T>;
  replace = replace;
  replaceProps = replaceProps<T>;
}

class LinkUtil extends TagUtil<LinkProps> {
  nav({ end, active, inactive }: NavLinkConfig) {
    return assignProps<LinkProps>({
      nav: true,
      end,
      className: ({ isActive }: any) => isActive ? active : inactive 
    });
  }
}

class HeadingUtil extends TagUtil<HeadingProps> {
  levels(config: HeadingConfig) {
    return this.matchProp('level', [
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
export const Tag = new TagUtil();
