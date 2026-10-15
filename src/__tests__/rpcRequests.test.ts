import { VerusdRpcInterface } from "../index";
import { RPCRequestOverride } from "../VerusdRpcInterface";
import { RpcRequestBody, RpcRequestResult } from "../types/RpcRequest";

function createClient(response?: RpcRequestResult<unknown>) {
  const requests: RpcRequestBody<number>[] = [];
  const rpcRequest: RPCRequestOverride = async <D>(body: RpcRequestBody<number>) => {
    requests.push(body);
    if (response) return response as RpcRequestResult<D>;
    return {
      id: body.id,
      result: null,
      error: { code: -32603, message: "Request captured by test transport" },
    };
  };

  return {
    client: new VerusdRpcInterface("VRSC", "http://unused.invalid", undefined, rpcRequest),
    requests,
  };
}

describe("Public RPC request contracts", () => {
  test("getIdentity trims trailing omissions and preserves middle slots", async () => {
    const { client, requests } = createClient();

    await client.getIdentity("alice@");
    await client.getIdentity("alice@", undefined, false, 0);

    expect(requests).toStrictEqual([
      { jsonrpc: "1.0", id: 0, method: "getidentity", params: ["alice@"] },
      { jsonrpc: "1.0", id: 1, method: "getidentity", params: ["alice@", null, false, 0] },
    ]);
  });

  test("getIdentityContent keeps a trailing content key in its daemon slot", async () => {
    const { client, requests } = createClient();

    await client.getIdentityContent("alice@");
    await client.getIdentityContent("alice@", undefined, undefined, false, undefined, "content-key");

    expect(requests.map(({ method, params }) => ({ method, params }))).toStrictEqual([
      { method: "getidentitycontent", params: ["alice@"] },
      { method: "getidentitycontent", params: ["alice@", null, null, false, null, "content-key"] },
    ]);
  });

  test("getIdentityHistory preserves optional positions with proxy-compatible defaults", async () => {
    const { client, requests } = createClient();

    await client.getIdentityHistory("alice@");
    await client.getIdentityHistory("alice@", undefined, 75);
    await client.getIdentityHistory("alice@", 0, -1, false, 0);
    await client.getIdentityHistory("alice@", undefined, undefined, undefined, 100);

    expect(requests.map(({ method, params }) => ({ method, params }))).toStrictEqual([
      { method: "getidentityhistory", params: ["alice@"] },
      { method: "getidentityhistory", params: ["alice@", 0, 75] },
      { method: "getidentityhistory", params: ["alice@", 0, -1, false, 0] },
      { method: "getidentityhistory", params: ["alice@", 0, 0, false, 100] },
    ]);
  });

  test("getCurrencyState forwards historical selectors and defaults an omitted conversion height", async () => {
    const { client, requests } = createClient();

    await client.getCurrencyState("basket");
    await client.getCurrencyState("basket", 100);
    await client.getCurrencyState("basket", "100,200,10", "VRSC");
    await client.getCurrencyState("basket", undefined, "VRSC");

    expect(requests.map(({ method, params }) => ({ method, params }))).toStrictEqual([
      { method: "getcurrencystate", params: ["basket"] },
      { method: "getcurrencystate", params: ["basket", "100"] },
      { method: "getcurrencystate", params: ["basket", "100,200,10", "VRSC"] },
      { method: "getcurrencystate", params: ["basket", "", "VRSC"] },
    ]);
  });

  test("getCurrencyState distinguishes numeric zero from an explicit string zero height", async () => {
    const { client, requests } = createClient();

    await client.getCurrencyState("basket", 0);
    await client.getCurrencyState("basket", "0");

    expect(requests.map(({ params }) => params)).toStrictEqual([
      ["basket", ""],
      ["basket", "0"],
    ]);
  });

  test("getTxOut preserves output zero and an explicit false mempool flag", async () => {
    const { client, requests } = createClient();
    const txid = "ab".repeat(32);

    await client.getTxOut(txid, 0);
    await client.getTxOut(txid, 0, false);

    expect(requests).toStrictEqual([
      { jsonrpc: "1.0", id: 0, method: "gettxout", params: [txid, 0] },
      { jsonrpc: "1.0", id: 1, method: "gettxout", params: [txid, 0, false] },
    ]);
  });

  test("getTxOut returns a successful null result for an unavailable output", async () => {
    const response = { id: 0, result: null, error: null };
    const { client } = createClient(response);

    await expect(client.getTxOut("ab".repeat(32), 0)).resolves.toBe(response);
  });

  test("registration reads preserve RPC errors", async () => {
    const response = {
      id: 0,
      result: null,
      error: { code: -5, message: "Lookup unavailable", data: { retry: false } },
    };
    const { client } = createClient(response);

    await expect(client.getIdentityHistory("alice@")).resolves.toBe(response);
    await expect(client.getCurrencyState("basket")).resolves.toBe(response);
    await expect(client.getTxOut("ab".repeat(32), 0)).resolves.toBe(response);
  });

  test("signRawTransaction distinguishes omitted private keys from an explicit empty list", async () => {
    const { client, requests } = createClient();

    await client.signRawTransaction("00");
    await client.signRawTransaction("00", undefined, "ALL", "76b809bb");
    await client.signRawTransaction("00", undefined, "ALL", "76b809bb", []);

    expect(requests.map(({ method, params }) => ({ method, params }))).toStrictEqual([
      { method: "signrawtransaction", params: ["00"] },
      { method: "signrawtransaction", params: ["00", null, null, "ALL", "76b809bb"] },
      { method: "signrawtransaction", params: ["00", null, [], "ALL", "76b809bb"] },
    ]);
  });

  test("fundRawTransaction accepts hex alone and a complete explicit funding request", async () => {
    const { client, requests } = createClient();
    const utxos = [{ txid: "ab".repeat(32), voutnum: 1 }];

    await client.fundRawTransaction("00");
    await client.fundRawTransaction("00", utxos, "alice@", 0);

    expect(requests.map(({ method, params }) => ({ method, params }))).toStrictEqual([
      { method: "fundrawtransaction", params: ["00"] },
      { method: "fundrawtransaction", params: ["00", utxos, "alice@", 0] },
    ]);
  });

  const invalidFundingRequests: Array<{
    name: string;
    args: Parameters<VerusdRpcInterface["fundRawTransaction"]>;
    message: string;
  }> = [
    {
      name: "UTXOs without a change address",
      args: ["00", []],
      message: "changeaddr is required when utxos are provided",
    },
    {
      name: "a change address without UTXOs",
      args: ["00", undefined, "alice@"],
      message: "utxos are required when changeaddr or explicitfee is provided",
    },
    {
      name: "an explicit zero fee without UTXOs",
      args: ["00", undefined, undefined, 0],
      message: "utxos are required when changeaddr or explicitfee is provided",
    },
  ];

  test.each(invalidFundingRequests)("fundRawTransaction rejects $name before transport", async ({ args, message }) => {
    const { client, requests } = createClient();

    await expect(client.fundRawTransaction(...args)).rejects.toThrow(message);
    expect(requests).toStrictEqual([]);
  });

  test.each([true, false])("sendCurrency preserves returntxtemplate=%s with a default fee", async (returntxtemplate) => {
    const { client, requests } = createClient();
    const outputs = [{ currency: "VRSC", amount: 1, address: "alice@" }];

    await client.sendCurrency("bob@", outputs, undefined, undefined, returntxtemplate);

    expect(requests[0]).toStrictEqual({
      jsonrpc: "1.0",
      id: 0,
      method: "sendcurrency",
      params: ["bob@", outputs, null, 0, returntxtemplate],
    });
  });

  test("updateIdentity preserves optional slots and defaults the fee for sourceoffunds", async () => {
    const { client, requests } = createClient();
    const identity = { name: "alice" };

    await client.updateIdentity(identity);
    await client.updateIdentity(identity, undefined, false, undefined, "bob@");

    expect(requests.map(({ method, params }) => ({ method, params }))).toStrictEqual([
      { method: "updateidentity", params: [identity] },
      { method: "updateidentity", params: [identity, null, false, 0, "bob@"] },
    ]);
  });

  test("signData forwards supported nested serialized data and mimetype fields", async () => {
    const { client, requests } = createClient();
    const data: Parameters<VerusdRpcInterface["signData"]>[0] = {
      address: "alice@",
      messagehex: "01",
      mmrdata: [
        { serializedhex: "00", mimetype: "application/octet-stream", label: "Example" },
        { serializedbase64: "aGk=", mimetype: "text/plain" },
      ],
    };

    await client.signData(data);

    expect(requests[0]).toStrictEqual({
      jsonrpc: "1.0",
      id: 0,
      method: "signdata",
      params: [{
        address: "alice@",
        messagehex: "01",
        mmrdata: [
          { serializedhex: "00", mimetype: "application/octet-stream", label: "Example" },
          { serializedbase64: "aGk=", mimetype: "text/plain" },
        ],
      }],
    });
  });
});
