import {
    ActionGetResponse,
    ActionPostRequest,
    ActionPostResponse,
    ActionError,
    ACTIONS_CORS_HEADERS,
    BLOCKCHAIN_IDS,
} from "@solana/actions";

import {
    Connection,
    PublicKey,
    SystemProgram,
    TransactionMessage,
    VersionedTransaction,
} from "@solana/web3.js";

import * as anchor from "@coral-xyz/anchor";
import { getHswProgram } from "@/project/anchor"; // Adjust path if necessary

// CAIP-2 format for Solana
// const blockchain = BLOCKCHAIN_IDS.devnet;

const RPC_ENDPOINT = process.env.NEXT_PUBLIC_RPC_ENDPOINT;

if (!RPC_ENDPOINT) {
    throw new Error("RPC_ENDPOINT is required");
}

// Create a connection to the Solana blockchain
const connection = new Connection(String(RPC_ENDPOINT));

// Create headers with CAIP blockchain ID
const headers = {
    ...ACTIONS_CORS_HEADERS,
    // "x-blockchain-ids": blockchain,
    // "x-action-version": "2.4",
};

// OPTIONS endpoint is required for CORS preflight requests
export const OPTIONS = async () => {
    return new Response(null, { headers });
};

// GET endpoint returns the Blink metadata (JSON) and UI configuration
export const GET = async (req: Request) => {
    // This JSON is used to render the Blink UI
    const response: ActionGetResponse = {
        type: "action",
        icon: `${new URL("/sonic-world.jpg", req.url).toString()}`,
        label: "Join Sonic World",
        title: "Join Sonic World",
        description:
            "Initialize a greeting account on the Sonic World program. This will create your personal counter on the Solana blockchain.",
        links: {
            actions: [
                {
                    type: "transaction",
                    label: "Join Now",
                    href: `/api/actions/network`,
                }
            ],
        },
    };

    // Return the response with proper headers
    return new Response(JSON.stringify(response), {
        status: 200,
        headers,
    });
};

// POST endpoint handles the actual transaction creation
export const POST = async (req: Request) => {
    try {
        // Parse request body to get user's public key
        const request: ActionPostRequest = await req.json();
        const userPublicKey = new PublicKey(request.account);

        // Step 1: Prepare the transaction
        const transaction = await prepareJoinSonicWorldTransaction(
            connection,
            userPublicKey
        );

        // Step 2: Create a response with the serialized transaction
        const response: ActionPostResponse = {
            type: "transaction",
            transaction: Buffer.from(transaction.serialize()).toString("base64"),
        };

        // Return the response with proper headers
        return Response.json(response, { status: 200, headers });
    } catch (error) {
        // Log and return an error response
        console.error("Error processing request:", error);

        // Error message
        const message =
            error instanceof Error ? error.message : "Internal server error";

        // Wrap message in an ActionError object so it can be shown in the Blink UI
        const errorResponse: ActionError = {
            message,
        };

        return new Response(JSON.stringify(errorResponse), {
            status: 500,
            headers,
        });
    }
};

const prepareJoinSonicWorldTransaction = async (
    connection: Connection,
    userPublicKey: PublicKey
) => {
    try {
        // Configure anchor provider
        const provider = new anchor.AnchorProvider(
            connection,
            { publicKey: userPublicKey } as any,
            { commitment: "processed" }
        );

        // Create a program instance
        const program = getHswProgram(provider);

        // Derive PDA for the greeting account
        const [greetingAccount] = PublicKey.findProgramAddressSync(
            [Buffer.from("greeting"), userPublicKey.toBuffer()],
            program.programId
        );

        // Build transaction for join_sonic_world instruction
        const ix = await program.methods
            .joinSonicWorld()
            .accountsPartial({
                greetingAccount,
                user: userPublicKey,
                systemProgram: SystemProgram.programId,
            })
            .instruction();

        // Get the latest blockhash
        const { blockhash } = await connection.getLatestBlockhash();

        // Create a transaction message
        const message = new TransactionMessage({
            payerKey: userPublicKey,
            recentBlockhash: blockhash,
            instructions: [ix],
        }).compileToV0Message();

        // Create and return a versioned transaction
        return new VersionedTransaction(message);
    } catch (error) {
        console.error("Error creating join_sonic_world transaction:", error);
        throw error;
    }
};