import { Primitives, VerusdRpcInterface } from "../index";
import { RPCRequestOverride } from "../VerusdRpcInterface";
import { RpcRequestBody } from "../types/RpcRequest";

describe("Public primitives integration", () => {
  test("forwards an MMR signing envelope through the client without changing its fields", async () => {
    const address = "iJhCezBExJHvtyH3fGhNnt2NhU4Ztkf2yq";
    const salts = [Buffer.alloc(32, 1), Buffer.alloc(32, 2)];
    const envelope = new Primitives.PartialSignData({
      address: Primitives.IdentityID.fromAddress(address),
      hashType: Primitives.HASH_TYPE_SHA256,
      createMMR: true,
      dataType: Primitives.DATA_TYPE_MMRDATA,
      data: new Primitives.PartialMMRData({
        data: [
          { type: Primitives.DATA_TYPE_HEX, data: Buffer.from("0001ff", "hex") },
          { type: Primitives.DATA_TYPE_MESSAGE, data: Buffer.from("hello", "utf8") },
        ],
        salt: salts,
        mmrhashtype: Primitives.HASH_TYPE_BLAKE2B,
      }),
    });
    const requests: RpcRequestBody<number>[] = [];
    const transport: RPCRequestOverride = async (body) => {
      requests.push(body);
      return {
        id: body.id,
        result: null,
        error: { code: -32603, message: "Request captured by test transport" },
      };
    };
    const client = new VerusdRpcInterface("VRSC", "http://unused.invalid", undefined, transport);

    const signable = envelope.toCLIJson();
    if (!("mmrdata" in signable) || !signable.mmrdata) {
      throw new Error("Expected an MMR signing request");
    }
    // RPC types describe vdxfdata as a string; this fixture uses hex and text.
    const { vdxfdata, ...data } = signable;
    const mmrdata = signable.mmrdata.map((item) => {
      if ("vdxfdata" in item) throw new Error("Unexpected VDXF fixture item");
      return item;
    });
    await client.signData({ ...data, mmrdata });

    expect(requests).toStrictEqual([
      {
        jsonrpc: "1.0",
        id: 0,
        method: "signdata",
        params: [{
          address,
          hashtype: "sha256",
          createmmr: true,
          mmrdata: [{ serializedhex: "0001ff" }, { message: "hello" }],
          mmrsalt: ["01".repeat(32), "02".repeat(32)],
          mmrhashtype: "blake2b",
        }],
      },
    ]);
  });

  test("exports upload hashing helpers with raw digest byte order", () => {
    const leaf = Primitives.hashData(Buffer.from("abc", "utf8"), Primitives.EHashTypes.HASH_SHA256);
    const root = Primitives.getMMRRoot([leaf]);

    expect(leaf.toString("hex")).toBe("ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad");
    expect(root).toEqual(leaf);
  });
});
