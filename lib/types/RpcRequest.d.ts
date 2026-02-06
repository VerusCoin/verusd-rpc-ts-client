import { ApiPrimitive, RequestParams } from "verus-typescript-primitives";
export interface RpcRequestBody<T = any> {
    jsonrpc: string;
    id: T;
    method: string;
    params?: RequestParams;
}
export interface RpcError<D = any> {
    code: number;
    message: string;
    data?: D;
}
export interface RpcRequestResultSuccess<D = ApiPrimitive, T = any> {
    id: T;
    result: D;
    error: null;
}
export interface RpcRequestResultError<T = any> {
    id: T;
    result: null;
    error: RpcError;
}
export type RpcRequestResult<D = ApiPrimitive, T = any> = RpcRequestResultSuccess<D, T> | RpcRequestResultError<T>;
