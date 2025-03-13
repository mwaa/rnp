// Here we export some useful types and functions for interacting with the Anchor program.
import { AnchorProvider, Program } from '@coral-xyz/anchor';
import { PublicKey } from '@solana/web3.js';
import HswIDL from '../target/idl/hsw.json';
import type { Hsw } from '../target/types/hsw';

// Re-export the generated IDL and type
export { Hsw, HswIDL }

// The programId is imported from the program IDL.
export const HSW_PROGRAM_ID = new PublicKey(HswIDL.address)

// This is a helper function to get the dAnchor program.
export function getHswProgram(provider: AnchorProvider) {
  return new Program(HswIDL as Hsw, provider)
}