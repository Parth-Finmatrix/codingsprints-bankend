import { ErrorCode } from '../constants/error-code.enum';
import { HttpStatusCode } from '../constants/http.status.contant';

export type RpcErrorPayload = {
  code: ErrorCode;
  message: string;
  details?: any;
  httpStatus: HttpStatusCode;
};
