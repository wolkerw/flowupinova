
'use server';

// Este serviço foi desativado conforme solicitado.

export interface MetaConnectionData {
    isConnected: boolean;
    error?: string;
}

export async function getMetaConnection(userId: string): Promise<MetaConnectionData> {
    console.warn("A funcionalidade de conexão com a Meta foi desativada.");
    return { isConnected: false, error: "Funcionalidade desativada." };
}
