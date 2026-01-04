export type EllipticCurve = "secp256k1" | "x25519" | "ed25519";
export type SymmetricAlgorithm = "aes-256-gcm" | "xchacha20" | "aes-256-cbc";
export type NonceLength = 12 | 16;
declare class Config {
    ellipticCurve: EllipticCurve;
    isEphemeralKeyCompressed: boolean;
    isHkdfKeyCompressed: boolean;
    symmetricAlgorithm: SymmetricAlgorithm;
    symmetricNonceLength: NonceLength;
}
export declare const ECIES_CONFIG: Config;
export declare const ellipticCurve: () => EllipticCurve;
export declare const isEphemeralKeyCompressed: () => boolean;
export declare const isHkdfKeyCompressed: () => boolean;
export declare const symmetricAlgorithm: () => SymmetricAlgorithm;
export declare const symmetricNonceLength: () => NonceLength;
export declare const ephemeralKeySize: () => number;
export {};
