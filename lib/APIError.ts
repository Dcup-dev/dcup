export class APIError extends Error {
  public code: string;
  public status: number;

  constructor({code,status,message}:{code: string, status: number, message: string}) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

