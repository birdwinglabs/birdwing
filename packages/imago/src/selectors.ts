import React from "react";
import {
  FenceProps,
  GridProps,
  HeadingProps,
  ItemProps,
  LinkProps,
  ListProps,
  Matcher,
  NodeProps,
  NodeType,
  ParagraphProps,
  TileProps
} from "./interfaces";
import { TemplateContext } from "./Imago";

export class Selector<T extends NodeProps> {
  constructor(
    public readonly type: NodeType,
    private matchers: Matcher<T>[] = [],
  ) {}

  match(props: T): boolean {
    return this.matchers.every(m => m(props));
  }

  condition(condition: Matcher<T>) {
    return new Selector<T>(this.type, [...this.matchers, condition]);
  }

  property(value: string) {
    return this.attr({ property: value } as any);
  }

  typeof(type: string) {
    return this.attr({ typeof: type } as any);
  }

  name(name: string) {
    return this.attr({ name } as any);
  }

  get first() {
    return this.condition(({ index }) => index === 0);
  }

  get notFirst() {
    return this.condition(({ index }) => index > 0);
  }

  get last() {
    return this.condition(({ isLast }) => isLast);
  }

  get notLast() {
    return this.condition(({ isLast }) => !isLast);
  }

  class(...name: string[]): Selector<T> {
    return this.condition(({ className }) => {
      const classes = (className as string || '').split(' ');
      return name.every(c => classes.indexOf(c) >= 0)
    });
  }

  notClass(name: string): Selector<T> {
    return this.condition(({ className }) => !((className as string || '').split(' ').includes(name)));
  }

  attr(attrs: Partial<T>): Selector<T> {
    return this.condition(props => Object.entries(attrs).every(([k, v]) => v === undefined || (props as any)[k] === v));
  }

  notAttr(name: string): Selector<T> {
    return this.condition(props => !Object.keys(props).includes(name));
  }

  child(selector: Selector<any>) {
    return this.condition(({ children }) => {
      const nodes = React.isValidElement(children) && children.type === TemplateContext.Provider
        ? children.props.children
        : children;

      return React.Children.toArray(nodes).some(c => React.isValidElement(c) && selector.match(c.props));
    });
  }

  notChild(selector: Selector<any>) {
    return this.condition(({ children }) => {
      const nodes = React.isValidElement(children) && children.type === TemplateContext.Provider
        ? children.props.children
        : children;

      return React.Children.toArray(nodes).every(c => !React.isValidElement(c) || !selector.match(c.props));
    });
  }
}

const document = new Selector<NodeProps>('document');
const meta = new Selector<NodeProps>('meta');
const section = new Selector<NodeProps>('section');
const grid = new Selector<GridProps>('grid');
const tile = new Selector<TileProps>('tile');
const heading = new Selector<HeadingProps>('heading');
const paragraph = new Selector<ParagraphProps>('paragraph');
const hr = new Selector<NodeProps>('hr');
const image = new Selector<NodeProps>('image');
const fence = new Selector<FenceProps>('fence');
const html = new Selector<NodeProps>('html');
const blockquote = new Selector<NodeProps>('blockquote');
const list = new Selector<ListProps>('list');
const item = new Selector<ItemProps>('item');
const strong = new Selector<NodeProps>('strong');
const link = new Selector<LinkProps>('link');
const code = new Selector<NodeProps>('code');

export const selectors = {
  document,
  meta,
  section,
  grid,
  tile,
  heading,
  paragraph,
  hr,
  image,
  fence,
  html,
  blockquote,
  list,
  item,
  strong,
  link,
  code,

  h1: heading.attr({ level: 1 }),
  h2: heading.attr({ level: 2 }),
  h3: heading.attr({ level: 3 }),
  h4: heading.attr({ level: 4 }),
  h5: heading.attr({ level: 5 }),
  h6: heading.attr({ level: 6 }),
};
