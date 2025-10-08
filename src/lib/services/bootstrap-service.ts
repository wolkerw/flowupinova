
'use server';

import { initializeApp, getApps, App, cert } from 'firebase-admin/app';
import { getFirestore, Firestore }d from 'firebase-admin/firestore';
import fs from 'fs/promises';
import path from 'path';

// Helper function to initialize Firebase Admin SDK.
// It ensures that we don't initialize the app more than once.
function getAdminApp(): App {
    if (getApps().length > 0) {
        return getApps()[0];
    }
    
    // This will automatically use the GOOGLE_APPLICATION_CREDENTIALS
    // environment variable in the Cloud Workstation environment.
    return initializeApp();
}

function getAdminFirestore(): Firestore {
    return getFirestore(getAdminApp());
}

/**
 * Reads the bootstrap.json file and populates the Firestore database.
 * This uses the Admin SDK, so it bypasses all security rules.
 */
export async function bootstrapDatabase() {
    console.log("Starting database bootstrap process...");
    const db = getAdminFirestore();
    
    // Path to the bootstrap.json file in the project root
    const filePath = path.join(process.cwd(), 'bootstrap.json');
    
    let data;
    try {
        const fileContent = await fs.readFile(filePath, 'utf-8');
        data = JSON.parse(fileContent);
    } catch (error) {
        console.error("Failed to read or parse bootstrap.json:", error);
        throw new Error("Could not read or parse bootstrap.json file.");
    }

    if (!data || !data.__collections__) {
        throw new Error("Invalid bootstrap.json format. Missing '__collections__'.");
    }

    const collections = data.__collections__;
    const batch = db.batch();

    for (const collectionName in collections) {
        const collectionData = collections[collectionName];
        for (const docId in collectionData) {
            const docData = collectionData[docId];
            const docRef = db.collection(collectionName).doc(docId);
            
            const { __collections__, ...fields } = docData;
            
            // Set the fields of the main document
            // Even if there are no fields, we set an empty object to create the document
            batch.set(docRef, fields || {});

            // Handle sub-collections recursively (though we only go one level deep here)
            if (__collections__) {
                for (const subCollectionName in __collections__) {
                    const subCollectionData = __collections__[subCollectionName];
                    for (const subDocId in subCollectionData) {
                        const subDocData = subCollectionData[subDocId];
                        const subDocRef = docRef.collection(subCollectionName).doc(subDocId);
                        const { __collections__: subSubCollections, ...subDocFields } = subDocData;
                        
                        batch.set(subDocRef, subDocFields);

                        // If you needed deeper nesting, you would continue the recursion here.
                        // For our current structure, this is sufficient.
                    }
                }
            }
        }
    }

    try {
        await batch.commit();
        console.log("Database bootstrap successful. Batch commit complete.");
    } catch (error) {
        console.error("Error committing batch to Firestore:", error);
        throw new Error("Failed to write bootstrap data to Firestore.");
    }
}
