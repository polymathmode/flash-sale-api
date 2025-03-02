// const ApiError=(statusCode: number, message: string): Error =>{
//     const error = new Error(message) as Error & { statusCode: number };
//     error.statusCode = statusCode;
//     Error.captureStackTrace(error, ApiError);
//     return error;
//   }
  
//   export default ApiError;

class ApiError extends Error {
  statusCode: number;

  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
    Error.captureStackTrace(this, this.constructor);
  }
}

export default ApiError;
  