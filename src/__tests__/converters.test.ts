import {
  CurrencyDefinition,
  GetCurrencyConvertersResponse,
  GetInfoResponse,
  ListCurrenciesResponse,
} from "verus-typescript-primitives";
import VerusdRpcInterface, { RPCRequestOverride } from "../VerusdRpcInterface";
import {
  RpcError,
  RpcRequestBody,
  RpcRequestResult,
} from "../types/RpcRequest";
import {
  IS_FRACTIONAL_FLAG,
  IS_GATEWAY_CONVERTER_FLAG,
  IS_GATEWAY_FLAG,
} from "../utils/flags";

const CHAIN = "iChain";
const SOURCE = "iSource";
const CONVERTER = "iConverter";
const TARGET = "iTarget";
const GATEWAY = "iGateway";

function currency(
  currencyid: string,
  overrides: Partial<CurrencyDefinition> = {}
): CurrencyDefinition {
  return {
    version: 1,
    options: 0,
    name: `display-${currencyid}`,
    currencyid,
    currencyidhex: "00".repeat(20),
    fullyqualifiedname: `display-${currencyid}.VRSC`,
    systemid: CHAIN,
    notarizationprotocol: 1,
    proofprotocol: 1,
    startblock: 0,
    endblock: 0,
    idregistrationfees: 100,
    idreferrallevels: 3,
    idimportfees: 0,
    bestheight: 777,
    ...overrides,
  };
}

function converter(
  overrides: Partial<CurrencyDefinition> = {},
  reserves = 2000,
  weight = 0.5
): CurrencyDefinition {
  return currency(CONVERTER, {
    options: IS_FRACTIONAL_FLAG,
    currencies: [CHAIN, SOURCE],
    bestcurrencystate: {
      flags: 0,
      version: 1,
      currencyid: CONVERTER,
      reservecurrencies: [
        { currencyid: CHAIN, weight, reserves, priceinreserve: 4 },
      ],
      initialsupply: 100,
      emitted: 0,
      supply: 100,
      currencies: {
        [SOURCE]: {
          reservein: 0,
          primarycurrencyin: 0,
          reserveout: 0,
          lastconversionprice: 4,
          viaconversionprice: 4,
          fees: 0,
          conversionfees: 0,
          priorweights: 0.5,
        },
      },
      primarycurrencyfees: 0,
      primarycurrencyconversionfees: 0,
      primarycurrencyout: 0,
      preconvertedout: 0,
    },
    ...overrides,
  });
}

function listed(
  definition: CurrencyDefinition
): ListCurrenciesResponse["result"][number] {
  const {
    bestheight,
    bestcurrencystate,
    currencynames,
    lastconfirmedheight,
    lastconfirmedcurrencystate,
    ...currencydefinition
  } = definition;
  // listcurrencies does not guarantee the enrichment required by getcurrency.
  return { currencydefinition, bestcurrencystate };
}

function rpcConverter(
  definition = converter()
): GetCurrencyConvertersResponse["result"][number] {
  return {
    fullyqualifiedname: definition.fullyqualifiedname,
    height: 100,
    output: { txid: "ab".repeat(32), voutnum: 2 },
    lastnotarization: { currencyid: CONVERTER, notarizationheight: 100 },
    targetamount: 2,
    sourceamounts: { [SOURCE]: 8 },
    [definition.currencyid]: listed(definition).currencydefinition,
  };
}

type Fixture = {
  listed?: ListCurrenciesResponse["result"];
  definitions?: CurrencyDefinition[];
  converters?: unknown;
  converterResults?: (request: RpcRequestBody<number>) => unknown;
  error?: RpcError;
};

