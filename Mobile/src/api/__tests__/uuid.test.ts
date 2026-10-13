// Por http (red local) el navegador no ofrece crypto.randomUUID: el id del voto se arma con getRandomValues.
jest.mock("expo-secure-store", () => ({}));
jest.mock("expo-crypto", () => ({
  randomUUID: () => { throw new TypeError("randomUUID no disponible fuera de https"); },
  getRandomValues: (a: Uint8Array) => require("crypto").webcrypto.getRandomValues(a),
}));
import { newClientRequestId } from "../votings";

test("sin randomUUID genera un UUID v4 válido y distinto cada vez", () => {
  const a = newClientRequestId(), b = newClientRequestId();
  expect(a).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
  expect(a).not.toBe(b);
});
