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
  SectionProps,
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

  withClass(...name: string[]): Selector<T> {
    return this.condition(({ className }) => {
      const classes = (className as string || '').split(' ');
      return name.every(c => classes.indexOf(c) >= 0)
    });
  }

  withoutClass(name: string): Selector<T> {
    return this.condition(({ className }) => !((className as string || '').split(' ').includes(name)));
  }

  withAttr(attrs: Partial<T>): Selector<T> {
    return this.condition(props => Object.entries(attrs).every(([k, v]) => v === undefined || (props as any)[k] === v));
  }

  withChild(selector: Selector<any>) {
    return this.condition(({ children }) => {
      const nodes = React.isValidElement(children) && children.type === TemplateContext.Provider
        ? children.props.children
        : children;

      return React.Children.toArray(nodes).some(c => React.isValidElement(c) && selector.match(c.props));
    });
  }

  withoutChild(selector: Selector<any>) {
    return this.condition(({ children }) => {
      const nodes = React.isValidElement(children) && children.type === TemplateContext.Provider
        ? children.props.children
        : children;

      return React.Children.toArray(nodes).every(c => !React.isValidElement(c) || !selector.match(c.props));
    });
  }
}

function layout<T extends NodeProps = NodeProps>(attr?: Partial<T>) { return new Selector<T>('layout').withAttr(attr || {}) };
const section = (...names: string[]) => new Selector<SectionProps>('section').condition(({ name }) => names.includes(name) );
const grid = (name?: string) => new Selector<GridProps>('grid').withAttr({ name });
const tile = (name?: string) => new Selector<TileProps>('tile').withAttr({ name });
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
  layout,
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

  h1: heading.withAttr({ level: 1 }),
  h2: heading.withAttr({ level: 2 }),
  h3: heading.withAttr({ level: 3 }),
  h4: heading.withAttr({ level: 4 }),
  h5: heading.withAttr({ level: 5 }),
  h6: heading.withAttr({ level: 6 }),

  tabGroup: section('tab-group'),
  tabs: list.withClass('tabs'),
  tab: item.withClass('tab'),
  tabPanels: list.withClass('tab-panels'),
  tabPanel: item.withClass('tab-panel'),
};
