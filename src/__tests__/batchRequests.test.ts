import { createHash } from "crypto";
import { InternalAxiosRequestConfig } from "axios";
import {
  APIAuthData,
  Primitives,
  RPCBatchRequestOverride,
  RPCRequestOverride,
  RpcBatchRequestResult,
  RpcRequestBody,
  VerusdRpcInterface,
} from "../index";

function createClient(data: unknown, status = 200, auth?: APIAuthData) {
  const requests: InternalAxiosRequestConfig[] = [];
  const client = new VerusdRpcInterface("VRSC", "http://unused.invalid", {
    adapter: async (config) => {
      requests.push(config);
      return { data, status, statusText: "", headers: {}, config };
    },
  }, undefined, auth);

  return { client, requests };
}

function getBlockCount() {
  return new Primitives.GetBlockCountRequest("VRSC");
}

describe("Batched RPC requests", () => {
  test("sends one array and preserves ordered mixed results without response IDs", async () => {
    const response = [
      { result: 123 },
      { error: { code: -5, message: "Identity not found" } },
      { result: null },
    ];
    const { client, requests } = createClient(response);

    const result = await client.request<number | null>([
      getBlockCount(),
      new Primitives.GetIdentityRequest("VRSC", "missing@"),
      new Primitives.GetTxOutRequest("VRSC", "ab".repeat(32), 0),
    ]);

    expect(result).toBe(response);
    expect(requests).toHaveLength(1);
    expect(requests[0].url).toBe("/");
    expect(requests[0].method).toBe("post");
    expect(requests[0].headers.get("X-VRPC-API-Version")).toBe("2");
    expect(JSON.parse(requests[0].data)).toStrictEqual([
      { jsonrpc: "1.0", id: 0, method: "getblockcount", params: [] },
      { jsonrpc: "1.0", id: 1, method: "getidentity", params: ["missing@"] },
      { jsonrpc: "1.0", id: 2, method: "gettxout", params: ["ab".repeat(32), 0] },
    ]);
  });

  test("keeps singleton batches as arrays", async () => {
    const response = [{ result: 123 }];
    const { client, requests } = createClient(response);

    await expect(client.request<number>([getBlockCount()])).resolves.toBe(response);
    expect(JSON.parse(requests[0].data)).toStrictEqual([
      { jsonrpc: "1.0", id: 0, method: "getblockcount", params: [] },
    ]);
  });

  test("shares IDs with single requests and preserves optional parameter slots", async () => {
    const { client, requests } = createClient({ result: 123 });

    await client.getBlockCount();
    await client.request([
      new Primitives.GetIdentityRequest("VRSC", "alice@", undefined, false, 0),
      new Primitives.GetCurrencyStateRequest("VRSC", "basket", undefined, "VRSC"),
    ]);
    await client.getBlockCount();

    expect(requests.map(request => JSON.parse(request.data))).toStrictEqual([
      { jsonrpc: "1.0", id: 0, method: "getblockcount", params: [] },
      [
        { jsonrpc: "1.0", id: 1, method: "getidentity", params: ["alice@", null, false, 0] },
        { jsonrpc: "1.0", id: 2, method: "getcurrencystate", params: ["basket", "", "VRSC"] },
      ],
      { jsonrpc: "1.0", id: 3, method: "getblockcount", params: [] },
    ]);
  });

  test.each([
    { count: 0, message: "Batch must not be empty" },
    { count: 1, message: "Batching is disabled" },
    { count: 21, message: "Batch exceeds the maximum size" },
  ])("preserves a whole-batch HTTP 200 rejection for $count requests", async ({ count, message }) => {
    const response = { error: { code: -32600, message } };
    const { client, requests } = createClient(response);

    await expect(client.request(Array.from({ length: count }, getBlockCount))).resolves.toBe(response);
    expect(requests).toHaveLength(1);
    expect(JSON.parse(requests[0].data)).toHaveLength(count);
  });

  test("authenticates the exact complete serialized array once", async () => {
    const auth = { id: "batch-test-app", key: "batch-test-key" };
    const { client, requests } = createClient([{ result: 123 }, { result: 123 }], 200, auth);

    await client.request([getBlockCount(), getBlockCount()]);

    expect(requests).toHaveLength(1);
    const { data, headers } = requests[0];
    const timestamp = String(headers.get("X-Timestamp"));
    const salt = String(headers.get("X-Salt"));
    expect(headers.get("X-App-ID")).toBe(auth.id);
    expect(headers.get("X-VRPC-API-Version")).toBe("2");
    expect(salt).toMatch(/^[0-9a-f]{64}$/);
    expect(JSON.parse(data)).toHaveLength(2);

    const expectedToken = createHash("blake2b512")
      .update(timestamp)
      .update(auth.key)
      .update(data)
      .update(auth.id)
      .update("2")
      .update(salt, "hex")
      .digest("hex");
    expect(headers.get("X-Auth-Token")).toBe(expectedToken);
  });

  test("returns one envelope error for a non-200 response without retrying", async () => {
    const response = { error: "Busy" };
    const { client, requests } = createClient(response, 429);

    await expect(client.request([getBlockCount(), getBlockCount()])).resolves.toStrictEqual({
      id: null,
      result: null,
      error: { code: 429, message: "Network error 429", data: response },
    });
    expect(requests).toHaveLength(1);
  });

  test("returns one envelope error on transport failure without retrying", async () => {
    const adapter = jest.fn(async () => {
      throw new Error("Connection lost");
    });
    const client = new VerusdRpcInterface("VRSC", "http://unused.invalid", { adapter });

    await expect(client.request([getBlockCount(), getBlockCount()])).resolves.toStrictEqual({
      id: null,
      result: null,
      error: { code: -32603, message: "Connection lost" },
    });
    expect(adapter).toHaveBeenCalledTimes(1);
  });

  test("routes batch and single calls to their respective explicit overrides", async () => {
    const singles: RpcRequestBody<number>[] = [];
    const batches: RpcRequestBody<number>[][] = [];
    const singleResponse = { id: 0, result: null, error: { code: -5, message: "Single error" } };
    const batchResponse: RpcBatchRequestResult<never> = [
      { id: 1, result: null, error: { code: -5, message: "Batch error" } },
    ];
    const singleOverride: RPCRequestOverride = async body => {
      singles.push(body);
      return singleResponse;
    };
    const batchOverride: RPCBatchRequestOverride = async bodies => {
      batches.push(bodies);
      return batchResponse;
    };
    const client = new VerusdRpcInterface(
      "VRSC", "http://unused.invalid", undefined, singleOverride, undefined, batchOverride
    );

    await expect(client.getBlockCount()).resolves.toBe(singleResponse);
    await expect(client.request([getBlockCount()])).resolves.toBe(batchResponse);
    expect(singles).toStrictEqual([
      { jsonrpc: "1.0", id: 0, method: "getblockcount", params: [] },
    ]);
    expect(batches).toStrictEqual([[
      { jsonrpc: "1.0", id: 1, method: "getblockcount", params: [] },
    ]]);
  });

  test("does not fall back to a single-request override for batches", async () => {
    const singleOverride = jest.fn(async (body: RpcRequestBody<number>) => ({
      id: body.id,
      result: null,
      error: { code: -5, message: "Single error" },
    }));
    const client = new VerusdRpcInterface("VRSC", "http://unused.invalid", undefined, singleOverride);

    await expect(client.request([getBlockCount(), getBlockCount()])).rejects.toThrow(
      "Batch requests require an rpcBatchRequest override"
    );
    expect(singleOverride).not.toHaveBeenCalled();
  });
});
