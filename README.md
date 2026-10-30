
# Verusd RPC TypeScript Client

A TypeScript client for interacting with Verus RPC endpoints.

## Installation

```bash
yarn add verusd-rpc-ts-client
```

## Primitives compatibility update

This revision pins `verus-typescript-primitives` to public commit
[`cfe8c45e43ac7846d73083501aa42665ec9f85d9`](https://github.com/VerusCoin/verus-typescript-primitives/commit/cfe8c45e43ac7846d73083501aa42665ec9f85d9)
from `master`, including tagged invoice support and the earlier identity-registration and MMR/VDXF compatibility updates.
Keep direct primitives dependencies aligned with this revision. Its package version remains `1.0.0`.
The client targets ES2015; the updated primitives declarations require ES2015 or later.

### Changes since the previous pin (`f7de920`)

The RPC request/response definitions and client method signatures are unchanged.
The public `Primitives` export includes these tagged invoice updates:

- **Tagged VerusPay invoices:** JSON parsing now restores tags as `CompactXAddressObject` instances with the supplied version, root-system name, and optional namespace. `CompactXAddressObject.fromCompactAddressObjectJson()` now requires a `CompactAddressObjectJson` argument instead of `any`.
- **Data-key tags:** `CompactXAddressObject.fromDataKey()` accepts a string root-system name and defaults to `"VRSC"`, allowing `"VRSCTEST"` as well.
- **Tag validation:** `CompactXAddressObject.isValid()` requires compact version 1, an FQN or X-address type, and a valid resolved X-address. Tagged invoices with missing or invalid tags fail validation and throw during binary/JSON parsing and serialization. Untagged invoices ignore unused tags.

### Earlier MMR/VDXF compatibility changes (`36cf608` to `f7de920`)

The public `Primitives` export gained `hashData`, `getMMRRoot`, `NotaryEvidence`,
and `createNotaryEvidenceOutputs`, but also exposes these upstream breaking changes:

- **Signing helpers:** `PartialMMRData` / `PartialSignData` CLI conversion rejects bare-string MMR items, `serializedbase64`, `priormmr`, malformed encodings, and metadata it cannot preserve. Each MMR item must have one supported data key; supplied salts and hashes must be exactly 32 bytes. Use `serializedhex` for binary data. `client.signData()` remains a raw transport and does not apply these helper checks; forwarding base64 successfully does not establish daemon support.
- **Descriptor and VDXF JSON:** `fromJson` / `toJson` now use the supported lossless daemon representation; `fromDaemonJson` / `toDaemonJson` are aliases. Omitted descriptor versions and MMR hash tags default to zero, while native constructors retain their own defaults. Use `{ message: text }` for raw text and supply versions/hash tags explicitly when needed. Metadata, key lengths, FQN entry ordering/uniqueness, and tagged byte-vector output are validated more strictly. Keep values that JSON cannot preserve in binary form.
- **MMR ownership and types:** range layers and view caches are private; `vSize` / `_leafLength` are removed. Use public methods such as `size()`, `getNode()` and `getPeaks()`. Returned nodes/hashes are copies, so mutating them no longer changes the tree. Custom node subclasses with state that the default copy cannot preserve must override `clone()`.
- **Proof and hash-vector handling:** `safeCheck()` returns a zero hash for missing positions or equal right siblings and rejects invalid input widths/types. Validate against an independently trusted nonzero root. `decodeHashVector()` now permits trailing bytes; use `decodeHashVector(true)` when an exact tagged vector is required.
- **Reference JSON:** zero optional system IDs and identity-reference hashes are omitted, and `PBaaSEvidenceRefJson.systemid` is now optional. URL-reference JSON accepts only version 1; use binary serialization for version 2.

See the pinned upstream [MMR compatibility notes](https://github.com/VerusCoin/verus-typescript-primitives/blob/f7de920e32e8d4778356c18ce8bb6d3a22ec72a3/README.md#mmr-compatibility-and-limits)
for the supported formats and migration details.

### Earlier compatibility changes

The previous pin added `getIdentityHistory`, `getCurrencyState`, and `getTxOut`.
Applications upgrading from older client revisions should also account for these changes:

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
