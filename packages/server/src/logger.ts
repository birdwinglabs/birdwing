import { consola } from 'consola';
import { colorize, ColorName } from 'consola/utils';
import ora, { Ora } from 'ora';


export class Logger {
  private spinner: Ora;

  constructor() {
    this.spinner = ora({ indent: 2 });
  }

  static color(color: ColorName, text: string | number) {
    return colorize(color, text);
  }

  info(message: string, ...args: any[]) {
    console.log(message, ...args);
  }

  start(message: string) {
    this.spinner.start(message);
  }

  success(message: string, ...args: any[]) {
    if (this.spinner.isSpinning) {
      this.spinner.succeed(message);
    } else {
      consola.success(message, ...args);
    }
  }

  warn(message: string, ...args: any[]) {
    if (this.spinner.isSpinning) {
      this.spinner.warn(message);
    } else {
      consola.warn(message, ...args);
    }
  }

  error(message: string, ...args: any[]) {
    if (this.spinner.isSpinning) {
      this.spinner.fail(message);
    } else {
      consola.error(message, ...args);
    }
  }

  box(message: string, ...args: any[]) {
    consola.box(message, ...args);
  }

  update(message: string) {
    this.spinner.text = message;
  }

  get text() {
    return this.spinner.text;
  }
}
