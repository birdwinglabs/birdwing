import { Compiler } from '../../../compiler/dist/index.js';
import { Route } from '@aetlan/core';
import { Task } from '../command.js';


export class CompileRoutesTask extends Task<Route[]> {
  constructor(private compiler: Compiler) { 
    super({
      start: 'Compiling routes...',
      success: routes => `Compiled ${routes.length} routes`
    });
  }

  async *execute() {
    try {
      return await this.compiler.transform();
    } catch (err) {
      throw new Error('Compiling routes failed');
    }
  }
}
