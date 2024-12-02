import { Imago } from '../Imago';
import { grid } from './Grid';

export const Tailwind = Imago.configure('Tailwind')
  .use(grid);
