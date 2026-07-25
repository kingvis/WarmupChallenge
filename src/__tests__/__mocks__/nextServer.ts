/**
 * Mock for next/server so API route tests run in Jest (Node env)
 * without requiring the full Next.js runtime.
 */

export class NextResponse {
  private _body: string;
  public status: number;
  public headers: Headers;

  constructor(body: string, init?: { status?: number; headers?: Record<string, string> }) {
    this._body = body;
    this.status = init?.status ?? 200;
    this.headers = new Headers(init?.headers);
  }

  async json() {
    return JSON.parse(this._body);
  }

  static json(data: unknown, init?: { status?: number; headers?: Record<string, string> }) {
    return new NextResponse(JSON.stringify(data), init);
  }
}
