import { adminDb } from '@/lib/firebase-admin';
import { BusinessProfileData } from './business-profile-service';

const defaultProfile: BusinessProfileData = {
    name: "Minha Empresa",
    category: "Consultoria de Marketing",
    address: "Seu Endereço",
    phone: "(00) 00000-0000",
    website: "www.suaempresa.com.br",
    description: "Descreva sua empresa aqui.",
    rating: 0,
    totalReviews: 0,
    isVerified: false
};

const defaultUsers = [
    // Adicione usuários padrão se necessário, por exemplo:
    // { uid: 'some-test-user-uid', email: 'test@example.com', displayName: 'Test User' }
];

export async function bootstrapDatabase() {
    console.log("Starting database bootstrap...");

    for (const user of defaultUsers) {
        try {
            // Criar perfil de negócio padrão
            const profileRef = adminDb.doc(`users/${user.uid}/business/profile`);
            const profileSnap = await profileRef.get();
            if (!profileSnap.exists) {
                await profileRef.set(defaultProfile);
                console.log(`Created default business profile for user ${user.uid}`);
            }

            // Criar conexão meta padrão
            const metaRef = adminDb.doc(`users/${user.uid}/connections/meta`);
            const metaSnap = await metaRef.get();
            if (!metaSnap.exists) {
                await metaRef.set({ isConnected: false });
                console.log(`Created default meta connection for user ${user.uid}`);
            }

            // Adicione outras coleções ou documentos padrão aqui
            
        } catch (error) {
            console.error(`Failed to bootstrap data for user ${user.uid}:`, error);
        }
    }

    console.log("Database bootstrap finished.");
}
