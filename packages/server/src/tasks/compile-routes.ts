import { Aetlan } from '@aetlan/aetlan';
import { Route } from '@aetlan/core';
import { Task } from '../command.js';


export class CompileRoutesTask extends Task<Route[]> {
  constructor(private aetlan: Aetlan) { 
    super({
      start: 'Compiling routes...',
      success: routes => `Compiled ${routes.length} routes`
    });
  }

  async *execute() {
    try {
      return await this.aetlan.compile();
    } catch (err) {
      throw new Error('Compiling routes failed');
    }
  }
}