function createClient(fixture: Fixture = {}) {
  const requests: RpcRequestBody<number>[] = [];
  const definitions = new Map(
    [currency(CHAIN), converter(), ...(fixture.definitions || [])].map(
      (definition) => [definition.currencyid, definition]
    )
  );
  const info: GetInfoResponse["result"] = {
    version: 1,
    protocolversion: 1,
    VRSCversion: "test",
    blocks: 100,
    longestchain: 100,
    timeoffset: 0,
    connections: 1,
    proxy: "",
    difficulty: 1,
    testnet: false,
    relayfee: 0.0001,
    errors: "",
    name: "VRSC",
    chainid: CHAIN,
  };
  const rpcRequest: RPCRequestOverride = async <D>(
    request: RpcRequestBody<number>
  ): Promise<RpcRequestResult<D>> => {
    requests.push(request);
    let result: unknown;

    switch (request.method) {
      case "listcurrencies":
        result =
          (request.params?.[0] as { systemtype: string }).systemtype === "local"
            ? fixture.listed || []
            : [];
        break;
      case "getcurrency":
        result = definitions.get(request.params?.[0] as string);
        if (!result) {
          throw new Error(`Unexpected currency lookup: ${request.params?.[0]}`);
        }
        break;
      case "getinfo":
        result = info;
        break;
      case "getcurrencyconverters":
        if (fixture.error) {
          return { id: request.id, result: null, error: fixture.error };
        }
        result = fixture.converterResults
          ? fixture.converterResults(request)
          : fixture.converters === undefined
          ? []
          : fixture.converters;
        break;
      default:
        throw new Error(`Unexpected RPC method: ${request.method}`);
    }

    // This is the fixture's wire boundary, including deliberately malformed JSON.
    return { id: request.id, result: result as D, error: null };
  };

  return {
    client: new VerusdRpcInterface(
      CHAIN,
      "http://unused",
      undefined,
      rpcRequest
    ),
    calls: (method: string) => requests.filter((req) => req.method === method),
  };
}

function market(targetOverrides: Partial<CurrencyDefinition> = {}) {
  const source = currency(SOURCE, {
    name: "Source Reserve",
    parent: CHAIN,
    launchsystemid: CHAIN,
  });
  const target = currency(TARGET, {
    name: "Target Reserve",
    parent: CHAIN,
    launchsystemid: CHAIN,
    definitiontxid: "cd".repeat(32),
    definitiontxout: 3,
    lastconfirmedheight: 750,
    currencynames: { [TARGET]: "Target Reserve", [CHAIN]: "Verus" },
    ...targetOverrides,
  });
  const state = converter().bestcurrencystate!;
  const reserveState = state.currencies[SOURCE];
  const pool = converter({
    name: "Three Reserve Basket",
    parent: CHAIN,
    launchsystemid: CHAIN,
    currencies: [CHAIN, SOURCE, TARGET],
    weights: [0.4, 0.3, 0.3],
    definitiontxid: "ef".repeat(32),
    definitiontxout: 1,
    currencynames: {
      [CHAIN]: "Verus",
      [SOURCE]: source.name,
      [TARGET]: target.name,
    },
    lastconfirmedheight: 750,
    bestcurrencystate: {
      ...state,
      currencies: {
        [CHAIN]: { ...reserveState, lastconversionprice: 2 },
        [SOURCE]: { ...reserveState, lastconversionprice: 4 },
        [TARGET]: { ...reserveState, lastconversionprice: 8 },
      },
      reservecurrencies: [
        { currencyid: CHAIN, weight: 0.4, reserves: 2000, priceinreserve: 2 },
        { currencyid: SOURCE, weight: 0.3, reserves: 4000, priceinreserve: 4 },
        { currencyid: TARGET, weight: 0.3, reserves: 8000, priceinreserve: 8 },
      ],
    },
  });
  return { source, target, pool };
}

function marketClient(discovery: "local" | "RPC", currencies = market()) {
  const { source, target, pool } = currencies;
  return createClient({
    listed:
      discovery === "local"
        ? [listed(source), listed(target), listed(pool)]
        : [],
    definitions: [source, target, pool],
    converterResults: (request) => {
      if (request.params?.[0] === SOURCE) return [rpcConverter(pool)];
      if (request.params?.[0] === CONVERTER) return [];
      throw new Error(`Unexpected converter query: ${request.params}`);
    },
  });
}

