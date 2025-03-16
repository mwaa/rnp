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
import { getBlink } from "@/actions/blinks";

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
export const GET = async (req: Request, { params }: { params: Promise<{ signature: string }> }) => {

    const { signature } = await params;

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
                    href: `/api/actions/network/${signature}`,
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
export const POST = async (req: Request, { params }: { params: Promise<{ signature: string }> }) => {
    try {

        const { signature } = await params;

        const blinkData = await getBlink(signature)

        console.log("\nFULL /api/actions/network", signature, "\n");

        // Parse request body to get user's public key
        const request: ActionPostRequest = await req.json();
        const userPublicKey = new PublicKey(request.account);

        if (!blinkData) {
            throw new Error("Blink not found");
        }
       
        // Step 1: Prepare the transaction
        const transaction = await buildTransactionFromIDL(
            blinkData.idl_content,
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

enum AccountType {
    SIGNER = "signer",
    PDA = "pda",
    SYSTEM_PROGRAM = "systemProgram",
}

enum SeedType {
    CONST = "const",
    ADDRESS = "address",
    INPUT = "input",
}

interface MethodConfig {
    methodName: string;       // Method name as in IDL
    accounts: AccountConfig[]; // Account configurations
}

interface AccountConfig {
    name: string;             // Account name
    type: AccountType;        // Regular, PDA, System Program, etc.
    pdaSeeds?: SeedConfig[];  // If PDA, the seed generation rules
}

interface SeedConfig {
    type: SeedType;           // "const", "address", "input", etc.
    value: string | Buffer;   // Value or reference to value source
}

// Helper function to determine account type from IDL account definition
function determineAccountType(account: any): AccountType {
    if (account.signer) {
        return AccountType.SIGNER;
    } else if (account.pda) {
        return AccountType.PDA;
    } else if (account.name === 'system_program' || 
               account.address === '11111111111111111111111111111111') {
        return AccountType.SYSTEM_PROGRAM;
    }
    // Add other account type determinations as needed
    return AccountType.SIGNER; // Default fallback
}

const fetchMethodConfig = async (idl: any, method_name: string): Promise<MethodConfig> => {
    try {
        console.log("Parsing IDL...", idl);
        // Find the instruction that matches the method name
        const instruction = idl.instructions.find((instr: any) => instr.name === method_name);
        
        if (!instruction) {
            throw new Error(`Method '${method_name}' not found in IDL`);
        }
        
        // Map the accounts from IDL format to our MethodConfig format
        const accounts = instruction.accounts.map((account: any) => {
            // Base account configuration
            const accountConfig: AccountConfig = {
                // Convert snake_case to camelCase for account names
                name: account.name.replace(/_([a-z])/g, (g: string) => g[1].toUpperCase()),
                type: determineAccountType(account)
            };
            
            // Handle PDA accounts with seeds
            if (account.pda && account.pda.seeds) {
                accountConfig.pdaSeeds = account.pda.seeds.map((seed: any) => {
                    if (seed.kind === 'const') {
                        // For const seeds, create a Buffer from the value array
                        return {
                            type: SeedType.CONST,
                            value: Buffer.from(seed.value)
                        };
                    } else if (seed.kind === 'account') {
                        // For account seeds, map to the appropriate type
                        return {
                            type: SeedType.ADDRESS,
                            value: "signerPublicKey" // Assuming this is always the signer
                        };
                    }
                    // Add handling for other seed types if needed
                    return null;
                }).filter(Boolean) as SeedConfig[];
            }
            
            return accountConfig;
        });
        
        return {
            methodName: method_name,
            accounts
        };
    } catch (error) {
        console.error("Error parsing IDL:", error);
        throw error;
    }
};

async function buildTransactionFromIDL(
    idl_json: any,
    connection: Connection,
    signerPublicKey: PublicKey
): Promise<VersionedTransaction> {
    // 1. Fetch the configuration from database
    const config = await fetchMethodConfig(idl_json, "join_sonic_world");

    // 2. Initialize program
    const provider = new anchor.AnchorProvider(
        connection,
        { publicKey: signerPublicKey } as any,
        { commitment: "processed" }
    );
    const program = new anchor.Program(idl_json as any, provider);

    // 3. Prepare accounts object
    const accountsObj: Record<string, any> = {};

    for (const accountConfig of config.accounts) {
        if (accountConfig.type === "pda") {
            // Handle PDA derivation
            const seedBuffers = accountConfig.pdaSeeds?.map(seed => {
                if (seed.type === "const") {
                    return seed.value;
                } else if (seed.type === "address" && seed.value === "signerPublicKey") {
                    return signerPublicKey.toBuffer();
                }
                // Handle other seed types...
                return undefined;
            }).filter((buffer): buffer is Buffer => buffer !== undefined) || [];

            // Derive the PDA
            const [pdaAddress] = PublicKey.findProgramAddressSync(
                seedBuffers,
                program.programId
            );

            accountsObj[accountConfig.name] = pdaAddress;
        }
        else if (accountConfig.type === "systemProgram") {
            accountsObj[accountConfig.name] = SystemProgram.programId;
        }
        else if (accountConfig.type === "signer") {
            accountsObj[accountConfig.name] = signerPublicKey;
        }
        // Handle other account types...
    }

    // 4. Build the instruction
    const ix = await program.methods[camelCase(config.methodName)]()
        .accountsPartial(accountsObj)
        .instruction();

    // 5. Create the transaction
    const { blockhash } = await connection.getLatestBlockhash();
    const message = new TransactionMessage({
        payerKey: signerPublicKey,
        recentBlockhash: blockhash,
        instructions: [ix],
    }).compileToV0Message();

    return new VersionedTransaction(message);
}

// Helper to convert snake_case to camelCase for method names
function camelCase(str: string): string {
    return str.replace(/_([a-z])/g, (g) => g[1].toUpperCase());
}