import { VerusdRpcInterface } from "../index";
import { RPCRequestOverride } from "../VerusdRpcInterface";
import { RpcRequestBody } from "../types/RpcRequest";

function createClient() {
  const requests: RpcRequestBody<number>[] = [];
  const rpcRequest: RPCRequestOverride = async (body) => {
    requests.push(body);
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
