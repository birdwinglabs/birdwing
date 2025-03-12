import { TagHandler } from "@birdwing/imago";
import { NavLink } from "react-router-dom";

interface NavLinkOptions {
  class: string;
  classInactive: string;
  classActive: string;
}

export function navLink(options: NavLinkOptions): TagHandler<'a', any> {
  return {
    render: ({ href, Slot }) => {
      const className = ({ isActive }: any) => isActive
        ? `${options.class} ${options.classActive}`
        : `${options.class} ${options.classInactive}`;

      return (
        <NavLink to={href} end={true} className={className}><Slot/></NavLink>
      );
    }
  }
}
