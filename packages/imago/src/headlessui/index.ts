import { Imago } from '../Imago';
import { tabs } from './Tabs';

export const HeadlessUI = Imago.configure()
  .use(tabs);
