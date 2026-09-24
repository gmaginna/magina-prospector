import fs from "node:fs";
import { google, type sheets_v4 } from "googleapis";
import type { Env } from "../config/env.js";

export class SheetsClient {
  readonly api: sheets_v4.Sheets;

  private constructor(
    private readonly spreadsheetId: string,
    api: sheets_v4.Sheets,
    private readonly auth: InstanceType<typeof google.auth.GoogleAuth>,
  ) {
    this.api = api;
  }

  static async create(env: Env): Promise<SheetsClient> {
    const credentials = env.GOOGLE_SERVICE_ACCOUNT_JSON_B64
      ? JSON.parse(Buffer.from(env.GOOGLE_SERVICE_ACCOUNT_JSON_B64, "base64").toString("utf8"))
      : JSON.parse(fs.readFileSync(env.GOOGLE_SERVICE_ACCOUNT_FILE!, "utf8"));
    const auth = new google.auth.GoogleAuth({ credentials, scopes: ["https://www.googleapis.com/auth/spreadsheets"] });
    return new SheetsClient(env.GOOGLE_SHEET_ID, google.sheets({ version: "v4", auth }), auth);
  }

  get id(): string { return this.spreadsheetId; }

  async verifyAuthentication(): Promise<void> {
    try {
      const token = await this.auth.getAccessToken();
      if (!token) throw new Error("No access token returned");
    } catch {
      throw new Error("Google authentication failed. Confira as credenciais da service account e a ativação da Google Sheets API.");
    }
  }

  async metadata() {
    const response = await this.api.spreadsheets.get({
      spreadsheetId: this.spreadsheetId,
      fields: "properties(title),sheets(properties(sheetId,title,gridProperties(rowCount,columnCount)))",
    });
    return response.data;
  }

  async read(range: string, valueRenderOption: "FORMATTED_VALUE" | "FORMULA" = "FORMATTED_VALUE"): Promise<string[][]> {
    const response = await this.api.spreadsheets.values.get({ spreadsheetId: this.spreadsheetId, range, valueRenderOption });
    return (response.data.values ?? []) as string[][];
  }

  async readMany(ranges: string[]): Promise<Map<string, string[][]>> {
    const response = await this.api.spreadsheets.values.batchGet({ spreadsheetId: this.spreadsheetId, ranges });
    return new Map((response.data.valueRanges ?? []).map((item) => [item.range ?? "", (item.values ?? []) as string[][]]));
  }

  async write(range: string, values: unknown[][]): Promise<void> {
    await this.api.spreadsheets.values.update({
      spreadsheetId: this.spreadsheetId, range, valueInputOption: "RAW", requestBody: { values },
    });
  }

  async batchWrite(data: Array<{ range: string; values: unknown[][] }>): Promise<void> {
    if (!data.length) return;
    await this.api.spreadsheets.values.batchUpdate({
      spreadsheetId: this.spreadsheetId, requestBody: {
        valueInputOption: "RAW", data: data.map((item) => ({ range: item.range, values: item.values })),
      },
    });
  }

  async append(range: string, values: unknown[][]): Promise<void> {
    if (!values.length) return;
    await this.api.spreadsheets.values.append({
      spreadsheetId: this.spreadsheetId, range, valueInputOption: "RAW", insertDataOption: "INSERT_ROWS", requestBody: { values },
    });
  }
}

export function quoteSheet(name: string): string {
  return `'${name.replaceAll("'", "''")}'`;
}