describe("currency converter discovery", () => {
  test.each([
    ["prelaunch", converter({ startblock: 200 }, 0)],
    ["launched fractional", converter()],
  ])("uses currency IDs for the local %s branch", async (_, destination) => {
    const source = currency(SOURCE);
    const { client, calls } = createClient({
      listed: [listed(source), listed(destination)],
      definitions: [destination],
    });

    const paths = await client.getCurrencyConversionPaths(
      source,
      undefined,
      false
    );

    expect(Object.keys(paths)).toEqual([CONVERTER]);
    expect(paths[CONVERTER]).toEqual([
      expect.objectContaining({ destination, price: 0.25, gateway: false }),
    ]);
    expect(paths[CONVERTER][0].destination.bestheight).toBe(777);
    expect(calls("getcurrency").map((req) => req.params?.[0])).toContain(
      CONVERTER
    );
    expect(calls("getcurrencyconverters")).toHaveLength(0);
    expect(calls("listcurrencies")).toHaveLength(3);
  });

  test.each([
    [
      "prelaunch with no allowed preconversion",
      converter({ startblock: 200, maxpreconversion: [0, 0] }, 0),
    ],
    ["insufficient reserves", converter({}, 1000)],
    ["insufficient reserve weight", converter({}, 2000, 0.1)],
    ["launched nonfractional currency", converter({ options: 0 })],
  ])("keeps local eligibility filtering for %s", async (_, destination) => {
    const source = currency(SOURCE);
    const { client, calls } = createClient({
      listed: [listed(source), listed(destination)],
      definitions: [destination],
    });

    await expect(
      client.getCurrencyConversionPaths(source, undefined, false)
    ).resolves.toEqual({});
    expect(calls("getcurrencyconverters")).toHaveLength(0);
  });

  test("finds the RPC definition after metadata and preserves public wire records", async () => {
    const record = rpcConverter();
    const { client, calls } = createClient({ converters: [record] });

    const paths = await client.getCurrencyConversionPaths(
      currency(SOURCE),
      undefined,
      false
    );

    expect(paths[CONVERTER][0].destination.currencyid).toBe(CONVERTER);
    expect(paths[CONVERTER][0].destination.name).not.toBe(CONVERTER);
    expect(paths[CONVERTER][0].price).toBe(0.25);
    expect(calls("getcurrencyconverters")[0].params).toEqual([SOURCE]);

    const raw = await client.getCurrencyConverters([SOURCE]);
    expect(raw.error).toBeNull();
    expect(raw.result).toEqual([record]);
    expect(raw.result?.[0].targetamount).toBe(2);
    expect(raw.result?.[0].sourceamounts).toEqual({ [SOURCE]: 8 });
    expect(raw.result?.[0].lastnotarization).toEqual(record.lastnotarization);
  });

  test("handles nonfractional definitions with absent optional arrays and empty results", async () => {
    const source = currency(SOURCE);
    expect(source.currencies).toBeUndefined();
    expect(source.weights).toBeUndefined();
    expect(source.conversions).toBeUndefined();
    const { client } = createClient({ listed: [listed(source)] });

    await expect(client.getCurrencyConversionPaths(source)).resolves.toEqual(
      {}
    );
  });

  test.each([undefined, CHAIN])(
    "rejects a gateway converter with no export currency when parent is %s",
    async (parent) => {
      const source = currency(SOURCE);
      const destination = converter({
        options: IS_FRACTIONAL_FLAG | IS_GATEWAY_CONVERTER_FLAG,
        parent,
      });
      const { client, calls } = createClient({
        listed: [listed(source), listed(destination)],
        definitions: [destination],
      });

      await expect(
        client.getCurrencyConversionPaths(source, undefined, false)
      ).rejects.toThrow(`Missing export currency for converter ${CONVERTER}`);
      expect(calls("getcurrency").map((req) => req.params)).toEqual([
        [CHAIN],
        [CONVERTER],
      ]);
    }
  );

  test("does not recurse through a future launch with no launchsystemid", async () => {
    const source = currency(SOURCE);
    const destination = converter({ startblock: 200 });
    const { client, calls } = createClient({
      listed: [listed(source), listed(destination)],
      definitions: [destination],
    });

    const paths = await client.getCurrencyConversionPaths(source);

    expect(Object.keys(paths)).toEqual([CONVERTER]);
    expect(paths[CONVERTER]).toEqual([
      expect.objectContaining({ destination, price: 0.25, via: undefined }),
    ]);
    expect(calls("getcurrencyconverters")).toHaveLength(0);
  });

  test("retains supplied pricing state when a listed definition omits its state", async () => {
    const source = currency(SOURCE);
    const destination = converter();
    const { client, calls } = createClient({
      listed: [
        {
          currencydefinition: listed(destination).currencydefinition,
          bestheight: 100,
        },
      ],
      converters: [rpcConverter(destination)],
    });

    const paths = await client.getCurrencyConversionPaths(
      source,
      destination,
      false
    );

    expect(paths[CONVERTER][0].destination.bestcurrencystate).toEqual(
      destination.bestcurrencystate
    );
    expect(paths[CONVERTER][0].price).toBe(0.25);
    expect(calls("getcurrency").map((req) => req.params)).toEqual([[CHAIN]]);
    expect(calls("getcurrencyconverters")[0].params).toEqual([
      SOURCE,
      CONVERTER,
    ]);
  });

  test("fetches missing pricing state from getcurrency for a listed cache entry", async () => {
    const destination = market().pool;
    const { client, calls } = createClient({
      listed: [
        {
          currencydefinition: listed(destination).currencydefinition,
          bestheight: 100,
        },
      ],
      definitions: [destination],
      converters: [rpcConverter(destination)],
    });

    const paths = await client.getCurrencyConversionPaths(
      currency(SOURCE),
      undefined,
      false
    );

    expect(paths[CONVERTER][0].price).toBe(0.25);
    expect(paths[CONVERTER][0].destination).toEqual(destination);
    expect(
      calls("getcurrency").filter((req) => req.params?.[0] === CONVERTER)
    ).toHaveLength(1);
  });

  test("reports a missing pricing state after one full currency refresh", async () => {
    const destination = converter({ bestcurrencystate: undefined });
    const { client, calls } = createClient({
      listed: [
        {
          currencydefinition: listed(destination).currencydefinition,
          bestheight: 100,
        },
      ],
      definitions: [destination],
      converters: [rpcConverter(destination)],
    });

    await expect(
      client.getCurrencyConversionPaths(currency(SOURCE), undefined, false)
    ).rejects.toThrow(`Missing currency state for ${CONVERTER}`);
    expect(
      calls("getcurrency").filter((req) => req.params?.[0] === CONVERTER)
    ).toHaveLength(1);
  });

  test("reuses local converter cache entries", async () => {
    const source = currency(SOURCE);
    const { client, calls } = createClient({
      listed: [listed(source), listed(converter())],
    });

    const first = await client["getCachedCurrencyConverters"]([SOURCE]);
    const second = await client["getCachedCurrencyConverters"]([SOURCE]);

    expect(first.result).toEqual([{ currencyid: CONVERTER }]);
    expect(second).toBe(first);
    expect(calls("listcurrencies")).toHaveLength(3);
    expect(calls("getinfo")).toHaveLength(1);
    expect(calls("getcurrencyconverters")).toHaveLength(0);
  });

  test("caches empty fallback responses and keeps distinct argument cache keys", async () => {
    const { client, calls } = createClient();

    const first = await client["getCachedCurrencyConverters"]([SOURCE]);
    const second = await client["getCachedCurrencyConverters"]([SOURCE]);
    const paired = await client["getCachedCurrencyConverters"]([
      SOURCE,
      CONVERTER,
    ]);
    const pairedAgain = await client["getCachedCurrencyConverters"]([
      SOURCE,
      CONVERTER,
    ]);

    expect(first.result).toEqual([]);
    expect(second).toBe(first);
    expect(pairedAgain).toBe(paired);
    expect(calls("getcurrencyconverters").map((req) => req.params)).toEqual([
      [SOURCE],
      [SOURCE, CONVERTER],
    ]);
    expect(calls("listcurrencies")).toHaveLength(3);
    expect(calls("getinfo")).toHaveLength(1);
  });

  test("clears discovery caches after each public call", async () => {
    const { client, calls } = createClient({ converters: [rpcConverter()] });

    const first = await client.getCurrencyConversionPaths(
      currency(SOURCE),
      undefined,
      false
    );
    const second = await client.getCurrencyConversionPaths(
      currency(SOURCE),
      undefined,
      false
    );

    expect(second).toEqual(first);
    expect(calls("listcurrencies")).toHaveLength(6);
    expect(calls("getinfo")).toHaveLength(2);
    expect(calls("getcurrencyconverters")).toHaveLength(2);
  });

  test.each([
    [
      "missing definition",
      {
        fullyqualifiedname: "missing",
        lastnotarization: { currencyid: CONVERTER },
      },
    ],
    [
      "display name used as the key",
      { [converter().name]: listed(converter()).currencydefinition },
    ],
    ["nonobject definition", { [CONVERTER]: CONVERTER }],
    ["array definition", { [CONVERTER]: [{ currencyid: CONVERTER }] }],
    ["mismatched currency ID", { [CONVERTER]: { currencyid: SOURCE } }],
    [
      "metadata masquerading as a definition",
      { lastnotarization: { currencyid: "lastnotarization" } },
    ],
    [
      "ambiguous definitions",
      { ...rpcConverter(), [SOURCE]: { currencyid: SOURCE } },
    ],
    ["null entry", null],
  ])("rejects %s and clears caches for retry", async (_, record) => {
    const fixture: Fixture = { converters: [record] };
    const { client, calls } = createClient(fixture);

    await expect(
      client.getCurrencyConversionPaths(currency(SOURCE), undefined, false)
    ).rejects.toThrow(/expected exactly one currency-ID-keyed definition/);

    fixture.converters = [rpcConverter()];
    const paths = await client.getCurrencyConversionPaths(
      currency(SOURCE),
      undefined,
      false
    );
    expect(paths[CONVERTER][0].price).toBe(0.25);
    expect(calls("listcurrencies")).toHaveLength(6);
    expect(calls("getcurrencyconverters")).toHaveLength(2);
  });

  test("propagates RPC errors and permits a successful retry", async () => {
    const fixture: Fixture = {
      error: { code: -1, message: "Converter lookup unavailable" },
    };
    const { client, calls } = createClient(fixture);

    await expect(
      client.getCurrencyConversionPaths(currency(SOURCE), undefined, false)
    ).rejects.toThrow("Converter lookup unavailable");

    fixture.error = undefined;
    fixture.converters = [rpcConverter()];
    const paths = await client.getCurrencyConversionPaths(
      currency(SOURCE),
      undefined,
      false
    );
    expect(paths[CONVERTER][0].price).toBe(0.25);
    expect(calls("listcurrencies")).toHaveLength(6);
  });
});

