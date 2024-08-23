import { VerusdRpcInterface } from '../../index'

jest.setTimeout(10000)

describe('Makes live API Verusd RPC calls', () => {
  const verusd = new VerusdRpcInterface("VRSCTEST", "http://foo:bar@127.0.0.1:18843")

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

  test('getidentitylog', async () => {
      let k = await verusd.getIdentity("MnbvDemo2@")
      console.log(k.result?.identity.contentmultimap)
      console.log(k)
  });

  test('getidentitycontent', async () => {
    expect(
      (
        await verusd.getIdentityContent("MnbvDemo2@")
      ).error
    ).toBe(undefined);
  });

  test('getidentitycontlog', async () => {
    let k = await verusd.getIdentityContent("MnbvDemo2@")
    console.log(k.result?.identity.contentmultimap)
    console.log(k)
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
          "676ccef766d808a3e7ab60a32226273a15bbce300db6ebea3b944b65043655cf"
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
      "currency": "BrandDisc", 
      "convertto": "brand32", 
      "via": "BrandWeight", 
      "amount": 10
    })).error).toBe(undefined);
  });

  test("getcurrencyconversionpaths", async () => {
    const VRSCTEST = (await verusd.getCurrency("VRSCTEST")).result
    const paths = await verusd.getCurrencyConversionPaths(VRSCTEST!)

    expect(paths).toBeDefined()
  });
});
