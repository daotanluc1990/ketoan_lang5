export type DataRow = Record<string, unknown>;

export type RollbackPatchResult = {
  sheetName: string;
  matchedRows: number;
  updatedRows: number;
};

export type DataStore = {
  read(sheetName: string): Promise<DataRow[]>;
  append(sheetName: string, rows: DataRow[]): Promise<void>;
  replace(sheetName: string, rows: DataRow[]): Promise<void>;
  markRowsByImportId?(input: {
    sheetName: string;
    maLanImport: string;
    actor: string;
    reason: string;
  }): Promise<RollbackPatchResult>;
};
