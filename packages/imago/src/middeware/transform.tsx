import React from "react";
import { Element, ImagoMiddleware, MiddlewareFactory, NodeInfo, NodeType, TagProps, TransformOptions } from "../interfaces";
import { ComponentMiddlewareFactory } from "./component";

export { ComponentMiddlewareFactory };

export class TransformMiddlewareFactory<T extends NodeType, TSlot extends React.FunctionComponent<any>> extends MiddlewareFactory<T> {
  constructor(
    private options: TransformOptions<T>,
    private slot: (props: TagProps<T>) => TSlot
  ) { super(); }

  createMiddleware(nodes: Record<number, NodeInfo>): ImagoMiddleware<Element<T>> {
    const options = this.options;

    const renderProps = (props: TagProps<T>) => {
      return { ...props, Slot: this.slot(props) };
    }

    return next => ({ name, props }) => {
      let pNext = props;

      if (options.class) {
        const addClass = Array.isArray(options.class) ? options.class.join(' ') : options.class;
        pNext = { ...pNext, className: [props.className, addClass].join(' ') };
      }
      if (options.childBefore) {
        pNext = { ...pNext, children: <>{ options.childBefore } { pNext.children }</> }
      }
      if (options.childAfter) {
        pNext = { ...pNext, children: <>{ pNext.children } { options.childAfter }</> }
      }
      if (options.parent) {
        return React.createElement(options.parent, {} as any, next({ name, props: pNext }));
      }
      if (options.children) {
        pNext = { ...pNext, children: <>{ options.children(renderProps(pNext))}</>}
      }
      if (options.render) {
        return options.render(renderProps(pNext));
      }

      return next({ name, props: pNext });
    }
  }
}