describe("public conversion paths used by wallets", () => {
  test.each([false, true])(
    "uses separate list pricing state without synthesizing destination metadata (includeVia=%s)",
    async (includeVia) => {
      const { source, target, pool } = market();
      const fetchedPool = {
        ...pool,
        bestheight: 901,
        bestcurrencystate: undefined,
      };
      const { client, calls } = createClient({
        listed: [listed(source), listed(target), listed(pool)],
        definitions: [source, target, fetchedPool],
      });

      const paths = await client.getCurrencyConversionPaths(
        source,
        undefined,
        includeVia
      );

      expect(paths[CONVERTER][0].price).toBe(0.25);
      expect(paths[CONVERTER][0].destination).toEqual(fetchedPool);
      expect(paths[CONVERTER][0].destination.bestheight).toBe(901);
      expect(paths[CONVERTER][0].destination.bestcurrencystate).toBeUndefined();
      if (includeVia) {
        expect(paths[TARGET][0].price).toBe(2);
        expect(paths[TARGET][0].via).toEqual(fetchedPool);
      }
      expect(
        calls("getcurrency").filter((req) => req.params?.[0] === CONVERTER)
      ).toHaveLength(1);
    }
  );

  test("clears separately cached list pricing state between public discovery calls", async () => {
    const { source, pool } = market();
    const fetchedPool = { ...pool, bestcurrencystate: undefined };
    const fixture: Fixture = {
      listed: [listed(source), listed(pool)],
      definitions: [fetchedPool],
      converters: [rpcConverter(pool)],
    };
    const { client, calls } = createClient(fixture);

    const first = await client.getCurrencyConversionPaths(
      source,
      undefined,
      false
    );
    expect(first[CONVERTER][0].price).toBe(0.25);

    fixture.listed = [];
    await expect(
      client.getCurrencyConversionPaths(source, undefined, false)
    ).rejects.toThrow(`Missing currency state for ${CONVERTER}`);
    expect(calls("listcurrencies")).toHaveLength(6);
  });

  test("returns equivalent direct and via routes from local and RPC discovery", async () => {
    const currencies = market();
    const local = marketClient("local", currencies);
    const rpc = marketClient("RPC", currencies);

    const localPaths = await local.client.getCurrencyConversionPaths(
      currencies.source
    );
    const rpcPaths = await rpc.client.getCurrencyConversionPaths(
      currencies.source
    );

    expect(rpcPaths).toEqual(localPaths);
    expect(Object.keys(localPaths).sort()).toEqual(
      [CHAIN, CONVERTER, TARGET].sort()
    );
    expect(localPaths[CONVERTER]).toEqual([
      {
        destination: currencies.pool,
        price: 0.25,
        gateway: false,
        via: undefined,
        exportto: undefined,
        viapriceinroot: undefined,
        destpriceinvia: undefined,
      },
    ]);
    expect(localPaths[TARGET]).toEqual([
      {
        destination: currencies.target,
        via: currencies.pool,
        price: 2,
        gateway: false,
        exportto: undefined,
        viapriceinroot: 0.25,
        destpriceinvia: 8,
      },
    ]);
    expect(localPaths[CHAIN][0].price).toBe(0.5);
    expect(localPaths[SOURCE]).toBeUndefined();
    expect(local.calls("getcurrencyconverters")).toHaveLength(0);
    expect(rpc.calls("getcurrencyconverters").map((req) => req.params)).toEqual(
      [[SOURCE], [CONVERTER]]
    );
  });

  test.each(["local", "RPC"] as const)(
    "returns direct reserve prices from a fractional source with %s discovery",
    async (discovery) => {
      const currencies = market();
      const { client } = marketClient(discovery, currencies);

      const paths = await client.getCurrencyConversionPaths(
        currencies.pool,
        undefined,
        false
      );

      expect(Object.keys(paths).sort()).toEqual([CHAIN, SOURCE, TARGET].sort());
      expect(paths[TARGET]).toEqual([
        {
          destination: currencies.target,
          price: 8,
          gateway: false,
          via: undefined,
          exportto: undefined,
          viapriceinroot: undefined,
          destpriceinvia: undefined,
        },
      ]);
      expect(paths[SOURCE][0].price).toBe(4);
      expect(paths[CHAIN][0].price).toBe(2);
    }
  );

  test.each(["local", "RPC"] as const)(
    "preserves gateway export and on-chain alternatives with %s discovery",
    async (discovery) => {
      const currencies = market({ options: IS_GATEWAY_FLAG, systemid: TARGET });
      const { client } = marketClient(discovery, currencies);

      const paths = await client.getCurrencyConversionPaths(currencies.source);

      expect(paths[TARGET]).toEqual([
        {
          destination: currencies.target,
          via: currencies.pool,
          exportto: currencies.target,
          price: 2,
          gateway: true,
          viapriceinroot: 0.25,
          destpriceinvia: 8,
        },
        {
          destination: currencies.target,
          via: currencies.pool,
          price: 2,
          gateway: false,
          viapriceinroot: 0.25,
          destpriceinvia: 8,
        },
      ]);
    }
  );

  test.each([CHAIN, GATEWAY])(
    "selects the correct export system for a gateway converter parented by %s",
    async (parent) => {
      const source = currency(SOURCE);
      const gateway = currency(GATEWAY, {
        options: IS_GATEWAY_FLAG,
        systemid: GATEWAY,
        parent: CHAIN,
        launchsystemid: CHAIN,
      });
      const pool = converter({
        options: IS_FRACTIONAL_FLAG | IS_GATEWAY_CONVERTER_FLAG,
        parent,
        launchsystemid: parent === CHAIN ? GATEWAY : CHAIN,
      });
      const { client, calls } = createClient({
        listed: [listed(source), listed(pool)],
        definitions: [pool, gateway],
      });

      const paths = await client.getCurrencyConversionPaths(
        source,
        undefined,
        false
      );

      expect(paths[CONVERTER]).toHaveLength(2);
      expect(paths[CONVERTER][0]).toEqual(
        expect.objectContaining({
          destination: pool,
          exportto: gateway,
          price: 0.25,
          gateway: false,
        })
      );
      expect(paths[CONVERTER][1]).toEqual(
        expect.objectContaining({
          destination: pool,
          price: 0.25,
          gateway: false,
        })
      );
      expect(paths[CONVERTER][1].exportto).toBeUndefined();
      expect(
        calls("getcurrency").filter((req) => req.params?.[0] === GATEWAY)
      ).toHaveLength(1);
    }
  );

  test("accepts bestheight zero from listcurrencies without fetching a replacement", async () => {
    const source = currency(SOURCE);
    const destination = converter({ bestheight: 0 });
    const { client, calls } = createClient({
      listed: [listed(source), { ...listed(destination), bestheight: 0 }],
    });

    const paths = await client.getCurrencyConversionPaths(
      source,
      undefined,
      false
    );

    expect(paths[CONVERTER][0].destination).toEqual(destination);
    expect(paths[CONVERTER][0].price).toBe(0.25);
    expect(calls("getcurrency").map((req) => req.params)).toEqual([[CHAIN]]);
    expect(calls("getcurrencyconverters")).toHaveLength(0);
  });

  test("returns the refreshed full via definition when pricing state must be fetched", async () => {
    const { source, target, pool } = market();
    const partialPool = {
      ...pool,
      bestheight: 100,
      bestcurrencystate: undefined,
    };
    const { client, calls } = createClient({
      listed: [
        {
          currencydefinition: listed(pool).currencydefinition,
          bestheight: 100,
        },
      ],
      definitions: [source, target, pool],
    });

    const paths = await client.getCurrencyConversionPaths(
      partialPool,
      undefined,
      false,
      [],
      partialPool,
      source
    );

    expect(paths[TARGET][0]).toEqual({
      destination: target,
      via: pool,
      price: 2,
      gateway: false,
      exportto: undefined,
      viapriceinroot: 0.25,
      destpriceinvia: 8,
    });
    expect(
      calls("getcurrency").filter((req) => req.params?.[0] === CONVERTER)
    ).toHaveLength(1);
  });

  test("refreshes a fractional source once before returning all reserve prices", async () => {
    const { source, target, pool } = market();
    const partialPool = {
      ...pool,
      bestheight: 100,
      bestcurrencystate: undefined,
    };
    const { client, calls } = createClient({
      listed: [
        {
          currencydefinition: listed(pool).currencydefinition,
          bestheight: 100,
        },
      ],
      definitions: [source, target, pool],
    });

    const paths = await client.getCurrencyConversionPaths(
      partialPool,
      undefined,
      false
    );

    expect(paths[TARGET][0].destination).toEqual(target);
    expect(paths[TARGET][0].price).toBe(8);
    expect(paths[SOURCE][0].price).toBe(4);
    expect(paths[CHAIN][0].price).toBe(2);
    expect(
      calls("getcurrency").filter((req) => req.params?.[0] === CONVERTER)
    ).toHaveLength(1);
  });

  test("preserves invoice converter metadata and serialized query parameters", async () => {
    const { target, pool } = market();
    const invoiceQuery = JSON.stringify({
      convertto: TARGET,
      fromcurrency: [{ currency: SOURCE }, { currency: CHAIN }],
      amount: 2,
      slippage: 1,
    });
    const record = {
      ...rpcConverter(pool),
      targetamount: 2,
      sourceamounts: { [SOURCE]: 1, [CHAIN]: 0.5 },
    };
    const { client, calls } = createClient({ converters: [record] });

    const response = await client.getCurrencyConverters([invoiceQuery]);
    const roundTrip = JSON.parse(JSON.stringify(response));

    expect(calls("getcurrencyconverters")[0].params).toEqual([invoiceQuery]);
    expect(roundTrip.result).toEqual([record]);
    expect(roundTrip.result[0]).toEqual(
      expect.objectContaining({
        fullyqualifiedname: pool.fullyqualifiedname,
        height: 100,
        output: { txid: "ab".repeat(32), voutnum: 2 },
        lastnotarization: { currencyid: CONVERTER, notarizationheight: 100 },
        targetamount: 2,
        sourceamounts: { [SOURCE]: 1, [CHAIN]: 0.5 },
      })
    );
    expect(
      JSON.parse(calls("getcurrencyconverters")[0].params?.[0] as string)
        .convertto
    ).toBe(target.currencyid);
    expect(calls("listcurrencies")).toHaveLength(0);
  });
});
