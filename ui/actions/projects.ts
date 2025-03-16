'use server'

import { z } from 'zod';
import { neon } from "@neondatabase/serverless";
import { projectFormSchema } from "@/lib/types/form";

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  throw new Error("DATABASE_URL is required");
}

// iniatialize the database
const sql = neon(DATABASE_URL);

export type FormData = z.infer<typeof projectFormSchema>;

export async function saveProject(formData: FormData): Promise<boolean> {
  try {
    // Validate form data
    const validatedData = projectFormSchema.parse(formData);
    
    // Extract IDL file content
    let idlContent = null;
    let programId = null;
    if (validatedData.idlFile instanceof File) {
      const arrayBuffer = await formData.idlFile.arrayBuffer();
      const idlString = Buffer.from(arrayBuffer).toString('utf-8');
      try {
        // Validate that it's a proper JSON
        idlContent = JSON.parse(idlString);
        programId = idlContent.address;
      } catch (error) {
        return false;
      }
    }
    
    // Insert data into the database
    const query = `
      INSERT INTO projects (
        program_id, 
        project_name, 
        idl_content, 
        method_signatures, 
        method_settings
      ) VALUES ($1, $2, $3, $4, $5)
      RETURNING program_id
    `;
    
    const values = [
      programId,
      validatedData.projectName,
      idlContent,
      JSON.stringify(validatedData.methodSignatures),
      JSON.stringify(validatedData.methodSettings)
    ];
    
    await sql(query, values);

    return true;
  } catch (error) {
    console.error("Error registering project:", error);
    return false;
  }
}

export async function getProjects() {
  try {
    const query = `
      SELECT program_id, project_name, method_signatures FROM projects
    `;
    return await sql(query);
  } catch (error) {
    console.error("Error fetching projects:", error);
    return [];
  }
}