
# Verusd RPC TypeScript Client

A TypeScript client for interacting with Verus RPC endpoints.

## Installation

```bash
yarn add verusd-rpc-ts-client
```

## Usage

```typescript
import VerusdRpcInterface from 'verusd-rpc-ts-client';

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
  friendlynames?: boolean;
}): Promise<RpcRequestResult<Array<{
  satoshis: number;
  txid: string;
  index: number;
  blockindex: number;
  height: number;
  address: string;
  currencyvalues?: { [key: string]: number };
  currencynames?: { [key: string]: string };
  sent?: {
    outputs: Array<{
      addresses: string | string[];
      amounts: { [key: string]: number };
    }>;
  };
}>>>
```

#### getAddressMempool

Gets the mempool transactions for one or more addresses.

```typescript
getAddressMempool(addresses: {
  addresses: string[];
  friendlynames?: boolean;
}): Promise<RpcRequestResult<Array<{
  satoshis: number;
  txid: string;
  index: number;
  blockindex: number;
  height: number;
  address: string;
  currencyvalues?: { [key: string]: number };
  currencynames?: { [key: string]: string };
  sent?: {
    outputs: Array<{
      addresses: string | string[];
      amounts: { [key: string]: number };
    }>;
  };
}>>>
```

#### getAddressUtxos

Gets the unspent transaction outputs for one or more addresses.

```typescript
getAddressUtxos(addresses: {
  addresses: string[];
  friendlynames?: boolean;
}): Promise<RpcRequestResult<Array<{
  address: string;
  txid: string;
  outputIndex: number;
  script: string;
  currencyvalues?: { [key: string]: number | undefined };
  currencynames?: { [key: string]: string | undefined };
  satoshis: number;
  height: number;
  isspendable: number;
  blocktime: number;
}>>>
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
getVdxfId(vdxfid: string): Promise<RpcRequestResult<{
  vdxfid: string;
  hash160result: string;
  qualifiedname: {
    name: string;
    parentid: string;
  };
  bounddata?: {
    vdxfkey: string;
    uint256: string;
    indexnum: string;
  };
}>>
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
getInfo(): Promise<RpcRequestResult<{
  version: number;
  protocolversion: number;
  VRSCversion: string;
  notarized: number;
  prevMoMheight: number;
  notarizedhash: string;
  notarizedtxid: string;
  notarizedtxid_height: string;
  KMDnotarized_height: number;
  notarized_confirms: number;
  blocks: number;
  longestchain: number;
  timeoffset: number;
  tiptime: number;
  connections: number;
  proxy: string;
  difficulty: number;
  testnet: boolean;
  paytxfee: number;
  relayfee: number;
  errors: string;
  CCid: number;
  name: string;
  p2pport: number;
  rpcport: number;
  magic: number;
  premine: number;
  eras: number;
  reward: string;
  halving: string;
  decay: string;
  endsubsidy: string;
  veruspos: number;
  chainid?: string;
  notarychainid?: string;
}>>
```

#### getOffers

Gets the current offers in the marketplace.

```typescript
getOffers(): Promise<RpcRequestResult<OfferList>>
```

#### getRawTransaction

Gets a raw transaction by its ID.

```typescript
getRawTransaction(txid: string, verbose?: boolean): Promise<RpcRequestResult<string | RawTransaction>>
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
fundRawTransaction(hex: string, options?: {
  changeAddress?: string;
  changePosition?: number;
  includeWatching?: boolean;
  lockUnspents?: boolean;
  reserveChangeKey?: boolean;
  feeRate?: number;
  subtractFeeFromOutputs?: number[];
}): Promise<RpcRequestResult<{
  hex: string;
  changepos: number;
  fee: number;
}>>
```

#### sendCurrency

Sends currency to one or more addresses.

```typescript
sendCurrency(params: {
  amounts: { [address: string]: number };
  currencyid: string;
  fee?: number;
  fromaddress?: string;
  changeaddress?: string;
  returntxtemplate?: boolean;
}): Promise<RpcRequestResult<string | {
  outputtotals: { [currencyid: string]: number };
  feeamount: number;
  hextx: string;
}>>
```

#### getCurrencyConverters

Gets a map of the possible conversion paths from a given list of currencies.

```typescript
getCurrencyConverters(currencyids: string[]): Promise<RpcRequestResult<Array<{
  [key: string]: CurrencyDefinition;
}>>>
```

#### listCurrencies

Lists all currencies in the system.

```typescript
listCurrencies(params?: {
  systemtype?: string;
  startblock?: number;
  endblock?: number;
}): Promise<RpcRequestResult<Array<{
  currencydefinition: CurrencyDefinition;
  bestheight?: number;
  besttxid?: string;
  besttxout?: number;
  bestcurrencystate?: {
    flags: number;
    version: number;
    currencyid: string;
    reservecurrencies: Array<{
      currencyid: string;
      weight: number;
      reserves: number;
      priceinreserve: number;
    }>;
    initialsupply: number;
    emitted: number;
    supply: number;
    currencies: {
      [key: string]: {
        reservein: number;
        primarycurrencyin: number;
        reserveout: number;
        lastconversionprice: number;
        viaconversionprice: number;
        fees: number;
        conversionfees: number;
        priorweights: number;
      };
    };
    primarycurrencyfees: number;
    primarycurrencyconversionfees: number;
    primarycurrencyout: number;
    preconvertedout: number;
  };
}>>>
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

All methods return a Promise that resolves to a `RpcRequestResult` object. This object can contain either a successful result or an error. Use the `extractRpcResult` static method to handle errors automatically:

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
