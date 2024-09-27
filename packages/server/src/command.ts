import { AppConfig } from "@aetlan/core";
import { Logger } from "./logger.js";


export abstract class Command {
  constructor(
    protected root: string,
    protected logger: Logger,
    protected config: AppConfig
  ) {}

  abstract execute(): Promise<void>;

  async executeTask<T>(task: Task<T>): Promise<T> {
    this.logger.start(task.messageStart);

    const warnings: TaskWarning[] = [];

    try {
      const gen = task.execute();
      while (true) {
        let it = await gen.next();

        if (it.done) {
          if (warnings.length > 0) {
            const msg = task.messageWarnings
              ? task.messageWarnings(it.value, warnings)
              : task.messageSuccess(it.value);

            this.logger.warn(Logger.color('yellow', msg));
            for (const { message, args } of warnings) {
              this.logger.warn(message, ...args);
            }
          } else {
            this.logger.success(task.messageSuccess(it.value));
          }
          return it.value;
        } else {
          this.logger.update(it.value.message);
          if (it.value instanceof TaskWarning) {
            warnings.push(it.value);
          }
        }
      }
    } catch (err) {
      if (task.messageFail) {
        this.logger.error(task.messageFail(err));
      } else {
        this.logger.error(err.message);
      }
      throw err;
    }
  }
}

export class TaskProgress {
  constructor(public readonly message: string) {}
}

export class TaskWarning {
  args: any[];

  constructor(public readonly message: string, ...args: any[]) {
    this.args = args;
  }
}

export interface TaskResult<T> {
  message: string;

  value: T;
}

export interface TaskConfig<T> {
  start: string;
  success: ((result: T) => string) | string;
  warnings?: ((result: T, warnings: TaskWarning[]) => string) | string;
  fail?: string | ((err: Error) => string);
}

export abstract class Task<T> {
  messageStart: string;
  messageSuccess: (result: T) => string;
  messageWarnings: ((result: T, warnings: TaskWarning[]) => string) | undefined;
  messageFail: ((err: Error) => string) | undefined = undefined;

  constructor({ start, success, warnings, fail }: TaskConfig<T>) {
    this.messageStart = start;
    this.messageSuccess = typeof success === 'string' ? () => success : success;
    if (warnings) {
      this.messageWarnings = typeof warnings === 'string' ? () => warnings : warnings;
    }
    if (fail) {
      this.messageFail = typeof fail === 'string' ? () => fail : fail;
    }
  }

  abstract execute(): AsyncGenerator<TaskProgress | TaskWarning, T>;
}
