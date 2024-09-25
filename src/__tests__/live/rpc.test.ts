import { VerusdRpcInterface } from '../../index'

jest.setTimeout(10000)

describe('Makes live API Verusd RPC calls', () => {
  const verusd = new VerusdRpcInterface("iJhCezBExJHvtyH3fGhNnt2NhU4Ztkf2yq", "http://127.0.0.1:8000")

  test('getaddressbalance', async () => {
    expect(
      (
        await verusd.getAddressBalance({
          addresses: ["mike@"],
          friendlynames: true,
        })
      ).error
    ).toBe(undefined);
  });

  test('getaddressutxos', async () => {
    expect(
      (
        await verusd.getAddressUtxos({
          addresses: ["mike@"],
          friendlynames: true
        })
      ).error
    ).toBe(undefined);
  });

  test('getaddressdeltas', async () => {
    expect(
      (
        await verusd.getAddressDeltas({
          addresses: ["mike@"],
          friendlynames: true,
          verbosity: 1
        })
      ).error
    ).toBe(undefined);
  });

  test('getaddressmempool', async () => {
    expect(
      (
        await verusd.getAddressMempool({
          addresses: ["mike@"],
          friendlynames: true,
          verbosity: 1
        })
      ).error
    ).toBe(undefined);
  });

  test("getblock", async () => {
    expect((await verusd.getBlock("1")).error).toBe(undefined);
  });

  test('getidentity', async () => {
    expect(
      (
        await verusd.getIdentity("mike@")
      ).error
    ).toBe(undefined);
  });

  test('getidentitycontent', async () => {
    expect(
      (
        await verusd.getIdentityContent("mike@")
      ).error
    ).toBe(undefined);
  });

  test('getinfo', async () => {
    expect(
      (
        await verusd.getInfo()
      ).error
    ).toBe(undefined);
  });

  test('getoffers', async () => {
    expect(
      (
        await verusd.getOffers("mike@")
      ).error
    ).toBe(undefined);
  });

  test('getrawtransaction', async () => {
    expect(
      (
        await verusd.getRawTransaction(
          "db97193d1a91f047cb14aa32a975be2e953924e1f4f0747cc20981edef6f4c28"
        )
      ).error
    ).toBe(undefined);
  });

  test("getcurrency", async () => {
    expect((await verusd.getCurrency("VRSCTEST")).error).toBe(undefined);
  });

  test("getvdxfid", async () => {
    expect((await verusd.getVdxfId("test")).error).toBe(undefined);
  });

  test("getcurrencyconverters", async () => {
    expect((await verusd.getCurrencyConverters(["VRSCTEST"])).error).toBe(undefined);
  });

  test("listcurrencies", async () => {
    expect((await verusd.listCurrencies()).error).toBe(undefined);
  });

  test("estimateconversion", async () => {
    expect((await verusd.estimateConversion({
      "currency": "VRSCTEST",
      "convertto": "USD",
      "via": "VRSC-USD", 
      "amount": 10
    })).error).toBe(undefined);
  });

  test("getcurrencyconversionpaths", async () => {
    const VRSCTEST = (await verusd.getCurrency("VRSCTEST")).result
    const paths = await verusd.getCurrencyConversionPaths(VRSCTEST!)

    expect(paths).toBeDefined()
  });
});
