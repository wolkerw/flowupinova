
'use server';

import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";

export interface MetaConnectionData {
    userAccessToken?: string;
    pageToken?: string;
    facebookPageId?: string;
    facebookPageName?: string;
    instagramAccountId?: string;
    instagramAccountName?: string;
    followersCount?: number;
    igFollowersCount?: number;
    profilePictureUrl?: string;
    igProfilePictureUrl?: string;
    isConnected: boolean;
}

const defaultMeta: MetaConnectionData = {
    isConnected: false,
};

// As funções foram esvaziadas e retornarão um estado padrão "não conectado".

export async function fetchGraphAPI(url: string, accessToken: string, step: string, method: 'GET' | 'POST' = 'GET', body: URLSearchParams | FormData | null = null) {
    console.warn("A funcionalidade da API da Meta foi desativada. fetchGraphAPI não executará a chamada.");
    // Retorna uma resposta vazia para evitar quebras em chamadas existentes.
    return Promise.resolve({});
}

export async function getMetaConnection(): Promise<MetaConnectionData> {
    console.warn("A funcionalidade da API da Meta foi desativada. getMetaConnection retornará o estado padrão.");
    return defaultMeta;
}

export async function updateMetaConnection(data: Partial<MetaConnectionData>): Promise<void> {
    console.warn("A funcionalidade da API da Meta foi desativada. updateMetaConnection não salvará os dados.");
    return Promise.resolve();
}
