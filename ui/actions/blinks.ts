'use server'

import { neon } from "@neondatabase/serverless";
import { revalidatePath } from 'next/cache';

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  throw new Error("DATABASE_URL is required");
}

// iniatialize the database
const sql = neon(DATABASE_URL);

export type BlinkSubmission = {
    refCode: string;
    programId: string;
    methodSignature: string;
};

export async function createBlink(formData: BlinkSubmission): Promise<boolean> {
  try {
    // Insert data into the database
    const query = `
      INSERT INTO blinks (
        ref_code,
        program_id,
        method_signature
      ) VALUES ($1, $2, $3)
      RETURNING ref_code
    `;
    
    const values = [
      formData.refCode,
      formData.programId,
      formData.methodSignature,
    ];
    
    await sql(query, values);
    
    // Revalidate the blinks page to show the new blink
    revalidatePath('/blinks');
    
    return true;
  } catch (error) {
    console.error("Error creating blink:", error);
    return false;
  }
}

export async function getBlinks() {

    try {
        const query = `
            SELECT b.program_id, b.method_signature, p.idl_content, p.method_settings
            FROM blinks AS b
            INNER JOIN projects AS p ON b.program_id = p.program_id
        `;
        
        return await sql(query);
    } catch (error) {
        console.error("Error getting blinks:", error);
        return [];
    }
}

export async function getBlink(refCode: string) {
    try {
        const query = `
            SELECT b.program_id, b.method_signature, p.idl_content, p.method_settings
            FROM blinks AS b
            INNER JOIN projects AS p ON b.program_id = p.program_id
            WHERE b.ref_code = $1
        `;
        
        const records = await sql(query, [refCode]);
        return records[0];
    } catch (error) {
        console.error("Error getting blink:", error);
        return null;
    }
}