
import { initializeApp, getApps, App, cert } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';

function getAdminApp(): App {
    if (getApps().length > 0) {
        return getApps()[0];
    }
    
    // Esta variável de ambiente é definida automaticamente no ambiente do Cloud Workstation
    // e contém as credenciais de serviço necessárias.
    const serviceAccount = process.env.GOOGLE_APPLICATION_CREDENTIALS 
        ? JSON.parse(Buffer.from(process.env.GOOGLE_APPLICATION_CREDENTIALS, 'base64').toString('utf-8'))
        : undefined;

    if (!serviceAccount) {
        throw new Error("GOOGLE_APPLICATION_CREDENTIALS not found or is invalid.");
    }

    return initializeApp({
        credential: cert(serviceAccount)
    });
}

export function getAdminFirestore(): Firestore {
    return getFirestore(getAdminApp());
}
