import { VerusdRpcInterface } from '../../index'

const { RPC_USER, RPC_PASSWORD, RPC_PORT } = require('../../fixtures/conf')

jest.setTimeout(10000)

describe('Makes live API Verusd RPC calls', () => {
  const verusd = new VerusdRpcInterface("iJhCezBExJHvtyH3fGhNnt2NhU4Ztkf2yq", `http://localhost:${RPC_PORT}`, {
    auth: {
      username: RPC_USER,
      password: RPC_PASSWORD
    },
  });

  test('getaddressbalance', async () => {
    expect(
      !!(
        await verusd.getAddressBalance({
          addresses: ["mike@"],
          friendlynames: true,
        })
      ).error
    ).toBe(false);
  });

  test('getaddressutxos', async () => {
    expect(
      !!(
        await verusd.getAddressUtxos({
          addresses: ["mike@"],
          friendlynames: true
        })
      ).error
    ).toBe(false);
  });

  test('getaddressdeltas', async () => {
    expect(
      !!(
        await verusd.getAddressDeltas({
          addresses: ["mike@"],
          friendlynames: true,
          verbosity: 1
        })
      ).error
    ).toBe(false);
  });

  test('getaddressmempool', async () => {
    expect(
      !!(
        await verusd.getAddressMempool({
          addresses: ["mike@"],
          friendlynames: true,
          verbosity: 1
        })
      ).error
    ).toBe(false);
  });

  test("getblock", async () => {
    expect(!!(await verusd.getBlock("1")).error).toBe(false);
  });

  test("getblockcount", async () => {
    const res = await verusd.getBlockCount();
    expect(!!res.error).toBe(false);
    expect(res.result).toBeGreaterThanOrEqual(0);
  });

  test('getidentity', async () => {
    expect(
      !!(
        await verusd.getIdentity("mike@")
      ).error
    ).toBe(false);
  });

  test('getidentitycontent', async () => {
    expect(
      !!(
        await verusd.getIdentityContent("mike@")
      ).error
    ).toBe(false);
  });

  test('getinfo', async () => {
    expect(
      !!(
        await verusd.getInfo()
      ).error
    ).toBe(false);
  });

  test('getoffers', async () => {
    expect(
      !!(
        await verusd.getOffers("mike@")
      ).error
    ).toBe(false);
  });

  test('getrawtransaction', async () => {
    expect(
      !!(
        await verusd.getRawTransaction(
          "db97193d1a91f047cb14aa32a975be2e953924e1f4f0747cc20981edef6f4c28"
        )
      ).error
    ).toBe(false);
  });

  test("getcurrency", async () => {
    expect(!!(await verusd.getCurrency("VRSCTEST")).error).toBe(false);
  });

  test("getvdxfid", async () => {
    expect(!!(await verusd.getVdxfId("test")).error).toBe(false);
  });

  test("getcurrencyconverters", async () => {
    expect(!!(await verusd.getCurrencyConverters(["VRSCTEST"])).error).toBe(false);
  });

  test("listcurrencies", async () => {
    expect(!!(await verusd.listCurrencies()).error).toBe(false);
  });

  test("estimateconversion", async () => {
    expect(!!(await verusd.estimateConversion({
      "currency": "VRSCTEST",
      "convertto": "USD",
      "via": "VRSC-USD", 
      "amount": 10
    })).error).toBe(false);
  });

  test("signdata", async () => {
    expect(!!(await verusd.signData({
      address: "t10@",
      datahash: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
    })).error).toBe(false);
  });

  test("updateidentity", async () => {
    expect(!!(await verusd.updateIdentity({ "name": "t10" }, true)).error).toBe(false);
  });

  test("getcurrencyconversionpaths", async () => {
    const VRSCTEST = (await verusd.getCurrency("VRSCTEST")).result
    const paths = await verusd.getCurrencyConversionPaths(VRSCTEST!)

    expect(paths).toBeDefined()
  });

  test("z_getoperationstatus", async () => {
    expect(
      !!(
        await verusd.zGetOperationStatus()
      ).error
    ).toBe(false);
  });

  describe("identity registration reads", () => {
    const chain = "iJhCezBExJHvtyH3fGhNnt2NhU4Ztkf2yq";
    // VRSCTEST's root identity was registered at height 235. Its historical
    // reservation provides a zero-value unspent output for these checks.
    const registrationTxid = "f077b510957a4193a4790f19d4991bc9cb3dd37826691fe60c12e6a340a145b2";
    const commitmentTxid = "2edf9c38320efb48151428b2bece7b81439f17e52d8fceefcd5b0237511c41d8";

    test("getidentityhistory with default options", async () => {
      const response = await verusd.getIdentityHistory(chain);

      expect(response.error).toBeNull();
      expect(response.result?.fullyqualifiedname).toBe("VRSCTEST@");
      expect(response.result?.history).toEqual(expect.arrayContaining([
        expect.objectContaining({
          height: 235,
          identity: expect.objectContaining({ identityaddress: chain }),
          output: { txid: registrationTxid, voutnum: 0 },
        }),
      ]));
    });

    test("getidentityhistory with an explicit range and transaction proof", async () => {
      const response = await verusd.getIdentityHistory(chain, 235, 235, true, 255);

      expect(response.error).toBeNull();
      expect(response.result?.history).toHaveLength(1);
      expect(response.result?.history[0]).toMatchObject({
        height: 235,
        output: { txid: registrationTxid, voutnum: 0 },
        proof: expect.stringMatching(/^(?:[0-9a-f]{2})+$/),
      });
    });

    test("getidentityhistory fills omitted intermediate options", async () => {
      const bounded = await verusd.getIdentityHistory(chain, undefined, 235);
      const proofHeightOnly = await verusd.getIdentityHistory(
        chain, undefined, undefined, undefined, 255
      );

      expect(bounded.error).toBeNull();
      expect(bounded.result?.history).toHaveLength(1);
      expect(bounded.result?.history[0].height).toBe(235);
      expect(proofHeightOnly.error).toBeNull();
      expect(proofHeightOnly.result?.history.length).toBeGreaterThan(0);
      for (const entry of proofHeightOnly.result!.history) {
        expect(entry.proof).toBeUndefined();
      }
    });

    test("getcurrencystate distinguishes tip defaults from string zero", async () => {
      const tip = await verusd.getBlockCount();
      expect(tip.error).toBeNull();

      for (const height of [undefined, 0]) {
        const response = await verusd.getCurrencyState(chain, height);
        expect(response.error).toBeNull();
        expect(response.result).toHaveLength(1);
        expect(response.result?.[0]).toMatchObject({
          height: expect.any(Number),
          currencystate: expect.objectContaining({ currencyid: chain }),
        });
        const state = response.result![0];
        if (!("height" in state)) throw new Error("Expected a currency state");
        expect(state.height).toBeGreaterThanOrEqual(tip.result!);
      }

      const genesis = await verusd.getCurrencyState(chain, "0");
      expect(genesis.error).toBeNull();
      expect(genesis.result).toHaveLength(1);
      expect(genesis.result?.[0]).toMatchObject({ height: 0 });
    });

    test("getcurrencystate accepts numeric and string historical heights", async () => {
      const numeric = await verusd.getCurrencyState(chain, 100);
      const string = await verusd.getCurrencyState(chain, "100");

      expect(numeric.error).toBeNull();
      expect(string.error).toBeNull();
      expect(numeric.result).toHaveLength(1);
      expect(numeric.result?.[0]).toMatchObject({
        height: 100,
        currencystate: expect.objectContaining({ currencyid: chain }),
      });
      expect(string.result).toEqual(numeric.result);
    });

    test("getcurrencystate includes the final height in a stepped range", async () => {
      const response = await verusd.getCurrencyState(chain, "100,103,2");

      expect(response.error).toBeNull();
      expect(response.result?.map(entry => "height" in entry ? entry.height : null))
        .toEqual([100, 102, 103]);
      for (const entry of response.result!) {
        expect(entry).toMatchObject({
          currencystate: expect.objectContaining({ currencyid: chain }),
        });
      }
    });

    test("getcurrencystate accepts a conversion currency with an omitted height", async () => {
      const response = await verusd.getCurrencyState(chain, undefined, chain);

      expect(response.error).toBeNull();
      expect(response.result).toHaveLength(1);
      expect(response.result?.[0]).toMatchObject({
        height: expect.any(Number),
        currencystate: expect.objectContaining({ currencyid: chain }),
      });
    });

    test("gettxout returns an unspent zero-value reservation", async () => {
      for (const includeMempool of [undefined, false]) {
        const response = await verusd.getTxOut(registrationTxid, 1, includeMempool);

        expect(response.error).toBeNull();
        expect(response.result).toMatchObject({
          bestblock: expect.stringMatching(/^[0-9a-f]{64}$/),
          confirmations: expect.any(Number),
          value: 0,
          coinbase: false,
          scriptPubKey: {
            type: "cryptocondition",
            hex: expect.stringMatching(/^(?:[0-9a-f]{2})+$/),
            identityreservation: expect.objectContaining({ name: "VRSCTEST" }),
          },
        });
        expect(response.result!.confirmations).toBeGreaterThan(0);
      }
    });

    test("gettxout returns successful null for a spent output at index zero", async () => {
      for (const includeMempool of [undefined, false]) {
        const response = await verusd.getTxOut(commitmentTxid, 0, includeMempool);

        expect(response.error).toBeNull();
        expect(response.result).toBeNull();
      }
    });
  });
});
