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
});
