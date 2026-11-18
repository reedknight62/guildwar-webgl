import brotliPromise from './brotli-wasm-3.0.1/index.web.js';

const brotli = await brotliPromise;
self.onmessage = ({data}) => {
  try {
    const bytes = brotli.decompress(new Uint8Array(data.bytes));
    self.postMessage({id: data.id, bytes: bytes.buffer}, [bytes.buffer]);
  } catch (error) {
    self.postMessage({id: data.id, error: String(error && error.message || error)});
  }
};
self.postMessage({ready: true});
