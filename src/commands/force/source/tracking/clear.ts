/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import { flags, FlagsConfig, SfdxCommand } from '@salesforce/command';
import { Messages } from '@salesforce/core';
import * as chalk from 'chalk';
import { SourceTracking, throwIfInvalid } from '@salesforce/source-tracking';

Messages.importMessagesDirectory(__dirname);
const messages = Messages.loadMessages('@salesforce/plugin-source', 'tracking');

export type SourceTrackingClearResult = {
  clearedFiles: string[];
};

export class Clear extends SfdxCommand {
  public static aliases = ['force:source:beta:tracking:clear'];
  public static readonly description = messages.getMessage('clearDescription');
  public static readonly requiresProject = true;
  public static readonly requiresUsername = true;

  public static readonly flagsConfig: FlagsConfig = {
    noprompt: flags.boolean({
      char: 'p',
      description: messages.getMessage('nopromptDescription'),
      required: false,
    }),
  };

  public async run(): Promise<SourceTrackingClearResult> {
    throwIfInvalid({
      org: this.org,
      projectPath: this.project.getPath(),
      toValidate: 'plugin-source',
      command: 'force:source:tracking:clear',
    });
    let clearedFiles: string[] = [];
    if (this.flags.noprompt || (await this.ux.confirm(chalk.dim(messages.getMessage('promptMessage'))))) {
      const sourceTracking = await SourceTracking.create({
        project: this.project,
        org: this.org,
      });
      clearedFiles = await Promise.all([sourceTracking.clearLocalTracking(), sourceTracking.clearRemoteTracking()]);
      this.ux.log('Cleared local tracking files.');
    }
    return { clearedFiles };
  }
}
