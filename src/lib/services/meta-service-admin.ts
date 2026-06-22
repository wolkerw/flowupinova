"use server";

import { admin } from "@/lib/firebase-admin";

export interface MetaConnectionAdminData {
  isConnected: boolean;
  error?: string;
  connectedAt?: any;
  accessToken?: string;
  pageId?: string;
  pageName?: string;
  adAccountId?: string;
  adAccountName?: string;
  businessId?: string;
}

/**
 * Updates the Meta connection status for a user using the Admin SDK.
 * This is a server-side only function.
 * @param userId The UID of the user.
 * @param connectionData The partial data to update the connection with.
 */
export async function updateMetaConnectionAdmin(
  userId: string,
  connectionData: Partial<MetaConnectionAdminData>
): Promise<void> {
  if (!userId) {
    throw new Error("User ID is required to update Meta connection.");
  }

  try {
    const docRef = admin
      .firestore()
      .collection("users")
      .doc(userId)
      .collection("connections")
      .doc("meta");

    let dataToSet: { [key: string]: any } = connectionData;

    // If we are connecting, add a server timestamp.
    if (connectionData.isConnected) {
      dataToSet.connectedAt = admin.firestore.FieldValue.serverTimestamp();
    }

    // Use set with merge to create or update the document.
    await docRef.set(dataToSet, { merge: true });

    console.log(`Admin SDK: Meta connection status updated for user ${userId}.`);
  } catch (error: any) {
    console.error(`Admin SDK Error: updating Meta connection for user ${userId}:`, error);
    throw new Error(`Failed to update Meta connection status via admin. Reason: ${error.message}`);
  }
}

/**
 * Retrieves the Meta connection status for a user using the Admin SDK.
 * This is server-side only.
 * @param userId The UID of the user.
 * @returns The connection data.
 */
export async function getMetaConnectionAdmin(userId: string): Promise<
  Partial<MetaConnectionAdminData> & {
    isConnected: boolean;
    userAccessToken?: string;
    pending?: boolean;
  }
> {
  if (!userId) {
    throw new Error("User ID is required to get Meta connection.");
  }

  try {
    const docSnap = await admin
      .firestore()
      .collection("users")
      .doc(userId)
      .collection("connections")
      .doc("meta")
      .get();

    if (docSnap.exists) {
      const data = docSnap.data() as any;
      return { ...data, isConnected: !!data.isConnected };
    }
    return { isConnected: false };
  } catch (error: any) {
    console.error(`Admin SDK Error: getting Meta connection for user ${userId}:`, error);
    return { isConnected: false, error: error.message };
  }
}

/**
 * Retrieves the Meta Ads (paid ads) connection status for a user using the Admin SDK.
 * This is server-side only.
 * @param userId The UID of the user.
 */
export async function getMetaAdsConnectionAdmin(userId: string): Promise<
  Partial<MetaConnectionAdminData> & {
    isConnected: boolean;
    userAccessToken?: string;
    pending?: boolean;
    adAccountId?: string;
    adAccountName?: string;
  }
> {
  if (!userId) {
    throw new Error("User ID is required to get Meta Ads connection.");
  }

  try {
    const docSnap = await admin
      .firestore()
      .collection("users")
      .doc(userId)
      .collection("connections")
      .doc("meta_ads")
      .get();

    if (docSnap.exists) {
      const data = docSnap.data() as any;
      return { ...data, isConnected: !!data.isConnected };
    }
    return { isConnected: false };
  } catch (error: any) {
    console.error(`Admin SDK Error: getting Meta Ads connection for user ${userId}:`, error);
    return { isConnected: false, error: error.message };
  }
}

/**
 * Updates the Meta Ads connection status using the Admin SDK.
 * @param userId The UID of the user.
 * @param connectionData The partial connection data.
 */
export async function updateMetaAdsConnectionAdmin(
  userId: string,
  connectionData: Partial<
    MetaConnectionAdminData & {
      userAccessToken?: string;
      pending?: boolean;
      adAccountId?: string;
      adAccountName?: string;
    }
  >
): Promise<void> {
  if (!userId) {
    throw new Error("User ID is required to update Meta Ads connection.");
  }

  try {
    const docRef = admin
      .firestore()
      .collection("users")
      .doc(userId)
      .collection("connections")
      .doc("meta_ads");

    let dataToSet: { [key: string]: any } = connectionData;

    if (connectionData.isConnected) {
      dataToSet.connectedAt = admin.firestore.FieldValue.serverTimestamp();
      dataToSet.pending = false;
    }

    await docRef.set(dataToSet, { merge: true });
    console.log(`Admin SDK: Meta Ads connection updated for user ${userId}.`);
  } catch (error: any) {
    console.error(`Admin SDK Error: updating Meta Ads connection for user ${userId}:`, error);
    throw new Error(`Failed to update Meta Ads connection status. Reason: ${error.message}`);
  }
}
