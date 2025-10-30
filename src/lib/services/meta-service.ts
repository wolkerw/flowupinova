
"use server"; // Alterado de "use client" para funcionar no servidor também

import { doc, getDoc, setDoc, serverTimestamp, deleteField } from "firebase/firestore";
// Como este arquivo agora pode rodar no servidor, precisamos de uma maneira de obter a instância do DB correta.
// No entanto, as chamadas para este serviço vêm de rotas de API que usam o admin SDK,
// e de componentes do cliente que usam o client SDK.
// Para manter a simplicidade, vamos assumir que a instância `db` do client SDK é segura para ser usada aqui,
// já que as regras de segurança do Firestore ainda se aplicam. 
// A alternativa seria passar a instância do DB como parâmetro, o que seria mais complexo.
import { adminDb } from "@/lib/firebase-admin";

export interface MetaConnectionData {
    isConnected: boolean;
    error?: string;
    connectedAt?: Date;
    accessToken?: string;
    pageId?: string;
    pageName?: string;
    instagramId?: string;
    instagramUsername?: string;
}

function getMetaConnectionDocRef(userId: string) {
    // Usando o adminDb para garantir que funcione no lado do servidor
    return adminDb.doc(`users/${userId}/connections/meta`);
}

/**
 * Retrieves the Meta connection status for a specific user.
 * @param userId The UID of the user.
 * @returns The connection data.
 */
export async function getMetaConnection(userId: string): Promise<MetaConnectionData> {
    if (!userId) {
        console.error("getMetaConnection called without userId.");
        return { isConnected: false, error: "User ID not provided." };
    }
    try {
        const docRef = getMetaConnectionDocRef(userId);
        const docSnap = await docRef.get();

        if (docSnap.exists) {
            const data = docSnap.data();
            if (!data) return { isConnected: false };

            const connectedAtTimestamp = data?.connectedAt;
            return {
                isConnected: data.isConnected || false,
                connectedAt: connectedAtTimestamp ? connectedAtTimestamp.toDate() : undefined,
                accessToken: data.accessToken,
                pageId: data.pageId,
                pageName: data.pageName,
                instagramId: data.instagramId,
                instagramUsername: data.instagramUsername,
            };
        } else {
            return { isConnected: false };
        }
    } catch (error: any) {
        console.error(`Error getting Meta connection for user ${userId}:`, error);
        return { isConnected: false, error: error.message };
    }
}


/**
 * Updates the Meta connection status for a user. Can be called from the client.
 * @param userId The UID of the user.
 * @param connectionData The data to set for the connection.
 */
export async function updateMetaConnection(userId: string, connectionData: Partial<MetaConnectionData>): Promise<void> {
    if (!userId) {
        throw new Error("User ID is required to update Meta connection.");
    }

    try {
        const docRef = getMetaConnectionDocRef(userId);
        
        let dataToSet: { [key: string]: any } = connectionData;

        // If connecting, add the serverTimestamp
        if (connectionData.isConnected) {
            dataToSet.connectedAt = serverTimestamp();
        } else {
            // If disconnecting, explicitly set isConnected to false and remove other fields
            dataToSet = {
                isConnected: false,
                accessToken: deleteField(),
                pageId: deleteField(),
                pageName: deleteField(),
instagramId: deleteField(),
                instagramUsername: deleteField(),
                connectedAt: deleteField(),
                error: deleteField()
            };
        }

        await docRef.set(dataToSet, { merge: true });
        console.log(`Meta connection status updated for user ${userId}.`);
    } catch (error) {
        console.error(`Error updating Meta connection for user ${userId}:`, error);
        // This will be caught by the calling function (e.g., in the page with a toast)
        throw new Error(`Failed to update Meta connection status in database. Reason: ${error instanceof Error ? error.message : String(error)}`);
    }
}
