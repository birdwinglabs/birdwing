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
    this.logger.start(task.name);

    const warnings: TaskWarning[] = [];

    try {
      const gen = task.execute();
      while (true) {
        let it = await gen.next();

        if (it.done) {
          if (warnings.length > 0) {
            this.logger.warn(Logger.color('yellow', task.complete(it.value, warnings)));
            for (const { message, args } of warnings) {
              this.logger.warn(message, ...args);
            }
          } else {
            this.logger.success(task.complete(it.value, warnings));
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
      this.logger.error(err.message);
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

export abstract class Task<T> {
  complete: (result: T, warnings: TaskWarning[]) => string;

  constructor(public readonly name: string, complete: string | ((result: T, warnings: TaskWarning[]) => string)) {
    this.complete = typeof complete === 'string' ? () => complete : complete;
  }

  abstract execute(): AsyncGenerator<TaskProgress | TaskWarning, T>;
}
