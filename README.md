
# Verusd RPC TypeScript Client

A TypeScript client for interacting with Verus RPC endpoints.

## Installation

```bash
yarn add verusd-rpc-ts-client
```

## Primitives compatibility update

This revision pins `verus-typescript-primitives` to public commit
[`7a7b01db697222cd68507a9dbf15f289615ea890`](https://github.com/VerusCoin/verus-typescript-primitives/commit/7a7b01db697222cd68507a9dbf15f289615ea890).
Keep direct primitives dependencies aligned with this revision. Its package version remains `1.0.0`.
The client targets ES2015; the updated primitives declarations require ES2015 or later.

- Address UTXO and delta results can be arrays or chain-info objects. UTXO `isspendable` is boolean and `blocktime` is optional. Mempool entries have `timestamp` and `spending`, without confirmed-block fields.
- Currency definitions and blockchain information have optional fields. Offers can return `false`, and send-currency templates can contain `hextx` or `hextxwithoutz`. Use the response types below and narrow unions before accessing their fields.
- Converter path discovery uses currency IDs and fetches full definitions when list entries lack `bestheight`. Missing or ambiguous definitions in converter records reject path discovery; `getCurrencyConverters` returns the original daemon records.
- Optional request arguments retain their positions. `signRawTransaction(hex, prevtxs?, sighashtype?, branchid?, privatekeys?)` appends private keys to the client arguments; the request class puts them in the daemon's third wire slot. Omitting private keys and passing `[]` have different meanings.
- `fundRawTransaction` accepts hex alone, or UTXOs together with a change address and optional explicit fee. Unsupported combinations reject before an RPC is sent. Nested `signData` MMR inputs use `serializedhex` / `serializedbase64` and `mimetype`.
- Applications using the re-exported `Primitives` must also migrate parser reuse, renamed JSON fields, and affected stored bytes/signatures. Deserialization instances are single-use, including failed attempts, and legacy `SignedSessionObject` construction is disabled.

For example, normalize either UTXO result shape while retaining the original response if chain metadata is needed:

```typescript
const result = VerusdRpcInterface.extractRpcResult<Primitives.GetAddressUtxosResponse>(
  await client.getAddressUtxos({ addresses: ['identity@'], chaininfo: true })
);
const utxos = Array.isArray(result) ? result : result.utxos;
```

## Usage

```typescript
import { VerusdRpcInterface, Primitives } from 'verusd-rpc-ts-client';

const client = new VerusdRpcInterface(
  'chain', // The chain to connect to
  'http://localhost:27486', // RPC endpoint URL
  {} // Optional axios config
);
```

## API Reference

### Constructor

```typescript
constructor(
  chain: string,
  baseURL: string,
  config?: AxiosRequestConfig,
  rpcRequest?: <D>(req: RpcRequestBody<number>) => Promise<RpcRequestResult<D>>
)
```

### Public Methods

#### getAddressBalance

Gets the balance for one or more addresses.

```typescript
getAddressBalance(addresses: {
  addresses: string[];
  friendlynames?: boolean;
}): Promise<RpcRequestResult<{
  balance: number;
  received: number;
  currencybalance: { [key: string]: number };
  currencyreceived: { [key: string]: number };
  currencynames?: { [key: string]: string };
}>>
```

#### getAddressDeltas

Gets the transaction deltas for one or more addresses.

```typescript
getAddressDeltas(addresses: {
  addresses: string[];
  start?: number;
  end?: number;
  chaininfo?: boolean;
  verbosity?: number;
  friendlynames?: boolean;
}): Promise<RpcRequestResult<Primitives.GetAddressDeltasResponse['result']>>
```

#### getAddressMempool

Gets the mempool transactions for one or more addresses.

```typescript
getAddressMempool(addresses: {
  addresses: string[];
  start?: number;
  end?: number;
  chaininfo?: boolean;
  verbosity?: number;
  friendlynames?: boolean;
}): Promise<RpcRequestResult<Primitives.GetAddressMempoolResponse['result']>>
```

#### getAddressUtxos

Gets the unspent transaction outputs for one or more addresses.

```typescript
getAddressUtxos(addresses: {
  addresses: string[];
  chaininfo?: boolean;
  friendlynames?: boolean;
}): Promise<RpcRequestResult<Primitives.GetAddressUtxosResponse['result']>>
```

#### getBlock

Gets information about a block.

```typescript
getBlock(hash: string, verbosity?: number): Promise<RpcRequestResult<string | BlockInfo>>
```

#### getBlockCount

Gets the number of blocks in the best valid block chain.
```typescript
getBlockCount(): Promise<RpcRequestResult<number>>
```

#### getVdxfId

Creates a vdxfid from a vdxfkey string, e.g. vrsc::data.example

```typescript
getVdxfId(vdxfuri: string, initialdata?: {
  vdxfkey?: string;
  uint256?: string;
  indexnum?: string | number;
}): Promise<RpcRequestResult<Primitives.GetVdxfIdResponse['result']>>
```

#### getIdentity

Gets information about an identity.

```typescript
getIdentity(identityid: string): Promise<RpcRequestResult<{
  identity: IdentityDefinition;
  status: string;
  canspendfor: boolean;
  cansignfor: boolean;
  blockheight: number;
  txid: string;
  vout: number;
  proof?: string;
}>>
```

#### getIdentityContent

Gets the content of an identity.

```typescript
getIdentityContent(identityid: string): Promise<RpcRequestResult<{
  identity: IdentityDefinition;
  status: string;
  canspendfor: boolean;
  cansignfor: boolean;
  blockheight: number;
  txid: string;
  vout: number;
  proof?: string;
}>>
```

#### getCurrency

Gets information about a currency.

```typescript
getCurrency(currencyid: string): Promise<RpcRequestResult<CurrencyDefinition>>
```

#### getInfo

Gets information about the current state of the blockchain.

```typescript
getInfo(): Promise<RpcRequestResult<Primitives.GetInfoResponse['result']>>
```

#### getOffers

Gets the current offers in the marketplace.

```typescript
getOffers(currencyorid: string, iscurrency?: boolean, withtx?: boolean): Promise<RpcRequestResult<Primitives.GetOffersResponse['result']>>
```

#### getRawTransaction

Gets a raw transaction by its ID.

```typescript
getRawTransaction(txid: string, verbose?: number): Promise<RpcRequestResult<string | RawTransaction>>
```

#### makeOffer

Creates a new offer in the marketplace.

```typescript
makeOffer(offer: {
  offer: {
    offerid: string;
    offertype: string;
    offerfrom: string;
    offerto: string;
    offeramount: number;
    offercurrency: string;
    acceptamount: number;
    acceptcurrency: string;
  };
}): Promise<RpcRequestResult<{
  txid?: string;
  hex?: string;
}>>
```

#### sendRawTransaction

Sends a raw transaction to the network.

```typescript
sendRawTransaction(hex: string): Promise<RpcRequestResult<string | RawTransaction>>
```

#### fundRawTransaction

Funds a raw transaction with inputs.

```typescript
fundRawTransaction(txhex: string, utxos?: Array<{
  voutnum: number;
  txid: string;
}>, changeaddr?: string, explicitfee?: number): Promise<RpcRequestResult<Primitives.FundRawTransactionResponse['result']>>
```

#### sendCurrency

Sends currency to one or more addresses.

```typescript
sendCurrency(
  fromaddress: string,
  outputs: Primitives.SendCurrencyRequest['outputs'],
  minconf?: number,
  feeamount?: number,
  returntxtemplate?: boolean
): Promise<RpcRequestResult<Primitives.SendCurrencyResponse['result']>>
```

#### getCurrencyConverters

Gets daemon converter records for a given list of currencies. Each record includes a dynamic currency-ID-keyed raw definition and metadata such as `height`, `output`, and `lastnotarization`; object key order is not significant.

```typescript
getCurrencyConverters(currencyids: string[]): Promise<RpcRequestResult<Primitives.GetCurrencyConvertersResponse['result']>>
```

#### listCurrencies

Lists currencies and their available state metadata. Nested definitions are raw definitions with selected enrichment; they are not complete `getCurrency` results.

```typescript
listCurrencies(
  query?: Primitives.ListCurrenciesRequest['query'],
  startblock?: number,
  endblock?: number
): Promise<RpcRequestResult<Primitives.ListCurrenciesResponse['result']>>
```

#### estimateConversion

Estimates the conversion outcome when converting through a PBaaS liquidity pool.

```typescript
estimateConversion(params: {
  currencyid: string;
  amount: number;
  convertto: string;
}): Promise<RpcRequestResult<{
  estimatedcurrencyout: number;
  inputcurrencyid: string;
  netinputamount: number;
  outputcurrencyid: string;
  estimatedcurrencystate: {
    currencies: {
      [currencyid: string]: {
        conversionfees: number;
        fees: number;
        lastconversionprice: number;
        primarycurrencyin: number;
        priorweights: number;
        reservein: number;
        reserveout: number;
        viaconversionprice: number;
      };
    };
    currencyid: string;
    emitted: number;
    flags: number;
    initialsupply: number;
    preconvertedout: number;
    primarycurrencyconversionfees: number;
    primarycurrencyfees: number;
    primarycurrencyout: number;
    reservecurrencies: Array<{
      currencyid: string;
      priceinreserve: number;
      reserves: number;
      weight: number;
    }>;
    supply: number;
    version: number;
  };
}>>
```

#### zGetOperationStatus

Gets the status of a Z operation.

```typescript
zGetOperationStatus(operationid: string): Promise<RpcRequestResult<z_operation[]>>
```

### Static Methods

#### extractRpcResult

Extracts the result from an RPC response, throwing an error if the response contains an error.

```typescript
static extractRpcResult<D extends ApiResponse>(res: RpcRequestResult<D["result"]>): D["result"]
```

## Error Handling

RPC methods return a Promise that resolves to a `RpcRequestResult` object. Invalid request parameters can reject that Promise before an RPC is sent. This object can contain either a successful result or an error. Use the `extractRpcResult` static method to handle errors automatically:

```typescript
try {
  const result = VerusdRpcInterface.extractRpcResult(await client.getAddressBalance({ addresses: ['address'] }));
  // Use result
} catch (error) {
  // Handle error
}
```

## Types

The client uses TypeScript types from the `verus-typescript-primitives` package. Key types include:

- `CurrencyDefinition`: Represents a currency definition
- `IdentityDefinition`: Represents an identity definition
- `RawTransaction`: Represents a raw transaction
- `BlockInfo`: Represents block information
- `OfferList`: Represents a list of offers
- `z_operation`: Represents a Z operation

## License

MIT
