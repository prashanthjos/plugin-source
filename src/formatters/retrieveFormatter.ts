/*
 * Copyright (c) 2022, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import { yellow } from 'chalk';
import { Logger, Messages, SfError } from '@salesforce/core';
import { get } from '@salesforce/ts-types';
import {
  MetadataApiRetrieveStatus,
  RequestStatus,
  RetrieveMessage,
  RetrieveResult,
} from '@salesforce/source-deploy-retrieve';
import { UX } from '@salesforce/command';
import { ensureArray } from '@salesforce/kit';
import { ResultFormatter, ResultFormatterOptions } from './resultFormatter';

Messages.importMessagesDirectory(__dirname);

export abstract class RetrieveFormatter extends ResultFormatter {
  protected warnings: RetrieveMessage[];
  protected result: MetadataApiRetrieveStatus;
  protected messages = Messages.loadMessages('@salesforce/plugin-source', 'retrieve');

  public constructor(logger: Logger, ux: UX, public options: ResultFormatterOptions, result: RetrieveResult) {
    super(logger, ux, options);
    // zipFile can become massive and unwieldy with JSON parsing/terminal output and, isn't useful
    delete result.response.zipFile;
    this.result = result.response;

    // grab warnings
    this.warnings = ensureArray(result?.response?.messages ?? []);
  }

  protected hasStatus(status: RequestStatus): boolean {
    return this.result?.status === status;
  }

  protected displayWarnings(): void {
    this.ux.styledHeader(yellow(this.messages.getMessage('retrievedSourceWarningsHeader')));
    this.ux.table(this.warnings, { fileName: { header: 'FILE NAME' }, problem: { header: 'PROBLEM' } });
    this.ux.log();
  }

  protected displayErrors(): void {
    // an invalid packagename retrieval will end up with a message in the `errorMessage` entry
    const errorMessage = get(this.result, 'errorMessage') as string;
    if (errorMessage) {
      throw new SfError(errorMessage);
    }
    const unknownMsg: RetrieveMessage[] = [{ fileName: 'unknown', problem: 'unknown' }];
    const responseMsgs = get(this.result, 'messages', unknownMsg) as RetrieveMessage | RetrieveMessage[];
    const errMsgs = ensureArray(responseMsgs);
    const errMsgsForDisplay = errMsgs.reduce<string>((p, c) => `${p}\n${c.fileName}: ${c.problem}`, '');
    this.ux.log(`Retrieve Failed due to: ${errMsgsForDisplay}`);
  }
}
