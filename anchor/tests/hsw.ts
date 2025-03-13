import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Hsw } from "../target/types/hsw";
import { assert, expect } from "chai";

import {
    Keypair,
    PublicKey,
    SystemProgram,
  } from "@solana/web3.js";

describe("hsw", () => {
    // Configure the client to use the local cluster
    const provider = anchor.AnchorProvider.env();
    anchor.setProvider(provider);

    const program = anchor.workspace.Hsw as Program<Hsw>;
    const user = Keypair.generate();

    // Derive the PDA for the greeting account
    const [greetingAccount, _] = anchor.web3.PublicKey.findProgramAddressSync(
        [Buffer.from("greeting"), user.publicKey.toBuffer()],
        program.programId
    );

    const requestAirdrop = async (publicKey: PublicKey) => {
        const signature = await provider.connection.requestAirdrop(publicKey, 3e9);
        const latestBlockHash = await provider.connection.getLatestBlockhash();
        await provider.connection.confirmTransaction({
          blockhash: latestBlockHash.blockhash,
          lastValidBlockHeight: latestBlockHash.lastValidBlockHeight,
          signature,
        });
    };

    before(async () => {
        await requestAirdrop(user.publicKey);
    });

    it("Creates a greeting account", async () => {
        // Execute the transaction
        await program.methods
            .joinSonicWorld()
            .accountsPartial({
                greetingAccount,
                user: user.publicKey,
                systemProgram: SystemProgram.programId,
            })
            .signers([user])
            .rpc();

        // Fetch the created account
        const account = await program.account.greetingAccount.fetch(greetingAccount);
        
        // Verify the account data
        expect(account.counter).to.equal(0);
        expect(account.user.toBase58()).to.equal(user.publicKey.toBase58());
    });

    it("Increments the greeting counter", async () => {

        console.log("\nThis is our user", user.publicKey.toBase58());
        console.log("\nThis is our greeting account", greetingAccount.toBase58());

        // Execute the transaction to increment the counter
        await program.methods
            .sendAMessage()
            .accountsPartial({
                greetingAccount,
                user: user.publicKey,
            })
            .signers([user])
            .rpc();

        // Fetch the updated account
        let account = await program.account.greetingAccount.fetch(greetingAccount);
        
        // Verify the counter was incremented
        expect(account.counter).to.equal(1);
        
        // Increment again to ensure multiple increments work
        await program.methods
            .sendAMessage()
            .accountsPartial({
                greetingAccount,
                user: user.publicKey,
            })
            .signers([user])
            .rpc();
            
        account = await program.account.greetingAccount.fetch(greetingAccount);
        expect(account.counter).to.equal(2);
    });
    
    it("Fails when wrong signer attempts to increment", async () => {
        // Create a new keypair to simulate another user
        const otherUser = Keypair.generate();
        await requestAirdrop(otherUser.publicKey);

        // Derive the PDA for the original user's greeting account
        const [greetingAccount, _] = PublicKey.findProgramAddressSync(
            [Buffer.from("greeting"), user.publicKey.toBuffer()],
            program.programId
        );
        
        try {
            // Try to increment with the wrong signer
            await program.methods
                .sendAMessage()
                .accounts({
                    greetingAccount,
                    user: otherUser.publicKey,
                })
                .signers([otherUser])
                .rpc();
            
            // Should not reach here
            assert.fail("Expected the transaction to fail");
        } catch (err) {
            // Expected to fail
            expect(err).to.be.instanceOf(Error);
        }
    });
});
